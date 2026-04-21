// src/components/ui/index.tsx
// All primitive UI components used across the admin panel.

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

// ── Spinner ────────────────────────────────────────────────────
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }[size];
  return <Loader2 className={`${s} animate-spin text-[#5e17eb]`} />;
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="md" />
    </div>
  );
}

// ── Status Badge ───────────────────────────────────────────────
interface BadgeProps {
  label:     string;
  className?: string;
  dot?:      boolean;
}
export function Badge({ label, className = '', dot }: BadgeProps) {
  return (
    <span className={cn('status-badge', className)}>
      {dot && <span className="w-1.5 h-1.5 bg-current opacity-70 mr-1.5 inline-block" />}
      {label}
    </span>
  );
}

// ── New indicator dot ──────────────────────────────────────────
export function NewDot() {
  return (
    <span
      className="inline-flex w-2 h-2 pulse-ring"
      style={{ background: '#5e17eb' }}
      title="New — not yet reviewed"
    />
  );
}

// ── Button ─────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?:    'sm' | 'md' | 'lg';
  loading?: boolean;
}
export function Button({
  variant = 'primary',
  size    = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold transition-all tracking-[0.04em] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = {
    sm: 'text-xs px-3 py-2',
    md: 'text-sm px-4 py-2.5',
    lg: 'text-sm px-6 py-3',
  };
  const variants = {
    primary:   'text-white',
    secondary: 'bg-white border border-[#E8E4DF] text-[#111] hover:bg-[#F4F4F4]',
    danger:    'bg-red-600 text-white hover:bg-red-700',
    ghost:     'text-[#5e17eb] hover:bg-[#F0EBFF]',
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(base, sizes[size], variants[variant], className)}
      style={variant === 'primary' ? { background: 'linear-gradient(135deg,#5e17eb,#1800ad)', ...props.style } : props.style}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}

// ── Card ───────────────────────────────────────────────────────
interface CardProps {
  children:   React.ReactNode;
  className?: string;
  padding?:   boolean;
}
export function Card({ children, className = '', padding = true }: CardProps) {
  return (
    <div className={cn('bg-white border border-[#E8E4DF] shadow-card', padding && 'p-5', className)}>
      {children}
    </div>
  );
}

// ── Section header inside a card ──────────────────────────────
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#888] mb-3">
      {children}
    </p>
  );
}

// ── Page header bar ────────────────────────────────────────────
interface PageHeaderProps {
  title:     string;
  subtitle?: string;
  actions?:  React.ReactNode;
}
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="px-6 py-5 bg-white border-b border-[#E8E4DF] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-[3px] h-5" style={{ background: 'linear-gradient(to bottom,#5e17eb,#1800ad)' }} />
          <h1 className="font-syne font-bold text-[17px] text-[#111] tracking-tight">{title}</h1>
        </div>
        {subtitle && <p className="text-xs text-[#888] ml-[15px]">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 ml-[15px] sm:ml-0">{actions}</div>}
    </div>
  );
}

