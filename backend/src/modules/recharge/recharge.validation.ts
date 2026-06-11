import { z } from 'zod';

export const performRechargeSchema = z.object({
  body: z.object({
    type: z.enum(['MOBILE', 'DTH', 'FASTAG']),
    operator: z.string().min(2, 'Operator name must be at least 2 characters'),
    amount: z.number().positive('Amount must be a positive number').min(10, 'Minimum recharge amount is ₹10'),
    identifier: z.string().min(4, 'Recharge identifier (e.g. mobile number) must be at least 4 characters'),
    circle: z.string().optional(),
    upiPin: z.string().min(4, 'UPI PIN must be at least 4 digits'),
  }),
});
