import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../application/services/Auth.service';
import { UserRepository } from '../../infrastructure/repositories/User.repository';
import { AppError } from './error.middleware';

const authService = new AuthService();
const userRepository = new UserRepository();

export interface AuthRequest extends Request {
  user?: {
    _id: string;
    sub: string;
    userId: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new AppError('No token provided', 401);
    }

    const decoded = authService.verifyAccessToken(token);

    // Re-fetch user from DB to ensure they are still active
    const user = await userRepository.findById(decoded.sub);
    if (!user) {
      throw new AppError('User no longer exists', 401);
    }
    if (!user.isActive) {
      throw new AppError('Account has been deactivated', 401);
    }

    req.user = {
      _id: decoded.sub,
      sub: decoded.sub,
      userId: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }

    next();
  };
};
