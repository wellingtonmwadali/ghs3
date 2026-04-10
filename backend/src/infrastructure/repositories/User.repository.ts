import { UserModel, IUserDocument } from '../models/User.model';
import { IUser } from '../../domain/entities/User';

export class UserRepository {
  async create(userData: IUser): Promise<IUserDocument> {
    const user = new UserModel(userData);
    return await user.save();
  }

  async findById(id: string): Promise<IUserDocument | null> {
    return await UserModel.findById(id);
  }

  async findByIdWithPassword(id: string): Promise<IUserDocument | null> {
    return await UserModel.findById(id).select('+password');
  }

  async findByEmail(email: string): Promise<IUserDocument | null> {
    return await UserModel.findOne({ email: email.toLowerCase() }).select('+password +refreshToken');
  }

  async findAll(): Promise<IUserDocument[]> {
    return await UserModel.find().sort({ createdAt: -1 });
  }

  async toggleActive(id: string): Promise<IUserDocument | null> {
    const user = await UserModel.findById(id);
    if (!user) return null;
    user.isActive = !user.isActive;
    return await user.save();
  }

  async update(id: string, updateData: Partial<IUser>): Promise<IUserDocument | null> {
    // If password is being changed, use save() so pre-save hook hashes it
    if (updateData.password) {
      const user = await UserModel.findById(id).select('+password');
      if (!user) return null;
      Object.assign(user, updateData);
      return await user.save();
    }
    return await UserModel.findByIdAndUpdate(id, updateData, { new: true });
  }

  async delete(id: string): Promise<boolean> {
    const result = await UserModel.findByIdAndUpdate(id, { isActive: false });
    return !!result;
  }

  async updateLastLogin(id: string): Promise<void> {
    await UserModel.findByIdAndUpdate(id, { lastLogin: new Date() });
  }

  async updateRefreshToken(id: string, hashedToken: string | null): Promise<void> {
    await UserModel.findByIdAndUpdate(id, { refreshToken: hashedToken });
  }

  async getRefreshToken(id: string): Promise<string | null> {
    const user = await UserModel.findById(id).select('+refreshToken');
    return user?.refreshToken || null;
  }

  async findByRole(role: string): Promise<IUserDocument[]> {
    return await UserModel.find({ role, isActive: true });
  }
}
