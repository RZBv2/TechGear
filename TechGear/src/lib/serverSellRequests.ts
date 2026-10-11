import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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

const sellRequestInput = z.object({
  category: z.string().min(1),
  categoryName: z.string().min(1),
  model: z.string().min(1).max(200),
  condition: z.string().min(1),
  phone: z.string().min(6).max(20),
  address: z.string().min(4).max(500),
  askingPrice: z.number().int().positive(),
  description: z.string().max(2000).optional(),
  // A base64 data URL photo — capped generously since it's stored as TEXT.
  photoDataUrl: z.string().max(6_000_000).optional(),
});

export const createServerSellRequest = createServerFn({ method: "POST" })
  .inputValidator(sellRequestInput)
  .handler(async ({ data }): Promise<ServerSellRequest> => {
    const { currentUser } = await import("@/server/auth");
    const user = currentUser();
    if (!user)
      throw new Error("Please sign in before submitting a sell request.");
    const { createSellRequest } = await import("@/server/db");
    return createSellRequest({
      customerId: user.id,
      customerEmail: user.email,
      category: data.category,
      categoryName: data.categoryName,
      model: data.model,
      condition: data.condition,
      phone: data.phone,
      address: data.address,
      askingPrice: data.askingPrice,
      ...(data.description !== undefined
        ? { description: data.description }
        : {}),
      ...(data.photoDataUrl !== undefined
        ? { photoDataUrl: data.photoDataUrl }
        : {}),
    });
  });

export const getMyServerSellRequests = createServerFn({
  method: "GET",
}).handler(async (): Promise<ServerSellRequest[]> => {
  const { currentUser } = await import("@/server/auth");
  const user = currentUser();
  if (!user) return [];
  const { getCustomerSellRequests } = await import("@/server/db");
  return getCustomerSellRequests(user.id);
});

export const getAdminServerSellRequests = createServerFn({
  method: "GET",
}).handler(async (): Promise<ServerSellRequest[]> => {
  const { requireAdmin } = await import("@/server/auth");
  requireAdmin();
  const { listSellRequests } = await import("@/server/db");
  return listSellRequests();
});

export const updateServerSellRequestStatus = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().min(1),
      status: z.enum([
        "Pending review",
        "Reviewing",
        "Offer sent",
        "Accepted",
        "Rejected",
        "Completed",
      ]),
    }),
  )
  .handler(async ({ data }): Promise<ServerSellRequest | null> => {
    const { requireAdmin } = await import("@/server/auth");
    const admin = requireAdmin();
    const { updateSellRequestStatus } = await import("@/server/db");
    return updateSellRequestStatus(data.id, data.status, admin.id);
  });
