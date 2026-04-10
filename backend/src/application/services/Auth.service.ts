import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserRepository } from '../../infrastructure/repositories/User.repository';
import { IUser, UserRole, ROLE_PERMISSIONS } from '../../domain/entities/User';
import { IUserDocument } from '../../infrastructure/models/User.model';
import { AppError } from '../../presentation/middlewares/error.middleware';

// ── Token payload types ──

interface TokenPayload {
  sub: string;        // user._id
  userId: string;     // human-readable USR-00001
  role: UserRole;
  iat?: number;
  exp?: number;
}

interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: number;   // seconds
}

interface SessionInfo {
  session_id: string;
  issued_at: string;
  expires_at: string;
  ip_address?: string;
  device?: string;
}

interface UserProfile {
  id: string;
  uuid: string;
  userId: string;
  email: string;
  full_name: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatar_url: string;
  role: {
    id: string;
    name: string;
    slug: UserRole;
    permissions: string[];
  };
  branch: string;
  department: string;
  mechanicId?: string;
  is_active: boolean;
  is_verified: boolean;
  mfa_enabled: boolean;
  last_login: string | null;
  login_count: number;
  created_at: string;
}

// ── Service ──

export class AuthService {
  private userRepository: UserRepository;

  // Access token lives 1 hour, refresh token 7 days
  private readonly ACCESS_TOKEN_EXPIRY = 60 * 60; // 1 hour in seconds
  private readonly REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days

  constructor() {
    this.userRepository = new UserRepository();
  }

  // ── Register ──

  async register(userData: IUser, createdByRole?: UserRole) {
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }

    // Only owners can create owners
    if (userData.role === 'owner' && createdByRole !== 'owner') {
      throw new AppError('Only an owner can create another owner account', 403);
    }

    // Set default permissions from role map
    const roleInfo = ROLE_PERMISSIONS[userData.role];
    userData.permissions = roleInfo.permissions;

    const user = await this.userRepository.create(userData);

