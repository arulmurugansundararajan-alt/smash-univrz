import mongoose, { Schema, model, models } from 'mongoose';

const MemberSchema = new Schema({
  name:             { type: String, required: true, trim: true },
  phone:            { type: String, required: true, unique: true, trim: true },
  email:            { type: String, trim: true, lowercase: true },
  photo:            { type: String },
  membershipPlan:   { type: String, enum: ['monthly', 'quarterly', 'yearly'], required: true },
  startDate:        { type: Date, required: true },
  expiryDate:       { type: Date, required: true, index: true },
  paymentStatus:    { type: String, enum: ['paid', 'pending', 'overdue'], default: 'pending' },
  autoRenew:        { type: Boolean, default: false },
  notes:            { type: String },
  isActive:         { type: Boolean, default: true },
}, { timestamps: true });

export const Member = models.Member || model('Member', MemberSchema);
