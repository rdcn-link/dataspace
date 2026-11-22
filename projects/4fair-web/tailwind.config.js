/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Fira Sans"', '"Microsoft YaHei"', 'PingFang SC', 'sans-serif'],
        mono: ['"Fira Code"', 'ui-monospace', 'monospace']
      },
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a'
        },
        science: {
          teal: '#0891b2',
          ink: '#0f172a',
          muted: '#475569'
        }
      },
      boxShadow: {
        card: '0 1px 3px rgba(15, 23, 42, 0.08), 0 4px 12px rgba(30, 64, 175, 0.06)',
        'card-hover': '0 8px 24px rgba(30, 64, 175, 0.12)'
      }
    }
  },
  plugins: []
}
