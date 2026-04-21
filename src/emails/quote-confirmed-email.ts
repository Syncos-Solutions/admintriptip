// src/emails/quote-confirmed-email.ts
// Auto-sent when user confirms quote via main site.

interface QuoteConfirmedData {
  customerName:     string;
  bookingReference: string;
  bookingType:      string;
  currency:         string;
  amount:           number;
}

const typeLabel: Record<string, string> = {
  taxi: 'Taxi Transfer', tour: 'Tour Package', custom: 'Custom Tour',
};

export function quoteConfirmedEmail(data: QuoteConfirmedData): string {
  const { customerName, bookingReference, bookingType, currency, amount } = data;
  const formattedAmount = new Intl.NumberFormat('en-LK', {
    style: 'currency', currency, minimumFractionDigits: 2,
  }).format(amount);

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>Quote Confirmed</title></head>
<body style="margin:0;padding:0;background:#F7F7F6;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F7F6;padding:40px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

  <tr><td style="background:#0D0D0D;padding:32px 40px 24px;">
    <table width="100%"><tr><td>
      <table><tr>
        <td style="background:linear-gradient(135deg,#5e17eb,#1800ad);width:28px;height:28px;text-align:center;vertical-align:middle;">
          <span style="color:#fff;font-size:10px;font-weight:900;">TT</span></td>
        <td style="padding-left:10px;"><p style="margin:0;color:#fff;font-size:13px;font-weight:700;">Sri Lankan TripTip</p></td>
      </tr></table>
    </td></tr>
    <tr><td style="padding-top:28px;">
      <p style="margin:0;color:#059669;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">Quote Confirmed ✓</p>
      <h1 style="margin:8px 0 0;color:#fff;font-size:26px;font-weight:900;line-height:1.1;">
        Your Quote Has Been<br/>Confirmed Successfully.
      </h1>
    </td></tr>
    </table>
  </td></tr>

  <tr><td style="height:3px;background:linear-gradient(to right,#059669,#0E7A45);"></td></tr>

  <tr><td style="background:#fff;padding:36px 40px;">
    <p style="margin:0 0 20px;color:#444;font-size:14px;line-height:1.7;">
      Dear <strong style="color:#111;">${customerName}</strong>,
    </p>
    <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.7;">
      We have received your confirmation for the <strong style="color:#111;">${typeLabel[bookingType] || bookingType}</strong> quote.
      Our team will now proceed with the next steps for your booking.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E8E4DF;margin-bottom:28px;">
      <tr><td style="padding:16px 20px;background:#F0FFF8;border-bottom:1px solid #E8E4DF;">
        <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#888;">Booking Reference</p>
        <p style="margin:4px 0 0;font-size:16px;font-weight:900;color:#111;letter-spacing:1px;font-family:monospace;">${bookingReference}</p>
      </td></tr>
      <tr><td style="padding:16px 20px;">
        <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#888;">Confirmed Amount</p>
        <p style="margin:4px 0 0;font-size:28px;font-weight:900;color:#111;line-height:1;">${formattedAmount}</p>
      </td></tr>
    </table>

    <p style="margin:0 0 12px;color:#555;font-size:14px;line-height:1.7;">
      <strong style="color:#111;">What happens next?</strong><br/>
      Our team will prepare your payment link and send it to you shortly.
      You can complete your booking by making the payment at your convenience.
    </p>
    <p style="margin:0;color:#555;font-size:14px;line-height:1.7;">
      Questions? Reply to this email or contact us at
      <a href="mailto:srilankantriptip@gmail.com" style="color:#5e17eb;text-decoration:none;">srilankantriptip@gmail.com</a>
    </p>
  </td></tr>

  <tr><td style="background:#0D0D0D;padding:24px 40px;">
    <p style="margin:0;color:rgba(255,255,255,0.3);font-size:11px;">Sri Lankan TripTip · srilankantriptip.com</p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;
}
