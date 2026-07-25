import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ko: {
          ink: "#0A1F2B",
          field: "#0F4C3A",
          fieldLight: "#166F52",
          whistle: "#F2A93B",
          line: "#F7F5EF",
          alert: "#C24A3B",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  plugins: [],
};
export default config;
