import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // SLOTY カラーパレット
        primary: {
          50: "#F5F3FF",
          100: "#EDE9FE",
          200: "#DDD6FE",
          300: "#C4B5FD",
          400: "#A78BFA", // ダークモードアクセント
          500: "#8B5CF6", // ライトモードアクセント
          600: "#7C3AED", // ホバー
          700: "#6D28D9",
          800: "#5B21B6",
          900: "#4C1D95",
        },
        surface: {
          light: "#FFFFFF",
          "light-card": "#F8F8FC",
          dark: "#1A1A2E",
          "dark-card": "#252540",
        },
        text: {
          primary: {
            light: "#1A1A2E",
            dark: "#F0F0F5",
          },
          secondary: {
            light: "#6B7280",
            dark: "#9CA3AF",
          },
        },
      },
      fontFamily: {
        sans: [
          "Hiragino Sans",
          "Hiragino Kaku Gothic ProN",
          "Noto Sans JP",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
export default config;
