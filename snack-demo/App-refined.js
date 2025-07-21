import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, StatusBar, TouchableOpacity, Text as RNText } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Refined Design System for Snack Demo
const theme = {
  colors: {
    // Primary - Sophisticated Blue
    primary: '#0ea5e9',
    primaryLight: '#38bdf8',
    primaryDark: '#0284c7',
    
    // Secondary - Elegant Purple
    secondary: '#a855f7',
    secondaryLight: '#c084fc',
    secondaryDark: '#9333ea',
    
    // Accent - Refined Green
    accent: '#22c55e',
    accentLight: '#4ade80',
    accentDark: '#16a34a',
    
    // Neutrals - Clean and Modern
    background: '#fafafa',
    surface: '#ffffff',
    surfaceElevated: '#ffffff',
    
    // Text
    text: '#18181b',
    textSecondary: '#52525b',
    textTertiary: '#71717a',
    textDisabled: '#a1a1aa',
    
    // Borders
    border: '#e4e4e7',
    borderLight: '#f4f4f5',
    borderFocus: '#0ea5e9',
    
    // Status colors
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  
  shadows: {
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
};

// Refined Text Component
const Text = ({ children, variant = 'body', color, size, weight, style, ...props }) => {
  const variants = {
    displayLarge: { fontSize: 48, fontWeight: '800', color: theme.colors.text },
    displayMedium: { fontSize: 36, fontWeight: '700', color: theme.colors.text },
    h1: { fontSize: 32, fontWeight: '700', color: theme.colors.text },
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
    extrabold: '800',
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
          fontFamily: 'system-ui, -apple-system, sans-serif',
        },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
};

// Refined Button Component
const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  onPress, 
  style, 
  ...props 
}) => {
  const variants = {
    primary: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
      textColor: '#ffffff',
    },
    secondary: {
      backgroundColor: theme.colors.secondary,
      borderColor: theme.colors.secondary,
      textColor: '#ffffff',
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
      backgroundColor: theme.colors.borderLight,
      borderColor: theme.colors.borderLight,
      textColor: theme.colors.text,
    },
  };

  const sizes = {
    sm: { 
      paddingHorizontal: theme.spacing.sm * 1.5, 
      paddingVertical: theme.spacing.xs, 
      fontSize: 14,
      borderRadius: theme.borderRadius.md,
    },
    md: { 
      paddingHorizontal: theme.spacing.md, 
      paddingVertical: theme.spacing.sm, 
      fontSize: 16,
      borderRadius: theme.borderRadius.md,
    },
    lg: { 
      paddingHorizontal: theme.spacing.lg, 
      paddingVertical: theme.spacing.sm * 1.5, 
      fontSize: 18,
      borderRadius: theme.borderRadius.lg,
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
        disabled && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      {...props}
    >
      <Text style={{ fontSize: sizeStyle.fontSize, color: variantStyle.textColor }}>
        {children}
      </Text>
    </TouchableOpacity>
  );
};

// Refined Card Component
const Card = ({ children, variant = 'default', interactive = false, style, ...props }) => {
  const variants = {
    default: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      shadowColor: 'rgba(0, 0, 0, 0.1)',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 1,
      shadowRadius: 3,
      elevation: 2,
    },
    elevated: {
      backgroundColor: theme.colors.surfaceElevated,
      borderColor: theme.colors.border,
      shadowColor: 'rgba(0, 0, 0, 0.1)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 6,
      elevation: 4,
    },
    outlined: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderWidth: 1,
    },
    filled: {
      backgroundColor: theme.colors.borderLight,
      borderColor: 'transparent',
    },
  };

  const CardComponent = interactive ? TouchableOpacity : View;

  return (
    <CardComponent
      style={[
        styles.card,
        variants[variant],
        style,
      ]}
      activeOpacity={interactive ? 0.95 : 1}
      {...props}
    >
      {children}
    </CardComponent>
  );
};

