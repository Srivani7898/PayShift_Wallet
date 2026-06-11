import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { ForbiddenError, UnauthorizedError } from '../utils';

export const requireAdmin = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenError('Administrative privileges required');
    }

    next();
  } catch (err) {
    next(err);
  }
};
