/**
 * WhatsApp helper — supports both Meta Cloud API (recommended, cheap) and WATI.
 *
 * Set WHATSAPP_PROVIDER=meta  (default) or WHATSAPP_PROVIDER=wati in env.
 *
 * Meta Cloud API env vars needed:
 *   WHATSAPP_PHONE_NUMBER_ID   — from Meta Developer Dashboard
 *   WHATSAPP_ACCESS_TOKEN      — permanent system-user token
 *
 * WATI env vars needed (legacy):
 *   WATI_API_ENDPOINT
 *   WATI_API_TOKEN
 */

// ── Meta Cloud API ─────────────────────────────────────────────────────────────

async function sendViaMeta(
  phone: string,
  template: string,
  params: string[],
): Promise<{ success: boolean; error?: string }> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneNumberId || !token) {
    return { success: false, error: 'WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN not set' };
  }

  const components = params.length > 0 ? [{
    type: 'body',
    parameters: params.map((value) => ({ type: 'text', text: value })),
  }] : [];

  try {
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: `91${phone}`,
          type: 'template',
          template: {
            name: template,
            language: { code: 'en' },
            components,
          },
        }),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: text };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

// ── WATI (legacy fallback) ─────────────────────────────────────────────────────

async function sendViaWati(
  phone: string,
  template: string,
  params: string[],
): Promise<{ success: boolean; error?: string }> {
  const WATI_API = process.env.WATI_API_ENDPOINT;
  const WATI_TOKEN = process.env.WATI_API_TOKEN;
  if (!WATI_API || !WATI_TOKEN) {
    return { success: false, error: 'WATI_API_ENDPOINT or WATI_API_TOKEN not set' };
  }

  const parameters = params.map((value, i) => ({ name: (i + 1).toString(), value }));
  try {
    const res = await fetch(`${WATI_API}/api/v1/sendTemplateMessage`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${WATI_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ template_name: template, broadcast_name: template, parameters, receivers: [{ whatsappNumber: `91${phone}` }] }),
    });
    if (!res.ok) return { success: false, error: await res.text() };
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

// ── Unified sender ─────────────────────────────────────────────────────────────

/**
 * Send a pre-approved WhatsApp template message.
 * @param phone     - 10-digit Indian mobile number (no country code)
 * @param template  - Approved template name (must match exactly in Meta/WATI)
 * @param params    - Ordered list of {{1}}, {{2}} ... variable values
 */
export function sendWhatsAppTemplate(
  phone: string,
  template: string,
  params: string[],
): Promise<{ success: boolean; error?: string }> {
  const provider = process.env.WHATSAPP_PROVIDER ?? 'meta';
  if (provider === 'wati') return sendViaWati(phone, template, params);
  return sendViaMeta(phone, template, params);
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
