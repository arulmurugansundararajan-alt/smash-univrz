import { Schema, model, models } from 'mongoose';

const PaymentSchema = new Schema({
  entityType:         { type: String, enum: ['member', 'student'], required: true },
  entityId:           { type: Schema.Types.ObjectId, required: true },
  razorpayOrderId:    { type: String },
  razorpayPaymentId:  { type: String },
  paymentLinkId:      { type: String },
  paymentLink:        { type: String },
  amount:             { type: Number, required: true },
  currency:           { type: String, default: 'INR' },
  status:             { type: String, enum: ['created', 'paid', 'failed', 'expired'], default: 'created' },
  purpose:            { type: String, enum: ['membership_renewal', 'coaching_fee', 'tournament_entry'], required: true },
  paidAt:             { type: Date },
}, { timestamps: true });

PaymentSchema.index({ entityId: 1 });
PaymentSchema.index({ razorpayPaymentId: 1 });

export const Payment = models.Payment || model('Payment', PaymentSchema);
