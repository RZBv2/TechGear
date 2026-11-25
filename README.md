<div align="center">

# 🛒 TechGear

### A full-stack technology marketplace with device buyback

Discover and buy new and certified pre-owned tech, track your orders, and sell your old devices, all in one place.

<br />

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-0F172A?style=for-the-badge&logo=tailwindcss&logoColor=38BDF8)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-22.13+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)

<br />

[Screenshots](#-screenshots) •
[Highlights](#-highlights) •
[Getting Started](#-getting-started) •
[Documents](#-project-documents) •
[Team](#-team)

</div>

---

## 📖 Overview

TechGear is an e-commerce platform for discovering and purchasing new and certified pre-owned technology products. Customers can compare products, manage a cart and wishlist, place and track orders, review products, and submit used-device sell requests. An admin dashboard supports product, customer, order, and buyback-request management.

> [!NOTE]
> This repository contains the application in [`TechGear/`](TechGear/), with project reports and presentation files in [`Documents/`](Documents/).

## 📸 Screenshots

<div align="center">

<a href="https://postimg.cc/V5GPLZL3">
  <img src="home.png" alt="TechGear application preview" width="100%" />
</a>

<sub><b>TechGear</b> — application preview</sub>

</div>

## 👥 Team

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

## ✨ Highlights

| | Feature | Description |
|:-:|---|---|
| 🔍 | **Product catalog** | Search, category browsing, filters, sorting, and product details |
| 🔄 | **New & pre-owned** | Both product types, with comparison, cart, and wishlist |
| 🔐 | **Customer accounts** | Email verification required before sign-in |
| 📦 | **Orders** | Checkout, order history, order tracking, and product reviews |
| ♻️ | **Device buyback** | Used-device sell-request workflow |
| 🛠️ | **Admin dashboard** | Manage products, customers, orders, and sell requests |
| 🗄️ | **Reliable data** | SQLite persistence, server-side price and stock validation, and audit records |
| 📱 | **Responsive UI** | Built with React and Tailwind CSS |

## 🧰 Technology

| Layer | Stack |
|---|---|
| **Frontend** | React, TypeScript, Tailwind CSS |
| **Application framework** | TanStack Start, Vite |
| **Database** | SQLite using Node.js `node:sqlite` |
| **Validation & forms** | Zod, React Hook Form |
| **Email** | Nodemailer with configurable SMTP |
| **Auth & security** | scrypt-derived password hashes, database-backed sessions, HttpOnly cookies, server-side authorization, time-limited email verification codes |

## 🚀 Getting Started

### Prerequisites

Install **Node.js 22.13 or newer** and npm. The built-in `node:sqlite` adapter is required.

### Install and run

```bash
git clone https://github.com/RZBv2/TechGear.git
cd TechGear/TechGear
npm install
npm run dev
```

Open the local URL printed by the development server in your browser.

To create a production build:

```bash
npm run build
```

> [!TIP]
> The SQLite database is stored under `TechGear/data/techgear.sqlite`. Keep this file on persistent storage for deployments and back it up before upgrades.

## ✉️ Email Verification Configuration

Customer registration uses a six-digit email verification code delivered through SMTP. Configure these values in the deployment environment.

> [!WARNING]
> Do not commit real secrets or credentials to Git.

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

## 🔒 Security and Payment Notes

The application validates important checkout data on the server, including product identifiers, current prices, discounts, stock, customer identity, and order totals. Administrative operations use server-side authorization, and administrative activity is recorded in audit logs.

> [!IMPORTANT]
> A live payment gateway and courier integration are not included. Non-cash-on-delivery payment options should not be interpreted as completed payments unless a payment provider has been integrated and verified.

**Deployment checklist**

- Use HTTPS.
- Use strong environment secrets.
- Keep the database on persistent storage.
- Restrict access to logs and database files.
- Take regular backups.
- Change any initial administrator password before using a deployment beyond a demonstration environment.

## 🗂️ Project Structure

```text
.
├── Documents/       # Project report and presentation
└── TechGear/        # Application source, assets, and setup notes
    ├── src/
    ├── public/
    ├── data/
    └── SQLITE_SETUP.md
```

## 📄 Project Documents

- 📕 [Project report](Documents/TechGear.pdf)
- 📊 [Project presentation](Documents/TechGear.pptx)
- 🗄️ [SQLite setup and operational notes](TechGear/SQLITE_SETUP.md)



## 🧭 Current Scope and Future Integrations

**Included:** customer accounts, email verification, catalog browsing, checkout and order workflows, admin tools, and used-device buyback requests.

**Not included yet:** live third-party payment processing, real courier API integration, SMS delivery, and automated tax or invoice integration. These may be added later.

## 🌱 Suggested Improvements

- Automated unit and end-to-end tests
- CI checks for lint and build
- Production deployment instructions
- More screenshots or a short demo
- Documented backup and restore procedures

> Payment gateway and courier integrations should be added only with provider credentials, verified callbacks/webhooks, and appropriate security checks.



<div align="center">

<br />

⭐ If you like this project, consider giving it a star!

</div>
