import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#6d28d9',
          fg: '#ede9fe'
        }
      }
    },
  },
  plugins: [],
} satisfies Config

