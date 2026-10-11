import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Scale, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Header, MobileDrawer, Footer } from "@/components/techgear/Sections";
import { formatPrice, toProduct } from "@/data/api";
import { getManagedProducts } from "@/lib/productAdmin";
import {
  clearCompare,
  getCompareIds,
  removeCompare,
  subscribeCompare,
} from "@/lib/compare";
import { bootTechGear } from "@/scripts/motion";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare Products — TechGear" },
      {
        name: "description",
        content: "Compare TechGear products side by side.",
      },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    setIds(getCompareIds());
    const unsubscribe = subscribeCompare(() => setIds(getCompareIds()));
    bootTechGear();
    return unsubscribe;
  }, []);
  const products = getManagedProducts()
    .filter((product) => ids.includes(product.id))
    .map(toProduct);
  const remove = (id: string) => {
    removeCompare(id);
    setIds(getCompareIds());
  };
  return (
    <>
      <Header />
      <MobileDrawer />
      <main className="section section--below-header">
        <div className="container">
          <header className="section-head section-head--split">
            <div>
              <span className="eyebrow">Decision tools</span>
              <h1 className="section-title">Compare products</h1>
              <p className="section-lead">
                See the differences clearly before you choose. Compare up to
                four products.
              </p>
            </div>
            {products.length ? (
              <button
                className="btn btn--ghost"
                type="button"
                onClick={() => {
                  clearCompare();
                  setIds([]);
                }}
              >
                Clear all
              </button>
            ) : null}
          </header>
          {products.length === 0 ? (
            <div className="panel empty-state">
              <Scale size={30} />
              <h2
                className="section-title"
                style={{ fontSize: "var(--step-1)" }}
              >
                Your comparison is empty
              </h2>
              <p className="section-lead">
                Use Compare on any product card to build a short list.
              </p>
              <Link className="btn btn--primary" to="/shop">
                Browse products <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="comparison-grid">
              {products.map((product) => (
                <article className="panel comparison-card" key={product.id}>
                  <button
                    className="comparison-card__remove"
                    type="button"
                    aria-label={`Remove ${product.name} from comparison`}
                    onClick={() => remove(product.id)}
                  >
                    <X size={16} />
                  </button>
                  <img
                    src={product.image}
                    alt=""
                    width={420}
                    height={420}
                    loading="lazy"
                    decoding="async"
                  />
                  <p className="product-card__brand">{product.brand}</p>
                  <h2 className="product-card__name">
                    <Link to="/product/$id" params={{ id: product.id }}>
                      {product.name}
                    </Link>
                  </h2>
                  <dl className="comparison-card__facts">
                    <div>
                      <dt>Price</dt>
                      <dd>{formatPrice(product.price)}</dd>
                    </div>
                    <div>
                      <dt>Rating</dt>
                      <dd>{product.rating.toFixed(1)} / 5</dd>
                    </div>
                    <div>
                      <dt>Reviews</dt>
                      <dd>{product.reviews}</dd>
                    </div>
                    <div>
                      <dt>Availability</dt>
                      <dd>
                        {product.stock === "low" ? "Low stock" : "In stock"}
                      </dd>
                    </div>
                  </dl>
                  <Link
                    className="btn btn--quiet"
                    to="/product/$id"
                    params={{ id: product.id }}
                  >
                    View details <ArrowRight size={15} />
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
