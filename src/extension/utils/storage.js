import { STORAGE_PREFIX } from "../constants.js";

export function storageKeyForShop(shopHandle) {
  return `${STORAGE_PREFIX}:${shopHandle || "unknown"}`;
}

export function getStoredShopData(shopHandle) {
  return new Promise((resolve) => {
    if (!globalThis.chrome?.storage?.local) {
      resolve({});
      return;
    }

    const key = storageKeyForShop(shopHandle);
    chrome.storage.local.get([key], (result) => resolve(result[key] || {}));
  });
}

export function saveStoredShopData(shopHandle, data) {
  return new Promise((resolve) => {
    if (!globalThis.chrome?.storage?.local) {
      resolve();
      return;
    }

    chrome.storage.local.set(
      {
        [storageKeyForShop(shopHandle)]: {
          shopHandle,
          ...data,
        },
      },
      resolve
    );
  });
}

export function clearLegacyStorage() {
  if (globalThis.chrome?.storage?.local) {
    chrome.storage.local.remove([STORAGE_PREFIX]);
  }
}
