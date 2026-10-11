import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import {
  Footer,
  Header,
  MobileDrawer,
  ProductCard,
} from "@/components/techgear/Sections";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/favorites")({
  component: FavoritesPage,
});

function FavoritesPage() {
  const { wishlist } = useStore();
  return (
    <>
      <Header />
      <MobileDrawer />
      <main className="section section--below-header">
        <div className="container">
          <header className="section-head">
            <span className="eyebrow">Your saved tech</span>
            <h1 className="section-title">Favorites</h1>
            <p className="section-lead">
              Keep the products you are considering in one place.
            </p>
          </header>
          {wishlist.length ? (
            <div className="grid-products">
              {wishlist.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="panel empty-state">
              <Heart size={28} />
              <h2
                className="section-title"
                style={{ fontSize: "var(--step-1)" }}
              >
                Your favorites are empty
              </h2>
              <p className="section-lead">
                Tap the heart on any product to save it here.
              </p>
              <Link className="btn btn--primary" to="/shop">
                Explore products
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
