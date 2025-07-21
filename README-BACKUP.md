# 💾 データベースバックアップガイド

Nightlife Navigator の包括的なデータベースバックアップシステムの詳細ガイドです。

## 📋 目次

1. [バックアップシステム概要](#バックアップシステム概要)
2. [CLIツール](#cliツール)
3. [API操作](#api操作)
4. [自動バックアップ](#自動バックアップ)
5. [障害復旧](#障害復旧)
6. [ベストプラクティス](#ベストプラクティス)

## バックアップシステム概要

### 🎯 主要機能

- **フルバックアップ**: スキーマ + 全データ
- **スキーマバックアップ**: テーブル構造のみ
- **圧縮**: gzip圧縮でファイルサイズ削減
- **チェックサム**: データ整合性検証
- **自動クリーンアップ**: 古いバックアップの自動削除
- **スケジューラー**: 定期自動バックアップ

### 📁 バックアップファイル構造

```
backups/
├── full_1703123456789.sql.gz          # フルバックアップ
├── full_1703123456789.meta.json       # メタデータ
├── schema_1703123456790.schema.sql.gz # スキーマバックアップ
└── schema_1703123456790.meta.json     # メタデータ
```

## CLIツール

### 📋 基本コマンド

```bash
# バックアップ一覧
deno task backup:list

# 新しいフルバックアップ作成
deno task backup:create

# スキーマのみバックアップ
deno task backup:create --type schema

# 説明付きバックアップ
deno task backup:create --description "リリース前バックアップ"

# システム状態確認
deno task backup:status
```

### 🔄 復元操作

```bash
# バックアップ一覧から選択して復元
deno task backup:restore <backup-id>

# 確認なしで復元
deno task backup:restore <backup-id> --force
```

### 🧹 メンテナンス

```bash
# 古いバックアップをクリーンアップ
deno task backup:cleanup

# 削除対象確認（実際には削除しない）
deno task backup:cleanup --dry-run

# 自動バックアップ設定
deno task backup:auto
```

### 📊 詳細な使用例

#### バックアップ作成
```bash
# フルバックアップ（推奨）
deno run -A scripts/backup-manager.ts create --type full --description "定期メンテナンス前"

# スキーマのみ（開発時）
deno run -A scripts/backup-manager.ts create --type schema --description "スキーマ変更前"
```

#### バックアップ一覧
```bash
# 最新10件を表示
deno run -A scripts/backup-manager.ts list

# 最新20件を表示
deno run -A scripts/backup-manager.ts list --limit 20

# JSON形式で出力
deno run -A scripts/backup-manager.ts list --format json
```

#### 復元操作
```bash
# 対話式復元
deno run -A scripts/backup-manager.ts restore full_1703123456789

# バックアップIDの一部でも可
deno run -A scripts/backup-manager.ts restore 56789
```

## API操作

### 📡 RESTエンドポイント

#### バックアップ一覧取得
```bash
curl http://localhost:8000/api/backup?action=list
```

#### バックアップ作成
```bash
# フルバックアップ
curl -X POST http://localhost:8000/api/backup \
  -H "Content-Type: application/json" \
  -d '{"action": "create", "type": "full", "description": "API backup"}'

# スキーマバックアップ
curl -X POST http://localhost:8000/api/backup \
  -H "Content-Type: application/json" \
  -d '{"action": "create", "type": "schema"}'
```

#### データベース復元
```bash
curl -X POST http://localhost:8000/api/backup \
  -H "Content-Type: application/json" \
  -d '{"action": "restore", "backupId": "full_1703123456789"}'
```

#### バックアップファイルダウンロード
```bash
curl "http://localhost:8000/api/backup?action=download&id=full_1703123456789" \
  --output backup.sql.gz
```

#### クリーンアップ実行
```bash
curl -X POST http://localhost:8000/api/backup \
  -H "Content-Type: application/json" \
  -d '{"action": "cleanup"}'
```

### 📊 システム状態確認
```bash
curl http://localhost:8000/api/backup?action=status
```

レスポンス例：
```json
{
  "success": true,
  "status": {
    "totalBackups": 15,
    "lastBackupDate": "2023-12-21T10:30:00.000Z",
    "lastBackupType": "full",
    "totalSize": 52428800,
    "averageBackupSize": 3495253,
    "systemHealth": "healthy"
  }
}
```

## 自動バックアップ

### ⚙️ スケジューラー設定

```typescript
import { defaultScheduler } from "./utils/scheduler.ts";

// 自動バックアップの開始
defaultScheduler.updateConfig({
  enabled: true,
  type: "interval",
  interval: 24 * 60 * 60 * 1000, // 24時間
  backupType: "full",
  description: "Daily automatic backup"
});

defaultScheduler.start();
```

### 🕒 Cronジョブ設定

#### 毎日午前2時
```bash
0 2 * * * cd /path/to/app && deno task backup:create --type full
```

#### 毎週日曜日午前3時
```bash
0 3 * * 0 cd /path/to/app && deno task backup:create --type full
```

#### 毎時スキーマバックアップ
```bash
0 * * * * cd /path/to/app && deno task backup:create --type schema
```

### 🐳 Docker環境での設定

```yaml
# docker-compose.yml
services:
  app:
    # ... 他の設定
    environment:
      - BACKUP_INTERVAL=24  # 時間
      - BACKUP_RETENTION_DAYS=30
    volumes:
      - ./backups:/app/backups

  backup-scheduler:
    image: nightlife-navigator/app
    command: deno run -A scripts/backup-scheduler.ts
    volumes:
      - ./backups:/app/backups
      - ./data:/app/data
    depends_on:
      - app
```

## 障害復旧

### 🚨 緊急復旧手順

#### 1. データベース完全破損
```bash
# 1. 最新のフルバックアップを確認
deno task backup:list --limit 5

# 2. 復元実行
deno task backup:restore <最新のbackup-id> --force

# 3. アプリケーション再起動
deno task start
```

#### 2. 部分的なデータ破損
```bash
# 1. 問題の確認
deno task backup:status

# 2. 最新のスキーマバックアップでテーブル構造を復元
deno task backup:restore <schema-backup-id>

# 3. データの手動確認・修正
```

#### 3. 本番環境での復旧
```bash
# 1. メンテナンスモードに移行
# 2. 現在のデータベースをバックアップ
deno task backup:create --description "障害発生時バックアップ"

# 3. 正常なバックアップから復元
deno task backup:restore <正常なbackup-id>

# 4. データ整合性確認
# 5. アプリケーション再開
```

### 🔍 データ整合性チェック

```bash
# バックアップファイルの整合性確認
curl "http://localhost:8000/api/backup?action=list" | jq '.backups[0].checksum'

# データベース内容の確認
sqlite3 ./data/nightlife_navigator.db "PRAGMA integrity_check;"
```

## ベストプラクティス

### 📅 バックアップ戦略

#### 本番環境
- **フルバックアップ**: 毎日1回（午前2-4時）
- **スキーマバックアップ**: デプロイ前
- **保持期間**: 30日
- **最大バックアップ数**: 30個

#### 開発環境
- **フルバックアップ**: 週1回
- **スキーマバックアップ**: 機能開発前
- **保持期間**: 7日

### 🔒 セキュリティ考慮事項

1. **アクセス制御**: バックアップAPIは管理者のみ
2. **ファイル権限**: バックアップファイルの適切な権限設定
3. **暗号化**: 機密データを含む場合は暗号化
4. **監査ログ**: バックアップ・復元操作のログ記録

### 📊 監視・アラート

```bash
# バックアップ失敗検知
if ! deno task backup:create > /dev/null 2>&1; then
  echo "ALERT: Backup failed at $(date)" | mail -s "Backup Failure" admin@example.com
fi

# ディスク容量監視
backup_size=$(du -sh ./backups | cut -f1)
echo "Current backup size: $backup_size"
```

### 🚀 パフォーマンス最適化

1. **除外テーブル**: ログテーブルなど大きなテーブルを除外
2. **圧縮**: 常にgzip圧縮を有効
3. **並列処理**: 大きなデータベースでは並列バックアップ
4. **インクリメンタル**: 将来的にインクリメンタルバックアップを検討

### 🧪 テスト手順

```bash
# 1. テストバックアップ作成
deno task backup:create --description "テスト用"

# 2. テストデータベースでの復元テスト
cp ./data/nightlife_navigator.db ./data/test_backup.db
deno task backup:restore <backup-id>

# 3. データ整合性確認
# 4. 元のデータベースに戻す
```

### 📝 運用チェックリスト

- [ ] 自動バックアップが正常動作している
- [ ] 古いバックアップが適切にクリーンアップされている
- [ ] バックアップファイルの整合性が保たれている
- [ ] 復元手順が定期的にテストされている
- [ ] 監視・アラートが設定されている
- [ ] 障害復旧手順が文書化されている

## トラブルシューティング

### ❌ よくある問題

#### バックアップ作成失敗
```bash
# 原因確認
deno task backup:status

# ディスク容量確認
df -h

# 権限確認
ls -la ./backups/
```

#### 復元失敗
```bash
# バックアップファイル確認
ls -la ./backups/

# チェックサム確認
deno task backup:list --format json | jq '.[] | select(.id=="<backup-id>") | .checksum'
```

#### スケジューラー停止
```bash
# プロセス確認
ps aux | grep backup

# ログ確認
tail -f ./logs/app.log | grep backup
```

### 📞 サポート

問題が解決しない場合：
1. ログファイルを確認
2. バックアップシステムの状態を確認
3. 技術サポートに問い合わせ