/**
 * シャドウとエレベーション定義
 * ネオン効果とサイバーパンク風のシャドウシステム
 */

import { baseColors, grayColors } from './colors';

// 標準的なシャドウ（ダークテーマ用）
export const shadows = {
  none: 'none',
  
  // 基本シャドウ
  xs: '0 1px 2px rgba(0, 0, 0, 0.5)',
  sm: '0 1px 3px rgba(0, 0, 0, 0.6), 0 1px 2px rgba(0, 0, 0, 0.4)',
  md: '0 4px 6px rgba(0, 0, 0, 0.6), 0 2px 4px rgba(0, 0, 0, 0.4)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.6), 0 4px 6px rgba(0, 0, 0, 0.4)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.6), 0 10px 10px rgba(0, 0, 0, 0.3)',
  '2xl': '0 25px 50px rgba(0, 0, 0, 0.7)',
  
  // インナーシャドウ
  inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.4)',
  innerLg: 'inset 0 4px 8px rgba(0, 0, 0, 0.5)',
};

// ネオンシャドウエフェクト
export const neonShadows = {
  // ブルーネオン
  blueGlow: {
    sm: `0 0 5px ${baseColors.primary[400]}, 0 0 10px ${baseColors.primary[400]}`,
    md: `0 0 5px ${baseColors.primary[400]}, 0 0 10px ${baseColors.primary[400]}, 0 0 15px ${baseColors.primary[400]}`,
    lg: `0 0 5px ${baseColors.primary[400]}, 0 0 10px ${baseColors.primary[400]}, 0 0 15px ${baseColors.primary[400]}, 0 0 20px ${baseColors.primary[400]}`,
    xl: `0 0 5px ${baseColors.primary[400]}, 0 0 10px ${baseColors.primary[400]}, 0 0 15px ${baseColors.primary[400]}, 0 0 20px ${baseColors.primary[400]}, 0 0 35px ${baseColors.primary[500]}`,
  },
  
  // ピンクネオン
  pinkGlow: {
    sm: `0 0 5px ${baseColors.secondary[400]}, 0 0 10px ${baseColors.secondary[400]}`,
    md: `0 0 5px ${baseColors.secondary[400]}, 0 0 10px ${baseColors.secondary[400]}, 0 0 15px ${baseColors.secondary[400]}`,
    lg: `0 0 5px ${baseColors.secondary[400]}, 0 0 10px ${baseColors.secondary[400]}, 0 0 15px ${baseColors.secondary[400]}, 0 0 20px ${baseColors.secondary[400]}`,
    xl: `0 0 5px ${baseColors.secondary[400]}, 0 0 10px ${baseColors.secondary[400]}, 0 0 15px ${baseColors.secondary[400]}, 0 0 20px ${baseColors.secondary[400]}, 0 0 35px ${baseColors.secondary[500]}`,
  },
  
  // グリーンネオン
  greenGlow: {
    sm: `0 0 5px ${baseColors.accent[400]}, 0 0 10px ${baseColors.accent[400]}`,
    md: `0 0 5px ${baseColors.accent[400]}, 0 0 10px ${baseColors.accent[400]}, 0 0 15px ${baseColors.accent[400]}`,
    lg: `0 0 5px ${baseColors.accent[400]}, 0 0 10px ${baseColors.accent[400]}, 0 0 15px ${baseColors.accent[400]}, 0 0 20px ${baseColors.accent[400]}`,
    xl: `0 0 5px ${baseColors.accent[400]}, 0 0 10px ${baseColors.accent[400]}, 0 0 15px ${baseColors.accent[400]}, 0 0 20px ${baseColors.accent[400]}, 0 0 35px ${baseColors.accent[500]}`,
  },
  
  // マルチカラーネオン
  rainbow: {
    sm: `0 0 5px ${baseColors.primary[400]}, 0 0 10px ${baseColors.secondary[400]}, 0 0 15px ${baseColors.accent[400]}`,
    md: `0 0 5px ${baseColors.primary[400]}, 0 0 10px ${baseColors.secondary[400]}, 0 0 15px ${baseColors.accent[400]}, 0 0 20px ${baseColors.primary[500]}`,
    lg: `0 0 5px ${baseColors.primary[400]}, 0 0 10px ${baseColors.secondary[400]}, 0 0 15px ${baseColors.accent[400]}, 0 0 20px ${baseColors.primary[500]}, 0 0 25px ${baseColors.secondary[500]}`,
  },
};

