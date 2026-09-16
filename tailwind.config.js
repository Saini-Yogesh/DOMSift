/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/popup/**/*.{html,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#e0e9fe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#0f172a',
        }
      }
    },
  },
  plugins: [],
}
