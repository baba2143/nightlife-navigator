/**
 * スペーシングシステム
 * 一貫性のあるレイアウト用のスペーシング定義
 */

// ベーススペーシング（4pxベース）
export const spacing = {
  0: 0,
  1: 4,   // 0.25rem
  2: 8,   // 0.5rem
  3: 12,  // 0.75rem
  4: 16,  // 1rem
  5: 20,  // 1.25rem
  6: 24,  // 1.5rem
  8: 32,  // 2rem
  10: 40, // 2.5rem
  12: 48, // 3rem
  16: 64, // 4rem
  20: 80, // 5rem
  24: 96, // 6rem
  32: 128, // 8rem
  40: 160, // 10rem
  48: 192, // 12rem
  56: 224, // 14rem
  64: 256, // 16rem
  
  // 特別なサイズ
  px: 1,    // 1px
  0.5: 2,   // 0.125rem
  1.5: 6,   // 0.375rem
  2.5: 10,  // 0.625rem
  3.5: 14,  // 0.875rem
};

// コンポーネント固有のスペーシング
export const componentSpacing = {
  // パディング
  padding: {
    xs: spacing[2],   // 8px
    sm: spacing[3],   // 12px
    md: spacing[4],   // 16px
    lg: spacing[6],   // 24px
    xl: spacing[8],   // 32px
    '2xl': spacing[12], // 48px
  },
  
  // マージン
  margin: {
    xs: spacing[2],   // 8px
    sm: spacing[4],   // 16px
    md: spacing[6],   // 24px
    lg: spacing[8],   // 32px
    xl: spacing[12],  // 48px
    '2xl': spacing[16], // 64px
  },
  
  // ギャップ（Flexbox/Grid用）
  gap: {
    xs: spacing[2],   // 8px
    sm: spacing[3],   // 12px
    md: spacing[4],   // 16px
    lg: spacing[6],   // 24px
    xl: spacing[8],   // 32px
  },
};

// レイアウト固有のスペーシング
export const layoutSpacing = {
  // セクション間のスペーシング
  section: {
    xs: spacing[8],   // 32px
    sm: spacing[12],  // 48px
    md: spacing[16],  // 64px
    lg: spacing[20],  // 80px
    xl: spacing[24],  // 96px
  },
  
  // コンテナのパディング
  container: {
    xs: spacing[4],   // 16px
    sm: spacing[6],   // 24px
    md: spacing[8],   // 32px
    lg: spacing[12],  // 48px
  },
  
  // カードのスペーシング
  card: {
    padding: spacing[6],  // 24px
    gap: spacing[4],      // 16px
    margin: spacing[4],   // 16px
  },
  
  // リストアイテムのスペーシング
  listItem: {
    padding: spacing[4],  // 16px
    gap: spacing[3],      // 12px
    margin: spacing[2],   // 8px
  },
};

// インタラクティブ要素のスペーシング
export const interactiveSpacing = {
  // ボタンのパディング
  button: {
    sm: {
      horizontal: spacing[3], // 12px
      vertical: spacing[2],   // 8px
    },
    md: {
      horizontal: spacing[4], // 16px
      vertical: spacing[3],   // 12px
    },
    lg: {
      horizontal: spacing[6], // 24px
      vertical: spacing[4],   // 16px
    },
  },
  
  // インプットフィールドのパディング
  input: {
    horizontal: spacing[4], // 16px
    vertical: spacing[3],   // 12px
  },
  
  // タッチターゲットの最小サイズ
  touchTarget: {
    minSize: 44, // 44px (アクセシビリティガイドライン)
  },
};

// 特別なスペーシング（ネオン効果やグロー用）
export const effectSpacing = {
  // ネオンエフェクトのためのスペーシング
  neonGlow: {
    padding: spacing[2], // グロー効果のための余白
    margin: spacing[1],  // 他の要素との距離
  },
  
  // シャドウエフェクト用
  shadow: {
    padding: spacing[1], // シャドウのための余白
  },
};

// レスポンシブスペーシング
export const responsiveSpacing = {
  // 画面サイズに応じたコンテナパディング
  containerPadding: {
    xs: spacing[4],   // モバイル: 16px
    sm: spacing[6],   // タブレット: 24px
    md: spacing[8],   // デスクトップ: 32px
    lg: spacing[12],  // 大画面: 48px
  },
  
  // 画面サイズに応じたセクションマージン
  sectionMargin: {
    xs: spacing[8],   // モバイル: 32px
    sm: spacing[12],  // タブレット: 48px
    md: spacing[16],  // デスクトップ: 64px
    lg: spacing[20],  // 大画面: 80px
  },
  
  // 画面サイズに応じたグリッドギャップ
  gridGap: {
    xs: spacing[3],   // モバイル: 12px
    sm: spacing[4],   // タブレット: 16px
    md: spacing[6],   // デスクトップ: 24px
    lg: spacing[8],   // 大画面: 32px
  },
};

// よく使用されるスペーシングパターン
export const spacingPatterns = {
  // カードレイアウト
  card: {
    padding: componentSpacing.padding.lg,
    margin: componentSpacing.margin.md,
    gap: componentSpacing.gap.md,
  },
  
  // フォームレイアウト
  form: {
    fieldGap: spacing[4],        // フィールド間: 16px
    groupGap: spacing[6],        // グループ間: 24px
    sectionGap: spacing[8],      // セクション間: 32px
    buttonMargin: spacing[6],    // ボタンマージン: 24px
  },
  
  // ナビゲーション
  navigation: {
    itemPadding: spacing[4],     // アイテムパディング: 16px
    itemGap: spacing[2],         // アイテム間: 8px
    sectionGap: spacing[8],      // セクション間: 32px
  },
  
  // リストレイアウト
  list: {
    itemPadding: spacing[4],     // アイテムパディング: 16px
    itemGap: spacing[3],         // アイテム間: 12px
    groupGap: spacing[6],        // グループ間: 24px
  },
  
  // グリッドレイアウト
  grid: {
    gap: spacing[4],             // 基本ギャップ: 16px
    columnGap: spacing[4],       // 列ギャップ: 16px
    rowGap: spacing[6],          // 行ギャップ: 24px
  },
};

// ネガティブスペーシング（重なり効果用）
export const negativeSpacing = {
  1: -spacing[1],   // -4px
  2: -spacing[2],   // -8px
  3: -spacing[3],   // -12px
  4: -spacing[4],   // -16px
  6: -spacing[6],   // -24px
  8: -spacing[8],   // -32px
  12: -spacing[12], // -48px
};

// エクスポート用の統合スペーシングオブジェクト
export const spacingSystem = {
  spacing,
  component: componentSpacing,
  layout: layoutSpacing,
  interactive: interactiveSpacing,
  effect: effectSpacing,
  responsive: responsiveSpacing,
  patterns: spacingPatterns,
  negative: negativeSpacing,
};