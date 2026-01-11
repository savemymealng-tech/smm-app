/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        border: "hsl(0 0% 90%)",
        input: "hsl(0 0% 90%)",
        ring: "hsl(0 0% 90%)",
        background: "hsl(0 0% 100%)",
        foreground: "hsl(0 0% 10%)",
        primary: {
          DEFAULT: "#15785B",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "hsl(0 0% 96%)",
          foreground: "hsl(0 0% 10%)",
        },
        destructive: {
          DEFAULT: "hsl(0 84% 60%)",
          foreground: "hsl(0 0% 100%)",
        },
        muted: {
          DEFAULT: "hsl(0 0% 96%)",
          foreground: "hsl(0 0% 40%)",
        },
        accent: {
          DEFAULT: "hsl(0 0% 96%)",
          foreground: "hsl(0 0% 10%)",
        },
        popover: {
          DEFAULT: "hsl(0 0% 100%)",
          foreground: "hsl(0 0% 10%)",
        },
        card: {
          DEFAULT: "hsl(0 0% 100%)",
          foreground: "hsl(0 0% 10%)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}

