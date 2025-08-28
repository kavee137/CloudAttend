/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.tsx", "./components/**/*.tsx"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#000000",
        secondary: "#6E62FF",
        accent: "#FFD700",
        background: "#F5F5F5",
        surface: "#FFFFFF",
        textPrimary: "#111827",
        textSecondary: "#6B7280",
        border: "#E5E7EB",
        success: "#22C55E",
        warning: "#F59E0B",
        error: "#EF4444",
      }
    },
  },
  plugins: [],
}