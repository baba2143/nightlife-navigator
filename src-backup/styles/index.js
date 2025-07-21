import { StyleSheet } from 'react-native';

// シンプル・清潔感カラーパレット（メイン：白、サブ：ピンク）
export const colors = {
  // メインカラー（白）
  primary: '#FFFFFF', // 純白
  primaryDark: '#F8F8F8', // 薄いグレー
  primaryLight: '#FFFFFF', // 純白
  
  // サブカラー（ピンク）
  secondary: '#FF69B4', // ホットピンク
  secondaryDark: '#E91E63', // ディープピンク
  secondaryLight: '#FFB6C1', // ライトピンク
  
  // アクセントカラー
  accent: '#FF1493', // ディープピンク
  accentDark: '#C71585', // ダークピンク
  accentLight: '#FFC0CB', // ピンク
  
  // 背景色（白ベース）
  background: '#FFFFFF', // 純白
  surface: '#FFFFFF', // 純白
  surfaceLight: '#FAFAFA', // 薄いグレー
  surfaceDark: '#F5F5F5', // ライトグレー
  
  // テキスト色（黒ベース）
  text: '#333333', // ダークグレー
  textSecondary: '#666666', // ミディアムグレー
  textTertiary: '#999999', // ライトグレー
  textDisabled: '#CCCCCC', // 薄いグレー
  textNeon: '#FF69B4', // ピンクテキスト
  
  // ボーダー色
  border: '#E0E0E0', // ライトグレー
  borderLight: '#F0F0F0', // 薄いグレー
  borderNeon: '#FF69B4', // ピンクボーダー
  
  // 状態色
  success: '#4CAF50', // グリーン
  warning: '#FF9800', // オレンジ
  error: '#F44336', // レッド
  info: '#2196F3', // ブルー
  
  // グラデーション
  gradient: {
    primary: ['#FFFFFF', '#F8F8F8'], // 白グラデーション
    secondary: ['#FF69B4', '#E91E63'], // ピンクグラデーション
    accent: ['#FF1493', '#C71585'], // ディープピンクグラデーション
    night: ['#FFFFFF', '#FAFAFA'], // 白グラデーション
    neon: ['#FF69B4', '#FFB6C1'], // ピンクミックス
    success: ['#4CAF50', '#45A049'],
    warning: ['#FF9800', '#F57C00'],
    error: ['#F44336', '#D32F2F']
  },
  
  // グロー効果（ピンク）
  glow: {
    primary: '0 0 10px rgba(255, 255, 255, 0.3)',
    secondary: '0 0 10px rgba(255, 105, 180, 0.3)',
    accent: '0 0 10px rgba(255, 20, 147, 0.3)',
    success: '0 0 10px rgba(76, 175, 80, 0.3)',
    warning: '0 0 10px rgba(255, 152, 0, 0.3)',
    error: '0 0 10px rgba(244, 67, 54, 0.3)'
  },
  
  // シャドウ（ピンク）
  shadow: {
    primary: '0 2px 8px rgba(0, 0, 0, 0.1)',
    secondary: '0 2px 8px rgba(255, 105, 180, 0.2)',
    accent: '0 2px 8px rgba(255, 20, 147, 0.2)'
  }
};

// タイポグラフィ
export const typography = {
  // フォントサイズ
  sizes: {
    xs: 10,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
    '4xl': 28,
    '5xl': 32
  },
  
  // フォントウェイト
  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800'
  },
  
  // 行間
  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8
  }
};

// スペーシング
export const spacing = {
  xs: 4,
  sm: 8,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 56
};

// ボーダー半径
export const borderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999
};

// シャドウ
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16
  }
};

