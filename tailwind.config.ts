// tailwind.config.ts
import colors from 'tailwindcss/colors';
import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{js,ts,jsx,tsx}'],
  plugins: [require('@tailwindcss/forms')],
  important: '#app',

  theme: {
    extend: {
      colors: {
        // 👇 new: points to the runtime CSS variable from root.tsx
        brand: 'var(--color-primary)',
        // your existing palettes stay as-is
        primary: colors.sky,
        secondary: colors.emerald,
      },
      animation: {
        dropIn: 'dropIn 0.2s ease-out',
      },
      keyframes: {
        dropIn: {
          '0%': { transform: 'translateY(-100px)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
    },
  },
} satisfies Config;
