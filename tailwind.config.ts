import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f4f9f2",
          100: "#e7f3e1",
          200: "#cfe7c5",
          300: "#afd79f",
          400: "#82c06f",
          500: "#5ea24c",
          600: "#468437",
          700: "#386930",
          800: "#2f542a",
          900: "#284726"
        }
      }
    }
  },
  plugins: []
};

export default config;
