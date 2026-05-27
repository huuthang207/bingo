import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pixel: {
          ink: "#17142f",
          night: "#241b5a",
          panel: "#2f2470",
          cream: "#fff7d6",
          paper: "#fffdf2",
          cyan: "#38f8ff",
          blue: "#6ea8ff",
          gold: "#ffe45c",
          pink: "#ff6fb1",
          green: "#7dff9b",
          orange: "#ffad4d",
          muted: "#d8d4ff",
        },
      },
      fontFamily: {
        pixel: ["var(--font-pixel)", "monospace"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        pixel: "6px 6px 0 #10101f",
        "pixel-lg": "10px 10px 0 #10101f",
        "pixel-cyan": "6px 6px 0 #5eead4",
        "pixel-gold": "6px 6px 0 #facc15",
        "pixel-pink": "6px 6px 0 #fb7185",
      },
      borderRadius: {
        pixel: "0.375rem",
      },
    },
  },
  plugins: [],
};

export default config;
