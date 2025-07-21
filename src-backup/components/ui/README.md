# UIコンポーネントライブラリ

NightLife Navigator のサイバーパンク/ネオン風デザインシステムベースのUIコンポーネントライブラリです。

## 📁 ディレクトリ構造

```
src/components/ui/
├── index.js                 # メインエクスポートファイル
├── README.md               # このファイル
├── Button.js               # ボタンコンポーネント
├── Card.js                 # カードコンポーネント
├── Input.js                # インプットコンポーネント
├── Text.js                 # テキストコンポーネント
├── Badge.js                # バッジコンポーネント
├── Modal.js                # モーダルコンポーネント
├── Icon.js                 # アイコンコンポーネント
├── Layout.js               # レイアウトコンポーネント
├── ThemeSelector.js        # テーマ選択コンポーネント
├── AccessibilityUtils.js   # アクセシビリティユーティリティ
└── AnimatedComponents.js   # アニメーションコンポーネント
```

## 🚀 クイックスタート

### 基本的な使用方法

```javascript
import {
  Button,
  Card,
  Text,
  Icon,
  ThemeProvider,
  Container,
  Row,
  Col
} from './src/components/ui';

function MyApp() {
  return (
    <ThemeProvider>
      <Container>
        <Card elevated neonGlow>
          <Text variant="h2" neonGlow>
            Welcome to NightLife
          </Text>
          <Button variant="primary">
            探索開始
          </Button>
        </Card>
      </Container>
    </ThemeProvider>
  );
}
```

## 📦 コンポーネント一覧

### 基本コンポーネント

#### Button
```javascript
<Button 
  variant="primary"           // primary | secondary | accent | outline | ghost
  size="md"                  // sm | md | lg
  disabled={false}
  loading={false}
  icon={<Icon name="search" />}
  onPress={() => {}}
  accessibilityLabel="検索ボタン"
>
  検索
</Button>
```

#### Card
```javascript
<Card 
  variant="default"          // default | elevated | neon | glass
  elevated={true}
  interactive={true}
  neonGlow={true}
  onPress={() => {}}
>
  <CardHeader>
    <Text variant="h4">カードタイトル</Text>
  </CardHeader>
  <CardBody>
    <Text>カードの内容</Text>
  </CardBody>
  <CardFooter>
    <Button variant="primary">アクション</Button>
  </CardFooter>
</Card>
```

#### Input
```javascript
<Input
  label="メールアドレス"
  placeholder="例: user@example.com"
  value={email}
  onChangeText={setEmail}
  error={emailError}
  leftIcon={<Icon name="email" />}
  keyboardType="email-address"
  accessibilityLabel="メールアドレス入力"
/>
```

#### Text
```javascript
<Text 
  variant="h1"               // h1-h6 | body | button | caption | label
  color="primary"            // primary | secondary | neonBlue | etc.
  size="lg"                  // xs | sm | base | lg | xl | 2xl | etc.
  weight="bold"              // thin | light | normal | medium | bold
  neonGlow={true}
  gradient={true}
  uppercase={true}
>
  ネオンタイトル
</Text>
```

#### Badge
```javascript
<Badge 
  variant="primary"          // primary | secondary | success | warning | error
  size="md"                  // sm | md | lg
  outlined={false}
  neonGlow={true}
  count={5}
  maxCount={99}
>
  新着
</Badge>

{/* 特殊バッジ */}
<NotificationBadge count={3} />
<StatusBadge status="online" />
<RatingBadge rating={4.5} />
<PriceBadge price={2500} currency="円" />
```

#### Modal
```javascript
<Modal
  visible={isVisible}
  onClose={() => setIsVisible(false)}
  title="確認"
  size="md"                  // sm | md | lg | full
  centered={true}
  closable={true}
  maskClosable={true}
  neonGlow={true}
  animationType="scale"      // scale | slide
>
  <Text>モーダルの内容</Text>
</Modal>

{/* 特殊モーダル */}
<ConfirmModal
  visible={showConfirm}
  title="削除確認"
  message="本当に削除しますか？"
  onConfirm={handleDelete}
  onCancel={() => setShowConfirm(false)}
/>

<AlertModal
  visible={showAlert}
  title="エラー"
  message="処理に失敗しました"
  onClose={() => setShowAlert(false)}
/>
```

#### Icon
```javascript
<Icon 
  name="home"                // アイコン名（ICON_NAMES参照）
  size={24}
  color="primary"
  variant="primary"          // default | primary | secondary | accent
  neonGlow={true}
  interactive={true}
  onPress={() => {}}
/>

{/* 特殊アイコン */}
<NeonIcon name="star" color="primary" />
<InteractiveIcon name="menu" onPress={toggleMenu} />
<StatusIcon status="online" />
<RatingStars rating={4.5} maxRating={5} />
<IconButton icon="settings" variant="primary" />
```

### レイアウトコンポーネント

