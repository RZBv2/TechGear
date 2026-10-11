import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Package,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  TrendingUp,
  UserPlus,
  Users,
  WalletCards,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AdminLayout } from "@/components/techgear/AdminLayout";
import { formatPrice } from "@/data/api";
import { getManagedProducts, syncManagedProducts } from "@/lib/productAdmin";
import { type Order } from "@/lib/orders";
import {
  getCurrentUser,
  serverAddAdmin,
  serverListAdmins,
  serverListCustomers,
  serverRemoveAdmin,
} from "@/lib/serverAuth";
import { getAdminInsights, type AdminInsights } from "@/lib/serverInsights";
import { getAdminServerOrders } from "@/lib/serverOrders";
import { bootTechGear } from "@/scripts/motion";

type AdminAccount = {
  id: string;
  name: string;
  username: string;
  isMain: boolean;
};
type AdminOrder = Order & { customerEmail: string };

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard — TechGear" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [customers, setCustomers] = useState(0);
  const [products, setProducts] = useState(0);
  const [insights, setInsights] = useState<AdminInsights | null>(null);
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [isMainAdmin, setIsMainAdmin] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const [
        orderRows,
        adminRows,
        customerRows,
        currentUser,
        _syncedCatalog,
        adminInsights,
      ] = await Promise.all([
        getAdminServerOrders(),
        serverListAdmins(),
        serverListCustomers(),
        getCurrentUser(),
        syncManagedProducts(),
        getAdminInsights(),
      ]);
      setOrders(orderRows as unknown as AdminOrder[]);
      setProducts(getManagedProducts().length);
      setAdmins(
        adminRows.map((item) => ({
          id: item.id,
          name: item.name,
          username: item.email.split("@")[0] ?? "",
          isMain: item.id === "admin-main",
        })),
      );
      setCustomers(customerRows.length);
      setInsights(adminInsights);
      setIsMainAdmin(currentUser?.id === "admin-main");
      setLastRefreshed(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    } catch {
      setOrders([]);
      setProducts(getManagedProducts().length);
      setAdmins([]);
      setCustomers(0);
      setInsights(null);
      setIsMainAdmin(false);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    bootTechGear();
    void refresh();
    const onStorage = () => void refresh();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const revenue =
    insights?.revenue ?? orders.reduce((sum, order) => sum + order.total, 0);
  const averageOrder = orders.length ? revenue / orders.length : 0;
  const STATUS_COLORS: Record<string, string> = {
    Processing: "#f5a524",
    Confirmed: "#3b82f6",
    Shipped: "#7c5cff",
    Delivered: "#22c55e",
    Cancelled: "#f43f5e",
  };
  const statusChartData = (
    ["Processing", "Confirmed", "Shipped", "Delivered", "Cancelled"] as const
  ).map((status) => ({
    status,
    count: insights?.orderStatus[status] ?? 0,
  }));
  const hasStatusData = statusChartData.some((row) => row.count > 0);
  const deliveredOrders = insights?.orderStatus.Delivered ?? 0;
  const openOrders =
    orders.length - deliveredOrders - (insights?.orderStatus.Cancelled ?? 0);

  return (
    <AdminLayout title="Dashboard">
      <section
        className="panel admin-hero"
        aria-labelledby="admin-overview-title"
      >
        <div className="admin-hero__copy">
          <div className="admin-hero__eyebrow">
            <span className="status-dot" aria-hidden="true" />
            <span>Live operations workspace</span>
          </div>
          <h1 id="admin-overview-title">Store at a glance.</h1>
          <p>
            Monitor orders, inventory, customers and revenue from one focused
            control center. Your latest server data is shown below.
          </p>
          <div className="admin-hero__meta">
            <span>
              <ShieldCheck size={14} /> Secure admin session
            </span>
            {lastRefreshed ? (
              <span>
                <Clock3 size={14} /> Updated at {lastRefreshed}
              </span>
            ) : null}
          </div>
        </div>
        <div className="admin-hero__actions">
          <button
            className="btn btn--ghost"
            type="button"
            onClick={() => void refresh()}
            disabled={refreshing}
          >
            <RefreshCw
              size={15}
              className={refreshing ? "admin-spin" : undefined}
            />
            {refreshing ? "Refreshing…" : "Refresh data"}
          </button>
          <Link className="btn btn--primary" to="/adminOrders">
            Manage orders <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>

      {insights && insights.lowStockProducts > 0 ? (
        <div className="panel admin-alert-banner" role="status">
          <AlertTriangle size={18} />
          <span>
            <strong>{insights.lowStockProducts}</strong> product
            {insights.lowStockProducts === 1 ? "" : "s"} running low on stock.
          </span>
          <Link className="btn btn--ghost" to="/adminProducts">
            Review inventory
          </Link>
        </div>
      ) : null}

      <section
        className="admin-stats admin-stats--primary"
        aria-label="Store performance"
      >
        <Metric
          icon={<WalletCards size={18} />}
          label="Total revenue"
          value={formatPrice(revenue)}
          meta="All recorded orders"
        />
        <Metric
          icon={<ShoppingBag size={18} />}
          label="Total orders"
          value={String(orders.length)}
          meta={`${openOrders > 0 ? openOrders : 0} active in workflow`}
        />
        <Metric
          icon={<Users size={18} />}
          label="Customers"
          value={String(customers)}
          meta="Registered accounts"
        />
        <Metric
          icon={<Package size={18} />}
          label="Catalog items"
          value={String(products)}
          meta={`${insights?.lowStockProducts ?? 0} low stock`}
        />
        <Metric
          icon={<TrendingUp size={18} />}
          label="Average order"
          value={formatPrice(averageOrder)}
          meta="Revenue per order"
        />
      </section>

      <section className="admin-quick-actions" aria-label="Quick actions">
        <QuickAction
          icon={<ShoppingBag size={17} />}
          label="Order queue"
          detail={`${openOrders > 0 ? openOrders : 0} orders need attention`}
          to="/adminOrders"
        />
        <QuickAction
          icon={<Package size={17} />}
          label="Product catalog"
          detail={`${products} items currently managed`}
          to="/adminProducts"
        />
        <QuickAction
          icon={<Users size={17} />}
          label="Customer base"
          detail={`${customers} registered customers`}
          to="/adminCustomers"
        />
        {isMainAdmin ? (
          <QuickAction
            icon={<ShieldCheck size={17} />}
            label="Admin access"
            detail={`${admins.length} authorized admins`}
            to="/admin"
            hash="admin-access"
          />
        ) : null}
      </section>

      <div className="admin-dashboard-grid admin-dashboard-grid--primary">
        <section className="panel admin-panel-card admin-panel-card--orders">
          <div className="admin-section-head">
            <div>
              <span className="eyebrow">Operations</span>
              <h2
                className="section-title"
                style={{ fontSize: "var(--step-1)" }}
              >
                Recent orders
              </h2>
              <p className="admin-section-subtitle">
                The latest customer activity across your store.
              </p>
            </div>
            <Link className="btn btn--ghost" to="/adminOrders">
              View all <ArrowUpRight size={15} />
            </Link>
          </div>
          {orders.length === 0 ? (
            <div className="admin-empty-state">
              <ShoppingBag size={22} />
              <p>No orders have been placed yet.</p>
              <span>New orders will appear here automatically.</span>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 6).map((order) => (
                    <tr key={order.id}>
                      <td>
                        <strong>{order.id}</strong>
                        <small>
                          {new Date(order.submittedAt).toLocaleDateString()}
                        </small>
                      </td>
                      <td>{order.customerEmail}</td>
                      <td>
                        <strong>{formatPrice(order.total)}</strong>
                      </td>
                      <td>
                        <span className="badge badge--accent">
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel admin-panel-card admin-panel-card--snapshot">
          <div className="admin-section-head">
            <div>
              <span className="eyebrow">Signals</span>
              <h2
                className="section-title"
                style={{ fontSize: "var(--step-1)" }}
              >
                Operational snapshot
              </h2>
              <p className="admin-section-subtitle">
                Order health by current status.
              </p>
            </div>
            <Activity size={20} className="admin-section-icon" />
          </div>
          {hasStatusData ? (
            <div className="admin-chart">
              <ResponsiveContainer width="100%" height={184}>
                <BarChart
                  data={statusChartData}
                  margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="status"
                    tick={{ fill: "var(--tg-text-dim)", fontSize: 10 }}
                    axisLine={{ stroke: "var(--tg-line)" }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "var(--tg-text-dim)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(124,92,255,0.08)" }}
                    contentStyle={{
                      background: "var(--tg-bg-elevated)",
                      border: "1px solid var(--tg-line)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {statusChartData.map((row) => (
                      <Cell
                        key={row.status}
                        fill={STATUS_COLORS[row.status] ?? "var(--tg-accent)"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="admin-empty-state admin-empty-state--compact">
              <Activity size={20} />
              <p>No order activity yet.</p>
            </div>
          )}
          <div className="admin-status-grid">
            {(
              [
                "Processing",
                "Confirmed",
                "Shipped",
                "Delivered",
                "Cancelled",
              ] as const
            ).map((status) => (
              <div className="admin-status-pill" key={status}>
                <span>{status}</span>
                <strong>{insights?.orderStatus[status] ?? 0}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="admin-dashboard-grid admin-dashboard-grid--secondary">
        <section className="panel admin-panel-card">
          <div className="admin-section-head">
            <div>
              <span className="eyebrow">Best sellers</span>
              <h2
                className="section-title"
                style={{ fontSize: "var(--step-1)" }}
              >
                Top products
              </h2>
              <p className="admin-section-subtitle">
                Products contributing the most value.
              </p>
            </div>
            <TrendingUp size={20} className="admin-section-icon" />
          </div>
          {!insights?.topProducts.length ? (
            <div className="admin-empty-state">
              <TrendingUp size={22} />
              <p>No sales recorded yet.</p>
              <span>Top products will appear once orders come in.</span>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Units sold</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {insights.topProducts.map((product, index) => (
                    <tr key={product.id}>
                      <td>
                        <strong className="admin-rank">#{index + 1}</strong>{" "}
                        {product.name}
                      </td>
                      <td>{product.units}</td>
                      <td>
                        <strong>{formatPrice(product.revenue)}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel admin-panel-card">
          <div className="admin-section-head">
            <div>
              <span className="eyebrow">Control room</span>
              <h2
                className="section-title"
                style={{ fontSize: "var(--step-1)" }}
              >
                Recent activity
              </h2>
              <p className="admin-section-subtitle">
                A traceable record of workspace changes.
              </p>
            </div>
            <CheckCircle2 size={20} className="admin-section-icon" />
          </div>
          {insights?.recentAudit.length ? (
            <div className="admin-activity-list">
              {insights.recentAudit.slice(0, 6).map((entry, index) => (
                <div
                  className="admin-activity-item"
                  key={`${entry.action}-${entry.entityId ?? "none"}-${index}`}
                >
                  <span className="admin-activity-item__icon">
                    <Activity size={14} />
                  </span>
                  <div>
                    <strong>{entry.action}</strong>
                    <small>
                      {entry.entityType}
                      {entry.entityId ? ` · ${entry.entityId}` : ""}
                    </small>
                  </div>
                  <time>{new Date(entry.createdAt).toLocaleDateString()}</time>
                </div>
              ))}
            </div>
          ) : (
            <div className="admin-empty-state">
              <CheckCircle2 size={22} />
              <p>No audit activity yet.</p>
              <span>Admin actions will be logged here.</span>
            </div>
          )}
        </section>
      </div>

      {isMainAdmin ? (
        <AdminAccess admins={admins} onChange={() => void refresh()} />
      ) : null}
    </AdminLayout>
  );
}

function Metric({
  icon,
  label,
  value,
  meta,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  meta: string;
}) {
  return (
    <article className="panel admin-stat">
      <div className="admin-stat__heading">
        <span className="admin-stat__icon">{icon}</span>
        <span className="admin-stat__label">{label}</span>
      </div>
      <strong>{value}</strong>
      <small>{meta}</small>
    </article>
  );
}

function QuickAction({
  icon,
  label,
  detail,
  to,
  hash,
}: {
  icon: ReactNode;
  label: string;
  detail: string;
  to: "/adminOrders" | "/adminProducts" | "/adminCustomers" | "/admin";
  hash?: string;
}) {
  return (
    <Link className="admin-quick-action" to={to} hash={hash}>
      <span className="admin-quick-action__icon">{icon}</span>
      <span>
        <strong>{label}</strong>
        <small>{detail}</small>
      </span>
      <ArrowUpRight size={16} />
    </Link>
  );
}

function AdminAccess({
  admins,
  onChange,
}: {
  admins: AdminAccount[];
  onChange: () => void;
}) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await serverAddAdmin({ data: { name, username, password } });
      setName("");
      setUsername("");
      setPassword("");
      setSuccess("Admin account created successfully.");
      onChange();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to create the admin account.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      className="panel admin-panel-card admin-access-panel"
      id="admin-access"
    >
      <div className="admin-section-head">
        <div>
          <span className="eyebrow">Main admin</span>
          <h2 className="section-title" style={{ fontSize: "var(--step-1)" }}>
            Admin access
          </h2>
          <p className="admin-section-subtitle">
            Manage who can access the TechGear operations workspace.
          </p>
        </div>
        <UserPlus size={20} className="admin-section-icon" />
      </div>
      <form className="admin-product-form" onSubmit={submit}>
        <div className="admin-product-form__grid">
          <label className="form-field">
            <span>Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>
          <label className="form-field">
            <span>Username</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </label>
          <label className="form-field">
            <span>Password</span>
            <input
              type="password"
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
        </div>
        {error ? (
          <p className="auth-forms__error" role="alert">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="form-success" role="status">
            {success}
          </p>
        ) : null}
        <button
          className="btn btn--primary"
          type="submit"
          disabled={submitting}
        >
          <UserPlus size={16} /> {submitting ? "Creating…" : "Add admin"}
        </button>
      </form>
      <div className="admin-accounts-list">
        {admins.map((admin) => (
          <div className="admin-account-row" key={admin.id}>
            <div>
              <strong>{admin.name}</strong>
              <small>
                @{admin.username}
                {admin.isMain ? " · Main admin" : ""}
              </small>
            </div>
            {!admin.isMain ? (
              <button
                className="icon-btn"
                type="button"
                aria-label={`Remove ${admin.username}`}
                onClick={async () => {
                  if (!window.confirm(`Remove @${admin.username}?`)) return;
                  try {
                    await serverRemoveAdmin({ data: { id: admin.id } });
                    onChange();
                  } catch (error) {
                    setError(
                      error instanceof Error
                        ? error.message
                        : "Unable to remove this admin.",
                    );
                  }
                }}
              >
                <Trash2 size={16} />
              </button>
            ) : (
              <span className="badge">Protected</span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
