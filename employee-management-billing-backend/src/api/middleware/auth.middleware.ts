import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

interface JwtPayload {
  id: string;
  username: string;
  role: string;
  email?: string;
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token is missing' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    // Type the decoded payload properly and add to request
    const user = decoded as JwtPayload;
    (req as any).user = {
      id: user.id,
      username: user.username,
      role: user.role,
      email: user.email
    };
    next();
  });
};

export const authorizeAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;

  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Admins only' });
  }
  next();
};

export const authorizeOwnerOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;

  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (user.id !== req.params.userId && user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to access this resource' });
  }
  next();
};