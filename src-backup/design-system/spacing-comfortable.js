/**
 * 快適なスペーシングシステム定義
 * 余白を多めに取った見やすいレイアウト
 */

// ベーススペーシング（より多めの余白）
export const spacing = {
  0: 0,
  1: 4,     // 0.25rem
  2: 8,     // 0.5rem
  3: 12,    // 0.75rem
  4: 16,    // 1rem
  5: 20,    // 1.25rem
  6: 24,    // 1.5rem
  7: 28,    // 1.75rem
  8: 32,    // 2rem
  9: 36,    // 2.25rem
  10: 40,   // 2.5rem
  12: 48,   // 3rem
  14: 56,   // 3.5rem
  16: 64,   // 4rem
  20: 80,   // 5rem
  24: 96,   // 6rem
  28: 112,  // 7rem
  32: 128,  // 8rem
  40: 160,  // 10rem
  48: 192,  // 12rem
  56: 224,  // 14rem
  64: 256,  // 16rem
  
  // 特別なサイズ
  px: 1,     // 1px
  0.5: 2,    // 0.125rem
  1.5: 6,    // 0.375rem
  2.5: 10,   // 0.625rem
  3.5: 14,   // 0.875rem
};

// 快適なコンポーネントスペーシング
export const componentSpacing = {
  // パディング（より多めに）
  padding: {
    xs: spacing[3],    // 12px
    sm: spacing[4],    // 16px
    md: spacing[6],    // 24px
    lg: spacing[8],    // 32px
    xl: spacing[10],   // 40px
    '2xl': spacing[12], // 48px
    '3xl': spacing[16], // 64px
  },
  
  // マージン（より多めに）
  margin: {
    xs: spacing[4],    // 16px
    sm: spacing[6],    // 24px
    md: spacing[8],    // 32px
    lg: spacing[10],   // 40px
    xl: spacing[12],   // 48px
    '2xl': spacing[16], // 64px
    '3xl': spacing[20], // 80px
  },
  
  // ギャップ（Flexbox/Grid用）
  gap: {
    xs: spacing[2],    // 8px
    sm: spacing[4],    // 16px
    md: spacing[6],    // 24px
    lg: spacing[8],    // 32px
    xl: spacing[10],   // 40px
    '2xl': spacing[12], // 48px
  },
  
  // 内側の余白
  inner: {
    xs: spacing[2],    // 8px
    sm: spacing[3],    // 12px
    md: spacing[4],    // 16px
    lg: spacing[6],    // 24px
    xl: spacing[8],    // 32px
  },
};

// レイアウト用スペーシング（余白重視）
export const layoutSpacing = {
  // セクション間のスペーシング
  section: {
    xs: spacing[12],   // 48px
    sm: spacing[16],   // 64px
    md: spacing[20],   // 80px
    lg: spacing[24],   // 96px
    xl: spacing[32],   // 128px
  },
  
  // コンテナのパディング
  container: {
    xs: spacing[6],    // 24px
    sm: spacing[8],    // 32px
    md: spacing[10],   // 40px
    lg: spacing[12],   // 48px
    xl: spacing[16],   // 64px
  },
  
  // カードのスペーシング
  card: {
    padding: spacing[8],     // 32px
    paddingLarge: spacing[10], // 40px
    gap: spacing[6],         // 24px
    margin: spacing[6],      // 24px
    marginLarge: spacing[8], // 32px
  },
  
  // リストアイテムのスペーシング
  listItem: {
    padding: spacing[6],     // 24px
    paddingLarge: spacing[8], // 32px
    gap: spacing[4],         // 16px
    margin: spacing[3],      // 12px
  },
  
  // グリッドのスペーシング
  grid: {
    gap: spacing[6],         // 24px
    gapLarge: spacing[8],    // 32px
    columnGap: spacing[6],   // 24px
    rowGap: spacing[8],      // 32px
  },
};

// インタラクティブ要素のスペーシング
export const interactiveSpacing = {
  // ボタンのパディング
  button: {
    sm: {
      horizontal: spacing[4],  // 16px
      vertical: spacing[2],    // 8px
    },
    md: {
      horizontal: spacing[6],  // 24px
      vertical: spacing[3],    // 12px
    },
    lg: {
      horizontal: spacing[8],  // 32px
      vertical: spacing[4],    // 16px
    },
    xl: {
      horizontal: spacing[10], // 40px
      vertical: spacing[5],    // 20px
    },
  },
  
  // インプットフィールドのパディング
  input: {
    horizontal: spacing[4],  // 16px
    vertical: spacing[3],    // 12px
    large: {
      horizontal: spacing[5], // 20px
      vertical: spacing[4],   // 16px
    },
  },
  
  // タッチターゲットの最小サイズ
  touchTarget: {
    minSize: 48,            // 48px（推奨）
    comfortable: 56,        // 56px（快適）
    large: 64,             // 64px（大きめ）
  },
  
  // アイコンのスペーシング
  icon: {
    padding: spacing[2],     // 8px
    margin: spacing[2],      // 8px
    gap: spacing[3],         // 12px
  },
};

// ナビゲーション用スペーシング
export const navigationSpacing = {
  // ヘッダー
  header: {
    padding: spacing[6],     // 24px
    height: spacing[16],     // 64px
    gap: spacing[4],         // 16px
  },
  
  // タブバー
  tabBar: {
    padding: spacing[4],     // 16px
    height: spacing[20],     // 80px
    itemPadding: spacing[4], // 16px
    gap: spacing[2],         // 8px
  },
  
  // サイドバー
  sidebar: {
    padding: spacing[6],     // 24px
    width: spacing[64],      // 256px
    itemPadding: spacing[4], // 16px
    gap: spacing[3],         // 12px
  },
  
  // ブレッドクラム
  breadcrumb: {
    padding: spacing[4],     // 16px
    gap: spacing[2],         // 8px
    itemPadding: spacing[2], // 8px
  },
};

