import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f7f7f4",
          100: "#ecebe4",
          200: "#d6d4c6",
          400: "#8a8779",
          600: "#5a5749",
          800: "#2a2823",
          900: "#181712",
        },
        accent: {
          DEFAULT: "#d4593a",
          soft: "#f4e4dc",
        },
        signal: {
          bull: "#2d6a4f",
          bear: "#a3301d",
          neutral: "#8a6d3b",
        },
      },
      fontFamily: {
        display: ['"Fraunces"', "serif"],
        sans: ['"Geist"', "ui-sans-serif", "system-ui"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      borderRadius: {
        none: "0",
        sm: "2px",
        DEFAULT: "4px",
        md: "6px",
      },
    },
  },
  plugins: [],
};

export default config;
