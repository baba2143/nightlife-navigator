# 🚀 プラットフォーム別デプロイ詳細手順

## 🥇 Option A: Vercel (最推奨)

### なぜVercelが最適か
- ✅ Expo/React Native Web 完全サポート  
- ✅ 自動HTTPS・CDN・最適化
- ✅ 簡単な環境変数管理
- ✅ Git連携で自動デプロイ
- ✅ 無料枠で十分使用可能

### 📋 Vercel デプロイ手順

#### Step 1: GitHubリポジトリ準備
```bash
# まだの場合: Gitリポジトリ初期化
git init
git add .
git commit -m "Initial commit: Nightlife Navigator MVP"

# GitHubに新リポジトリ作成後
git remote add origin https://github.com/yourusername/nightlife-navigator.git
git push -u origin main
```

#### Step 2: Vercelアカウント・プロジェクト作成
1. [vercel.com](https://vercel.com/) でアカウント作成 (GitHub連携推奨)
2. "New Project" をクリック
3. GitHubリポジトリを選択
4. プロジェクト設定:
   - **Framework Preset**: "Other"
   - **Build Command**: `npx expo export --platform web`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

#### Step 3: 環境変数設定
1. プロジェクト > Settings > Environment Variables
2. 以下を設定 (production-env-example.md参照):

**最重要セキュリティ変数**:
```
JWT_SECRET = [32文字のランダム文字列]
JWT_REFRESH_SECRET = [32文字のランダム文字列] 
ENCRYPTION_KEY = [32文字のbase64文字列]
ENCRYPTION_IV = [16文字のhex文字列]
```

**データベース・外部サービス**:
```
DATABASE_URL = [PostgreSQL接続文字列]
GOOGLE_MAPS_API_KEY = [GoogleマップAPIキー]
SENTRY_DSN = [SentryエラートラッキングDSN]
```

#### Step 4: デプロイ実行
1. "Deploy" ボタンクリック
2. 約2-3分でデプロイ完了
3. 自動生成URLでアクセステスト

#### Step 5: カスタムドメイン設定 (オプション)
1. Settings > Domains
2. 独自ドメイン追加
3. DNS設定 (CNameまたはAレコード)

---

## 🥈 Option B: Netlify

### 📋 Netlify デプロイ手順

#### Step 1: ビルド用設定ファイル作成
```bash
# netlify.toml ファイルを作成
cat > netlify.toml << EOF
[build]
  command = "npx expo export --platform web"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
EOF
```

#### Step 2: Netlify デプロイ
1. [netlify.com](https://netlify.com/) でアカウント作成
2. "New site from Git" > GitHubリポジトリ選択
3. ビルド設定は自動検出
4. 環境変数を Site settings > Environment variables で設定

---

## 🥉 Option C: AWS (高度な制御が必要な場合)

### 📋 AWS S3 + CloudFront デプロイ手順

#### Step 1: AWS CLI設定
```bash
# AWS CLI インストール
npm install -g aws-cli

# 認証情報設定
aws configure
```

#### Step 2: S3バケット作成・デプロイ
```bash
# S3バケット作成
aws s3 mb s3://nightlife-navigator-prod

# 静的ファイルアップロード
npx expo export --platform web
aws s3 sync dist/ s3://nightlife-navigator-prod --delete

# パブリック読み取り権限設定
aws s3api put-bucket-policy --bucket nightlife-navigator-prod --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::nightlife-navigator-prod/*"
  }]
}'
```

#### Step 3: CloudFront CDN設定
1. AWS Console > CloudFront > Create Distribution
2. Origin Domain: S3バケット選択
3. Default Root Object: `index.html`
4. Price Class: 使用地域に応じて設定

---

## 🔧 デプロイ後の設定・最適化

### パフォーマンス最適化設定

#### Vercelの場合
```javascript
// vercel.json ファイル作成
{
  "headers": [
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

#### 環境別設定の管理
```javascript
// app.config.js に環境別設定追加
export default {
  expo: {
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
      environment: process.env.NODE_ENV || 'development'
    }
  }
}
```

### 🔍 デプロイ後の動作確認チェックリスト

#### 機能テスト
- [ ] ホーム画面の表示
- [ ] タブナビゲーションの動作
- [ ] 検索機能 (モックデータ)
- [ ] 地図表示 (位置情報許可)
- [ ] 認証画面の表示・動作
- [ ] お気に入り機能
- [ ] レビュー表示

#### パフォーマンス確認
- [ ] PageSpeed Insights スコア 90以上
- [ ] 初期ロード時間 3秒以内
- [ ] CDN配信の確認
- [ ] 画像・アセット最適化確認

#### セキュリティ確認
- [ ] HTTPS接続の確認
- [ ] セキュリティヘッダーの確認
- [ ] 環境変数の秘匿確認
- [ ] CORS設定の確認

---

## 🚨 トラブルシューティング

### よくある問題と解決法

#### 1. "White Screen" が表示される
**原因**: JavaScriptエラーまたはルーティング問題  
**解決**: ブラウザのDevToolsでConsoleエラー確認

#### 2. 環境変数が読み込まれない
**原因**: `EXPO_PUBLIC_` プレフィックスが必要な変数がある  
**解決**: クライアント側で使用する変数に `EXPO_PUBLIC_` を追加

#### 3. Build失敗
**原因**: Node.jsバージョン不整合  
**解決**: Node.js 18.x 使用確認

#### 4. 地図が表示されない
**原因**: Google Maps API キーの制限設定  
**解決**: APIキーのリファラー設定確認

### 緊急時の対応

#### ロールバック手順 (Vercel)
1. Deployments タブで前のデプロイを選択
2. "Promote to Production" をクリック
3. 約30秒で旧バージョンに復旧

#### ログ確認方法
- **Vercel**: Functions タブでリアルタイムログ確認
- **Netlify**: Deploy log で詳細ログ確認  
- **AWS**: CloudWatch Logs で詳細分析

---

## 💡 次のステップ

デプロイ完了後の改善提案:

1. **Real API接続**: モックデータを実際のAPIに置換
2. **テスト追加**: E2Eテストの実装
3. **PWA化**: オフライン対応・アプリライク体験
4. **A/Bテスト**: 機能改善のためのテスト実装
5. **モバイルアプリ**: iOS/Android ネイティブアプリ版開発

### 継続的デプロイメント
- Git push時の自動デプロイ設定済み (Vercel/Netlify)
- ステージング環境の追加検討
- 自動テスト統合