# TechGear SQLite setup

TechGear এখন server-side SQLite persistence ব্যবহার করে। The database file is stored at `data/techgear.sqlite`; the server creates the schema and applies migrations on startup. The seeded catalog contains the existing TechGear products, and the main administrator is bootstrapped as `rzbv2` with the requested initial password `123456`.

## Local run

Use Node.js 22 or newer because the project uses the built-in `node:sqlite` adapter. From the project directory, run:

```bash
npm install
npm run dev
```

For a production bundle, run `npm run build` and preview it with the command printed by TanStack Start. Keep `data/techgear.sqlite` on persistent storage in the deployment environment and back it up before upgrades.

## Server-backed areas

The SQLite schema includes users, revocable auth sessions, products, orders, order items, order events, payment transactions, product reviews, notifications, and audit logs. Product CRUD is restricted to authenticated admins. Order totals and product prices are recalculated on the server, stock is decremented atomically during order creation, and cancellation can return stock. Admin status updates create order events, audit records, and customer notifications.

Customer credentials are stored with scrypt-derived password hashes. Authentication uses database-backed sessions delivered through an HttpOnly cookie. The initial administrator password should be changed immediately after the first successful login, and a deployment should set a strong session secret and HTTPS-only cookies according to its hosting environment.

## Payments

Cash on delivery is represented as an explicit server payment state. Non-COD methods are represented as pending payment transactions so the order is not falsely marked as paid. A live bKash, SSLCommerz, or other gateway still requires merchant credentials, callback URLs, signature verification, and webhook handling; those values are intentionally not fabricated in this repository.

## Email verification

New customer accounts must verify their email with a six-digit code before they can sign in. Codes are stored only as hashes, expire after 15 minutes, allow at most five failed attempts, and can be resent no more than once per minute. Verification creates the normal revocable HttpOnly session after the code is accepted. The bootstrap administrator is marked verified automatically and is not blocked by this flow.

Configure SMTP in the deployment environment; do not commit these values:

```bash
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password
SMTP_FROM="TechGear <no-reply@example.com>"
TECHGEAR_APP_URL=https://your-domain.example
TECHGEAR_VERIFICATION_SECRET=use-a-long-random-secret
```

In development, if SMTP is not configured, the code is logged by the server so the flow can be tested locally. In production, signup fails safely until SMTP is configured. Existing databases receive the `users.email_verified_at` column and `email_verification_tokens` table automatically on startup.

## Current client-only state

Cart, wishlist, and comparison selections remain browser UX state. They do not establish trust for checkout: the server validates the selected product IDs, prices, discounts, stock, customer identity, and order total. The comparison page is available at `/compare`, while the storefront catalog is hydrated from SQLite after the first server read.

## Verification

The production build completed successfully with `npm run build`. The SQLite database was checked for the expected tables and contained 191 seeded products and one bootstrap administrator at handoff. Build output still reports deprecation warnings for TanStack's `inputValidator()` API; these are non-blocking and should be migrated to `.validator()` in a future dependency-maintenance pass.
