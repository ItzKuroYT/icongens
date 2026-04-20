/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
    "./src/lib/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        panel: "#0a1b14",
        panelSoft: "#10261d",
        accent: "#55ef8b",
        accentAlt: "#f6be4a"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(85,239,139,0.2), 0 20px 50px rgba(0,0,0,0.4)",
        pulse: "0 0 0 1px rgba(246,190,74,0.35), 0 0 24px rgba(246,190,74,0.4)"
      }
    }
  },
  plugins: []
};
