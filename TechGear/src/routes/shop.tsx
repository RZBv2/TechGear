import {
  createFileRoute,
  Link,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { useEffect } from "react";

import {
  Footer,
  Header,
  MobileDrawer,
  ProductCard,
} from "@/components/techgear/Sections";
import { FilterBar, type SortOption } from "@/components/techgear/FilterBar";
import { queryProducts, toProduct } from "@/data/api";
import { bootTechGear } from "@/scripts/motion";

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search["page"]) > 0 ? Number(search["page"]) : 1,
    brand:
      typeof search["brand"] === "string" && search["brand"]
        ? search["brand"]
        : undefined,
    sort:
      typeof search["sort"] === "string"
        ? (search["sort"] as SortOption)
        : "relevance",
    minPrice:
      Number(search["minPrice"]) > 0 ? Number(search["minPrice"]) : undefined,
    maxPrice:
      Number(search["maxPrice"]) > 0 ? Number(search["maxPrice"]) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop All Tech — TechGear" },
      {
        name: "description",
        content:
          "Browse every phone, laptop, tablet, watch, camera and accessory in the TechGear catalog.",
      },
      { property: "og:title", content: "Shop All Tech — TechGear" },
      {
        property: "og:description",
        content:
          "Browse the full TechGear catalog of new and certified pre-owned technology.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ShopPage,
});

function ShopPage() {
  const { page, brand, sort, minPrice, maxPrice } = useSearch({
    from: "/shop",
  });
  const navigate = useNavigate({ from: "/shop" });
  const result = queryProducts({
    page,
    perPage: 24,
    brand,
    sort,
    minPrice,
    maxPrice,
  });
  useEffect(() => bootTechGear(), []);

  const hasFilters = Boolean(
    brand || minPrice !== undefined || maxPrice !== undefined,
  );

  return (
    <>
      <Header />
      <MobileDrawer />
      <main className="section section--below-header">
        <div className="container">
          <header className="section-head">
            <h1 className="section-title">
              {brand ? `${brand} products` : "Shop all products"}
            </h1>
            <p className="section-lead">
              {result.total} product{result.total === 1 ? "" : "s"}
              {brand ? ` from ${brand}.` : " across every TechGear category."}
            </p>
            {brand ? (
              <Link
                className="btn btn--ghost"
                to="/shop"
                search={{ page: 1, brand: undefined, sort, minPrice, maxPrice }}
              >
                Clear brand filter
              </Link>
            ) : null}
          </header>

          <FilterBar
            sort={sort}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onChange={(next) =>
              navigate({ search: (prev) => ({ ...prev, ...next, page: 1 }) })
            }
          />

          {result.items.length === 0 ? (
            <div className="panel empty-state">
              <h2
                className="section-title"
                style={{ fontSize: "var(--step-1)" }}
              >
                No products match these filters
              </h2>
              <p className="section-lead">
                Try widening your price range or clearing the brand filter.
              </p>
              {hasFilters ? (
                <Link
                  className="btn btn--primary"
                  to="/shop"
                  search={{ page: 1, sort: "relevance" }}
                >
                  Clear all filters
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="grid-products">
              {result.items.map((item) => (
                <ProductCard key={item.id} product={toProduct(item)} />
              ))}
            </div>
          )}

          <nav className="pager" aria-label="Pagination">
            {result.page > 1 && (
              <Link
                className="btn btn--ghost"
                to="/shop"
                search={{
                  page: result.page - 1,
                  brand,
                  sort,
                  minPrice,
                  maxPrice,
                }}
              >
                Previous
              </Link>
            )}
            <span className="pager__status">
              Page {result.page} of {result.totalPages}
            </span>
            {result.page < result.totalPages && (
              <Link
                className="btn btn--ghost"
                to="/shop"
                search={{
                  page: result.page + 1,
                  brand,
                  sort,
                  minPrice,
                  maxPrice,
                }}
              >
                Next
              </Link>
            )}
          </nav>
        </div>
      </main>
      <Footer />
    </>
  );
}
