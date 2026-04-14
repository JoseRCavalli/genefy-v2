/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'blue-dark': '#1B3A5C',
        'blue-mid': '#2E6DA4',
        gold: '#C9A84C',
        'green-farm': '#1E7E34',
        'red-farm': '#C0392B',
        'orange-farm': '#E67E22',
      },
    },
  },
  plugins: [],
};
