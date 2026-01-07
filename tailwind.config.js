/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js}",
  ],
  theme: {
    extend: {
      colors: {
        // Consent Guardian Brand Colors
        'cg': {
          'primary': '#3b82f6',    // Blue
          'success': '#22c55e',    // Green
          'warning': '#eab308',    // Yellow
          'danger': '#ef4444',     // Red
        },
        // Dark Pattern Score Colors
        'score': {
          'safe': '#22c55e',       // 0-30
          'caution': '#eab308',    // 31-60
          'danger': '#ef4444',     // 61-100
        }
      },
      fontFamily: {
        // System Fonts - keine externen Requests
        'sans': [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          '"Noto Sans"',
          'sans-serif',
        ],
        'mono': [
          'ui-monospace',
          'SFMono-Regular',
          '"SF Mono"',
          'Menlo',
          'Consolas',
          '"Liberation Mono"',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
}
