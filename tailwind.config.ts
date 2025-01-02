import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'

const config: Config = {
   darkMode: ['class'],
   mode: 'jit',
   content: [
      './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
      './src/components/**/*.{js,ts,jsx,tsx,mdx}',
      './src/app/**/*.{js,ts,jsx,tsx,mdx}',
      './src/features/**/*.{js,ts,jsx,tsx,mdx}'
   ],
   theme: {
      extend: {
         container: {
            center: true,
            padding: '1rem',
            screens: {
               '2xl': '1636px'
            }
         },
         fontFamily: {
            sans: ['Inter', 'sans-serif'],
            inter: ['Inter', 'sans-serif']
         },
         colors: {
            black: {
               primary: '#34383A'
            },
            gray: {
               primary: '#868686'
            },
            gradient: {
               start: '#8a30e3',
               middle: '#ee6ba1',
               end: '#eac893'
            }
         },
         animation: {
            'shiny-text': 'shiny-text 8s infinite',
            gradient: 'gradient 8s linear infinite'
         },
         keyframes: {
            'shiny-text': {
               '0%, 90%, 100%': {
                  'background-position': 'calc(-100% - var(--shiny-width)) 0'
               },
               '30%, 60%': {
                  'background-position': 'calc(100% + var(--shiny-width)) 0'
               }
            },
            gradient: {
               to: {
                  backgroundPosition: 'var(--bg-size) 0'
               }
            }
         }
      }
   },
   plugins: [tailwindcssAnimate]
}
export default config
