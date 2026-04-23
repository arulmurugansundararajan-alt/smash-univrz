import { Schema, model, models } from 'mongoose';

const AttendanceSchema = new Schema({
  studentId:  { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  batchId:    { type: Schema.Types.ObjectId, ref: 'Batch',   required: true },
  markedBy:   { type: Schema.Types.ObjectId, ref: 'User',    required: true },
  date:       { type: String, required: true },   // "YYYY-MM-DD" — easy to query by day
  status:     { type: String, enum: ['present', 'absent', 'leave'], required: true },
  note:       { type: String },
}, { timestamps: true });

// Compound unique: one record per student per day
AttendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ batchId: 1, date: 1 });

export const Attendance = models.Attendance || model('Attendance', AttendanceSchema);
