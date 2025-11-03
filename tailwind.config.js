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
          DEFAULT: "#1B3C53",
          foreground: "#B6FFF9",
        },
        secondary: {
          DEFAULT: "#234C6A",
          foreground: "#B6FFF9",
        },
        success: {
          DEFAULT: "#456882",
          foreground: "#B6FFF9",
        },
        muted: {
          DEFAULT: "#D2C1B6",
          foreground: "#B6FFF9",
        },
        accent: {
          DEFAULT: "#3E3F29",
          foreground: "#B6FFF9",
        },
        card: {
          DEFAULT: "#7D8D86",
          foreground: "#273952",
        },
        border: "#234C6A",
        input: "#3E3F29",
        ring: "#1B3C53",
        background: "#BCA88D",
        foreground: "#273952",
        destructive: {
          DEFAULT: "#F38C79",
          foreground: "#FFFFFF",
        },
        chart: {
          "1": "#1B3C53",
          "2": "#234C6A",
          "3": "#456882",
          "4": "#D2C1B6",
          "5": "#3E3F29",
        },
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #1B3C53 0%, #234C6A 100%)",
        "gradient-secondary": "linear-gradient(135deg, #234C6A 0%, #456882 100%)",
        "gradient-accent": "linear-gradient(135deg, #456882 0%, #7D8D86 100%)",
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
