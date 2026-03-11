import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../application/services/Auth.service';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.register(req.body);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  getProfile = async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id || req.user.userId;
      const user = await this.authService.getUserById(userId);

      res.status(200).json({
        success: true,
        data: user
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
        data: users
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
        data: result
      });
    } catch (error) {
      next(error);
    }
  };
}
