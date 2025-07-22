# 🔧 GitHub プッシュ実行コマンド

## ⚠️ 重要: 以下のコマンドを順番に実行してください

### 1. Git ユーザー設定 (初回のみ)
```bash
# あなたの名前に置き換えてください
git config --global user.name "Your Name"

# あなたのGitHubメールアドレスに置き換えてください  
git config --global user.email "your.email@example.com"
```

**例:**
```bash
git config --global user.name "Makoto Baba"
git config --global user.email "makotobaba@example.com"
```

### 2. 現在のディレクトリ確認
```bash
# 正しいディレクトリにいることを確認
pwd
# 結果: /Users/makotobaba/Desktop/my-fresh-app が表示されるはず
```

### 3. Git状態確認
```bash
# 現在のGit状態を確認
git status
# 結果: "On branch main" と表示されるはず
```

### 4. リモートリポジトリ追加
```bash
# ⚠️ YOUR_USERNAME を実際のGitHubユーザー名に置き換えてください
git remote add origin https://github.com/YOUR_USERNAME/nightlife-navigator.git

# 例: もしGitHubユーザー名が "makotobaba" の場合
# git remote add origin https://github.com/makotobaba/nightlife-navigator.git
```

### 5. リモート設定確認
```bash
# リモートが正しく設定されたか確認
git remote -v
# 結果: 
# origin  https://github.com/YOUR_USERNAME/nightlife-navigator.git (fetch)
# origin  https://github.com/YOUR_USERNAME/nightlife-navigator.git (push)
```

### 6. GitHubにプッシュ
```bash
# メインブランチをGitHubにプッシュ
git push -u origin main
```

## 🎯 実行順序まとめ

1. **Git設定** → ユーザー名・メールアドレス設定
2. **GitHub作成** → ブラウザでリポジトリ作成
3. **リモート追加** → `git remote add origin [URL]`
4. **プッシュ実行** → `git push -u origin main`

## 📋 成功確認

プッシュが成功すると以下が表示されます:
```
Enumerating objects: 435, done.
Counting objects: 100% (435/435), done.
Delta compression using up to 8 threads
Compressing objects: 100% (421/421), done.
Writing objects: 100% (435/435), 15.67 MiB | 2.33 MiB/s, done.
Total 435 (delta 12), reused 0 (delta 0), pack-reused 0
remote: Resolving deltas: 100% (12/12), done.
To https://github.com/YOUR_USERNAME/nightlife-navigator.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

## 🔧 トラブルシューティング

### エラー 1: "fatal: remote origin already exists"
```bash
# 既存のリモートを削除して再設定
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/nightlife-navigator.git
```

### エラー 2: "Permission denied (publickey)"
```bash
# HTTPS URL使用を確認 (SSH設定不要)
git remote set-url origin https://github.com/YOUR_USERNAME/nightlife-navigator.git
```

### エラー 3: "Repository not found"
```bash
# GitHubでリポジトリが正しく作成されているか確認
# リポジトリ名が "nightlife-navigator" になっているか確認
```

## ✅ 次のステップ

プッシュが成功したら:
1. ブラウザでGitHubリポジトリページを確認
2. ファイルが正しくアップロードされているか確認
3. Vercelデプロイに進む