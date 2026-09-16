const NON_SHOP_PATHS = /^(api|auth|checkout|cart|orders|account|search|product)$/i;

export function getShopHandleFromUrl(pathname = window.location.pathname) {
  const firstSegment = pathname.split("/").filter(Boolean)[0] || "";
  if (!firstSegment) return "";
  if (NON_SHOP_PATHS.test(firstSegment)) return "";
  if (firstSegment.length < 4 || firstSegment.length > 80) return "";
  return decodeURIComponent(firstSegment);
}
