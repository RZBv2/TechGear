import { allProducts } from "@/data/products";
import type { CatalogProduct } from "@/data/products/types";
import {
  createCatalogProduct,
  deleteCatalogProduct,
  listCatalogProducts,
  updateCatalogProduct,
} from "@/lib/serverCatalog";

type ProductWithStock = CatalogProduct & { stockQuantity: number };

let managedProductsCache: CatalogProduct[] = allProducts;
let catalogSyncPromise: Promise<CatalogProduct[]> | null = null;

export function isCustomProductId(id: string): boolean {
  return id.startsWith("custom-");
}

export function generateProductId(): string {
  return `custom-${Date.now().toString(36)}`;
}

export function getManagedProducts(): CatalogProduct[] {
  return managedProductsCache;
}

export function syncManagedProducts(
  search?: string,
): Promise<CatalogProduct[]> {
  if (catalogSyncPromise) return catalogSyncPromise;
  catalogSyncPromise = listCatalogProducts({
    data: search ? { search } : undefined,
  })
    .then((rows) => {
      managedProductsCache = rows.map(
        ({ stockQuantity: _stockQuantity, ...product }) => product,
      );
      return managedProductsCache;
    })
    .catch((error) => {
      catalogSyncPromise = null;
      throw error;
    });
  return catalogSyncPromise;
}

export async function addProduct(
  product: CatalogProduct,
): Promise<CatalogProduct | null> {
  const created = await createCatalogProduct({
    data: product as CatalogProduct & { stockQuantity: number },
  });
  if (created)
    managedProductsCache = [
      created,
      ...managedProductsCache.filter((item) => item.id !== created.id),
    ];
  return created;
}

export async function updateProduct(
  id: string,
  patch: Partial<CatalogProduct> & { stockQuantity?: number },
): Promise<CatalogProduct | null> {
  const updated = await updateCatalogProduct({ data: { id, patch } });
  if (updated)
    managedProductsCache = managedProductsCache.map((item) =>
      item.id === id ? updated : item,
    );
  return updated;
}

export async function deleteProduct(id: string): Promise<boolean> {
  await deleteCatalogProduct({ data: { id } });
  managedProductsCache = managedProductsCache.filter((item) => item.id !== id);
  return true;
}

export function hasEdits(_id: string): boolean {
  return false;
}

export type { ProductWithStock };
