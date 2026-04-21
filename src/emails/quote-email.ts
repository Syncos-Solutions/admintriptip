// src/emails/quote-email.ts
// Premium quote email — consistent with main site email style.
// Sent to customer when admin creates a quote.

interface QuoteEmailData {
  customerName:     string;
  bookingReference: string;
  bookingType:      string;
  currency:         string;
  amount:           number;
  confirmUrl:       string;
}

const typeLabel: Record<string, string> = {
  taxi:   'Taxi Transfer',
  tour:   'Tour Package',
  custom: 'Custom Tour',
};

export function quoteEmail(data: QuoteEmailData): string {
  const { customerName, bookingReference, bookingType, currency, amount, confirmUrl } = data;
  const formattedAmount = new Intl.NumberFormat('en-LK', {
    style: 'currency', currency, minimumFractionDigits: 2,
  }).format(amount);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Your Quote — Sri Lankan TripTip</title>
</head>
<body style="margin:0;padding:0;background:#F7F7F6;font-family:'DM Sans',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F7F6;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

        <!-- HEADER -->
        <tr>
          <td style="background:#0D0D0D;padding:32px 40px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background:linear-gradient(135deg,#5e17eb,#1800ad);width:28px;height:28px;text-align:center;vertical-align:middle;">
                        <span style="color:#fff;font-size:10px;font-weight:900;letter-spacing:0;">TT</span>
                      </td>
                      <td style="padding-left:10px;">
                        <p style="margin:0;color:#fff;font-size:13px;font-weight:700;letter-spacing:0.5px;">
                          Sri Lankan TripTip
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding-top:28px;">
                  <p style="margin:0;color:#5e17eb;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">
                    Your Quote is Ready
                  </p>
                  <h1 style="margin:8px 0 0;color:#fff;font-size:28px;font-weight:900;line-height:1.1;letter-spacing:-0.5px;">
                    We&rsquo;ve Prepared<br/>Your Journey Quote.
                  </h1>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ACCENT BAR -->
        <tr>
          <td style="height:3px;background:linear-gradient(to right,#5e17eb,#1800ad);"></td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="background:#fff;padding:36px 40px;">

            <p style="margin:0 0 20px;color:#444;font-size:14px;line-height:1.7;">
              Dear <strong style="color:#111;">${customerName}</strong>,
            </p>
            <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.7;">
              Thank you for choosing Sri Lankan TripTip. We have reviewed your
              <strong style="color:#111;">${typeLabel[bookingType] || bookingType}</strong> request
              and prepared a personalised quote for your journey.
            </p>

            <!-- Reference -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="border:1px solid #E8E4DF;margin-bottom:28px;">
              <tr>
                <td style="padding:16px 20px;background:#F7F7F6;border-bottom:1px solid #E8E4DF;">
                  <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#888;">
                    Booking Reference
                  </p>
                  <p style="margin:4px 0 0;font-size:16px;font-weight:900;color:#111;letter-spacing:1px;font-family:monospace;">
                    ${bookingReference}
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#888;">
                    Quoted Amount
                  </p>
                  <p style="margin:4px 0 0;font-size:28px;font-weight:900;color:#111;line-height:1;">
                    ${formattedAmount}
                  </p>
                  <p style="margin:4px 0 0;font-size:12px;color:#888;">
                    ${typeLabel[bookingType] || bookingType}
                  </p>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 20px;color:#555;font-size:14px;line-height:1.7;">
              Please review the details and confirm your quote using the button below.
              Once confirmed, our team will proceed with your booking arrangements.
            </p>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:linear-gradient(135deg,#5e17eb,#1800ad);">
                  <a href="${confirmUrl}"
                    style="display:block;padding:14px 36px;color:#fff;font-size:13px;font-weight:700;text-decoration:none;letter-spacing:1px;text-transform:uppercase;">
                    View &amp; Confirm Quote →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px;font-size:12px;color:#888;line-height:1.6;">
              If the button doesn&rsquo;t work, copy and paste this link into your browser:
            </p>
            <p style="margin:0 0 28px;font-size:11px;color:#5e17eb;word-break:break-all;">
              <a href="${confirmUrl}" style="color:#5e17eb;">${confirmUrl}</a>
            </p>

            <table width="100%" cellpadding="0" cellspacing="0"
              style="border-left:2px solid #5e17eb;padding-left:16px;margin-bottom:28px;">
              <tr>
                <td>
                  <p style="margin:0;font-size:12px;color:#555;line-height:1.7;">
                    <strong style="color:#111;">Please note:</strong> This quote is based on your submitted
                    requirements. Confirming this quote means you agree to proceed at the quoted price.
                    Our team will be in touch with next steps after confirmation.
                  </p>
                </td>
              </tr>
            </table>

            <p style="margin:0;color:#555;font-size:14px;line-height:1.7;">
              Questions? Reply to this email or contact us at
              <a href="mailto:srilankantriptip@gmail.com" style="color:#5e17eb;text-decoration:none;">
                srilankantriptip@gmail.com
              </a>
            </p>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#0D0D0D;padding:24px 40px;">
            <p style="margin:0;color:rgba(255,255,255,0.3);font-size:11px;">
              Sri Lankan TripTip &nbsp;·&nbsp; srilankantriptip.com
            </p>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.15);font-size:10px;">
              This email was sent regarding booking ${bookingReference}.
              Please do not reply if you did not request this quote.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
