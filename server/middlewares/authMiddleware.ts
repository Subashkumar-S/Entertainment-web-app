import { Request, Response, NextFunction } from 'express';

export function checkAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized! Please login first.' });
}

export function checkNotAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return next();
  }
  res.status(403).json({ message: 'Forbidden: You are already logged in' });
}
