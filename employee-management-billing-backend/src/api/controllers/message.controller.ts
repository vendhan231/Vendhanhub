import { Request, Response } from 'express';
import { z } from 'zod';
import * as messageService from '../services/message.service';
import { authenticateJWT } from '../middleware/auth.middleware';
import { createMessageSchema } from '../validators/message.validators';

export const getMyMessages = async (req: Request, res: Response) => {
  try {
    const messages = await messageService.getMessagesForUser(req.user.id);
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving messages' });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  const result = createMessageSchema.safeParse(req.body);
  
  if (!result.success) {
    return res.status(400).json({ errors: result.error.errors });
  }

  const { recipientId, content } = result.data;

  try {
    const newMessage = await messageService.sendMessage({
      senderId: req.user.id,
      recipientId,
      content,
    });
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: 'Error sending message' });
  }
};