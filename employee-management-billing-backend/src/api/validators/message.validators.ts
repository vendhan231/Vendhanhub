import { z } from 'zod';

export const createMessageSchema = z.object({
  recipientId: z.string().nonempty("Recipient ID is required"),
  content: z.string().min(1, "Message content cannot be empty"),
});

export const updateMessageSchema = z.object({
  messageId: z.string().nonempty("Message ID is required"),
  content: z.string().min(1, "Message content cannot be empty").optional(),
});

export const getMessagesSchema = z.object({
  userId: z.string().nonempty("User ID is required"),
  limit: z.number().optional().default(50),
  offset: z.number().optional().default(0),
});