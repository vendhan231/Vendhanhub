import 'express';

declare module 'cors';
declare module 'compression';

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; [key: string]: any };
      file?: any;
    }
  }
}

// If more modules complain, add them here as temporary stubs until proper types are available
