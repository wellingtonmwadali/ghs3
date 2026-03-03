// Domain Entity: User (for authentication)
export interface IUser {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  
  role: 'owner' | 'manager' | 'mechanic' | 'receptionist';
  
  mechanicId?: string; // Reference to Mechanic if role is mechanic
  
  isActive: boolean;
  lastLogin?: Date;
  
  permissions?: string[];
  
  createdAt?: Date;
  updatedAt?: Date;
}
