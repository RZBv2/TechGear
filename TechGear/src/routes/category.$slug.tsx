import {
  createFileRoute,
  Link,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";

import {
  Footer,
  Header,
  MobileDrawer,
  ProductCard,
} from "@/components/techgear/Sections";
import { FilterBar, type SortOption } from "@/components/techgear/FilterBar";
import { getCatalogCategories, queryProducts, toProduct } from "@/data/api";
import { bootTechGear } from "@/scripts/motion";
import type { CategoryId } from "@/data/products/types";

export const Route = createFileRoute("/category/$slug")({
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search["page"]) > 0 ? Number(search["page"]) : 1,
    sort:
      typeof search["sort"] === "string"
        ? (search["sort"] as SortOption)
        : "relevance",
    minPrice:
      Number(search["minPrice"]) > 0 ? Number(search["minPrice"]) : undefined,
    maxPrice:
      Number(search["maxPrice"]) > 0 ? Number(search["maxPrice"]) : undefined,
  }),
  head: ({ params }) => {
    const category = getCatalogCategories().find((c) => c.slug === params.slug);
    const name = category?.name ?? "Category";
    return {
      meta: [
        { title: `${name} — TechGear` },
        {
          name: "description",
          content: `${category?.description ?? "Browse the TechGear catalog"} — shop ${name.toLowerCase()} at TechGear.`,
        },
        { property: "og:title", content: `${name} — TechGear` },
        {
          property: "og:description",
          content: `${category?.description ?? "Browse the TechGear catalog"}.`,
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { page, sort, minPrice, maxPrice } = useSearch({
    from: "/category/$slug",
  });
  const navigate = useNavigate({ from: "/category/$slug" });
  const category = getCatalogCategories().find((c) => c.slug === slug);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    void import("@/lib/productAdmin")
      .then(({ syncManagedProducts }) => syncManagedProducts())
      .catch(() => undefined)
      .finally(() => setHydrated(true));
    bootTechGear();
  }, []);

  if (!category) {
    return (
      <>
        <Header />
        <MobileDrawer />
        <main className="section section--below-header">
          <div className="container">
            <h1 className="section-title">Category not found</h1>
            <Link className="btn btn--ghost" to="/shop" search={{ page: 1 }}>
              Browse all products
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!hydrated) {
    return (
      <>
        <Header />
        <MobileDrawer />
        <main className="section section--below-header">
          <div className="container">
            <div className="panel empty-state" role="status">
              <h1 className="section-title">Loading catalog</h1>
              <p className="section-lead">
                Checking the latest TechGear inventory.
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const result = queryProducts({
    category: category.id as CategoryId,
    page,
    perPage: 24,
    sort,
    minPrice,
    maxPrice,
  });
  const hasFilters = minPrice !== undefined || maxPrice !== undefined;

  return (
    <>
      <Header />
      <MobileDrawer />
      <main className="section section--below-header">
        <div className="container">
          <header className="section-head">
            <h1 className="section-title">{category.name}</h1>
            <p className="section-lead">
              {category.description} — {result.total} products.
            </p>
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
              <p className="section-lead">Try widening your price range.</p>
              {hasFilters ? (
                <Link
                  className="btn btn--primary"
                  to="/category/$slug"
                  params={{ slug }}
                  search={{ page: 1, sort: "relevance" }}
                >
                  Clear filters
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
                to="/category/$slug"
                params={{ slug }}
                search={{ page: result.page - 1, sort, minPrice, maxPrice }}
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
                to="/category/$slug"
                params={{ slug }}
                search={{ page: result.page + 1, sort, minPrice, maxPrice }}
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
