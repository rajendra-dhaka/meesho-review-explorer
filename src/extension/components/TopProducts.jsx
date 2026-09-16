import { shorten } from "../utils/reviews.js";

export function TopProducts({ onSelectProduct, products, reviewCount }) {
  if (!products.length) return null;

  return (
    <section className="mre-top-products">
      <div className="mre-top-heading">
        <strong>Top products in current results</strong>
        <span>{reviewCount} reviews</span>
      </div>
      <div className="mre-top-list">
        {products.map((product, index) => (
          <details className="mre-product-detail" key={product.id} open={index === 0}>
            <summary>
              <span className="mre-rank">{index + 1}</span>
              <img alt="" loading="lazy" src={product.image} />
              <button className="mre-product-title" onClick={() => onSelectProduct(product.id)}>
                {shorten(product.name, 92)}
              </button>
              <span className="mre-product-score">
                <strong>{product.averageRating.toFixed(2)} ★</strong>
                <em>{product.total} reviews</em>
                <em className={product.riskScore > 45 ? "is-risky" : ""}>{product.riskScore}% risk</em>
              </span>
            </summary>
            <div className="mre-rating-breakdown">
              {[5, 4, 3, 2, 1].map((rating) => {
                const maxRatingCount = Math.max(...Object.values(product.ratings), 1);
                const count = product.ratings[rating];
                const width = Math.max(4, Math.round((count / maxRatingCount) * 100));
                return (
                  <div className={`mre-rating-row rating-${rating}`} key={rating}>
                    <span>{rating} ★</span>
                    <div>
                      <i style={{ width: `${width}%` }} />
                    </div>
                    <strong>{count}</strong>
                  </div>
                );
              })}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
