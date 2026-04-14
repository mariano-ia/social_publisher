import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Figtree", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Antonio", "sans-serif"],
        body: ["Figtree", "sans-serif"],
        supporting: ["Inter", "sans-serif"],
      },
      colors: {
        // Yacaré
        yc: {
          bg: "#000000",
          surface: "#0a0a0a",
          accent: "#8A5EFF",
          "accent-light": "#BCA3FF",
          "accent-dark": "#6D28D9",
        },
        // Argo
        ar: {
          bg: "#1D1D1F",
          amber: "#E8943A",
          purple: "#955FB5",
          gray: "#86868B",
        },
      },
    },
  },
  plugins: [],
};

export default config;
