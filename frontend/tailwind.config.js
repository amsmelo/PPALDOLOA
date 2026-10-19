/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          50: "#f0f5ff",
          100: "#e0ebff",
          200: "#c7d9fe",
          300: "#a4bcfd",
          400: "#7a96f9",
          500: "#546ef3",
          600: "#364be7",
          700: "#2b3ad4",
          800: "#2631ab",
          900: "#242e87",
          950: "#171c52",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
