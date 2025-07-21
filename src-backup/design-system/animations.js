/**
 * アニメーション定義
 * サイバーパンク風のアニメーションとトランジション
 */

import { baseColors } from './colors';

// 基本的なトランジション
export const transitions = {
  // 持続時間
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    slower: '750ms',
    slowest: '1000ms',
  },
  
  // イージング関数
  easing: {
    // 標準
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    
    // カスタム（サイバーパンク風）
    cyber: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    neon: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    glitch: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  
  // よく使用される組み合わせ
  common: {
    fade: 'opacity 300ms ease-in-out',
    scale: 'transform 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    slide: 'transform 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    glow: 'box-shadow 300ms ease-in-out',
    color: 'color 300ms ease-in-out',
    background: 'background-color 300ms ease-in-out',
    border: 'border-color 300ms ease-in-out',
  },
};

// キーフレームアニメーション
export const keyframes = {
  // ネオングロー効果
  neonPulseBlue: `
    @keyframes neonPulseBlue {
      0% {
        text-shadow: 0 0 5px ${baseColors.primary[400]}, 0 0 10px ${baseColors.primary[400]}, 0 0 15px ${baseColors.primary[400]};
      }
      50% {
        text-shadow: 0 0 10px ${baseColors.primary[400]}, 0 0 20px ${baseColors.primary[400]}, 0 0 30px ${baseColors.primary[400]}, 0 0 40px ${baseColors.primary[400]};
      }
      100% {
        text-shadow: 0 0 5px ${baseColors.primary[400]}, 0 0 10px ${baseColors.primary[400]}, 0 0 15px ${baseColors.primary[400]};
      }
    }
  `,
  
  neonPulsePink: `
    @keyframes neonPulsePink {
      0% {
        text-shadow: 0 0 5px ${baseColors.secondary[400]}, 0 0 10px ${baseColors.secondary[400]}, 0 0 15px ${baseColors.secondary[400]};
      }
      50% {
        text-shadow: 0 0 10px ${baseColors.secondary[400]}, 0 0 20px ${baseColors.secondary[400]}, 0 0 30px ${baseColors.secondary[400]}, 0 0 40px ${baseColors.secondary[400]};
      }
      100% {
        text-shadow: 0 0 5px ${baseColors.secondary[400]}, 0 0 10px ${baseColors.secondary[400]}, 0 0 15px ${baseColors.secondary[400]};
      }
    }
  `,
  
  neonPulseGreen: `
    @keyframes neonPulseGreen {
      0% {
        text-shadow: 0 0 5px ${baseColors.accent[400]}, 0 0 10px ${baseColors.accent[400]}, 0 0 15px ${baseColors.accent[400]};
      }
      50% {
        text-shadow: 0 0 10px ${baseColors.accent[400]}, 0 0 20px ${baseColors.accent[400]}, 0 0 30px ${baseColors.accent[400]}, 0 0 40px ${baseColors.accent[400]};
      }
      100% {
        text-shadow: 0 0 5px ${baseColors.accent[400]}, 0 0 10px ${baseColors.accent[400]}, 0 0 15px ${baseColors.accent[400]};
      }
    }
  `,
  
  // グリッチエフェクト
  glitch: `
    @keyframes glitch {
      0% { transform: translate(0); }
      20% { transform: translate(-2px, 2px); }
      40% { transform: translate(-2px, -2px); }
      60% { transform: translate(2px, 2px); }
      80% { transform: translate(2px, -2px); }
      100% { transform: translate(0); }
    }
  `,
  
  // フェードイン・アウト
  fadeIn: `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `,
  
  fadeOut: `
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `,
  
  // スケールアニメーション
  scaleIn: `
    @keyframes scaleIn {
      from { transform: scale(0.8); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `,
  
  scaleOut: `
    @keyframes scaleOut {
      from { transform: scale(1); opacity: 1; }
      to { transform: scale(0.8); opacity: 0; }
    }
  `,
  
  // スライドアニメーション
  slideInLeft: `
    @keyframes slideInLeft {
      from { transform: translateX(-100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `,
  
  slideInRight: `
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `,
  
  slideInUp: `
    @keyframes slideInUp {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `,
  
  slideInDown: `
    @keyframes slideInDown {
      from { transform: translateY(-100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `,
  
  // 回転アニメーション
  spin: `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `,
  
  // バウンス
  bounce: `
    @keyframes bounce {
      0%, 20%, 53%, 80%, 100% { transform: translate3d(0, 0, 0); }
      40%, 43% { transform: translate3d(0, -30px, 0); }
      70% { transform: translate3d(0, -15px, 0); }
      90% { transform: translate3d(0, -4px, 0); }
    }
  `,
  
  // 振動
  shake: `
    @keyframes shake {
      10%, 90% { transform: translate3d(-1px, 0, 0); }
      20%, 80% { transform: translate3d(2px, 0, 0); }
      30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
      40%, 60% { transform: translate3d(4px, 0, 0); }
    }
  `,
  
  // フリッカー（点滅）
  flicker: `
    @keyframes flicker {
      0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100% {
        opacity: 0.99;
      }
      20%, 21.999%, 63%, 63.999%, 65%, 69.999% {
        opacity: 0.4;
      }
    }
  `,
};

