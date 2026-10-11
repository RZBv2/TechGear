/**
 * Thin data-access layer. Every screen reads through these functions, so
 * replacing the local catalog with `fetch("/api/...")` is a one-file change.
 */

import {
  reviews,
  stats,
  type Category,
  type PreOwnedProduct,
  type Product,
  type Review,
} from "./catalog";
import {
  catalogCategories,
  type CatalogProduct,
  type CategoryId,
} from "./products";
import {
  resolveProductImage,
  fallbackImage,
  IMAGE_DISCLOSURE,
} from "./products/images";
import { getManagedProducts } from "@/lib/productAdmin";

export type { CatalogProduct, CategoryId };
export { IMAGE_DISCLOSURE, fallbackImage };

/** Narrow view-model consumed by the existing product cards. */
export const toProduct = (p: CatalogProduct): Product => ({
  id: p.id,
  brand: p.brand,
  name: p.productName,
  image: resolveProductImage(p.imageKey, p.category),
  price: p.price,
  ...(p.previousPrice ? { wasPrice: p.previousPrice } : {}),
  rating: p.rating,
  reviews: p.reviewCount,
  stock: p.stockStatus,
  ...(p.discountPercentage
    ? { tag: `-${p.discountPercentage}%` }
    : p.newArrival
      ? { tag: "New" }
      : {}),
});

export const toPreOwned = (p: CatalogProduct): PreOwnedProduct => ({
  ...toProduct(p),
  condition: p.preOwned?.conditionGrade ?? p.condition,
  battery: p.preOwned?.batteryHealth ?? 0,
  warranty: p.warranty ?? "6 months",
});

export const getCategories = (): Category[] => {
  const managed = getManagedProducts();
  return catalogCategories
    .filter((c) => c.id !== "preowned")
    .map((c) => ({
      id: c.id,
      name: c.name,
      desc: c.description,
      count: managed.filter((p) => p.category === c.id).length,
    }));
};

export const getCatalogCategories = () => {
  const managed = getManagedProducts();
  return catalogCategories.map((c) => ({
    ...c,
    count: managed.filter((p) => p.category === c.id).length,
  }));
};

export const getProductsByCategory = (category: CategoryId): CatalogProduct[] =>
  getManagedProducts().filter((p) => p.category === category);

export const getProductById = (id: string): CatalogProduct | undefined =>
  getManagedProducts().find((p) => p.id === id);

export const getFeatured = (): CatalogProduct[] =>
  getManagedProducts().filter((p) => p.featured);

export const getRelated = (
  product: CatalogProduct,
  limit = 4,
): CatalogProduct[] =>
  getProductsByCategory(product.category)
    .filter((p) => p.id !== product.id)
    .slice(0, limit);

export type ProductQuery = {
  q?: string;
  category?: CategoryId;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  condition?: string;
  availability?: "in" | "low" | "out";
  releaseYear?: number;
  sort?: "relevance" | "price-asc" | "price-desc" | "rating" | "newest";
  page?: number;
  perPage?: number;
};

export const queryProducts = (query: ProductQuery = {}) => {
  const { page = 1, perPage = 24 } = query;
  const filtered = getManagedProducts().filter((p) => {
    if (query.q?.trim()) {
      const haystack = [
        p.productName,
        p.brand,
        p.model,
        p.category,
        p.subcategory,
        p.shortDescription,
        p.fullDescription ?? "",
        Object.values(p.specifications ?? {}).join(" "),
      ]
        .join(" ")
        .toLowerCase();
      const terms = query.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
      if (!terms.every((term) => haystack.includes(term))) return false;
    }
    if (query.category && p.category !== query.category) return false;
    if (query.brand && p.brand !== query.brand) return false;
    if (query.minPrice !== undefined && p.price < query.minPrice) return false;
    if (query.maxPrice !== undefined && p.price > query.maxPrice) return false;
    if (query.minRating !== undefined && p.rating < query.minRating)
      return false;
    if (query.condition && p.condition !== query.condition) return false;
    if (query.availability && p.stockStatus !== query.availability)
      return false;
    if (query.releaseYear !== undefined && p.releaseYear !== query.releaseYear)
      return false;
    return true;
  });

  switch (query.sort) {
    case "price-asc":
      filtered.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      filtered.sort((a, b) => b.price - a.price);
      break;
    case "rating":
      filtered.sort((a, b) => b.rating - a.rating);
      break;
    case "newest":
      filtered.sort((a, b) => b.releaseYear - a.releaseYear);
      break;
    default:
      break;
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const current = Math.min(Math.max(1, page), totalPages);
  return {
    items: filtered.slice((current - 1) * perPage, current * perPage),
    total: filtered.length,
    page: current,
    perPage,
    totalPages,
  };
};

export const getTrendingProducts = (): Product[] =>
  getManagedProducts()
    .filter((p) => p.trending)
    .slice(0, 4)
    .map(toProduct);

export const getNewArrivals = (): Product[] =>
  getManagedProducts()
    .filter((p) => p.newArrival)
    .slice(0, 8)
    .map(toProduct);

export const getPreOwnedProducts = (): PreOwnedProduct[] =>
  getManagedProducts()
    .filter((p) => p.category === "preowned")
    .slice(0, 3)
    .map(toPreOwned);

export const getAllPreOwnedProducts = (): CatalogProduct[] =>
  getManagedProducts().filter((p) => p.category === "preowned");

export const getBrands = (): string[] =>
  Array.from(new Set(getManagedProducts().map((p) => p.brand)))
    .sort((a, b) => a.localeCompare(b))
    .slice(0, 12);
export const getReviews = (): Review[] => reviews;
export const getStats = () => stats;

export const formatPrice = (value: number): string =>
  `৳${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
