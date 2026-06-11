import { z } from 'zod';

export const createUPISchema = z.object({
  body: z.object({
    upiId: z.string().regex(/^[a-zA-Z0-9.\-_]+@[a-zA-Z]+$/, 'Invalid UPI ID format. Should be like name@bank'),
  }),
});
