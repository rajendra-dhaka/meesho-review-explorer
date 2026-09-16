(function hookMeeshoReviewSummary() {
  if (window.__meeshoReviewExplorerHooked) return;
  window.__meeshoReviewExplorerHooked = true;

  function captureSupplierId(body) {
    try {
      if (typeof body !== "string") return;
      if (!body.includes("supplier_id")) return;
      const payload = JSON.parse(body);
      if (payload?.supplier_id) {
        postSupplierId(payload.supplier_id, "review_summary_payload", "supplier_id");
      }
    } catch {
      // Ignore non-JSON bodies.
    }
  }

  function postSupplierId(supplierId, supplierSource, supplierPath) {
    window.postMessage(
      {
        source: "meesho-review-explorer",
        type: "supplier-id",
        supplierId,
        supplierSource,
        supplierPath,
      },
      "*"
    );
  }

  function findMaskedSupplierId(value) {
    const seen = new WeakSet();
    const candidates = [];

    function walk(node, path) {
      if (!node || typeof node !== "object") return;
      if (seen.has(node)) return;
      seen.add(node);

      for (const [key, child] of Object.entries(node)) {
        const nextPath = path ? `${path}.${key}` : key;
        const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
        const scalar = typeof child === "string" || typeof child === "number";
        const text = String(child || "");
        const maskedShape = /^[a-z0-9]{4,16}$/i.test(text) && /[a-z]/i.test(text);

        if (scalar && maskedShape) {
          if (normalizedKey.includes("mask") && normalizedKey.includes("id")) {
            candidates.unshift({ value: text, path: nextPath });
          } else if (normalizedKey === "supplierid" || normalizedKey === "suppliermaskedid") {
            candidates.push({ value: text, path: nextPath });
          }
        }

        walk(child, nextPath);
      }
    }

    walk(value, "");
    return candidates[0] || null;
  }

  const originalFetch = window.fetch;

  window.fetch = async function patchedFetch(input, init) {
    try {
      const url = typeof input === "string" ? input : input?.url || "";
      if (url.includes("/api/v1/meri-shop/review_summary")) {
        captureSupplierId(init?.body);
      }
    } catch {
      // Keep the site fetch untouched if parsing fails.
    }

    const response = await originalFetch.apply(this, arguments);

    try {
      const url = typeof input === "string" ? input : input?.url || "";
      if (url.includes("/api/v1/meri-shop/profile")) {
        response
          .clone()
          .json()
          .then((json) => {
            const found = findMaskedSupplierId(json);
            if (found?.value) {
              postSupplierId(found.value, "profile_response", found.path);
            }
          })
          .catch(() => {});
      }
    } catch {
      // Do not interfere with the page response.
    }

    return response;
  };

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function patchedOpen(method, url) {
    this.__mreUrl = String(url || "");
    return originalOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function patchedSend(body) {
    if (this.__mreUrl?.includes("/api/v1/meri-shop/review_summary")) {
      captureSupplierId(body);
    }
    return originalSend.apply(this, arguments);
  };
})();
