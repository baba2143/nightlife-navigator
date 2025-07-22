# 🚀 Vercel デプロイ実行ガイド

## ✅ 準備完了

### 🎯 現在の状況
- ✅ **環境変数生成済み**: `.env.production.real` に実際の値を設定
- ✅ **Git リポジトリ準備済み**: ローカルコミット完了
- ✅ **Vercel設定完了**: `vercel.json` でビルド・セキュリティ設定済み
- ✅ **セキュリティ検証済み**: 機密情報の適切な保護確認

---

## 🔥 **今すぐ実行: 3ステップデプロイ**

### **Step 1: GitHubにプッシュ** (2分)

```bash
# 現在のディレクトリで実行
cd /Users/makotobaba/Desktop/my-fresh-app

# GitHubに新しいリポジトリを作成してからプッシュ
# まず GitHub.com で新規リポジトリ「nightlife-navigator」を作成

# リモートリポジトリを追加
git remote add origin https://github.com/YOUR_USERNAME/nightlife-navigator.git

# プッシュ実行
git push -u origin main
```

### **Step 2: Vercel デプロイ** (3分)

#### 2.1 Vercel アカウント作成
1. [vercel.com](https://vercel.com/) にアクセス
2. **「Sign up with GitHub」** をクリック
3. GitHubアカウントで認証

#### 2.2 プロジェクト作成
1. **「New Project」** をクリック
2. **「nightlife-navigator」** リポジトリを選択
3. **「Import」** をクリック

#### 2.3 自動設定確認
- **Framework Preset**: "Other" (自動検出)
- **Build Command**: `npx expo export --platform web` (vercel.json で設定済み)
- **Output Directory**: `dist` (vercel.json で設定済み)
- **Install Command**: `npm install` (自動検出)

### **Step 3: 環境変数設定** (5分)

#### 3.1 環境変数画面へ
1. プロジェクト作成後、**「Environment Variables」** タブをクリック

#### 3.2 必須環境変数を追加
`.env.production.real` ファイルから以下をコピー&ペースト:

**🔐 セキュリティ (最重要)**:
```
JWT_SECRET = 9a71f3e360ed0899f673b50f3376d6ee3d542e8e70dd59a9e7a29a4524692e60
JWT_REFRESH_SECRET = b7f64c6298aa31f68aa2e96cb71dcb36a025b2fea614959a614ec0cd036f0310
ENCRYPTION_KEY = 02C8ewqTcafAao4NsAKe16tivEyAT6PgA/ZL+3vtR/c=
ENCRYPTION_IV = d40ee99c4b2c71e45159e25d0e4fb4ac
```

**📱 アプリ設定**:
```
EXPO_PUBLIC_ENV = production
EXPO_PUBLIC_APP_VERSION = 1.0.0
EXPO_PUBLIC_BUILD_NUMBER = 1
EXPO_PUBLIC_USE_MOCK_DATA = true
```

**🔧 API設定 (一旦そのまま設定、後で更新)**:
```
EXPO_PUBLIC_API_URL = https://api.nightlife-navigator.com
GOOGLE_MAPS_API_KEY = AIzaSy_YOUR_GOOGLE_MAPS_API_KEY_HERE
SENTRY_DSN = https://YOUR_SENTRY_DSN@o123456.ingest.sentry.io/7654321
```

#### 3.3 デプロイ実行
1. **「Deploy」** ボタンをクリック
2. 約2-3分でデプロイ完了
3. 自動生成URLが表示される（例: `https://nightlife-navigator-abc123.vercel.app`）

---

## 🎉 **デプロイ成功後の確認**

### ✅ 動作確認チェックリスト
- [ ] ホーム画面が正常に表示される
- [ ] タブナビゲーション（5つのタブ）が動作する
- [ ] 検索画面でエリア・ジャンル選択ができる
- [ ] 地図画面が表示される（位置情報許可後）
- [ ] お気に入り画面が表示される
- [ ] プロフィール画面で認証モーダルが開く

### 📊 パフォーマンス確認
1. **PageSpeed Insights** でスコア確認
   - URL: https://pagespeed.web.dev/
   - 目標: 90以上のスコア

2. **Lighthouse** で総合評価
   - Chrome DevTools > Lighthouse
   - Performance, Accessibility, Best Practices, SEO すべて確認

---

## 🔧 **次のステップ (オプション)**

### 1. カスタムドメイン設定
```bash
# 独自ドメインを取得済みの場合
# Vercel > Settings > Domains で設定
# 例: nightlife-navigator.com
```

### 2. 外部サービス連携
```bash
# Google Maps API キーを取得して更新
# Firebase プロジェクト作成
# Sentry アカウント作成
```

### 3. アナリティクス設定
```bash
# Google Analytics 4 設定
# 環境変数 GOOGLE_ANALYTICS_ID を実際の値に更新
```

---

## 🚨 **トラブルシューティング**

### ❌ ビルドエラーが発生した場合

#### 1. Node.js バージョンエラー
```bash
# Vercel で Node.js 18.x を指定
# Settings > General > Node.js Version: 18.x
```

#### 2. 環境変数エラー
```bash
# EXPO_PUBLIC_ プレフィックスが必要な変数を確認
# クライアント側で使用する変数には必ずプレフィックスを付ける
```

#### 3. 依存関係エラー
```bash
# package.json の依存関係を確認
# npm install を手動実行して確認
```

### ❌ アプリが表示されない場合

#### 1. ホワイトスクリーン
- ブラウザの Developer Tools > Console でエラー確認
- JavaScript エラーまたはネットワークエラーの可能性

#### 2. 地図が表示されない
- Google Maps API キーが正しく設定されているか確認
- API キーのリファラー制限を確認

#### 3. 認証が動作しない
- JWT_SECRET が正しく設定されているか確認
- ブラウザのローカルストレージを確認

---

## 📞 **サポート情報**

### 緊急時のロールバック
```bash
# Vercel > Deployments タブ
# 前のバージョンを選択して "Promote to Production"
```

### ログ確認
```bash
# Vercel > Functions タブでリアルタイムログ確認
# Runtime Logs でエラー詳細を確認
```

---

## 🎯 **現在の状況まとめ**

✅ **準備完了項目**:
- Git リポジトリ初期化・コミット済み
- 環境変数の実値生成済み
- Vercel 設定ファイル作成済み
- セキュリティ設定適用済み
- デプロイガイド作成済み

🎯 **次のアクション**:
1. GitHub にリポジトリ作成・プッシュ
2. Vercel でプロジェクト作成
3. 環境変数設定
4. デプロイ実行

**推定所要時間**: 約10分で完全なデプロイが可能です！