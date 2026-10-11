import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Camera,
  ChevronDown,
  Check,
  Gamepad2,
  Headphones,
  Heart,
  Laptop,
  Mail,
  MapPin,
  Menu,
  Phone,
  Search,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Star,
  Tablet,
  Truck,
  Upload,
  User,
  Wallet,
  Watch,
  X,
  Zap,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ComponentType } from "react";

import heroDevice from "@/assets/hero-device.jpg";
import showcaseImage from "@/assets/product-laptop.jpg";
import {
  formatPrice,
  getAllPreOwnedProducts,
  getBrands,
  getCategories,
  getNewArrivals,
  getReviews,
  getStats,
  getTrendingProducts,
  toPreOwned,
  type CatalogProduct,
} from "@/data/api";
import type { PreOwnedProduct, Product } from "@/data/catalog";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { toast } from "@/scripts/motion";

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/shop" },
  { label: "Categories", to: "/categories" },
  { label: "Sell Your Device", to: "/sell" },
  { label: "Pre-Owned", to: "/pre-owned" },
  { label: "About", to: "/", hash: "about" },
] as const;

const CATEGORY_ICONS: Record<string, ComponentType<{ size?: number }>> = {
  smartphones: Smartphone,
  laptops: Laptop,
  tablets: Tablet,
  watches: Watch,
  audio: Headphones,
  cameras: Camera,
  gaming: Gamepad2,
  accessories: Zap,
};

export function Wordmark() {
  return (
    <Link className="wordmark" to="/" aria-label="TechGear home">
      <span className="wordmark__mark" aria-hidden="true">
        <Zap size={16} />
      </span>
      TechGear
    </Link>
  );
}

export function PageLoader() {
  return (
    <div className="page-loader" data-loader aria-hidden="true">
      <Wordmark />
      <div className="page-loader__bar">
        <i />
      </div>
    </div>
  );
}

