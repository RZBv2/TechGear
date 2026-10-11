import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { CatalogProduct } from "@/data/products/types";

type ProductWithStock = CatalogProduct & { stockQuantity: number };

const productInput = z.object({
  id: z.string().min(1),
  brand: z.string().min(1),
  productName: z.string().min(1),
  model: z.string().min(1),
  category: z.string().min(1),
  subcategory: z.string().min(1),
  price: z.number().int().nonnegative(),
  previousPrice: z.number().int().nonnegative().optional(),
  discountPercentage: z.number().int().min(0).max(100).optional(),
  shortDescription: z.string().min(1),
  fullDescription: z.string().optional(),
  specifications: z
    .record(z.union([z.string(), z.number(), z.boolean()]))
    .default({}),
  colors: z.array(z.string()).default([]),
  warranty: z.string().optional(),
  condition: z.enum(["New", "Excellent", "Very Good", "Good"]),
  releaseYear: z.number().int(),
  rating: z.number().min(0).max(5).default(0),
  reviewCount: z.number().int().nonnegative().default(0),
  stockQuantity: z.number().int().nonnegative().default(0),
  featured: z.boolean().default(false),
  trending: z.boolean().default(false),
  newArrival: z.boolean().default(false),
  imageKey: z.string().min(1),
  productImages: z.array(z.string()).default([]),
  galleryImages: z.array(z.string()).default([]),
  imageMeta: z.record(z.unknown()).default({}),
  specRef: z.record(z.string()).optional(),
  preOwned: z.record(z.unknown()).optional(),
});

export const listCatalogProducts = createServerFn({ method: "GET" })
  .inputValidator(z.object({ search: z.string().optional() }).optional())
  .handler(async ({ data }): Promise<ProductWithStock[]> => {
    const { listProducts } = await import("@/server/db");
    return listProducts(data?.search);
  });

export const getCatalogProduct = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }): Promise<ProductWithStock | null> => {
    const { getProduct } = await import("@/server/db");
    return getProduct(data.id);
  });

export const createCatalogProduct = createServerFn({ method: "POST" })
  .inputValidator(productInput)
  .handler(async ({ data }): Promise<ProductWithStock | null> => {
    const { requireAdmin } = await import("@/server/auth");
    const admin = requireAdmin();
    const { createProduct } = await import("@/server/db");
    return createProduct(
      data as CatalogProduct & { stockQuantity: number },
      admin.id,
    );
  });

export const updateCatalogProduct = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ id: z.string().min(1), patch: productInput.partial() }),
  )
  .handler(async ({ data }): Promise<ProductWithStock | null> => {
    const { requireAdmin } = await import("@/server/auth");
    const admin = requireAdmin();
    const { updateProduct } = await import("@/server/db");
    return updateProduct(
      data.id,
      data.patch as Partial<CatalogProduct> & { stockQuantity?: number },
      admin.id,
    );
  });

export const deleteCatalogProduct = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }): Promise<boolean> => {
    const { requireAdmin } = await import("@/server/auth");
    const admin = requireAdmin();
    const { deleteProduct } = await import("@/server/db");
    return deleteProduct(data.id, admin.id);
  });
