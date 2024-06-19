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
      backgroundImage: {
        'trending' : "url('./src/assets/thumbnails/beyond-earth/trending/large.jpg')"
      },
      colors:{
        // "orange": "#fc4747",
        // "vulcan": "#10141e",
        // "gray": "#5a69af",
        // "mirage": "#161d2f",
        "white": "#ffffff",
        "red": "#fc4747",
        "dark-blue": "#10141e",
        "greyish-blue": "#5a69af",
        "semi-dark-blue": "#161d2f"
      },
      fontFamily: {
        "outfit": "'Outfit', sans-serif",
      },
    },
  },
  plugins: [],
}

