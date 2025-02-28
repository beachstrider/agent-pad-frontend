import {nextui} from '@nextui-org/theme';
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/components/progress.js"
  ],
  theme: {
    extend: {
      colors: () => ({
        primary: '#FECE00',
        title: '#FFFFFF',
        subtext: '#C4CBDBCC',
        grey: '#18181C',
        grey2: '#00000033',
        stroke: '#424242',
        stroke1: '#323138',
        back: '#0D0D0D',
        dark: '#0E0E11',
        red: '#FF4E4E'
      }),
      fontSize: {
        xs: ['12px', '16px'],
        sm: ['14px', '21px'],
        base: ['16px', '24px'],
        medium: ['18px', '27px'],
        md: ['20px', '30px'],
        lg: ['28px', '33.6px'],
        xl: ['40px', '60px'],
        '2xl': ['82px', '82px'],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      animation: {
        crawl: 'crawl 20s linear infinite',
        'loading-bar': 'loading-bar 1.5s ease-in-out infinite',
      },
      keyframes: {
        crawl: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'loading-bar': {
          '0%': { transform: 'translateX(-100%)' },
          '50%': { transform: 'translateX(250%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
    },
  },
  plugins: [nextui()],
};

export default config;