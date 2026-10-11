import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

type ServerOrderItem = { id: string; name: string; price: number; qty: number };
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

const orderInput = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        qty: z.number().int().positive().max(99),
      }),
    )
    .min(1),
  discount: z.number().int().nonnegative().optional(),
  couponCode: z.string().max(40).optional(),
  phone: z.string().min(11).max(20),
  address: z.string().min(8).max(500),
  paymentMethod: z.enum(["bkash", "nagad", "cod"]),
});

export const createServerOrder = createServerFn({ method: "POST" })
  .inputValidator(orderInput)
  .handler(async ({ data }): Promise<ServerOrder> => {
    const { currentUser } = await import("@/server/auth");
    const user = currentUser();
    if (!user) throw new Error("Please sign in before checkout.");
    const { createOrder } = await import("@/server/db");
    const order = createOrder({
      customerId: user.id,
      customerEmail: user.email,
      items: data.items,
      phone: data.phone,
      address: data.address,
      paymentMethod: data.paymentMethod,
      ...(data.discount !== undefined ? { discount: data.discount } : {}),
      ...(data.couponCode !== undefined ? { couponCode: data.couponCode } : {}),
    });
    if (!order) throw new Error("Unable to create the order.");
    return order;
  });

export const getMyServerOrders = createServerFn({ method: "GET" }).handler(
  async (): Promise<ServerOrder[]> => {
    const { currentUser } = await import("@/server/auth");
    const user = currentUser();
    if (!user) return [];
    const { getCustomerOrders } = await import("@/server/db");
    return getCustomerOrders(user.id);
  },
);

export const getAdminServerOrders = createServerFn({ method: "GET" }).handler(
  async (): Promise<ServerOrder[]> => {
    const { requireAdmin } = await import("@/server/auth");
    requireAdmin();
    const { listOrders } = await import("@/server/db");
    return listOrders();
  },
);

export const updateServerOrderStatus = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().min(1),
      status: z.enum([
        "Processing",
        "Confirmed",
        "Shipped",
        "Delivered",
        "Cancelled",
      ]),
      note: z.string().max(300).optional(),
    }),
  )
  .handler(async ({ data }): Promise<ServerOrder | null> => {
    const { requireAdmin } = await import("@/server/auth");
    const admin = requireAdmin();
    const { updateOrderStatus } = await import("@/server/db");
    return updateOrderStatus(data.id, data.status, data.note, admin.id);
  });
