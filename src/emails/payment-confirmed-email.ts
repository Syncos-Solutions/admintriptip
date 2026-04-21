// src/emails/payment-confirmed-email.ts
// Auto-sent to customer after successful PayHere payment webhook.

interface PaymentConfirmedData {
  customerName:     string;
  bookingReference: string;
  bookingType:      string;
  currency:         string;
  amount:           number;
  paymentType:      string;
  payherePaymentId: string;
}

const typeLabel: Record<string, string> = {
  taxi: 'Taxi Transfer', tour: 'Tour Package', custom: 'Custom Tour',
};
const payTypeLabel: Record<string, string> = {
  full: 'Full Payment', deposit: 'Advance / Deposit', partial: 'Partial Payment',
};

export function paymentConfirmedEmail(data: PaymentConfirmedData): string {
  const { customerName, bookingReference, bookingType, currency, amount, paymentType, payherePaymentId } = data;
  const formattedAmount = new Intl.NumberFormat('en-LK', {
    style: 'currency', currency, minimumFractionDigits: 2,
  }).format(amount);
  const today = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>Payment Confirmed</title></head>
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
      <p style="margin:0;color:#059669;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">Payment Received ✓</p>
      <h1 style="margin:8px 0 0;color:#fff;font-size:26px;font-weight:900;line-height:1.1;">
        Payment Confirmed.<br/>Your Journey Awaits.
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
      We have successfully received your payment for your
      <strong style="color:#111;">${typeLabel[bookingType] || bookingType}</strong> booking.
      Please keep this email as your payment receipt.
    </p>

    <!-- Receipt box -->
    <table width="100%" cellpadding="0" cellspacing="0"
      style="border:2px solid #059669;margin-bottom:28px;">
      <tr><td colspan="2" style="background:#F0FFF8;padding:14px 20px;border-bottom:1px solid #D1FAE5;">
        <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#059669;">
          ✓ Payment Receipt
        </p>
      </td></tr>
      <tr>
        <td style="padding:14px 20px;border-bottom:1px solid #E8E4DF;width:50%;">
          <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#888;">Booking Reference</p>
          <p style="margin:4px 0 0;font-size:13px;font-weight:900;color:#111;font-family:monospace;">${bookingReference}</p>
        </td>
        <td style="padding:14px 20px;border-bottom:1px solid #E8E4DF;">
          <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#888;">Payment Date</p>
          <p style="margin:4px 0 0;font-size:13px;font-weight:600;color:#111;">${today}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 20px;border-bottom:1px solid #E8E4DF;">
          <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#888;">Amount Paid</p>
          <p style="margin:4px 0 0;font-size:22px;font-weight:900;color:#059669;">${formattedAmount}</p>
        </td>
        <td style="padding:14px 20px;border-bottom:1px solid #E8E4DF;">
          <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#888;">Payment Type</p>
          <p style="margin:4px 0 0;font-size:13px;font-weight:600;color:#111;">${payTypeLabel[paymentType] || paymentType}</p>
        </td>
      </tr>
      <tr><td style="padding:14px 20px;" colspan="2">
        <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#888;">Transaction ID</p>
        <p style="margin:4px 0 0;font-size:12px;font-weight:600;color:#555;font-family:monospace;">${payherePaymentId}</p>
      </td></tr>
    </table>

    <p style="margin:0 0 12px;color:#555;font-size:14px;line-height:1.7;">
      Our team is now finalising your travel arrangements and will be in touch
      with your full itinerary and pick-up details soon.
    </p>
    <p style="margin:0;color:#555;font-size:14px;line-height:1.7;">
      Any questions? Contact us at
      <a href="mailto:srilankantriptip@gmail.com" style="color:#5e17eb;text-decoration:none;">srilankantriptip@gmail.com</a>
    </p>
  </td></tr>

  <tr><td style="background:#0D0D0D;padding:24px 40px;">
    <p style="margin:0;color:rgba(255,255,255,0.3);font-size:11px;">Sri Lankan TripTip · srilankantriptip.com</p>
    <p style="margin:6px 0 0;color:rgba(255,255,255,0.15);font-size:10px;">
      Thank you for choosing Sri Lankan TripTip. We look forward to welcoming you.
    </p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;
}
