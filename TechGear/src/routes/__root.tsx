import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "../lib/auth";
import { StoreProvider } from "../lib/store";
import { AxisChatbot } from "../components/techgear/AxisChatbot";
import { syncManagedProducts } from "../lib/productAdmin";

function NotFoundComponent() {
  return (
    <div
      className="tg"
      style={{
        display: "grid",
        minHeight: "100vh",
        alignItems: "center",
        background: "var(--tg-bg)",
        color: "var(--tg-text)",
      }}
    >
      <div
        className="container"
        style={{
          display: "grid",
          placeItems: "center",
          textAlign: "center",
          gap: "var(--space-sm)",
        }}
      >
        <h1 className="section-title" style={{ fontSize: "var(--step-4)" }}>
          404
        </h1>
        <h2 className="section-title" style={{ fontSize: "var(--step-2)" }}>
          Page not found
        </h2>
        <p className="section-lead">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link className="btn btn--primary" to="/">
          Go home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div
      className="tg"
      style={{
        display: "grid",
        minHeight: "100vh",
        alignItems: "center",
        background: "var(--tg-bg)",
        color: "var(--tg-text)",
      }}
    >
      <div
        className="container"
        style={{
          display: "grid",
          placeItems: "center",
          textAlign: "center",
          gap: "var(--space-sm)",
        }}
      >
        <h1 className="section-title" style={{ fontSize: "var(--step-2)" }}>
          This page didn&apos;t load
        </h1>
        <p className="section-lead">
          Something went wrong on our end. You can try refreshing or head back
          home.
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "var(--space-2xs)",
          }}
        >
          <button
            className="btn btn--primary"
            type="button"
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Try again
          </button>
          <a className="btn btn--ghost" href="/">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    head: () => ({
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: "TechGear — Premium Technology Marketplace" },
        {
          name: "description",
          content:
            "Buy new tech, shop certified pre-owned devices, and sell your old device to TechGear.",
        },
        { name: "author", content: "TechGear" },
        {
          property: "og:title",
          content: "TechGear — Premium Technology Marketplace",
        },
        {
          property: "og:description",
          content:
            "Buy new tech, shop certified pre-owned devices, and sell your old device to TechGear.",
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:site", content: "@Lovable" },
        {
          name: "twitter:title",
          content: "TechGear — Premium Technology Marketplace",
        },
        {
          name: "twitter:description",
          content:
            "Buy new tech, shop certified pre-owned devices, and sell your old device to TechGear.",
        },
        {
          property: "og:image",
          content:
            "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/147a592dc15b4eff24fd9af5cf1652ca/id-preview-429e45f9--c3f18b4a-1547-49e5-8c91-aa96a161e3ef.lovable.app-1786391100681.png",
        },
        {
          name: "twitter:image",
          content:
            "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/147a592dc15b4eff24fd9af5cf1652ca/id-preview-429e45f9--c3f18b4a-1547-49e5-8c91-aa96a161e3ef.lovable.app-1786391100681.png",
        },
      ],
      links: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossOrigin: "anonymous",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap",
        },
        {
          rel: "stylesheet",
          href: appCss,
        },
        { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      ],
    }),
    shellComponent: RootShell,
    component: RootComponent,
    notFoundComponent: NotFoundComponent,
    errorComponent: ErrorComponent,
  },
);

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="tg">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [, setCatalogVersion] = useState(0);
  useEffect(() => {
    void syncManagedProducts().then(() =>
      setCatalogVersion((version) => version + 1),
    );
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StoreProvider>
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
          <div className="toast-stack" data-toast-stack aria-live="polite" />
          <AxisChatbot />
        </StoreProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
