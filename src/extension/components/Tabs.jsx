const TABS = [
  ["overview", "Overview"],
  ["products", "Products"],
  ["reviews", "Reviews"],
  ["problems", "Problems"],
];

export function Tabs({ activeTab, onChange }) {
  return (
    <nav className="mre-tabs">
      {TABS.map(([id, label]) => (
        <button className={activeTab === id ? "is-active" : ""} key={id} onClick={() => onChange(id)}>
          {label}
        </button>
      ))}
    </nav>
  );
}