// フォーム用スペーシング
export const formSpacing = {
  // フィールド間のスペーシング
  fieldGap: spacing[6],        // 24px
  fieldGapLarge: spacing[8],   // 32px
  
  // グループ間のスペーシング
  groupGap: spacing[8],        // 32px
  groupGapLarge: spacing[10],  // 40px
  
  // セクション間のスペーシング
  sectionGap: spacing[12],     // 48px
  sectionGapLarge: spacing[16], // 64px
  
  // ラベルとフィールドの間
  labelGap: spacing[2],        // 8px
  
  // ヘルプテキストの間
  helpTextGap: spacing[2],     // 8px
  
  // ボタンエリアのマージン
  buttonMargin: spacing[8],    // 32px
  buttonMarginLarge: spacing[10], // 40px
  
  // エラーメッセージの間
  errorGap: spacing[2],        // 8px
};

// よく使用されるスペーシングパターン
export const spacingPatterns = {
  // カードレイアウト
  card: {
    padding: componentSpacing.padding.lg,      // 32px
    margin: componentSpacing.margin.md,        // 32px
    gap: componentSpacing.gap.md,              // 24px
    headerPadding: componentSpacing.padding.md, // 24px
    bodyPadding: componentSpacing.padding.lg,  // 32px
    footerPadding: componentSpacing.padding.md, // 24px
  },
  
  // モーダルレイアウト
  modal: {
    padding: componentSpacing.padding.xl,      // 40px
    headerPadding: componentSpacing.padding.lg, // 32px
    bodyPadding: componentSpacing.padding.xl,  // 40px
    footerPadding: componentSpacing.padding.lg, // 32px
    gap: componentSpacing.gap.lg,              // 32px
  },
  
  // リストレイアウト
  list: {
    itemPadding: layoutSpacing.listItem.padding,     // 24px
    itemGap: layoutSpacing.listItem.gap,             // 16px
    groupGap: componentSpacing.gap.xl,               // 40px
    headerPadding: componentSpacing.padding.md,      // 24px
  },
  
  // グリッドレイアウト
  grid: {
    gap: layoutSpacing.grid.gap,                     // 24px
    columnGap: layoutSpacing.grid.columnGap,         // 24px
    rowGap: layoutSpacing.grid.rowGap,               // 32px
    containerPadding: layoutSpacing.container.md,    // 40px
  },
  
  // 検索レイアウト
  search: {
    containerPadding: componentSpacing.padding.lg,   // 32px
    inputPadding: interactiveSpacing.input.large,    // 20px/16px
    buttonPadding: interactiveSpacing.button.md,     // 24px/12px
    resultGap: componentSpacing.gap.md,              // 24px
  },
  
  // ナビゲーションレイアウト
  navigation: {
    padding: navigationSpacing.header.padding,       // 24px
    itemPadding: navigationSpacing.tabBar.itemPadding, // 16px
    gap: navigationSpacing.header.gap,               // 16px
  },
};

// レスポンシブスペーシング
export const responsiveSpacing = {
  // 画面サイズに応じたコンテナパディング
  containerPadding: {
    xs: spacing[4],     // モバイル: 16px
    sm: spacing[6],     // タブレット: 24px
    md: spacing[8],     // デスクトップ: 32px
    lg: spacing[10],    // 大画面: 40px
    xl: spacing[12],    // 超大画面: 48px
  },
  
  // 画面サイズに応じたセクションマージン
  sectionMargin: {
    xs: spacing[12],    // モバイル: 48px
    sm: spacing[16],    // タブレット: 64px
    md: spacing[20],    // デスクトップ: 80px
    lg: spacing[24],    // 大画面: 96px
    xl: spacing[32],    // 超大画面: 128px
  },
  
  // 画面サイズに応じたカードパディング
  cardPadding: {
    xs: spacing[4],     // モバイル: 16px
    sm: spacing[6],     // タブレット: 24px
    md: spacing[8],     // デスクトップ: 32px
    lg: spacing[10],    // 大画面: 40px
  },
  
  // 画面サイズに応じたグリッドギャップ
  gridGap: {
    xs: spacing[4],     // モバイル: 16px
    sm: spacing[6],     // タブレット: 24px
    md: spacing[8],     // デスクトップ: 32px
    lg: spacing[10],    // 大画面: 40px
  },
};

// 特別なスペーシング（より快適な体験のため）
export const specialSpacing = {
  // 読みやすさのための余白
  readability: {
    lineHeight: 1.6,           // 行間を広めに
    paragraphGap: spacing[4],  // 段落間: 16px
    sectionGap: spacing[8],    // セクション間: 32px
  },
  
  // アイコンと文字の間
  iconText: {
    gap: spacing[3],           // 12px
    gapLarge: spacing[4],      // 16px
  },
  
  // 角丸のためのパディング調整
  rounded: {
    paddingAdjustment: spacing[2], // 8px
    marginAdjustment: spacing[1],  // 4px
  },
};

// エクスポート用の統合スペーシングオブジェクト
export const spacingSystem = {
  spacing,
  component: componentSpacing,
  layout: layoutSpacing,
  interactive: interactiveSpacing,
  navigation: navigationSpacing,
  form: formSpacing,
  patterns: spacingPatterns,
  responsive: responsiveSpacing,
  special: specialSpacing,
};