import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        fond: '#FAF8F5',
        vert: {
          DEFAULT: '#1F5A44',
          clair:   '#26694F',
          pale:    '#EAF3EE',
        },
        corail: {
          DEFAULT: '#E2703A',
          clair:   '#F2905E',
          pale:    '#FFF1E7',
          fonce:   '#B8552A',
        },
        ardoise: {
          DEFAULT: '#221F1D',
          moyen:   '#4A453F',
          clair:   '#8A8378',
        },
        pierre: {
          DEFAULT: '#E7E1D9',
          clair:   '#F1EEE9',
        },
        card: '#FFFFFF',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        grotesk: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.05)',
      },
    },
  },
  plugins: [],
}

export default config
