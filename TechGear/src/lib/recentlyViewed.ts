import { readJSON, writeJSON } from "@/lib/storage";

const KEY = "techgear_recently_viewed";
const MAX_ITEMS = 8;

export function getRecentlyViewed(): string[] {
  return readJSON<string[]>(KEY, []);
}

export function recordProductView(productId: string): void {
  const current = readJSON<string[]>(KEY, []);
  const next = [productId, ...current.filter((id) => id !== productId)].slice(
    0,
    MAX_ITEMS,
  );
  writeJSON(KEY, next);
}
