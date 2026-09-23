import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { Preferences } from '../models/Preferences';
import { env } from '../config/env';

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  whatsappNumber?: string;
  createdAt: Date;
}

export interface AuthResult {
  user: UserResponse;
  token: string;
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateToken(userId: string, email: string): string {
    return jwt.sign({ userId, email }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });
  }

  static verifyToken(token: string): { userId: string; email: string } {
    return jwt.verify(token, env.JWT_SECRET) as { userId: string; email: string };
  }

  static formatUser(user: IUser): UserResponse {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      whatsappNumber: user.whatsappNumber,
      createdAt: user.createdAt,
    };
  }

  static async register(data: {
    name: string;
    email: string;
    password: string;
    whatsappNumber?: string;
  }): Promise<AuthResult> {
    const emailLower = data.email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser) {
      const error: any = new Error('A user with this email already exists');
      error.statusCode = 409;
      error.code = 'EMAIL_EXISTS';
      throw error;
    }

    const passwordHash = await this.hashPassword(data.password);

    const newUser = await User.create({
      name: data.name.trim(),
      email: emailLower,
      passwordHash,
      whatsappNumber: data.whatsappNumber?.trim() || '',
    });

    // Create default user preferences
    await Preferences.create({
      userId: newUser._id,
    });

    const token = this.generateToken(newUser._id.toString(), newUser.email);

    return {
      user: this.formatUser(newUser),
      token,
    };
  }

  static async login(data: { email: string; password: string }): Promise<AuthResult> {
    const emailLower = data.email.toLowerCase().trim();

    const user = await User.findOne({ email: emailLower });
    if (!user) {
      const error: any = new Error('Invalid email or password');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    const isMatch = await this.comparePassword(data.password, user.passwordHash);
    if (!isMatch) {
      const error: any = new Error('Invalid email or password');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    const token = this.generateToken(user._id.toString(), user.email);

    return {
      user: this.formatUser(user),
      token,
    };
  }

  static async getCurrentUser(userId: string): Promise<{ user: UserResponse; preferences: any }> {
    const user = await User.findById(userId);
    if (!user) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    const preferences = await Preferences.findOne({ userId });

    return {
      user: this.formatUser(user),
      preferences: preferences || null,
    };
  }
}
