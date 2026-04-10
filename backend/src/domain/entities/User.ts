// Domain Entity: User (for authentication)

export type UserRole = 'owner' | 'manager' | 'mechanic' | 'receptionist';

export interface IUserRole {
  id: string;
  name: string;
  slug: UserRole;
  permissions: string[];
}

// Predefined role permission map
export const ROLE_PERMISSIONS: Record<UserRole, { name: string; permissions: string[] }> = {
  owner: {
    name: 'Administrator',
    permissions: [
      'read', 'write', 'delete',
      'manage_users', 'manage_settings', 'manage_roles',
      'view_reports', 'export_data',
      'manage_inventory', 'manage_finances',
      'approve_jobs', 'manage_jobs',
    ],
  },
  manager: {
    name: 'Manager',
    permissions: [
      'read', 'write',
      'view_reports', 'export_data',
      'manage_inventory',
      'approve_jobs', 'manage_jobs',
    ],
  },
  mechanic: {
    name: 'Mechanic',
    permissions: [
      'read', 'write',
      'manage_jobs',
    ],
  },
  receptionist: {
    name: 'Receptionist',
    permissions: [
      'read', 'write',
      'manage_jobs',
    ],
  },
};

export interface IUser {
  _id?: string;
  userId?: string;       // Human-readable ID: USR-00001
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;

  role: UserRole;
  permissions: string[];

  mechanicId?: string;   // Reference to Mechanic if role is mechanic
  branch?: string;       // Branch name/code
  department?: string;

  avatarUrl?: string;

  isActive: boolean;
  isVerified: boolean;
  mfaEnabled: boolean;

  lastLogin?: Date;
  lastLoginIp?: string;
  loginCount: number;
  failedLoginAttempts: number;
  lockUntil?: Date;

  refreshToken?: string;

  passwordChangedAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}
