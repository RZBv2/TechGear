import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { randomBytes } from "node:crypto";
import { allProducts, type CatalogProduct } from "@/data/products";
import { calculateDiscount, findCoupon } from "@/lib/coupons";

const databaseFile =
  process.env["TECHGEAR_DATABASE_PATH"] ??
  resolve(process.cwd(), "data/techgear.sqlite");
mkdirSync(dirname(databaseFile), { recursive: true });

const database = new DatabaseSync(databaseFile);
database.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");

function migrate() {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL DEFAULT '',
      phone TEXT,
      password_hash TEXT,
      role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
      is_active INTEGER NOT NULL DEFAULT 1,
      email_verified_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS auth_sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      brand TEXT NOT NULL,
      product_name TEXT NOT NULL,
      model TEXT NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT NOT NULL,
      price INTEGER NOT NULL,
      previous_price INTEGER,
      discount_percentage INTEGER,
      currency TEXT NOT NULL DEFAULT 'BDT',
      short_description TEXT NOT NULL,
      full_description TEXT,
      specifications_json TEXT NOT NULL DEFAULT '{}',
      colors_json TEXT NOT NULL DEFAULT '[]',
      warranty TEXT,
      condition TEXT NOT NULL DEFAULT 'New',
      release_year INTEGER NOT NULL,
      rating REAL NOT NULL DEFAULT 0,
      review_count INTEGER NOT NULL DEFAULT 0,
      stock_quantity INTEGER NOT NULL DEFAULT 0,
      stock_status TEXT NOT NULL DEFAULT 'out' CHECK (stock_status IN ('in', 'low', 'out')),
      featured INTEGER NOT NULL DEFAULT 0,
      trending INTEGER NOT NULL DEFAULT 0,
      new_arrival INTEGER NOT NULL DEFAULT 0,
      image_key TEXT NOT NULL,
      product_images_json TEXT NOT NULL DEFAULT '[]',
      gallery_images_json TEXT NOT NULL DEFAULT '[]',
      image_meta_json TEXT NOT NULL DEFAULT '{}',
      source_ref_json TEXT,
      pre_owned_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_id TEXT,
      customer_email TEXT NOT NULL,
      subtotal INTEGER NOT NULL,
      discount INTEGER NOT NULL DEFAULT 0,
      coupon_code TEXT,
      total INTEGER NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      payment_method TEXT NOT NULL CHECK (payment_method IN ('bkash', 'nagad', 'cod')),
      status TEXT NOT NULL DEFAULT 'Processing' CHECK (status IN ('Processing', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled')),
      submitted_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      price INTEGER NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS order_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      status TEXT NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS payment_transactions (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL UNIQUE,
      method TEXT NOT NULL CHECK (method IN ('bkash', 'nagad', 'cod')),
      provider TEXT NOT NULL DEFAULT 'manual',
      amount INTEGER NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending', 'cash_on_delivery', 'paid', 'failed')),
      provider_reference TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_stock_status ON products(stock_status);
    CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_user_id TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      order_id TEXT,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read, created_at);

    CREATE TABLE IF NOT EXISTS product_reviews (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      review_text TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(product_id, customer_id),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON product_reviews(product_id, created_at);

    CREATE TABLE IF NOT EXISTS sell_requests (
      id TEXT PRIMARY KEY,
      customer_id TEXT,
      customer_email TEXT NOT NULL,
      category TEXT NOT NULL,
      category_name TEXT NOT NULL,
      model TEXT NOT NULL,
      condition TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      asking_price INTEGER NOT NULL,
      description TEXT,
      photo_data_url TEXT,
      status TEXT NOT NULL DEFAULT 'Pending review' CHECK (status IN ('Pending review', 'Reviewing', 'Offer sent', 'Accepted', 'Rejected', 'Completed')),
      submitted_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sell_requests_customer_email ON sell_requests(customer_email);
    CREATE INDEX IF NOT EXISTS idx_sell_requests_status ON sell_requests(status);
  `);

  const userColumns = database
    .prepare("PRAGMA table_info(users)")
    .all() as Array<Record<string, unknown>>;
  if (!userColumns.some((column) => column["name"] === "email_verified_at")) {
    database.exec("ALTER TABLE users ADD COLUMN email_verified_at TEXT");
  }

  database.exec(`
    CREATE TABLE IF NOT EXISTS email_verification_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      consumed_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_email_verification_user ON email_verification_tokens(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_email_verification_expiry ON email_verification_tokens(expires_at);
  `);

  const migration = database
    .prepare("SELECT version FROM schema_migrations WHERE version = 1")
    .get();
  if (!migration) {
    database
      .prepare(
        "INSERT INTO schema_migrations (version, applied_at) VALUES (1, ?)",
      )
      .run(new Date().toISOString());
  }

  const verificationMigration = database
    .prepare("SELECT version FROM schema_migrations WHERE version = 2")
    .get();
  if (!verificationMigration) {
    database
      .prepare(
        "INSERT INTO schema_migrations (version, applied_at) VALUES (2, ?)",
      )
      .run(new Date().toISOString());
  }
}

function toJson(value: unknown): string {
  return JSON.stringify(value ?? null);
}

function fromJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function mapProduct(
  row: Record<string, unknown>,
): CatalogProduct & { stockQuantity: number } {
  const value = (key: string) => row[key];
  return {
    id: String(value("id")),
    brand: String(value("brand")),
    productName: String(value("product_name")),
    model: String(value("model")),
    category: value("category") as CatalogProduct["category"],
    subcategory: String(value("subcategory")),
    price: Number(value("price")),
    ...(value("previous_price") == null
      ? {}
      : { previousPrice: Number(value("previous_price")) }),
    ...(value("discount_percentage") == null
      ? {}
      : { discountPercentage: Number(value("discount_percentage")) }),
    currency: "BDT",
    priceSource: "reference",
    lastVerified: String(value("updated_at")).slice(0, 10),
    rating: Number(value("rating")),
    reviewCount: Number(value("review_count")),
    stockStatus: value("stock_status") as CatalogProduct["stockStatus"],
    shortDescription: String(value("short_description")),
    ...(value("full_description") == null
      ? {}
      : { fullDescription: String(value("full_description")) }),
    specifications: fromJson(
      value("specifications_json"),
      {} as CatalogProduct["specifications"],
    ),
    colors: fromJson(value("colors_json"), [] as string[]),
    ...(value("warranty") == null
      ? {}
      : { warranty: String(value("warranty")) }),
    condition: value("condition") as CatalogProduct["condition"],
    releaseYear: Number(value("release_year")),
    ...(value("featured") ? { featured: true } : {}),
    ...(value("trending") ? { trending: true } : {}),
    ...(value("new_arrival") ? { newArrival: true } : {}),
    imageKey: String(value("image_key")),
    productImages: fromJson(value("product_images_json"), [] as string[]),
    galleryImages: fromJson(value("gallery_images_json"), [] as string[]),
    imageMeta: fromJson(
      value("image_meta_json"),
      {} as CatalogProduct["imageMeta"],
    ),
    ...(value("source_ref_json") == null
      ? {}
      : { specRef: fromJson(value("source_ref_json"), undefined) }),
    ...(value("pre_owned_json") == null
      ? {}
      : { preOwned: fromJson(value("pre_owned_json"), undefined) }),
    stockQuantity: Number(value("stock_quantity")),
  } as unknown as CatalogProduct & { stockQuantity: number };
}

function seedProducts() {
  const countRow = database
    .prepare("SELECT COUNT(*) AS count FROM products")
    .get();
  const count = Number(
    (countRow as Record<string, unknown> | undefined)?.["count"] ?? 0,
  );
  if (count > 0) return;
  const insert = database.prepare(`
    INSERT INTO products (
      id, brand, product_name, model, category, subcategory, price, previous_price,
      discount_percentage, currency, short_description, full_description,
      specifications_json, colors_json, warranty, condition, release_year, rating,
      review_count, stock_quantity, stock_status, featured, trending, new_arrival,
      image_key, product_images_json, gallery_images_json, image_meta_json,
      source_ref_json, pre_owned_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const now = new Date().toISOString();
  database.exec("BEGIN");
  try {
    for (const product of allProducts) {
      insert.run(
        product.id,
        product.brand,
        product.productName,
        product.model,
        product.category,
        product.subcategory,
        product.price,
        product.previousPrice ?? null,
        product.discountPercentage ?? null,
        product.currency,
        product.shortDescription,
        product.fullDescription ?? null,
        toJson(product.specifications),
        toJson(product.colors ?? []),
        product.warranty ?? null,
        product.condition,
        product.releaseYear,
        product.rating,
        product.reviewCount,
        product.stockStatus === "out"
          ? 0
          : product.stockStatus === "low"
            ? 5
            : 20,
        product.stockStatus,
        product.featured ? 1 : 0,
        product.trending ? 1 : 0,
        product.newArrival ? 1 : 0,
        product.imageKey,
        toJson(product.productImages),
        toJson(product.galleryImages),
        toJson(product.imageMeta),
        toJson(product.specRef),
        toJson(product.preOwned),
        now,
        now,
      );
    }
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

migrate();
seedProducts();

function writeAudit(
  actorUserId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  details: Record<string, unknown> = {},
) {
  database
    .prepare(
      "INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details_json, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .run(
      actorUserId,
      action,
      entityType,
      entityId,
      JSON.stringify(details),
      new Date().toISOString(),
    );
}

function writeNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  orderId?: string,
) {
  database
    .prepare(
      "INSERT INTO notifications (user_id, type, title, message, order_id, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .run(
      userId,
      type,
      title,
      message,
      orderId ?? null,
      new Date().toISOString(),
    );
}

export type AdminAnalytics = {
  revenue: number;
  orders: number;
  customers: number;
  products: number;
  lowStockProducts: number;
  orderStatus: Record<ServerOrderStatus, number>;
  topProducts: Array<{
    id: string;
    name: string;
    units: number;
    revenue: number;
  }>;
  recentAudit: Array<{
    action: string;
    entityType: string;
    entityId: string | null;
    actor: string | null;
    createdAt: string;
  }>;
};

export function getAdminAnalytics(): AdminAnalytics {
  const revenue = Number(
    (
      database
        .prepare(
          "SELECT COALESCE(SUM(total), 0) AS value FROM orders WHERE status <> 'Cancelled'",
        )
        .get() as Record<string, unknown>
    )["value"] ?? 0,
  );
  const orders = Number(
    (
      database.prepare("SELECT COUNT(*) AS value FROM orders").get() as Record<
        string,
        unknown
      >
    )["value"] ?? 0,
  );
  const customers = Number(
    (
      database
        .prepare(
          "SELECT COUNT(*) AS value FROM users WHERE role = 'customer' AND is_active = 1",
        )
        .get() as Record<string, unknown>
    )["value"] ?? 0,
  );
  const products = Number(
    (
      database
        .prepare("SELECT COUNT(*) AS value FROM products")
        .get() as Record<string, unknown>
    )["value"] ?? 0,
  );
  const lowStockProducts = Number(
    (
      database
        .prepare(
          "SELECT COUNT(*) AS value FROM products WHERE stock_quantity <= 5",
        )
        .get() as Record<string, unknown>
    )["value"] ?? 0,
  );
  const orderStatus: Record<ServerOrderStatus, number> = {
    Processing: 0,
    Confirmed: 0,
    Shipped: 0,
    Delivered: 0,
    Cancelled: 0,
  };
  for (const row of database
    .prepare("SELECT status, COUNT(*) AS value FROM orders GROUP BY status")
    .all()) {
    const value = row as Record<string, unknown>;
    const status = value["status"] as ServerOrderStatus;
    if (status in orderStatus)
      orderStatus[status] = Number(value["value"] ?? 0);
  }
  const topProducts = database
    .prepare(
      "SELECT product_id AS id, product_name AS name, SUM(quantity) AS units, SUM(price * quantity) AS revenue FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.status <> 'Cancelled' GROUP BY product_id, product_name ORDER BY units DESC, revenue DESC LIMIT 5",
    )
    .all()
    .map((row) => {
      const value = row as Record<string, unknown>;
      return {
        id: String(value["id"]),
        name: String(value["name"]),
        units: Number(value["units"]),
        revenue: Number(value["revenue"]),
      };
    });
  const recentAudit = database
    .prepare(
      "SELECT l.action, l.entity_type, l.entity_id, u.email AS actor, l.created_at FROM audit_logs l LEFT JOIN users u ON u.id = l.actor_user_id ORDER BY l.id DESC LIMIT 8",
    )
    .all()
    .map((row) => {
      const value = row as Record<string, unknown>;
      return {
        action: String(value["action"]),
        entityType: String(value["entity_type"]),
        entityId:
          value["entity_id"] == null ? null : String(value["entity_id"]),
        actor: value["actor"] == null ? null : String(value["actor"]),
        createdAt: String(value["created_at"]),
      };
    });
  return {
    revenue,
    orders,
    customers,
    products,
    lowStockProducts,
    orderStatus,
    topProducts,
    recentAudit,
  };
}

export function listNotifications(userId: string) {
  return database
    .prepare(
      "SELECT id, type, title, message, order_id, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 30",
    )
    .all(userId)
    .map((row) => {
      const value = row as Record<string, unknown>;
      return {
        id: Number(value["id"]),
        type: String(value["type"]),
        title: String(value["title"]),
        message: String(value["message"]),
        orderId: value["order_id"] == null ? null : String(value["order_id"]),
        isRead: Boolean(value["is_read"]),
        createdAt: String(value["created_at"]),
      };
    });
}

export function markNotificationRead(userId: string, notificationId: number) {
  database
    .prepare(
      "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
    )
    .run(notificationId, userId);
  return true;
}

export type ServerProductReview = {
  id: string;
  productId: string;
  author: string;
  rating: number;
  text: string;
  submittedAt: string;
};

export function listProductReviews(productId: string): ServerProductReview[] {
  return database
    .prepare(
      "SELECT id, product_id, author_name, rating, review_text, created_at FROM product_reviews WHERE product_id = ? ORDER BY created_at DESC",
    )
    .all(productId)
    .map((row) => {
      const value = row as Record<string, unknown>;
      return {
        id: String(value["id"]),
        productId: String(value["product_id"]),
        author: String(value["author_name"]),
        rating: Number(value["rating"]),
        text: String(value["review_text"]),
        submittedAt: String(value["created_at"]),
      };
    });
}

export function createProductReview(
  productId: string,
  customerId: string,
  authorName: string,
  rating: number,
  text: string,
): ServerProductReview {
  const product = database
    .prepare("SELECT id FROM products WHERE id = ?")
    .get(productId);
  if (!product) throw new Error("This product is no longer available.");
  const cleanText = text.trim();
  if (rating < 1 || rating > 5 || !Number.isInteger(rating))
    throw new Error("Pick a rating from 1 to 5 stars.");
  if (cleanText.length < 8 || cleanText.length > 1200)
    throw new Error("Review must be between 8 and 1,200 characters.");
  const existing = database
    .prepare(
      "SELECT id FROM product_reviews WHERE product_id = ? AND customer_id = ?",
    )
    .get(productId, customerId);
  if (existing) throw new Error("You have already reviewed this product.");
  const id = `RV-${randomBytes(10).toString("hex").toUpperCase()}`;
  const now = new Date().toISOString();
  database.exec("BEGIN IMMEDIATE");
  try {
    database
      .prepare(
        "INSERT INTO product_reviews (id, product_id, customer_id, author_name, rating, review_text, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .run(id, productId, customerId, authorName, rating, cleanText, now);
    const aggregate = database
      .prepare(
        "SELECT COUNT(*) AS count, COALESCE(AVG(rating), 0) AS rating FROM product_reviews WHERE product_id = ?",
      )
      .get(productId) as Record<string, unknown>;
    database
      .prepare(
        "UPDATE products SET rating = ?, review_count = ?, updated_at = ? WHERE id = ?",
      )
      .run(
        Number(Number(aggregate["rating"] ?? 0).toFixed(2)),
        Number(aggregate["count"] ?? 0),
        now,
        productId,
      );
    writeAudit(customerId, "review.created", "product", productId, {
      reviewId: id,
      rating,
    });
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
  const row = database
    .prepare(
      "SELECT id, product_id, author_name, rating, review_text, created_at FROM product_reviews WHERE id = ?",
    )
    .get(id) as Record<string, unknown>;
  return {
    id: String(row["id"]),
    productId: String(row["product_id"]),
    author: String(row["author_name"]),
    rating: Number(row["rating"]),
    text: String(row["review_text"]),
    submittedAt: String(row["created_at"]),
  };
}

export function listProducts(
  search?: string,
): Array<CatalogProduct & { stockQuantity: number }> {
  const query = search?.trim();
  const rows = query
    ? database
        .prepare(
          `SELECT * FROM products WHERE product_name LIKE ? OR brand LIKE ? OR model LIKE ? ORDER BY created_at DESC`,
        )
        .all(`%${query}%`, `%${query}%`, `%${query}%`)
    : database.prepare("SELECT * FROM products ORDER BY created_at DESC").all();
  return rows.map((row) => mapProduct(row as Record<string, unknown>));
}

export function getProduct(
  id: string,
): (CatalogProduct & { stockQuantity: number }) | null {
  const row = database.prepare("SELECT * FROM products WHERE id = ?").get(id);
  return row ? mapProduct(row as Record<string, unknown>) : null;
}

export function createProduct(
  product: CatalogProduct & { stockQuantity?: number },
  actorUserId: string | null = null,
) {
  const now = new Date().toISOString();
  const stockQuantity =
    product.stockQuantity ??
    (product.stockStatus === "out"
      ? 0
      : product.stockStatus === "low"
        ? 5
        : 20);
  database
    .prepare(
      `INSERT INTO products (id, brand, product_name, model, category, subcategory, price, previous_price, discount_percentage, currency, short_description, full_description, specifications_json, colors_json, warranty, condition, release_year, rating, review_count, stock_quantity, stock_status, featured, trending, new_arrival, image_key, product_images_json, gallery_images_json, image_meta_json, source_ref_json, pre_owned_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      product.id,
      product.brand,
      product.productName,
      product.model,
      product.category,
      product.subcategory,
      product.price,
      product.previousPrice ?? null,
      product.discountPercentage ?? null,
      "BDT",
      product.shortDescription,
      product.fullDescription ?? null,
      toJson(product.specifications),
      toJson(product.colors ?? []),
      product.warranty ?? null,
      product.condition,
      product.releaseYear,
      product.rating,
      product.reviewCount,
      stockQuantity,
      stockQuantity === 0 ? "out" : stockQuantity <= 5 ? "low" : "in",
      product.featured ? 1 : 0,
      product.trending ? 1 : 0,
      product.newArrival ? 1 : 0,
      product.imageKey,
      toJson(product.productImages),
      toJson(product.galleryImages),
      toJson(product.imageMeta),
      toJson(product.specRef),
      toJson(product.preOwned),
      now,
      now,
    );
  writeAudit(actorUserId, "product.created", "product", product.id, {
    name: product.productName,
    stockQuantity,
  });
  return getProduct(product.id);
}

export function deleteProduct(id: string, actorUserId: string | null = null) {
  const result = database.prepare("DELETE FROM products WHERE id = ?").run(id);
  const changed = Number(result.changes ?? 0) > 0;
  if (changed) writeAudit(actorUserId, "product.deleted", "product", id);
  return changed;
}

export function updateProduct(
  id: string,
  patch: Partial<CatalogProduct> & { stockQuantity?: number },
  actorUserId: string | null = null,
) {
  const current = getProduct(id);
  if (!current) return null;
  const next = { ...current, ...patch };
  const stockQuantity = patch.stockQuantity ?? current.stockQuantity;
  const stockStatus =
    stockQuantity === 0 ? "out" : stockQuantity <= 5 ? "low" : "in";
  database
    .prepare(
      `UPDATE products SET brand=?, product_name=?, model=?, category=?, subcategory=?, price=?, previous_price=?, discount_percentage=?, short_description=?, full_description=?, specifications_json=?, colors_json=?, warranty=?, condition=?, release_year=?, stock_quantity=?, stock_status=?, featured=?, trending=?, new_arrival=?, updated_at=? WHERE id=?`,
    )
    .run(
      next.brand,
      next.productName,
      next.model,
      next.category,
      next.subcategory,
      next.price,
      next.previousPrice ?? null,
      next.discountPercentage ?? null,
      next.shortDescription,
      next.fullDescription ?? null,
      toJson(next.specifications),
      toJson(next.colors ?? []),
      next.warranty ?? null,
      next.condition,
      next.releaseYear,
      stockQuantity,
      stockStatus,
      next.featured ? 1 : 0,
      next.trending ? 1 : 0,
      next.newArrival ? 1 : 0,
      new Date().toISOString(),
      id,
    );
  writeAudit(actorUserId, "product.updated", "product", id, {
    fields: Object.keys(patch),
    stockQuantity,
  });
  return getProduct(id);
}

export type ServerOrderItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
};
export type ServerOrderStatus =
  "Processing" | "Confirmed" | "Shipped" | "Delivered" | "Cancelled";
export type ServerPaymentMethod = "bkash" | "nagad" | "cod";
export type ServerOrder = {
  id: string;
  customerId: string | null;
  customerEmail: string;
  items: ServerOrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  total: number;
  phone: string;
  address: string;
  paymentMethod: ServerPaymentMethod;
  paymentStatus: "pending" | "cash_on_delivery" | "paid" | "failed";
  status: ServerOrderStatus;
  submittedAt: string;
  updatedAt: string;
  statusHistory: Array<{
    status: ServerOrderStatus;
    at: string;
    note?: string;
  }>;
};

function mapOrder(row: Record<string, unknown>): ServerOrder {
  const orderId = String(row["id"]);
  const itemRows = database
    .prepare(
      "SELECT id, product_id, product_name, price, quantity FROM order_items WHERE order_id = ? ORDER BY id ASC",
    )
    .all(orderId);
  const eventRows = database
    .prepare(
      "SELECT status, note, created_at FROM order_events WHERE order_id = ? ORDER BY id ASC",
    )
    .all(orderId);
  const paymentRow = database
    .prepare("SELECT status FROM payment_transactions WHERE order_id = ?")
    .get(orderId) as Record<string, unknown> | undefined;
  const items = itemRows.map((item) => {
    const value = item as Record<string, unknown>;
    return {
      id: String(value["product_id"]),
      name: String(value["product_name"]),
      price: Number(value["price"]),
      qty: Number(value["quantity"]),
    };
  });
  const statusHistory = eventRows.map((event) => {
    const value = event as Record<string, unknown>;
    const note = value["note"] == null ? undefined : String(value["note"]);
    return {
      status: value["status"] as ServerOrderStatus,
      at: String(value["created_at"]),
      ...(note ? { note } : {}),
    };
  });
  return {
    id: orderId,
    customerId: row["customer_id"] == null ? null : String(row["customer_id"]),
    customerEmail: String(row["customer_email"]),
    items,
    subtotal: Number(row["subtotal"]),
    discount: Number(row["discount"]),
    ...(row["coupon_code"] ? { couponCode: String(row["coupon_code"]) } : {}),
    total: Number(row["total"]),
    phone: String(row["phone"]),
    address: String(row["address"]),
    paymentMethod: row["payment_method"] as ServerPaymentMethod,
    paymentStatus:
      (paymentRow?.["status"] as ServerOrder["paymentStatus"] | undefined) ??
      "pending",
    status: row["status"] as ServerOrderStatus,
    submittedAt: String(row["submitted_at"]),
    updatedAt: String(row["updated_at"]),
    statusHistory,
  };
}

function generateServerOrderId() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const suffix = randomBytes(4).toString("hex").toUpperCase();
    const id = `TG-${date}-${suffix}`;
    if (!database.prepare("SELECT id FROM orders WHERE id = ?").get(id))
      return id;
  }
  throw new Error("Unable to allocate a unique order number.");
}

export function createOrder(input: {
  customerId: string;
  customerEmail: string;
  items: Array<{ id: string; qty: number }>;
  discount?: number;
  couponCode?: string;
  phone: string;
  address: string;
  paymentMethod: ServerPaymentMethod;
}) {
  if (input.items.length === 0) throw new Error("Your cart is empty.");
  if (!/^01[3-9]\d{8}$/.test(input.phone.replaceAll(" ", "")))
    throw new Error("Enter a valid Bangladesh phone number.");
  if (input.address.trim().length < 8)
    throw new Error("Enter a complete delivery address.");
  const orderId = generateServerOrderId();
  const now = new Date().toISOString();
  const normalizedPhone = input.phone.replaceAll(" ", "");
  const requestedItems = input.items.map((item) => ({
    id: item.id,
    qty: Math.max(1, Math.floor(item.qty)),
  }));
  database.exec("BEGIN IMMEDIATE");
  try {
    const resolvedItems: ServerOrderItem[] = [];
    let subtotal = 0;
    for (const item of requestedItems) {
      const row = database
        .prepare(
          "SELECT id, product_name, price, stock_quantity FROM products WHERE id = ?",
        )
        .get(item.id) as Record<string, unknown> | undefined;
      if (!row)
        throw new Error("One of the selected products is no longer available.");
      const stock = Number(row["stock_quantity"]);
      if (stock < item.qty)
        throw new Error(
          `${String(row["product_name"])} has only ${stock} unit${stock === 1 ? "" : "s"} available.`,
        );
      const price = Number(row["price"]);
      resolvedItems.push({
        id: String(row["id"]),
        name: String(row["product_name"]),
        price,
        qty: item.qty,
      });
      subtotal += price * item.qty;
    }
    const normalizedCoupon = input.couponCode?.trim().toUpperCase();
    const coupon = normalizedCoupon ? findCoupon(normalizedCoupon) : undefined;
    if (normalizedCoupon && !coupon)
      throw new Error("That coupon code is not valid.");
    const discount = coupon ? calculateDiscount(coupon, subtotal) : 0;
    const total = subtotal - discount;
    database
      .prepare(
        "INSERT INTO orders (id, customer_id, customer_email, subtotal, discount, coupon_code, total, phone, address, payment_method, status, submitted_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Processing', ?, ?)",
      )
      .run(
        orderId,
        input.customerId,
        input.customerEmail,
        subtotal,
        discount,
        coupon?.code ?? null,
        total,
        normalizedPhone,
        input.address.trim(),
        input.paymentMethod,
        now,
        now,
      );
    database
      .prepare(
        "INSERT INTO payment_transactions (id, order_id, method, provider, amount, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .run(
        `pay-${randomBytes(10).toString("hex")}`,
        orderId,
        input.paymentMethod,
        "manual",
        total,
        input.paymentMethod === "cod" ? "cash_on_delivery" : "pending",
        now,
        now,
      );
    const itemInsert = database.prepare(
      "INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES (?, ?, ?, ?, ?)",
    );
    const stockUpdate = database.prepare(
      "UPDATE products SET stock_quantity = ?, stock_status = ?, updated_at = ? WHERE id = ?",
    );
    for (const item of resolvedItems) {
      itemInsert.run(orderId, item.id, item.name, item.price, item.qty);
      const currentStock = Number(
        (
          database
            .prepare("SELECT stock_quantity FROM products WHERE id = ?")
            .get(item.id) as Record<string, unknown>
        )["stock_quantity"],
      );
      const nextStock = currentStock - item.qty;
      stockUpdate.run(
        nextStock,
        nextStock === 0 ? "out" : nextStock <= 5 ? "low" : "in",
        now,
        item.id,
      );
    }
    database
      .prepare(
        "INSERT INTO order_events (order_id, status, note, created_at) VALUES (?, 'Processing', ?, ?)",
      )
      .run(orderId, "Order received", now);
    writeAudit(input.customerId, "order.created", "order", orderId, {
      total,
      paymentMethod: input.paymentMethod,
      itemCount: resolvedItems.length,
    });
    writeNotification(
      input.customerId,
      "order",
      "Order received",
      `Your TechGear order ${orderId} has been received.`,
      orderId,
    );
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
  const row = database
    .prepare("SELECT * FROM orders WHERE id = ?")
    .get(orderId);
  return row ? mapOrder(row as Record<string, unknown>) : null;
}

export function getCustomerOrders(customerId: string) {
  const rows = database
    .prepare(
      "SELECT * FROM orders WHERE customer_id = ? ORDER BY submitted_at DESC",
    )
    .all(customerId);
  return rows.map((row) => mapOrder(row as Record<string, unknown>));
}

export function listOrders() {
  const rows = database
    .prepare("SELECT * FROM orders ORDER BY submitted_at DESC")
    .all();
  return rows.map((row) => mapOrder(row as Record<string, unknown>));
}

export function updateOrderStatus(
  id: string,
  status: ServerOrderStatus,
  note?: string,
  actorUserId: string | null = null,
) {
  const row = database.prepare("SELECT * FROM orders WHERE id = ?").get(id) as
    Record<string, unknown> | undefined;
  if (!row) return null;
  const current = row["status"] as ServerOrderStatus;
  if (current === "Cancelled" && status !== "Cancelled")
    throw new Error("Cancelled orders cannot be reopened.");
  if (current === status) return mapOrder(row);
  const now = new Date().toISOString();
  database.exec("BEGIN IMMEDIATE");
  try {
    if (status === "Cancelled" && current !== "Cancelled") {
      const items = database
        .prepare(
          "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
        )
        .all(id);
      for (const item of items) {
        const value = item as Record<string, unknown>;
        const productId = String(value["product_id"]);
        const quantity = Number(value["quantity"]);
        const product = database
          .prepare("SELECT stock_quantity FROM products WHERE id = ?")
          .get(productId) as Record<string, unknown> | undefined;
        if (product) {
          const nextStock = Number(product["stock_quantity"]) + quantity;
          database
            .prepare(
              "UPDATE products SET stock_quantity = ?, stock_status = ?, updated_at = ? WHERE id = ?",
            )
            .run(nextStock, nextStock <= 5 ? "low" : "in", now, productId);
        }
      }
    }
    database
      .prepare("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?")
      .run(status, now, id);
    database
      .prepare(
        "INSERT INTO order_events (order_id, status, note, created_at) VALUES (?, ?, ?, ?)",
      )
      .run(id, status, note ?? null, now);
    writeAudit(actorUserId, "order.status_updated", "order", id, {
      from: current,
      to: status,
      note: note ?? null,
    });
    if (row["customer_id"])
      writeNotification(
        String(row["customer_id"]),
        "order",
        `Order ${status.toLowerCase()}`,
        `Your TechGear order ${id} is now ${status.toLowerCase()}.`,
        id,
      );
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
  const updated = database.prepare("SELECT * FROM orders WHERE id = ?").get(id);
  return updated ? mapOrder(updated as Record<string, unknown>) : null;
}

export { database };

export type ServerSellRequestStatus =
  | "Pending review"
  | "Reviewing"
  | "Offer sent"
  | "Accepted"
  | "Rejected"
  | "Completed";

export type ServerSellRequest = {
  id: string;
  customerId: string | null;
  customerEmail: string;
  category: string;
  categoryName: string;
  model: string;
  condition: string;
  phone: string;
  address: string;
  askingPrice: number;
  description: string | null;
  photoDataUrl: string | null;
  status: ServerSellRequestStatus;
  submittedAt: string;
  updatedAt: string;
};

function mapSellRequest(row: Record<string, unknown>): ServerSellRequest {
  return {
    id: String(row["id"]),
    customerId: row["customer_id"] == null ? null : String(row["customer_id"]),
    customerEmail: String(row["customer_email"]),
    category: String(row["category"]),
    categoryName: String(row["category_name"]),
    model: String(row["model"]),
    condition: String(row["condition"]),
    phone: String(row["phone"]),
    address: String(row["address"]),
    askingPrice: Number(row["asking_price"]),
    description: row["description"] == null ? null : String(row["description"]),
    photoDataUrl:
      row["photo_data_url"] == null ? null : String(row["photo_data_url"]),
    status: row["status"] as ServerSellRequestStatus,
    submittedAt: String(row["submitted_at"]),
    updatedAt: String(row["updated_at"]),
  };
}

function generateSellRequestId() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const suffix = randomBytes(4).toString("hex").toUpperCase();
    const id = `SR-${date}-${suffix}`;
    if (!database.prepare("SELECT id FROM sell_requests WHERE id = ?").get(id))
      return id;
  }
  throw new Error("Unable to allocate a unique sell request number.");
}

export function createSellRequest(input: {
  customerId: string;
  customerEmail: string;
  category: string;
  categoryName: string;
  model: string;
  condition: string;
  phone: string;
  address: string;
  askingPrice: number;
  description?: string;
  photoDataUrl?: string;
}): ServerSellRequest {
  const id = generateSellRequestId();
  const now = new Date().toISOString();
  database
    .prepare(
      "INSERT INTO sell_requests (id, customer_id, customer_email, category, category_name, model, condition, phone, address, asking_price, description, photo_data_url, status, submitted_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending review', ?, ?)",
    )
    .run(
      id,
      input.customerId,
      input.customerEmail,
      input.category,
      input.categoryName,
      input.model,
      input.condition,
      input.phone,
      input.address,
      input.askingPrice,
      input.description ?? null,
      input.photoDataUrl ?? null,
      now,
      now,
    );
  writeAudit(input.customerId, "sell_request.created", "sell_request", id, {
    model: input.model,
    askingPrice: input.askingPrice,
  });
  const row = database
    .prepare("SELECT * FROM sell_requests WHERE id = ?")
    .get(id) as Record<string, unknown>;
  return mapSellRequest(row);
}

export function getCustomerSellRequests(
  customerId: string,
): ServerSellRequest[] {
  const rows = database
    .prepare(
      "SELECT * FROM sell_requests WHERE customer_id = ? ORDER BY submitted_at DESC",
    )
    .all(customerId);
  return rows.map((row) => mapSellRequest(row as Record<string, unknown>));
}

export function listSellRequests(): ServerSellRequest[] {
  const rows = database
    .prepare("SELECT * FROM sell_requests ORDER BY submitted_at DESC")
    .all();
  return rows.map((row) => mapSellRequest(row as Record<string, unknown>));
}

export function updateSellRequestStatus(
  id: string,
  status: ServerSellRequestStatus,
  actorUserId: string | null = null,
): ServerSellRequest | null {
  const row = database
    .prepare("SELECT * FROM sell_requests WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;
  if (!row) return null;
  const now = new Date().toISOString();
  database
    .prepare("UPDATE sell_requests SET status = ?, updated_at = ? WHERE id = ?")
    .run(status, now, id);
  writeAudit(actorUserId, "sell_request.status_updated", "sell_request", id, {
    from: row["status"],
    to: status,
  });
  if (row["customer_id"]) {
    writeNotification(
      String(row["customer_id"]),
      "sell_request",
      `Sell request ${status.toLowerCase()}`,
      `Your TechGear sell request ${id} is now ${status.toLowerCase()}.`,
    );
  }
  const updated = database
    .prepare("SELECT * FROM sell_requests WHERE id = ?")
    .get(id) as Record<string, unknown>;
  return mapSellRequest(updated);
}
