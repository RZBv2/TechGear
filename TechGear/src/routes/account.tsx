import {
  createFileRoute,
  Link,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";

import { AuthForms } from "@/components/techgear/AuthForms";
import { OrderTrackingTimeline } from "@/components/techgear/OrderTracking";
import { Footer, Header, MobileDrawer } from "@/components/techgear/Sections";
import { formatPrice } from "@/data/api";
import {
  addAddress,
  generateAddressId,
  getAddresses,
  removeAddress,
  setDefaultAddress,
  type Address,
} from "@/lib/addresses";
import { useAuth } from "@/lib/auth";
import { deriveOrderStatus, type Order } from "@/lib/orders";
import { getMyServerOrders } from "@/lib/serverOrders";
import {
  getMyNotifications,
  markAllMyNotificationsRead,
  type ServerNotification,
} from "@/lib/serverInsights";
import {
  getMyServerSellRequests,
  type ServerSellRequest,
} from "@/lib/serverSellRequests";
import { bootTechGear } from "@/scripts/motion";

export const Route = createFileRoute("/account")({
  validateSearch: (search: Record<string, unknown>) => ({
    next: typeof search["next"] === "string" ? search["next"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "My Account — TechGear" },
      {
        name: "description",
        content:
          "Sign in to your TechGear account to track sell requests and orders.",
      },
      { property: "og:title", content: "My Account — TechGear" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user, ready, signOut } = useAuth();
  const { next } = useSearch({ from: "/account" });
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [notifications, setNotifications] = useState<ServerNotification[]>([]);
  const [requests, setRequests] = useState<ServerSellRequest[]>([]);
  useEffect(() => bootTechGear(), []);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setNotifications([]);
      setRequests([]);
      return;
    }
    let active = true;
    const refresh = async () => {
      try {
        const [serverOrders, serverNotifications, serverRequests] =
          await Promise.all([
            getMyServerOrders(),
            getMyNotifications(),
            getMyServerSellRequests(),
          ]);
        if (active) {
          setOrders(serverOrders as unknown as Order[]);
          setNotifications(serverNotifications);
          setRequests(serverRequests);
        }
      } catch {
        if (active) {
          setOrders([]);
          setRequests([]);
        }
      }
      if (active) setAddresses(getAddresses(user.email));
    };
    void refresh();
    window.addEventListener("storage", () => {
      void refresh();
    });
    return () => {
      active = false;
    };
  }, [user?.email]);

  const refreshAddresses = () => {
    if (!user) return;
    setAddresses(getAddresses(user.email));
  };

  return (
    <>
      <Header />
      <MobileDrawer />
      <main className="section section--below-header">
        <div className="container">
          <header className="section-head">
            <h1 className="section-title">My account</h1>
          </header>

          {!ready ? null : !user ? (
            <div className="panel auth-gate">
              {next ? (
                <p className="section-lead">
                  Sign in to continue to your sell request.
                </p>
              ) : null}
              <AuthForms onSuccess={() => next && navigate({ to: next })} />
            </div>
          ) : (
            <div className="account">
              <div className="panel account__profile">
                <p className="product-card__brand">Signed in as</p>
                <h2
                  className="section-title"
                  style={{ fontSize: "var(--step-2)" }}
                >
                  {user.name}
                </h2>
                <p className="category-card__desc">{user.email}</p>
                <button
                  className="btn btn--ghost"
                  type="button"
                  onClick={signOut}
                >
                  Sign out
                </button>
              </div>

              <div className="account__sections">
                {notifications.length > 0
                  ? (() => {
                      const latest = notifications[0];
                      return (
                        <section>
                          <div className="admin-section-head">
                            <div>
                              <h2
                                className="section-title"
                                style={{
                                  fontSize: "var(--step-1)",
                                  marginBottom: "var(--space-sm)",
                                }}
                              >
                                Notifications
                              </h2>
                              <p className="category-card__desc">
                                Latest update on your orders.
                              </p>
                            </div>
                            {!latest.isRead ? (
                              <button
                                className="btn btn--ghost"
                                type="button"
                                onClick={async () => {
                                  await markAllMyNotificationsRead();
                                  setNotifications((items) =>
                                    items.map((item) => ({
                                      ...item,
                                      isRead: true,
                                    })),
                                  );
                                }}
                              >
                                Mark as read
                              </button>
                            ) : null}
                          </div>
                          <ul className="sell-requests">
                            <li
                              key={latest.id}
                              className={`panel order-row${latest.isRead ? "" : " notification--unread"}`}
                            >
                              <div
                                className="sell-requests__row"
                                style={{ padding: 0 }}
                              >
                                <div>
                                  <p className="product-card__name">
                                    {latest.title}
                                  </p>
                                  <p className="category-card__desc">
                                    {latest.message}
                                  </p>
                                </div>
                                <small>
                                  {new Date(latest.createdAt).toLocaleString()}
                                </small>
                              </div>
                            </li>
                          </ul>
                        </section>
                      );
                    })()
                  : null}

                <section>
                  <h2
                    className="section-title"
                    style={{
                      fontSize: "var(--step-1)",
                      marginBottom: "var(--space-sm)",
                    }}
                  >
                    My orders
                  </h2>
                  {orders.length === 0 ? (
                    <p className="category-card__desc">
                      No orders yet.{" "}
                      <Link
                        to="/shop"
                        search={{
                          page: 1,
                          brand: undefined,
                          sort: "relevance",
                          minPrice: undefined,
                          maxPrice: undefined,
                        }}
                      >
                        Start shopping
                      </Link>
                      .
                    </p>
                  ) : (
                    <ul className="sell-requests">
                      {orders
                        .slice()
                        .sort(
                          (a, b) =>
                            new Date(a.submittedAt).getTime() -
                            new Date(b.submittedAt).getTime(),
                        )
                        .map((order) => {
                          const status = deriveOrderStatus(order);
                          return (
                            <li key={order.id} className="panel order-row">
                              <div
                                className="sell-requests__row"
                                style={{ padding: 0 }}
                              >
                                <div>
                                  <p className="product-card__name">
                                    {order.items.length} item
                                    {order.items.length === 1 ? "" : "s"}
                                  </p>
                                  <p className="category-card__desc">
                                    Ref {order.id} · Placed{" "}
                                    {new Date(
                                      order.submittedAt,
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="sell-requests__meta">
                                  <span className="price">
                                    {formatPrice(order.total)}
                                  </span>
                                </div>
                              </div>
                              <OrderTrackingTimeline
                                status={status}
                                history={order.statusHistory ?? []}
                              />
                            </li>
                          );
                        })}
                    </ul>
                  )}
                </section>

                <section>
                  <h2
                    className="section-title"
                    style={{
                      fontSize: "var(--step-1)",
                      marginBottom: "var(--space-sm)",
                    }}
                  >
                    My sell requests
                  </h2>
                  {requests.length === 0 ? (
                    <p className="category-card__desc">
                      No sell requests yet.{" "}
                      <Link to="/sell" hash="sell-form">
                        Sell a device
                      </Link>
                      .
                    </p>
                  ) : (
                    <ul className="sell-requests">
                      {requests.map((req) => (
                        <li key={req.id} className="panel sell-requests__row">
                          {req.photoDataUrl ? (
                            <img
                              className="sell-requests__thumb"
                              src={req.photoDataUrl}
                              alt={req.model}
                            />
                          ) : null}
                          <div>
                            <p className="product-card__name">
                              {req.model} · {req.categoryName}
                            </p>
                            <p className="category-card__desc">
                              Ref {req.id} · Submitted{" "}
                              {new Date(req.submittedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="sell-requests__meta">
                            <span className="price">
                              {formatPrice(req.askingPrice)}
                            </span>
                            <span className="badge badge--accent">
                              {req.status}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <AddressBook
                  addresses={addresses}
                  onChange={refreshAddresses}
                />
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function AddressBook({
  addresses,
  onChange,
}: {
  addresses: Address[];
  onChange: () => void;
}) {
  const { user } = useAuth();
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("Home");
  const [phone, setPhone] = useState("");
  const [line, setLine] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!user || !phone.trim() || !line.trim()) return;
    addAddress(user.email, {
      id: generateAddressId(),
      label: label.trim() || "Address",
      phone: phone.trim(),
      addressLine: line.trim(),
      isDefault: addresses.length === 0,
    });
    setLabel("Home");
    setPhone("");
    setLine("");
    setAdding(false);
    onChange();
  };

  return (
    <section>
      <h2
        className="section-title"
        style={{ fontSize: "var(--step-1)", marginBottom: "var(--space-sm)" }}
      >
        My addresses
      </h2>
      {addresses.length === 0 && !adding ? (
        <p className="category-card__desc">No saved addresses yet.</p>
      ) : (
        <ul className="address-list">
          {addresses.map((addr) => (
            <li key={addr.id} className="panel address-row">
              <div>
                <strong>{addr.label}</strong>
                {addr.isDefault ? (
                  <span className="badge badge--accent">Default</span>
                ) : null}
                <p className="category-card__desc">
                  {addr.phone} · {addr.addressLine}
                </p>
              </div>
              <div className="sell-requests__meta">
                {!addr.isDefault ? (
                  <button
                    className="btn btn--ghost"
                    type="button"
                    onClick={() => {
                      if (!user) return;
                      setDefaultAddress(user.email, addr.id);
                      onChange();
                    }}
                  >
                    Set default
                  </button>
                ) : null}
                <button
                  className="icon-btn"
                  type="button"
                  aria-label={`Remove ${addr.label}`}
                  onClick={() => {
                    if (!user) return;
                    removeAddress(user.email, addr.id);
                    onChange();
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <form
          className="panel address-form"
          onSubmit={submit}
          style={{ marginTop: "var(--space-sm)" }}
        >
          <label className="form-field">
            <span>Label</span>
            <input
              type="text"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
            />
          </label>
          <label className="form-field">
            <span>Phone number</span>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
            />
          </label>
          <label className="form-field">
            <span>Address</span>
            <textarea
              value={line}
              onChange={(event) => setLine(event.target.value)}
              rows={2}
              required
            />
          </label>
          <div className="product-detail__actions">
            <button className="btn btn--primary" type="submit">
              Save address
            </button>
            <button
              className="btn btn--ghost"
              type="button"
              onClick={() => setAdding(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          className="btn btn--ghost"
          type="button"
          style={{ marginTop: "var(--space-sm)" }}
          onClick={() => setAdding(true)}
        >
          + Add a new address
        </button>
      )}
    </section>
  );
}
