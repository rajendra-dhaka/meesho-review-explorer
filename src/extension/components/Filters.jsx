export function Filters({ filters, onChange, onDatePreset, productOptions }) {
  return (
    <div className="mre-filter-wrap">
      <div className="mre-presets">
        <button onClick={() => onDatePreset("today")}>Today</button>
        <button onClick={() => onDatePreset("7d")}>Last 7 days</button>
        <button onClick={() => onDatePreset("30d")}>Last 30 days</button>
        <button onClick={() => onDatePreset("month")}>This month</button>
        <button onClick={() => onDatePreset("clear")}>Clear dates</button>
      </div>
      <div className="mre-filters">
      <input
        onChange={(event) => onChange("query", event.target.value)}
        placeholder="Search comment, product, reviewer, id"
        value={filters.query}
      />
      <select onChange={(event) => onChange("product", event.target.value)} value={filters.product}>
        <option value="all">All products</option>
        {productOptions.map((product) => (
          <option key={product.id} value={product.id}>
            {product.id} - {product.name}
          </option>
        ))}
      </select>
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
      <label className="mre-check">
        <input
          checked={filters.problemOnly}
          onChange={(event) => onChange("problemOnly", event.target.checked)}
          type="checkbox"
        />
        Problems
      </label>
      </div>
    </div>
  );
}
