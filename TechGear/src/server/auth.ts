import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import {
  deleteCookie,
  getCookie,
  setCookie,
} from "@tanstack/react-start/server";
import { database } from "@/server/db";
import { sendVerificationEmail } from "@/server/email";

const SESSION_COOKIE = "techgear_session";
const SESSION_DAYS = 7;
const isProduction = process.env["NODE_ENV"] === "production";
const VERIFICATION_WINDOW_MS = 15 * 60 * 1000;
const VERIFICATION_RESEND_COOLDOWN_MS = 60 * 1000;
const VERIFICATION_SECRET =
  process.env["TECHGEAR_VERIFICATION_SECRET"] ||
  "techgear-development-verification-secret";

type DbUser = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: "customer" | "admin";
  isActive: number;
  emailVerifiedAt: string | null;
  createdAt: string;
};

export type SignUpResult = {
  verificationRequired: true;
  email: string;
};

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, stored: string | null): boolean {
  if (!stored) return false;
  const [salt, expected] = stored.split(":");
  if (!salt || !expected) return false;
  const actual = scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expected, "hex");
  return (
    actual.length === expectedBuffer.length &&
    timingSafeEqual(actual, expectedBuffer)
  );
}

function mapUser(row: Record<string, unknown>): DbUser {
  return {
    id: String(row["id"]),
    email: String(row["email"]),
    name: String(row["name"] ?? ""),
    phone: row["phone"] == null ? null : String(row["phone"]),
    role: row["role"] as DbUser["role"],
    isActive: Number(row["is_active"]),
    emailVerifiedAt:
      row["email_verified_at"] == null ? null : String(row["email_verified_at"]),
    createdAt: String(row["created_at"]),
  };
}

function ensureMainAdmin() {
  const existing = database
    .prepare("SELECT id FROM users WHERE email = ?")
    .get("rzbv2@techgear.local");
  if (existing) {
    database
      .prepare("UPDATE users SET email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?")
      .run(new Date().toISOString(), "admin-main");
    return;
  }
  const now = new Date().toISOString();
  database
    .prepare(
      "INSERT INTO users (id, email, name, password_hash, role, email_verified_at, created_at, updated_at) VALUES (?, ?, ?, ?, 'admin', ?, ?, ?)",
    )
    .run(
      "admin-main",
      "rzbv2@techgear.local",
      "TechGear Main Admin",
      hashPassword("123456"),
      now,
      now,
      now,
    );
}

ensureMainAdmin();

function createSession(userId: string) {
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  database
    .prepare("DELETE FROM auth_sessions WHERE expires_at <= ?")
    .run(now.toISOString());
  database
    .prepare(
      "INSERT INTO auth_sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
    )
    .run(tokenHash, userId, expiresAt, now.toISOString());
  setCookie(SESSION_COOKIE, rawToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: "/",
  });
}

function getUserFromCookie(): DbUser | null {
  const rawToken = getCookie(SESSION_COOKIE);
  if (!rawToken) return null;
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const row = database
    .prepare(
      "SELECT u.* FROM users u JOIN auth_sessions s ON s.user_id = u.id WHERE s.token_hash = ? AND s.expires_at > ? AND u.is_active = 1",
    )
    .get(tokenHash, new Date().toISOString());
  return row ? mapUser(row as Record<string, unknown>) : null;
}

export function currentUser() {
  return getUserFromCookie();
}

export function signIn(email: string, password: string) {
  ensureMainAdmin();
  const normalized = email.trim().toLowerCase();
  const row = database
    .prepare("SELECT * FROM users WHERE email = ? AND is_active = 1")
    .get(normalized) as Record<string, unknown> | undefined;
  if (
    !row ||
    !verifyPassword(
      password,
      row["password_hash"] == null ? null : String(row["password_hash"]),
    )
  )
    return null;
  if (row["role"] === "customer" && row["email_verified_at"] == null) {
    throw new Error("Please verify your email address before signing in.");
  }
  const user = mapUser(row);
  createSession(user.id);
  return user;
}

function hashVerificationCode(userId: string, code: string) {
  return createHash("sha256")
    .update(`${VERIFICATION_SECRET}:${userId}:${code}`)
    .digest("hex");
}

