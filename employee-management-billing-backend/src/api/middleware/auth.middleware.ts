import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { AppError } from '../utils/errorHandler'; // Assuming you have a custom error handler

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Replace with your actual secret

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return next(new AppError('Authentication token is missing', 401));
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return next(new AppError('Invalid token', 403));
    }
    req.user = user;
    next();
  });
};

export const authorizeAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user.role !== 'ADMIN') {
    return next(new AppError('Forbidden: Admins only', 403));
  }
  next();
};

export const authorizeOwnerOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user.id !== req.params.userId && req.user.role !== 'ADMIN') {
    return next(new AppError('Forbidden: You do not have permission to access this resource', 403));
  }
  next();
};