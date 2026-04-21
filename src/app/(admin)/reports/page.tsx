'use client';
// src/app/(admin)/reports/page.tsx

import { useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import { PageHeader, Card, SectionLabel, Button } from '@/components/ui';
import { getSupabaseClient } from '@/lib/supabase-client';
import { formatDate, formatCurrency } from '@/lib/utils';
import { BOOKING_STATUS_LABEL, type BookingStatus } from '@/types';

// ── Local row types — explicit so TypeScript knows the shape ──
interface BookingReportRow {
  booking_reference: string;
  type:              string;
  full_name:         string;
  email:             string;
  created_at:        string;
  status:            string;
  latest_quote_amount:   number | null;
  latest_quote_currency: string | null;
  total_paid_amount:     number | null;
}

interface PaymentReportRow {
  id:                string;
  booking_reference: string | null;
  booking_id:        string;
  customer_name:     string;
  customer_email:    string;
  payment_type:      string;
  amount:            number;
  currency:          string;
  status:            string;
  paid_at:           string | null;
  created_at:        string;
}

interface ReportPreview {
  bookings: BookingReportRow[];
  payments: PaymentReportRow[];
}

export default function ReportsPage() {
  const [from,    setFrom]    = useState('');
  const [to,      setTo]      = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ReportPreview | null>(null);

  const loadPreview = async () => {
    if (!from || !to) return;
    setLoading(true);

    const sb      = getSupabaseClient();
    const fromISO = new Date(from).toISOString();
    const toISO   = new Date(new Date(to).setHours(23, 59, 59, 999)).toISOString();

    const COLS = 'booking_reference,email,created_at,status,latest_quote_amount,latest_quote_currency,total_paid_amount';

    const [taxi, tour, custom, pays] = await Promise.all([
      sb.from('taxi_bookings')
        .select(`${COLS},full_name`)
        .gte('created_at', fromISO).lte('created_at', toISO),

      sb.from('tour_bookings')
        .select(`${COLS},full_name`)
        .gte('created_at', fromISO).lte('created_at', toISO),

      sb.from('custom_tour_bookings')
        .select(`${COLS},first_name,last_name`)
        .gte('created_at', fromISO).lte('created_at', toISO),

      sb.from('booking_payments')
        .select('id,booking_reference,booking_id,customer_name,customer_email,payment_type,amount,currency,status,paid_at,created_at')
        .gte('created_at', fromISO).lte('created_at', toISO)
        .eq('status', 'paid'),
    ]);

    // Explicitly type each mapped row so created_at is visible
    const taxiRows: BookingReportRow[] = (taxi.data || []).map((b) => ({
      booking_reference:     String(b.booking_reference || ''),
      type:                  'Taxi',
      full_name:             String(b.full_name || ''),
      email:                 String(b.email || ''),
      created_at:            String(b.created_at),
      status:                String(b.status || ''),
      latest_quote_amount:   (b.latest_quote_amount as number | null) ?? null,
      latest_quote_currency: (b.latest_quote_currency as string | null) ?? null,
      total_paid_amount:     (b.total_paid_amount as number | null) ?? null,
    }));

    const tourRows: BookingReportRow[] = (tour.data || []).map((b) => ({
      booking_reference:     String(b.booking_reference || ''),
      type:                  'Tour',
      full_name:             String(b.full_name || ''),
      email:                 String(b.email || ''),
      created_at:            String(b.created_at),
      status:                String(b.status || ''),
      latest_quote_amount:   (b.latest_quote_amount as number | null) ?? null,
      latest_quote_currency: (b.latest_quote_currency as string | null) ?? null,
      total_paid_amount:     (b.total_paid_amount as number | null) ?? null,
    }));

    const customRows: BookingReportRow[] = (custom.data || []).map((b) => ({
      booking_reference:     String(b.booking_reference || ''),
      type:                  'Custom',
      full_name:             `${b.first_name || ''} ${b.last_name || ''}`.trim(),
      email:                 String(b.email || ''),
      created_at:            String(b.created_at),
      status:                String(b.status || ''),
      latest_quote_amount:   (b.latest_quote_amount as number | null) ?? null,
      latest_quote_currency: (b.latest_quote_currency as string | null) ?? null,
      total_paid_amount:     (b.total_paid_amount as number | null) ?? null,
    }));

    // Now TypeScript knows created_at exists — sort works cleanly
    const allBookings: BookingReportRow[] = [...taxiRows, ...tourRows, ...customRows]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const allPayments: PaymentReportRow[] = (pays.data || []).map((p) => ({
      id:                String(p.id),
      booking_reference: (p.booking_reference as string | null) ?? null,
      booking_id:        String(p.booking_id || ''),
      customer_name:     String(p.customer_name || ''),
      customer_email:    String(p.customer_email || ''),
      payment_type:      String(p.payment_type || ''),
      amount:            Number(p.amount),
      currency:          String(p.currency || 'LKR'),
      status:            String(p.status || ''),
      paid_at:           (p.paid_at as string | null) ?? null,
      created_at:        String(p.created_at),
    }));

    setPreview({ bookings: allBookings, payments: allPayments });
    setLoading(false);
  };

  const downloadPDF = async () => {
    if (!preview) return;
    setLoading(true);

    const { default: jsPDF }     = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc        = new jsPDF({ orientation: 'portrait', format: 'a4' });
    const totalPaid  = preview.payments.reduce((s, p) => s + p.amount, 0);

    // ── Header band ────────────────────────────────────────
    doc.setFillColor(13, 13, 13);
    doc.rect(0, 0, 210, 46, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Sri Lankan TripTip', 14, 18);
    doc.setFontSize(9);
    doc.setTextColor(160, 160, 160);
    doc.text('Booking & Revenue Report', 14, 26);
    doc.text(`Period: ${from}  →  ${to}`, 14, 33);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 40);

    // ── Summary KPIs ───────────────────────────────────────
    const kpiY = 54;
    const kpis = [
      { label: 'TOTAL BOOKINGS',  value: String(preview.bookings.length) },
      { label: 'PAYMENTS RECEIVED', value: String(preview.payments.length) },
      { label: 'TOTAL REVENUE (LKR)', value: formatCurrency(totalPaid, 'LKR') },
    ];
    kpis.forEach(({ label, value }, i) => {
      const x = 14 + i * 62;
      doc.setFillColor(240, 235, 255);
      doc.rect(x, kpiY, 58, 20, 'F');
      doc.setTextColor(130, 130, 130);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.text(label, x + 3, kpiY + 6);
      doc.setTextColor(30, 30, 30);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(value, x + 3, kpiY + 15);
    });

    // ── Bookings table ─────────────────────────────────────
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Booking Summary', 14, 86);

    autoTable(doc, {
      startY: 90,
      head:   [['Reference', 'Type', 'Customer', 'Date', 'Status', 'Quote']],
      body:   preview.bookings.map(b => [
        b.booking_reference,
        b.type,
        b.full_name || '—',
        formatDate(b.created_at),
        BOOKING_STATUS_LABEL[b.status as BookingStatus] || b.status,
        b.latest_quote_amount
          ? formatCurrency(b.latest_quote_amount, b.latest_quote_currency || 'LKR')
          : '—',
      ]),
      styles:             { fontSize: 8, cellPadding: 3 },
      headStyles:         { fillColor: [13, 13, 13], textColor: 255, fontSize: 7 },
      alternateRowStyles: { fillColor: [247, 247, 246] },
    });

    // ── Payments table ─────────────────────────────────────
    const lastY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Payment Summary', 14, lastY);

    autoTable(doc, {
      startY: lastY + 4,
      head:   [['Reference', 'Customer', 'Type', 'Amount', 'Currency', 'Paid At']],
      body:   preview.payments.map(p => [
        p.booking_reference || p.booking_id,
        p.customer_name,
        p.payment_type,
        String(p.amount),
        p.currency,
        formatDate(p.paid_at),
      ]),
      styles:             { fontSize: 8, cellPadding: 3 },
      headStyles:         { fillColor: [94, 23, 235], textColor: 255, fontSize: 7 },
      alternateRowStyles: { fillColor: [247, 247, 246] },
    });

    // ── Page footer ────────────────────────────────────────
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(180, 180, 180);
      doc.text(`Sri Lankan TripTip Admin  ·  Page ${i} of ${pages}`, 14, 290);
    }

    doc.save(`triptip-report-${from}-to-${to}.pdf`);
    setLoading(false);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Reports"
        subtitle="Generate time-based PDF reports for bookings and revenue"
      />

      <div className="p-6 max-w-3xl space-y-5">

        {/* ── Configuration card ──────────────────────────── */}
        <Card>
          <SectionLabel>Date Range</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-[#888] mb-1.5">
                From
              </label>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                className="admin-input" />
            </div>
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-[#888] mb-1.5">
                To
              </label>
              <input type="date" value={to} onChange={e => setTo(e.target.value)}
                className="admin-input" />
            </div>
          </div>

          {/* Quick range presets */}
          <div className="flex flex-wrap gap-2 mb-5">
            {[
              { label: 'Last 7 Days',  days: 7   },
              { label: 'Last 30 Days', days: 30  },
              { label: 'Last 3 Months', days: 90 },
              { label: 'This Year',    days: 365 },
            ].map(({ label, days }) => (
              <button
                key={label}
                onClick={() => {
                  const end   = new Date();
                  const start = new Date();
                  start.setDate(start.getDate() - days);
                  setTo(end.toISOString().split('T')[0]);
                  setFrom(start.toISOString().split('T')[0]);
                }}
                className="px-3 py-1.5 text-xs border border-[#E8E4DF] bg-white hover:bg-[#F4F4F4] font-medium transition-colors"
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={loadPreview}
              disabled={!from || !to || loading}
              loading={loading}
            >
              <FileText size={13} /> Preview Report
            </Button>
            {preview && (
              <Button onClick={downloadPDF} loading={loading}>
                <Download size={13} /> Download PDF
              </Button>
            )}
          </div>
        </Card>

        {/* ── Preview ──────────────────────────────────────── */}
        {preview && (
          <Card padding={false}>
            {/* Summary row */}
            <div className="px-5 py-4 border-b border-[#E8E4DF]">
              <SectionLabel>Preview — {from} to {to}</SectionLabel>
              <div className="flex gap-8 mt-2">
                {[
                  ['Bookings',  String(preview.bookings.length)],
                  ['Payments',  String(preview.payments.length)],
                  ['Revenue',   formatCurrency(
                    preview.payments.reduce((s, p) => s + p.amount, 0), 'LKR',
                  )],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-[#888]">{label}</p>
                    <p className="font-syne font-black text-xl text-[#111]">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bookings preview table */}
            {preview.bookings.length > 0 && (
              <div className="overflow-x-auto">
                <table className="admin-table w-full">
                  <thead>
                    <tr>
                      <th className="text-left">Reference</th>
                      <th className="text-left">Type</th>
                      <th className="text-left">Customer</th>
                      <th className="text-left">Date</th>
                      <th className="text-left">Status</th>
                      <th className="text-left">Quote</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.bookings.map(b => (
                      <tr key={b.booking_reference + b.type}>
                        <td className="font-mono text-[11px] font-bold text-[#5e17eb]">
                          {b.booking_reference}
                        </td>
                        <td className="text-xs">{b.type}</td>
                        <td className="text-xs">{b.full_name}</td>
                        <td className="text-xs text-[#888]">{formatDate(b.created_at)}</td>
                        <td className="text-xs text-[#555]">
                          {BOOKING_STATUS_LABEL[b.status as BookingStatus] || b.status}
                        </td>
                        <td className="text-xs font-semibold">
                          {b.latest_quote_amount
                            ? formatCurrency(b.latest_quote_amount, b.latest_quote_currency || 'LKR')
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}