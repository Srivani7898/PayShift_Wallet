import { z } from 'zod';

export const payBillSchema = z.object({
  body: z.object({
    billerName: z.string().min(2, 'Biller name must be at least 2 characters'),
    billCategory: z.enum(['Electricity', 'Water', 'Gas', 'Broadband', 'Credit Card']),
    consumerNumber: z.string().min(4, 'Consumer number must be at least 4 characters'),
    amount: z.number().positive('Amount must be a positive number').min(1, 'Minimum amount is ₹1'),
    upiPin: z.string().min(4, 'UPI PIN must be at least 4 digits'),
  }),
});