// 共通スタイル
export const commonStyles = StyleSheet.create({
  // レイアウト
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  
  row: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  
  column: {
    flexDirection: 'column'
  },
  
  center: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  
  spaceBetween: {
    justifyContent: 'space-between'
  },
  
  spaceAround: {
    justifyContent: 'space-around'
  },
  
  // ヘッダー
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface
  },
  
  headerTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.secondary
  },
  
  backButton: {
    color: colors.secondary,
    fontSize: typography.sizes.lg
  },
  
  // カード
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  
  cardNeon: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.base,
    borderWidth: 2,
    borderColor: colors.secondary,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5
  },
  
  cardGlow: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.base,
    borderWidth: 2,
    borderColor: colors.secondary,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10
  },
  
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  
  cardTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text
  },
  
  cardContent: {
    marginTop: spacing.sm
  },
  
  // ネオンボタン
  button: {
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.base,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  
  buttonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8
  },
  
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderColor: colors.secondary,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6
  },
  
  buttonAccent: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8
  },
  
  buttonDanger: {
    backgroundColor: colors.error,
    borderColor: colors.error,
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8
  },
  
  buttonDisabled: {
    backgroundColor: colors.textDisabled,
    borderColor: colors.textDisabled,
    opacity: 0.6,
    shadowOpacity: 0
  },
  
  buttonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text
  },
  
  buttonTextPrimary: {
    color: colors.secondaryDark
  },
  
  buttonTextSecondary: {
    color: colors.primary
  },
  
  buttonTextDanger: {
    color: colors.text
  },
  
  // 入力フィールド
  input: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.base,
    padding: spacing.base,
    fontSize: typography.sizes.base,
    color: colors.text,
    minHeight: 48
  },
  
  inputFocused: {
    borderColor: colors.primary
  },
  
  inputError: {
    borderColor: colors.error
  },
  
  inputLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs
  },
  
  inputErrorText: {
    fontSize: typography.sizes.sm,
    color: colors.error,
    marginTop: spacing.xs
  },
  
  // テキスト
  text: {
    fontSize: typography.sizes.base,
    color: colors.text,
    lineHeight: typography.lineHeights.normal * typography.sizes.base
  },
  
  textSmall: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary
  },
  
  textLarge: {
    fontSize: typography.sizes.lg,
    color: colors.text
  },
  
  textBold: {
    fontWeight: typography.weights.bold
  },
  
  textPrimary: {
    color: colors.primary,
    textShadowColor: colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8
  },
  
  textSecondary: {
    color: colors.textSecondary
  },
  
  textTertiary: {
    color: colors.textTertiary
  },
  
  textNeon: {
    color: colors.primary,
    textShadowColor: colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    fontWeight: typography.weights.bold
  },
  
  textGlow: {
    color: colors.secondary,
    textShadowColor: colors.secondary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
    fontWeight: typography.weights.bold
  },
  
  // バッジ
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start'
  },
  
  badgePrimary: {
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4
  },
  
  badgeSuccess: {
    backgroundColor: colors.success,
    borderWidth: 1,
    borderColor: colors.success,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4
  },
  
  badgeWarning: {
    backgroundColor: colors.warning,
    borderWidth: 1,
    borderColor: colors.warning,
    shadowColor: colors.warning,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4
  },
  
  badgeError: {
    backgroundColor: colors.error,
    borderWidth: 1,
    borderColor: colors.error,
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4
  },
  
  badgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text
  },
  
  // セパレーター
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.base
  },
  
  separatorVertical: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.base
  },
  
  // ローディング
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  
  loadingText: {
    marginTop: spacing.base,
    fontSize: typography.sizes.base,
    color: colors.textSecondary
  },
  
  // エラー
  error: {
    padding: spacing.base,
    backgroundColor: colors.error + '20',
    borderRadius: borderRadius.base,
    borderWidth: 1,
    borderColor: colors.error
  },
  
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.base
  },
  
  // 成功
  success: {
    padding: spacing.base,
    backgroundColor: colors.success + '20',
    borderRadius: borderRadius.base,
    borderWidth: 1,
    borderColor: colors.success
  },
  
  successText: {
    color: colors.success,
    fontSize: typography.sizes.base
  },
  
  // モーダル
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '90%',
    maxHeight: '80%',
    ...shadows.xl
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base
  },
  
  modalTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.primary
  },
  
  modalCloseButton: {
    padding: spacing.xs
  },
  
  // リスト
  list: {
    flex: 1
  },
  
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  
  listItemContent: {
    flex: 1,
    marginLeft: spacing.base
  },
  
  listItemTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.text,
    marginBottom: spacing.xs
  },
  
  listItemSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary
  },
  
  // グリッド
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.sm
  },
  
  gridItem: {
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.base
  },
  
  // タブ
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  
  tab: {
    flex: 1,
    paddingVertical: spacing.base,
    alignItems: 'center'
  },
  
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary
  },
  
  tabText: {
    fontSize: typography.sizes.base,
    color: colors.textSecondary
  },
  
  tabTextActive: {
    color: colors.primary,
    fontWeight: typography.weights.semibold
  },
  
  // アバター
  avatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight
  },
  
  avatarSmall: {
    width: 32,
    height: 32
  },
  
  avatarLarge: {
    width: 60,
    height: 60
  },
  
  // アイコン
  icon: {
    width: 24,
    height: 24,
    tintColor: colors.textSecondary
  },
  
  iconSmall: {
    width: 16,
    height: 16
  },
  
  iconLarge: {
    width: 32,
    height: 32
  },
  
  iconPrimary: {
    tintColor: colors.primary
  },
  
  // フローティングアクションボタン
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg
  },
  
  // スケルトンローディング
  skeleton: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.base
  },
  
  skeletonAnimated: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.base,
    opacity: 0.6
  }
});

// レスポンシブユーティリティ
export const responsive = {
  // ブレークポイント
  breakpoints: {
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200
  },
  
  // メディアクエリ（React Nativeでは使用不可だが、将来のWeb対応用）
  isSmallScreen: () => false,
  isMediumScreen: () => false,
  isLargeScreen: () => false,
  isXLargeScreen: () => false
};

// アニメーション設定
export const animations = {
  duration: {
    fast: 200,
    normal: 300,
    slow: 500
  },
  
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out'
  }
};

// エクスポート
export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  commonStyles,
  responsive,
  animations
}; 