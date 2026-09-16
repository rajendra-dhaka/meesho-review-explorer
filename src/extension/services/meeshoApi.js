import axios from "axios";
import { PAGE_SIZE } from "../constants.js";

const client = axios.create({
  baseURL: window.location.origin,
  withCredentials: true,
  headers: {
    accept: "application/json, text/plain, */*",
    "meesho-iso-country-code": "IN",
  },
});

export async function fetchShopProfile(supplierHandle) {
  const { data } = await client.get("/api/v1/meri-shop/profile", {
    params: { supplierHandle },
  });
  return data;
}

export async function fetchReviewPage({ supplierId, cursor = "", limit = PAGE_SIZE }) {
  const { data } = await client.post(
    "/api/v1/meri-shop/review_summary",
    {
      supplier_id: supplierId,
      limit,
      type: "all",
      cursor,
    },
    {
      headers: {
        "content-type": "application/json",
      },
    }
  );
  return data;
}
