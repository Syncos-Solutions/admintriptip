/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Vercel to correctly generate all dynamic routes
  output: undefined, // 'standalone' only if self-hosting — leave undefined for Vercel

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },

  // Silence the Supabase SSR cookie warnings in build output
  logging: {
    fetches: { fullUrl: false },
  },
};

module.exports = nextConfig;