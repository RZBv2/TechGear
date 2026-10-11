import { accessories } from "./accessories";
import { audio } from "./audio";
import { cameras } from "./cameras";
import { catalogCategories, type CatalogCategory } from "./categories";
import { gaming } from "./gaming";
import { laptops } from "./laptops";
import { preowned } from "./preowned";
import { smartphones } from "./smartphones";
import { tablets } from "./tablets";
import { watches } from "./watches";
import type { CatalogProduct, CategoryId } from "./types";

export const productsByCategory: Record<CategoryId, CatalogProduct[]> = {
  smartphones,
  laptops,
  tablets,
  watches,
  audio,
  cameras,
  gaming,
  accessories,
  preowned,
};

export const allProducts: CatalogProduct[] = catalogCategories.flatMap(
  (category) => productsByCategory[category.id],
);

export const categoryCounts: Record<CategoryId, number> = Object.fromEntries(
  catalogCategories.map((c) => [c.id, productsByCategory[c.id].length]),
) as Record<CategoryId, number>;

export const catalogBrands: string[] = Array.from(
  new Set(allProducts.map((product) => product.brand)),
).sort((a, b) => a.localeCompare(b));

export { catalogCategories };
export type { CatalogCategory, CatalogProduct, CategoryId };
