// src/types/index.ts

export type BookingStatus =
  | 'new' | 'under_review' | 'quote_sent' | 'quote_accepted'
  | 'payment_pending' | 'partially_paid' | 'paid'
  | 'in_progress' | 'completed' | 'cancelled';

export type QuoteStatus   = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';
export type PaymentType   = 'full' | 'deposit' | 'partial';
export type BookingType   = 'taxi' | 'tour' | 'custom';
export type BlogStatus    = 'draft' | 'published' | 'archived';

export interface TaxiBooking {
  id: string; created_at: string; updated_at: string;
  booking_reference: string; salutation: string | null;
  full_name: string; email: string; phone: string;
  preferred_contact: string | null; vehicle_preference: string | null;
  pickup_location: string; pickup_datetime: string | null;
  destination: string; adults: number; children: number;
  luggage_type: string | null; additional_notes: string | null;
  status: BookingStatus; admin_notes: string | null;
  viewed_at: string | null; quote_status: string | null;
  latest_quote_amount: number | null; latest_quote_currency: string | null;
  payment_status: string | null; total_paid_amount: number | null;
}

export interface TourBooking {
  id: string; created_at: string; updated_at: string;
  booking_reference: string; salutation: string | null;
  full_name: string; email: string; phone: string;
  preferred_contact: string | null;
  tour_name: string; tour_slug: string | null;
  tour_category: string | null; tour_duration: string | null;
  tour_price_display: string | null;
  pickup_location: string; preferred_start_date: string | null;
  adults: number; children: number; luggage_type: string | null;
  additional_notes: string | null; status: BookingStatus;
  admin_notes: string | null; viewed_at: string | null;
  quote_status: string | null; latest_quote_amount: number | null;
  latest_quote_currency: string | null; payment_status: string | null;
  total_paid_amount: number | null;
}

export interface DayPlan {
  day: number; destination: string; activities: string;
  accommodation: string; notes: string;
}

export interface CustomBooking {
  id: string; created_at: string; updated_at: string;
  booking_reference: string; salutation: string | null;
  first_name: string; last_name: string; email: string; phone: string;
  contact_method: string | null; pickup_location: string;
  start_date: string | null; adults: number; children: number;
  luggage_type: string | null; day_plans: DayPlan[];
  total_days: number; additional_notes: string | null;
  status: BookingStatus; admin_notes: string | null;
  assigned_architect: string | null; viewed_at: string | null;
  quote_status: string | null; latest_quote_amount: number | null;
  latest_quote_currency: string | null; payment_status: string | null;
  total_paid_amount: number | null;
}

export interface BookingQuote {
  id: string; created_at: string; updated_at: string;
  booking_type: BookingType; booking_id: string;
  booking_reference: string | null; currency: string; amount: number;
  status: QuoteStatus; sent_at: string | null; accepted_at: string | null;
  expires_at: string | null; confirmation_token: string | null;
  customer_email: string; customer_name: string; notes_admin: string | null;
}

export interface BookingPayment {
  id: string; created_at: string; updated_at: string;
  booking_type: BookingType; booking_id: string;
  booking_reference: string | null; quote_id: string | null;
  currency: string; amount: number; payment_type: PaymentType;
  status: PaymentStatus; payhere_order_id: string | null;
  payhere_payment_id: string | null; payhere_raw: Record<string, unknown> | null;
  requested_at: string | null; paid_at: string | null;
  customer_email: string; customer_name: string;
  payment_link_token: string | null; notes_admin: string | null;
}

export interface AnyBookingRow {
  id: string; booking_reference: string; type: BookingType;
  customer_name: string; customer_email: string;
  created_at: string; travel_date: string | null;
  status: BookingStatus; quote_amount: number | null;
  quote_currency: string | null; payment_status: string | null;
  total_paid: number | null;
}

export interface ContentBlock {
  type: string; text?: string; src?: string; alt?: string; caption?: string;
  images?: { src: string; alt: string; caption?: string }[];
  heading?: string; items?: string[];
}

export interface BlogPost {
  id: string; created_at: string; updated_at: string;
  published_at: string | null; status: BlogStatus; featured: boolean;
  slug: string; meta_title: string | null; meta_description: string | null;
  category: string; title: string; subtitle: string | null;
  excerpt: string; read_time: string; hero_image: string;
  hero_image_alt: string | null; author: string;
  author_role: string | null; author_bio: string | null;
  author_initials: string | null; tags: string[];
  body_content: ContentBlock[];
  gallery_images: { src: string; alt: string; caption?: string }[];
  related_slugs: string[]; view_count: number;
}

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  new: 'New', under_review: 'Under Review', quote_sent: 'Quote Sent',
  quote_accepted: 'Quote Accepted', payment_pending: 'Payment Pending',
  partially_paid: 'Partially Paid', paid: 'Paid',
  in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled',
};

export const BOOKING_STATUS_COLOR: Record<BookingStatus, string> = {
  new:             'bg-[#F0EBFF] text-[#5e17eb] border border-[#5e17eb]/20',
  under_review:    'bg-blue-50 text-blue-700 border border-blue-200',
  quote_sent:      'bg-sky-50 text-sky-700 border border-sky-200',
  quote_accepted:  'bg-teal-50 text-teal-700 border border-teal-200',
  payment_pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  partially_paid:  'bg-violet-50 text-violet-700 border border-violet-200',
  paid:            'bg-emerald-50 text-emerald-700 border border-emerald-200',
  in_progress:     'bg-indigo-50 text-indigo-700 border border-indigo-200',
  completed:       'bg-gray-100 text-gray-600 border border-gray-200',
  cancelled:       'bg-red-50 text-red-700 border border-red-200',
};

export const QUOTE_STATUS_COLOR: Record<QuoteStatus, string> = {
  draft:    'bg-gray-100 text-gray-600 border border-gray-200',
  sent:     'bg-sky-50 text-sky-700 border border-sky-200',
  accepted: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border border-red-200',
  expired:  'bg-orange-50 text-orange-700 border border-orange-200',
};

export const PAYMENT_STATUS_COLOR: Record<PaymentStatus, string> = {
  pending:  'bg-amber-50 text-amber-700 border border-amber-200',
  paid:     'bg-emerald-50 text-emerald-700 border border-emerald-200',
  failed:   'bg-red-50 text-red-700 border border-red-200',
  cancelled:'bg-gray-100 text-gray-600 border border-gray-200',
  refunded: 'bg-violet-50 text-violet-700 border border-violet-200',
};

export const BOOKING_STATUS_FLOW: BookingStatus[] = [
  'new', 'under_review', 'quote_sent', 'quote_accepted',
  'payment_pending', 'partially_paid', 'paid',
  'in_progress', 'completed', 'cancelled',
];
