import { ReviewCard } from "./ReviewCard.jsx";

export function ReviewList({ groups, hasReviews, isDetecting, onImageClick }) {
  if (isDetecting) {
    return <div className="mre-empty">Detecting this shop&apos;s supplier id from profile API...</div>;
  }

  if (!hasReviews) {
    return <div className="mre-empty">Load reviews to see the dashboard here.</div>;
  }

  return (
    <section className="mre-list">
      {groups.map(([date, reviews]) => (
        <section className="mre-date-group" key={date}>
          <div className="mre-date-heading">
            <span>{date}</span>
            <strong>{reviews.length}</strong>
          </div>
          <div className="mre-cards">
            {reviews.map((review, index) => (
              <ReviewCard
                key={review.review_id || `${review.product_id}-${index}`}
                onImageClick={onImageClick}
                review={review}
              />
            ))}
          </div>
        </section>
      ))}
    </section>
  );
}
