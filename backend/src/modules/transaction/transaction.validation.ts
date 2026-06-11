import { z } from 'zod';

export const sendMoneySchema = z.object({
  body: z.object({
    recipient: z.string().min(3, 'Recipient identifier (email, phone, or UPI ID) is required'),
    amount: z.number().positive('Amount must be a positive number').min(1, 'Minimum amount is ₹1'),
    upiPin: z.string().min(4, 'UPI PIN must be at least 4 digits').max(6, 'UPI PIN cannot exceed 6 digits'),
    description: z.string().max(200, 'Description cannot exceed 200 characters').optional(),
  }),
});
