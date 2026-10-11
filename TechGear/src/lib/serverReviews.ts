import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type ServerProductReview = {
  id: string;
  productId: string;
  author: string;
  rating: number;
  text: string;
  submittedAt: string;
};

export const getServerProductReviews = createServerFn({ method: "GET" })
  .inputValidator(z.object({ productId: z.string().min(1) }))
  .handler(async ({ data }): Promise<ServerProductReview[]> => {
    const { listProductReviews } = await import("@/server/db");
    return listProductReviews(data.productId);
  });

export const createServerProductReview = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      productId: z.string().min(1),
      rating: z.number().int().min(1).max(5),
      text: z.string().trim().min(8).max(1200),
    }),
  )
  .handler(async ({ data }): Promise<ServerProductReview> => {
    const { currentUser } = await import("@/server/auth");
    const user = currentUser();
    if (!user) throw new Error("Please sign in to write a review.");
    const { createProductReview } = await import("@/server/db");
    return createProductReview(
      data.productId,
      user.id,
      user.name,
      data.rating,
      data.text,
    );
  });
