import { Request, Response } from 'express';
import { z } from 'zod';
import * as messageService from '../services/message.service';
import { authenticateJWT } from '../middleware/auth.middleware';
import { createMessageSchema } from '../validators/message.validators';

export const getMyMessages = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const messages = await messageService.getMessagesForUser(user.id);
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving messages' });
  }
};

export const getMessages = getMyMessages;

export const sendMessage = async (req: Request, res: Response) => {
  const result = createMessageSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ errors: result.error.errors });
  }

  const { recipientId, content } = result.data;
  const user = (req as any).user;

  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const newMessage = await messageService.sendMessage(user.id, recipientId, content);
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: 'Error sending message' });
  }
};