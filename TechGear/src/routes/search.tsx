import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search as SearchIcon } from "lucide-react";
import {
  Footer,
  Header,
  MobileDrawer,
  ProductCard,
} from "@/components/techgear/Sections";
import { queryProducts, toProduct } from "@/data/api";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const [value, setValue] = useState(q);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    let active = true;
    void import("@/lib/productAdmin")
      .then(({ syncManagedProducts }) => syncManagedProducts())
      .then(() => {
        if (active) setHydrated(true);
      })
      .catch(() => {
        if (active) setHydrated(true);
      });
    return () => {
      active = false;
    };
  }, []);
  const result = hydrated ? queryProducts({ q, page: 1, perPage: 24 }) : null;

  return (
    <>
      <Header />
      <MobileDrawer />
      <main className="section section--below-header">
        <div className="container">
          <header className="section-head">
            <span className="eyebrow">Find your next upgrade</span>
            <h1 className="section-title">Search TechGear</h1>
            <p className="section-lead">
              Search across phones, laptops, audio, cameras, gaming and more.
            </p>
          </header>
          <form
            className="search-bar panel"
            onSubmit={(event) => {
              event.preventDefault();
              navigate({ to: "/search", search: { q: value } });
            }}
          >
            <SearchIcon size={19} />
            <input
              aria-label="Search products"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="Try “iPhone”, “Sony”, or “camera”"
            />
            <button className="btn btn--primary" type="submit">
              Search
            </button>
          </form>
          {!hydrated ? null : (
            <>
              {q ? (
                <p
                  className="category-card__desc"
                  style={{ margin: "var(--space-sm) 0" }}
                >
                  {result.total} results for <strong>“{q}”</strong>
                </p>
              ) : null}
              {result.items.length ? (
                <div className="grid-products">
                  {result.items.map((item) => (
                    <ProductCard key={item.id} product={toProduct(item)} />
                  ))}
                </div>
              ) : (
                <div className="panel empty-state">
                  <h2
                    className="section-title"
                    style={{ fontSize: "var(--step-1)" }}
                  >
                    No products found
                  </h2>
                  <p className="section-lead">
                    Try a broader search or browse the full catalog.
                  </p>
                  <Link className="btn btn--ghost" to="/shop">
                    Browse all products
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