#### Container
```javascript
<Container 
  fluid={false}              // フルワイズかどうか
  maxWidth="lg"              // sm | md | lg | xl | 2xl
  padding={true}
  centered={false}
>
  <Text>コンテンツ</Text>
</Container>
```

#### Row & Col
```javascript
<Row spacing="md" align="center" justify="space-between">
  <Col xs={12} md={6} lg={4}>
    <Card>カード1</Card>
  </Col>
  <Col xs={12} md={6} lg={4}>
    <Card>カード2</Card>
  </Col>
  <Col xs={12} md={12} lg={4}>
    <Card>カード3</Card>
  </Col>
</Row>
```

#### Flex
```javascript
<Flex 
  direction="row"            // row | column | row-reverse | column-reverse
  align="center"             // flex-start | center | flex-end | stretch
  justify="space-between"    // flex-start | center | flex-end | space-between
  wrap={true}
  gap="md"
>
  <Text>アイテム1</Text>
  <Text>アイテム2</Text>
</Flex>
```

#### Spacer
```javascript
<Spacer size="lg" />              {/* 垂直スペース */}
<Spacer size="md" horizontal />   {/* 水平スペース */}
<Spacer responsive />             {/* レスポンシブスペース */}
```

#### SafeLayout & ScrollLayout
```javascript
<SafeLayout backgroundColor="#0a0a0a">
  <ScrollLayout showsScrollIndicator={false}>
    <Container>
      <Text>スクロール可能なコンテンツ</Text>
    </Container>
  </ScrollLayout>
</SafeLayout>
```

#### Show & Hide
```javascript
<Show above="md">
  <Text>デスクトップでのみ表示</Text>
</Show>

<Hide below="lg">
  <Text>大画面でのみ非表示</Text>
</Hide>

<Show only="xs">
  <Text>モバイルでのみ表示</Text>
</Show>
```

### アニメーションコンポーネント

#### NeonPulse
```javascript
<NeonPulse 
  color="blue"               // blue | pink | green | white
  intensity="medium"         // low | medium | high
  duration={2000}
  autoStart={true}
>
  <Text variant="neonTitle">パルスするテキスト</Text>
</NeonPulse>
```

#### GlitchEffect
```javascript
<GlitchEffect 
  intensity="medium"         // low | medium | high
  frequency={3000}
  autoStart={true}
>
  <Text variant="neonTitle">グリッチテキスト</Text>
</GlitchEffect>
```

#### FadeInOut
```javascript
<FadeInOut 
  visible={isVisible}
  duration={300}
  delay={0}
  onAnimationComplete={() => console.log('完了')}
>
  <Card>フェードするカード</Card>
</FadeInOut>
```

#### ScaleAnimation
```javascript
<ScaleAnimation 
  scale={1}
  duration={300}
  easing="spring"            // spring | timing
>
  <Button>スケールするボタン</Button>
</ScaleAnimation>
```

#### SlideAnimation
```javascript
<SlideAnimation 
  direction="up"             // up | down | left | right
  distance={100}
  visible={isVisible}
>
  <Modal>スライドするモーダル</Modal>
</SlideAnimation>
```

#### StaggeredAnimation
```javascript
<StaggeredAnimation 
  staggerDelay={100}
  animationType="fadeIn"     // fadeIn | scale | slide
>
  <Text>アイテム1</Text>
  <Text>アイテム2</Text>
  <Text>アイテム3</Text>
</StaggeredAnimation>
```

## 🎨 テーマシステム

### テーマプロバイダー
```javascript
import { ThemeProvider, defaultTheme } from './src/components/ui';

function App() {
  return (
    <ThemeProvider initialTheme={defaultTheme}>
      {/* アプリのコンテンツ */}
    </ThemeProvider>
  );
}
```

### テーマ使用
```javascript
import { useTheme } from './src/components/ui';

function MyComponent() {
  const { theme, setTheme } = useTheme();
  
  return (
    <View style={{ backgroundColor: theme.colors.background.primary }}>
      <Text style={{ color: theme.colors.text.primary }}>
        テーマカラー使用
      </Text>
    </View>
  );
}
```

### テーマ切り替え
```javascript
import { ThemeSelector, ThemeToggleButton } from './src/components/ui';

function Settings() {
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  
  return (
    <>
      <ThemeToggleButton onPress={() => setShowThemeSelector(true)} />
      <ThemeSelector 
        visible={showThemeSelector}
        onClose={() => setShowThemeSelector(false)}
      />
    </>
  );
}
```

## ♿ アクセシビリティ

### アクセシビリティプロバイダー
```javascript
import { AccessibilityProvider } from './src/components/ui';

function App() {
  return (
    <AccessibilityProvider>
      <ThemeProvider>
        {/* アプリのコンテンツ */}
      </ThemeProvider>
    </AccessibilityProvider>
  );
}
```

