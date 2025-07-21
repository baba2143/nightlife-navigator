import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, StatusBar, TouchableOpacity, Text as RNText } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Mini Design System for Snack Demo
const theme = {
  colors: {
    primary: '#00adff',
    secondary: '#e834ff',
    accent: '#34ff74',
    background: '#0a0a0a',
    surface: '#222222',
    text: '#ffffff',
    textSecondary: '#b1b1b1',
    border: '#515151',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
  },
};

// Text Component
const Text = ({ children, variant = 'body', color, style, ...props }) => {
  const variants = {
    h1: { fontSize: 32, fontWeight: 'bold', color: theme.colors.text },
    h2: { fontSize: 24, fontWeight: 'bold', color: theme.colors.text },
    h3: { fontSize: 20, fontWeight: '600', color: theme.colors.text },
    body: { fontSize: 16, color: theme.colors.text },
    caption: { fontSize: 14, color: theme.colors.textSecondary },
    neon: { 
      fontSize: 24, 
      fontWeight: 'bold', 
      color: theme.colors.primary,
      textShadowColor: theme.colors.primary,
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 10,
    },
  };

  const textColor = color ? theme.colors[color] || color : variants[variant].color;

  return (
    <RNText
      style={[
        variants[variant],
        { color: textColor },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
};

// Button Component
const Button = ({ children, variant = 'primary', size = 'md', onPress, style, ...props }) => {
  const [pressed, setPressed] = useState(false);

  const variants = {
    primary: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    secondary: {
      backgroundColor: theme.colors.secondary,
      borderColor: theme.colors.secondary,
    },
    accent: {
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.accent,
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: theme.colors.primary,
    },
  };

  const sizes = {
    sm: { paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
    md: { paddingHorizontal: 16, paddingVertical: 12, fontSize: 16 },
    lg: { paddingHorizontal: 24, paddingVertical: 16, fontSize: 18 },
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variants[variant],
        sizes[size],
        pressed && styles.buttonPressed,
        style,
      ]}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      {...props}
    >
      <Text 
        style={[
          { fontSize: sizes[size].fontSize },
          variant === 'outline' ? { color: theme.colors.primary } : { color: '#ffffff' }
        ]}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
};

// Card Component
const Card = ({ children, elevated = false, neonGlow = false, style, ...props }) => {
  return (
    <View
      style={[
        styles.card,
        elevated && styles.cardElevated,
        neonGlow && styles.cardNeonGlow,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

// Badge Component
const Badge = ({ children, variant = 'primary', style, ...props }) => {
  const variants = {
    primary: { backgroundColor: theme.colors.primary },
    secondary: { backgroundColor: theme.colors.secondary },
    accent: { backgroundColor: theme.colors.accent },
    success: { backgroundColor: theme.colors.accent },
    warning: { backgroundColor: '#ff9800' },
    error: { backgroundColor: '#ff3434' },
  };

  return (
    <View style={[styles.badge, variants[variant], style]} {...props}>
      <Text style={styles.badgeText}>{children}</Text>
    </View>
  );
};

// Icon Component (using Ionicons)
const Icon = ({ name, size = 24, color = theme.colors.text, neonGlow = false, style, ...props }) => {
  return (
    <View style={[neonGlow && styles.iconNeonGlow, style]}>
      <Ionicons
        name={name}
        size={size}
        color={color}
        {...props}
      />
    </View>
  );
};

// NeonPulse Animation Component (simplified)
const NeonPulse = ({ children, color = theme.colors.primary }) => {
  return (
    <View style={[styles.neonPulse, { shadowColor: color }]}>
      {children}
    </View>
  );
};

// Demo Sections
const ColorDemo = () => (
  <Card style={{ marginBottom: theme.spacing.lg }}>
    <Text variant="h3" style={{ marginBottom: theme.spacing.md }}>
      カラーパレット
    </Text>
    <View style={styles.colorRow}>
      <View style={[styles.colorSwatch, { backgroundColor: theme.colors.primary }]} />
      <Text style={{ marginLeft: theme.spacing.sm }}>Primary (Electric Blue)</Text>
    </View>
    <View style={styles.colorRow}>
      <View style={[styles.colorSwatch, { backgroundColor: theme.colors.secondary }]} />
      <Text style={{ marginLeft: theme.spacing.sm }}>Secondary (Neon Pink)</Text>
    </View>
    <View style={styles.colorRow}>
      <View style={[styles.colorSwatch, { backgroundColor: theme.colors.accent }]} />
      <Text style={{ marginLeft: theme.spacing.sm }}>Accent (Electric Green)</Text>
    </View>
  </Card>
);

const TypographyDemo = () => (
  <Card style={{ marginBottom: theme.spacing.lg }}>
    <Text variant="h3" style={{ marginBottom: theme.spacing.md }}>
      タイポグラフィ
    </Text>
    <Text variant="h1" style={{ marginBottom: theme.spacing.sm }}>
      ヘッディング 1
    </Text>
    <Text variant="h2" style={{ marginBottom: theme.spacing.sm }}>
      ヘッディング 2
    </Text>
    <Text variant="h3" style={{ marginBottom: theme.spacing.sm }}>
      ヘッディング 3
    </Text>
    <Text variant="body" style={{ marginBottom: theme.spacing.sm }}>
      ボディテキスト - 通常の本文に使用されます
    </Text>
    <Text variant="caption">
      キャプション - 補足情報に使用されます
    </Text>
    <NeonPulse>
      <Text variant="neon" style={{ marginTop: theme.spacing.md }}>
        ネオンエフェクト
      </Text>
    </NeonPulse>
  </Card>
);

const ButtonDemo = () => (
  <Card style={{ marginBottom: theme.spacing.lg }}>
    <Text variant="h3" style={{ marginBottom: theme.spacing.md }}>
      ボタン
    </Text>
    <View style={styles.buttonRow}>
      <Button variant="primary" size="sm">Primary</Button>
      <Button variant="secondary" size="sm">Secondary</Button>
      <Button variant="accent" size="sm">Accent</Button>
    </View>
    <View style={styles.buttonRow}>
      <Button variant="primary" size="md">Medium</Button>
      <Button variant="outline" size="md">Outline</Button>
    </View>
    <Button variant="primary" size="lg" style={{ marginTop: theme.spacing.sm }}>
      Large Button
    </Button>
  </Card>
);

const BadgeDemo = () => (
  <Card style={{ marginBottom: theme.spacing.lg }}>
    <Text variant="h3" style={{ marginBottom: theme.spacing.md }}>
      バッジ
    </Text>
    <View style={styles.badgeRow}>
      <Badge variant="primary">Primary</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="accent">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="error">Error</Badge>
    </View>
  </Card>
);

const IconDemo = () => (
  <Card style={{ marginBottom: theme.spacing.lg }}>
    <Text variant="h3" style={{ marginBottom: theme.spacing.md }}>
      アイコン
    </Text>
    <View style={styles.iconRow}>
      <Icon name="home" size={32} />
      <Icon name="search" size={32} color={theme.colors.primary} />
      <Icon name="heart" size={32} color={theme.colors.secondary} />
      <Icon name="star" size={32} color={theme.colors.accent} neonGlow />
      <Icon name="settings" size={32} />
    </View>
    <Text variant="caption" style={{ marginTop: theme.spacing.sm }}>
      ナイトライフアプリ用アイコンセット
    </Text>
  </Card>
);

const BarCardDemo = () => (
  <Card elevated neonGlow style={{ marginBottom: theme.spacing.lg }}>
    <View style={styles.barCardHeader}>
      <Text variant="h3">CYBER LOUNGE</Text>
      <Badge variant="accent">4.8 ⭐</Badge>
    </View>
    <Text variant="body" style={{ marginVertical: theme.spacing.sm }}>
      最新のサイバーパンク風バーで、ネオンライトと未来的な音楽を楽しめます。
    </Text>
    <View style={styles.barCardFooter}>
      <View style={styles.barCardTags}>
        <Badge variant="primary" style={{ marginRight: theme.spacing.xs }}>バー</Badge>
        <Badge variant="secondary" style={{ marginRight: theme.spacing.xs }}>クラブ</Badge>
        <Badge variant="accent">ネオン</Badge>
      </View>
      <Button variant="primary" size="sm">
        詳細
      </Button>
    </View>
  </Card>
);

// Main App Component
export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <NeonPulse>
            <Text variant="neon" style={styles.title}>
              NIGHTLIFE NAVIGATOR
            </Text>
          </NeonPulse>
          <Text variant="body" style={styles.subtitle}>
            サイバーパンク・デザインシステム
          </Text>
        </View>

        <View style={styles.content}>
          <ColorDemo />
          <TypographyDemo />
          <ButtonDemo />
          <BadgeDemo />
          <IconDemo />
          
          <Text variant="h2" style={{ marginBottom: theme.spacing.md, textAlign: 'center' }}>
            実装例
          </Text>
          <BarCardDemo />
          
          <Card style={{ marginBottom: theme.spacing.xl }}>
            <Text variant="h3" style={{ marginBottom: theme.spacing.md }}>
              特徴
            </Text>
            <Text variant="body" style={{ marginBottom: theme.spacing.sm }}>
              ✨ サイバーパンク/ネオン風デザイン
            </Text>
            <Text variant="body" style={{ marginBottom: theme.spacing.sm }}>
              📱 レスポンシブデザイン対応
            </Text>
            <Text variant="body" style={{ marginBottom: theme.spacing.sm }}>
              ♿ アクセシビリティ準拠
            </Text>
            <Text variant="body" style={{ marginBottom: theme.spacing.sm }}>
              🎨 複数テーマバリアント
            </Text>
            <Text variant="body">
              ⚡ パフォーマンス最適化
            </Text>
          </Card>
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
  header: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  title: {
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
  },
  content: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  
  // Card Styles
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardElevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  cardNeonGlow: {
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  
  // Button Styles
  button: {
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  
  // Badge Styles
  badge: {
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  
  // Color Demo Styles
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: theme.borderRadius.sm,
  },
  
  // Icon Styles
  iconRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  iconNeonGlow: {
    shadowColor: theme.colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  
  // Neon Pulse Effect
  neonPulse: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  
  // Bar Card Demo Styles
  barCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  barCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  barCardTags: {
    flexDirection: 'row',
    flex: 1,
  },
});