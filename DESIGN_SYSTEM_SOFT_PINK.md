# やさしいピンクデザインシステム

このドキュメントでは、Nightlife Navigatorアプリケーション向けに開発された「やさしいピンクデザインシステム」について説明します。

## 概要

やさしいピンクをアクセントカラーとした、白地ベースで角丸・シャドウを用いた柔らかいカードUIが特徴のデザインシステムです。項目ごとのアイコンやラベルはブランドピンクで統一し、検索やナビゲーションボタンにもピンクを強調して使用しています。

## デザインコンセプト

### 基本理念
- **やさしさ**: 柔らかく親しみやすいピンクアクセント
- **清潔感**: 白地ベースで清潔感のあるデザイン
- **親しみやすさ**: 角丸と適度な余白で親近感を演出
- **統一感**: 全要素を角丸で統一したコンシステントなデザイン

### カラーパレット

#### プライマリカラー - やさしいピンク
```
primary: '#ea5a7b'    // メインピンク
primaryLight: '#f27790'
primaryDark: '#d63c5e'
```

#### セカンダリカラー - 補完的なローズピンク
```
secondary: '#f43f5e'  // ローズピンク
secondaryLight: '#fb7185'
secondaryDark: '#e11d48'
```

#### アクセントカラー - 明るいピンク
```
accent: '#ec4899'     // 明るいピンク
accentLight: '#f472b6'
accentDark: '#db2777'
```

#### 背景色 - 白地ベース
```
background: '#ffffff'          // メイン背景
backgroundSecondary: '#fafafa' // セカンダリ背景
surface: '#ffffff'             // カード背景
surfaceSoft: '#fefbfb'        // 極薄ピンク
pinkLight: '#fef7f7'          // ピンクライト
pinkSoft: '#fdeaeb'           // ピンクソフト
```

## デザイントークン

### スペーシングシステム
快適なスペーシングで余白を多めに取った見やすいレイアウト：

```javascript
spacing: {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
}
```

### 角丸システム
全要素を角丸で統一したやさしい印象：

```javascript
borderRadius: {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
}
```

### シャドウシステム
微妙で柔らかいシャドウ効果：

```javascript
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
  // ピンクアクセントシャドウ
  pink: {
    shadowColor: '#ea5a7b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
}
```

## コンポーネントライブラリ

### 基本コンポーネント

#### Button
5つのバリエーションを提供：
- `primary`: ピンクの塗りつぶしボタン
- `secondary`: セカンダリカラーの塗りつぶしボタン
- `outline`: ピンクのアウトラインボタン
- `ghost`: 透明背景のピンクテキストボタン
- `subtle`: 薄いピンク背景のボタン

#### Card
柔らかいカードUI：
- `default`: 基本的なカード
- `elevated`: 立体感のあるカード
- `soft`: 薄いピンク背景のカード
- `outlined`: アウトラインカード
- `filled`: ピンクライト背景のカード

#### Badge
ピンクアクセントのバッジ：
- `primary`: ピンクの塗りつぶしバッジ
- `soft`: ピンクライト背景のバッジ
- `outline`: ピンクのアウトラインバッジ

### フォームコンポーネント

#### Input
やさしいピンクフォーカス：
- フォーカス時にピンクボーダー
- エラー時の赤いボーダー
- 快適なパディング

#### SearchBar
ピンク強調の検索バー：
- ピンクの検索アイコン
- フォーカス時のピンクボーダー
- 角丸デザイン

### ナビゲーションコンポーネント

#### Header
ピンクアクセントのヘッダー：
- ピンクのアイコンボタン
- ピンクライト背景のボタン
- 微妙なシャドウ

#### TabBar
ピンク強調のタブナビゲーション：
- アクティブタブはピンク背景
- 白いアイコンとテキスト
- 角丸のタブアイテム

### レイアウトコンポーネント

#### Container
レスポンシブなコンテナ：
- パディング調整可能
- 背景色設定可能

#### Section
セクション区切り：
- ピンクのタイトル
- 快適なマージン

