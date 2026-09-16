export function Insights({ comparison, problemInsights, onShowProblems }) {
  return (
    <section className="mre-insights">
      <div className="mre-insight-card">
        <div className="mre-section-heading">
          <strong>Repeated complaint words</strong>
          <button onClick={onShowProblems}>Show problems</button>
        </div>
        <p className="mre-help-text">Words repeatedly found in 1-2 star reviews.</p>
        <div className="mre-chip-list">
          {problemInsights.keywords.length ? (
            problemInsights.keywords.map((item) => (
              <span key={item.label}>
                {item.label} <strong>{item.count}</strong>
              </span>
            ))
          ) : (
            <em>No repeated problem keywords found.</em>
          )}
        </div>
      </div>

      <div className="mre-insight-card">
        <div className="mre-section-heading">
          <strong>Complaint types</strong>
        </div>
        <p className="mre-help-text">Automatic grouping of low-rated reviews by likely issue.</p>
        <div className="mre-chip-list">
          {problemInsights.categories.length ? (
            problemInsights.categories.map((item) => (
              <span key={item.label}>
                {item.label} <strong>{item.count}</strong>
              </span>
            ))
          ) : (
            <em>No problem categories in current results.</em>
          )}
        </div>
      </div>

      <div className="mre-insight-card">
        <div className="mre-section-heading">
          <strong>Last 7 days vs previous 7</strong>
        </div>
        {comparison ? (
          <div className="mre-compare-grid">
            <Metric label="Reviews" value={comparison.current.count} delta={comparison.deltas.count} />
            <Metric label="Avg rating" value={comparison.current.avg.toFixed(2)} delta={comparison.deltas.avg.toFixed(2)} />
            <Metric label="Bad reviews" value={comparison.current.bad} delta={comparison.deltas.bad} danger />
          </div>
        ) : (
          <em>No dated reviews for comparison.</em>
        )}
      </div>
    </section>
  );
}

function Metric({ danger = false, delta, label, value }) {
  const numberDelta = Number(delta);
  const good = danger ? numberDelta <= 0 : numberDelta >= 0;
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
      <em className={good ? "is-good" : "is-bad"}>{numberDelta > 0 ? "+" : ""}{delta}</em>
    </div>
  );
}
