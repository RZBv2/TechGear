import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { ImagePlus, Pencil, Plus, Trash2, X, Download } from "lucide-react";

import { AdminLayout } from "@/components/techgear/AdminLayout";
import { formatPrice, getCatalogCategories } from "@/data/api";
import type {
  CatalogProduct,
  CategoryId,
  ConditionGrade,
  StockStatus,
} from "@/data/products/types";
import {
  addProduct,
  deleteProduct,
  generateProductId,
  getManagedProducts,
  isCustomProductId,
  updateProduct,
} from "@/lib/productAdmin";
import { exportProductsToExcel } from "@/lib/exportProducts";
import { bootTechGear, toast } from "@/scripts/motion";

export const Route = createFileRoute("/adminProducts")({
  head: () => ({ meta: [{ title: "Products — TechGear Admin" }] }),
  component: AdminProducts,
});

type FormState = {
  productName: string;
  brand: string;
  model: string;
  category: CategoryId;
  price: string;
  previousPrice: string;
  rating: string;
  reviewCount: string;
  stockStatus: StockStatus;
  condition: ConditionGrade;
  releaseYear: string;
  shortDescription: string;
};

const EMPTY_FORM: FormState = {
  productName: "",
  brand: "",
  model: "",
  category: "smartphones",
  price: "",
  previousPrice: "",
  rating: "4.5",
  reviewCount: "0",
  stockStatus: "in",
  condition: "New",
  releaseYear: String(new Date().getFullYear()),
  shortDescription: "",
};

