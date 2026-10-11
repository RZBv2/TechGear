import { readJSON, writeJSON } from "@/lib/storage";

export type ProductReview = {
  id: string;
  productId: string;
  author: string;
  rating: number; // 1-5
  text: string;
  submittedAt: string;
};

const KEY = "techgear_product_reviews";

type ReviewsByProduct = Record<string, ProductReview[]>;

export function getProductReviews(productId: string): ProductReview[] {
  const all = readJSON<ReviewsByProduct>(KEY, {});
  return all[productId] ?? [];
}

export function addProductReview(review: ProductReview): void {
  const all = readJSON<ReviewsByProduct>(KEY, {});
  all[review.productId] = [review, ...(all[review.productId] ?? [])];
  writeJSON(KEY, all);
}

export function generateReviewId(): string {
  return `RV-${Date.now().toString(36).toUpperCase()}`;
}
