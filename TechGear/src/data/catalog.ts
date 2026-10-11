/**
 * Mock catalogue data. Shapes mirror the future REST payloads so `api.ts`
 * can be swapped to real `fetch()` calls without touching the UI.
 */

import phone from "@/assets/product-phone.jpg";
import laptop from "@/assets/product-laptop.jpg";
import watch from "@/assets/product-watch.jpg";
import headphones from "@/assets/product-headphones.jpg";
import camera from "@/assets/product-camera.jpg";
import tablet from "@/assets/product-tablet.jpg";
import earbuds from "@/assets/product-earbuds.jpg";

export type Product = {
  id: string;
  brand: string;
  name: string;
  image: string;
  price: number;
  wasPrice?: number;
  rating: number;
  reviews: number;
  stock: "in" | "low" | "out";
  tag?: string;
};

export type PreOwnedProduct = Product & {
  condition: string;
  battery: number;
  warranty: string;
};

export type Category = {
  id: string;
  name: string;
  desc: string;
  count: number;
};

export type Review = {
  id: string;
  name: string;
  initials: string;
  location: string;
  rating: number;
  text: string;
};

export const categories: Category[] = [
  {
    id: "smartphones",
    name: "Smartphones",
    desc: "Latest mobile technology",
    count: 148,
  },
  {
    id: "laptops",
    name: "Laptops",
    desc: "Power for work and play",
    count: 96,
  },
  {
    id: "tablets",
    name: "Tablets",
    desc: "Portable creative canvas",
    count: 54,
  },
  {
    id: "watches",
    name: "Smart Watches",
    desc: "Health on your wrist",
    count: 61,
  },
  {
    id: "audio",
    name: "Headphones",
    desc: "Studio sound, anywhere",
    count: 132,
  },
  { id: "cameras", name: "Cameras", desc: "Capture in full detail", count: 47 },
  { id: "gaming", name: "Gaming", desc: "Built for framerates", count: 78 },
  {
    id: "accessories",
    name: "Accessories",
    desc: "The finishing pieces",
    count: 210,
  },
];

export const trending: Product[] = [
  {
    id: "p1",
    brand: "Apex",
    name: "Apex Pro 16 Titanium",
    image: phone,
    price: 1249,
    wasPrice: 1399,
    rating: 4.9,
    reviews: 412,
    stock: "in",
    tag: "-11%",
  },
  {
    id: "p2",
    brand: "Nova",
    name: "Nova Book Air M4",
    image: laptop,
    price: 1899,
    rating: 4.8,
    reviews: 236,
    stock: "low",
  },
  {
    id: "p3",
    brand: "Lumen",
    name: "Lumen Studio Headphones",
    image: headphones,
    price: 349,
    wasPrice: 429,
    rating: 4.7,
    reviews: 918,
    stock: "in",
    tag: "-19%",
  },
  {
    id: "p4",
    brand: "Orbit",
    name: "Orbit Watch Ultra 3",
    image: watch,
    price: 599,
    rating: 4.6,
    reviews: 305,
    stock: "in",
  },
];

export const newArrivals: Product[] = [
  {
    id: "n1",
    brand: "Vantage",
    name: "Vantage X Mirrorless",
    image: camera,
    price: 2149,
    rating: 4.9,
    reviews: 87,
    stock: "low",
    tag: "New",
  },
  {
    id: "n2",
    brand: "Nova",
    name: "Nova Slate 12 Pro",
    image: tablet,
    price: 979,
    rating: 4.7,
    reviews: 142,
    stock: "in",
    tag: "New",
  },
  {
    id: "n3",
    brand: "Lumen",
    name: "Lumen Buds Pro 2",
    image: earbuds,
    price: 219,
    rating: 4.5,
    reviews: 524,
    stock: "in",
    tag: "New",
  },
  {
    id: "n4",
    brand: "Apex",
    name: "Apex Air 5G",
    image: phone,
    price: 749,
    rating: 4.4,
    reviews: 198,
    stock: "in",
    tag: "New",
  },
];

export const preOwned: PreOwnedProduct[] = [
  {
    id: "c1",
    brand: "Apex",
    name: "Apex Pro 14",
    image: phone,
    price: 689,
    wasPrice: 1099,
    rating: 4.8,
    reviews: 64,
    stock: "in",
    condition: "Excellent",
    battery: 94,
    warranty: "12 months",
  },
  {
    id: "c2",
    brand: "Nova",
    name: "Nova Book 14 M2",
    image: laptop,
    price: 1049,
    wasPrice: 1599,
    rating: 4.7,
    reviews: 38,
    stock: "low",
    condition: "Very good",
    battery: 89,
    warranty: "12 months",
  },
  {
    id: "c3",
    brand: "Orbit",
    name: "Orbit Watch 2 44mm",
    image: watch,
    price: 229,
    wasPrice: 429,
    rating: 4.6,
    reviews: 51,
    stock: "in",
    condition: "Good",
    battery: 91,
    warranty: "6 months",
  },
];

export const brands = [
  "Apex",
  "Nova",
  "Lumen",
  "Orbit",
  "Vantage",
  "Kite",
  "Helios",
  "Nimbus",
];

export const reviews: Review[] = [
  {
    id: "r1",
    name: "Tamim Iqbal",
    initials: "TI",
    location: "Char Ghat, Rajshahi",
    rating: 5,
    text: "Sold my old laptop and bought a certified pre-owned Nova the same week. The valuation was fair and payment landed in two days.",
  },
  {
    id: "r2",
    name: "Raja Hossen",
    initials: "RH",
    location: "Thanar Mor, Rajshahi",
    rating: 5,
    text: "The TechGear team helped me find a pre-owned Apex Pro 14 at a great price. The device was in excellent condition and the warranty gave me peace of mind.",
  },
  {
    id: "r3",
    name: "Polash Ali",
    initials: "PA",
    location: "Nawhata, Rajshahi",
    rating: 4,
    text: "The buyback flow is the clearest I have used. I knew what my device was worth before I shipped it.",
  },
  {
    id: "r4",
    name: "T. Supti",
    initials: "TS",
    location: "New Market, Rajshahi",
    rating: 5,
    text: "Ordered the Apex Pro on a Friday, tracked it the whole way, unboxed it Monday. No noise, no upsells.",
  },
];

export const stats = [
  { value: 10, suffix: "K+", label: "Happy customers" },
  { value: 500, suffix: "+", label: "Products listed" },
  { value: 98, suffix: "%", label: "Positive reviews" },
  { value: 30, suffix: "-Day", label: "Warranty included" },
];
