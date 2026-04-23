import mongoose, { Schema, model, models } from 'mongoose';

const BatchSchema = new Schema({
  name:            { type: String, required: true },
  coachId:         { type: Schema.Types.ObjectId, ref: 'User' },
  timing:          { type: String, required: true },       // e.g. "06:00 - 08:00"
  days:            [{ type: String }],                     // ["Mon","Wed","Fri"]
  maxStudents:     { type: Number, default: 15 },
  level:           { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  isActive:        { type: Boolean, default: true },
}, { timestamps: true });

const StudentSchema = new Schema({
  name:            { type: String, required: true, trim: true },
  phone:           { type: String, required: true, trim: true },
  parentPhone:     { type: String, trim: true },
  email:           { type: String, trim: true, lowercase: true },
  age:             { type: Number },
  batchId:         { type: Schema.Types.ObjectId, ref: 'Batch', required: true },
  enrollmentDate:  { type: Date, required: true, default: Date.now },
  feeAmount:       { type: Number, required: true },
  feeDueDate:      { type: Date, required: true },
  feeStatus:       { type: String, enum: ['paid', 'pending', 'overdue'], default: 'pending' },
  performanceNotes:{ type: String },
  isActive:        { type: Boolean, default: true },
}, { timestamps: true });

StudentSchema.index({ batchId: 1 });

export const Batch   = models.Batch   || model('Batch',   BatchSchema);
export const Student = models.Student || model('Student', StudentSchema);
