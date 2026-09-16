export function StatsGrid({ stats }) {
  return (
    <div className="mre-stats">
      <Stat label="Reviews" value={stats.total} />
      <Stat label="Matching" value={stats.matching} />
      <Stat label="Avg rating" value={stats.average} />
      <Stat label="Products" value={stats.products} />
      <Stat label="With images" value={stats.withImages} />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
