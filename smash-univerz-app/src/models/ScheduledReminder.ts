import mongoose, { Schema } from 'mongoose';

export type ReminderTarget = 'all_active' | 'overdue' | 'expiring_3d' | 'expiring_7d';
export type ReminderStatus = 'scheduled' | 'sending' | 'sent' | 'failed';

const ScheduledReminderSchema = new Schema(
  {
    title:        { type: String, required: true, trim: true },
    targetGroup:  { type: String, enum: ['all_active', 'overdue', 'expiring_3d', 'expiring_7d'], required: true },
    scheduledAt:  { type: Date, required: true },
    status:       { type: String, enum: ['scheduled', 'sending', 'sent', 'failed'], default: 'scheduled' },
    sentCount:    { type: Number, default: 0 },
    failedCount:  { type: Number, default: 0 },
    totalCount:   { type: Number, default: 0 },
    sentAt:       { type: Date },
    errorMsg:     { type: String },
  },
  { timestamps: true },
);

ScheduledReminderSchema.index({ scheduledAt: 1, status: 1 });

delete (mongoose.models as Record<string, unknown>)['ScheduledReminder'];
export const ScheduledReminder = mongoose.model('ScheduledReminder', ScheduledReminderSchema);
