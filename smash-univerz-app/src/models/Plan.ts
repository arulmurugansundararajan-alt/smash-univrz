import mongoose from 'mongoose';

delete (mongoose.models as Record<string, unknown>)['Plan'];

const PlanSchema = new mongoose.Schema({
  name:           { type: String, required: true },          // "Monthly Plan"
  slug:           { type: String, required: true, unique: true }, // monthly | half_yearly | yearly
  durationMonths: { type: Number, required: true },
  price:          { type: Number, required: true, default: 0 },
  isActive:       { type: Boolean, default: true },
});

export const Plan = mongoose.model('Plan', PlanSchema);
