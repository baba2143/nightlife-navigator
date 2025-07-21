# 🔐 本番環境変数設定例

## セキュリティキー生成コマンド

### JWT Secret生成
```bash
# 32文字のランダムな文字列を生成
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# 例: a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456

# または
openssl rand -hex 32
```

### 暗号化キー生成
```bash
# 32文字の暗号化キー
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 16文字のIV
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

## 外部サービス取得方法

### 1. Google Maps API
1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクト作成
3. "Maps JavaScript API" を有効化
4. APIキー作成 (HTTPSリファラー制限推奨)
5. 課金アカウント設定 (月$200無料枠あり)

### 2. Firebase (Push通知)
1. [Firebase Console](https://console.firebase.google.com/)でプロジェクト作成
2. "Project settings" > "Service accounts"
3. "Generate new private key" でJSONダウンロード
4. JSONの各値を環境変数に設定

### 3. Sentry (エラートラッキング)
1. [Sentry](https://sentry.io/)でアカウント作成
2. 新プロジェクト作成 (JavaScript/React)
3. DSN をコピー

### 4. データベース (PostgreSQL)
推奨サービス:
- **Supabase** (無料枠あり): [supabase.com](https://supabase.com/)
- **PlanetScale** (MySQL): [planetscale.com](https://planetscale.com/)
- **Railway** (PostgreSQL): [railway.app](https://railway.app/)

### 5. Redis
推奨サービス:
- **Upstash** (無料枠あり): [upstash.com](https://upstash.com/)
- **Redis Cloud**: [redis.com](https://redis.com/)

## 本番用 .env.production 設定例

```bash
# ===== セキュリティ (必須変更) =====
JWT_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
JWT_REFRESH_SECRET=b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456a1
ENCRYPTION_KEY=YourBase64EncodedEncryptionKeyHere123456789=
ENCRYPTION_IV=1234567890abcdef

# ===== データベース =====
DATABASE_URL=postgresql://username:password@your-db-host:5432/nightlife_navigator
REDIS_URL=redis://default:password@your-redis-host:6379
REDIS_PASSWORD=your-redis-password

# ===== 外部サービス =====
GOOGLE_MAPS_API_KEY=AIzaSyYour-Real-Google-Maps-API-Key-Here
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# ===== Firebase (Push通知) =====
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project-id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=123456789012345678901

# ===== 分析・監視 =====
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
MIXPANEL_TOKEN=your-mixpanel-token

# ===== OAuth (ソーシャルログイン用) =====
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# ===== 本番ドメイン =====
EXPO_PUBLIC_API_URL=https://api.your-domain.com
CORS_ORIGIN=https://your-domain.com,https://www.your-domain.com
```

## セキュリティチェックリスト

### ✅ 必須確認事項
- [ ] 全てのシークレットが CHANGE_THIS から実際の値に変更済み
- [ ] JWT_SECRET と JWT_REFRESH_SECRET が異なる値
- [ ] データベース接続にSSL使用 (DATABASE_SSL=true)
- [ ] CORS設定が本番ドメインのみ許可
- [ ] API キーにリファラー制限設定済み

### ⚠️ 注意事項
1. **環境変数の保管**: 
   - パスワードマネージャーまたは暗号化ファイルで管理
   - チーム共有時は安全な方法を使用

2. **定期ローテーション**:
   - JWTシークレット: 6ヶ月毎
   - APIキー: 必要に応じて
   - データベースパスワード: 3ヶ月毎

3. **最小権限の原則**:
   - APIキーは必要な機能のみ有効
   - データベースユーザーは必要な権限のみ

## 🔄 環境変数のデプロイ先設定

### Vercel の場合
1. プロジェクト設定 > Environment Variables
2. 各変数を Name/Value で入力
3. Environment を "Production" に設定

### Netlify の場合
1. Site settings > Environment variables
2. 各変数を Key/Value で入力

### AWS の場合
1. Systems Manager > Parameter Store 使用推奨
2. SecureString タイプで保存
3. IAM権限を適切に設定