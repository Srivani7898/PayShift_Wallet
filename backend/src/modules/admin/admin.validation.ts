import { z } from 'zod';

export const verifyKYCSchema = z.object({
  body: z.object({
    status: z.enum(['APPROVED', 'REJECTED']),
    reason: z.string().optional(),
  }),
});
