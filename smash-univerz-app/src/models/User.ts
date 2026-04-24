import mongoose from 'mongoose';

delete (mongoose.models as Record<string, unknown>)['User'];

const UserSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  username:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role:         { type: String, enum: ['admin', 'staff'], default: 'staff' },
  isActive:     { type: Boolean, default: true },
}, { timestamps: true });

export const User = mongoose.model('User', UserSchema);
