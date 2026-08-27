/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#1B2430",
        navyDeep: "#151C26",
        paper: "#F3EEE2",
        paperDark: "#E8E0CC",
        paperDark2: "#C9BFA3",
        paperDark3: "#8C8471",
        ink: "#2A2016",
        brass: "#C9A227",
        teal: "#2A6F77",
        tealDark: "#1E4F55",
        rust: "#B5533C",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        sans: ["IBM Plex Sans", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