// Refined Badge Component
const Badge = ({ children, variant = 'default', size = 'md', style, ...props }) => {
  const variants = {
    default: { backgroundColor: theme.colors.borderLight, textColor: theme.colors.text },
    primary: { backgroundColor: theme.colors.primary, textColor: '#ffffff' },
    secondary: { backgroundColor: theme.colors.secondary, textColor: '#ffffff' },
    success: { backgroundColor: theme.colors.success, textColor: '#ffffff' },
    warning: { backgroundColor: theme.colors.warning, textColor: '#ffffff' },
    error: { backgroundColor: theme.colors.error, textColor: '#ffffff' },
    outline: { 
      backgroundColor: 'transparent', 
      textColor: theme.colors.primary,
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
  };

  const sizes = {
    sm: { paddingHorizontal: theme.spacing.xs, paddingVertical: 2, fontSize: 11 },
    md: { paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs, fontSize: 12 },
    lg: { paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs, fontSize: 14 },
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
      <Text style={{ fontSize: sizeStyle.fontSize, color: variantStyle.textColor }}>
        {children}
      </Text>
    </View>
  );
};

// Refined Icon Component
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

// Demo Sections
const HeroSection = () => (
  <View style={styles.hero}>
    <Text variant="displayLarge" style={styles.heroTitle}>
      NIGHTLIFE NAVIGATOR
    </Text>
    <Text variant="body" color="textSecondary" style={styles.heroSubtitle}>
      洗練されたデザインシステム
    </Text>
  </View>
);

const ColorDemo = () => (
  <Card variant="elevated" style={styles.section}>
    <Text variant="h3" style={styles.sectionTitle}>カラーパレット</Text>
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

const TypographyDemo = () => (
  <Card variant="elevated" style={styles.section}>
    <Text variant="h3" style={styles.sectionTitle}>タイポグラフィ</Text>
    <View style={styles.typographyList}>
      <Text variant="h1" style={styles.typographyItem}>見出し 1</Text>
      <Text variant="h2" style={styles.typographyItem}>見出し 2</Text>
      <Text variant="h3" style={styles.typographyItem}>見出し 3</Text>
      <Text variant="body" style={styles.typographyItem}>
        本文テキスト - 読みやすさを重視したデザイン
      </Text>
      <Text variant="bodySmall" style={styles.typographyItem}>
        小さなテキスト - 補足情報に使用
      </Text>
      <Text variant="caption">キャプション - 最小サイズのテキスト</Text>
    </View>
  </Card>
);

const ComponentDemo = () => (
  <Card variant="elevated" style={styles.section}>
    <Text variant="h3" style={styles.sectionTitle}>コンポーネント</Text>
    
    <View style={styles.componentSection}>
      <Text variant="h4" style={styles.componentTitle}>ボタン</Text>
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
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="error">Error</Badge>
        <Badge variant="outline">Outline</Badge>
      </View>
    </View>

    <View style={styles.componentSection}>
      <Text variant="h4" style={styles.componentTitle}>アイコン</Text>
      <View style={styles.iconGrid}>
        <Icon name="home" size={28} color={theme.colors.primary} />
        <Icon name="search" size={28} color={theme.colors.secondary} />
        <Icon name="heart" size={28} color={theme.colors.error} />
        <Icon name="star" size={28} color={theme.colors.warning} />
        <Icon name="settings" size={28} color={theme.colors.textSecondary} />
      </View>
    </View>
  </Card>
);

const ExampleDemo = () => (
  <Card variant="elevated" style={styles.section}>
    <Text variant="h3" style={styles.sectionTitle}>実装例</Text>
    
    <Card variant="outlined" style={styles.exampleCard}>
      <View style={styles.exampleHeader}>
        <View>
          <Text variant="h4">MODERN LOUNGE</Text>
          <Text variant="bodySmall" color="textSecondary">
            洗練された大人の空間
          </Text>
        </View>
        <Badge variant="success">4.8 ★</Badge>
      </View>
      
      <Text variant="body" style={styles.exampleBody}>
        モダンで洗練されたデザインのラウンジ。上質な音楽と落ち着いた雰囲気で、
        大人の夜を演出します。
      </Text>
      
      <View style={styles.exampleFooter}>
        <View style={styles.exampleTags}>
          <Badge variant="outline" size="sm">ラウンジ</Badge>
          <Badge variant="outline" size="sm">バー</Badge>
          <Badge variant="outline" size="sm">モダン</Badge>
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
    <Text variant="h3" style={styles.sectionTitle}>デザインの特徴</Text>
    <View style={styles.featureList}>
      <View style={styles.featureItem}>
        <Icon name="checkmark-circle" size={20} color={theme.colors.success} />
        <Text variant="body" style={styles.featureText}>
          シンプルで洗練されたデザイン
        </Text>
      </View>
      <View style={styles.featureItem}>
        <Icon name="checkmark-circle" size={20} color={theme.colors.success} />
        <Text variant="body" style={styles.featureText}>
          モダンなカラーパレット
        </Text>
      </View>
      <View style={styles.featureItem}>
        <Icon name="checkmark-circle" size={20} color={theme.colors.success} />
        <Text variant="body" style={styles.featureText}>
          一貫性のあるコンポーネント
        </Text>
      </View>
      <View style={styles.featureItem}>
        <Icon name="checkmark-circle" size={20} color={theme.colors.success} />
        <Text variant="body" style={styles.featureText}>
          優れた読みやすさ
        </Text>
      </View>
      <View style={styles.featureItem}>
        <Icon name="checkmark-circle" size={20} color={theme.colors.success} />
        <Text variant="body" style={styles.featureText}>
          アクセシビリティ配慮
        </Text>
      </View>
    </View>
  </Card>
);

// Main App Component
export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <HeroSection />
        <View style={styles.content}>
          <ColorDemo />
          <TypographyDemo />
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
    paddingVertical: theme.spacing['2xl'],
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  heroTitle: {
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  heroSubtitle: {
    textAlign: 'center',
  },
  
  // Content
  content: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  
  // Sections
  section: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
  },
  
  // Color Demo
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  colorItem: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
  },
  
  // Typography Demo
  typographyList: {
    gap: theme.spacing.sm,
  },
  typographyItem: {
    marginBottom: theme.spacing.xs,
  },
  
  // Component Demo
  componentSection: {
    marginBottom: theme.spacing.lg,
  },
  componentTitle: {
    marginBottom: theme.spacing.sm,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  iconGrid: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    alignItems: 'center',
  },
  
  // Example Demo
  exampleCard: {
    padding: theme.spacing.md,
  },
  exampleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  exampleBody: {
    lineHeight: 22,
    marginBottom: theme.spacing.md,
  },
  exampleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exampleTags: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    flex: 1,
  },
  
  // Feature Demo
  featureList: {
    gap: theme.spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
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