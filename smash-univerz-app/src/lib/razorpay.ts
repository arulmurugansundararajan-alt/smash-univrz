import Razorpay from 'razorpay';
import crypto from 'crypto';

// Lazy singleton — only instantiated at runtime, not at build time.
// This prevents Vercel build errors when env vars are not yet available.
let _razorpay: Razorpay | null = null;
function getRazorpay(): Razorpay {
  if (!_razorpay) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set');
    }
    _razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return _razorpay;
}

const LINK_EXPIRY_DAYS = 7;

interface CreateLinkParams {
  amount: number;        // in ₹ (not paise)
  name: string;
  phone: string;
  description: string;
  referenceId?: string;
}

/**
 * Create a Razorpay Payment Link and return the short URL.
 */
export async function createPaymentLink(params: CreateLinkParams): Promise<string> {
  const expireBy = Math.floor(Date.now() / 1000) + LINK_EXPIRY_DAYS * 86400;

  const link = await getRazorpay().paymentLink.create({
    amount: params.amount * 100,       // convert to paise
    currency: 'INR',
    description: params.description,
    reference_id: params.referenceId,
    customer: {
      name: params.name,
      contact: `+91${params.phone}`,
    },
    notify: { sms: false, email: false }, // handled via WhatsApp
    reminder_enable: false,
    callback_url: `${process.env.NEXT_PUBLIC_URL}/payment/success`,
    callback_method: 'get',
    expire_by: expireBy,
  } as Parameters<typeof Razorpay.prototype.paymentLink.create>[0]);

  return (link as { short_url: string }).short_url;
}

/**
 * Verify Razorpay webhook signature.
 * Returns true if signature is valid.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
): boolean {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