    return {
      user: this.formatUserProfile(user),
      message: 'User registered successfully',
    };
  }

  // ── Login ──

  async login(email: string, password: string, meta?: { ip?: string; userAgent?: string }) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check account lock
    if (user.isLocked()) {
      const lockMin = Math.ceil(((user.lockUntil as Date).getTime() - Date.now()) / 60000);
      throw new AppError(`Account locked. Try again in ${lockMin} minute(s)`, 423);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated. Contact your administrator', 401);
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await user.incrementLoginAttempts();
      const remaining = Math.max(0, 5 - user.failedLoginAttempts);
      throw new AppError(
        remaining > 0
          ? `Invalid email or password. ${remaining} attempt(s) remaining`
          : 'Account locked due to too many failed attempts. Try again in 30 minutes',
        401
      );
    }

    // Successful login — reset attempts, update login info
    await user.resetLoginAttempts();

    user.lastLogin = new Date();
    user.lastLoginIp = meta?.ip;
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    // Generate token pair
    const tokens = this.generateTokenPair(user._id!.toString(), user.userId || '', user.role);

    // Store hashed refresh token
    await this.userRepository.updateRefreshToken(
      user._id!.toString(),
      this.hashToken(tokens.refresh_token)
    );

    // Session info
    const session: SessionInfo = {
      session_id: `sess_${crypto.randomBytes(12).toString('hex')}`,
      issued_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + this.ACCESS_TOKEN_EXPIRY * 1000).toISOString(),
      ip_address: meta?.ip ? meta.ip.replace(/^.*:/, '') : undefined,
      device: meta?.userAgent ? this.parseDevice(meta.userAgent) : undefined,
    };

    return {
      token: tokens,
      user: this.formatUserProfile(user),
      session,
    };
  }

  // ── Refresh Token ──

  async refreshAccessToken(refreshToken: string) {
    // Verify the refresh token
    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(refreshToken, this.getRefreshSecret()) as TokenPayload;
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const user = await this.userRepository.findById(decoded.sub);
    if (!user || !user.isActive) {
      throw new AppError('User not found or deactivated', 401);
    }

    // Compare stored hashed refresh token
    const storedHash = await this.userRepository.getRefreshToken(user._id!.toString());
    if (!storedHash || storedHash !== this.hashToken(refreshToken)) {
      throw new AppError('Refresh token has been revoked', 401);
    }

    // Rotate: issue new pair
    const tokens = this.generateTokenPair(user._id!.toString(), user.userId || '', user.role);

    await this.userRepository.updateRefreshToken(
      user._id!.toString(),
      this.hashToken(tokens.refresh_token)
    );

    return { token: tokens };
  }

  // ── Logout ──

  async logout(userId: string) {
    await this.userRepository.updateRefreshToken(userId, null);
    return { message: 'Logged out successfully' };
  }

  // ── Change Password ──

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const fullUser = await this.userRepository.findByIdWithPassword(userId);
    if (!fullUser) {
      throw new AppError('User not found', 404);
    }

    const valid = await fullUser.comparePassword(currentPassword);
    if (!valid) {
      throw new AppError('Current password is incorrect', 400);
    }

    fullUser.password = newPassword;
    await fullUser.save(); // pre-save hook hashes it

    // Invalidate all refresh tokens
    await this.userRepository.updateRefreshToken(userId, null);

    return { message: 'Password changed successfully. Please login again' };
  }

  // ── Profile ──

  async getUserById(id: string): Promise<UserProfile> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return this.formatUserProfile(user);
  }

  async getAllUsers() {
    const users = await this.userRepository.findAll();
    return users.map((u) => this.formatUserProfile(u));
  }

  async toggleUserActive(id: string) {
    const user = await this.userRepository.toggleActive(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // If deactivating, revoke refresh token immediately
    if (!user.isActive) {
      await this.userRepository.updateRefreshToken(id, null);
    }

    return {
      id: user._id,
      userId: user.userId,
      is_active: user.isActive,
    };
  }

  // ── Token helpers ──

  generateTokenPair(mongoId: string, userId: string, role: UserRole): TokenPair {
    const secret = this.getAccessSecret();
    const refreshSecret = this.getRefreshSecret();

    const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
      sub: mongoId,
      userId,
      role,
    };

    const access_token = jwt.sign(payload, secret, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
    });

    const refresh_token = jwt.sign(payload, refreshSecret, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY,
    });

    return {
      access_token,
      refresh_token,
      token_type: 'Bearer',
      expires_in: this.ACCESS_TOKEN_EXPIRY,
    };
  }

  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.getAccessSecret()) as TokenPayload;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new AppError('Access token expired. Please refresh', 401);
      }
      throw new AppError('Invalid token', 401);
    }
  }

  // ── Private helpers ──

  private getAccessSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret === 'your-super-secret-jwt-key') {
      throw new Error('JWT_SECRET must be set in environment variables');
    }
    return secret;
  }

  private getRefreshSecret(): string {
    return (process.env.JWT_REFRESH_SECRET || this.getAccessSecret() + '_refresh');
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private parseDevice(ua: string): string {
    const browser = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)/i)?.[1] || 'Unknown';
    const os = ua.match(/(Windows|Mac|Linux|Android|iOS)/i)?.[1] || 'Unknown';
    return `${browser} / ${os}`;
  }

  private formatUserProfile(user: IUserDocument): UserProfile {
    const roleInfo = ROLE_PERMISSIONS[user.role];
    return {
      id: user._id!.toString(),
      uuid: user._id!.toString(),
      userId: user.userId || '',
      email: user.email,
      full_name: `${user.firstName} ${user.lastName}`,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      avatar_url: user.avatarUrl || '',
      role: {
        id: `ROLE-${user.role.toUpperCase()}`,
        name: roleInfo?.name || user.role,
        slug: user.role,
        permissions: user.permissions?.length ? user.permissions : roleInfo?.permissions || [],
      },
      branch: user.branch || '',
      department: user.department || '',
      mechanicId: user.mechanicId,
      is_active: user.isActive,
      is_verified: user.isVerified ?? false,
      mfa_enabled: user.mfaEnabled ?? false,
      last_login: user.lastLogin ? user.lastLogin.toISOString() : null,
      login_count: user.loginCount || 0,
      created_at: user.createdAt ? user.createdAt.toISOString() : '',
    };
  }
}