function AdminProducts() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => bootTechGear(), []);

  const categories = getCatalogCategories();

  const refresh = async () => {
    try {
      await import("@/lib/productAdmin").then(({ syncManagedProducts }) =>
        syncManagedProducts(),
      );
      setProducts(getManagedProducts());
    } catch {
      setProducts(getManagedProducts());
    }
  };

  useEffect(() => {
    void refresh();
    const onStorage = () => {
      void refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const startAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImagePreview(null);
    setImageError(null);
    setShowForm(true);
  };

  const startEdit = (product: CatalogProduct) => {
    setEditingId(product.id);
    setForm({
      productName: product.productName,
      brand: product.brand,
      model: product.model,
      category: product.category,
      price: String(product.price),
      previousPrice: product.previousPrice ? String(product.previousPrice) : "",
      rating: String(product.rating),
      reviewCount: String(product.reviewCount),
      stockStatus: product.stockStatus,
      condition: product.condition,
      releaseYear: String(product.releaseYear),
      shortDescription: product.shortDescription,
    });
    setImagePreview(
      product.imageKey.startsWith("data:") ? product.imageKey : null,
    );
    setImageError(null);
    setShowForm(true);
  };

  const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4MB
  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImageError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("That image is too large — please choose one under 4MB.");
      return;
    }
    setImageError(null);
    const reader = new FileReader();
    reader.onload = () =>
      setImagePreview(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    const patch = {
      productName: form.productName.trim(),
      brand: form.brand.trim(),
      model: form.model.trim() || form.productName.trim(),
      category: form.category,
      subcategory:
        categories.find((c) => c.id === form.category)?.name ?? form.category,
      price: Number(form.price) || 0,
      ...(form.previousPrice
        ? { previousPrice: Number(form.previousPrice) }
        : {}),
      rating: Math.min(5, Math.max(0, Number(form.rating) || 0)),
      reviewCount: Math.max(0, Number(form.reviewCount) || 0),
      stockStatus: form.stockStatus,
      condition: form.condition,
      releaseYear: Number(form.releaseYear) || new Date().getFullYear(),
      shortDescription: form.shortDescription.trim(),
      ...(imagePreview
        ? {
            imageKey: imagePreview,
            productImages: [imagePreview],
            galleryImages: [imagePreview],
          }
        : {}),
    };

    try {
      if (editingId) {
        await updateProduct(editingId, patch);
        toast("Product updated.");
      } else {
        const id = generateProductId();
        const newProduct: CatalogProduct & { stockQuantity: number } = {
          id,
          ...patch,
          stockQuantity:
            form.stockStatus === "out"
              ? 0
              : form.stockStatus === "low"
                ? 5
                : 20,
          currency: "BDT",
          priceSource: "reference",
          lastVerified: new Date().toISOString().slice(0, 10),
          specifications: {},
          imageKey: imagePreview ?? "custom-placeholder",
          productImages: [imagePreview ?? "custom-placeholder"],
          galleryImages: [imagePreview ?? "custom-placeholder"],
          imageMeta: {
            source: "ai-generated",
            representative: !imagePreview,
            note: imagePreview
              ? "Uploaded by admin"
              : "Placeholder — no photo uploaded yet",
          },
        };
        await addProduct(newProduct);
        toast("Product added.");
      }

      setShowForm(false);
      setEditingId(null);
      setImagePreview(null);
      await refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Unable to save product.");
    } finally {
      setSaving(false);
    }
  };

  const filtered = products.filter((p) =>
    search.trim()
      ? `${p.productName} ${p.brand}`
          .toLowerCase()
          .includes(search.trim().toLowerCase())
      : true,
  );
  const PAGE_SIZE = 25;
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [search]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <AdminLayout title="Products">
      <div className="admin-section-head">
        <label className="form-field" style={{ maxWidth: 280 }}>
          <span>Search products</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name or brand…"
          />
        </label>
        <button
          className="btn btn--ghost"
          type="button"
          onClick={() =>
            exportProductsToExcel(
              products,
              (id) => categories.find((c) => c.id === id)?.name ?? id,
            )
          }
          disabled={products.length === 0}
        >
          <Download size={16} />
          Export all to Excel
        </button>
        <button className="btn btn--primary" type="button" onClick={startAdd}>
          <Plus size={16} />
          Add product
        </button>
      </div>

      {showForm ? (
        <form
          className="panel account-form admin-product-form"
          onSubmit={handleSubmit}
        >
          <h2 className="section-title" style={{ fontSize: "var(--step-0)" }}>
            {editingId ? "Edit product" : "Add a new product"}
          </h2>
          <div className="admin-product-form__grid">
            <label className="form-field">
              <span>Product name</span>
              <input
                type="text"
                value={form.productName}
                onChange={(event) =>
                  setForm({ ...form, productName: event.target.value })
                }
                required
              />
            </label>
            <label className="form-field">
              <span>Brand</span>
              <input
                type="text"
                value={form.brand}
                onChange={(event) =>
                  setForm({ ...form, brand: event.target.value })
                }
                required
              />
            </label>
            <label className="form-field">
              <span>Model</span>
              <input
                type="text"
                value={form.model}
                onChange={(event) =>
                  setForm({ ...form, model: event.target.value })
                }
              />
            </label>
            <label className="form-field">
              <span>Category</span>
              <select
                value={form.category}
                onChange={(event) =>
                  setForm({
                    ...form,
                    category: event.target.value as CategoryId,
                  })
                }
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>Price (৳)</span>
              <input
                type="number"
                min={0}
                value={form.price}
                onChange={(event) =>
                  setForm({ ...form, price: event.target.value })
                }
                required
              />
            </label>
            <label className="form-field">
              <span>Was price (৳, optional)</span>
              <input
                type="number"
                min={0}
                value={form.previousPrice}
                onChange={(event) =>
                  setForm({ ...form, previousPrice: event.target.value })
                }
              />
            </label>
            <label className="form-field">
              <span>Rating (0–5)</span>
              <input
                type="number"
                min={0}
                max={5}
                step={0.1}
                value={form.rating}
                onChange={(event) =>
                  setForm({ ...form, rating: event.target.value })
                }
              />
            </label>
            <label className="form-field">
              <span>Review count</span>
              <input
                type="number"
                min={0}
                value={form.reviewCount}
                onChange={(event) =>
                  setForm({ ...form, reviewCount: event.target.value })
                }
              />
            </label>
            <label className="form-field">
              <span>Stock status</span>
              <select
                value={form.stockStatus}
                onChange={(event) =>
                  setForm({
                    ...form,
                    stockStatus: event.target.value as StockStatus,
                  })
                }
              >
                <option value="in">In stock</option>
                <option value="low">Low stock</option>
                <option value="out">Out of stock</option>
              </select>
            </label>
            <label className="form-field">
              <span>Condition</span>
              <select
                value={form.condition}
                onChange={(event) =>
                  setForm({
                    ...form,
                    condition: event.target.value as ConditionGrade,
                  })
                }
              >
                <option value="New">New</option>
                <option value="Excellent">Excellent</option>
                <option value="Very Good">Very Good</option>
                <option value="Good">Good</option>
              </select>
            </label>
            <label className="form-field">
              <span>Release year</span>
              <input
                type="number"
                value={form.releaseYear}
                onChange={(event) =>
                  setForm({ ...form, releaseYear: event.target.value })
                }
              />
            </label>
            <label className="form-field form-field--wide">
              <span>Short description</span>
              <textarea
                value={form.shortDescription}
                onChange={(event) =>
                  setForm({ ...form, shortDescription: event.target.value })
                }
                rows={2}
              />
            </label>
            <div className="form-field form-field--wide">
              <span>Product photo</span>
              {imagePreview ? (
                <div className="sell-form__photo-preview">
                  <img src={imagePreview} alt="Product" />
                  <button
                    type="button"
                    className="sell-form__photo-remove"
                    aria-label="Remove photo"
                    onClick={() => setImagePreview(null)}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="sell-form__photo-upload">
                  <ImagePlus size={20} aria-hidden="true" />
                  <span>Upload a product photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    hidden
                  />
                </label>
              )}
              {imageError ? (
                <p className="auth-forms__error" role="alert">
                  {imageError}
                </p>
              ) : null}
            </div>
          </div>
          <div className="product-detail__actions">
            <button
              className="btn btn--primary"
              type="submit"
              disabled={saving}
            >
              {saving ? "Saving…" : editingId ? "Save changes" : "Add product"}
            </button>
            <button
              className="btn btn--ghost"
              type="button"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <div
        className="admin-table-wrap"
        style={{ marginTop: "var(--space-lg)" }}
      >
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Brand</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((product) => (
              <tr key={product.id}>
                <td>
                  {product.productName}
                  {isCustomProductId(product.id) ? (
                    <span className="badge badge--success">Custom</span>
                  ) : null}
                </td>
                <td>{product.brand}</td>
                <td>
                  {categories.find((c) => c.id === product.category)?.name ??
                    product.category}
                </td>
                <td>{formatPrice(product.price)}</td>
                <td>
                  {product.stockStatus === "in"
                    ? "In stock"
                    : product.stockStatus === "low"
                      ? "Low"
                      : "Out"}
                </td>
                <td>
                  <div className="admin-table__actions">
                    <button
                      className="icon-btn"
                      type="button"
                      aria-label={`Edit ${product.productName}`}
                      onClick={() => startEdit(product)}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="icon-btn"
                      type="button"
                      aria-label={`Delete ${product.productName}`}
                      onClick={async () => {
                        if (!window.confirm(`Remove ${product.productName}?`))
                          return;
                        try {
                          await deleteProduct(product.id);
                          toast(`${product.productName} removed.`);
                          await refresh();
                        } catch (error) {
                          toast(
                            error instanceof Error
                              ? error.message
                              : "Unable to remove product.",
                          );
                        }
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length > PAGE_SIZE ? (
        <nav className="pager" aria-label="Products pagination">
          <button
            className="btn btn--ghost"
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span className="pager__status">
            Page {currentPage} of {totalPages} · {filtered.length} products
          </span>
          <button
            className="btn btn--ghost"
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </nav>
      ) : null}
    </AdminLayout>
  );
}
