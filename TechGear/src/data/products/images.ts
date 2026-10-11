/**
 * Image registry + fallback chain.
 *
 * 1. Generated per-product image (src/assets/products/<imageKey>.jpg)
 * 2. Category fallback (the original studio assets)
 * 3. Neutral placeholder
 *
 * Every image in this catalog is AI-generated representative imagery.
 */

import camera from "@/assets/product-camera.jpg";
import earbuds from "@/assets/product-earbuds.jpg";
import headphones from "@/assets/product-headphones.jpg";
import laptop from "@/assets/product-laptop.jpg";
import phone from "@/assets/product-phone.jpg";
import tablet from "@/assets/product-tablet.jpg";
import watch from "@/assets/product-watch.jpg";

import type { CategoryId } from "./types";

/** Eagerly resolved URLs for any generated product image that exists. */
const generated = import.meta.glob("@/assets/products/*.{jpg,png,webp}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const byKey: Record<string, string> = {};
for (const [path, url] of Object.entries(generated)) {
  const key = path
    .split("/")
    .pop()!
    .replace(/\.(jpg|png|webp)$/, "");
  byKey[key] = url;
}

export const CATEGORY_FALLBACK: Record<CategoryId, string> = {
  smartphones: phone,
  laptops: laptop,
  tablets: tablet,
  watches: watch,
  audio: headphones,
  cameras: camera,
  gaming: laptop,
  accessories: earbuds,
  preowned: phone,
};

export const PLACEHOLDER_IMAGE = phone;

export function resolveProductImage(
  imageKey: string,
  category: CategoryId,
): string {
  if (imageKey.startsWith("data:")) return imageKey;
  return byKey[imageKey] ?? CATEGORY_FALLBACK[category] ?? PLACEHOLDER_IMAGE;
}

export function fallbackImage(category: CategoryId): string {
  return CATEGORY_FALLBACK[category] ?? PLACEHOLDER_IMAGE;
}

export const IMAGE_DISCLOSURE =
  "AI-generated representative image, not a manufacturer photograph";
