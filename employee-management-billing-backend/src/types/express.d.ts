// Augment Express Request to include a `user` property added by authentication middleware
declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      role: string;
      email?: string;
      [key: string]: any;
    }

    interface Request {
      user?: User;
    }
  }
}

export {};