export function Header() {
  const { user } = useAuth();
  const { cart, wishlist } = useStore();

  return (
    <header className="site-header">
      <div className="container">
        <nav className="nav" aria-label="Primary">
          <Wordmark />
          <ul className="nav__links">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  className="nav__link"
                  to={link.to}
                  {...("hash" in link && link.hash ? { hash: link.hash } : {})}
                  activeProps={{ className: "nav__link nav__link--active" }}
                  activeOptions={{
                    exact: link.to === "/" && !("hash" in link),
                  }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="nav__actions">
            <Link
              className="icon-btn nav__search"
              to="/search"
              search={{ q: "" }}
              aria-label="Search TechGear"
            >
              <Search size={19} />
            </Link>
            <Link className="icon-btn" to="/favorites" aria-label="Wishlist">
              <Heart size={19} />
              <span className="icon-btn__count" data-wishlist-count>
                {wishlist.length}
              </span>
            </Link>
            <Link className="icon-btn" to="/cart" aria-label="Cart">
              <ShoppingCart size={19} />
              <span className="icon-btn__count" data-cart-count>
                {cart.length}
              </span>
            </Link>
            <Link
              className={`icon-btn${user ? " icon-btn--signed-in" : ""}`}
              to="/account"
              search={{ next: undefined }}
              aria-label={user ? `Account: ${user.name}` : "Sign in"}
            >
              <User size={19} />
              {user ? (
                <span className="icon-btn__dot" aria-hidden="true" />
              ) : null}
            </Link>
            <button
              className="icon-btn nav__burger"
              type="button"
              aria-label="Open menu"
              data-drawer-open
            >
              <Menu size={20} />
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}

export function MobileDrawer() {
  const { user } = useAuth();

  return (
    <div className="drawer" data-drawer>
      <div className="container">
        <div className="drawer__head">
          <Wordmark />
          <button
            className="icon-btn"
            type="button"
            aria-label="Close menu"
            data-drawer-close
          >
            <X size={20} />
          </button>
        </div>
        <ul className="drawer__links">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <Link
                className="drawer__link"
                to={link.to}
                {...("hash" in link && link.hash ? { hash: link.hash } : {})}
                data-drawer-close
              >
                {link.label}
                <ArrowUpRight size={20} />
              </Link>
            </li>
          ))}
          <li>
            <Link
              className="drawer__link"
              to="/account"
              search={{ next: undefined }}
              data-drawer-close
            >
              {user ? `Account · ${user.name}` : "Sign in / Create account"}
              <ArrowUpRight size={20} />
            </Link>
          </li>
        </ul>
        <div className="drawer__foot">
          <Link
            className="btn btn--primary"
            to="/shop"
            search={{
              page: 1,
              brand: undefined,
              sort: "relevance",
              minPrice: undefined,
              maxPrice: undefined,
            }}
            data-drawer-close
          >
            Explore Tech
          </Link>
          <Link className="btn btn--ghost" to="/sell" data-drawer-close>
            Sell Your Device
          </Link>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero__bg" aria-hidden="true" />
      <div className="hero__grid" aria-hidden="true" />
      <div className="container hero__inner">
        <div className="hero__copy">
          <span className="eyebrow">Buy New. Sell Used. Upgrade Smarter.</span>
          <h1 className="hero__title">
            <span>The next</span>
            <span>generation</span>
            <span className="is-accent">of tech.</span>
          </h1>
          <p className="hero__lead">
            Discover technology built for how you live, work and play — new,
            certified pre-owned, and always inspected by TechGear.
          </p>
          <div className="hero__ctas">
            <Link
              className="btn btn--primary"
              to="/shop"
              search={{
                page: 1,
                brand: undefined,
                sort: "relevance",
                minPrice: undefined,
                maxPrice: undefined,
              }}
            >
              Explore Tech
              <ArrowRight className="icon icon--arrow" size={18} />
            </Link>
            <Link className="btn btn--ghost" to="/sell">
              Sell Your Device
            </Link>
          </div>
          <dl className="hero__meta">
            <div>
              <dt>Devices listed</dt>
              <dd>500+</dd>
            </div>
            <div>
              <dt>Buyback payout</dt>
              <dd>48 hrs</dd>
            </div>
            <div>
              <dt>Warranty</dt>
              <dd>30 days</dd>
            </div>
          </dl>
          <p className="hero__scroll">
            Scroll to explore
            <ChevronDown className="icon" size={16} />
          </p>
        </div>
        <div className="hero__visual" data-parallax="-6">
          <img
            src={heroDevice}
            alt="Flagship smartphone lit by violet studio light"
            width={1200}
            height={1408}
            fetchPriority="high"
          />
          <div className="hero__chip hero__chip--a">
            <span>Display</span>
            <strong>6.8&quot; 120Hz</strong>
          </div>
          <div className="hero__chip hero__chip--b">
            <span>Chipset</span>
            <strong>3nm Octa-core</strong>
          </div>
          <div className="hero__chip hero__chip--c">
            <span>Trade-in value</span>
            <strong>Up to $640</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Categories() {
  return (
    <section className="section" id="categories">
      <div className="container">
        <div className="section-head section-head--split" data-reveal>
          <div>
            <span className="eyebrow">Browse</span>
            <h2 className="section-title">Shop by category</h2>
          </div>
          <p className="section-lead">
            Eight focused collections, curated and condition-checked.
          </p>
        </div>
        <div className="grid-categories">
          {getCategories().map((category, index) => {
            const Icon = CATEGORY_ICONS[category.id] ?? Zap;
            return (
              <Link
                key={category.id}
                className="panel category-card"
                to="/category/$slug"
                params={{ slug: category.id }}
                search={{
                  page: 1,
                  sort: "relevance",
                  minPrice: undefined,
                  maxPrice: undefined,
                }}
                data-reveal
                data-reveal-delay={(index % 4) * 0.06}
              >
                <span className="category-card__icon" aria-hidden="true">
                  <Icon size={20} />
                </span>
                <span className="category-card__title">
                  {category.name}
                  <ArrowRight className="icon" size={18} />
                </span>
                <span className="category-card__desc">{category.desc}</span>
                <span className="category-card__count">
                  {category.count} products
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Stars({ rating }: { rating: number }) {
  return (
    <span className="rating">
      <Star className="icon" size={14} aria-hidden="true" />
      {rating.toFixed(1)}
    </span>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const { addToCart, toggleWishlist, isWishlisted } = useStore();
  const wishlisted = isWishlisted(product.id);
  const navigate = useNavigate();
  return (
    <article className="panel product-card">
      <div className="product-card__media">
        <Link
          to="/product/$id"
          params={{ id: product.id }}
          className="product-card__media-link"
          aria-label={`View details for ${product.name}`}
        >
          <img
            src={product.image}
            alt={product.name}
            width={800}
            height={800}
            loading="lazy"
            decoding="async"
            sizes="(max-width: 720px) 50vw, (max-width: 1100px) 33vw, 280px"
          />
          <div className="product-card__flags">
            {product.tag ? (
              <span className="badge badge--accent">{product.tag}</span>
            ) : null}
          </div>
        </Link>
        <button
          className={`product-card__wish${wishlisted ? " is-active" : ""}`}
          type="button"
          aria-pressed={wishlisted}
          aria-label={`${wishlisted ? "Remove" : "Save"} ${product.name} ${wishlisted ? "from" : "to"} wishlist`}
          data-wishlist={product.name}
          onClick={() => {
            const wasActive = wishlisted;
            toggleWishlist(product);
            toast(
              `${product.name} ${wasActive ? "removed from" : "saved to"} your wishlist.`,
            );
          }}
        >
          <Heart className="icon" size={17} />
        </button>
      </div>
      <div className="product-card__body">
        <p className="product-card__brand">
          {product.brand}
          <Stars rating={product.rating} />
        </p>
        <h3 className="product-card__name">
          <Link to="/product/$id" params={{ id: product.id }}>
            {product.name}
          </Link>
        </h3>
        <p className={`stock${product.stock === "low" ? " stock--low" : ""}`}>
          <span className="stock__dot" aria-hidden="true" />
          {product.stock === "low" ? "Low stock" : "In stock"} ·{" "}
          {product.reviews} reviews
        </p>
        <div className="product-card__foot">
          <p className="price">
            {formatPrice(product.price)}
            {product.wasPrice ? (
              <span className="price__was">
                {formatPrice(product.wasPrice)}
              </span>
            ) : null}
          </p>
          <div className="product-card__actions">
            <button
              className="product-card__cart"
              type="button"
              data-add-to-cart={product.name}
              onClick={(event) => {
                event.stopPropagation();
                addToCart(product);
                toast(`${product.name} added to your cart.`);
              }}
            >
              <ShoppingCart size={12} />
              Add to Cart
            </button>
            <button
              className="product-card__buy"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                addToCart(product);
                navigate({ to: "/cart" });
              }}
            >
              Get Yours
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function Trending() {
  return (
    <section className="section section--tight" id="trending">
      <div className="container">
        <div className="section-head section-head--split" data-reveal>
          <div>
            <span className="eyebrow">Trending</span>
            <h2 className="section-title">Moving fast this week</h2>
          </div>
          <Link
            className="btn btn--quiet"
            to="/shop"
            search={{
              page: 1,
              brand: undefined,
              sort: "relevance",
              minPrice: undefined,
              maxPrice: undefined,
            }}
          >
            View all
            <ArrowRight className="icon icon--arrow" size={16} />
          </Link>
        </div>
        <div className="grid-products">
          {getTrendingProducts().map((product, index) => (
            <div
              key={product.id}
              data-reveal
              data-reveal-delay={(index % 4) * 0.07}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function NewArrivals() {
  return (
    <section className="section section--tight new-arrivals">
      <div className="container">
        <div className="section-head section-head--split" data-reveal>
          <div>
            <span className="eyebrow">Just landed</span>
            <h2 className="section-title">What&apos;s new at TechGear</h2>
          </div>
          <p className="section-lead">
            Fresh releases, stocked the week they ship.
          </p>
        </div>
        <div className="grid-products new-arrivals__grid">
          {getNewArrivals().map((product, index) => (
            <div
              key={product.id}
              data-reveal
              data-reveal-delay={(index % 4) * 0.07}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SellYourDevice() {
  return (
    <section className="section sell" id="sell">
      <div className="container sell__inner">
        <div className="sell__copy" data-reveal>
          <span className="eyebrow">Buyback</span>
          <h2 className="sell__title">
            Don&apos;t let your old tech collect dust.
          </h2>
          <p className="section-lead">
            Turn your unused device into value. Tell us what you have, we
            inspect it, and you get paid — usually within 48 hours of pickup.
          </p>
          <ul className="sell__points">
            <li>
              <Check className="icon" size={16} /> Free insured pickup
            </li>
            <li>
              <Check className="icon" size={16} /> Transparent condition grading
            </li>
            <li>
              <Check className="icon" size={16} /> No obligation — reject the
              offer any time
            </li>
          </ul>
          <a className="btn btn--primary" href="#sell-form">
            Sell Your Device
            <ArrowRight className="icon icon--arrow" size={18} />
          </a>
        </div>
        <div
          className="panel sell__quote sell__quote--manual"
          data-reveal
          data-reveal-delay="0.12"
        >
          <span className="badge badge--accent">Your price, your choice</span>
          <div className="sell__quote-icon" aria-hidden="true">
            ৳
          </div>
          <h3 className="sell__quote-title">Name your price</h3>
          <p className="category-card__desc">
            Tell us the amount you would like to receive. Our team will inspect
            the device and confirm the final value before pickup.
          </p>
          <a className="btn btn--ghost" href="#sell-form">
            Enter your price{" "}
            <ArrowRight className="icon icon--arrow" size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}

const PROCESS_STEPS = [
  {
    icon: Smartphone,
    title: "Device",
    desc: "Pick your model and tell us its condition.",
  },
  {
    icon: Upload,
    title: "Photos",
    desc: "Upload a few shots so we can pre-grade it.",
  },
  {
    icon: Search,
    title: "Inspection",
    desc: "Our technicians verify the hardware and battery.",
  },
  {
    icon: Wallet,
    title: "Offer",
    desc: "Get a firm valuation you can accept or reject.",
  },
  {
    icon: Truck,
    title: "Payment",
    desc: "Free pickup, then payout within 48 hours.",
  },
];

export function BuybackProcess() {
  return (
    <section className="section section--tight" id="process">
      <div className="container">
        <div className="section-head" data-reveal>
          <span className="eyebrow">How it works</span>
          <h2 className="section-title">Five steps from drawer to payout</h2>
        </div>
        <ol className="process">
          {PROCESS_STEPS.map((step, index) => (
            <li
              key={step.title}
              className="panel process__step"
              data-reveal
              data-reveal-delay={index * 0.08}
            >
              <span className="process__icon" aria-hidden="true">
                <step.icon size={19} />
              </span>
              <h3 className="process__title">{step.title}</h3>
              <p className="process__desc">{step.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function PreOwnedCard({ product }: { product: PreOwnedProduct }) {
  const { addToCart, toggleWishlist, isWishlisted } = useStore();
  const wishlisted = isWishlisted(product.id);
  const navigate = useNavigate();
  return (
    <article className="panel product-card">
      <div className="product-card__media">
        <Link
          to="/product/$id"
          params={{ id: product.id }}
          className="product-card__media-link"
          aria-label={`View details for ${product.name}`}
        >
          <img
            src={product.image}
            alt={product.name}
            width={800}
            height={800}
            loading="lazy"
            decoding="async"
            sizes="(max-width: 720px) 50vw, (max-width: 1100px) 33vw, 280px"
          />
          <div className="product-card__flags">
            <span className="badge badge--success">Certified</span>
          </div>
        </Link>
        <button
          className={`product-card__wish${wishlisted ? " is-active" : ""}`}
          type="button"
          aria-pressed={wishlisted}
          aria-label={`${wishlisted ? "Remove" : "Save"} ${product.name} ${wishlisted ? "from" : "to"} wishlist`}
          data-wishlist={product.name}
          onClick={() => {
            const wasActive = wishlisted;
            toggleWishlist(product);
            toast(
              `${product.name} ${wasActive ? "removed from" : "saved to"} your wishlist.`,
            );
          }}
        >
          <Heart className="icon" size={17} />
        </button>
      </div>
      <div className="product-card__body">
        <p className="product-card__brand">
          {product.brand}
          <Stars rating={product.rating} />
        </p>
        <h3 className="product-card__name">
          <Link to="/product/$id" params={{ id: product.id }}>
            {product.name}
          </Link>
        </h3>
        <div className="cpo-card__specs">
          <div>
            <span>Condition</span>
            <span>{product.condition}</span>
          </div>
          <div>
            <span>Battery health</span>
            <span
              className="battery"
              aria-label={`Battery health ${product.battery} percent`}
            >
              <i style={{ width: `${product.battery}%` }} />
            </span>
          </div>
          <div>
            <span>Warranty</span>
            <span>{product.warranty}</span>
          </div>
        </div>
        <div className="product-card__foot">
          <p className="price">
            {formatPrice(product.price)}
            {product.wasPrice ? (
              <span className="price__was">
                {formatPrice(product.wasPrice)}
              </span>
            ) : null}
          </p>
          <div className="product-card__actions">
            <button
              className="product-card__cart"
              type="button"
              data-add-to-cart={product.name}
              onClick={(event) => {
                event.stopPropagation();
                addToCart(product);
                toast(`${product.name} added to your cart.`);
              }}
            >
              <ShoppingCart size={12} />
              Add to Cart
            </button>
            <button
              className="product-card__buy"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                addToCart(product);
                navigate({ to: "/cart" });
              }}
            >
              Get Yours
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

const TRUST_FILTERS = [
  { id: "tested", label: "Tested", test: () => true },
  { id: "verified", label: "Verified", test: () => true },
  {
    id: "battery-checked",
    label: "Battery checked",
    test: (p: CatalogProduct) => p.preOwned?.batteryHealth !== undefined,
  },
  { id: "quality-inspected", label: "Quality inspected", test: () => true },
  {
    id: "warranty-available",
    label: "Warranty available",
    test: (p: CatalogProduct) => Boolean(p.warranty),
  },
] as const;

export function PreOwned() {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const allProducts = getAllPreOwnedProducts();

  const filtered =
    activeFilters.length === 0
      ? allProducts
      : allProducts.filter((product) =>
          activeFilters.every((filterId) => {
            const filter = TRUST_FILTERS.find((f) => f.id === filterId);
            return filter ? filter.test(product) : true;
          }),
        );

  const toggleFilter = (id: string) => {
    setActiveFilters((current) =>
      current.includes(id) ? current.filter((f) => f !== id) : [...current, id],
    );
  };

  return (
    <section className="section preowned" id="pre-owned">
      <div className="container">
        <div className="section-head section-head--split" data-reveal>
          <div>
            <span className="eyebrow">Certified pre-owned</span>
            <h2 className="section-title">Second-hand, first-class</h2>
          </div>
          <p className="section-lead">
            Every device passes a 42-point inspection before it earns the
            TechGear seal.
          </p>
        </div>
        <ul className="trust-row" data-reveal>
          {TRUST_FILTERS.map((item) => {
            const active = activeFilters.includes(item.id);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={`badge badge--filter${active ? " badge--filter-active" : ""}`}
                  aria-pressed={active}
                  onClick={() => toggleFilter(item.id)}
                >
                  <BadgeCheck size={13} aria-hidden="true" />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
        {activeFilters.length > 0 ? (
          <div className="preowned__filter-status">
            <span>
              {filtered.length} of {allProducts.length} products match
            </span>
            <button
              type="button"
              className="btn btn--quiet"
              onClick={() => setActiveFilters([])}
            >
              Clear filters
            </button>
          </div>
        ) : null}
        {filtered.length > 0 ? (
          <div className="grid-products">
            {filtered.map((item, index) => (
              <div key={item.id} data-reveal data-reveal-delay={index * 0.07}>
                <PreOwnedCard product={toPreOwned(item)} />
              </div>
            ))}
          </div>
        ) : (
          <p className="preowned__empty">
            No pre-owned products match those filters right now.{" "}
            <button
              type="button"
              className="btn btn--quiet"
              onClick={() => setActiveFilters([])}
            >
              Clear filters
            </button>
          </p>
        )}
      </div>
    </section>
  );
}

export function Stats() {
  return (
    <section className="section section--tight" id="about">
      <div className="container">
        <ul className="stats">
          {getStats().map((stat, index) => (
            <li
              key={stat.label}
              className="panel stat"
              data-reveal
              data-reveal-delay={index * 0.06}
            >
              <span
                className="stat__value"
                data-count={stat.value}
                data-suffix={stat.suffix}
              >
                0{stat.suffix}
              </span>
              <span className="stat__label">{stat.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Brands() {
  return (
    <section className="section section--tight">
      <div className="container">
        <div className="section-head" data-reveal>
          <span className="eyebrow">Brands</span>
          <h2 className="section-title">Names we stand behind</h2>
        </div>
        <ul className="brands" data-reveal>
          {getBrands().map((brand) => (
            <li key={brand}>
              <Link
                to="/shop"
                search={{
                  page: 1,
                  brand,
                  sort: "relevance",
                  minPrice: undefined,
                  maxPrice: undefined,
                }}
              >
                {brand}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Showcase() {
  return (
    <section className="section section--tight">
      <div className="container showcase">
        <article className="panel showcase__panel" data-reveal>
          <img
            src={showcaseImage}
            alt="Laptop lit by violet studio light"
            loading="lazy"
            decoding="async"
          />
          <span className="badge badge--accent">Upgrade week</span>
          <h2 className="showcase__title">
            Trade in, level up — save up to 40%
          </h2>
          <p className="section-lead">
            Combine your buyback offer with any new device and we&apos;ll cover
            the shipping both ways.
          </p>
          <Link className="btn btn--primary" to="/sell">
            Start a trade-in
            <ArrowRight className="icon icon--arrow" size={18} />
          </Link>
        </article>
        <div className="showcase__side">
          <article
            className="panel process__step"
            data-reveal
            data-reveal-delay="0.08"
          >
            <span className="process__icon" aria-hidden="true">
              <ShieldCheck size={19} />
            </span>
            <h3 className="process__title">Two-year protection</h3>
            <p className="process__desc">
              Extend cover on any device at checkout, cancel anytime.
            </p>
          </article>
          <article
            className="panel process__step"
            data-reveal
            data-reveal-delay="0.14"
          >
            <span className="process__icon" aria-hidden="true">
              <Truck size={19} />
            </span>
            <h3 className="process__title">Next-day delivery</h3>
            <p className="process__desc">
              Order before 6pm on in-stock tech and track it live.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}

export function Reviews() {
  return (
    <section className="section section--tight">
      <div className="container">
        <div className="section-head section-head--split" data-reveal>
          <div>
            <span className="eyebrow">Reviews</span>
            <h2 className="section-title">What customers say</h2>
          </div>
          <p className="section-lead">
            Verified purchases from buyers and sellers.
          </p>
        </div>
        <div className="reviews-swiper" data-reviews-swiper data-reveal>
          <div className="swiper-wrapper">
            {getReviews().map((review) => (
              <div className="swiper-slide" key={review.id}>
                <article className="panel review-card">
                  <div className="review-card__head">
                    <span className="avatar" aria-hidden="true">
                      {review.initials}
                    </span>
                    <div>
                      <p className="review-card__name">{review.name}</p>
                      <p className="review-card__meta">
                        {review.location} · Verified purchase
                      </p>
                    </div>
                  </div>
                  <Stars rating={review.rating} />
                  <p className="review-card__text">{review.text}</p>
                </article>
              </div>
            ))}
          </div>
          <div className="swiper-pagination" data-reviews-pagination />
        </div>
      </div>
    </section>
  );
}

export function Newsletter() {
  return (
    <section className="section section--tight">
      <div className="container">
        <div className="panel newsletter" data-reveal>
          <span className="eyebrow">Stay ahead</span>
          <h2 className="section-title">Your technology. Your way.</h2>
          <p className="section-lead">
            Drops, price moves and buyback bonuses — one short email a week.
          </p>
          <form className="newsletter__form" data-newsletter>
            <label className="sr-only" htmlFor="newsletter-email">
              Email address
            </label>
            <input
              className="field"
              id="newsletter-email"
              type="email"
              required
              placeholder="you@example.com"
            />
            <button className="btn btn--primary" type="submit">
              Join TechGear
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

const FOOTER_COLS = [
  {
    title: "Shop",
    links: [
      {
        label: "Smartphones",
        to: "/category/$slug",
        params: { slug: "smartphones" },
      },
      { label: "Laptops", to: "/category/$slug", params: { slug: "laptops" } },
      {
        label: "Smart Watches",
        to: "/category/$slug",
        params: { slug: "watches" },
      },
      {
        label: "Accessories",
        to: "/category/$slug",
        params: { slug: "accessories" },
      },
      { label: "Pre-Owned", to: "/pre-owned" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Sell Your Device", to: "/sell" },
      { label: "Warranty", to: "/pre-owned" },
      { label: "Order Tracking", to: "/account" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", to: "/about" },
      { label: "Contact", to: "/contact" },
      { label: "Privacy", to: "/privacy" },
      { label: "Terms", to: "/terms" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", to: "/help" },
      { label: "Shipping", to: "/shipping" },
      { label: "Returns", to: "/returns" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <Wordmark />
            <p className="footer__tagline">
              Buy New. Sell Used. Upgrade Smarter.
            </p>
            <ul className="footer__contact">
              <li>
                <MapPin size={14} /> Rajshahi, Bangladesh.
              </li>
              <li>
                <Mail size={14} /> its.rzb@gmail.com
              </li>
              <li>
                <Phone size={14} /> +880 1740 797437
              </li>
            </ul>
          </div>
          {FOOTER_COLS.map((col) => (
            <div className="footer__col" key={col.title}>
              <h3>{col.title}</h3>
              <ul>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      {...("params" in link && link.params
                        ? { params: link.params }
                        : {})}
                      {...("hash" in link && link.hash
                        ? { hash: link.hash }
                        : {})}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="footer__bottom">
          <p>
            © {new Date().getFullYear()} TechGear. All rights reserved. ·{" "}
            <Link to="/admin" className="footer__admin-link">
              Staff login
            </Link>
          </p>
          <div className="socials">
            <a href="mailto:its.rzb@gmail.com" aria-label="TechGear on X">
              <X size={16} />
            </a>
            <a
              href="mailto:its.rzb@gmail.com"
              aria-label="TechGear support email"
            >
              <Mail size={16} />
            </a>
            <a href="tel:+8801740797434" aria-label="TechGear phone support">
              <Phone size={16} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
