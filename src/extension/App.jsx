import { APP_VERSION, DEFAULT_MAX_REVIEWS } from "./constants.js";
import { Controls } from "./components/Controls.jsx";
import { DateSummary } from "./components/DateSummary.jsx";
import { Filters } from "./components/Filters.jsx";
import { ReviewList } from "./components/ReviewList.jsx";
import { StatsGrid } from "./components/StatsGrid.jsx";
import { TopProducts } from "./components/TopProducts.jsx";
import { useReviewExplorer } from "./hooks/useReviewExplorer.js";

export default function App() {
  const { actions, data, filters, status, ui } = useReviewExplorer();

  return (
    <>
      <button className="mre-launcher" onClick={actions.open} title="Open Review Explorer">
        Reviews
      </button>

      <section className="mre-modal" aria-hidden={!ui.isOpen}>
        <header className="mre-header">
          <div>
            <p>
              Meesho Review Explorer <span className="mre-version">v{APP_VERSION}</span>
            </p>
            <h2>Seller reviews</h2>
          </div>
          <button className="mre-close" onClick={actions.close} title="Close">
            ×
          </button>
        </header>

        <Controls
          defaultMaxReviews={DEFAULT_MAX_REVIEWS}
          disabled={ui.isProfileLoading && !ui.isProfileReady}
          isReviewLoading={ui.isReviewLoading}
          onCopy={actions.copyFilteredReviews}
          onDetect={actions.detectProfile}
          onDownload={actions.downloadFilteredReviews}
          onLoad={actions.loadReviews}
          onSupplierChange={actions.setSupplierId}
          supplierId={data.supplierId}
        />

        <div className="mre-status">{status}</div>

        <DateSummary
          loadedRange={data.loadedDateRange}
          resultRange={data.resultDateRange}
          visible={data.reviews.length > 0 && !(ui.isProfileLoading && !ui.isProfileReady)}
        />

        <StatsGrid stats={data.stats} />

        <TopProducts products={data.topProducts} reviewCount={data.filteredReviews.length} />

        <Filters
          filters={filters}
          onChange={actions.updateFilter}
          productOptions={data.productOptions}
        />

        <ReviewList
          groups={data.groupedReviews}
          hasReviews={data.reviews.length > 0}
          isDetecting={ui.isProfileLoading && !ui.isProfileReady}
        />
      </section>
    </>
  );
}
