# NightLife Navigator デザインシステム

## 概要

NightLife Navigator のデザインシステムは、サイバーパンク/ネオン風のナイトライフアプリ向けに設計された包括的なUIコンポーネントライブラリです。一貫性のあるユーザーエクスペリエンスと効率的な開発を実現するため、デザイントークン、コンポーネント、ガイドラインを統合しています。

## デザイン原則

### 1. サイバーパンク美学
- **ネオンカラー**: 鮮やかな電光色（ブルー、ピンク、グリーン）
- **ダークベース**: 深い黒とグレーの背景
- **グロー効果**: ネオンライトのような光る効果
- **未来感**: 近未来的なフォントとアイコン

### 2. ユーザビリティファースト
- **アクセシビリティ**: WCAG 2.1 AA準拠
- **レスポンシブデザイン**: あらゆるデバイスサイズに対応
- **直感的操作**: ナイトライフ特化の UI/UX

### 3. パフォーマンス重視
- **最適化されたアニメーション**: モーション軽減設定対応
- **効率的なレンダリング**: React Native最適化
- **軽量設計**: 最小限のバンドルサイズ

## カラーシステム

### プライマリカラー（エレクトリックブルー）
```javascript
primary: {
  50: '#e0f4ff',   // 最も薄い
  100: '#b3e5ff',
  200: '#80d6ff',
  300: '#4dc7ff',
  400: '#26baff',
  500: '#00adff',  // メインカラー
  600: '#009ceb',
  700: '#0088cc',
  800: '#0074ad',
  900: '#005580',  // 最も濃い
}
```

### セカンダリカラー（ネオンピンク）
```javascript
secondary: {
  500: '#e834ff',  // メインカラー
  // ... 他のシェード
}
```

### アクセントカラー（エレクトリックグリーン）
```javascript
accent: {
  500: '#34ff74',  // メインカラー
  // ... 他のシェード
}
```

