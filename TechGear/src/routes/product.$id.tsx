import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Heart, ShieldCheck, ShoppingCart, Truck } from "lucide-react";

import {
  Footer,
  Header,
  MobileDrawer,
  ProductCard,
  Stars,
} from "@/components/techgear/Sections";
import { ProductReviews } from "@/components/techgear/ProductReviews";
import {
  formatPrice,
  getCatalogCategories,
  getProductById,
  getRelated,
  toProduct,
  IMAGE_DISCLOSURE,
} from "@/data/api";
import { fallbackImage, resolveProductImage } from "@/data/products/images";
import { useStore } from "@/lib/store";
import { getProductReviews } from "@/lib/productReviews";
import { getRecentlyViewed, recordProductView } from "@/lib/recentlyViewed";
import { bootTechGear, toast } from "@/scripts/motion";
export const Route = createFileRoute("/product/$id")({
  head: ({ params }) => {
    const product = getProductById(params.id);
    const name = product?.productName ?? "Product";
    return {
      meta: [
        { title: `${name} — TechGear` },
        {
          name: "description",
          content:
            product?.shortDescription ?? "View product details at TechGear.",
        },
        { property: "og:title", content: `${name} — TechGear` },
        {
          property: "og:description",
          content:
            product?.shortDescription ?? "View product details at TechGear.",
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: ProductDetailPage,
});

const SPEC_LABELS: Record<string, string> = {
  processor: "Processor",
  ram: "RAM",
  storage: "Storage",
  display: "Display",
  displaySize: "Display size",
  camera: "Camera",
  battery: "Battery",
  connectivity: "Connectivity",
  operatingSystem: "Operating system",
  sensor: "Sensor",
  lensMount: "Lens mount",
  videoRecording: "Video recording",
  drivers: "Drivers",
  noiseCancelling: "Noise cancelling",
  weight: "Weight",
  ports: "Ports",
  refreshRate: "Refresh rate",
  waterResistance: "Water resistance",
};

function ProductDetailPage() {
  const { id } = Route.useParams();
  const item = getProductById(id);
  const { addToCart, toggleWishlist, isWishlisted } = useStore();
  const navigate = useNavigate();
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [extraReviewCount, setExtraReviewCount] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    void import("@/lib/productAdmin")
      .then(({ syncManagedProducts }) => syncManagedProducts())
      .catch(() => undefined)
      .finally(() => setHydrated(true));
    bootTechGear();
  }, []);

  useEffect(() => {
    if (!item) return;
    recordProductView(item.id);
    setRecentIds(getRecentlyViewed().filter((rid) => rid !== item.id));
    setExtraReviewCount(getProductReviews(item.id).length);
  }, [item?.id]);

  const recentlyViewed = useMemo(
    () =>
      recentIds
        .map((rid) => getProductById(rid))
        .filter((p): p is NonNullable<typeof p> => Boolean(p))
        .slice(0, 4)
        .map(toProduct),
    [recentIds],
  );

  if (!hydrated) {
    return (
      <>
        <Header />
        <MobileDrawer />
        <main className="section section--below-header">
          <div className="container">
            <div className="panel empty-state" role="status">
              <h1 className="section-title">Loading product</h1>
              <p className="section-lead">
                Checking the latest TechGear catalog.
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!item) {
    return (
      <>
        <Header />
        <MobileDrawer />
        <main className="section section--below-header">
          <div className="container">
            <h1 className="section-title">Product not found</h1>
            <p className="section-lead">
              We couldn't find that product — it may have been removed.
            </p>
            <Link className="btn btn--ghost" to="/shop" search={{ page: 1 }}>
              Browse all products
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const product = toProduct(item);
  const category = getCatalogCategories().find((c) => c.id === item.category);
  const image = resolveProductImage(item.imageKey, item.category);
  const specs = Object.entries(item.specifications).filter(
    ([, value]) => value !== undefined,
  );
  const related = getRelated(item, 4).map(toProduct);
  const wished = isWishlisted(product.id);

  return (
    <>
      <Header />
      <MobileDrawer />
      <main className="section section--below-header">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/shop" search={{ page: 1 }}>
              Shop
            </Link>
            {category ? (
              <>
                {" / "}
                <Link
                  to="/category/$slug"
                  params={{ slug: category.id }}
                  search={{ page: 1 }}
                >
                  {category.name}
                </Link>
              </>
            ) : null}
            {" / "}
            <span>{product.name}</span>
          </nav>

          <div className="product-detail">
            <div className="product-detail__media panel">
              <img
                src={image}
                alt={`${product.name} — ${IMAGE_DISCLOSURE}`}
                title={IMAGE_DISCLOSURE}
                width={800}
                height={800}
                fetchPriority="high"
                decoding="async"
                onError={(event) => {
                  event.currentTarget.src = fallbackImage(item.category);
                }}
              />
            </div>

            <div className="product-detail__info">
              <p className="product-card__brand">
                {product.brand}
                <Stars rating={product.rating} />
              </p>
              <h1 className="product-detail__title">{product.name}</h1>
              <p
                className={`stock${product.stock === "low" ? " stock--low" : ""}`}
              >
                <span className="stock__dot" aria-hidden="true" />
                {product.stock === "low"
                  ? "Low stock"
                  : product.stock === "out"
                    ? "Out of stock"
                    : "In stock"}{" "}
                ·{" "}
                <a href="#reviews">
                  {product.reviews + extraReviewCount} reviews
                </a>
              </p>

              <p className="price price--lg">
                {formatPrice(product.price)}
                {product.wasPrice ? (
                  <span className="price__was">
                    {formatPrice(product.wasPrice)}
                  </span>
                ) : null}
              </p>

              <p className="product-detail__desc">
                {item.fullDescription ?? item.shortDescription}
              </p>

              {item.colors?.length ? (
                <div className="product-detail__colors">
                  <span>Colors</span>
                  <ul>
                    {item.colors.map((color) => (
                      <li key={color} className="badge">
                        {color}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="product-detail__actions">
                <button
                  className="btn btn--ghost"
                  type="button"
                  onClick={() => {
                    addToCart(product);
                    toast(`${product.name} added to your cart.`);
                  }}
                >
                  <ShoppingCart size={10} />
                  Add to Cart
                </button>
                <button
                  className="btn btn--primary"
                  type="button"
                  onClick={() => {
                    addToCart(product);
                    navigate({ to: "/cart" });
                  }}
                >
                  Get Yours
                </button>
                <button
                  className={`btn btn--ghost${wished ? " is-active" : ""}`}
                  type="button"
                  aria-pressed={wished}
                  onClick={() => {
                    toggleWishlist(product);
                    toast(
                      `${product.name} ${wished ? "removed from" : "saved to"} your wishlist.`,
                    );
                  }}
                >
                  <Heart size={16} />
                  {wished ? "Wishlisted" : "Wishlist"}
                </button>
              </div>

              <ul className="product-detail__trust">
                <li>
                  <ShieldCheck size={16} />{" "}
                  {item.warranty ?? "Manufacturer warranty"}
                </li>
                <li>
                  <Truck size={16} /> Condition: {item.condition}
                </li>
              </ul>

              {specs.length ? (
                <div className="product-detail__specs">
                  <h2>Specifications</h2>
                  <dl>
                    {specs.map(([key, value]) => (
                      <div key={key} className="product-detail__spec-row">
                        <dt>{SPEC_LABELS[key] ?? key}</dt>
                        <dd>
                          {typeof value === "boolean"
                            ? value
                              ? "Yes"
                              : "No"
                            : String(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null}
            </div>
          </div>

          <ProductReviews productId={product.id} productName={product.name} />

          {related.length ? (
            <section className="section--tight">
              <header className="section-head">
                <h2 className="section-title">You may also like</h2>
              </header>
              <div className="grid-products">
                {related.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          ) : null}

          {recentlyViewed.length ? (
            <section className="section--tight">
              <header className="section-head">
                <h2 className="section-title">Recently viewed</h2>
              </header>
              <div className="grid-products">
                {recentlyViewed.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </main>
      <Footer />
    </>
  );
}