### アクセシビリティフック
```javascript
import { useAccessibility, useFocusManagement } from './src/components/ui';

function MyComponent() {
  const { 
    isScreenReaderEnabled, 
    isReduceMotionEnabled,
    setAccessibilityPreferences 
  } = useAccessibility();
  
  const { setFocus, announceForScreenReader } = useFocusManagement();
  
  // アクセシビリティ設定に基づく処理
  if (isReduceMotionEnabled) {
    // アニメーションを無効化
  }
  
  return (
    <Button
      accessibilityLabel="メニューを開く"
      accessibilityHint="ナビゲーションメニューが表示されます"
      onPress={() => announceForScreenReader('メニューが開きました')}
    >
      メニュー
    </Button>
  );
}
```

### アクセシビリティユーティリティ
```javascript
import { 
  getAccessibilityProps,
  calculateContrastRatio,
  checkWCAGCompliance 
} from './src/components/ui';

// アクセシビリティプロパティ生成
const props = getAccessibilityProps({
  label: 'ボタン',
  hint: 'タップして実行',
  role: 'button',
  state: { disabled: false }
});

// コントラスト比チェック
const ratio = calculateContrastRatio('#ffffff', '#000000');
const isCompliant = checkWCAGCompliance(ratio, 'AA');
```

## 📱 レスポンシブデザイン

### レスポンシブフック
```javascript
import { useResponsive } from './src/components/ui';

function MyComponent() {
  const { 
    width, 
    height, 
    breakpoints, 
    isPhone, 
    isTablet, 
    isDesktop,
    currentBreakpoint 
  } = useResponsive();
  
  return (
    <View>
      <Text>画面幅: {width}px</Text>
      <Text>現在のブレークポイント: {currentBreakpoint}</Text>
      {isPhone && <Text>モバイル表示</Text>}
      {isTablet && <Text>タブレット表示</Text>}
      {isDesktop && <Text>デスクトップ表示</Text>}
    </View>
  );
}
```

### レスポンシブプロパティ
```javascript
// オブジェクト形式でブレークポイント別に指定
<Text size={{ xs: 'sm', md: 'lg', xl: '2xl' }}>
  レスポンシブテキスト
</Text>

<Container padding={{ xs: 16, md: 24, lg: 32 }}>
  レスポンシブパディング
</Container>
```

## 🔧 カスタマイズ

### カスタムテーマ作成
```javascript
import { createTheme, defaultTheme } from './src/components/ui';

const customTheme = createTheme({
  colors: {
    primary: {
      500: '#ff6b35',  // カスタムプライマリカラー
    },
  },
  typography: {
    fontFamilies: {
      heading: 'CustomFont, sans-serif',
    },
  },
});
```

### カスタムコンポーネント作成
```javascript
import { createStyledComponent, Button } from './src/components/ui';

// スタイル付きコンポーネント作成
const PrimaryButton = createStyledComponent(Button, {
  variant: 'primary',
  neonGlow: true,
  size: 'lg',
});

// 使用
<PrimaryButton onPress={handlePress}>
  カスタムボタン
</PrimaryButton>
```

### カスタムアニメーション
```javascript
import { useCustomAnimation } from './src/components/ui';

function MyComponent() {
  const { animValue, animate, spring } = useCustomAnimation({
    initialValue: 0
  });
  
  const handlePress = async () => {
    await animate(1, { duration: 500 });
    await spring(0, { tension: 100 });
  };
  
  return (
    <Animated.View style={{ opacity: animValue }}>
      <Button onPress={handlePress}>アニメーション実行</Button>
    </Animated.View>
  );
}
```

## 🛠️ 開発者向け情報

### 利用可能なアイコン
```javascript
import { ICON_NAMES } from './src/components/ui';

console.log(ICON_NAMES); // 利用可能なアイコン名一覧
```

### デザイントークンアクセス
```javascript
import { designTokens, defaultTheme } from './src/components/ui';

// デザイントークン使用
const spacing = designTokens.spacing.spacing[4]; // 16px
const primaryColor = defaultTheme.colors.primary[500]; // #00adff
```

### パフォーマンス最適化
```javascript
// メモ化でパフォーマンス向上
const MemoizedCard = React.memo(Card);

// アニメーションパフォーマンス
<NeonPulse 
  intensity="low"      // 軽量設定
  duration={3000}      // 長めの間隔
>
  <Text>最適化されたアニメーション</Text>
</NeonPulse>
```

## 📚 参考情報

- [完全なデザインシステムドキュメント](../../../DESIGN_SYSTEM.md)
- [React Native公式ドキュメント](https://reactnative.dev/)
- [Expo公式ドキュメント](https://docs.expo.dev/)
- [アクセシビリティガイドライン](https://www.w3.org/WAI/WCAG21/quickref/)

## 🤝 コントリビューション

改善提案やバグ報告は以下の方法で：

1. **Issue作成**: 新機能提案やバグ報告
2. **Pull Request**: 実装やドキュメント改善
3. **レビュー**: コードレビューやフィードバック

## 📄 ライセンス

このデザインシステムはNightLife Navigatorプロジェクトの一部です。