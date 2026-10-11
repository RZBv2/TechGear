import type { CategoryId } from "./types";

export type CatalogCategory = {
  id: CategoryId;
  name: string;
  slug: string;
  description: string;
  icon: string;
};

export const catalogCategories: CatalogCategory[] = [
  {
    id: "smartphones",
    name: "Smartphones",
    slug: "smartphones",
    description: "Latest mobile technology",
    icon: "smartphone",
  },
  {
    id: "laptops",
    name: "Laptops",
    slug: "laptops",
    description: "Power for work and play",
    icon: "laptop",
  },
  {
    id: "tablets",
    name: "Tablets",
    slug: "tablets",
    description: "Portable creative canvas",
    icon: "tablet",
  },
  {
    id: "watches",
    name: "Smart Watches",
    slug: "watches",
    description: "Health on your wrist",
    icon: "watch",
  },
  {
    id: "audio",
    name: "Headphones",
    slug: "audio",
    description: "Studio sound, anywhere",
    icon: "headphones",
  },
  {
    id: "cameras",
    name: "Cameras",
    slug: "cameras",
    description: "Capture in full detail",
    icon: "camera",
  },
  {
    id: "gaming",
    name: "Gaming",
    slug: "gaming",
    description: "Built for framerates",
    icon: "gamepad",
  },
  {
    id: "accessories",
    name: "Accessories",
    slug: "accessories",
    description: "The finishing pieces",
    icon: "cable",
  },
  {
    id: "preowned",
    name: "Certified Pre-Owned",
    slug: "preowned",
    description: "Inspected, graded, warrantied",
    icon: "recycle",
  },
];
