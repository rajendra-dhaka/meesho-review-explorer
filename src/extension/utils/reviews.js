export function findMaskedSupplierId(value) {
  const seen = new WeakSet();
  const candidates = [];

  function walk(node, path = "") {
    if (!node || typeof node !== "object" || seen.has(node)) return;
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

  walk(value);
  return candidates[0] || null;
}

export function findReviews(response) {
  const paths = [
    response?.data?.reviews,
    response?.data?.ratings,
    response?.data?.review_list,
    response?.data?.review_data,
    response?.reviews,
    response?.review_list,
  ];

  for (const value of paths) {
    if (Array.isArray(value)) return value;
  }

  if (response?.data && typeof response.data === "object") {
    return Object.values(response.data).find(Array.isArray) || [];
  }

  return [];
}

export function getNextCursor(response) {
  return response?.cursor || response?.data?.cursor || response?.next_cursor || response?.data?.next_cursor || "";
}

export function getImages(review) {
  if (Array.isArray(review.images) && review.images.length) return review.images;
  if (Array.isArray(review.media)) return review.media.filter((item) => item.type !== "video");
  return [];
}

export function getReviewDate(review) {
  const raw = review.created_iso || review.created;
  if (!raw) return null;
  const date = new Date(raw);
  if (!Number.isNaN(date.getTime())) return date;
  const fallback = new Date(String(raw).replace(" ", "T"));
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

export function getDateKey(review) {
  return getReviewDate(review)?.toISOString().slice(0, 10) || "Unknown date";
}

export function formatReviewDate(review) {
  const date = getReviewDate(review);
  if (!date) return review.created || "Unknown date";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function getReviewDateRange(reviews) {
  const times = reviews
    .map((review) => getReviewDate(review)?.getTime())
    .filter((time) => Number.isFinite(time))
    .sort((a, b) => a - b);

  if (!times.length) return { from: null, to: null, label: "No dated reviews" };

  const from = new Date(times[0]);
  const to = new Date(times[times.length - 1]);
  const formatter = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const fromLabel = formatter.format(from);
  const toLabel = formatter.format(to);

  return {
    from,
    to,
    label: fromLabel === toLabel ? fromLabel : `${fromLabel} to ${toLabel}`,
  };
}

export function filterReviews(reviews, filters) {
  const query = filters.query.trim().toLowerCase();
  const from = filters.from ? new Date(`${filters.from}T00:00:00`) : null;
  const to = filters.to ? new Date(`${filters.to}T23:59:59`) : null;

  const filtered = reviews.filter((review) => {
    const date = getReviewDate(review);
    const haystack = [
      review.comments,
      review.product_name,
      review.product_description,
      review.reviewer_name,
      review.author?.name,
      review.product_id,
      review.review_id,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (query && !haystack.includes(query)) return false;
    if (filters.product !== "all" && String(review.product_id || "unknown") !== filters.product) return false;
    if (filters.rating !== "all" && Number(review.rating) !== Number(filters.rating)) return false;
    if (filters.mediaOnly && !getImages(review).length) return false;
    if (from && date && date < from) return false;
    if (to && date && date > to) return false;
    return true;
  });

  return sortReviews(filtered, filters.sort);
}

export function sortReviews(reviews, sortBy) {
  return [...reviews].sort((a, b) => {
    const ad = getReviewDate(a)?.getTime() || 0;
    const bd = getReviewDate(b)?.getTime() || 0;
    if (sortBy === "oldest") return ad - bd;
    if (sortBy === "rating-high") return Number(b.rating || 0) - Number(a.rating || 0);
    if (sortBy === "rating-low") return Number(a.rating || 0) - Number(b.rating || 0);
    if (sortBy === "helpful") return Number(b.helpful_count || 0) - Number(a.helpful_count || 0);
    if (sortBy === "product") return String(a.product_name || "").localeCompare(String(b.product_name || ""));
    return bd - ad;
  });
}

export function groupReviewsByDate(reviews) {
  const groups = new Map();
  for (const review of reviews) {
    const key = getDateKey(review);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(review);
  }
  return [...groups.entries()].sort((a, b) => b[0].localeCompare(a[0]));
}

export function buildProductOptions(reviews) {
  const products = new Map();
  for (const review of reviews) {
    products.set(String(review.product_id || "unknown"), review.product_name || "Unknown product");
  }
  return [...products.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function buildTopProducts(reviews) {
  const productMap = new Map();

  for (const review of reviews) {
    const id = String(review.product_id || "unknown");
    if (!productMap.has(id)) {
      productMap.set(id, {
        id,
        name: review.product_name || "Unknown product",
        image: review.product_image_thumb_url || review.product_image_large_url || "",
        total: 0,
        ratingSum: 0,
        ratings: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      });
    }

    const product = productMap.get(id);
    const rating = Math.max(1, Math.min(5, Math.round(Number(review.rating || 0)) || 1));
    product.total += 1;
    product.ratingSum += Number(review.rating || 0);
    product.ratings[rating] += 1;
  }

  return [...productMap.values()]
    .map((product) => ({
      ...product,
      averageRating: product.total ? product.ratingSum / product.total : 0,
    }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
    .slice(0, 5);
}

export function buildStats(reviews, filteredReviews) {
  const total = reviews.length;
  const avg = total ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / total : 0;
  return {
    total,
    matching: filteredReviews.length,
    average: avg.toFixed(2),
    products: new Set(reviews.map((review) => review.product_id)).size,
    withImages: reviews.filter((review) => getImages(review).length).length,
  };
}

export function shorten(text, length) {
  const value = String(text || "");
  return value.length > length ? `${value.slice(0, length)}...` : value;
}
