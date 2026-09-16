import { useMemo, useState } from "react";

export function Filters({ filters, onChange, onClearAll, onDatePreset, productOptions }) {
  const [productSearch, setProductSearch] = useState("");
  const [isProductMenuOpen, setProductMenuOpen] = useState(false);
  const selectedProduct = productOptions.find((product) => product.id === filters.product);
  const visibleProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    if (!query) return productOptions.slice(0, 40);
    return productOptions
      .filter((product) => `${product.id} ${product.name}`.toLowerCase().includes(query))
      .slice(0, 40);
  }, [productOptions, productSearch]);

  return (
    <div className="mre-filter-wrap">
      <div className="mre-presets">
        <button onClick={() => onDatePreset("today")}>Today</button>
        <button onClick={() => onDatePreset("7d")}>Last 7 days</button>
        <button onClick={() => onDatePreset("30d")}>Last 30 days</button>
        <button onClick={() => onDatePreset("month")}>This month</button>
        <button onClick={() => onDatePreset("clear")}>Clear dates</button>
        <button className="mre-clear-all" onClick={onClearAll}>Clear all filters</button>
      </div>
      <div className="mre-filters">
        <input
          onChange={(event) => onChange("query", event.target.value)}
          placeholder="Search comment, product, reviewer, id"
          value={filters.query}
        />
        <div
          className={`mre-product-picker ${isProductMenuOpen ? "is-open" : ""}`}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setProductMenuOpen(false);
          }}
        >
          <input
            onChange={(event) => {
              setProductSearch(event.target.value);
              setProductMenuOpen(true);
            }}
            onFocus={() => setProductMenuOpen(true)}
            placeholder={selectedProduct ? `Selected: ${selectedProduct.name}` : "Search product"}
            value={productSearch}
          />
          {isProductMenuOpen && (
            <div className="mre-product-menu">
              <button
                className={filters.product === "all" ? "is-active" : ""}
                onClick={() => {
                  onChange("product", "all");
                  setProductSearch("");
                  setProductMenuOpen(false);
                }}
                type="button"
              >
                <span>All products</span>
                <em>{productOptions.length} products</em>
              </button>
              {visibleProducts.map((product) => (
                <button
                  className={filters.product === product.id ? "is-active" : ""}
                  key={product.id}
                  onClick={() => {
                    onChange("product", product.id);
                    setProductSearch("");
                    setProductMenuOpen(false);
                  }}
                  type="button"
                >
                  <span>{product.name}</span>
                  <em>{product.id}</em>
                </button>
              ))}
              {!visibleProducts.length && <p>No product found.</p>}
            </div>
          )}
        </div>
        <select onChange={(event) => onChange("rating", event.target.value)} value={filters.rating}>
          <option value="all">All ratings</option>
          {[5, 4, 3, 2, 1].map((rating) => (
            <option key={rating} value={rating}>
              {rating} star
            </option>
          ))}
        </select>
        <input onChange={(event) => onChange("from", event.target.value)} type="date" value={filters.from} />
        <input onChange={(event) => onChange("to", event.target.value)} type="date" value={filters.to} />
        <select onChange={(event) => onChange("sort", event.target.value)} value={filters.sort}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="rating-high">Rating high</option>
          <option value="rating-low">Rating low</option>
          <option value="helpful">Helpful</option>
          <option value="product">Product</option>
        </select>
        <label className="mre-check">
          <input
            checked={filters.mediaOnly}
            onChange={(event) => onChange("mediaOnly", event.target.checked)}
            type="checkbox"
          />
          Images only
        </label>
      </div>
    </div>
  );
}
