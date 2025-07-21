import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, StatusBar, TouchableOpacity, Text as RNText, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// やさしいピンクデザインシステム for Snack Demo
const theme = {
  colors: {
    // プライマリ - やさしいピンク
    primary: '#ea5a7b',
    primaryLight: '#f27790',
    primaryDark: '#d63c5e',
    
    // セカンダリ - 補完的なローズピンク
    secondary: '#f43f5e',
    secondaryLight: '#fb7185',
    secondaryDark: '#e11d48',
    
    // アクセント - 明るいピンク
    accent: '#ec4899',
    accentLight: '#f472b6',
    accentDark: '#db2777',
    
    // やさしい背景色
    background: '#ffffff',
    backgroundSecondary: '#fafafa',
    backgroundTertiary: '#f5f5f5',
    
    // カード背景
    surface: '#ffffff',
    surfaceElevated: '#ffffff',
    surfaceSoft: '#fefbfb',
    
    // ピンクアクセント背景
    pinkLight: '#fef7f7',
    pinkSoft: '#fdeaeb',
    pinkAccent: '#fef7f7',
    
    // やさしいテキストカラー
    text: '#1a1a1a',
    textSecondary: '#666666',
    textTertiary: '#999999',
    textDisabled: '#cccccc',
    
    // やさしいボーダーカラー
    border: '#f0f0f0',
    borderLight: '#f8f8f8',
    borderMedium: '#e8e8e8',
    borderStrong: '#d0d0d0',
    
    // 状態カラー
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    
    // 白・黒
    white: '#ffffff',
    black: '#000000',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
  
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    full: 9999,
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.07,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.07,
      shadowRadius: 6,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 15,
      elevation: 5,
    },
    pink: {
      shadowColor: '#ea5a7b',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 4,
    },
  },
};

