// src/app/page.tsx
// Root: redirect to dashboard (middleware already handles auth)
import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/dashboard');
}