// アニメーションクラス
export const animations = {
  // ネオンエフェクト
  neonPulse: {
    blue: `neonPulseBlue 2s ease-in-out infinite alternate`,
    pink: `neonPulsePink 2s ease-in-out infinite alternate`,
    green: `neonPulseGreen 2s ease-in-out infinite alternate`,
  },
  
  // 基本アニメーション
  fadeIn: `fadeIn ${transitions.duration.normal} ${transitions.easing.ease}`,
  fadeOut: `fadeOut ${transitions.duration.normal} ${transitions.easing.ease}`,
  scaleIn: `scaleIn ${transitions.duration.normal} ${transitions.easing.neon}`,
  scaleOut: `scaleOut ${transitions.duration.normal} ${transitions.easing.neon}`,
  
  // スライドアニメーション
  slideInLeft: `slideInLeft ${transitions.duration.normal} ${transitions.easing.cyber}`,
  slideInRight: `slideInRight ${transitions.duration.normal} ${transitions.easing.cyber}`,
  slideInUp: `slideInUp ${transitions.duration.normal} ${transitions.easing.cyber}`,
  slideInDown: `slideInDown ${transitions.duration.normal} ${transitions.easing.cyber}`,
  
  // 特殊エフェクト
  glitch: `glitch 0.3s linear infinite`,
  spin: `spin 1s linear infinite`,
  bounce: `bounce 2s infinite`,
  shake: `shake 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both`,
  flicker: `flicker 3s linear infinite`,
  
  // ホバーエフェクト用
  glow: {
    blue: `box-shadow ${transitions.duration.normal} ${transitions.easing.ease}`,
    pink: `box-shadow ${transitions.duration.normal} ${transitions.easing.ease}`,
    green: `box-shadow ${transitions.duration.normal} ${transitions.easing.ease}`,
  },
};

// React Native用のアニメーション設定
export const reactNativeAnimations = {
  // タイミング設定
  timing: {
    fast: { duration: 150, useNativeDriver: true },
    normal: { duration: 300, useNativeDriver: true },
    slow: { duration: 500, useNativeDriver: true },
    slower: { duration: 750, useNativeDriver: true },
  },
  
  // スプリング設定
  spring: {
    gentle: {
      tension: 120,
      friction: 14,
      useNativeDriver: true,
    },
    wobbly: {
      tension: 180,
      friction: 12,
      useNativeDriver: true,
    },
    stiff: {
      tension: 200,
      friction: 7,
      useNativeDriver: true,
    },
  },
  
  // プリセットアニメーション
  presets: {
    fadeIn: {
      from: { opacity: 0 },
      to: { opacity: 1 },
      config: { duration: 300, useNativeDriver: true },
    },
    slideInLeft: {
      from: { transform: [{ translateX: -100 }], opacity: 0 },
      to: { transform: [{ translateX: 0 }], opacity: 1 },
      config: { duration: 300, useNativeDriver: true },
    },
    scaleIn: {
      from: { transform: [{ scale: 0.8 }], opacity: 0 },
      to: { transform: [{ scale: 1 }], opacity: 1 },
      config: { duration: 300, useNativeDriver: true },
    },
  },
};

// マイクロインタラクション
export const microInteractions = {
  // ボタンホバー
  buttonHover: {
    transform: 'translateY(-2px)',
    transition: transitions.common.scale,
  },
  
  // カードホバー
  cardHover: {
    transform: 'translateY(-4px) scale(1.02)',
    transition: `${transitions.common.scale}, ${transitions.common.glow}`,
  },
  
  // インプットフォーカス
  inputFocus: {
    transform: 'scale(1.02)',
    transition: `${transitions.common.scale}, ${transitions.common.glow}, ${transitions.common.border}`,
  },
  
  // アイコンホバー
  iconHover: {
    transform: 'rotate(15deg) scale(1.1)',
    transition: transitions.common.scale,
  },
};

// レスポンシブアニメーション
export const responsiveAnimations = {
  // モバイル用（軽量）
  mobile: {
    fadeIn: `fadeIn ${transitions.duration.fast} ${transitions.easing.ease}`,
    slideIn: `slideInUp ${transitions.duration.fast} ${transitions.easing.ease}`,
    scale: `scaleIn ${transitions.duration.fast} ${transitions.easing.ease}`,
  },
  
  // デスクトップ用（リッチ）
  desktop: {
    fadeIn: `fadeIn ${transitions.duration.normal} ${transitions.easing.cyber}`,
    slideIn: `slideInUp ${transitions.duration.normal} ${transitions.easing.cyber}`,
    scale: `scaleIn ${transitions.duration.normal} ${transitions.easing.neon}`,
    neonPulse: animations.neonPulse.blue,
  },
};

// パフォーマンス最適化用の設定
export const performanceSettings = {
  // ハードウェアアクセラレーション
  willChange: {
    transform: 'will-change: transform',
    opacity: 'will-change: opacity',
    scroll: 'will-change: scroll-position',
    auto: 'will-change: auto',
  },
  
  // GPU最適化
  gpuOptimized: {
    transform: 'translateZ(0)',
    backfaceVisibility: 'hidden',
    perspective: '1000px',
  },
};

// エクスポート用の統合アニメーションオブジェクト
export const animationSystem = {
  transitions,
  keyframes,
  animations,
  reactNative: reactNativeAnimations,
  microInteractions,
  responsive: responsiveAnimations,
  performance: performanceSettings,
};