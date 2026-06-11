import { z } from 'zod';

export const submitKYCSchema = z.object({
  body: z.object({
    aadhaarNumber: z.string().regex(/^\d{12}$/, 'Aadhaar number must be exactly 12 digits'),
    panNumber: z.string().regex(/^[A-Z]{5}\d{4}[A-Z]{1}$/, 'Invalid PAN card format (e.g. ABCDE1234F)'),
    aadhaarUrl: z.string().url('Invalid Aadhaar document URL').optional(),
    panUrl: z.string().url('Invalid PAN document URL').optional(),
  }),
});
