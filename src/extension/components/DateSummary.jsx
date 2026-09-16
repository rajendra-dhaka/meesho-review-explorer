export function DateSummary({ loadedRange, resultRange, visible }) {
  if (!visible) return null;

  const rangeChanged = loadedRange.label !== resultRange.label;

  return (
    <div className="mre-date-summary">
      <div>
        <span>Loaded date range</span>
        <strong>{loadedRange.label}</strong>
      </div>
      <div className={rangeChanged ? "is-active" : ""}>
        <span>Current results</span>
        <strong>{resultRange.label}</strong>
      </div>
    </div>
  );
}
