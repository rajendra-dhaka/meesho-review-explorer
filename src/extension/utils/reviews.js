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
    if (filters.problemOnly && Number(review.rating || 0) > 2) return false;
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

export function buildProducts(reviews) {
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
        lowRated: 0,
        ratings: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      });
    }

    const product = productMap.get(id);
    const rating = Math.max(1, Math.min(5, Math.round(Number(review.rating || 0)) || 1));
    product.total += 1;
    product.ratingSum += Number(review.rating || 0);
    if (rating <= 2) product.lowRated += 1;
    product.ratings[rating] += 1;
  }

  return [...productMap.values()]
    .map((product) => ({
      ...product,
      averageRating: product.total ? product.ratingSum / product.total : 0,
      negativePercent: product.total ? Math.round((product.lowRated / product.total) * 100) : 0,
      riskScore: product.total
        ? Math.min(100, Math.round((product.lowRated / product.total) * 70 + (5 - product.ratingSum / product.total) * 8))
        : 0,
    }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}

export function buildTopProducts(reviews) {
  return buildProducts(reviews).slice(0, 5);
}

const PROBLEM_KEYWORDS = [
  "broken",
  "damage",
  "damaged",
  "slow",
  "not working",
  "poor",
  "bad",
  "quality",
  "return",
  "refund",
  "missing",
  "wrong",
  "defective",
  "charge",
  "charging",
  "leak",
  "scratch",
  "fake",
  "small",
  "large",
  "delivery",
  "late",
];

export function classifyReview(review) {
  const rating = Number(review.rating || 0);
  const text = String(review.comments || "").toLowerCase();

  if (rating >= 4) return "Positive";
  if (/deliver|late|courier/.test(text)) return "Delivery issue";
  if (/broken|damage|defective|scratch|leak/.test(text)) return "Damaged/Broken";
  if (/quality|poor|bad|fake/.test(text)) return "Quality issue";
  if (/size|small|large|fit/.test(text)) return "Size/Fit issue";
  if (/not working|charge|charging|slow/.test(text)) return "Not working";
  if (rating <= 2) return "Problem";
  return "Neutral";
}

export function buildProblemInsights(reviews) {
  const lowRated = reviews.filter((review) => Number(review.rating || 0) <= 2);
  const phraseCounts = new Map();
  const categoryCounts = new Map();

  for (const review of lowRated) {
    const text = String(review.comments || "").toLowerCase();
    const category = classifyReview(review);
    categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);

    for (const keyword of PROBLEM_KEYWORDS) {
      if (text.includes(keyword)) {
        phraseCounts.set(keyword, (phraseCounts.get(keyword) || 0) + 1);
      }
    }
  }

  return {
    lowRated,
    keywords: [...phraseCounts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12),
    categories: [...categoryCounts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count),
  };
}

export function buildDateComparison(reviews) {
  const dated = reviews
    .map((review) => ({ review, time: getReviewDate(review)?.getTime() }))
    .filter((item) => Number.isFinite(item.time))
    .sort((a, b) => b.time - a.time);

  if (!dated.length) return null;

  const latest = new Date(dated[0].time);
  const currentStart = new Date(latest);
  currentStart.setDate(currentStart.getDate() - 6);
  currentStart.setHours(0, 0, 0, 0);

  const previousStart = new Date(currentStart);
  previousStart.setDate(previousStart.getDate() - 7);
  const previousEnd = new Date(currentStart);
  previousEnd.setMilliseconds(-1);

  const current = dated.filter((item) => item.time >= currentStart.getTime()).map((item) => item.review);
  const previous = dated
    .filter((item) => item.time >= previousStart.getTime() && item.time <= previousEnd.getTime())
    .map((item) => item.review);

  const summarize = (items) => {
    const count = items.length;
    const avg = count ? items.reduce((sum, review) => sum + Number(review.rating || 0), 0) / count : 0;
    const bad = items.filter((review) => Number(review.rating || 0) <= 2).length;
    return { count, avg, bad };
  };

  const currentSummary = summarize(current);
  const previousSummary = summarize(previous);

  return {
    current: currentSummary,
    previous: previousSummary,
    deltas: {
      count: currentSummary.count - previousSummary.count,
      avg: currentSummary.avg - previousSummary.avg,
      bad: currentSummary.bad - previousSummary.bad,
    },
  };
}

export function getDatePresetRange(preset) {
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);

  if (preset === "today") {
    // keep today
  } else if (preset === "7d") {
    start.setDate(start.getDate() - 6);
  } else if (preset === "30d") {
    start.setDate(start.getDate() - 29);
  } else if (preset === "month") {
    start.setDate(1);
  } else {
    return { from: "", to: "" };
  }

  const toInput = (date) => {
    const copy = new Date(date);
    copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
    return copy.toISOString().slice(0, 10);
  };

  return { from: toInput(start), to: toInput(end) };
}

export function toCsv(reviews) {
  const headers = [
    "date",
    "rating",
    "product_id",
    "product_name",
    "reviewer",
    "comment",
    "image_count",
    "helpful_count",
    "sentiment",
  ];

  const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const rows = reviews.map((review) => [
    formatReviewDate(review),
    review.rating,
    review.product_id,
    review.product_name,
    review.reviewer_name || review.author?.name || "Meesho User",
    review.comments || "",
    getImages(review).length,
    review.helpful_count || 0,
    classifyReview(review),
  ]);

  return [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");
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