// コンポーネント特化型シャドウ
export const componentShadows = {
  // カードシャドウ
  card: {
    default: shadows.md,
    hover: shadows.lg,
    active: shadows.sm,
  },
  
  // モーダルシャドウ
  modal: shadows['2xl'],
  
  // ドロップダウンシャドウ
  dropdown: shadows.lg,
  
  // ボタンシャドウ
  button: {
    default: shadows.sm,
    hover: shadows.md,
    active: shadows.xs,
  },
  
  // インプットシャドウ
  input: {
    default: shadows.sm,
    focus: `${shadows.sm}, ${neonShadows.blueGlow.sm}`,
    error: `${shadows.sm}, ${neonShadows.pinkGlow.sm}`,
  },
  
  // ナビゲーションシャドウ
  navigation: {
    bottom: '0 -4px 6px rgba(0, 0, 0, 0.5)',
    top: '0 4px 6px rgba(0, 0, 0, 0.5)',
  },
};

// エレベーション（React Native用）
export const elevations = {
  0: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  1: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 1,
  },
  2: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 2,
  },
  3: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 3,
  },
  4: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  5: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 5,
  },
  6: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.7,
    shadowRadius: 25,
    elevation: 6,
  },
};

// ネオンエレベーション（React Native用）
export const neonElevations = {
  blueGlow: {
    sm: {
      shadowColor: baseColors.primary[400],
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 10,
      elevation: 3,
    },
    md: {
      shadowColor: baseColors.primary[400],
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.9,
      shadowRadius: 15,
      elevation: 4,
    },
    lg: {
      shadowColor: baseColors.primary[400],
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1.0,
      shadowRadius: 20,
      elevation: 5,
    },
  },
  
  pinkGlow: {
    sm: {
      shadowColor: baseColors.secondary[400],
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 10,
      elevation: 3,
    },
    md: {
      shadowColor: baseColors.secondary[400],
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.9,
      shadowRadius: 15,
      elevation: 4,
    },
    lg: {
      shadowColor: baseColors.secondary[400],
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1.0,
      shadowRadius: 20,
      elevation: 5,
    },
  },
  
  greenGlow: {
    sm: {
      shadowColor: baseColors.accent[400],
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 10,
      elevation: 3,
    },
    md: {
      shadowColor: baseColors.accent[400],
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.9,
      shadowRadius: 15,
      elevation: 4,
    },
    lg: {
      shadowColor: baseColors.accent[400],
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1.0,
      shadowRadius: 20,
      elevation: 5,
    },
  },
};

// 特殊エフェクト用シャドウ
export const effectShadows = {
  // インナーグロー
  innerGlow: {
    blue: `inset 0 0 10px ${baseColors.primary[400]}`,
    pink: `inset 0 0 10px ${baseColors.secondary[400]}`,
    green: `inset 0 0 10px ${baseColors.accent[400]}`,
  },
  
  // テキストシャドウ
  textGlow: {
    blue: `0 0 10px ${baseColors.primary[400]}`,
    pink: `0 0 10px ${baseColors.secondary[400]}`,
    green: `0 0 10px ${baseColors.accent[400]}`,
    subtle: '0 1px 3px rgba(0, 0, 0, 0.8)',
  },
  
  // ボーダーグロー
  borderGlow: {
    blue: `0 0 0 1px ${baseColors.primary[400]}, ${neonShadows.blueGlow.sm}`,
    pink: `0 0 0 1px ${baseColors.secondary[400]}, ${neonShadows.pinkGlow.sm}`,
    green: `0 0 0 1px ${baseColors.accent[400]}, ${neonShadows.greenGlow.sm}`,
  },
};

// エクスポート用の統合シャドウオブジェクト
export const shadowSystem = {
  shadows,
  neon: neonShadows,
  component: componentShadows,
  elevation: elevations,
  neonElevation: neonElevations,
  effect: effectShadows,
};