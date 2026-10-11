/**
 * Central product schema for the TechGear catalog.
 * UI never hardcodes product data — everything flows through `src/data/api.ts`.
 */

export type CategoryId =
  | "smartphones"
  | "laptops"
  | "tablets"
  | "watches"
  | "audio"
  | "cameras"
  | "gaming"
  | "accessories"
  | "preowned";

export type StockStatus = "in" | "low" | "out";

export type ConditionGrade = "New" | "Excellent" | "Very Good" | "Good";

/** Every image in this catalog is AI-generated representative imagery. */
export type ImageMeta = {
  source: "ai-generated";
  representative: true;
  note: string;
};

export const AI_IMAGE_META: ImageMeta = {
  source: "ai-generated",
  representative: true,
  note: "AI-generated representative image, not a manufacturer photograph",
};

export type SourceRef = {
  sourceName: string;
  sourceUrl: string;
};

/** Only category-relevant keys are populated per product. */
export type Specifications = {
  processor?: string;
  ram?: string;
  storage?: string;
  display?: string;
  displaySize?: number;
  camera?: string;
  battery?: string;
  connectivity?: string;
  operatingSystem?: string;
  sensor?: string;
  lensMount?: string;
  videoRecording?: string;
  drivers?: string;
  noiseCancelling?: boolean;
  weight?: string;
  ports?: string;
  refreshRate?: string;
  waterResistance?: string;
  [key: string]: string | number | boolean | undefined;
};

export type PreOwnedInfo = {
  conditionGrade: Exclude<ConditionGrade, "New">;
  batteryHealth?: number;
  inspectionStatus: string;
  cosmeticCondition: string;
};

export type CatalogProduct = {
  id: string;
  brand: string;
  productName: string;
  model: string;
  category: CategoryId;
  subcategory: string;

  price: number;
  previousPrice?: number;
  discountPercentage?: number;
  currency: "BDT";
  /** Reference pricing — never presented as an official quote. */
  priceSource: "reference";
  lastVerified: string;

  rating: number;
  reviewCount: number;
  stockStatus: StockStatus;

  shortDescription: string;
  fullDescription?: string;
  specifications: Specifications;
  colors?: string[];
  warranty?: string;
  condition: ConditionGrade;
  releaseYear: number;

  featured?: boolean;
  trending?: boolean;
  newArrival?: boolean;

  /** Key into the generated-image registry; falls back by category. */
  imageKey: string;
  productImages: string[];
  galleryImages: string[];
  imageMeta: ImageMeta;

  specRef?: SourceRef;
  preOwned?: PreOwnedInfo;
};

/** Input shape used by the category files — defaults are filled by `build()`. */
export type ProductSeed = Omit<
  CatalogProduct,
  | "currency"
  | "priceSource"
  | "lastVerified"
  | "condition"
  | "imageMeta"
  | "productImages"
  | "galleryImages"
  | "discountPercentage"
> & {
  condition?: ConditionGrade;
  discountPercentage?: number;
  lastVerified?: string;
};

export const CATALOG_VERIFIED_ON = "2026-08-11";

export function build(seed: ProductSeed): CatalogProduct {
  const discount =
    seed.discountPercentage ??
    (seed.previousPrice && seed.previousPrice > seed.price
      ? Math.round(
          ((seed.previousPrice - seed.price) / seed.previousPrice) * 100,
        )
      : undefined);

  return {
    ...seed,
    currency: "BDT",
    priceSource: "reference",
    lastVerified: seed.lastVerified ?? CATALOG_VERIFIED_ON,
    condition: seed.condition ?? "New",
    ...(discount !== undefined ? { discountPercentage: discount } : {}),
    productImages: [seed.imageKey],
    galleryImages: [seed.imageKey],
    imageMeta: AI_IMAGE_META,
  };
}
