# 📊 本番運用: モニタリング・セキュリティ・保守ガイド

## 🔍 モニタリング設定

### 1. エラートラッキング (Sentry)

#### 導入手順
```bash
# Sentry SDK インストール
npm install @sentry/react-native

# Expo用設定
npx @sentry/wizard -i reactNative
```

#### 設定ファイル (app/_layout.tsx)
```javascript
import * as Sentry from '@sentry/react-native';

// 本番環境でのみSentry初期化
if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.EXPO_PUBLIC_ENV,
    // パフォーマンス監視
    tracesSampleRate: 0.1,
    // セッションリプレイ (オプション)
    replaysSessionSampleRate: 0.1,
    // プライバシー設定
    beforeSend(event) {
      // 個人情報を含む可能性のあるデータを除外
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }
      return event;
    }
  });
}
```

### 2. パフォーマンス監視

#### Core Web Vitals設定
```javascript
// utils/performance.js
export const measureWebVitals = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    // LCP (Largest Contentful Paint)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        console.log('LCP:', entry.startTime);
        // Analytics に送信
        gtag('event', 'web_vitals', {
          name: 'LCP',
          value: entry.startTime
        });
      });
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // FID (First Input Delay)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        console.log('FID:', entry.processingStart - entry.startTime);
      });
    }).observe({ entryTypes: ['first-input'] });
  }
};
```

### 3. ユーザー分析 (Google Analytics 4)

#### 設定 (app/_layout.tsx)
```javascript
import { GoogleAnalytics } from '@next/third-parties/google';

// GA4 初期化
useEffect(() => {
  if (process.env.EXPO_PUBLIC_GOOGLE_ANALYTICS_ID) {
    // GA4 設定
    gtag('config', process.env.EXPO_PUBLIC_GOOGLE_ANALYTICS_ID, {
      page_title: 'Nightlife Navigator',
      page_location: window.location.href,
    });
  }
}, []);

// カスタムイベント送信例
const trackUserAction = (action, category = 'engagement') => {
  gtag('event', action, {
    event_category: category,
    event_label: 'user_interaction'
  });
};
```

### 4. アップタイム監視

#### 推奨サービス
- **UptimeRobot** (無料枠あり): 5分間隔でHTTPチェック
- **Pingdom**: 1分間隔、詳細レポート
- **StatusCake**: 複数地点からの監視

#### 設定例 (UptimeRobot)
1. [uptimerobot.com](https://uptimerobot.com/) でアカウント作成
2. "Add New Monitor" をクリック
3. 設定:
   - **Monitor Type**: HTTP(s)
   - **URL**: https://your-domain.com
   - **Monitoring Interval**: 5 minutes
   - **Alert Contacts**: メール・Slack通知設定

---

## 🔒 セキュリティ対策

### 1. セキュリティヘッダー設定

#### Vercel (vercel.json)
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-XSS-Protection", 
          "value": "1; mode=block"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.your-domain.com https://maps.googleapis.com"
        }
      ]
    }
  ]
}
```

### 2. 脆弱性スキャン

#### GitHub Security設定
```yaml
# .github/workflows/security.yml
name: Security Scan
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm audit --audit-level high
      - run: npx snyk test
```

### 3. 定期セキュリティ更新

#### Dependabot設定 (.github/dependabot.yml)
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    reviewers:
      - "your-username"
```

---

## 💾 バックアップ・データ保護

### 1. 環境変数バックアップ

#### 安全な保管方法
```bash
# 暗号化してバックアップ
gpg --symmetric --cipher-algo AES256 production.env
# パスワード付きでarchive.env.gpg が作成される

# 復元時
gpg --decrypt archive.env.gpg > production.env
```

### 2. コードバックアップ戦略

#### Git設定
```bash
# 複数のリモートリポジトリ設定
git remote add backup https://gitlab.com/username/nightlife-navigator-backup.git
git remote add mirror https://bitbucket.org/username/nightlife-navigator.git

# 定期的なバックアップpush
git push backup main
git push mirror main
```

### 3. データベース・設定バックアップ

#### 自動バックアップスクリプト
```bash
#!/bin/bash
# backup.sh - 定期実行用

DATE=$(date +%Y%m%d_%H%M%S)

# データベースバックアップ (PostgreSQL)
PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -U $DB_USER $DB_NAME > backup_$DATE.sql

# 設定ファイルバックアップ
tar -czf config_backup_$DATE.tar.gz *.env* *.json *.md

# S3アップロード (オプション)
aws s3 cp backup_$DATE.sql s3://your-backup-bucket/database/
aws s3 cp config_backup_$DATE.tar.gz s3://your-backup-bucket/config/

# 30日以上古いファイルを削除
find . -name "backup_*.sql" -mtime +30 -delete
find . -name "config_backup_*.tar.gz" -mtime +30 -delete
```

---

## 📋 運用チェックリスト

### 🔄 日次チェック
- [ ] アプリケーションの正常動作確認
- [ ] エラーログの確認 (Sentry)
- [ ] パフォーマンス指標の確認
- [ ] セキュリティアラートの確認

### 📅 週次チェック  
- [ ] 依存関係の脆弱性チェック (`npm audit`)
- [ ] バックアップの完全性確認
- [ ] アクセス解析レポートの確認
- [ ] ユーザーフィードバックの確認

### 🗓️ 月次チェック
- [ ] セキュリティパッチの適用
- [ ] パフォーマンス最適化の実施
- [ ] 容量・コスト使用量の確認
- [ ] 災害復旧手順のテスト

### 🎯 四半期チェック
- [ ] セキュリティ監査の実施
- [ ] 環境変数・認証情報のローテーション
- [ ] アーキテクチャレビューの実施
- [ ] 利用規約・プライバシーポリシーの見直し

---

## 🚨 インシデント対応

### 緊急時連絡先・手順

#### レベル1: 軽微な問題
- 対応時間: 24時間以内
- 例: UI表示の軽微な不具合、パフォーマンス低下

#### レベル2: 重要な機能障害
- 対応時間: 4時間以内  
- 例: 認証システム障害、地図機能停止

#### レベル3: システム全体停止
- 対応時間: 1時間以内
- 例: アプリ全体アクセス不可、重大なセキュリティ侵害

### インシデント対応手順
1. **検知・報告** (5分以内)
   - アラート受信
   - 影響範囲の確認
   - ステータスページ更新

2. **初期対応** (15分以内)
   - ロールバック可能性の確認
   - 緊急修正の検討
   - チーム通知

3. **本格対応** (1時間以内)
   - 根本原因の特定
   - 修正版のデプロイ
   - 動作確認

4. **事後対応** (24時間以内)
   - インシデントレポート作成
   - 再発防止策の策定
   - ポストモーテム実施

---

## 📈 運用改善提案

### パフォーマンス最適化
- **画像最適化**: WebP形式への変換
- **コード分割**: 必要に応じた遅延読み込み
- **CDN活用**: 静的リソースの高速配信

### ユーザー体験向上
- **Progressive Web App**: オフライン対応
- **プッシュ通知**: リアルタイム更新
- **A/Bテスト**: 機能改善の検証

### 開発効率化
- **CI/CD改善**: 自動テスト・デプロイの拡充
- **監視強化**: より詳細なメトリクス収集
- **ドキュメント充実**: 運用手順書の拡充