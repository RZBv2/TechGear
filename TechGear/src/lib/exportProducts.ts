import * as XLSX from "xlsx";

import type { CatalogProduct } from "@/data/products/types";

export function exportProductsToExcel(
  products: CatalogProduct[],
  categoryName: (id: string) => string,
) {
  const rows = products.map((product) => ({
    Product: product.productName,
    Brand: product.brand,
    Model: product.model,
    Category: categoryName(product.category),
    "Price (BDT)": product.price,
    "Was Price (BDT)": product.previousPrice ?? "",
    Rating: product.rating,
    Reviews: product.reviewCount,
    Stock:
      product.stockStatus === "in"
        ? "In stock"
        : product.stockStatus === "low"
          ? "Low stock"
          : "Out of stock",
    Condition: product.condition,
    "Release Year": product.releaseYear,
  }));

  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet["!cols"] = [
    { wch: 30 },
    { wch: 16 },
    { wch: 20 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 8 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Products");

  const filename = `techgear-products-${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, filename);
}
