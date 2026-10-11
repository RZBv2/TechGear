import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { Footer, Header, MobileDrawer } from "@/components/techgear/Sections";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help Center — TechGear" },
      {
        name: "description",
        content:
          "Answers to common questions about orders, shipping, returns, payments and your TechGear account.",
      },
      { property: "og:title", content: "Help Center — TechGear" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HelpPage,
});

type Faq = { q: string; a: ReactNode };
type FaqGroup = { title: string; items: Faq[] };

const GROUPS: FaqGroup[] = [
  {
    title: "Orders & payment",
    items: [
      {
        q: "What payment methods do you accept?",
        a: "You can pay with bKash, Nagad, or Cash on Delivery. Choose your preferred method at checkout.",
      },
      {
        q: "Can I use more than one coupon on an order?",
        a: "Only one coupon code can be applied per order. If you enter a new code, it replaces the previous one.",
      },
      {
        q: "How do I know my order went through?",
        a: "You'll see an on-screen confirmation with a reference number (e.g. TG-XXXXXX) immediately after checkout, and the order appears under My Account straight away.",
      },
      {
        q: "Can I change or cancel an order after placing it?",
        a: "Contact support as soon as possible with your order reference. Once an order has been handed to the courier, it can no longer be changed and would need to go through the returns process instead.",
      },
    ],
  },
  {
    title: "Shipping & delivery",
    items: [
      {
        q: "How long does delivery take?",
        a: (
          <>
            1–2 business days inside Rajshahi, 2–6 business days elsewhere
            depending on your area. See the full{" "}
            <Link to="/shipping">Shipping & delivery</Link> page for details.
          </>
        ),
      },
      {
        q: "How can I track my order?",
        a: (
          <>
            Sign in and open{" "}
            <Link to="/account" search={{}}>
              My Account
            </Link>{" "}
            — every order shows a live status: Processing, Confirmed, Shipped,
            or Delivered.
          </>
        ),
      },
      {
        q: "Do you deliver outside Rajshahi?",
        a: "Yes, nationwide. Delivery charges and timeframes vary by zone — see the shipping page for a full breakdown.",
      },
    ],
  },
  {
    title: "Returns & warranty",
    items: [
      {
        q: "What's your return policy?",
        a: (
          <>
            Start a request any time from the <Link to="/returns">Returns</Link>{" "}
            page with your order number and reason. Our team reviews it and
            follows up by email with next steps.
          </>
        ),
      },
      {
        q: "Are pre-owned devices covered by warranty?",
        a: (
          <>
            Yes — every certified pre-owned device includes a warranty period
            and passes a multi-point inspection before listing. See{" "}
            <Link to="/pre-owned">Certified Pre-Owned</Link> for details on a
            specific item.
          </>
        ),
      },
    ],
  },
  {
    title: "Your account",
    items: [
      {
        q: "Do I need an account to browse or add items to my cart?",
        a: "No — you can browse, search and build a cart as a guest. An account is only needed to check out, so your order and delivery details are saved for tracking.",
      },
      {
        q: "How do I save a delivery address for next time?",
        a: (
          <>
            Any address you enter at checkout is saved to your account
            automatically. You can also add or remove saved addresses directly
            from{" "}
            <Link to="/account" search={{}}>
              My Account
            </Link>
            .
          </>
        ),
      },
      {
        q: "I forgot my password — what do I do?",
        a: "Use the sign-in form and try again with the email you registered with. If you're still stuck, contact support and we'll help you regain access.",
      },
    ],
  },
  {
    title: "Selling your device",
    items: [
      {
        q: "How is my trade-in offer calculated?",
        a: (
          <>
            Your offer is based on the device category, condition, and
            functional checks you confirm in the{" "}
            <Link to="/sell" hash="sell-form">
              Sell Your Device
            </Link>{" "}
            form. It updates instantly as you fill in the details.
          </>
        ),
      },
      {
        q: "How do I check on a sell request I already submitted?",
        a: (
          <>
            Sign in and open{" "}
            <Link to="/account" search={{}}>
              My Account
            </Link>{" "}
            — every sell request you've submitted is listed there with its
            current status.
          </>
        ),
      },
    ],
  },
];

function HelpPage() {
  return (
    <>
      <Header />
      <MobileDrawer />
      <main className="section section--below-header">
        <div className="container">
          <header className="section-head">
            <span className="eyebrow">We're here to help</span>
            <h1 className="section-title">Help Center</h1>
            <p className="section-lead">
              Answers to the questions we hear most. Can't find what you need?
              Reach out on the <Link to="/contact">Contact</Link> page and our
              team will help directly.
            </p>
          </header>

          <div className="help-groups">
            {GROUPS.map((group) => (
              <section className="help-group" key={group.title} data-reveal>
                <h2
                  className="section-title"
                  style={{ fontSize: "var(--step-1)" }}
                >
                  {group.title}
                </h2>
                <div className="help-group__items">
                  {group.items.map((item) => (
                    <details className="panel help-item" key={item.q}>
                      <summary>{item.q}</summary>
                      <p>{item.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
