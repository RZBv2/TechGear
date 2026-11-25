# TechGear

**A full-stack technology marketplace with device buyback**

TechGear is an e-commerce platform for discovering and purchasing new and certified pre-owned technology products. Customers can compare products, manage a cart and wishlist, place and track orders, review products, and submit used-device sell requests. An admin dashboard supports product, customer, order, and buyback-request management.

> This repository contains the application in [`TechGear/`](TechGear/), with project reports and presentation files in [`Documents/`](Documents/).

## Team

<table align="center">
  <tr>
    <td align="center" width="320">
      <a href="https://github.com/RZBv2">
        <img src="https://github.com/RZBv2.png?size=180" width="120" alt="Md. Razab Ali GitHub profile" />
      </a>
      <br />
      <strong><a href="https://github.com/RZBv2">Md. Razab Ali</a></strong>
      <br />
      Backend development, security,<br />
      SMTP-based verification, and bug fixing.
    </td>
    <td align="center" width="320">
      <a href="https://github.com/zerotwo5">
        <img src="https://github.com/zerotwo5.png?size=180" width="120" alt="Md. Tanvir Rahman Pranto GitHub profile" />
      </a>
      <br />
      <strong><a href="https://github.com/zerotwo5">Md. Tanvir Rahman Pranto</a></strong>
      <br />
      Frontend development,<br />
      UX/UI design, testing, and bug fixing.
    </td>
  </tr>
</table>

## Highlights

- Product catalog with search, category browsing, filters, sorting, and product details.
- New and pre-owned products, including product comparison, cart, and wishlist experiences.
- Customer accounts with email verification before sign-in.
- Checkout, order history, order tracking, and product reviews.
- Used-device sell-request workflow.
- Admin dashboard for managing products, customers, orders, and sell requests.
- Server-backed SQLite persistence, server-side price and stock validation, and audit records.
- Responsive interface built with React and Tailwind CSS.

## Technology

- **Frontend:** React, TypeScript, Tailwind CSS
- **Application framework:** TanStack Start and Vite
- **Database:** SQLite using Node.js `node:sqlite`
- **Validation and forms:** Zod, React Hook Form
- **Email:** Nodemailer with configurable SMTP
- **Authentication/security:** scrypt-derived password hashes, database-backed sessions, HttpOnly cookies, server-side authorization, and time-limited email verification codes

## Getting started

### Prerequisites

Install **Node.js 22.13 or newer** and npm. The built-in `node:sqlite` adapter is required.

### Install and run

```bash
git clone https://github.com/RZBv2/TechGear.git
cd TechGear/TechGear
npm install
npm run dev
```

Open the local URL printed by the development server in your browser. To create a production build, run:

```bash
npm run build
```

The SQLite database is stored under `TechGear/data/techgear.sqlite`. Keep this file on persistent storage for deployments and back it up before upgrades.

## Email verification configuration

Customer registration uses a six-digit email verification code delivered through SMTP. Configure these values in the deployment environment; do not commit real secrets or credentials to Git:

```dotenv
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASSWORD=replace-with-your-smtp-password
SMTP_FROM="TechGear <no-reply@example.com>"
TECHGEAR_APP_URL=https://your-domain.example
TECHGEAR_VERIFICATION_SECRET=replace-with-a-long-random-secret
```

Verification codes are stored as hashes, expire after 15 minutes, and have attempt and resend limits. In development, the project documentation describes a local testing path when SMTP is not configured. Production signup requires SMTP configuration.

## Security and payment notes

The application validates important checkout data on the server, including product identifiers, current prices, discounts, stock, customer identity, and order totals. Administrative operations use server-side authorization, and administrative activity is recorded in audit logs.

A live payment gateway and courier integration are not included. Non-cash-on-delivery payment options should not be interpreted as completed payments unless a payment provider has been integrated and verified. For deployment, use HTTPS, strong environment secrets, persistent database storage, restricted access to logs and database files, and regular backups. Change any initial administrator password before using a deployment beyond a demonstration environment.

## Project structure

```text
.
├── Documents/       # Project report and presentation
└── TechGear/        # Application source, assets, and setup notes
    ├── src/
    ├── public/
    ├── data/
    └── SQLITE_SETUP.md
```

## Project documents

- [Project report](Documents/TechGear.pdf)
- [Project presentation](Documents/TechGear.pptx)
- [SQLite setup and operational notes](TechGear/SQLITE_SETUP.md)

## Current scope and future integrations

The project includes customer accounts, email verification, catalog browsing, checkout and order workflows, admin tools, and used-device buyback requests. Live third-party payment processing, real courier API integration, SMS delivery, and automated tax or invoice integration are outside the current implemented scope and may be added later.

## Suggested improvements

Potential next steps include automated unit and end-to-end tests, CI checks for lint/build, production deployment instructions, screenshots or a short demo, and documented backup/restore procedures. Payment gateway and courier integrations should be added only with provider credentials, verified callbacks/webhooks, and appropriate security checks.
