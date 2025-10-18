/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#706D54",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#A08963",
          foreground: "#FFFFFF",
        },
        success: {
          DEFAULT: "#706D54",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#C9B194",
          foreground: "#706D54",
        },
        accent: {
          DEFAULT: "#C9B194",
          foreground: "#706D54",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#706D54",
        },
        border: "#C9B194",
        input: "#C9B194",
        ring: "#706D54",
        background: "#DBDBDB",
        foreground: "#706D54",
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#FFFFFF",
        },
        chart: {
          "1": "#706D54",
          "2": "#A08963",
          "3": "#C9B194",
          "4": "#DBDBDB",
          "5": "#9ca3af",
        },
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #706D54 0%, #A08963 100%)",
        "gradient-secondary": "linear-gradient(135deg, #A08963 0%, #C9B194 100%)",
        "gradient-accent": "linear-gradient(135deg, #C9B194 0%, #DBDBDB 100%)",
      },
      borderRadius: {
        lg: "0.75rem",
        md: "calc(0.75rem - 2px)",
        sm: "calc(0.75rem - 4px)",
      },
    },
  },
  plugins: [],
};
