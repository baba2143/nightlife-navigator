import { Options } from "$fresh/plugins/twind.ts";
import { apply } from "twind";

export default {
  selfURL: import.meta.url,
  theme: {
    extend: {
      colors: {
        // やさしいピンクカラーパレット
        'pink-primary': '#ea5a7b',
        'pink-primary-light': '#f27790',
        'pink-primary-dark': '#d63c5e',
        'pink-secondary': '#f43f5e',
        'pink-secondary-light': '#fb7185',
        'pink-secondary-dark': '#e11d48',
        'pink-accent': '#ec4899',
        'pink-accent-light': '#f472b6',
        'pink-accent-dark': '#db2777',
        'pink-light': '#fef7f7',
        'pink-soft': '#fdeaeb',
        'surface-soft': '#fefbfb',
        
        // テキストカラー
        'text-primary': '#1a1a1a',
        'text-secondary': '#666666',
        'text-tertiary': '#999999',
        'text-disabled': '#cccccc',
        
        // ボーダーカラー
        'border-light': '#f0f0f0',
        'border-medium': '#e0e0e0',
        'border-dark': '#d0d0d0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Orbitron', 'system-ui', 'sans-serif'],
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
      },
      boxShadow: {
        'soft': '0 1px 3px 0 rgba(0, 0, 0, 0.07), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'medium': '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'large': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'pink': '0 4px 10px 0 rgba(234, 90, 123, 0.15)',
        'pink-glow': '0 0 20px rgba(234, 90, 123, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 0.6s ease-out',
        'pulse-pink': 'pulsePink 2s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        bounceGentle: {
          '0%': { transform: 'translateY(-10px)' },
          '50%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-2px)' },
        },
        pulsePink: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(234, 90, 123, 0.4)' },
          '50%': { boxShadow: '0 0 20px rgba(234, 90, 123, 0.8), 0 0 30px rgba(234, 90, 123, 0.4)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(234, 90, 123, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(234, 90, 123, 0.4), 0 0 30px rgba(234, 90, 123, 0.2)' },
        },
      },
    },
  },
  rules: [
    // カスタムルール
    ['btn-pink', apply('bg-pink-primary text-white px-lg py-md rounded-md shadow-soft hover:bg-pink-primary-dark transition-all duration-300 hover:shadow-pink-glow hover:scale-105 active:scale-95')],
    ['btn-pink-outline', apply('border border-pink-primary text-pink-primary px-lg py-md rounded-md hover:bg-pink-primary hover:text-white transition-all duration-300 hover:shadow-pink active:scale-95')],
    ['btn-pink-glow', apply('bg-pink-primary text-white px-lg py-md rounded-md shadow-pink hover:shadow-pink-glow transition-all duration-300 animate-glow')],
    ['card-soft', apply('bg-white rounded-lg p-lg shadow-soft border border-border-light hover:shadow-medium transition-all duration-300')],
    ['card-elevated', apply('bg-white rounded-lg p-lg shadow-medium border border-border-light hover:shadow-large transition-all duration-300')],
    ['card-interactive', apply('bg-white rounded-lg p-lg shadow-soft border border-border-light hover:shadow-pink transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95')],
    ['badge-pink', apply('bg-pink-light text-pink-primary px-md py-sm rounded-full text-sm font-medium transition-all duration-200 hover:bg-pink-primary hover:text-white')],
    ['badge-glow', apply('bg-pink-primary text-white px-md py-sm rounded-full text-sm font-medium animate-pulse-pink')],
    ['text-gradient-pink', apply('bg-gradient-to-r from-pink-primary to-pink-accent bg-clip-text text-transparent')],
    ['animate-fade-in', apply('animate-fade-in')],
    ['animate-slide-up', apply('animate-slide-up')],
    ['animate-scale-in', apply('animate-scale-in')],
  ],
} as Options;