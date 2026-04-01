import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0f0f13",
          card: "#18181f",
          border: "#27272e",
        },
      },
    },
  },
  plugins: [],
};

export default config;
