import { z } from 'zod';

export const qrPaySchema = z.object({
  body: z.object({
    qrPayload: z.string().min(10, 'Invalid QR payload'),
    amount: z.number().positive('Amount must be positive').min(1, 'Minimum amount is ₹1'),
    upiPin: z.string().min(4, 'UPI PIN must be at least 4 digits'),
    description: z.string().optional(),
  }),
});
