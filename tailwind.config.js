/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        border: 'var(--ds-outline)',
        input: 'var(--ds-outline)',
        ring: 'var(--ds-primary)',
        background: 'var(--ds-background)',
        foreground: 'var(--ds-on-surface)',
        primary: {
          DEFAULT: 'var(--ds-primary)',
          foreground: 'var(--ds-on-primary)',
        },
        'on-primary': 'var(--ds-on-primary)',
        'primary-container': 'var(--ds-primary-container)',
        'on-primary-container': 'var(--ds-on-primary-container)',
        secondary: {
          DEFAULT: 'var(--ds-primary-container)',
          foreground: 'var(--ds-on-primary-container)',
        },
        destructive: {
          DEFAULT: 'var(--ds-error)',
          foreground: 'var(--ds-on-error)',
        },
        muted: {
          DEFAULT: 'var(--ds-surface-variant)',
          foreground: 'var(--ds-on-surface-variant)',
        },
        accent: {
          DEFAULT: 'var(--ds-surface-variant)',
          foreground: 'var(--ds-on-surface)',
        },
        card: {
          DEFAULT: 'var(--ds-surface)',
          foreground: 'var(--ds-on-surface)',
        },
        popover: {
          DEFAULT: 'var(--ds-surface)',
          foreground: 'var(--ds-on-surface)',
        },
        surface: 'var(--ds-surface)',
        'surface-variant': 'var(--ds-surface-variant)',
        'on-surface': 'var(--ds-on-surface)',
        'on-surface-variant': 'var(--ds-on-surface-variant)',
        outline: 'var(--ds-outline)',
        error: 'var(--ds-error)',
        'on-error': 'var(--ds-on-error)',
        success: 'var(--ds-success)',
        warning: 'var(--ds-warning)',
        disabled: 'var(--ds-disabled)',
        'on-disabled': 'var(--ds-on-disabled)',
        'score-positive': 'var(--ds-score-positive)',
        'score-negative': 'var(--ds-score-negative)',
        rank1: 'var(--ds-rank-1)',
        rank2: 'var(--ds-rank-2)',
        rank3: 'var(--ds-rank-3)',
        chip: 'var(--ds-chip)',
      },

      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
