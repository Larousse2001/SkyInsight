import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand palette
        //   sand   #EFD2B0   gold   #FFC570
        //   steel  #547792   navy   #1A3263
        brand: {
          50:  "#FBF4E8",
          100: "#EFD2B0",
          200: "#F6DEC2",
          300: "#FFD693",
          400: "#FFCD82",
          500: "#FFC570", // primary accent
          600: "#547792", // secondary steel
          700: "#3F5E78",
          800: "#28456A",
          900: "#1A3263", // deep navy
        },
        sand:  "#EFD2B0",
        gold:  "#FFC570",
        steel: "#547792",
        navy:  "#1A3263",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["'Plus Jakarta Sans'", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 10px 30px -10px rgba(26,50,99,0.35)",
        soft: "0 4px 14px rgba(26,50,99,0.08)",
      },
      backgroundImage: {
        "hero-grad": "linear-gradient(135deg,#1A3263 0%,#547792 50%,#FFC570 100%)",
        "navy-grad": "linear-gradient(135deg,#1A3263 0%,#28456A 100%)",
        "gold-grad": "linear-gradient(135deg,#FFC570 0%,#EFD2B0 100%)",
      },
    },
  },
  plugins: [],
} satisfies Config;
