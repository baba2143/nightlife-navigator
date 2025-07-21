# NightLife Navigator - Design System Demo

このSnackデモでは、NightLife Navigatorアプリのサイバーパンク/ネオン風デザインシステムを確認できます。

## 🚀 Snack Expoでの確認方法

### 方法1: Snack Web Editor
1. [Snack Expo](https://snack.expo.dev/) にアクセス
2. 新しいプロジェクトを作成
3. `App.js` の内容を上記のコードで置き換え
4. `package.json` の依存関係を確認・更新
5. プレビューでデザインシステムを確認

### 方法2: QRコードでモバイル確認
1. Expo Goアプリをスマートフォンにインストール
2. Snackで生成されたQRコードをスキャン
3. 実機でデザインシステムを体験

## 📱 デモ内容

### 1. カラーパレット
- **Primary**: Electric Blue (#00adff)
- **Secondary**: Neon Pink (#e834ff)  
- **Accent**: Electric Green (#34ff74)
- **Background**: Deep Black (#0a0a0a)

### 2. タイポグラフィ
- ヘッディング階層 (H1-H3)
- ボディテキスト
- キャプション
- ネオンエフェクト付きテキスト

### 3. コンポーネント
- **Button**: Primary, Secondary, Accent, Outline バリアント
- **Card**: Elevated, Neon Glow エフェクト
- **Badge**: 各種ステータス表示
- **Icon**: Ionicons使用、ネオングロー対応

### 4. 実装例
- バーカード表示
- ネオンパルスアニメーション（簡略版）
- サイバーパンク風レイアウト

## 🎨 デザインシステムの特徴

- **サイバーパンク美学**: 未来的なネオン効果
- **ダークテーマ**: 夜のナイトライフにマッチ
- **高コントラスト**: 視認性の確保
- **一貫性**: 統一されたスペーシングとカラー

## 📝 使用方法

### Snackコード
```javascript
// 基本的なコンポーネント使用例

// ネオンテキスト
<Text variant="neon">NIGHTLIFE NAVIGATOR</Text>

// ネオングローカード
<Card elevated neonGlow>
  <Text variant="h3">サイバーラウンジ</Text>
  <Badge variant="accent">4.8 ⭐</Badge>
</Card>

// サイバーパンクボタン
<Button variant="primary" size="lg">
  探索開始
</Button>
```

## 🔧 カスタマイズ

デモでは簡略化していますが、実際のデザインシステムでは以下が可能：

- 複数テーマバリアント切り替え
- アクセシビリティ設定
- 高度なアニメーション
- レスポンシブデザイン
- WCAG 2.1準拠のコントラスト

## 📱 動作確認ポイント

1. **カラーコントラスト**: 暗い背景での文字視認性
2. **タッチサイズ**: ボタンの押しやすさ
3. **ネオンエフェクト**: グロー効果の表示
4. **レスポンシブ**: 各種デバイスサイズでの表示
5. **パフォーマンス**: スクロールの滑らかさ

## 🌟 完全版との違い

このSnackデモは簡略版です。完全版には以下が含まれます：

- 高度なアニメーション（グリッチエフェクト等）
- アクセシビリティ機能
- 複数テーマ対応
- 完全なコンポーネントライブラリ
- TypeScript対応
- 詳細なドキュメント

---

**デザインシステムの詳細**: [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)  
**コンポーネントガイド**: [src/components/ui/README.md](../src/components/ui/README.md)