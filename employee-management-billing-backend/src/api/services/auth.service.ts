import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import zxcvbn from 'zxcvbn';

const prisma = new PrismaClient();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6),
});

const registerSchema = z.object({
  username: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export const authService = {
  async login(username: string, password: string) {
    const parsed = loginSchema.parse({ username, password });
    const user = await prisma.user.findUnique({
      where: { username: parsed.username },
    });

    if (!user) {
      throw new Error('Invalid username or password');
    }

    const isPasswordValid = await bcrypt.compare(parsed.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid username or password');
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET!, {
      expiresIn: '1h',
    });

    return { user: { ...user, passwordHash: undefined }, token };
  },

  async register(data: any) {
    const parsed = registerSchema.parse(data);
    // Password strength check
    const passwordStrength = zxcvbn(parsed.password);
    if (passwordStrength.score < 3) {
      throw new Error('Password is too weak. Please use a stronger password.');
    }

    const existingUser = await prisma.user.findUnique({
      where: { username: parsed.username },
    });

    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Check for existing email
    const existingEmail = await prisma.user.findUnique({
      where: { email: parsed.email },
    });
    if (existingEmail) {
      throw new Error('Email already registered');
    }

    const passwordHash = await bcrypt.hash(parsed.password, 10);
    const newUser = await prisma.user.create({
      data: {
        username: parsed.username,
        email: parsed.email,
        passwordHash,
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        joinDate: new Date(),
      },
    });

    return { user: { ...newUser, passwordHash: undefined } };
  },
};