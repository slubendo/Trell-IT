/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,tsx}"],
    safelist: [
    'border-blue-300',
    'border-red-300',
    'border-green-300',
    'border-purple-300',
  ],
  theme: {
    extend: {},
  },
  plugins: [('@tailwindcss/typography')],
}

