import { z } from 'zod';

export const addMoneySchema = z.object({
  body: z.object({
    amount: z.number().positive('Amount must be a positive number').min(1, 'Minimum amount is ₹1'),
  }),
});

export const withdrawSchema = z.object({
  body: z.object({
    amount: z.number().positive('Amount must be a positive number').min(1, 'Minimum amount is ₹1'),
    bankAccountId: z.number().int('Invalid bank account ID'),
    pin: z.string().min(4, 'UPI PIN is required'),
  }),
});
