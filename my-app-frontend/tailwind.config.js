/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,tsx}"],
    safelist: [
    'border-blue-300',
    'border-red-300',
    'border-green-300',
    'border-purple-300',
    'text-blue-500',
    'text-red-500',
    'text-green-500',
    'text-purple-500',
    'bg-blue-100',
    'bg-red-100',
    'bg-green-100',
    'bg-purple-100',

  ],
  theme: {
    extend: {},
  },
  plugins: [('@tailwindcss/typography')],
}

