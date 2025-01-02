import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

export default {
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
            background: 'var(--background)',
            foreground: 'var(--foreground)',
            border: 'var(--border)'
         }
      }
   },
   plugins: [animate]
} satisfies Config
