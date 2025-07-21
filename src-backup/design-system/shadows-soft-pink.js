/**
 * やさしいピンクデザイン用シャドウシステム定義
 * 柔らかく親しみやすいシャドウ効果
 */

// やさしいピンクのベースカラー
const pinkColors = {
  primary: '#ea5a7b',
  primaryLight: '#f27790',
  primaryDark: '#d63c5e',
  soft: '#fef7f7',
  light: '#fdeaeb',
  medium: '#facdd4',
};

// 基本的なやさしいシャドウ
export const shadows = {
  none: 'none',
  
  // 基本シャドウ - 非常に柔らかく微妙
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.07), 0 1px 2px 0 rgba(0, 0, 0, 0.04)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.07), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
  
  // ピンクアクセントシャドウ
  pinkXs: '0 1px 2px 0 rgba(234, 90, 123, 0.1)',
  pinkSm: '0 1px 3px 0 rgba(234, 90, 123, 0.15), 0 1px 2px 0 rgba(234, 90, 123, 0.08)',
  pinkMd: '0 4px 6px -1px rgba(234, 90, 123, 0.15), 0 2px 4px -1px rgba(234, 90, 123, 0.08)',
  pinkLg: '0 10px 15px -3px rgba(234, 90, 123, 0.15), 0 4px 6px -2px rgba(234, 90, 123, 0.05)',
  
  // 内側のシャドウ - 非常に微妙
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.03)',
  innerPink: 'inset 0 2px 4px 0 rgba(234, 90, 123, 0.1)',
  
  // グローシャドウ（微妙なピンクの光）
  glow: '0 0 10px rgba(234, 90, 123, 0.2)',
  glowSoft: '0 0 20px rgba(234, 90, 123, 0.15)',
  glowSubtle: '0 0 5px rgba(234, 90, 123, 0.1)',
};

// カードの状態別シャドウ
export const cardShadows = {
  // 基本カード
  rest: shadows.sm,
  hover: shadows.md,
  active: shadows.xs,
  elevated: shadows.lg,
  floating: shadows.xl,
  
  // ピンクアクセントカード
  pinkRest: shadows.pinkSm,
  pinkHover: shadows.pinkMd,
  pinkActive: shadows.pinkXs,
  
  // 特別なカード
  hero: shadows.lg,
  featured: shadows.xl,
  subtle: shadows.xs,
};

// ボタンのシャドウ
export const buttonShadows = {
  // 基本ボタン
  rest: shadows.xs,
  hover: shadows.sm,
  active: 'none',
  disabled: 'none',
  
  // プライマリボタン（ピンク）
  primary: {
    rest: shadows.pinkSm,
    hover: `${shadows.pinkMd}, ${shadows.glowSubtle}`,
    active: shadows.pinkXs,
    focus: `${shadows.pinkSm}, 0 0 0 3px rgba(234, 90, 123, 0.2)`,
  },
  
  // セカンダリボタン
  secondary: {
    rest: shadows.xs,
    hover: shadows.sm,
    active: 'none',
    focus: `${shadows.xs}, 0 0 0 3px rgba(234, 90, 123, 0.2)`,
  },
  
  // アウトラインボタン
  outline: {
    rest: 'none',
    hover: shadows.xs,
    active: 'none',
    focus: `0 0 0 3px rgba(234, 90, 123, 0.2)`,
  },
  
  // ゴーストボタン
  ghost: {
    rest: 'none',
    hover: shadows.xs,
    active: 'none',
    focus: `0 0 0 3px rgba(234, 90, 123, 0.2)`,
  },
};

// インプットフィールドのシャドウ
export const inputShadows = {
  rest: shadows.xs,
  focus: `${shadows.sm}, 0 0 0 3px rgba(234, 90, 123, 0.2)`,
  error: `${shadows.sm}, 0 0 0 3px rgba(239, 68, 68, 0.2)`,
  success: `${shadows.sm}, 0 0 0 3px rgba(34, 197, 94, 0.2)`,
  disabled: 'none',
};

// モーダルとオーバーレイのシャドウ
export const modalShadows = {
  modal: shadows['2xl'],
  drawer: shadows.xl,
  dropdown: shadows.lg,
  popover: shadows.md,
  tooltip: shadows.sm,
  
  // ピンクアクセントモーダル
  pinkModal: `${shadows['2xl']}, ${shadows.glowSoft}`,
  pinkPopover: `${shadows.md}, ${shadows.glowSubtle}`,
};

// ナビゲーションのシャドウ
export const navigationShadows = {
  header: shadows.sm,
  sidebar: shadows.md,
  bottomBar: '0 -4px 6px -1px rgba(0, 0, 0, 0.05)',
  tabBar: shadows.xs,
  
  // 検索バー（ピンク強調）
  searchBar: {
    rest: shadows.sm,
    focus: `${shadows.md}, 0 0 0 3px rgba(234, 90, 123, 0.2)`,
    active: `${shadows.md}, ${shadows.glowSubtle}`,
  },
  
  // ナビボタン（ピンク強調）
  navButton: {
    rest: shadows.xs,
    hover: `${shadows.sm}, ${shadows.glowSubtle}`,
    active: shadows.xs,
    selected: `${shadows.sm}, ${shadows.glowSubtle}`,
  },
};

