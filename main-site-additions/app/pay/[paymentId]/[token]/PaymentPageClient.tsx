'use client';
// main-site-additions/app/pay/[paymentId]/[token]/PaymentPageClient.tsx

import { useState, useEffect } from 'react';
import { CheckCircle, Lock, Shield } from 'lucide-react';

interface Props {
  payment:    Record<string, unknown>;
  booking:    Record<string, unknown> | null;
  merchantId: string;
  isSandbox:  boolean;
  completed?: boolean;
}

const typeLabel: Record<string, string> = {
  taxi: 'Taxi Transfer', tour: 'Tour Package', custom: 'Custom Tour',
};
const payTypeLabel: Record<string, string> = {
  full: 'Full Payment', deposit: 'Advance Deposit', partial: 'Partial Payment',
};

export default function PaymentPageClient({ payment, booking, merchantId, isSandbox, completed }: Props) {
  const [agreed,      setAgreed]      = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [hashData,    setHashData]    = useState<Record<string, string> | null>(null);
  const [hashLoading, setHashLoading] = useState(true);

  const formattedAmount = new Intl.NumberFormat('en-LK', {
    style: 'currency', currency: String(payment.currency || 'LKR'), minimumFractionDigits: 2,
  }).format(Number(payment.amount));

  const payhereUrl = isSandbox
    ? 'https://sandbox.payhere.lk/pay/checkout'
    : 'https://www.payhere.lk/pay/checkout';

  useEffect(() => {
    if (completed) { setHashLoading(false); return; }
    fetch('/api/payhere/checkout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId:  String(payment.payhere_order_id || payment.id),
        amount:   Number(payment.amount),
        currency: String(payment.currency || 'LKR'),
      }),
    })
      .then(r => r.json())
      .then(data => { if (data.hash) setHashData(data); })
      .catch(console.error)
      .finally(() => setHashLoading(false));
  }, []);

  if (completed) {
    return (
      <div style={{ minHeight:'100vh', background:'#F7F7F6', display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:'DM Sans, Arial, sans-serif' }}>
        <div style={{ maxWidth:440, width:'100%', background:'#fff', border:'1px solid #E8E4DF' }}>
          <div style={{ height:3, background: payment.status === 'paid' ? 'linear-gradient(to right,#059669,#0E7A45)' : '#E8E4DF' }} />
          <div style={{ padding:32, textAlign:'center' }}>
            <CheckCircle size={36} color="#059669" style={{ margin:'0 auto 16px' }} />
            <h2 style={{ fontFamily:'Georgia,serif', fontSize:20, margin:'0 0 12px', color:'#111' }}>
              {payment.status === 'paid' ? 'Payment Received' : 'Link No Longer Active'}
            </h2>
            <p style={{ fontSize:13, color:'#555', lineHeight:1.7, margin:0 }}>
              {payment.status === 'paid'
                ? `Your payment of ${formattedAmount} has been received. A confirmation email was sent.`
                : 'This payment link has already been used or cancelled.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:'100vh', background:'#F7F7F6', display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:'DM Sans, Arial, sans-serif' }}>
      <div style={{ maxWidth:520, width:'100%', background:'#fff', border:'1px solid #E8E4DF' }}>
        {/* Header */}
        <div style={{ background:'#0D0D0D', padding:'28px 32px 24px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
            <div style={{ width:26, height:26, display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#5e17eb,#1800ad)', color:'#fff', fontSize:9, fontWeight:900 }}>TT</div>
            <span style={{ color:'#fff', fontSize:12, fontWeight:700 }}>Sri Lankan TripTip</span>
          </div>
          <p style={{ color:'#5e17eb', fontSize:9, fontWeight:700, letterSpacing:'0.25em', textTransform:'uppercase', margin:'0 0 6px' }}>Secure Payment</p>
          <h1 style={{ color:'#fff', fontSize:22, fontWeight:900, margin:0, lineHeight:1.1 }}>Complete Your<br/>Booking Payment.</h1>
        </div>
        <div style={{ height:3, background:'linear-gradient(to right,#5e17eb,#1800ad)' }} />

        <div style={{ padding:32 }}>
          {/* Summary */}
          <div style={{ border:'1px solid #E8E4DF', marginBottom:20 }}>
            <div style={{ padding:'14px 20px', background:'#F7F7F6', borderBottom:'1px solid #E8E4DF' }}>
              <p style={{ margin:0, fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'#888' }}>Booking Reference</p>
              <p style={{ margin:'4px 0 0', fontFamily:'monospace', fontSize:14, fontWeight:900, color:'#111' }}>{String(payment.booking_reference || payment.booking_id)}</p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', padding:'14px 20px', gap:16, borderBottom:'1px solid #E8E4DF' }}>
              <div>
                <p style={{ margin:0, fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'#888' }}>Service</p>
                <p style={{ margin:'3px 0 0', fontSize:12, fontWeight:600, color:'#111' }}>{typeLabel[String(payment.booking_type)] || String(payment.booking_type)}</p>
              </div>
              <div>
                <p style={{ margin:0, fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'#888' }}>Payment Type</p>
                <p style={{ margin:'3px 0 0', fontSize:12, fontWeight:600, color:'#111' }}>{payTypeLabel[String(payment.payment_type)] || String(payment.payment_type)}</p>
              </div>
            </div>
            <div style={{ padding:'14px 20px', background:'#F9F8FF' }}>
              <p style={{ margin:0, fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'#888' }}>Amount to Pay</p>
              <p style={{ margin:'4px 0 0', fontFamily:'Georgia,serif', fontSize:28, fontWeight:900, color:'#111' }}>{formattedAmount}</p>
            </div>
          </div>

          {/* T&C */}
          <div style={{ border:'1px solid #E8E4DF', padding:16, marginBottom:20, background:'#FAFAFA' }}>
            <p style={{ margin:'0 0 8px', fontSize:12, fontWeight:700, color:'#111' }}>Terms & Conditions</p>
            <div style={{ fontSize:11, color:'#555', lineHeight:1.7, maxHeight:120, overflowY:'auto', marginBottom:12 }}>
              <p style={{ margin:'0 0 6px' }}>1. All bookings are subject to availability and confirmed upon receipt of payment.</p>
              <p style={{ margin:'0 0 6px' }}>2. Cancellations must be made in writing at least 72 hours before travel for a refund.</p>
              <p style={{ margin:'0 0 6px' }}>3. Sri Lankan TripTip may modify itineraries due to unforeseen circumstances.</p>
              <p style={{ margin:'0 0 6px' }}>4. Travel insurance is the sole responsibility of the traveller.</p>
              <p style={{ margin:'0 0 6px' }}>5. Payments are processed securely via PayHere. Card details are never stored by us.</p>
              <p style={{ margin:0 }}>6. By paying, you confirm all booking information provided is accurate.</p>
            </div>
            <label style={{ display:'flex', alignItems:'flex-start', gap:10, cursor:'pointer' }}>
              <div
                onClick={() => setAgreed(a => !a)}
                style={{
                  width:16, height:16, border:`1px solid ${agreed ? '#5e17eb' : '#D1D5DB'}`,
                  background: agreed ? 'linear-gradient(135deg,#5e17eb,#1800ad)' : '#fff',
                  flexShrink:0, marginTop:1, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
                }}
              >
                {agreed && (
                  <svg viewBox="0 0 10 8" width="9" height="9" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="square"/>
                  </svg>
                )}
              </div>
              <span style={{ fontSize:11, color:'#444', lineHeight:1.6 }} onClick={() => setAgreed(a => !a)}>
                I agree to the <strong style={{ color:'#5e17eb' }}>Terms & Conditions</strong> and confirm all booking details are correct.
              </span>
            </label>
          </div>

          {/* Security */}
          <div style={{ display:'flex', gap:16, marginBottom:16, fontSize:10, color:'#888', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              <Lock size={11} color="#5e17eb" /><span>SSL Secured</span>
            </div>
            <span>·</span>
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              <Shield size={11} color="#5e17eb" /><span>Powered by PayHere</span>
            </div>
            {isSandbox && <><span>·</span><span style={{ color:'#D97706', fontWeight:600 }}>⚠ Sandbox Mode</span></>}
          </div>

          {/* PayHere form */}
          {!hashLoading && hashData ? (
            <form method="post" action={payhereUrl} onSubmit={() => setLoading(true)}>
              <input type="hidden" name="merchant_id"  value={merchantId} />
              <input type="hidden" name="return_url"   value={hashData.returnUrl} />
              <input type="hidden" name="cancel_url"   value={hashData.cancelUrl} />
              <input type="hidden" name="notify_url"   value={hashData.notifyUrl} />
              <input type="hidden" name="order_id"     value={String(payment.payhere_order_id || payment.id)} />
              <input type="hidden" name="items"        value={`Sri Lankan TripTip - ${typeLabel[String(payment.booking_type)] || 'Booking'} - ${String(payment.booking_reference || '')}`} />
              <input type="hidden" name="currency"     value={String(payment.currency || 'LKR')} />
              <input type="hidden" name="amount"       value={Number(payment.amount).toFixed(2)} />
              <input type="hidden" name="first_name"   value={String(payment.customer_name || '').split(' ')[0]} />
              <input type="hidden" name="last_name"    value={String(payment.customer_name || '').split(' ').slice(1).join(' ') || '-'} />
              <input type="hidden" name="email"        value={String(payment.customer_email || '')} />
              <input type="hidden" name="phone"        value="N/A" />
              <input type="hidden" name="address"      value="N/A" />
              <input type="hidden" name="city"         value="Colombo" />
              <input type="hidden" name="country"      value="Sri Lanka" />
              <input type="hidden" name="hash"         value={hashData.hash} />
              <button
                type="submit"
                disabled={!agreed || loading}
                style={{
                  width:'100%', padding:'14px', color:'#fff', fontSize:13,
                  fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase',
                  border:'none', cursor: agreed && !loading ? 'pointer' : 'not-allowed',
                  background: agreed && !loading ? 'linear-gradient(135deg,#5e17eb,#1800ad)' : '#D1D5DB',
                  opacity: (!agreed || loading) ? 0.6 : 1,
                }}
              >
                {loading ? 'Redirecting to PayHere…' : agreed ? `Pay Now — ${formattedAmount} →` : 'Accept Terms to Continue'}
              </button>
            </form>
          ) : (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'16px', color:'#888', fontSize:13 }}>
              <div style={{ width:16, height:16, border:'2px solid #5e17eb', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
              Preparing secure payment…
            </div>
          )}

          <p style={{ textAlign:'center', fontSize:11, color:'#888', marginTop:16 }}>
            Questions? <a href="mailto:srilankantriptip@gmail.com" style={{ color:'#5e17eb' }}>srilankantriptip@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
