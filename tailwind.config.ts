/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand coral — primary action color (pigeon beak/feet)
        brand: {
          50:  "#FDF0EB",
          100: "#F9D5C4",
          200: "#F5C4B0",
          300: "#F0A882",
          400: "#EC8A5E",
          500: "#E8734A",
          600: "#C5522E",
          700: "#A03A20",
          800: "#7A2A16",
          900: "#521C0E",
        },
        // Wing blue-grey — main UI color (sidebar, cards)
        wing: {
          50:  "#F0F3F8",
          100: "#D8E0ED",
          200: "#B8C4D8",
          300: "#95A8C4",
          400: "#7A8FB0",
          500: "#6B7FA3",
          600: "#4A5A7A",
          700: "#364466",
          800: "#243052",
          900: "#162040",
        },
        // Iridescent — neck feathers accent
        iridescent: {
          50:  "#F3F0F9",
          100: "#DDD6F0",
          200: "#C4BADB",
          300: "#A99DC7",
          400: "#9184B3",
          500: "#7C6E9E",
          600: "#5E5280",
          700: "#453C63",
          800: "#2E2845",
          900: "#1A1628",
        },
        // Forest green — kept for landing page hero/CTA sections
        forest: {
          50:  "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#2d6a4f",
          700: "#1a3d2b",
          800: "#0f2d1e",
          900: "#0a1f12",
        },
        // Surface warm grey — body feathers
        surface: {
          50:  "#F7F4EF",
          100: "#EDE8E0",
          200: "#DDD6CA",
          300: "#C4BAB0",
          400: "#A09488",
          500: "#7A7068",
          600: "#5C5450",
          700: "#403C38",
          800: "#2C2824",
          900: "#1A1614",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out forwards",
        "fade-in": "fade-in 0.3s ease-out forwards",
        shimmer: "shimmer 1.5s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};