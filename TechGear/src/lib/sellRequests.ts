import { readJSON, writeJSON } from "@/lib/storage";
import type { CategoryId } from "@/data/products/types";
import type { ConditionId } from "@/lib/sellQuote";

export type SellRequest = {
  id: string;
  category: CategoryId;
  categoryName: string;
  model: string;
  condition: ConditionId;
  phone: string;
  address: string;
  /** Legacy field retained for existing requests and account/admin displays. */
  offer: number;
  /** Amount entered by the customer as their asking price. */
  askingPrice?: number;
  /** Free-text description of the device the customer is selling. */
  description?: string;
  /** Base64 data URL of a photo the customer uploaded, if any. */
  photoDataUrl?: string;
  status: "Pending review";
  submittedAt: string;
};

const REQUESTS_KEY = "techgear_sell_requests";

type RequestsByEmail = Record<string, SellRequest[]>;

export function getSellRequests(email: string): SellRequest[] {
  const all = readJSON<RequestsByEmail>(REQUESTS_KEY, {});
  return all[email] ?? [];
}

export function addSellRequest(email: string, request: SellRequest): void {
  const all = readJSON<RequestsByEmail>(REQUESTS_KEY, {});
  all[email] = [request, ...(all[email] ?? [])];
  writeJSON(REQUESTS_KEY, all);
}

export function generateRequestId(): string {
  return `SR-${Date.now().toString(36).toUpperCase()}`;
}

/** Admin-only: every sell request across every customer, newest first. */
export function getAllSellRequests(): Array<
  SellRequest & { customerEmail: string }
> {
  const all = readJSON<RequestsByEmail>(REQUESTS_KEY, {});
  return Object.entries(all)
    .flatMap(([email, requests]) =>
      requests.map((r) => ({ ...r, customerEmail: email })),
    )
    .sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    );
}
