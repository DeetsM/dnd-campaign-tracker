/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Add any custom theme extensions here
      colors: {
        primary: {
          light: '#42a5f5',
          main: '#1976d2',
          dark: '#1565c0',
        },
        secondary: {
          light: '#ba68c8',
          main: '#9c27b0',
          dark: '#7b1fa2',
        },
      },
    },
  },
  corePlugins: {
    // Disable Tailwind's preflight as it can conflict with Material-UI
    preflight: false,
  },
  important: '#root', // This helps with specificity without conflicting with Material-UI
  plugins: [],
}