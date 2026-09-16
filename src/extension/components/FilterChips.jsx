export function FilterChips({ filters, onChange, onClearAll, productOptions }) {
  const product = productOptions.find((item) => item.id === filters.product);
  const chips = [];

  if (filters.query) chips.push(["query", `Search: ${filters.query}`]);
  if (product) chips.push(["product", `Product: ${product.name}`]);
  if (filters.rating !== "all") chips.push(["rating", `${filters.rating} star`]);
  if (filters.from || filters.to) chips.push(["date", `${filters.from || "start"} to ${filters.to || "today"}`]);
  if (filters.mediaOnly) chips.push(["mediaOnly", "Images only"]);
  if (filters.problemOnly) chips.push(["problemOnly", "Problems only"]);

  if (!chips.length) return null;

  const clear = (key) => {
    if (key === "date") {
      onChange("from", "");
      onChange("to", "");
      return;
    }
    if (key === "product" || key === "rating") {
      onChange(key, "all");
      return;
    }
    if (key === "mediaOnly" || key === "problemOnly") {
      onChange(key, false);
      return;
    }
    onChange(key, "");
  };

  return (
    <div className="mre-filter-chips">
      {chips.map(([key, label]) => (
        <button key={key} onClick={() => clear(key)}>
          {label} <span>×</span>
        </button>
      ))}
      <button className="mre-clear-chip" onClick={onClearAll}>
        Clear all
      </button>
    </div>
  );
}
