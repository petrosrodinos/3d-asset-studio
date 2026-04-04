import { z } from "zod";

export const checkoutBodySchema = z.object({
  packId: z.string().min(1),
});

export const usageQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});
