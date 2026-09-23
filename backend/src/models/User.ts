import { Schema as MongooseSchema, Document as MongooseDocument, model, models } from 'mongoose';

export interface IUser extends MongooseDocument {
  name: string;
  email: string;
  passwordHash: string;
  whatsappNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new MongooseSchema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    whatsappNumber: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const User = models.User || model<IUser>('User', UserSchema);
