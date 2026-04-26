/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'tahoe-bg': '#f5f5f7',
        'tahoe-surface': '#ffffff',
        'tahoe-surface-elevated': '#fafafa',
        'tahoe-border': '#d1d1d6',
        'tahoe-text': '#1d1d1f',
        'tahoe-text-secondary': '#86868b',
        'tahoe-accent': '#007aff',
        'tahoe-accent-hover': '#0056b3',
        'tahoe-success': '#34c759',
        'tahoe-warning': '#ff9500',
        'tahoe-error': '#ff3b30',
        'lanelet-fill': 'rgba(74, 158, 255, 0.15)',
        'lanelet-stroke': '#4a9eff',
        'area-fill': 'rgba(0, 255, 0, 0.1)',
        'regulatory': '#ff9500',
        'selection': '#00d4ff',
      },
      fontFamily: {
        'sf': ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'tahoe': '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'tahoe-lg': '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)',
        'tahoe-panel': '0 4px 16px rgba(0, 0, 0, 0.08)',
      },
      backdropBlur: {
        'tahoe': '20px',
      },
      borderRadius: {
        'tahoe': '12px',
        'tahoe-lg': '16px',
      },
    },
  },
  plugins: [],
}
