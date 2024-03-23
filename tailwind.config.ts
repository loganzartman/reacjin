import daisyUI from 'daisyui';
import daisyuiThemes from 'daisyui/src/theming/themes';
import type {Config} from 'tailwindcss';

const config = {
  plugins: [daisyUI],
  content: ['./src/**/*.{html,tsx,jsx}'],
  theme: {
    extend: {
      colors: {
        background: '#1f1b20',
        brand: {
          50: '#FFFBF5',
          100: '#FFF9F0',
          200: '#FFF2DC',
          300: '#FFDB9E',
          400: '#FFC766',
          500: '#FFB029',
          600: '#F09800',
          700: '#B37100',
          800: '#754A00',
          900: '#3D2700',
          950: '#1F1300',
        },
      },
    },
  },
  variants: {},
  daisyui: {},
} satisfies Config;

config.daisyui = {
  base: false,
  themes: [
    {
      custom: {
        ...daisyuiThemes['dark'],
        primary: config.theme.extend.colors.brand[400],
      },
    },
  ],
};

export default config;
