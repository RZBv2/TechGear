import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, ShoppingCart, Trash2 } from "lucide-react";

import { AuthForms } from "@/components/techgear/AuthForms";
import { Footer, Header, MobileDrawer } from "@/components/techgear/Sections";
import { formatPrice } from "@/data/api";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import {
  addAddress,
  generateAddressId,
  getAddresses,
  removeAddress,
  type Address,
} from "@/lib/addresses";
import { calculateDiscount, findCoupon, type Coupon } from "@/lib/coupons";
import { type Order, type PaymentMethod } from "@/lib/orders";
import { createServerOrder } from "@/lib/serverOrders";
import { toast } from "@/scripts/motion";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "My Cart — TechGear" },
      { name: "description", content: "Review your cart and check out." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CartPage,
});

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; hint: string }[] = [
  { id: "bkash", label: "bKash", hint: "Pay via bKash mobile wallet" },
  { id: "nagad", label: "Nagad", hint: "Pay via Nagad mobile wallet" },
  { id: "cod", label: "Cash on Delivery", hint: "Pay when your order arrives" },
];

function CartPage() {
  const { user } = useAuth();
  const { cart, removeFromCart, clearCart } = useStore();
  const [step, setStep] = useState<"cart" | "checkout">("cart");
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);

  if (confirmedOrder) {
    return (
      <>
        <Header />
        <MobileDrawer />
        <main className="section section--below-header">
          <div className="container">
            <div className="panel sell-confirm">
              <CheckCircle2
                className="icon sell-confirm__icon"
                size={32}
                aria-hidden="true"
              />
              <h1 className="section-title">Order placed</h1>
              <p className="section-lead">
                Reference <strong>{confirmedOrder.id}</strong> — total{" "}
                <strong>{formatPrice(confirmedOrder.total)}</strong>, paying via{" "}
                <strong>
                  {
                    PAYMENT_OPTIONS.find(
                      (p) => p.id === confirmedOrder.paymentMethod,
                    )?.label
                  }
                </strong>{" "}
                (
                {confirmedOrder.paymentStatus === "cash_on_delivery"
                  ? "cash on delivery"
                  : confirmedOrder.paymentStatus === "paid"
                    ? "payment confirmed"
                    : "payment pending"}
                ).
              </p>
              <p className="category-card__desc">
                We'll confirm delivery details by phone. Track this order any
                time from your account.
              </p>
              <div className="product-detail__actions">
                <Link className="btn btn--primary" to="/account">
                  Track my order
                </Link>
                <Link
                  className="btn btn--ghost"
                  to="/shop"
                  search={{ page: 1 }}
                >
                  Keep shopping
                </Link>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <MobileDrawer />
      <main className="section section--below-header">
        <div className="container">
          <header className="section-head">
            <span className="eyebrow">Ready when you are</span>
            <h1 className="section-title">
              {step === "cart" ? "Your cart" : "Checkout"}
            </h1>
            <p className="section-lead">
              {step === "cart"
                ? "Review your selected technology before checkout."
                : "Add your delivery address, apply a coupon, and choose how to pay."}
            </p>
          </header>

          {cart.length === 0 ? (
            <div className="panel empty-state">
              <ShoppingCart size={28} />
              <h2
                className="section-title"
                style={{ fontSize: "var(--step-1)" }}
              >
                Your cart is empty
              </h2>
              <p className="section-lead">
                Add products from the shop and they will appear here.
              </p>
              <Link
                className="btn btn--primary"
                to="/shop"
                search={{ page: 1 }}
              >
                Shop now
              </Link>
            </div>
          ) : step === "cart" ? (
            <div className="cart-layout">
              <div className="cart-list">
                {cart.map((item) => (
                  <article className="panel cart-row" key={item.id}>
                    <img
                      src={item.image}
                      alt={item.name}
                      width={120}
                      height={120}
                    />
                    <div>
                      <Link
                        className="product-card__name"
                        to="/product/$id"
                        params={{ id: item.id }}
                      >
                        {item.name}
                      </Link>
                      <p className="category-card__desc">{item.brand}</p>
                      <p className="price">{formatPrice(item.price)}</p>
                    </div>
                    <button
                      className="icon-btn"
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </article>
                ))}
              </div>
              <aside className="panel cart-summary">
                <h2
                  className="section-title"
                  style={{ fontSize: "var(--step-1)" }}
                >
                  Order summary
                </h2>
                <div className="summary-line">
                  <span>Items</span>
                  <strong>{cart.length}</strong>
                </div>
                <div className="summary-line">
                  <span>Subtotal</span>
                  <strong>{formatPrice(subtotal)}</strong>
                </div>
                <div className="summary-line">
                  <span>Delivery</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="summary-total">
                  <span>Total</span>
                  <strong>{formatPrice(subtotal)}</strong>
                </div>
                <button
                  className="btn btn--primary"
                  type="button"
                  onClick={() => setStep("checkout")}
                >
                  Proceed to checkout
                </button>
                <button
                  className="btn btn--ghost"
                  type="button"
                  onClick={clearCart}
                >
                  Clear cart
                </button>
              </aside>
            </div>
          ) : !user ? (
            <div className="panel sell-form__gate">
              <p className="category-card__desc">
                Sign in or create a free account to check out.
              </p>
              <AuthForms compact />
            </div>
          ) : (
            <CheckoutForm
              subtotal={subtotal}
              onBack={() => setStep("cart")}
              onPlaceOrder={async (order) => {
                const stored = await createServerOrder({
                  data: {
                    items: order.items.map((item) => ({
                      id: item.id,
                      qty: item.qty,
                    })),
                    discount: order.discount,
                    ...(order.couponCode
                      ? { couponCode: order.couponCode }
                      : {}),
                    phone: order.phone,
                    address: order.address,
                    paymentMethod: order.paymentMethod,
                  },
                });
                const confirmed: Order = {
                  ...order,
                  id: stored.id,
                  subtotal: stored.subtotal,
                  discount: stored.discount,
                  ...(stored.couponCode
                    ? { couponCode: stored.couponCode }
                    : {}),
                  total: stored.total,
                  paymentStatus: stored.paymentStatus,
                  status: stored.status,
                  submittedAt: stored.submittedAt,
                  statusHistory: stored.statusHistory,
                };
                clearCart();
                setConfirmedOrder(confirmed);
                toast("Order placed — thanks for shopping with TechGear.");
              }}
            />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function CheckoutForm({
  subtotal,
  onBack,
  onPlaceOrder,
}: {
  subtotal: number;
  onBack: () => void;
  onPlaceOrder: (order: Order) => Promise<void>;
}) {
  const { user } = useAuth();
  const { cart } = useStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newLabel, setNewLabel] = useState("Home");
  const [newPhone, setNewPhone] = useState("");
  const [newLine, setNewLine] = useState("");

  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const [payment, setPayment] = useState<PaymentMethod>("bkash");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const saved = getAddresses(user.email);
    setAddresses(saved);
    const preferred = saved.find((a) => a.isDefault) ?? saved[0];
    if (preferred) setSelectedAddressId(preferred.id);
    else setShowNewAddress(true);
  }, [user?.email]);

  const discount = coupon ? calculateDiscount(coupon, subtotal) : 0;
  const total = Math.max(0, subtotal - discount);

  const applyCoupon = (event: FormEvent) => {
    event.preventDefault();
    const found = findCoupon(couponInput);
    if (!found) {
      setCouponError("That code isn't valid.");
      setCoupon(null);
      return;
    }
    if (found.minSubtotal && subtotal < found.minSubtotal) {
      setCouponError(
        `Add ${formatPrice(found.minSubtotal - subtotal)} more to use this code.`,
      );
      setCoupon(null);
      return;
    }
    setCouponError(null);
    setCoupon(found);
    toast(`Coupon ${found.code} applied.`);
  };

  const saveNewAddress = () => {
    if (!user) return null;
    if (!newPhone.trim() || !newLine.trim()) {
      setError("Fill in a phone number and address to continue.");
      return null;
    }
    const address: Address = {
      id: generateAddressId(),
      label: newLabel.trim() || "Address",
      phone: newPhone.trim(),
      addressLine: newLine.trim(),
      isDefault: addresses.length === 0,
    };
    addAddress(user.email, address);
    const updated = getAddresses(user.email);
    setAddresses(updated);
    setSelectedAddressId(address.id);
    setShowNewAddress(false);
    setNewPhone("");
    setNewLine("");
    return address;
  };

  const handlePlaceOrder = async () => {
    if (!user || submitting) return;

    let address = addresses.find((a) => a.id === selectedAddressId) ?? null;
    if (showNewAddress || !address) {
      address = saveNewAddress();
      if (!address) return;
    }
    setError(null);
    setSubmitting(true);

    const order: Order = {
      id: "pending",
      items: cart.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        qty: 1,
      })),
      subtotal,
      discount,
      couponCode: coupon?.code,
      total,
      phone: address.phone,
      address: address.addressLine,
      paymentMethod: payment,
      status: "Processing",
      submittedAt: new Date().toISOString(),
    };
    try {
      await onPlaceOrder(order);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to place this order right now.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cart-layout">
      <div className="cart-list checkout-steps">
        <section className="panel checkout-section">
          <h2 className="section-title" style={{ fontSize: "var(--step-0)" }}>
            Delivery address
          </h2>
          {addresses.length > 0 && !showNewAddress ? (
            <div className="address-list">
              {addresses.map((addr) => (
                <label
                  key={addr.id}
                  className={`address-card${selectedAddressId === addr.id ? " is-selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="address"
                    checked={selectedAddressId === addr.id}
                    onChange={() => setSelectedAddressId(addr.id)}
                  />
                  <span>
                    <strong>{addr.label}</strong>
                    {addr.isDefault ? (
                      <span className="badge badge--accent">Default</span>
                    ) : null}
                    <br />
                    {addr.phone} · {addr.addressLine}
                  </span>
                  <button
                    type="button"
                    className="address-card__remove"
                    aria-label={`Remove ${addr.label} address`}
                    onClick={(event) => {
                      event.preventDefault();
                      if (!user) return;
                      removeAddress(user.email, addr.id);
                      const updated = getAddresses(user.email);
                      setAddresses(updated);
                      if (selectedAddressId === addr.id)
                        setSelectedAddressId(updated[0]?.id ?? null);
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </label>
              ))}
              <button
                className="btn btn--ghost"
                type="button"
                onClick={() => setShowNewAddress(true)}
              >
                + Add a new address
              </button>
            </div>
          ) : (
            <div className="address-form">
              <label className="form-field">
                <span>Label</span>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(event) => setNewLabel(event.target.value)}
                  placeholder="Home, Office…"
                />
              </label>
              <label className="form-field">
                <span>Phone number</span>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(event) => setNewPhone(event.target.value)}
                  placeholder="01XXXXXXXXX"
                  required
                />
              </label>
              <label className="form-field">
                <span>Delivery address</span>
                <textarea
                  value={newLine}
                  onChange={(event) => setNewLine(event.target.value)}
                  rows={2}
                  placeholder="House, road, area, city"
                  required
                />
              </label>
              {addresses.length > 0 ? (
                <button
                  className="btn btn--ghost"
                  type="button"
                  onClick={() => setShowNewAddress(false)}
                >
                  Use a saved address instead
                </button>
              ) : null}
            </div>
          )}
        </section>

        <section className="panel checkout-section">
          <h2 className="section-title" style={{ fontSize: "var(--step-0)" }}>
            Payment method
          </h2>
          <div className="payment-options">
            {PAYMENT_OPTIONS.map((opt) => (
              <label
                key={opt.id}
                className={`payment-option${payment === opt.id ? " is-selected" : ""}`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={payment === opt.id}
                  onChange={() => setPayment(opt.id)}
                />
                <span>
                  <strong>{opt.label}</strong>
                  <br />
                  <small>{opt.hint}</small>
                </span>
              </label>
            ))}
          </div>
        </section>
      </div>

      <aside className="panel cart-summary">
        <h2 className="section-title" style={{ fontSize: "var(--step-1)" }}>
          Order summary
        </h2>
        <form className="coupon-form" onSubmit={applyCoupon}>
          <input
            type="text"
            value={couponInput}
            onChange={(event) => setCouponInput(event.target.value)}
            placeholder="Coupon code"
          />
          <button className="btn btn--ghost" type="submit">
            Apply
          </button>
        </form>
        {couponError ? (
          <p className="auth-forms__error" role="alert">
            {couponError}
          </p>
        ) : null}
        {coupon ? (
          <p className="category-card__desc">
            {coupon.code} applied — {coupon.description}.
          </p>
        ) : null}

        <div className="summary-line">
          <span>Subtotal</span>
          <strong>{formatPrice(subtotal)}</strong>
        </div>
        {discount > 0 ? (
          <div className="summary-line">
            <span>Discount</span>
            <strong>-{formatPrice(discount)}</strong>
          </div>
        ) : null}
        <div className="summary-total">
          <span>Total</span>
          <strong>{formatPrice(total)}</strong>
        </div>

        {error ? (
          <p className="auth-forms__error" role="alert">
            {error}
          </p>
        ) : null}

        <button
          className="btn btn--primary"
          type="button"
          onClick={handlePlaceOrder}
          disabled={submitting}
        >
          {submitting
            ? "Placing order…"
            : `Place order — ${formatPrice(total)}`}
        </button>
        <button className="btn btn--ghost" type="button" onClick={onBack}>
          Back to cart
        </button>
      </aside>
    </div>
  );
}
