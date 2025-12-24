/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Orbitron", "sans-serif"],
        sans: ["Space Grotesk", "sans-serif"],
      },
    },
  },
  plugins: [],
};
