import jwt from 'jsonwebtoken';
import { UserRepository } from '../../infrastructure/repositories/User.repository';
import { IUser } from '../../domain/entities/User';
import { AppError } from '../../presentation/middlewares/error.middleware';

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async register(userData: IUser) {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }

    // Create user
    const user = await this.userRepository.create(userData);

    // Generate token
    const token = this.generateToken(user._id!.toString(), user.role);

    return {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      },
      token
    };
  }

  async login(email: string, password: string) {
    // Find user
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError('Account is deactivated', 401);
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Update last login
    await this.userRepository.updateLastLogin(user._id!.toString());

    // Generate token
    const token = this.generateToken(user._id!.toString(), user.role);

    return {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        mechanicId: user.mechanicId
      },
      token
    };
  }

  async getUserById(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      mechanicId: user.mechanicId,
      isActive: user.isActive
    };
  }

  private generateToken(userId: string, role: string): string {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-super-secret-jwt-key') {
      throw new Error('JWT_SECRET must be set in environment variables for security');
    }
    
    return jwt.sign(
      { _id: userId, userId, role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '24h' } as any
    );
  }

  verifyToken(token: string): any {
    try {
      if (!process.env.JWT_SECRET) {
        throw new AppError('JWT configuration error', 500);
      }
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new AppError('Token has expired. Please login again', 401);
      }
      throw new AppError('Invalid or expired token', 401);
    }
  }
}