function issueVerificationCode(userId: string) {
  const latest = database
    .prepare(
      "SELECT created_at FROM email_verification_tokens WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
    )
    .get(userId) as Record<string, unknown> | undefined;
  if (latest) {
    const elapsed = Date.now() - new Date(String(latest["created_at"])).getTime();
    if (elapsed < VERIFICATION_RESEND_COOLDOWN_MS)
      throw new Error("Please wait a minute before requesting another code.");
  }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const now = new Date();
  database
    .prepare("DELETE FROM email_verification_tokens WHERE user_id = ?")
    .run(userId);
  database
    .prepare(
      "INSERT INTO email_verification_tokens (id, user_id, code_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)",
    )
    .run(
      `verification-${randomBytes(12).toString("hex")}`,
      userId,
      hashVerificationCode(userId, code),
      new Date(now.getTime() + VERIFICATION_WINDOW_MS).toISOString(),
      now.toISOString(),
    );
  return code;
}

export async function signUp(
  name: string,
  email: string,
  password: string,
  phone?: string,
): Promise<SignUpResult> {
  const cleanName = name.trim();
  const normalized = email.trim().toLowerCase();
  if (cleanName.length < 2) throw new Error("Please enter your full name.");
  if (!/^\S+@\S+\.\S+$/.test(normalized))
    throw new Error("Please enter a valid email address.");
  if (password.length < 6)
    throw new Error("Password must be at least 6 characters.");
  const existing = database
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(normalized);
  if (existing) throw new Error("An account with this email already exists.");

  const id = `user-${randomBytes(10).toString("hex")}`;
  const now = new Date().toISOString();
  database.exec("BEGIN IMMEDIATE");
  try {
    database
      .prepare(
        "INSERT INTO users (id, email, name, phone, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'customer', ?, ?)",
      )
      .run(
        id,
        normalized,
        cleanName,
        phone?.trim() || null,
        hashPassword(password),
        now,
        now,
      );
    const code = issueVerificationCode(id);
    database.exec("COMMIT");
    try {
      await sendVerificationEmail({ to: normalized, name: cleanName, code });
    } catch (error) {
      database.prepare("DELETE FROM users WHERE id = ?").run(id);
      throw error;
    }
  } catch (error) {
    try {
      database.exec("ROLLBACK");
    } catch {
      // The transaction may already have been committed before email delivery.
    }
    throw error;
  }
  return { verificationRequired: true, email: normalized };
}

export async function resendVerification(email: string) {
  const normalized = email.trim().toLowerCase();
  const row = database
    .prepare(
      "SELECT id, email, name, email_verified_at FROM users WHERE email = ? AND role = 'customer'",
    )
    .get(normalized) as Record<string, unknown> | undefined;
  if (!row || row["email_verified_at"] != null) return { ok: true as const };
  const code = issueVerificationCode(String(row["id"]));
  await sendVerificationEmail({
    to: normalized,
    name: String(row["name"]),
    code,
  });
  return { ok: true as const };
}

export function verifyEmail(email: string, code: string) {
  const normalized = email.trim().toLowerCase();
  const cleanCode = code.trim();
  if (!/^\d{6}$/.test(cleanCode))
    throw new Error("Enter the six-digit verification code.");
  const user = database
    .prepare(
      "SELECT * FROM users WHERE email = ? AND role = 'customer' AND is_active = 1",
    )
    .get(normalized) as Record<string, unknown> | undefined;
  if (!user) throw new Error("This verification request is no longer available.");
  if (user["email_verified_at"] != null) {
    const mapped = mapUser(user);
    createSession(mapped.id);
    return mapped;
  }
  const token = database
    .prepare(
      "SELECT * FROM email_verification_tokens WHERE user_id = ? AND consumed_at IS NULL ORDER BY created_at DESC LIMIT 1",
    )
    .get(String(user["id"])) as Record<string, unknown> | undefined;
  if (!token || new Date(String(token["expires_at"])).getTime() <= Date.now())
    throw new Error("That code has expired. Request a new verification code.");
  if (Number(token["attempts"]) >= 5)
    throw new Error("Too many incorrect attempts. Request a new verification code.");
  const expected = Buffer.from(String(token["code_hash"]), "hex");
  const actual = Buffer.from(
    hashVerificationCode(String(user["id"]), cleanCode),
    "hex",
  );
  if (!timingSafeEqual(expected, actual)) {
    database
      .prepare(
        "UPDATE email_verification_tokens SET attempts = attempts + 1 WHERE id = ?",
      )
      .run(token["id"]);
    throw new Error("That code is incorrect. Please try again.");
  }
  const now = new Date().toISOString();
  database
    .prepare("UPDATE users SET email_verified_at = ?, updated_at = ? WHERE id = ?")
    .run(now, now, user["id"]);
  database
    .prepare("UPDATE email_verification_tokens SET consumed_at = ? WHERE id = ?")
    .run(now, token["id"]);
  const verified = database
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(user["id"]) as Record<string, unknown>;
  const mapped = mapUser(verified);
  createSession(mapped.id);
  return mapped;
}

