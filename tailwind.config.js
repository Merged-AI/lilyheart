/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // FamilyConnect Brand Colors
        'bridge-blue': '#4A90E2',
        'warm-green': '#7CB342',
        'soft-purple': '#9B59B6',
        'gentle-orange': '#F39C12',
        'calm-teal': '#1ABC9C',
        'sage-gray': '#95A5A6',
        'deep-charcoal': '#2C3E50',
        fc: {
          blue: '#4A90E2',
          'blue-light': '#6BA3E8',
          'blue-dark': '#357ABD',
          green: '#7CB342',
          'green-light': '#8BC34A',
          'green-dark': '#689F35',
          gray: {
            50: '#f8fafc',
            100: '#e2e8f0',
            600: '#64748b',
            900: '#2C3E50',
          }
        }
      },
      fontFamily: {
        'inter': ['var(--font-inter)', 'system-ui', 'sans-serif'],
        'poppins': ['var(--font-poppins)', 'system-ui', 'sans-serif'],
        'sans': ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "pulse-slow": {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
        float: {
          '0%, 100%': { 
            transform: 'translateY(0px) rotate(0deg)' 
          },
          '50%': { 
            transform: 'translateY(-20px) rotate(180deg)' 
          }
        },
        phoneFloat: {
          '0%, 100%': { 
            transform: 'translateY(0px)' 
          },
          '50%': { 
            transform: 'translateY(-10px)' 
          }
        },
        fadeInUp: {
          'from': {
            opacity: '0',
            transform: 'translateY(20px)'
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        'pulse-slow': {
          '0%, 100%': {
            opacity: '0.3',
            transform: 'scale(1)'
          },
          '50%': {
            opacity: '0.5',
            transform: 'scale(1.05)'
          }
        },
        'bounce-slow': {
          '0%, 100%': {
            transform: 'translateY(0)'
          },
          '50%': {
            transform: 'translateY(-10px)'
          }
        },
        'gradient-shift': {
          '0%, 100%': {
            'background-position': '0% 50%'
          },
          '50%': {
            'background-position': '100% 50%'
          }
        },
        shimmer: {
          '0%': {
            'background-position': '-200% 0'
          },
          '100%': {
            'background-position': '200% 0'
          }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-slow": "pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        'float': 'float 20s ease-in-out infinite',
        'phone-float': 'phoneFloat 6s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 2s ease-out',
        'pulse-slow': 'pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce-slow 3s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 6s ease infinite',
        'shimmer': 'shimmer 2s infinite',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #4A90E2 0%, #7CB342 100%)',
        'gradient-trust': 'linear-gradient(135deg, #4A90E2 0%, #1ABC9C 100%)',
        'fc-primary': 'linear-gradient(135deg, #4A90E2, #7CB342)',
        'fc-light': 'linear-gradient(135deg, rgba(74, 144, 226, 0.1), rgba(124, 179, 66, 0.1))',
        'fc-hero': 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        'fc-header': 'linear-gradient(135deg, #4A90E2 0%, #7CB342 100%)',
        'phone-mockup': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      },
      boxShadow: {
        'fc-brand': '0 10px 25px rgba(74, 144, 226, 0.15)',
        'fc-brand-lg': '0 20px 40px rgba(74, 144, 226, 0.2)',
        'fc-green': '0 10px 25px rgba(124, 179, 66, 0.15)',
        'fc-green-lg': '0 20px 40px rgba(124, 179, 66, 0.2)',
        'glow': '0 0 20px rgba(74, 144, 226, 0.3)',
        'glow-green': '0 0 20px rgba(124, 179, 66, 0.3)',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bouncy': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      transformOrigin: {
        'center-center': '50% 50%',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
      fontSize: {
        '5xl': ['3rem', { lineHeight: '1.2' }],
        '6xl': ['3.5rem', { lineHeight: '1.1' }],
        '7xl': ['4rem', { lineHeight: '1' }],
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      backdropBlur: {
        'xs': '2px',
        'strong': '20px',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      }
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    function({ addUtilities }) {
      const newUtilities = {
        '.glass-effect': {
          'background': 'rgba(255, 255, 255, 0.1)',
          'backdrop-filter': 'blur(10px)',
          'border': '1px solid rgba(255, 255, 255, 0.2)',
        },
        '.text-shadow-sm': {
          'text-shadow': '0 1px 2px rgba(0, 0, 0, 0.1)',
        },
        '.text-shadow-md': {
          'text-shadow': '0 2px 4px rgba(0, 0, 0, 0.1)',
        },
        '.text-shadow-lg': {
          'text-shadow': '0 4px 8px rgba(0, 0, 0, 0.12)',
        },
        '.interactive-scale': {
          'transition': 'transform 0.2s ease',
        },
        '.interactive-scale:hover': {
          'transform': 'scale(1.05)',
        },
        '.interactive-scale:active': {
          'transform': 'scale(0.95)',
        },
        '.focus-enhanced:focus': {
          'outline': 'none',
          'box-shadow': '0 0 0 3px rgba(74, 144, 226, 0.3)',
        },
        '.gradient-text': {
          'background': 'linear-gradient(135deg, #4A90E2, #7CB342)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.card-hover': {
          'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        '.card-hover:hover': {
          'transform': 'translateY(-8px)',
          'box-shadow': '0 25px 50px rgba(0, 0, 0, 0.15)',
        },
        '.btn-enhanced': {
          'position': 'relative',
          'overflow': 'hidden',
          'transform': 'translateZ(0)',
          'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        '.btn-enhanced::before': {
          'content': '""',
          'position': 'absolute',
          'top': '0',
          'left': '-100%',
          'width': '100%',
          'height': '100%',
          'background': 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
          'transition': 'left 0.5s',
        },
        '.btn-enhanced:hover::before': {
          'left': '100%',
        },
      }

      addUtilities(newUtilities)
    }
  ],
} 