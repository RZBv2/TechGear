import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type AdminInsights = {
  revenue: number;
  orders: number;
  customers: number;
  products: number;
  lowStockProducts: number;
  orderStatus: Record<
    "Processing" | "Confirmed" | "Shipped" | "Delivered" | "Cancelled",
    number
  >;
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

export const getAdminInsights = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminInsights> => {
    const { requireAdmin } = await import("@/server/auth");
    requireAdmin();
    const { getAdminAnalytics } = await import("@/server/db");
    return getAdminAnalytics();
  },
);

export type ServerNotification = {
  id: number;
  type: string;
  title: string;
  message: string;
  orderId: string | null;
  isRead: boolean;
  createdAt: string;
};

export const getMyNotifications = createServerFn({ method: "GET" }).handler(
  async (): Promise<ServerNotification[]> => {
    const { currentUser } = await import("@/server/auth");
    const user = currentUser();
    if (!user) return [];
    const { listNotifications } = await import("@/server/db");
    return listNotifications(user.id);
  },
);

export const markMyNotificationRead = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }): Promise<boolean> => {
    const { currentUser } = await import("@/server/auth");
    const user = currentUser();
    if (!user) throw new Error("Please sign in first.");
    const { markNotificationRead } = await import("@/server/db");
    return markNotificationRead(user.id, data.id);
  });

export const markAllMyNotificationsRead = createServerFn({
  method: "POST",
}).handler(async (): Promise<boolean> => {
  const { currentUser } = await import("@/server/auth");
  const user = currentUser();
  if (!user) throw new Error("Please sign in first.");
  const { database } = await import("@/server/db");
  database
    .prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?")
    .run(user.id);
  return true;
});
