import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
    email: z.string().email('Invalid email address').optional(),
    phone: z.string().min(10, 'Invalid phone number').max(15, 'Invalid phone number').optional(),
    appLockPin: z.string().length(4, 'App lock PIN must be 4 digits').or(z.string().length(6, 'App lock PIN must be 6 digits')).optional(),
  }),
});

export const updateAvatarSchema = z.object({
  body: z.object({
    profileImage: z.string().url('Invalid image URL'),
  }),
});