// 画像とメディアのシャドウ
export const mediaShadows = {
  image: shadows.md,
  avatar: shadows.sm,
  avatarLarge: shadows.md,
  
  // 特別な画像
  heroImage: shadows.lg,
  thumbnailImage: shadows.xs,
  galleryImage: shadows.sm,
};

// 通知とアラートのシャドウ
export const notificationShadows = {
  notification: shadows.lg,
  alert: shadows.md,
  toast: shadows.lg,
  banner: shadows.sm,
  
  // 状態別通知
  success: `${shadows.md}, 0 0 5px rgba(34, 197, 94, 0.2)`,
  warning: `${shadows.md}, 0 0 5px rgba(245, 158, 11, 0.2)`,
  error: `${shadows.md}, 0 0 5px rgba(239, 68, 68, 0.2)`,
  info: `${shadows.md}, 0 0 5px rgba(59, 130, 246, 0.2)`,
};

// React Native用エレベーション
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
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  2: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  3: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  4: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 4,
  },
  5: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 15,
    elevation: 5,
  },
  6: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 6,
  },
};

// ピンクカラーのエレベーション
export const pinkElevations = {
  sm: {
    shadowColor: pinkColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  md: {
    shadowColor: pinkColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  lg: {
    shadowColor: pinkColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
  },
  glow: {
    shadowColor: pinkColors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 0,
  },
};

// 特別なシャドウパターン
export const specialShadows = {
  // 柔らかいカード
  softCard: {
    rest: shadows.sm,
    hover: `${shadows.md}, 0 0 0 1px rgba(234, 90, 123, 0.1)`,
    active: shadows.xs,
  },
  
  // 強調されたアイテム
  highlighted: {
    rest: `${shadows.sm}, 0 0 0 2px rgba(234, 90, 123, 0.1)`,
    hover: `${shadows.md}, 0 0 0 2px rgba(234, 90, 123, 0.2)`,
  },
  
  // 選択されたアイテム
  selected: {
    rest: `${shadows.sm}, 0 0 0 2px rgba(234, 90, 123, 0.3)`,
    hover: `${shadows.md}, 0 0 0 2px rgba(234, 90, 123, 0.4)`,
  },
  
  // 浮き上がったアイテム
  floating: {
    rest: `${shadows.lg}, ${shadows.glowSubtle}`,
    hover: `${shadows.xl}, ${shadows.glow}`,
  },
  
  // 柔らかいボーダー効果
  softBorder: {
    light: '0 0 0 1px rgba(234, 90, 123, 0.1)',
    medium: '0 0 0 1px rgba(234, 90, 123, 0.2)',
    strong: '0 0 0 2px rgba(234, 90, 123, 0.3)',
  },
};

// シャドウユーティリティ
export const shadowUtils = {
  // シャドウの組み合わせ
  combine: (...shadowValues) => shadowValues.filter(Boolean).join(', '),
  
  // 動的シャドウ生成
  createShadow: (
    offsetX = 0,
    offsetY = 4,
    blur = 6,
    spread = -1,
    color = 'rgba(0, 0, 0, 0.05)'
  ) => `${offsetX}px ${offsetY}px ${blur}px ${spread}px ${color}`,
  
  // ピンクシャドウ生成
  createPinkShadow: (
    offsetX = 0,
    offsetY = 4,
    blur = 6,
    spread = -1,
    opacity = 0.15
  ) => `${offsetX}px ${offsetY}px ${blur}px ${spread}px rgba(234, 90, 123, ${opacity})`,
  
  // レイヤードシャドウ
  layered: {
    subtle: shadowUtils.combine(shadows.xs, shadows.sm),
    medium: shadowUtils.combine(shadows.sm, shadows.md),
    strong: shadowUtils.combine(shadows.md, shadows.lg),
    pink: shadowUtils.combine(shadows.pinkSm, shadows.glowSubtle),
  },
  
  // 状態別シャドウ
  interactive: {
    rest: shadows.xs,
    hover: shadows.sm,
    active: 'none',
    focus: (color = 'rgba(234, 90, 123, 0.2)') => `${shadows.sm}, 0 0 0 3px ${color}`,
  },
};

// エクスポート用の統合シャドウオブジェクト
export const shadowSystem = {
  shadows,
  card: cardShadows,
  button: buttonShadows,
  input: inputShadows,
  modal: modalShadows,
  navigation: navigationShadows,
  media: mediaShadows,
  notification: notificationShadows,
  elevation: elevations,
  pinkElevation: pinkElevations,
  special: specialShadows,
  utils: shadowUtils,
};