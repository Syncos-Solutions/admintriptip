// src/emails/payment-request-email.ts
// Sent to customer with a secure payment link.

interface PaymentRequestEmailData {
  customerName:     string;
  bookingReference: string;
  bookingType:      string;
  currency:         string;
  amount:           number;
  paymentType:      string;
  payUrl:           string;
}

const typeLabel: Record<string, string> = {
  taxi: 'Taxi Transfer', tour: 'Tour Package', custom: 'Custom Tour',
};
const payTypeLabel: Record<string, string> = {
  full: 'Full Payment', deposit: 'Advance / Deposit', partial: 'Partial Payment',
};

export function paymentRequestEmail(data: PaymentRequestEmailData): string {
  const { customerName, bookingReference, bookingType, currency, amount, paymentType, payUrl } = data;
  const formattedAmount = new Intl.NumberFormat('en-LK', {
    style: 'currency', currency, minimumFractionDigits: 2,
  }).format(amount);

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>Payment Request — Sri Lankan TripTip</title></head>
<body style="margin:0;padding:0;background:#F7F7F6;font-family:'DM Sans',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F7F6;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

        <tr>
          <td style="background:#0D0D0D;padding:32px 40px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td>
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background:linear-gradient(135deg,#5e17eb,#1800ad);width:28px;height:28px;text-align:center;vertical-align:middle;">
                      <span style="color:#fff;font-size:10px;font-weight:900;">TT</span>
                    </td>
                    <td style="padding-left:10px;">
                      <p style="margin:0;color:#fff;font-size:13px;font-weight:700;">Sri Lankan TripTip</p>
                    </td>
                  </tr>
                </table>
              </td></tr>
              <tr><td style="padding-top:28px;">
                <p style="margin:0;color:#5e17eb;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">
                  Payment Request
                </p>
                <h1 style="margin:8px 0 0;color:#fff;font-size:28px;font-weight:900;line-height:1.1;letter-spacing:-0.5px;">
                  Complete Your<br/>Booking Payment.
                </h1>
              </td></tr>
            </table>
          </td>
        </tr>

        <tr><td style="height:3px;background:linear-gradient(to right,#5e17eb,#1800ad);"></td></tr>

        <tr>
          <td style="background:#fff;padding:36px 40px;">
            <p style="margin:0 0 20px;color:#444;font-size:14px;line-height:1.7;">
              Dear <strong style="color:#111;">${customerName}</strong>,
            </p>
            <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.7;">
              Your <strong style="color:#111;">${typeLabel[bookingType] || bookingType}</strong> is confirmed.
              Please complete your payment to finalise the arrangements.
            </p>

            <!-- Payment summary box -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="border:1px solid #E8E4DF;margin-bottom:28px;">
              <tr>
                <td style="padding:16px 20px;background:#F7F7F6;border-bottom:1px solid #E8E4DF;">
                  <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#888;">Booking Reference</p>
                  <p style="margin:4px 0 0;font-size:16px;font-weight:900;color:#111;letter-spacing:1px;font-family:monospace;">${bookingReference}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#888;">Amount Due</p>
                        <p style="margin:4px 0 0;font-size:28px;font-weight:900;color:#111;line-height:1;">${formattedAmount}</p>
                      </td>
                      <td align="right" style="vertical-align:bottom;">
                        <span style="display:inline-block;background:#F0EBFF;color:#5e17eb;font-size:10px;font-weight:700;padding:4px 10px;letter-spacing:1px;text-transform:uppercase;">
                          ${payTypeLabel[paymentType] || paymentType}
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
              <tr>
                <td style="background:linear-gradient(135deg,#5e17eb,#1800ad);">
                  <a href="${payUrl}"
                    style="display:block;padding:14px 36px;color:#fff;font-size:13px;font-weight:700;text-decoration:none;letter-spacing:1px;text-transform:uppercase;">
                    Pay Now — ${formattedAmount} →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 20px;font-size:12px;color:#888;">
              Secure payment powered by PayHere. Your card details are never stored on our servers.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0"
              style="border-left:2px solid #5e17eb;padding-left:16px;margin-bottom:28px;">
              <tr><td>
                <p style="margin:0;font-size:12px;color:#555;line-height:1.7;">
                  The payment page includes our full <strong>Terms &amp; Conditions</strong> for your review.
                  Clicking Pay on that page constitutes your agreement to our booking terms.
                </p>
              </td></tr>
            </table>

            <p style="margin:0 0 8px;font-size:12px;color:#888;">If the button doesn&rsquo;t work, use this link:</p>
            <p style="margin:0;font-size:11px;color:#5e17eb;word-break:break-all;">
              <a href="${payUrl}" style="color:#5e17eb;">${payUrl}</a>
            </p>
          </td>
        </tr>

        <tr>
          <td style="background:#0D0D0D;padding:24px 40px;">
            <p style="margin:0;color:rgba(255,255,255,0.3);font-size:11px;">
              Sri Lankan TripTip &nbsp;·&nbsp; srilankantriptip.com
            </p>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.15);font-size:10px;">
              This payment request was issued for booking ${bookingReference}.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