#### Grid
グリッドレイアウト：
- 列数指定可能
- ギャップ調整可能

### アニメーションコンポーネント

#### PinkGlow
やさしいピンクグロー：
- ピンクのシャドウグロー
- 微妙なアニメーション

#### LoadingSpinner
ピンクのスピナー：
- ピンクカラーのローディング
- 複数サイズ対応

## 実装例

### 基本的な使用例

```javascript
import { Button, Card, SearchBar, Header, TabBar } from './components/ui';

// ピンク強調のボタン
<Button variant="primary" size="md">
  詳細を見る
</Button>

// やさしいピンクの検索バー
<SearchBar placeholder="やさしく検索してください..." />

// ピンクアクセントのヘッダー
<Header 
  title="やさしいピンクヘッダー" 
  leftIcon="menu" 
  rightIcon="notifications" 
/>

// ピンク強調のタブナビゲーション
<TabBar 
  tabs={tabs} 
  activeTab={activeTab} 
  onTabChange={setActiveTab} 
/>
```

### 複合的なレイアウト例

```javascript
<Card variant="soft" style={{ padding: 32 }}>
  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
    <View>
      <Text variant="h4" style={{ color: '#ea5a7b' }}>GENTLE LOUNGE</Text>
      <Text variant="bodySmall" color="textSecondary">
        やさしく心地よい大人の空間
      </Text>
    </View>
    <Badge variant="soft">4.8 ★</Badge>
  </View>
  
  <Text variant="body" style={{ marginVertical: 16 }}>
    やさしいピンクの温かみのあるデザインで、心地よい雰囲気を演出。
  </Text>
  
  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Badge variant="outline" size="sm">ラウンジ</Badge>
      <Badge variant="outline" size="sm">やさしい</Badge>
    </View>
    <Button variant="primary" size="sm">
      詳細を見る
    </Button>
  </View>
</Card>
```

## デザインシステムファイル構成

```
src/design-system/
├── colors-soft-pink.js       # やさしいピンクカラーパレット
├── spacing-comfortable.js    # 快適なスペーシング
├── borders-rounded.js        # 角丸システム
└── shadows-soft-pink.js      # やさしいシャドウ

src/components/ui/
├── Button.js                 # ボタンコンポーネント
├── Card.js                   # カードコンポーネント
├── Input.js                  # インプットコンポーネント
├── Badge.js                  # バッジコンポーネント
├── Form.js                   # フォームコンポーネント
├── SearchBar.js              # 検索バーコンポーネント
├── Navigation.js             # ナビゲーションコンポーネント
├── Layout.js                 # レイアウトコンポーネント
└── Animation.js              # アニメーションコンポーネント

snack-demo/
├── App-soft-pink.js          # 基本デモ
└── App-complete.js           # 完全統合デモ
```

## 使用ガイドライン

### DO（推奨）
- やさしいピンク（#ea5a7b）をアクセントカラーとして使用
- 白地ベースで清潔感を保つ
- 角丸を統一して柔らかい印象を作る
- 余白を多めに取って見やすくする
- 検索・ナビゲーションボタンにピンクを強調

### DON'T（非推奨）
- 強すぎるピンクや原色の使用
- 角が鋭いデザイン要素
- 余白が少ない詰め込まれたレイアウト
- 一貫性のないカラー使用
- アクセシビリティを考慮しない配色

## アクセシビリティ

- コントラスト比4.5:1以上を確保
- タッチターゲットサイズ48px以上
- フォーカス時の視覚的フィードバック
- スクリーンリーダー対応

## レスポンシブデザイン

- モバイルファースト設計
- 快適なタッチインターフェース
- 画面サイズに応じた余白調整
- 読みやすいフォントサイズ

## まとめ

このやさしいピンクデザインシステムは、親しみやすさと清潔感を両立させた、現代的でアクセシブルなデザインを提供します。統一されたデザイン言語により、一貫したユーザー体験を実現し、ブランドアイデンティティを強化します。