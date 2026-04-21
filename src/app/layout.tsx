// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title:       { default: 'Admin — Sri Lankan TripTip', template: '%s | TripTip Admin' },
  description: 'Admin panel for Sri Lankan TripTip.',
  robots:      { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