export function updateProfile(name: string) {
  const user = getUserFromCookie();
  if (!user) throw new Error("You must be signed in.");
  const cleanName = name.trim();
  if (cleanName.length < 2) throw new Error("Enter your name.");
  database
    .prepare("UPDATE users SET name = ?, updated_at = ? WHERE id = ?")
    .run(cleanName, new Date().toISOString(), user.id);
  return currentUser();
}

export function changePassword(currentPassword: string, newPassword: string) {
  const user = getUserFromCookie();
  if (!user) throw new Error("You must be signed in.");
  if (newPassword.length < 6)
    throw new Error("New password must be at least 6 characters.");
  const row = database
    .prepare("SELECT password_hash FROM users WHERE id = ? AND is_active = 1")
    .get(user.id) as Record<string, unknown> | undefined;
  if (
    !row ||
    !verifyPassword(
      currentPassword,
      row["password_hash"] == null ? null : String(row["password_hash"]),
    )
  )
    throw new Error("Current password is incorrect.");
  database
    .prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?")
    .run(hashPassword(newPassword), new Date().toISOString(), user.id);
  return { ok: true as const };
}

export function signOut() {
  const rawToken = getCookie(SESSION_COOKIE);
  if (rawToken) {
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    database
      .prepare("DELETE FROM auth_sessions WHERE token_hash = ?")
      .run(tokenHash);
  }
  deleteCookie(SESSION_COOKIE, { path: "/" });
}

export function requireAdmin() {
  const user = getUserFromCookie();
  if (!user || user.role !== "admin")
    throw new Error("Administrator access required.");
  return user;
}

export function listAdmins() {
  requireAdmin();
  const rows = database
    .prepare(
      "SELECT id, email, name, role, is_active, email_verified_at, created_at FROM users WHERE role = 'admin' AND is_active = 1 ORDER BY created_at ASC",
    )
    .all();
  return rows.map((row) => mapUser(row as Record<string, unknown>));
}

export function listCustomers() {
  requireAdmin();
  const rows = database
    .prepare(
      "SELECT id, email, name, phone, role, is_active, email_verified_at, created_at FROM users WHERE role = 'customer' AND is_active = 1 ORDER BY created_at DESC",
    )
    .all();
  return rows.map((row) => mapUser(row as Record<string, unknown>));
}

export function addAdmin(name: string, username: string, password: string) {
  requireAdmin();
  const cleanName = name.trim();
  const cleanUsername = username.trim().toLowerCase();
  if (cleanName.length < 2) throw new Error("Enter the admin's full name.");
  if (!/^[a-z0-9._-]{3,24}$/.test(cleanUsername))
    throw new Error(
      "Username must be 3–24 characters using letters, numbers, dot, dash or underscore.",
    );
  if (password.length < 6)
    throw new Error("Password must be at least 6 characters.");
  const email = `${cleanUsername}@techgear.local`;
  if (database.prepare("SELECT id FROM users WHERE email = ?").get(email))
    throw new Error("That username is already in use.");
  const id = `admin-${randomBytes(10).toString("hex")}`;
  const now = new Date().toISOString();
  database
    .prepare(
      "INSERT INTO users (id, email, name, password_hash, role, email_verified_at, created_at, updated_at) VALUES (?, ?, ?, ?, 'admin', ?, ?, ?)",
    )
    .run(id, email, cleanName, hashPassword(password), now, now, now);
  return listAdmins();
}

export function removeAdmin(id: string) {
  requireAdmin();
  if (id === "admin-main")
    throw new Error("The main administrator cannot be removed.");
  database
    .prepare(
      "UPDATE users SET is_active = 0, updated_at = ? WHERE id = ? AND role = 'admin'",
    )
    .run(new Date().toISOString(), id);
  return listAdmins();
}
