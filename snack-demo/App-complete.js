import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, StatusBar, TouchableOpacity, Text as RNText, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// 完全なやさしいピンクデザインシステム for Snack Demo
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

// テキストコンポーネント
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

// ボタンコンポーネント
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

// カードコンポーネント
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

// バッジコンポーネント
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

// アイコンコンポーネント
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

// 検索バーコンポーネント
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

// インプットコンポーネント
const Input = ({ label, error, style, ...props }) => {
  const [focused, setFocused] = useState(false);
  
  return (
    <View style={[styles.inputContainer, style]}>
      {label && (
        <Text variant="bodySmall" style={[styles.inputLabel, { color: theme.colors.text }]}>
          {label}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          focused && styles.inputFocused,
          error && styles.inputError,
        ]}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholderTextColor={theme.colors.textTertiary}
        {...props}
      />
      {error && (
        <Text variant="caption" style={[styles.inputErrorText, { color: theme.colors.error }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

// タブナビゲーション
const TabBar = ({ tabs, activeTab, onTabChange }) => {
  return (
    <View style={styles.tabBar}>
      {tabs.map((tab, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.tabItem,
            activeTab === index && styles.tabItemActive,
          ]}
          onPress={() => onTabChange(index)}
        >
          <Icon 
            name={tab.icon} 
            size={20} 
            color={activeTab === index ? theme.colors.white : theme.colors.textSecondary} 
          />
          <Text
            variant="caption"
            style={{
              color: activeTab === index ? theme.colors.white : theme.colors.textSecondary,
              fontWeight: activeTab === index ? '600' : '400',
            }}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ヘッダーコンポーネント
const Header = ({ title, leftIcon, rightIcon, onLeftPress, onRightPress }) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        {leftIcon && (
          <TouchableOpacity style={styles.headerButton} onPress={onLeftPress}>
            <Icon name={leftIcon} size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
        
        <Text variant="h4" style={styles.headerTitle}>
          {title}
        </Text>
        
        {rightIcon && (
          <TouchableOpacity style={styles.headerButton} onPress={onRightPress}>
            <Icon name={rightIcon} size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
      </View>
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
      やさしいピンクの完全なデザインシステム
    </Text>
  </View>
);

const ColorDemo = () => (
  <Card variant="elevated" style={styles.section}>
    <Text variant="h3" style={styles.sectionTitle}>やさしいカラーパレット</Text>
    <View style={styles.colorGrid}>
      {[
        { color: theme.colors.primary, name: 'Primary' },
        { color: theme.colors.secondary, name: 'Secondary' },
        { color: theme.colors.accent, name: 'Accent' },
        { color: theme.colors.success, name: 'Success' },
        { color: theme.colors.warning, name: 'Warning' },
        { color: theme.colors.error, name: 'Error' },
      ].map((item, index) => (
        <View key={index} style={styles.colorItem}>
          <View style={[styles.colorSwatch, { backgroundColor: item.color }]} />
          <Text variant="caption">{item.name}</Text>
        </View>
      ))}
    </View>
  </Card>
);

const ComponentShowcase = () => (
  <Card variant="elevated" style={styles.section}>
    <Text variant="h3" style={styles.sectionTitle}>コンポーネントショーケース</Text>
    
    <View style={styles.componentSection}>
      <Text variant="h4" style={styles.componentTitle}>検索バー（ピンク強調）</Text>
      <SearchBar placeholder="やさしく検索してください..." />
    </View>

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
      <Text variant="h4" style={styles.componentTitle}>フォーム</Text>
      <Input label="お名前" placeholder="名前を入力してください" />
      <Input label="メールアドレス" placeholder="email@example.com" />
      <Input label="パスワード" placeholder="パスワードを入力" error="パスワードが短すぎます" />
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
  </Card>
);

const NavigationDemo = () => {
  const [activeTab, setActiveTab] = useState(0);
  
  const tabs = [
    { icon: 'home', label: 'ホーム' },
    { icon: 'search', label: '検索' },
    { icon: 'heart', label: 'お気に入り' },
    { icon: 'person', label: 'プロフィール' },
  ];

  return (
    <Card variant="elevated" style={styles.section}>
      <Text variant="h3" style={styles.sectionTitle}>ナビゲーション</Text>
      
      <View style={styles.componentSection}>
        <Text variant="h4" style={styles.componentTitle}>ヘッダー</Text>
        <Header 
          title="やさしいピンクヘッダー" 
          leftIcon="menu" 
          rightIcon="notifications" 
        />
      </View>

      <View style={styles.componentSection}>
        <Text variant="h4" style={styles.componentTitle}>タブナビゲーション</Text>
        <TabBar 
          tabs={tabs} 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
      </View>
    </Card>
  );
};

const ExampleDemo = () => (
  <Card variant="elevated" style={styles.section}>
    <Text variant="h3" style={styles.sectionTitle}>実装例</Text>
    
    <Card variant="soft" style={styles.exampleCard}>
      <View style={styles.exampleHeader}>
        <View>
          <Text variant="h4" style={{ color: theme.colors.primary }}>GENTLE LOUNGE</Text>
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
    <Text variant="h3" style={styles.sectionTitle}>デザインシステムの特徴</Text>
    <View style={styles.featureList}>
      {[
        'やさしいピンクアクセント',
        '白地ベースで清潔感',
        '角丸・シャドウで柔らかさ',
        '余白を多めに取って見やすく',
        '全要素を角丸で統一',
        'ピンク強調のナビゲーション',
        'アクセシビリティ配慮',
        'レスポンシブデザイン',
      ].map((feature, index) => (
        <View key={index} style={styles.featureItem}>
          <Icon name="checkmark-circle" size={20} color={theme.colors.primary} />
          <Text variant="body" style={styles.featureText}>
            {feature}
          </Text>
        </View>
      ))}
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
          <ComponentShowcase />
          <NavigationDemo />
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
  
  // Components
  componentSection: {
    marginBottom: theme.spacing.xl,
  },
  componentTitle: {
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
  
  // Button Grid
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  
  // Badge Grid
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
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
    marginBottom: theme.spacing.lg,
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
  
  // Input
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    marginBottom: theme.spacing.sm,
    fontWeight: '500',
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontSize: 16,
    color: theme.colors.text,
    ...theme.shadows.sm,
  },
  inputFocused: {
    borderColor: theme.colors.primary,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  inputErrorText: {
    marginTop: theme.spacing.sm,
    fontWeight: '500',
  },
  
  // Header
  header: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.pinkLight,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: theme.colors.primary,
    fontWeight: '600',
  },
  
  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  tabItemActive: {
    backgroundColor: theme.colors.primary,
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