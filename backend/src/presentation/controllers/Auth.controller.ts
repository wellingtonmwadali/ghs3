import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../application/services/Auth.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const createdByRole = req.user?.role;
      const result = await this.authService.register(req.body, createdByRole as any);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      const meta = {
        ip: req.ip || req.socket.remoteAddress || '',
        userAgent: req.headers['user-agent'] || '',
      };

      const result = await this.authService.login(email, password, meta);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refresh_token } = req.body;
      if (!refresh_token) {
        return res.status(400).json({ success: false, message: 'refresh_token is required' });
      }

      const result = await this.authService.refreshAccessToken(refresh_token);

      res.status(200).json({
        success: true,
        message: 'Token refreshed',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.sub || req.user?._id;
      const result = await this.authService.logout(userId!);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.sub || req.user?._id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'currentPassword and newPassword are required',
        });
      }

      const result = await this.authService.changePassword(userId!, currentPassword, newPassword);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };

  getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.sub || req.user?._id;
      const user = await this.authService.getUserById(userId!);

      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  };

  getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await this.authService.getAllUsers();
      res.status(200).json({
        success: true,
        data: { users, total: users.length },
      });
    } catch (error) {
      next(error);
    }
  };

  toggleUserActive = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.toggleUserActive(req.params.id);
      res.status(200).json({
        success: true,
        message: 'User status updated',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
