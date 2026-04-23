/**
 * WhatsApp helper using WATI REST API.
 * Switch to Meta Cloud API by changing the fetch target and payload shape.
 */

const WATI_API = process.env.WATI_API_ENDPOINT!;
const WATI_TOKEN = process.env.WATI_API_TOKEN!;

interface WATIParam {
  name: string;
  value: string;
}

/**
 * Send a pre-approved WhatsApp template message.
 * @param phone     - 10-digit Indian mobile number (no country code prefix)
 * @param template  - Approved WATI template name
 * @param params    - Ordered list of template variable values
 */
export async function sendWhatsAppTemplate(
  phone: string,
  template: string,
  params: string[],
): Promise<{ success: boolean; error?: string }> {
  const parameters: WATIParam[] = params.map((value, i) => ({
    name: (i + 1).toString(),
    value,
  }));

  try {
    const res = await fetch(`${WATI_API}/api/v1/sendTemplateMessage`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${WATI_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        template_name: template,
        broadcast_name: template,
        parameters,
        receivers: [{ whatsappNumber: `91${phone}` }],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: text };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

// ── Convenience wrappers ───────────────────────────────────────────────────────

export function sendMembershipExpiryReminder(
  phone: string,
  name: string,
  expiryDate: string,
  paymentLink: string,
) {
  return sendWhatsAppTemplate(phone, 'membership_expiry_reminder', [name, expiryDate, paymentLink]);
}

export function sendFeePendingAlert(
  phone: string,
  name: string,
  feeAmount: string,
  dueDate: string,
  paymentLink: string,
) {
  return sendWhatsAppTemplate(phone, 'fee_pending_alert', [name, feeAmount, dueDate, paymentLink]);
}

export function sendPaymentConfirmation(
  phone: string,
  name: string,
  amount: string,
  validTill: string,
) {
  return sendWhatsAppTemplate(phone, 'payment_confirmation', [name, amount, validTill]);
}
