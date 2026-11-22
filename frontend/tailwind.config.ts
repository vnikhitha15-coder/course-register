import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F9F8F6',
        surface: '#FFFFFF',
        border: '#E6E2DA',
        'border-hover': '#D3CDC2',
        ink: {
          DEFAULT: '#1C1F26',
          muted: '#5A6270',
          light: '#8B93A0',
        },
        academic: {
          DEFAULT: '#1F5E4B',
          hover: '#17483A',
          surface: '#EDF4F1',
          light: '#2E7D65',
        },
        ochre: {
          DEFAULT: '#B45309',
          surface: '#FEF3C7',
          border: '#FDE68A',
        },
        crimson: {
          DEFAULT: '#B91C1C',
          surface: '#FEE2E2',
          border: '#FECACA',
        },
        sage: {
          DEFAULT: '#1F5E4B',
          surface: '#EDF4F1',
          border: '#D2E3DC',
        },
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(28, 31, 38, 0.05), 0 1px 2px -1px rgba(28, 31, 38, 0.05)',
        card: '0 2px 8px -2px rgba(28, 31, 38, 0.06), 0 1px 4px -1px rgba(28, 31, 38, 0.04)',
        elevated: '0 12px 32px -4px rgba(28, 31, 38, 0.12), 0 4px 12px -2px rgba(28, 31, 38, 0.06)',
      },
    },
  },
  plugins: [],
};

export default config;
