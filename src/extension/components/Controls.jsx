import { useState } from "react";

export function Controls({
  defaultMaxReviews,
  disabled,
  isReviewLoading,
  onDetect,
  onProblems,
  onLoad,
  onSupplierChange,
  supplierId,
}) {
  const [maxReviews, setMaxReviews] = useState(defaultMaxReviews);

  return (
    <div className="mre-controls">
      <label>
        <span>Supplier ID</span>
        <input
          disabled={disabled}
          onChange={(event) => onSupplierChange(event.target.value.trim())}
          placeholder="Auto detect or paste supplier id"
          value={disabled && !supplierId ? "" : supplierId}
        />
      </label>

      <label>
        <span>Max reviews</span>
        <input
          min="100"
          onChange={(event) => setMaxReviews(Number(event.target.value || defaultMaxReviews))}
          step="100"
          type="number"
          value={maxReviews}
        />
      </label>

      <button
        className="mre-primary"
        disabled={disabled || isReviewLoading}
        onClick={() => onLoad({ maxReviews })}
      >
        {isReviewLoading ? "Loading..." : "Load reviews"}
      </button>
      <button className="mre-secondary" onClick={onDetect}>
        Auto detect
      </button>
      <button className="mre-secondary mre-danger-soft" disabled={disabled} onClick={onProblems}>
        Problems
      </button>
    </div>
  );
}
