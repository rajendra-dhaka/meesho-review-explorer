import { formatReviewDate, getImages, shorten } from "../utils/reviews.js";

export function ReviewCard({ onImageClick, review }) {
  const rating = Math.max(1, Math.min(5, Math.round(Number(review.rating || 1))));
  const images = getImages(review);

  return (
    <article className={`mre-card rating-${rating}`}>
      <div className="mre-card-top">
        <img
          alt=""
          loading="lazy"
          src={review.product_image_thumb_url || review.product_image_large_url || ""}
        />
        <div>
          <h3>{shorten(review.product_name || "Unknown product", 92)}</h3>
          <p>Product ID: {review.product_id || "Unknown"}</p>
        </div>
      </div>

      <div className="mre-meta">
        <span className="mre-pill">{Number(review.rating || 0).toFixed(1)} ★</span>
        <span>{formatReviewDate(review)}</span>
        <span>{review.reviewer_name || review.author?.name || "Meesho User"}</span>
      </div>

      <p className="mre-comment">{review.comments || "No written comment."}</p>

      {images.length > 0 && (
        <div className="mre-images">
          {images.slice(0, 5).map((image) => (
            <button
              className="mre-image-button"
              key={image.id || image.url}
              onClick={() => onImageClick(image.url)}
              type="button"
            >
              <img alt="" loading="lazy" src={image.url} />
            </button>
          ))}
        </div>
      )}

      <div className="mre-foot">
        <span>Review {review.review_id || ""}</span>
        <span>Helpful {Number(review.helpful_count || 0)}</span>
      </div>
    </article>
  );
}
