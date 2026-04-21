// src/lib/utils.ts

import type { BookingType } from '@/types';

// ── Dates ─────────────────────────────────────────────────────
export function formatDate(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
}

export function formatDateTime(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', {
    year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit',
  });
}

export function formatRelativeTime(d: string): string {
  const diff  = Date.now() - new Date(d).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  <  2) return 'Just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  <  7) return `${days}d ago`;
  return formatDate(d);
}

// ── Currency ──────────────────────────────────────────────────
export function formatCurrency(amount: number, currency = 'LKR'): string {
  return new Intl.NumberFormat('en-LK', {
    style:'currency', currency, minimumFractionDigits:2, maximumFractionDigits:2,
  }).format(amount);
}

// ── Tokens ────────────────────────────────────────────────────
export function generateSecureToken(length = 40): string {
  const crypto = require('crypto');
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

// ── Booking helpers ───────────────────────────────────────────
export function bookingTypeLabel(type: BookingType): string {
  return { taxi:'Taxi', tour:'Tour', custom:'Custom Planning' }[type];
}

export function bookingTypeBadgeClass(type: BookingType): string {
  return {
    taxi:   'bg-sky-50 text-sky-700 border border-sky-200',
    tour:   'bg-violet-50 text-violet-700 border border-violet-200',
    custom: 'bg-amber-50 text-amber-700 border border-amber-200',
  }[type];
}

export function getCustomerName(b: Record<string, unknown>): string {
  if (b.full_name) return String(b.full_name);
  return `${b.first_name || ''} ${b.last_name || ''}`.trim();
}

export function getCustomerInitials(name: string): string {
  return name.split(' ').map(n => n[0] || '').join('').toUpperCase().slice(0, 2);
}

// ── Class merge ───────────────────────────────────────────────
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ── PayHere hash (server-only) ────────────────────────────────
export async function generatePayHereHash(
  merchantId: string, orderId: string,
  amount: number, currency: string, merchantSecret: string,
): Promise<string> {
  const crypto = require('crypto');
  const secretHash = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
  const raw = `${merchantId}${orderId}${amount.toFixed(2)}${currency}${secretHash}`;
  return crypto.createHash('md5').update(raw).digest('hex').toUpperCase();
}

export function verifyPayHereHash(
  merchantId: string, orderId: string, amount: string,
  currency: string, statusCode: string, merchantSecret: string, received: string,
): boolean {
  const crypto = require('crypto');
  const secretHash = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
  const raw   = `${merchantId}${orderId}${amount}${currency}${statusCode}${secretHash}`;
  const local = crypto.createHash('md5').update(raw).digest('hex').toUpperCase();
  return local === received.toUpperCase();
}
