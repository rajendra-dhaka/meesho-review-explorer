import { shorten } from "../utils/reviews.js";

export function ProductExplorer({ onSelectProduct, products }) {
  if (!products.length) {
    return <div className="mre-empty">No product data in current results.</div>;
  }

  return (
    <section className="mre-product-explorer">
      <div className="mre-section-heading">
        <strong>All products in current results</strong>
        <span>{products.length} products</span>
      </div>
      <div className="mre-product-table">
        <div className="mre-product-row is-head">
          <span>Product</span>
          <span>Reviews</span>
          <span>Avg</span>
          <span>Bad %</span>
          <span>Risk</span>
        </div>
        {products.map((product) => (
          <button className="mre-product-row" key={product.id} onClick={() => onSelectProduct(product.id)}>
            <span className="mre-product-name">
              <img alt="" loading="lazy" src={product.image} />
              <b>{shorten(product.name, 96)}</b>
            </span>
            <span>{product.total}</span>
            <span>{product.averageRating.toFixed(2)} ★</span>
            <span>{product.negativePercent}%</span>
            <span className={product.riskScore > 45 ? "is-risky" : ""}>{product.riskScore}%</span>
          </button>
        ))}
      </div>
    </section>
  );
}
