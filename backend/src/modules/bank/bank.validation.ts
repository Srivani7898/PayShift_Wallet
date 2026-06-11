import { z } from 'zod';

export const linkBankAccountSchema = z.object({
  body: z.object({
    bankName: z.string().min(2, 'Bank name must be at least 2 characters'),
    accountNumber: z.string().min(8, 'Account number must be at least 8 digits'),
    ifsc: z.string().min(11, 'IFSC must be 11 characters').max(11, 'IFSC must be 11 characters'),
    accountHolder: z.string().min(2, 'Account holder name must be at least 2 characters'),
    pin: z.string().min(4, 'UPI PIN must be at least 4 digits').max(6, 'UPI PIN must be at most 6 digits').optional(),
  }),
});
