import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Cor Primária (Identidade Visual)
        'lbr-primary': {
          DEFAULT: '#2f4982',
          hover: '#263d69',
          active: '#1f3356',
          light: '#e8eef9',
          lighter: '#f5f8fc',
        },
        // Cores Secundárias Vibrantes
        secondary: {
          DEFAULT: '#7c3aed',
          light: '#ede9fe',
          dark: '#a78bfa', // modo escuro
        },
        accent: {
          DEFAULT: '#f59e0b',
          light: '#fef3c7',
          dark: '#fbbf24', // modo escuro
        },
        // Cores Adicionais
        pink: {
          DEFAULT: '#ec4899',
          light: '#fce7f3',
          dark: '#f472b6',
        },
        cyan: {
          DEFAULT: '#06b6d4',
          light: '#cffafe',
          dark: '#22d3ee',
        },
        purple: {
          DEFAULT: '#8b5cf6',
          light: '#ede9fe',
          dark: '#a78bfa',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #2f4982, #4a6fa5)',
        'gradient-secondary': 'linear-gradient(135deg, #7c3aed, #a78bfa)',
        'gradient-accent': 'linear-gradient(135deg, #f59e0b, #ec4899)',
        'gradient-info': 'linear-gradient(135deg, #06b6d4, #3b82f6)',
      },
      boxShadow: {
        'lbr-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'lbr': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'lbr-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.15)',
        'lbr-primary': '0 10px 30px -5px rgba(47, 73, 130, 0.3)',
        'lbr-accent': '0 10px 30px -5px rgba(245, 158, 11, 0.3)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
};

export default config;
