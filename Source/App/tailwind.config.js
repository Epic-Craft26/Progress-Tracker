/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EEF4FF",
          100: "#D9E5FF",
          200: "#B8D1FF",
          500: "#4880FF", // DashStack Primary Brand Blue
          600: "#386FE0",
          700: "#2557BE",
        },
        dash: {
          bg: "#F5F6FA",        // DashStack Main Background
          card: "#FFFFFF",      // Card Background
          sidebar: "#FFFFFF",   // Sidebar Background
          border: "#E0E0E0",    // Border separator
          textPrimary: "#202224", // Primary heading/text
          textSecondary: "#606060", // Muted text
          textMuted: "#888888",
        },
        status: {
          completed: "#00B69B", // DashStack Mint Green
          inProgress: "#4880FF",// Primary Blue
          pending: "#FF9F43",   // Amber / Warning
          delayed: "#EF3826",   // Red / Overdue
          notStarted: "#888888",
        }
      },
      borderRadius: {
        dash: "14px", // Signature DashStack card radius
        smDash: "8px",
      },
      boxShadow: {
        dashCard: "0px 4px 20px 0px rgba(0, 0, 0, 0.04)",
        dashHover: "0px 6px 24px 0px rgba(0, 0, 0, 0.08)",
      }
    },
  },
  plugins: [],
};
