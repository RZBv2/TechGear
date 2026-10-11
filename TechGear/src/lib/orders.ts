import { readJSON, writeJSON } from "@/lib/storage";

export type OrderItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
};
export type OrderStatus =
  "Processing" | "Confirmed" | "Shipped" | "Delivered" | "Cancelled";
export const ORDER_STATUS_STEPS: OrderStatus[] = [
  "Processing",
  "Confirmed",
  "Shipped",
  "Delivered",
];
export type PaymentMethod = "bkash" | "nagad" | "cod";
export type StatusEvent = { status: OrderStatus; at: string; note?: string };
export type Order = {
  id: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  total: number;
  phone: string;
  address: string;
  paymentMethod: PaymentMethod;
  paymentStatus?: "pending" | "cash_on_delivery" | "paid" | "failed";
  status: OrderStatus;
  submittedAt: string;
  statusHistory?: StatusEvent[];
};
const ORDERS_KEY = "techgear_orders";
type OrdersByEmail = Record<string, Order[]>;
function normalize(order: Order): Order {
  const status = order.status ?? "Processing";
  return {
    ...order,
    status,
    statusHistory: order.statusHistory?.length
      ? order.statusHistory
      : [{ status, at: order.submittedAt }],
  };
}
export function getOrders(email: string): Order[] {
  const all = readJSON<OrdersByEmail>(ORDERS_KEY, {});
  return (all[email] ?? []).map(normalize);
}
export function addOrder(email: string, order: Order): void {
  const all = readJSON<OrdersByEmail>(ORDERS_KEY, {});
  all[email] = [normalize(order), ...(all[email] ?? [])];
  writeJSON(ORDERS_KEY, all);
}
export function generateOrderId(): string {
  return `TG-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}
export function getAllOrders(): Array<Order & { customerEmail: string }> {
  const all = readJSON<OrdersByEmail>(ORDERS_KEY, {});
  return Object.entries(all)
    .flatMap(([email, orders]) =>
      orders.map((order) => ({ ...normalize(order), customerEmail: email })),
    )
    .sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    );
}
export function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  note?: string,
): Order | null {
  const all = readJSON<OrdersByEmail>(ORDERS_KEY, {});
  let changed: Order | null = null;
  for (const email of Object.keys(all)) {
    const index = all[email].findIndex((item) => item.id === orderId);
    if (index < 0) continue;
    const order = normalize(all[email][index]);
    const next =
      order.status === status
        ? order
        : {
            ...order,
            status,
            statusHistory: [
              ...(order.statusHistory ?? []),
              { status, at: new Date().toISOString(), note },
            ],
          };
    all[email][index] = next;
    changed = next;
    break;
  }
  if (changed) writeJSON(ORDERS_KEY, all);
  return changed;
}
export function deriveOrderStatus(order: Order): OrderStatus {
  return normalize(order).status;
}
