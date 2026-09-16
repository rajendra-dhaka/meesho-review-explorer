import { APP_VERSION, DEFAULT_MAX_REVIEWS } from "./constants.js";
import { Controls } from "./components/Controls.jsx";
import { DateSummary } from "./components/DateSummary.jsx";
import { Filters } from "./components/Filters.jsx";
import { FilterChips } from "./components/FilterChips.jsx";
import { Insights } from "./components/Insights.jsx";
import { Lightbox } from "./components/Lightbox.jsx";
import { Pagination } from "./components/Pagination.jsx";
import { ProductExplorer } from "./components/ProductExplorer.jsx";
import { ReviewList } from "./components/ReviewList.jsx";
import { StatsGrid } from "./components/StatsGrid.jsx";
import { Tabs } from "./components/Tabs.jsx";
import { TopProducts } from "./components/TopProducts.jsx";
import { useReviewExplorer } from "./hooks/useReviewExplorer.js";

export default function App() {
  const { actions, data, filters, status, ui } = useReviewExplorer();
  const changeTab = (tab) => {
    if (tab === "problems") {
      actions.showProblems();
      return;
    }
    actions.setActiveTab(tab);
  };

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
          onCsv={actions.downloadFilteredCsv}
          onDetect={actions.detectProfile}
          onDownload={actions.downloadFilteredReviews}
          onLoad={actions.loadReviews}
          onProblems={actions.showProblems}
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

        <Tabs activeTab={data.activeTab} onChange={changeTab} />

        {(data.activeTab === "overview" || data.activeTab === "products") && (
          <TopProducts
            onSelectProduct={actions.selectProduct}
            products={data.topProducts}
            reviewCount={data.filteredReviews.length}
          />
        )}

        {data.activeTab === "products" && (
          <ProductExplorer onSelectProduct={actions.selectProduct} products={data.allProducts} />
        )}

        {data.activeTab === "overview" && (
          <Insights
            comparison={data.dateComparison}
            onShowProblems={actions.showProblems}
            problemInsights={data.problemInsights}
          />
        )}

        {(data.activeTab === "reviews" || data.activeTab === "problems") && (
          <>
            <Filters
              filters={filters}
              onChange={actions.updateFilter}
              onDatePreset={actions.applyDatePreset}
              productOptions={data.productOptions}
            />
            <FilterChips
              filters={filters}
              onChange={actions.updateFilter}
              productOptions={data.productOptions}
            />

            <ReviewList
              groups={data.groupedPagedReviews}
              hasReviews={data.reviews.length > 0}
              isDetecting={ui.isProfileLoading && !ui.isProfileReady}
              onImageClick={actions.setLightboxImage}
            />

            <Pagination onPageChange={actions.setReviewPage} pagination={data.reviewPagination} />
          </>
        )}

        <Lightbox imageUrl={data.lightboxImage} onClose={() => actions.setLightboxImage("")} />
      </section>
    </>
  );
}