// ── Stat card (Dashboard KPI) ─────────────────────────────────
interface StatCardProps {
  label:     string;
  value:     string | number;
  sub?:      string;
  accent?:   boolean;
  icon?:     React.ReactNode;
  trend?:    { value: number; label: string };
}
export function StatCard({ label, value, sub, accent, icon, trend }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden">
      {accent && (
        <div
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{ background: 'linear-gradient(to right,#5e17eb,#1800ad)' }}
        />
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#888] mb-2">{label}</p>
          <p className="font-syne font-black text-2xl text-[#111] leading-none tracking-tight">
            {value}
          </p>
          {sub && <p className="text-xs text-[#888] mt-1.5 font-light">{sub}</p>}
          {trend && (
            <p className={`text-[11px] font-semibold mt-2 ${trend.value >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        {icon && (
          <div className="w-9 h-9 flex items-center justify-center flex-shrink-0" style={{ background: '#F0EBFF' }}>
            <span className="text-[#5e17eb]">{icon}</span>
          </div>
        )}
      </div>
    </Card>
  );
}

// ── Empty state ────────────────────────────────────────────────
export function EmptyState({ message = 'No records found.' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div
        className="w-10 h-10 flex items-center justify-center mb-4"
        style={{ background: '#F0EBFF' }}
      >
        <span className="text-[#5e17eb] text-lg">—</span>
      </div>
      <p className="text-sm text-[#888] font-light">{message}</p>
    </div>
  );
}

// ── Input + Label ──────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:    string;
  error?:    string;
  wrapClass?: string;
}
export function Input({ label, error, wrapClass = '', className = '', ...props }: InputProps) {
  return (
    <div className={wrapClass}>
      {label && (
        <label className="block text-[10px] font-bold tracking-[0.18em] uppercase text-[#888] mb-1.5">
          {label}
        </label>
      )}
      <input {...props} className={cn('admin-input', className)} />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

// ── Textarea ───────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}
export function Textarea({ label, className = '', ...props }: TextareaProps) {
  return (
    <div>
      {label && (
        <label className="block text-[10px] font-bold tracking-[0.18em] uppercase text-[#888] mb-1.5">
          {label}
        </label>
      )}
      <textarea {...props} className={cn('admin-input admin-textarea', className)} />
    </div>
  );
}

// ── Select ─────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?:   string;
  options:  { value: string; label: string }[];
}
export function Select({ label, options, className = '', ...props }: SelectProps) {
  return (
    <div>
      {label && (
        <label className="block text-[10px] font-bold tracking-[0.18em] uppercase text-[#888] mb-1.5">
          {label}
        </label>
      )}
      <select {...props} className={cn('admin-input admin-select', className)}>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────────
interface ModalProps {
  open:      boolean;
  onClose:   () => void;
  title:     string;
  children:  React.ReactNode;
  width?:    string;
}
export function Modal({ open, onClose, title, children, width = 'max-w-lg' }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className={cn('relative bg-white w-full shadow-modal animate-fade-in', width)}>
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E4DF]">
          <div className="flex items-center gap-3">
            <div className="w-[3px] h-5" style={{ background: 'linear-gradient(to bottom,#5e17eb,#1800ad)' }} />
            <h3 className="font-syne font-bold text-[15px] text-[#111]">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#888] hover:text-[#111] transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>
        {/* Modal body */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ── Confirm dialog ─────────────────────────────────────────────
interface ConfirmProps {
  open:    boolean;
  onClose: () => void;
  onConfirm: () => void;
  title:   string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
}
export function ConfirmDialog({
  open, onClose, onConfirm, title, message,
  confirmLabel = 'Confirm', loading = false,
}: ConfirmProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} width="max-w-sm">
      <p className="text-sm text-[#555] leading-relaxed mb-6">{message}</p>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}

// ── Tab bar ────────────────────────────────────────────────────
interface TabsProps<T extends string> {
  tabs:     { key: T; label: string; count?: number }[];
  active:   T;
  onChange: (key: T) => void;
}
export function Tabs<T extends string>({ tabs, active, onChange }: TabsProps<T>) {
  return (
    <div className="flex border-b border-[#E8E4DF] bg-white px-6 overflow-x-auto">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            'relative flex items-center gap-2 px-4 py-3 text-xs font-bold tracking-[0.08em] uppercase transition-colors whitespace-nowrap flex-shrink-0',
            active === tab.key ? 'text-[#5e17eb]' : 'text-[#888] hover:text-[#444]'
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={cn(
                'text-[10px] font-black px-1.5 py-0.5 min-w-[20px] text-center',
                active === tab.key
                  ? 'bg-[#F0EBFF] text-[#5e17eb]'
                  : 'bg-[#F4F4F4] text-[#888]'
              )}
            >
              {tab.count}
            </span>
          )}
          {active === tab.key && (
            <span
              className="absolute bottom-0 left-0 right-0 h-[2px]"
              style={{ background: 'linear-gradient(to right,#5e17eb,#1800ad)' }}
            />
          )}
        </button>
      ))}
    </div>
  );
}

// ── Filter bar ─────────────────────────────────────────────────
export function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-6 py-3 bg-white border-b border-[#E8E4DF] flex flex-wrap items-center gap-3">
      {children}
    </div>
  );
}

// ── Pagination ─────────────────────────────────────────────────
interface PaginationProps {
  page:     number;
  total:    number;
  pageSize: number;
  onChange: (p: number) => void;
}
export function Pagination({ page, total, pageSize, onChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-[#E8E4DF] bg-white">
      <p className="text-xs text-[#888]">{from}–{to} of {total}</p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="px-3 py-1.5 text-xs border border-[#E8E4DF] hover:bg-[#F4F4F4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ←
        </button>
        <span className="px-3 py-1.5 text-xs bg-[#F0EBFF] text-[#5e17eb] font-semibold">
          {page}
        </span>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 text-xs border border-[#E8E4DF] hover:bg-[#F4F4F4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          →
        </button>
      </div>
    </div>
  );
}