// やさしいピンクテキストコンポーネント
const Text = ({ children, variant = 'body', color, size, weight, style, ...props }) => {
  const variants = {
    displayLarge: { fontSize: 48, fontWeight: '700', color: theme.colors.text },
    displayMedium: { fontSize: 36, fontWeight: '600', color: theme.colors.text },
    h1: { fontSize: 32, fontWeight: '600', color: theme.colors.text },
    h2: { fontSize: 24, fontWeight: '600', color: theme.colors.text },
    h3: { fontSize: 20, fontWeight: '600', color: theme.colors.text },
    h4: { fontSize: 18, fontWeight: '600', color: theme.colors.text },
    body: { fontSize: 16, fontWeight: '400', color: theme.colors.text },
    bodySmall: { fontSize: 14, fontWeight: '400', color: theme.colors.textSecondary },
    caption: { fontSize: 12, fontWeight: '400', color: theme.colors.textTertiary },
    button: { fontSize: 14, fontWeight: '500', color: theme.colors.text },
  };

  const sizeMap = {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
  };

  const weightMap = {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  };

  const textColor = color ? theme.colors[color] || color : variants[variant].color;
  const fontSize = size ? sizeMap[size] || size : variants[variant].fontSize;
  const fontWeight = weight ? weightMap[weight] || weight : variants[variant].fontWeight;

  return (
    <RNText
      style={[
        {
          fontSize,
          fontWeight,
          color: textColor,
          lineHeight: fontSize * 1.5,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
};

// やさしいピンクボタンコンポーネント
const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  icon,
  onPress, 
  style, 
  ...props 
}) => {
  const variants = {
    primary: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
      textColor: theme.colors.white,
    },
    secondary: {
      backgroundColor: theme.colors.secondary,
      borderColor: theme.colors.secondary,
      textColor: theme.colors.white,
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: theme.colors.primary,
      textColor: theme.colors.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      textColor: theme.colors.primary,
    },
    subtle: {
      backgroundColor: theme.colors.surfaceSoft,
      borderColor: theme.colors.borderLight,
      textColor: theme.colors.text,
    },
  };

  const sizes = {
    sm: { 
      paddingHorizontal: theme.spacing.md, 
      paddingVertical: theme.spacing.sm, 
      fontSize: 14,
      borderRadius: theme.borderRadius.md,
      minHeight: 48,
    },
    md: { 
      paddingHorizontal: theme.spacing.lg, 
      paddingVertical: theme.spacing.md, 
      fontSize: 16,
      borderRadius: theme.borderRadius.md,
      minHeight: 56,
    },
    lg: { 
      paddingHorizontal: theme.spacing.xl, 
      paddingVertical: theme.spacing.lg, 
      fontSize: 18,
      borderRadius: theme.borderRadius.lg,
      minHeight: 64,
    },
  };

  const variantStyle = variants[variant];
  const sizeStyle = sizes[size];

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variantStyle,
        sizeStyle,
        theme.shadows.sm,
        disabled && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      {...props}
    >
      <View style={styles.buttonContent}>
        {icon && <View style={styles.buttonIcon}>{icon}</View>}
        <Text style={{ fontSize: sizeStyle.fontSize, color: variantStyle.textColor, fontWeight: '500' }}>
          {children}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// やさしいピンクカードコンポーネント
const Card = ({ children, variant = 'default', elevated = false, style, ...props }) => {
  const variants = {
    default: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      ...theme.shadows.sm,
    },
    elevated: {
      backgroundColor: theme.colors.surfaceElevated,
      borderColor: theme.colors.borderLight,
      ...theme.shadows.md,
    },
    soft: {
      backgroundColor: theme.colors.surfaceSoft,
      borderColor: theme.colors.borderLight,
      ...theme.shadows.sm,
    },
    outlined: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.borderMedium,
      borderWidth: 1,
    },
    filled: {
      backgroundColor: theme.colors.pinkLight,
      borderColor: theme.colors.primary,
      borderWidth: 1,
      ...theme.shadows.sm,
    },
  };

  let selectedVariant = variants.default;
  
  if (elevated) {
    selectedVariant = { ...selectedVariant, ...variants.elevated };
  }
  
  if (variant !== 'default') {
    selectedVariant = { ...selectedVariant, ...variants[variant] };
  }

  return (
    <View
      style={[
        styles.card,
        selectedVariant,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

// やさしいピンクバッジコンポーネント
const Badge = ({ children, variant = 'default', size = 'md', style, ...props }) => {
  const variants = {
    default: { backgroundColor: theme.colors.borderLight, textColor: theme.colors.text },
    primary: { backgroundColor: theme.colors.primary, textColor: theme.colors.white },
    secondary: { backgroundColor: theme.colors.secondary, textColor: theme.colors.white },
    success: { backgroundColor: theme.colors.success, textColor: theme.colors.white },
    warning: { backgroundColor: theme.colors.warning, textColor: theme.colors.white },
    error: { backgroundColor: theme.colors.error, textColor: theme.colors.white },
    outline: { 
      backgroundColor: 'transparent', 
      textColor: theme.colors.primary,
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    soft: {
      backgroundColor: theme.colors.pinkLight,
      textColor: theme.colors.primary,
    },
  };

  const sizes = {
    sm: { paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs, fontSize: 11 },
    md: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, fontSize: 12 },
    lg: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, fontSize: 14 },
  };

  const variantStyle = variants[variant];
  const sizeStyle = sizes[size];

  return (
    <View 
      style={[
        styles.badge, 
        variantStyle, 
        sizeStyle,
        style,
      ]} 
      {...props}
    >
      <Text style={{ fontSize: sizeStyle.fontSize, color: variantStyle.textColor, fontWeight: '500' }}>
        {children}
      </Text>
    </View>
  );
};

// やさしいピンクアイコンコンポーネント
const Icon = ({ name, size = 24, color = theme.colors.text, style, ...props }) => {
  return (
    <Ionicons
      name={name}
      size={size}
      color={color}
      style={style}
      {...props}
    />
  );
};

// やさしいピンク検索バーコンポーネント
const SearchBar = ({ placeholder = "やさしく検索...", style, ...props }) => {
  const [focused, setFocused] = useState(false);
  
  return (
    <View style={[
      styles.searchBar,
      focused && styles.searchBarFocused,
      style,
    ]}>
      <Icon 
        name="search" 
        size={20} 
        color={theme.colors.primary} 
        style={styles.searchIcon}
      />
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textTertiary}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
    </View>
  );
};

// デモセクション
const HeroSection = () => (
  <View style={styles.hero}>
    <Text variant="displayLarge" style={styles.heroTitle}>
      NIGHTLIFE NAVIGATOR
    </Text>
    <Text variant="body" color="textSecondary" style={styles.heroSubtitle}>
      やさしいピンクデザインシステム
    </Text>
  </View>
);

const ColorDemo = () => (
  <Card variant="elevated" style={styles.section}>
    <Text variant="h3" style={styles.sectionTitle}>やさしいカラーパレット</Text>
    <View style={styles.colorGrid}>
      <View style={styles.colorItem}>
        <View style={[styles.colorSwatch, { backgroundColor: theme.colors.primary }]} />
        <Text variant="caption">Primary</Text>
      </View>
      <View style={styles.colorItem}>
        <View style={[styles.colorSwatch, { backgroundColor: theme.colors.secondary }]} />
        <Text variant="caption">Secondary</Text>
      </View>
      <View style={styles.colorItem}>
        <View style={[styles.colorSwatch, { backgroundColor: theme.colors.accent }]} />
        <Text variant="caption">Accent</Text>
      </View>
      <View style={styles.colorItem}>
        <View style={[styles.colorSwatch, { backgroundColor: theme.colors.success }]} />
        <Text variant="caption">Success</Text>
      </View>
      <View style={styles.colorItem}>
        <View style={[styles.colorSwatch, { backgroundColor: theme.colors.warning }]} />
        <Text variant="caption">Warning</Text>
      </View>
      <View style={styles.colorItem}>
        <View style={[styles.colorSwatch, { backgroundColor: theme.colors.error }]} />
        <Text variant="caption">Error</Text>
      </View>
    </View>
  </Card>
);

const ComponentDemo = () => (
  <Card variant="elevated" style={styles.section}>
    <Text variant="h3" style={styles.sectionTitle}>やさしいコンポーネント</Text>
    
    <View style={styles.componentSection}>
      <Text variant="h4" style={styles.componentTitle}>検索バー（ピンク強調）</Text>
      <SearchBar placeholder="やさしく検索してください..." />
    </View>

    <View style={styles.componentSection}>
      <Text variant="h4" style={styles.componentTitle}>ボタン（ピンク強調）</Text>
      <View style={styles.buttonGrid}>
        <Button variant="primary" size="md">Primary</Button>
        <Button variant="secondary" size="md">Secondary</Button>
        <Button variant="outline" size="md">Outline</Button>
        <Button variant="ghost" size="md">Ghost</Button>
        <Button variant="subtle" size="md">Subtle</Button>
      </View>
    </View>

    <View style={styles.componentSection}>
      <Text variant="h4" style={styles.componentTitle}>バッジ</Text>
      <View style={styles.badgeGrid}>
        <Badge variant="primary">Primary</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="soft">Soft Pink</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="outline">Outline</Badge>
      </View>
    </View>

    <View style={styles.componentSection}>
      <Text variant="h4" style={styles.componentTitle}>アイコン（ピンク）</Text>
      <View style={styles.iconGrid}>
        <Icon name="home" size={28} color={theme.colors.primary} />
        <Icon name="search" size={28} color={theme.colors.primary} />
        <Icon name="heart" size={28} color={theme.colors.primary} />
        <Icon name="star" size={28} color={theme.colors.primary} />
        <Icon name="settings" size={28} color={theme.colors.primary} />
      </View>
    </View>
  </Card>
);

const ExampleDemo = () => (
  <Card variant="elevated" style={styles.section}>
    <Text variant="h3" style={styles.sectionTitle}>やさしいカードUI例</Text>
    
    <Card variant="soft" style={styles.exampleCard}>
      <View style={styles.exampleHeader}>
        <View>
          <Text variant="h4" color="primary">GENTLE LOUNGE</Text>
          <Text variant="bodySmall" color="textSecondary">
            やさしく心地よい大人の空間
          </Text>
        </View>
        <Badge variant="soft">4.8 ★</Badge>
      </View>
      
      <Text variant="body" style={styles.exampleBody}>
        やさしいピンクの温かみのあるデザインで、心地よい雰囲気を演出。
        角丸と適度な余白で、親しみやすさを表現しています。
      </Text>
      
      <View style={styles.exampleFooter}>
        <View style={styles.exampleTags}>
          <Badge variant="outline" size="sm">ラウンジ</Badge>
          <Badge variant="outline" size="sm">やさしい</Badge>
          <Badge variant="outline" size="sm">ピンク</Badge>
        </View>
        <Button variant="primary" size="sm">
          詳細を見る
        </Button>
      </View>
    </Card>
  </Card>
);

const FeatureDemo = () => (
  <Card variant="elevated" style={styles.section}>
    <Text variant="h3" style={styles.sectionTitle}>やさしいデザインの特徴</Text>
    <View style={styles.featureList}>
      <View style={styles.featureItem}>
        <Icon name="checkmark-circle" size={20} color={theme.colors.primary} />
        <Text variant="body" style={styles.featureText}>
          やさしいピンクアクセント
        </Text>
      </View>
      <View style={styles.featureItem}>
        <Icon name="checkmark-circle" size={20} color={theme.colors.primary} />
        <Text variant="body" style={styles.featureText}>
          白地ベースで清潔感
        </Text>
      </View>
      <View style={styles.featureItem}>
        <Icon name="checkmark-circle" size={20} color={theme.colors.primary} />
        <Text variant="body" style={styles.featureText}>
          角丸・シャドウで柔らかさ
        </Text>
      </View>
      <View style={styles.featureItem}>
        <Icon name="checkmark-circle" size={20} color={theme.colors.primary} />
        <Text variant="body" style={styles.featureText}>
          余白を多めに取って見やすく
        </Text>
      </View>
      <View style={styles.featureItem}>
        <Icon name="checkmark-circle" size={20} color={theme.colors.primary} />
        <Text variant="body" style={styles.featureText}>
          全要素を角丸で統一
        </Text>
      </View>
    </View>
  </Card>
);

// メインアプリコンポーネント
export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <HeroSection />
        <View style={styles.content}>
          <ColorDemo />
          <ComponentDemo />
          <ExampleDemo />
          <FeatureDemo />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  
  // Hero Section
  hero: {
    alignItems: 'center',
    paddingVertical: theme.spacing['3xl'],
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
  },
  heroTitle: {
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    color: theme.colors.primary,
  },
  heroSubtitle: {
    textAlign: 'center',
  },
  
  // Content
  content: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.xl,
  },
  
  // Sections
  section: {
    padding: theme.spacing.xl,
  },
  sectionTitle: {
    marginBottom: theme.spacing.lg,
    color: theme.colors.primary,
  },
  
  // Color Demo
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.lg,
  },
  colorItem: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  colorSwatch: {
    width: 50,
    height: 50,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  
  // Component Demo
  componentSection: {
    marginBottom: theme.spacing.xl,
  },
  componentTitle: {
    marginBottom: theme.spacing.lg,
    color: theme.colors.primary,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  iconGrid: {
    flexDirection: 'row',
    gap: theme.spacing.xl,
    alignItems: 'center',
  },
  
  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  searchBarFocused: {
    borderColor: theme.colors.primary,
    ...theme.shadows.md,
  },
  searchIcon: {
    marginRight: theme.spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
  },
  
  // Example Demo
  exampleCard: {
    padding: theme.spacing.xl,
  },
  exampleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  exampleBody: {
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },
  exampleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exampleTags: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    flex: 1,
  },
  
  // Feature Demo
  featureList: {
    gap: theme.spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  featureText: {
    flex: 1,
  },
  
  // Base Component Styles
  button: {
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: theme.spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  
  card: {
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  
  badge: {
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
  },
});