import mongoose from 'mongoose';

delete (mongoose.models as Record<string, unknown>)['Member'];

const MemberSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  phone:         { type: String, required: true, unique: true, trim: true },
  email:         { type: String, trim: true, lowercase: true },
  plan:          { type: String, enum: ['monthly', 'half_yearly', 'yearly'], required: true },
  planPrice:     { type: Number, default: 0 },
  startDate:     { type: Date, required: true },
  expiryDate:    { type: Date, required: true, index: true },
  paymentStatus: { type: String, enum: ['paid', 'pending', 'overdue'], default: 'pending' },
  paidAmount:    { type: Number, default: 0 },
  paidAt:        { type: Date },
  notes:         { type: String },
  isActive:      { type: Boolean, default: true },
}, { timestamps: true });

export const Member = mongoose.model('Member', MemberSchema);
