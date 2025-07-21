# 🔧 環境変数・設定管理ガイド

Nightlife Navigator の環境変数と設定管理の詳細ガイドです。

## 📋 目次

1. [設定の概要](#設定の概要)
2. [環境変数一覧](#環境変数一覧)
3. [設定ツール](#設定ツール)
4. [セキュリティ](#セキュリティ)
5. [デプロイ環境別設定](#デプロイ環境別設定)

## 設定の概要

### 設定ファイルの優先順位
1. 環境変数（最優先）
2. `.env` ファイル
3. デフォルト値

### 設定管理ツール
- `deno task config:setup` - 対話式設定セットアップ
- `deno task config:show` - 現在の設定表示
- `deno task config:validate` - 設定の検証

## 環境変数一覧

### 🔑 必須環境変数

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `JWT_SECRET` | JWT署名用秘密鍵（32文字以上） | `your-super-secret-jwt-key...` |
| `SESSION_SECRET` | セッション暗号化キー | `your-session-secret` |

### 🌍 環境設定

| 変数名 | 説明 | デフォルト | 例 |
|--------|------|-----------|-----|
| `DENO_ENV` | 実行環境 | `development` | `production` |
| `PORT` | サーバーポート | `8000` | `8000` |
| `HOST` | バインドホスト | `localhost` | `0.0.0.0` |

### 🗄️ データベース設定

| 変数名 | 説明 | デフォルト |
|--------|------|-----------|
| `DATABASE_URL` | SQLiteファイルパス | `./data/nightlife_navigator.db` |

### 🔐 認証設定

| 変数名 | 説明 | デフォルト |
|--------|------|-----------|
| `JWT_EXPIRES_IN` | JWTトークン有効期限 | `24h` |
| `REFRESH_TOKEN_EXPIRES_IN` | リフレッシュトークン有効期限 | `7d` |

### 🗺️ 外部API設定

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `GOOGLE_MAPS_API_KEY` | Google Maps APIキー | 地図機能使用時 |

### 📁 ファイル設定

| 変数名 | 説明 | デフォルト |
|--------|------|-----------|
| `UPLOAD_PATH` | アップロードディレクトリ | `./uploads` |
| `MAX_FILE_SIZE` | 最大ファイルサイズ（バイト） | `10485760` (10MB) |
| `ALLOWED_EXTENSIONS` | 許可ファイル拡張子 | `jpg,jpeg,png,gif,webp` |

### 🌐 CORS設定

| 変数名 | 説明 | デフォルト |
|--------|------|-----------|
| `CORS_ORIGINS` | 許可オリジン（カンマ区切り） | `http://localhost:8000` |

### 🚦 レート制限

| 変数名 | 説明 | デフォルト |
|--------|------|-----------|
| `RATE_LIMIT_WINDOW` | 時間窓（分） | `15` |
| `RATE_LIMIT_MAX_REQUESTS` | 最大リクエスト数 | `100` |

### 📝 ログ設定

| 変数名 | 説明 | デフォルト |
|--------|------|-----------|
| `LOG_LEVEL` | ログレベル | `info` |
| `LOG_FILE` | ログファイルパス | 未設定 |

### 🍪 セキュリティ設定

| 変数名 | 説明 | デフォルト |
|--------|------|-----------|
| `COOKIE_SECURE` | セキュアクッキー（HTTPS必須） | `false` |
| `COOKIE_SAME_SITE` | SameSite属性 | `lax` |

### 💾 バックアップ設定

| 変数名 | 説明 | デフォルト |
|--------|------|-----------|
| `BACKUP_INTERVAL` | バックアップ間隔（時間） | `24` |
| `BACKUP_RETENTION_DAYS` | 保持期間（日） | `30` |

## 設定ツール

### 対話式セットアップ
```bash
deno task config:setup
```
ガイド付きで設定ファイルを作成します。

### 設定の表示
```bash
# テーブル形式
deno task config:show

# JSON形式
deno task config:show --format json
```

### 設定の検証
```bash
deno task config:validate
```
環境変数の妥当性をチェックします。

## セキュリティ

### 🔑 秘密鍵の生成

強力な秘密鍵を生成するには：

```typescript
import { generateJwtSecret, generateSessionSecret } from "./utils/secrets.ts";

// JWT秘密鍵（64文字）
const jwtSecret = generateJwtSecret();

// セッション秘密鍵（32文字）
const sessionSecret = generateSessionSecret();
```

### 🔒 秘密鍵の強度チェック

```typescript
import { checkSecretStrength } from "./utils/secrets.ts";

const strength = checkSecretStrength("your-secret");
console.log(strength.level); // "weak" | "fair" | "good" | "strong"
```

### 📊 推奨セキュリティ設定

#### 開発環境
```env
COOKIE_SECURE=false
CORS_ORIGINS=http://localhost:8000
LOG_LEVEL=debug
```

#### 本番環境
```env
COOKIE_SECURE=true
CORS_ORIGINS=https://your-domain.com
LOG_LEVEL=warn
```

## デプロイ環境別設定

### 🏠 ローカル開発

```env
DENO_ENV=development
PORT=8000
HOST=localhost
DATABASE_URL=./data/nightlife_navigator.db
COOKIE_SECURE=false
CORS_ORIGINS=http://localhost:8000
LOG_LEVEL=debug
```

### 🧪 ステージング環境

```env
DENO_ENV=staging
PORT=8000
HOST=0.0.0.0
DATABASE_URL=./data/nightlife_navigator.db
COOKIE_SECURE=true
CORS_ORIGINS=https://staging.your-domain.com
LOG_LEVEL=info
```

### 🚀 本番環境

```env
DENO_ENV=production
PORT=8000
HOST=0.0.0.0
DATABASE_URL=./data/nightlife_navigator.db
COOKIE_SECURE=true
CORS_ORIGINS=https://your-domain.com
LOG_LEVEL=warn
```

## 設定API

### 設定情報の取得
```bash
curl http://localhost:8000/api/config?action=summary
```

### 設定の再読み込み
```bash
curl http://localhost:8000/api/config?action=reload
```

### 設定の検証
```bash
curl http://localhost:8000/api/config?action=validate
```

## トラブルシューティング

### よくある問題

1. **JWT_SECRET が短すぎる**
   ```
   Error: JWT_SECRET must be at least 32 characters long
   ```
   → 32文字以上の強力な秘密鍵を設定してください

2. **ポートが既に使用されている**
   ```
   Error: ポート 8000 は既に使用されています
   ```
   → 別のポートを使用するか、使用中のプロセスを終了してください

3. **データベースファイルが見つからない**
   ```
   Error: データベースファイルが見つかりません
   ```
   → `mkdir -p data` でディレクトリを作成してください

### 設定のリセット

設定を初期状態に戻すには：
```bash
rm .env
deno task config:setup
```

## 注意事項

- `.env` ファイルは `.gitignore` に追加してください
- 本番環境では強力な秘密鍵を使用してください
- 定期的に秘密鍵をローテーションしてください
- ログレベルは環境に応じて適切に設定してください