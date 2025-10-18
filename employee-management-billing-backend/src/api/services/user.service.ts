import { User } from '@prisma/client';
import { hash } from 'bcrypt';
import { UserCreateInput, UserUpdateInput } from '../validators/user.validators';
import config from '../../config';

const prisma = config.prisma;

export const userService = {
  createUser: async (data: any): Promise<User> => {
    const passwordHash = await hash(data.password, 10);
    return await prisma.user.create({
      data: {
        ...data,
        passwordHash,
      },
    } as any);
  },

  getUserById: async (id: string): Promise<User | null> => {
    return await prisma.user.findUnique({
      where: { id },
    });
  },

  updateUser: async (id: string, data: any): Promise<User> => {
    return await prisma.user.update({
      where: { id },
      data,
    });
  },

  deleteUser: async (id: string): Promise<User> => {
    return await prisma.user.delete({
      where: { id },
    });
  },

  getAllUsers: async (): Promise<User[]> => {
    return await prisma.user.findMany();
  },
};