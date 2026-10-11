import { createFileRoute, Link } from "@tanstack/react-router";
import { Truck, Clock, MapPin, PackageCheck } from "lucide-react";

import { Footer, Header, MobileDrawer } from "@/components/techgear/Sections";

export const Route = createFileRoute("/shipping")({
  head: () => ({
    meta: [
      { title: "Shipping & Delivery — TechGear" },
      {
        name: "description",
        content:
          "Delivery zones, timeframes, charges and order tracking for TechGear.",
      },
      { property: "og:title", content: "Shipping & Delivery — TechGear" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ShippingPage,
});

const ZONES = [
  { zone: "Inside Rajshahi", time: "1–2 business days", charge: "৳60" },
  {
    zone: "Outside Rajshahi (major cities)",
    time: "2–4 business days",
    charge: "৳120",
  },
  { zone: "Remote / rural areas", time: "3–6 business days", charge: "৳150" },
];

const STEPS = [
  {
    icon: PackageCheck,
    title: "Order confirmed",
    body: "As soon as you check out, we prepare your items for dispatch.",
  },
  {
    icon: Truck,
    title: "Handed to courier",
    body: "Your parcel moves to our delivery partner and status updates to Shipped.",
  },
  {
    icon: MapPin,
    title: "Out for delivery",
    body: "The courier attempts delivery to your saved address and calls ahead on the number provided.",
  },
  {
    icon: Clock,
    title: "Delivered",
    body: "Your order status updates to Delivered — trackable any time from My Account.",
  },
];

function ShippingPage() {
  return (
    <>
      <Header />
      <MobileDrawer />
      <main className="section section--below-header">
        <div className="container">
          <header className="section-head">
            <span className="eyebrow">Getting your order to you</span>
            <h1 className="section-title">Shipping & delivery</h1>
            <p className="section-lead">
              Every order is inspected before dispatch and shipped through our
              trusted courier partners across Bangladesh. Delivery cost is
              calculated automatically at checkout based on your address.
            </p>
          </header>

          <div className="panel shipping-table-wrap">
            <table className="shipping-table">
              <thead>
                <tr>
                  <th>Delivery zone</th>
                  <th>Estimated time</th>
                  <th>Delivery charge</th>
                </tr>
              </thead>
              <tbody>
                {ZONES.map((z) => (
                  <tr key={z.zone}>
                    <td>{z.zone}</td>
                    <td>{z.time}</td>
                    <td>{z.charge}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p
              className="category-card__desc"
              style={{ padding: "var(--space-sm) var(--space-md)" }}
            >
              Orders are usually dispatched within 24 hours of confirmation.
              Estimated times start from dispatch, not order placement, and can
              vary during holidays or extreme weather.
            </p>
          </div>

          <section className="shipping-steps" data-reveal>
            <h2 className="section-title" style={{ fontSize: "var(--step-1)" }}>
              How your order moves
            </h2>
            <div className="shipping-steps__grid">
              {STEPS.map((step) => (
                <div className="panel shipping-step" key={step.title}>
                  <step.icon size={22} aria-hidden="true" />
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="info-page" style={{ marginTop: "var(--space-xl)" }}>
            <section className="panel info-page__section">
              <h2
                className="section-title"
                style={{ fontSize: "var(--step-1)" }}
              >
                Tracking your order
              </h2>
              <p className="section-lead">
                Every order gets a live status — Processing, Confirmed, Shipped,
                and Delivered — visible any time from{" "}
                <Link to="/account">My Account</Link>. We don't require a
                separate tracking number; sign in and your order history shows
                exactly where things stand.
              </p>
            </section>
            <section className="panel info-page__section">
              <h2
                className="section-title"
                style={{ fontSize: "var(--step-1)" }}
              >
                Delivery attempts & missed deliveries
              </h2>
              <p className="section-lead">
                Our courier partner will call the phone number on your order
                before attempting delivery. If you're unavailable, they'll
                attempt delivery again the next business day. After two failed
                attempts, the order is held at the local hub for pickup or
                returned to us.
              </p>
            </section>
            <section className="panel info-page__section">
              <h2
                className="section-title"
                style={{ fontSize: "var(--step-1)" }}
              >
                Free shipping
              </h2>
              <p className="section-lead">
                Keep an eye on the coupon field at checkout — codes like{" "}
                <strong>FREESHIP</strong> occasionally cover the delivery charge
                on qualifying orders.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
