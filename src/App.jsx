import { useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  Clipboard,
  Download,
  Filter,
  Image,
  Search,
  Star,
  Trash2,
  Upload,
} from "lucide-react";

const STORAGE_KEY = "review-explorer-data-v1";

function parseInput(text) {
  const trimmed = text.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed);
    return normalizeParsed(parsed);
  } catch {
    // Allows pasting a JS array/object from DevTools, e.g. [{ review_id: 1 }]
    const parsed = Function(`"use strict"; return (${trimmed});`)();
    return normalizeParsed(parsed);
  }
}

function normalizeParsed(parsed) {
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed?.data)) return parsed.data;
  if (Array.isArray(parsed?.reviews)) return parsed.reviews;
  if (Array.isArray(parsed?.data?.reviews)) return parsed.data.reviews;
  if (Array.isArray(parsed?.data?.review_list)) return parsed.data.review_list;
  throw new Error("Could not find a reviews array in the pasted data.");
}

function safeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) return date;
  const normalized = String(value).replace(" ", "T");
  const fallback = new Date(normalized);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function dateKey(review) {
  const date = safeDate(review.created_iso || review.created);
  return date ? date.toISOString().slice(0, 10) : "Unknown date";
}

function formatDate(review) {
  const date = safeDate(review.created_iso || review.created);
  if (!date) return review.created || "Unknown date";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function compactProductName(name) {
  if (!name) return "Unknown product";
  return name.length > 92 ? `${name.slice(0, 92)}...` : name;
}

function getImages(review) {
  if (Array.isArray(review.images) && review.images.length) return review.images;
  if (Array.isArray(review.media)) return review.media.filter((item) => item.type !== "video");
  return [];
}

function exportJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function App() {
  const [rawInput, setRawInput] = useState("");
  const [reviews, setReviews] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [product, setProduct] = useState("all");
  const [rating, setRating] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [mediaOnly, setMediaOnly] = useState(false);
  const [groupByDate, setGroupByDate] = useState(true);

  const products = useMemo(() => {
    const map = new Map();
    for (const review of reviews) {
      const id = review.product_id || "unknown";
      const name = review.product_name || "Unknown product";
      map.set(String(id), { id: String(id), name });
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [reviews]);

  const stats = useMemo(() => {
    const total = reviews.length;
    const avg = total
      ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / total
      : 0;
    const withMedia = reviews.filter((review) => getImages(review).length > 0).length;
    return {
      total,
      avg: avg.toFixed(2),
      products: products.length,
      withMedia,
    };
  }, [products.length, reviews]);

  const filteredReviews = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();
    const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
    const to = toDate ? new Date(`${toDate}T23:59:59`) : null;

    const filtered = reviews.filter((review) => {
      const reviewDate = safeDate(review.created_iso || review.created);
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

      if (lowerQuery && !haystack.includes(lowerQuery)) return false;
      if (product !== "all" && String(review.product_id || "unknown") !== product) return false;
      if (rating !== "all" && Number(review.rating) !== Number(rating)) return false;
      if (mediaOnly && getImages(review).length === 0) return false;
      if (from && reviewDate && reviewDate < from) return false;
      if (to && reviewDate && reviewDate > to) return false;
      return true;
    });

    return filtered.sort((a, b) => {
      const dateA = safeDate(a.created_iso || a.created)?.getTime() || 0;
      const dateB = safeDate(b.created_iso || b.created)?.getTime() || 0;
      if (sortBy === "oldest") return dateA - dateB;
      if (sortBy === "rating-high") return Number(b.rating || 0) - Number(a.rating || 0);
      if (sortBy === "rating-low") return Number(a.rating || 0) - Number(b.rating || 0);
      if (sortBy === "helpful") return Number(b.helpful_count || 0) - Number(a.helpful_count || 0);
      if (sortBy === "product") {
        return String(a.product_name || "").localeCompare(String(b.product_name || ""));
      }
      return dateB - dateA;
    });
  }, [fromDate, mediaOnly, product, query, rating, reviews, sortBy, toDate]);

  const groupedReviews = useMemo(() => {
    const groups = new Map();
    for (const review of filteredReviews) {
      const key = dateKey(review);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(review);
    }
    return [...groups.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredReviews]);

  function loadReviews() {
    setError("");
    setNotice("");
    try {
      const parsed = parseInput(rawInput);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      setReviews(parsed);
      setNotice(`Loaded ${parsed.length} reviews.`);
    } catch (err) {
      setError(err.message || "Could not parse pasted data.");
    }
  }

  async function copyFiltered() {
    const text = JSON.stringify(filteredReviews, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setNotice(`Copied ${filteredReviews.length} filtered reviews.`);
    } catch {
      setError("Browser blocked clipboard. Use the Download JSON button instead.");
    }
  }

  function clearData() {
    localStorage.removeItem(STORAGE_KEY);
    setReviews([]);
    setRawInput("");
    setNotice("Cleared saved reviews.");
  }

  const sections = groupByDate ? groupedReviews : [["All matching reviews", filteredReviews]];

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">Local review explorer</p>
          <h1>Paste reviews. Filter fast.</h1>
        </div>
        <div className="top-actions">
          <button className="icon-button" onClick={copyFiltered} title="Copy filtered reviews">
            <Clipboard size={18} />
          </button>
          <button
            className="icon-button"
            onClick={() => exportJson("filtered-reviews.json", filteredReviews)}
            title="Download filtered reviews"
          >
            <Download size={18} />
          </button>
          <button className="icon-button danger" onClick={clearData} title="Clear saved reviews">
            <Trash2 size={18} />
          </button>
        </div>
      </section>

      <section className="input-panel">
        <textarea
          value={rawInput}
          onChange={(event) => setRawInput(event.target.value)}
          placeholder='Paste your array here, like: [{"review_id":123,"comments":"Nice"}]'
        />
        <div className="input-actions">
          <button className="primary-button" onClick={loadReviews}>
            <Upload size={18} />
            Load pasted JSON
          </button>
          {notice && (
            <span className="status good">
              <Check size={16} />
              {notice}
            </span>
          )}
          {error && <span className="status bad">{error}</span>}
        </div>
      </section>

      <section className="stats-grid">
        <Stat label="Reviews" value={stats.total} />
        <Stat label="Average rating" value={stats.avg} icon={<Star size={18} />} />
        <Stat label="Products" value={stats.products} />
        <Stat label="With images" value={stats.withMedia} icon={<Image size={18} />} />
      </section>

      <section className="filters">
        <label className="search-box">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search comment, reviewer, product, ID"
          />
        </label>

        <label>
          <span>Product</span>
          <select value={product} onChange={(event) => setProduct(event.target.value)}>
            <option value="all">All products</option>
            {products.map((item) => (
              <option key={item.id} value={item.id}>
                {item.id} - {item.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Rating</span>
          <select value={rating} onChange={(event) => setRating(event.target.value)}>
            <option value="all">All ratings</option>
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                {value} star
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>From</span>
          <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
        </label>

        <label>
          <span>To</span>
          <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
        </label>

        <label>
          <span>Sort</span>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="rating-high">Rating high to low</option>
            <option value="rating-low">Rating low to high</option>
            <option value="helpful">Most helpful</option>
            <option value="product">Product name</option>
          </select>
        </label>

        <label className="check-row">
          <input type="checkbox" checked={mediaOnly} onChange={(event) => setMediaOnly(event.target.checked)} />
          <span>Images only</span>
        </label>

        <label className="check-row">
          <input type="checkbox" checked={groupByDate} onChange={(event) => setGroupByDate(event.target.checked)} />
          <span>Group by date</span>
        </label>
      </section>

      <section className="results-header">
        <div>
          <Filter size={18} />
          <strong>{filteredReviews.length}</strong>
          <span>matching reviews</span>
        </div>
        <button className="text-button" onClick={() => exportJson("all-reviews.json", reviews)}>
          Download all
        </button>
      </section>

      <section className="review-list">
        {reviews.length === 0 && (
          <div className="empty-state">
            <CalendarDays size={42} />
            <h2>No reviews loaded yet</h2>
            <p>Paste the array copied from DevTools and press Load pasted JSON.</p>
          </div>
        )}

        {sections.map(([group, items]) => (
          <div key={group} className="date-section">
            {groupByDate && (
              <div className="date-heading">
                <span>{group}</span>
                <strong>{items.length}</strong>
              </div>
            )}
            <div className="cards-grid">
              {items.map((review, index) => (
                <ReviewCard key={review.review_id || `${review.product_id}-${index}`} review={review} />
              ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}

function Stat({ label, value, icon }) {
  return (
    <div className="stat">
      <div className="stat-icon">{icon}</div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function ReviewCard({ review }) {
  const images = getImages(review);
  const rating = Number(review.rating || 0);
  return (
    <article className={`review-card rating-${Math.max(1, Math.min(5, Math.round(rating) || 1))}`}>
      <div className="card-top">
        <img
          className="product-thumb"
          src={review.product_image_thumb_url || review.product_image_large_url}
          alt=""
          loading="lazy"
        />
        <div>
          <h2>{compactProductName(review.product_name)}</h2>
          <p>Product ID: {review.product_id || "Unknown"}</p>
        </div>
      </div>

      <div className="review-meta">
        <span className="rating-pill">
          {rating.toFixed(1)}
          <Star size={14} fill="currentColor" />
        </span>
        <span>{formatDate(review)}</span>
        <span>{review.reviewer_name || review.author?.name || "Meesho User"}</span>
      </div>

      <p className="comment">{review.comments || "No written comment."}</p>

      {images.length > 0 && (
        <div className="image-strip">
          {images.slice(0, 5).map((image) => (
            <a key={image.id || image.url} href={image.url} target="_blank" rel="noreferrer">
              <img src={image.url} alt="" loading="lazy" />
            </a>
          ))}
        </div>
      )}

      <div className="card-footer">
        <span>Review ID: {review.review_id || "Unknown"}</span>
        <span>Helpful: {review.helpful_count || 0}</span>
      </div>
    </article>
  );
}

export default App;
