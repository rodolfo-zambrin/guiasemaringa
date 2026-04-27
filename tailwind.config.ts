import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#040b16', // Deep space dark blue
        surface: 'rgba(11, 23, 39, 0.7)', // Glassmorphism base
        border: 'rgba(255, 255, 255, 0.08)', // Thinner, lighter borders
        'surface-2': 'rgba(20, 34, 53, 0.75)',
        'surface-solid': '#0B1727', // For elements needing solid backgrounds
        'active-bg': 'rgba(56, 189, 248, 0.12)', // Light blue tint
        'text-primary': '#F8FAFC',
        'text-secondary': '#94A3B8',
        'text-muted': '#64748B',
        accent: {
          DEFAULT: '#38BDF8', // Vibrante cyan/blue
          hover: '#0EA5E9',
          light: '#7DD3FC',
          glow: 'rgba(56, 189, 248, 0.5)',
        },
        info: {
          DEFAULT: '#38BDF8',
          light: '#7DD3FC',
          bg: 'rgba(56, 189, 248, 0.15)',
        },
        success: {
          DEFAULT: '#22C55E',
          light: '#4ADE80',
          bg: 'rgba(34, 197, 94, 0.15)',
        },
        danger: {
          DEFAULT: '#EF4444',
          light: '#F87171',
          bg: 'rgba(239, 68, 68, 0.15)',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FBBF24',
          bg: 'rgba(245, 158, 11, 0.15)',
        },
        meta: {
          DEFAULT: '#1877F2',
          light: '#3B82F6',
          bg: 'rgba(24, 119, 242, 0.15)',
        },
        google: {
          DEFAULT: '#34A853',
          light: '#4ADE80',
          bg: 'rgba(52, 168, 83, 0.15)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glow-accent': '0 0 15px rgba(56, 189, 248, 0.3)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        shimmer: 'shimmer 1.5s infinite linear',
        'float': 'float 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