### セマンティックカラー
- **Success**: アクセントグリーン
- **Warning**: エレクトリックオレンジ (#ff9800)
- **Error**: エレクトリックレッド (#ff3434)
- **Info**: プライマリブルー

## タイポグラフィ

### フォントファミリー
- **Heading**: Orbitron (未来的なディスプレイフォント)
- **Primary**: Inter (読みやすいサンセリフ)
- **Mono**: Fira Code (コード・データ表示用)
- **Display**: Orbitron + Electrolize (特別な表示用)

### フォントサイズスケール
```javascript
xs: 12px
sm: 14px
base: 16px    // ベースサイズ
lg: 18px
xl: 20px
2xl: 24px
3xl: 30px
4xl: 36px
5xl: 48px
6xl: 64px
display: 96px // 特大サイズ
```

### テキストスタイル
- **h1-h6**: ヘッダー用スタイル
- **body**: 本文用スタイル
- **button**: ボタン用スタイル
- **caption**: キャプション用スタイル
- **neonTitle**: ネオンエフェクト付きタイトル

## スペーシングシステム

### ベーススペーシング（4px基準）
```javascript
0: 0px
1: 4px     // 0.25rem
2: 8px     // 0.5rem
3: 12px    // 0.75rem
4: 16px    // 1rem
6: 24px    // 1.5rem
8: 32px    // 2rem
12: 48px   // 3rem
16: 64px   // 4rem
20: 80px   // 5rem
24: 96px   // 6rem
```

### コンポーネント特化スペーシング
- **Button**: paddingX: 16px, paddingY: 12px
- **Card**: padding: 24px
- **Input**: paddingX: 16px, paddingY: 12px

## シャドウ・エレベーション

### 標準シャドウ
```javascript
sm: '0 1px 3px rgba(0, 0, 0, 0.6)'
md: '0 4px 6px rgba(0, 0, 0, 0.6)'
lg: '0 10px 15px rgba(0, 0, 0, 0.6)'
xl: '0 20px 25px rgba(0, 0, 0, 0.6)'
```

### ネオンシャドウ
```javascript
blueGlow: '0 0 15px #00adff'
pinkGlow: '0 0 15px #e834ff'
greenGlow: '0 0 15px #34ff74'
```

## コンポーネントライブラリ

### 基本コンポーネント
- **Button**: プライマリ、セカンダリ、アウトライン等のバリアント
- **Card**: エレベーション、ネオングロー対応
- **Input**: フォーカス時のネオンエフェクト
- **Text**: ネオンテキスト、グラデーションテキスト
- **Badge**: 評価、ステータス表示用
- **Modal**: アニメーション付きモーダル

### レイアウトコンポーネント
- **Container**: レスポンシブコンテナ
- **Row/Col**: グリッドシステム
- **Flex**: フレックスボックスユーティリティ
- **Spacer**: レスポンシブスペーサー

### アイコンシステム
- **Icon**: 統一されたアイコンコンポーネント
- **NeonIcon**: ネオングロー付きアイコン
- **IconButton**: インタラクティブアイコンボタン
- **RatingStars**: 評価表示用星アイコン

### アニメーションコンポーネント
- **NeonPulse**: ネオンパルスエフェクト
- **GlitchEffect**: サイバーパンクなグリッチエフェクト
- **FadeInOut**: フェードアニメーション
- **ScaleAnimation**: スケールアニメーション

## テーマシステム

### テーマバリアント
1. **Default**: サイバーパンクミックス
2. **Neon Blue**: ブルー中心のクール
3. **Neon Pink**: ピンク中心のビビッド
4. **Cyberpunk Green**: グリーン中心のマトリックス

### テーマ切り替え
```javascript
import { ThemeSelector, useTheme } from './src/components/ui';

// テーマプロバイダーで包む
<ThemeProvider>
  <App />
</ThemeProvider>

// コンポーネント内でテーマを使用
const { theme, setTheme } = useTheme();
```

## レスポンシブデザイン

### ブレークポイント
```javascript
xs: 0px      // モバイル
sm: 576px    // 大きなモバイル
md: 768px    // タブレット
lg: 992px    // デスクトップ
xl: 1200px   // 大きなデスクトップ
2xl: 1400px  // 超大型画面
```

### レスポンシブ使用例
```javascript
// プロパティベース
<Text size={{ xs: 'sm', md: 'lg' }}>
  レスポンシブテキスト
</Text>

// フックベース
const { isPhone, isTablet } = useResponsive();

// 表示制御
<Show above="md">
  デスクトップでのみ表示
</Show>
```

## アクセシビリティ

### WCAG 2.1 準拠
- **コントラスト比**: AA準拠（4.5:1以上）
- **タッチターゲット**: 最小44px×44px
- **フォーカス可視化**: 明確なフォーカスインジケーター
- **スクリーンリーダー**: 適切なアクセシビリティラベル

### アクセシビリティ機能
```javascript
// アクセシビリティプロバイダー
<AccessibilityProvider>
  <App />
</AccessibilityProvider>

// アクセシブルなコンポーネント使用
<Button
  accessibilityLabel="メニューを開く"
  accessibilityHint="ナビゲーションメニューが表示されます"
>
  メニュー
</Button>
```

### 設定可能な機能
- **モーション軽減**: アニメーション無効化
- **高コントラスト**: 高コントラストカラー
- **フォントサイズ**: 拡大縮小対応
- **タッチターゲット**: サイズ調整

## 使用方法

### インストール
デザインシステムは既にプロジェクトに組み込まれています。

### 基本的な使用
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

function App() {
  return (
    <ThemeProvider>
      <Container>
        <Row>
          <Col md={6}>
            <Card elevated neonGlow>
              <Text variant="h2" neonGlow color="primary">
                ナイトライフを探索
              </Text>
              <Text variant="body">
                最高のバーとクラブを発見しよう
              </Text>
              <Button variant="primary" icon={<Icon name="search" />}>
                探索開始
              </Button>
            </Card>
          </Col>
        </Row>
      </Container>
    </ThemeProvider>
  );
}
```

### アニメーション使用
```javascript
import { NeonPulse, GlitchEffect, FadeInOut } from './src/components/ui';

function AnimatedComponent() {
  return (
    <NeonPulse color="blue" intensity="high">
      <GlitchEffect frequency={2000}>
        <FadeInOut visible={true}>
          <Text variant="neonTitle">CYBER NIGHT</Text>
        </FadeInOut>
      </GlitchEffect>
    </NeonPulse>
  );
}
```

## 開発ガイドライン

### コンポーネント作成
1. **デザイントークン使用**: theme.jsからスタイルを取得
2. **アクセシビリティ配慮**: 適切なプロパティを設定
3. **レスポンシブ対応**: ブレークポイントを考慮
4. **テーマ対応**: テーマ切り替えに対応

### スタイリング
```javascript
// デザイントークンを使用
const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.spacing[4],
    backgroundColor: theme.colors.background.surface,
    borderRadius: 12,
  },
  text: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSizes.base,
    fontFamily: theme.typography.fontFamilies.primary,
  },
});
```

### パフォーマンス考慮
- **useNativeDriver**: アニメーションで可能な限り使用
- **モーション軽減**: accessibility設定を確認
- **メモ化**: 重いコンポーネントはメモ化

## トラブルシューティング

### よくある問題

#### 1. ネオンエフェクトが表示されない
- **原因**: プラットフォーム制限
- **解決**: React Nativeではelevationプロパティを使用

#### 2. フォントが読み込まれない
- **原因**: フォントファイルの不足
- **解決**: expo-fontでフォントを読み込み

#### 3. アニメーションが動かない
- **原因**: useNativeDriverの設定
- **解決**: アニメーション対象プロパティを確認

### デバッグ支援
```javascript
// テーマデバッグ
console.log('Current theme:', theme.name);

// アクセシビリティデバッグ
const { testAccessibility } = useAccessibility();
console.log('Accessibility test:', testAccessibility(component));
```

## 今後の拡張

### 計画中の機能
- **3Dエフェクト**: より立体的なネオンエフェクト
- **音響連動**: 音楽に合わせたアニメーション
- **AR対応**: 拡張現実インターフェース
- **パーソナライゼーション**: ユーザー好み学習

### コントリビューション
デザインシステムの改善にご協力ください：
1. **Issue報告**: バグや改善提案
2. **Pull Request**: 新機能やバグ修正
3. **ドキュメント**: ガイドラインの改善

## 参考資料

- [React Native公式ドキュメント](https://reactnative.dev/)
- [Expo公式ドキュメント](https://docs.expo.dev/)
- [WCAG 2.1ガイドライン](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design](https://material.io/design)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

---

**最終更新**: 2025年7月16日  
**バージョン**: 1.0.0  
**作成者**: NightLife Navigator開発チーム