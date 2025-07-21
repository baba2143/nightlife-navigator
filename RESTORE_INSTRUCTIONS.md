# 🔄 復元手順書

## 📁 現在のファイル状況

### **MVPファイル（現在使用中）**
```
app/                           # 新規作成されたMVPアプリ
├── _layout.tsx               # メインレイアウト
├── index.tsx                 # ルートページ  
└── (tabs)/                   # タブナビゲーション
    ├── _layout.tsx           # タブレイアウト
    ├── index.tsx             # ホーム画面
    ├── search.tsx            # 検索画面
    ├── map.tsx               # 地図画面
    ├── favorites.tsx         # お気に入り画面
    └── profile.tsx           # プロフィール画面

package.json                  # MVP版依存関係（16パッケージ）
app.json                      # MVP版設定
mvp-demo.html                 # ブラウザ確認用デモ
```

### **バックアップファイル**
```
src-backup/                   # 元のsrcディレクトリ全体
├── temp-disabled/            # 一時無効化ファイル
│   ├── components/           # Freshコンポーネント
│   ├── islands/              # Fresh islands  
│   ├── routes/               # Fresh routes
│   ├── AdminBillingScreen.js # 管理者機能
│   ├── VIPScreen.jsx         # VIP機能
│   └── __tests__/            # テストファイル

package-original.json         # 元のpackage.json（60+パッケージ）
app-original.json             # 元のapp.json
```

## 🔄 完全復元手順

### **ステップ1: 依存関係の復元**
```bash
cd /Users/makotobaba/Desktop/my-fresh-app

# 元のpackage.jsonを復元
cp package-original.json package.json

# パッケージを再インストール
rm -rf node_modules
npm install
```

### **ステップ2: 設定ファイルの復元**
```bash
# 元のapp.jsonを復元
cp app-original.json app.json
```

### **ステップ3: ソースコードの復元**
```bash
# MVPファイルをバックアップ
mv app app-mvp-backup

# 元のsrcディレクトリを復元
mv src-backup src
```

### **ステップ4: 無効化ファイルの復元**
```bash
# 一時無効化されたファイルを元の場所に戻す
mv src/temp-disabled/* src/

# 必要に応じて個別復元
mv src/temp-disabled/components ./
mv src/temp-disabled/islands ./
mv src/temp-disabled/routes ./
```

## 🎯 部分復元（特定機能のみ）

### **管理者機能の復元**
```bash
mv src/temp-disabled/AdminBillingScreen.js src/screens/
mv src/temp-disabled/AdminDashboardScreen.js src/screens/
mv src/temp-disabled/AdminLoginScreen.js src/screens/
```

### **VIP機能の復元**
```bash
mv src/temp-disabled/VIPScreen.jsx src/screens/
mv src/temp-disabled/SubscriptionScreen.js src/screens/
mv src/temp-disabled/VIPBenefitsService.js src/services/
```

### **テスト機能の復元**
```bash
mv src/temp-disabled/__tests__ src/
mv src/temp-disabled/testSecurity.js ./
mv src/temp-disabled/testJWT.js ./

# package.jsonにテストスクリプトを追加
# "test:security": "node testSecurity.js",
# "test:jwt": "node testJWT.js",
```

## ⚠️ 注意事項

### **復元前の確認**
1. **MVPアプリのバックアップ**: 復元前に`app/`ディレクトリをバックアップ
2. **依存関係の競合**: 元の依存関係に戻すとビルドエラーが発生する可能性
3. **設定ファイルの差分**: app.jsonの設定差分を確認

### **段階的復元推奨**
```bash
# 1. まず依存関係のみ復元してテスト
cp package-original.json package.json
npm install
npm run lint

# 2. 問題なければソースコード復元
mv src-backup src

# 3. 必要な機能のみ個別復元
```

## 🚀 ハイブリッド運用

### **MVPと完全版の並行運用**
```bash
# MVPブランチの作成
git checkout -b mvp-release

# MVPファイルをコミット
git add .
git commit -m "MVP release ready"

# メインブランチで完全版を復元
git checkout main
# 上記復元手順を実行
```

## 📞 トラブルシューティング

### **復元後のよくある問題**

1. **ビルドエラー**
   ```bash
   npm run lint
   # エラーが出る場合は段階的に復元
   ```

2. **依存関係エラー**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **設定ファイルエラー**
   ```bash
   # app.jsonの構文確認
   npx expo doctor
   ```

## 📝 復元チェックリスト

- [ ] package.jsonの復元確認
- [ ] app.jsonの復元確認  
- [ ] srcディレクトリの復元確認
- [ ] npm installの実行確認
- [ ] ビルドエラーの解消確認
- [ ] 主要機能の動作確認

---

**作成日**: 2025年7月21日  
**バージョン**: 1.0  
**対象**: Nightlife Navigator MVP → 完全版復元