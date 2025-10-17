import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const registerSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  profilePictureUrl: z.string().optional(),
});

// Validation middleware functions
export const validateLogin = (req: any, res: any, next: any) => {
  try {
    loginSchema.parse(req.body);
    next();
  } catch (error: any) {
    return res.status(400).json({ error: error.errors });
  }
};

export const validateRegister = (req: any, res: any, next: any) => {
  try {
    registerSchema.parse(req.body);
    next();
  } catch (error: any) {
    return res.status(400).json({ error: error.errors });
  }
};