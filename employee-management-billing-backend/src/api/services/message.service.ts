import { z } from 'zod';
import { InternalMessage } from '../validators/message.validators';
import config from '../../config';

const prisma = config.prisma;

export const createMessage = async (messageData: z.infer<typeof InternalMessage>) => {
  return await prisma.internalMessage.create({
    data: messageData as any,
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

export const sendMessage = async (senderId: string, recipientId: string, content: string) => {
  const messageData = {
    senderId,
    recipientId,
    content,
    senderName: '', // Will be populated by controller
    timestamp: new Date(),
  };

  return await createMessage(messageData as any);
};