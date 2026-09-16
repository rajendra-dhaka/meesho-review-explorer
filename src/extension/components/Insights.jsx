export function Insights({ comparison, problemInsights, onShowProblems }) {
  return (
    <section className="mre-insights">
      <div className="mre-insight-card">
        <div className="mre-section-heading">
          <strong>Problem keywords</strong>
          <button onClick={onShowProblems}>Show problems</button>
        </div>
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
          <strong>Sentiment buckets</strong>
        </div>
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
