import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_MAX_REVIEWS, PAGE_SIZE } from "../constants.js";
import { fetchReviewPage, fetchShopProfile } from "../services/meeshoApi.js";
import {
  buildProductOptions,
  buildDateComparison,
  buildProblemInsights,
  buildProducts,
  buildStats,
  buildTopProducts,
  filterReviews,
  findMaskedSupplierId,
  findReviews,
  getNextCursor,
  getDatePresetRange,
  getReviewDateRange,
  groupReviewsByDate,
} from "../utils/reviews.js";
import { getShopHandleFromUrl } from "../utils/shop.js";
import { clearLegacyStorage, getStoredShopData, saveStoredShopData } from "../utils/storage.js";

const DEFAULT_FILTERS = {
  query: "",
  product: "all",
  rating: "all",
  from: "",
  to: "",
  sort: "newest",
  mediaOnly: false,
};

const REVIEW_PAGE_SIZE = 60;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function useReviewExplorer() {
  const [isOpen, setIsOpen] = useState(false);
  const [shopHandle, setShopHandle] = useState(() => getShopHandleFromUrl());
  const [supplierId, setSupplierId] = useState("");
  const [reviews, setReviews] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [activeTab, setActiveTab] = useState("overview");
  const [lightboxImage, setLightboxImage] = useState("");
  const [reviewPage, setReviewPage] = useState(1);
  const [status, setStatus] = useState("");
  const [isProfileLoading, setIsProfileLoading] = useState(Boolean(getShopHandleFromUrl()));
  const [isProfileReady, setIsProfileReady] = useState(false);
  const [isReviewLoading, setIsReviewLoading] = useState(false);
  const [autoStarted, setAutoStarted] = useState(false);
  const requestIdRef = useRef(0);

  const filteredReviews = useMemo(() => filterReviews(reviews, filters), [filters, reviews]);
  const visibleReviews = useMemo(() => {
    if (activeTab !== "problems") return filteredReviews;
    return filterReviews(filteredReviews, {
      ...DEFAULT_FILTERS,
      rating: "all",
      sort: "rating-low",
    }).filter((review) => Number(review.rating || 0) <= 2);
  }, [activeTab, filteredReviews]);
  const productOptions = useMemo(() => buildProductOptions(reviews), [reviews]);
  const stats = useMemo(() => buildStats(reviews, filteredReviews), [filteredReviews, reviews]);
  const groupedReviews = useMemo(() => groupReviewsByDate(visibleReviews), [visibleReviews]);
  const pagedReviews = useMemo(() => {
    const start = (reviewPage - 1) * REVIEW_PAGE_SIZE;
    return visibleReviews.slice(start, start + REVIEW_PAGE_SIZE);
  }, [reviewPage, visibleReviews]);
  const groupedPagedReviews = useMemo(() => groupReviewsByDate(pagedReviews), [pagedReviews]);
  const topProducts = useMemo(() => buildTopProducts(filteredReviews), [filteredReviews]);
  const allProducts = useMemo(() => buildProducts(filteredReviews), [filteredReviews]);
  const problemInsights = useMemo(() => buildProblemInsights(filteredReviews), [filteredReviews]);
  const dateComparison = useMemo(() => buildDateComparison(filteredReviews), [filteredReviews]);
  const loadedDateRange = useMemo(() => getReviewDateRange(reviews), [reviews]);
  const resultDateRange = useMemo(() => getReviewDateRange(filteredReviews), [filteredReviews]);

  const persist = useCallback(
    (nextReviews = reviews, nextSupplierId = supplierId, nextShopHandle = shopHandle) => {
      return saveStoredShopData(nextShopHandle, {
        supplierId: nextSupplierId,
        reviews: nextReviews,
      });
    },
    [reviews, shopHandle, supplierId]
  );

  const updateFilter = useCallback((key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setReviewPage(1);
  }, []);

  const applyDatePreset = useCallback((preset) => {
    const range = getDatePresetRange(preset);
    setFilters((current) => ({ ...current, from: range.from, to: range.to }));
    setReviewPage(1);
  }, []);

  const selectProduct = useCallback((productId) => {
    setFilters((current) => ({ ...current, product: productId }));
    setActiveTab("reviews");
    setReviewPage(1);
  }, []);

  const showProblems = useCallback(() => {
    setActiveTab("problems");
    setReviewPage(1);
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setReviewPage(1);
  }, []);

  const resetForShop = useCallback((handle) => {
    setShopHandle(handle);
    setSupplierId("");
    setReviews([]);
    setIsProfileReady(false);
    setAutoStarted(false);
    setFilters(DEFAULT_FILTERS);
  }, []);

  const loadReviews = useCallback(
    async ({ id = supplierId, maxReviews = DEFAULT_MAX_REVIEWS, auto = false } = {}) => {
      const currentHandle = getShopHandleFromUrl();
      const cleanId = String(id || "").trim();
      if (!cleanId) {
        setStatus("Enter supplier id first, or click Auto detect.");
        return;
      }

      setIsReviewLoading(true);
      setSupplierId(cleanId);
      setReviews([]);
      setStatus(auto ? "Auto loading reviews..." : "Loading reviews...");

      let cursor = "";
      let page = 1;
      const loaded = [];

      try {
        while (loaded.length < maxReviews) {
          if (currentHandle !== getShopHandleFromUrl()) {
            throw new Error("Shop changed while loading. Refresh this page.");
          }

          setStatus(`Loading page ${page}... ${loaded.length}/${maxReviews}`);
          const response = await fetchReviewPage({
            supplierId: cleanId,
            cursor,
            limit: PAGE_SIZE,
          });
          const pageReviews = findReviews(response);

          if (!pageReviews.length) break;

          loaded.push(...pageReviews);
          setReviews(loaded.slice(0, maxReviews));

          const nextCursor = getNextCursor(response);
          if (!nextCursor || nextCursor === cursor) break;

          cursor = nextCursor;
          page += 1;
          await delay(250);
        }

        const finalReviews = loaded.slice(0, maxReviews);
        setReviews(finalReviews);
        await persist(finalReviews, cleanId, currentHandle);
        setStatus(`Shop ${currentHandle}: loaded ${finalReviews.length} reviews.`);
      } catch (error) {
        setStatus(error.message || "Could not load reviews.");
      } finally {
        setIsReviewLoading(false);
      }
    },
    [persist, supplierId]
  );

  const autoLoadFromSupplierId = useCallback(
    (id) => {
      if (autoStarted || isReviewLoading || !id) return;
      setAutoStarted(true);
      loadReviews({ id, maxReviews: DEFAULT_MAX_REVIEWS, auto: true });
    },
    [autoStarted, isReviewLoading, loadReviews]
  );

  const detectProfile = useCallback(async () => {
    const handle = getShopHandleFromUrl();
    if (!handle) {
      setIsProfileLoading(false);
      setStatus("Open a Meesho shop page to auto-detect supplier id.");
      return;
    }

    if (shopHandle && shopHandle !== handle) {
      resetForShop(handle);
    } else {
      setShopHandle(handle);
    }

    if (isProfileReady && supplierId && shopHandle === handle) return;

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setIsProfileLoading(true);
    setIsProfileReady(false);
    setStatus(`Reading shop profile for ${handle}...`);

    try {
      const profile = await fetchShopProfile(handle);
      if (requestId !== requestIdRef.current || handle !== getShopHandleFromUrl()) return;

      const found = findMaskedSupplierId(profile);
      if (!found?.value) {
        setStatus("Profile loaded, but supplier id was not found.");
        return;
      }

      setSupplierId(found.value);
      setIsProfileReady(true);
      setStatus(`Shop ${handle}: profile supplier id ${found.value}`);
      await persist(reviews, found.value, handle);
      autoLoadFromSupplierId(found.value);
    } catch {
      setStatus("Could not read shop profile. Try Auto detect again.");
    } finally {
      if (requestId === requestIdRef.current) setIsProfileLoading(false);
    }
  }, [
    autoLoadFromSupplierId,
    isProfileReady,
    persist,
    resetForShop,
    reviews,
    shopHandle,
    supplierId,
  ]);

  useEffect(() => {
    const handle = getShopHandleFromUrl();
    setShopHandle(handle);
    setIsProfileLoading(Boolean(handle));
    clearLegacyStorage();

    getStoredShopData(handle).then((saved) => {
      if (saved.shopHandle === handle && Array.isArray(saved.reviews)) {
        setReviews(saved.reviews);
      }
      detectProfile();
    });
  }, []);

  useEffect(() => {
    function handleMessage(event) {
      if (event.source !== window) return;
      if (event.data?.source !== "meesho-review-explorer") return;
      if (event.data?.type !== "supplier-id" || !event.data.supplierId) return;

      const source = event.data.supplierSource === "profile_response" ? "profile API" : "Meesho API call";
      setSupplierId(event.data.supplierId);
      setIsProfileLoading(false);
      setIsProfileReady(true);
      setStatus(`Captured supplier id from ${source}.`);
      autoLoadFromSupplierId(event.data.supplierId);
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [autoLoadFromSupplierId]);

  useEffect(() => {
    if (!productOptions.some((product) => product.id === filters.product)) {
      setFilters((current) => ({ ...current, product: "all" }));
    }
  }, [filters.product, productOptions]);

  const reviewPagination = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(visibleReviews.length / REVIEW_PAGE_SIZE));
    return {
      page: Math.min(reviewPage, totalPages),
      pageSize: REVIEW_PAGE_SIZE,
      total: visibleReviews.length,
      totalPages,
      from: visibleReviews.length ? (Math.min(reviewPage, totalPages) - 1) * REVIEW_PAGE_SIZE + 1 : 0,
      to: Math.min(Math.min(reviewPage, totalPages) * REVIEW_PAGE_SIZE, visibleReviews.length),
    };
  }, [reviewPage, visibleReviews.length]);

  useEffect(() => {
    if (reviewPage > reviewPagination.totalPages) {
      setReviewPage(reviewPagination.totalPages);
    }
  }, [reviewPage, reviewPagination.totalPages]);

  return {
    actions: {
      close: () => setIsOpen(false),
      clearAllFilters,
      detectProfile,
      applyDatePreset,
      loadReviews,
      open: () => {
        setIsOpen(true);
        if (!isProfileReady) detectProfile();
      },
      setSupplierId,
      setActiveTab,
      setLightboxImage,
      setReviewPage,
      selectProduct,
      showProblems,
      updateFilter,
    },
    data: {
      activeTab,
      allProducts,
      dateComparison,
      filteredReviews,
      groupedReviews,
      groupedPagedReviews,
      lightboxImage,
      loadedDateRange,
      problemInsights,
      productOptions,
      resultDateRange,
      reviews,
      shopHandle,
      stats,
      supplierId,
      topProducts,
      reviewPagination,
    },
    filters,
    status,
    ui: {
      isOpen,
      isProfileLoading,
      isProfileReady,
      isReviewLoading,
    },
  };
}
