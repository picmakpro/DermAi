/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Nouvelle palette DermAI selon la direction artistique
        dermai: {
          // Fond principal
          pure: '#FFFFFF',
          light: '#FDF9F7',
          
          // Accents skincare (beige rosé, nude, pêche)
          nude: {
            50: '#FDF9F7',
            100: '#F9F2EF',
            200: '#F2E6E0',
            300: '#E8D4C8',
            400: '#D6C6C2',
            500: '#C4B5B0',
            600: '#B0A29D',
            700: '#9A8B85',
            800: '#7D6E68',
            900: '#5C524E',
          },
          
          // Accents IA (bleu électrique → violet néon)
          ai: {
            50: '#F0F0FF',
            100: '#E6E6FF',
            200: '#CFCFFF',
            300: '#A5A5FF',
            400: '#8F7BFF',
            500: '#5A4AE3',
            600: '#4A3BD1',
            700: '#3B2FB8',
            800: '#2F259E',
            900: '#241D7A',
          },
          
          // Neutres
          neutral: {
            50: '#FAFAFA',
            100: '#F5F5F5',
            200: '#E5E5E5',
            300: '#D4D4D4',
            400: '#A3A3A3',
            500: '#737373',
            600: '#525252',
            700: '#404040',
            800: '#262626',
            900: '#171717',
          }
        },
        
        // Couleurs legacy pour compatibilité
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
      },
      
      // Typographie moderne selon la DA
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
        'display': ['Space Grotesk', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'mono': ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      
      // Animations et transitions fluides
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'scan': 'scan 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(90, 74, 227, 0.2), 0 0 10px rgba(90, 74, 227, 0.2), 0 0 15px rgba(90, 74, 227, 0.2)' },
          '100%': { boxShadow: '0 0 10px rgba(143, 123, 255, 0.4), 0 0 20px rgba(143, 123, 255, 0.4), 0 0 30px rgba(143, 123, 255, 0.4)' }
        },
        scan: {
          '0%, 100%': { transform: 'translateX(-100%)' },
          '50%': { transform: 'translateX(100%)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        }
      },
      
      // Glassmorphism et effets premium
      backdropBlur: {
        'xs': '2px',
      },
      
      boxShadow: {
        'glow': '0 0 20px rgba(90, 74, 227, 0.3)',
        'glow-lg': '0 0 40px rgba(90, 74, 227, 0.4)',
        'premium': '0 8px 32px rgba(0, 0, 0, 0.08)',
        'premium-lg': '0 16px 64px rgba(0, 0, 0, 0.12)',
      }
    },
  },
  plugins: [],
}
