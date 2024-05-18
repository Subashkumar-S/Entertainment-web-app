/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        sm: '480px',
        md: '768px',
        lg: '976px',
        xl: '1440px',
      },
      colors:{
        "orange": "#fc4747",
        "vulcan": "#10141e",
        "gray": "#5a69af",
        "mirage": "#161d2f",
        "white": "#ffffff" 
      },
      fontFamily: {
        "outfit": "'Outfit', sans-serif",
      },
    },
  },
  plugins: [],
}

