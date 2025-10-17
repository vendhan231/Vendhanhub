import { PrismaClient } from '@prisma/client';
import { InternalMessage } from '../validators/message.validators';

const prisma = new PrismaClient();

export const createMessage = async (messageData: InternalMessage) => {
  return await prisma.internalMessage.create({
    data: messageData,
  });
};

export const getMessagesForUser = async (userId: string) => {
  return await prisma.internalMessage.findMany({
    where: {
      OR: [
        { recipientId: userId },
        { recipientId: 'ALL_USERS' },
        { senderId: userId },
      ],
    },
    orderBy: { timestamp: 'desc' },
  });
};

export const markMessageAsRead = async (messageId: string) => {
  return await prisma.internalMessage.update({
    where: { id: messageId },
    data: { isRead: true },
  });
};

export const deleteMessage = async (messageId: string) => {
  return await prisma.internalMessage.delete({
    where: { id: messageId },
  });
};