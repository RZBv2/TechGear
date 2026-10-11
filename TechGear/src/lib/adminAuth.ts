import { readJSON, removeKey, writeJSON } from "@/lib/storage";

export type AdminAccount = {
  id: string;
  name: string;
  username: string;
  password: string;
  isMain: boolean;
  createdAt: string;
};

const ADMINS_KEY = "techgear_admin_accounts_v2";
const SESSION_KEY = "techgear_admin_session_v2";
const MAIN_ID = "main-admin-rzbv2";

function normalize(username: string) {
  return username.trim().toLowerCase();
}

function seed(): AdminAccount[] {
  const current = readJSON<AdminAccount[]>(ADMINS_KEY, []);
  if (current.length) return current;
  const main: AdminAccount = {
    id: MAIN_ID,
    name: "TechGear Main Admin",
    username: "rzbv2",
    password: "123456",
    isMain: true,
    createdAt: new Date().toISOString(),
  };
  writeJSON(ADMINS_KEY, [main]);
  return [main];
}

export function getAdminAccounts() {
  return seed();
}

export function signInAdmin(
  username: string,
  password: string,
): AdminAccount | null {
  const account = seed().find(
    (item) =>
      item.username === normalize(username) && item.password === password,
  );
  if (!account) return null;
  writeJSON(SESSION_KEY, account.id);
  return account;
}

export function getAdminSession(): AdminAccount | null {
  const id = readJSON<string | null>(SESSION_KEY, null);
  return id ? (seed().find((item) => item.id === id) ?? null) : null;
}

export function signOutAdmin() {
  removeKey(SESSION_KEY);
}

export function addAdmin(name: string, username: string, password: string) {
  const cleanName = name.trim();
  const cleanUsername = normalize(username);
  if (cleanName.length < 2)
    return { ok: false as const, error: "Enter the admin's full name." };
  if (!/^[a-z0-9._-]{3,24}$/.test(cleanUsername))
    return {
      ok: false as const,
      error:
        "Username must be 3–24 characters using letters, numbers, dot, dash or underscore.",
    };
  if (password.length < 6)
    return {
      ok: false as const,
      error: "Password must be at least 6 characters.",
    };
  const admins = seed();
  if (admins.some((item) => item.username === cleanUsername))
    return { ok: false as const, error: "That username is already in use." };
  const account: AdminAccount = {
    id: `admin-${Date.now().toString(36)}`,
    name: cleanName,
    username: cleanUsername,
    password,
    isMain: false,
    createdAt: new Date().toISOString(),
  };
  writeJSON(ADMINS_KEY, [...admins, account]);
  return { ok: true as const, account };
}

export function removeAdmin(id: string) {
  const admins = seed();
  const target = admins.find((item) => item.id === id);
  if (!target || target.isMain) return false;
  writeJSON(
    ADMINS_KEY,
    admins.filter((item) => item.id !== id),
  );
  return true;
}
