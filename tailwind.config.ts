import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      borderRadius: {
        none: '0',
        sm:   '0',
        DEFAULT: '0',
        md:   '0',
        lg:   '0',
        xl:   '0',
        '2xl':'0',
        '3xl':'0',
        full: '9999px', // only for pill badges when explicitly used
      },
      colors: {
        brand: {
          purple: '#5e17eb',
          deep:   '#1800ad',
          light:  '#f0ebff',
        },
        admin: {
          bg:       '#F7F7F6',
          sidebar:  '#0D0D0D',
          card:     '#FFFFFF',
          border:   '#E8E4DF',
          hover:    '#F2F0ED',
          muted:    '#F4F4F4',
        },
        ink: {
          primary:   '#111111',
          secondary: '#444444',
          muted:     '#888888',
          faint:     '#BBBBBB',
        },
        status: {
          new:        '#5e17eb',
          review:     '#1800ad',
          sent:       '#0077CC',
          accepted:   '#0E7A45',
          pending:    '#D97706',
          paid:       '#059669',
          partial:    '#7C3AED',
          completed:  '#374151',
          cancelled:  '#DC2626',
          draft:      '#9CA3AF',
          failed:     '#DC2626',
        },
      },
      fontFamily: {
        syne:    ['Syne', 'sans-serif'],
        sans:    ['DM Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        modal:'0 20px 60px rgba(0,0,0,0.15)',
        dropdown: '0 4px 20px rgba(0,0,0,0.10)',
      },
    },
  },
  plugins: [],
};

export default config;
