import { z } from 'zod';

export const createUserSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  profilePictureUrl: z.string().optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  joinDate: z.string().optional(), // ISO date string
});

export const updateUserSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  profilePictureUrl: z.string().optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  joinDate: z.string().optional(), // ISO date string
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPasswordA: z.string().min(8),
  newPasswordB: z.string().min(8),
}).refine(data => data.newPasswordA === data.newPasswordB, {
  message: "New passwords must match",
  path: ["newPasswordB"],
});