import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { LogOut, ShieldCheck } from "lucide-react";
import { Footer, Header, MobileDrawer } from "@/components/techgear/Sections";
import { getCurrentUser, serverSignIn, serverSignOut } from "@/lib/serverAuth";

type AdminAccount = {
  id: string;
  name: string;
  username: string;
  isMain: boolean;
};

const ADMIN_TABS = [
  { label: "Dashboard", to: "/admin" as const },
  { label: "Orders", to: "/adminOrders" as const },
  { label: "Sell Requests", to: "/adminSellRequests" as const },
  { label: "Customers", to: "/adminCustomers" as const },
  { label: "Products", to: "/adminProducts" as const },
];

export function AdminLayout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const [admin, setAdmin] = useState<AdminAccount | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        setAdmin(
          user?.role === "admin"
            ? {
                id: user.id,
                name: user.name,
                username: user.email.split("@")[0] ?? "",
                isMain: user.id === "admin-main",
              }
            : null,
        );
      })
      .catch(() => setAdmin(null))
      .finally(() => setReady(true));
  }, []);
  return (
    <>
      <Header />
      <MobileDrawer />
      <main className="section section--below-header">
        <div className="container">
          {!ready ? null : !admin ? (
            <AdminLogin onSuccess={() => window.location.reload()} />
          ) : (
            <>
              <header className="admin-header section-head">
                <div>
                  <span className="eyebrow">Restricted workspace</span>
                  <h1 className="section-title">{title}</h1>
                  <p className="category-card__desc">
                    Signed in as {admin.name} · @{admin.username}
                  </p>
                </div>
                <button
                  className="btn btn--ghost admin-sign-out"
                  type="button"
                  onClick={async () => {
                    await serverSignOut();
                    setAdmin(null);
                  }}
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </header>
              <nav className="admin-tabs" aria-label="Admin sections">
                {ADMIN_TABS.map((tab) => (
                  <Link
                    key={tab.to}
                    to={tab.to}
                    className="admin-tabs__tab"
                    activeProps={{ className: "admin-tabs__tab is-active" }}
                    activeOptions={{ exact: tab.to === "/admin" }}
                  >
                    {tab.label}
                  </Link>
                ))}
                {admin.isMain ? (
                  <Link
                    to="/admin"
                    hash="admin-access"
                    className="admin-tabs__tab"
                  >
                    Admin access
                  </Link>
                ) : null}
                <Link to="/" className="admin-tabs__tab admin-tabs__tab--back">
                  ← Back to store
                </Link>
              </nav>
              {children}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function AdminLogin({
  onSuccess,
}: {
  onSuccess: (admin: AdminAccount) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const email = username.trim().includes("@")
        ? username.trim()
        : `${username.trim().toLowerCase()}@techgear.local`;
      const user = await serverSignIn({ data: { email, password } });
      if (!user || user.role !== "admin") {
        setError("Username or password is incorrect.");
        return;
      }
      onSuccess({
        id: user.id,
        name: user.name,
        username: user.email.split("@")[0] ?? "",
        isMain: user.id === "admin-main",
      });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to sign in right now.",
      );
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <section className="panel admin-login">
      <div className="admin-login__icon">
        <ShieldCheck size={22} />
      </div>
      <span className="eyebrow">Staff only</span>
      <h1 className="section-title">Admin sign in</h1>
      <p className="section-lead">
        Access orders, customers, products and store operations from one
        workspace.
      </p>
      <form onSubmit={submit}>
        <label className="form-field">
          <span>Username</span>
          <input
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </label>
        <label className="form-field">
          <span>Password</span>
          <input
            autoComplete="current-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {error ? <p className="auth-forms__error">{error}</p> : null}
        <button
          className="btn btn--primary"
          type="submit"
          disabled={submitting}
        >
          {submitting ? "Signing in…" : "Sign in to dashboard"}
        </button>
      </form>
    </section>
  );
}
