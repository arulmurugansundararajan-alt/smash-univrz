import mongoose from 'mongoose';

delete (mongoose.models as Record<string, unknown>)['Student'];

const StudentSchema = new mongoose.Schema({
  name:             { type: String, required: true, trim: true },
  phone:            { type: String, required: true, trim: true },
  parentPhone:      { type: String, trim: true },
  email:            { type: String, trim: true, lowercase: true },
  age:              { type: Number },
  batchName:        { type: String, required: true, trim: true },
  coachName:        { type: String, trim: true },
  level:            { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  enrollmentDate:   { type: Date, default: Date.now },
  feeAmount:        { type: Number, required: true },
  feeDueDate:       { type: Date, required: true },
  feeStatus:        { type: String, enum: ['paid', 'pending', 'overdue'], default: 'pending' },
  paidAmount:       { type: Number, default: 0 },
  paidAt:           { type: Date },
  performanceNotes: { type: String },
  isActive:         { type: Boolean, default: true },
}, { timestamps: true });

export const Student = mongoose.model('Student', StudentSchema);
