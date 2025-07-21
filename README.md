# 🍷 Nightlife Navigator MVP

![Nightlife Navigator](https://img.shields.io/badge/Status-Production%20Ready-green)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![Platform](https://img.shields.io/badge/Platform-React%20Native%20Web-purple)

Nightlife Navigator is a comprehensive venue discovery app designed for nightlife enthusiasts. Find, review, and favorite bars, clubs, lounges, and other nightlife venues with an intuitive, food-app-inspired interface.

## ✨ Features

### 🔐 **Authentication System**
- User registration and login
- Profile management
- Secure JWT-based authentication
- Password validation and recovery

### 🗺️ **Maps & Location**
- Real-time location services
- Interactive venue mapping
- Nearby venue discovery
- Distance calculations

### 🔍 **Search & Discovery**
- Area-based search (Shibuya, Shinjuku, Roppongi, etc.)
- Genre-based filtering (Bars, Clubs, Lounges, Karaoke, etc.)
- Advanced search with multiple criteria
- Popular venue recommendations

### ⭐ **Reviews & Ratings**
- Comprehensive review system
- Star ratings with category breakdowns
- Photo uploads and sharing
- Helpful/unhelpful voting system

### 🔔 **Smart Notifications**
- Real-time venue updates
- Personalized recommendations
- Event notifications
- Customizable notification settings

### ❤️ **Favorites Management**
- Save favorite venues
- Organize with custom categories
- Sync across devices
- Quick access to saved spots

## 🚀 Tech Stack

- **Frontend**: React Native with Expo Router
- **Styling**: React Native StyleSheet (Food app-inspired design)
- **State Management**: AsyncStorage for offline-first experience
- **Navigation**: Tab-based navigation with 5 main screens
- **Platform**: Web-ready with React Native Web
- **Color Theme**: Primary pink (#ea5a7b) with modern UI
- **リアルタイム通知**: Service Workerによるプッシュ通知
- **包括的な機能**: 検索、地図、お気に入り、レビュー、プロフィール

## 🚀 主な機能

### 🔍 高度な店舗検索
- カテゴリ別フィルタリング（バー、クラブ、ラウンジ、レストラン等）
- 価格帯、距離、評価による詳細検索
- リアルタイム検索結果

### 🗺️ インタラクティブ地図
- 店舗位置の視覚的表示
- ルート案内機能
- 周辺情報の統合

### ⭐ レビューシステム
- 多面的評価システム
- ユーザー生成コンテンツ
- 信頼性スコア

### 👤 パーソナライズド体験
- ユーザープロフィール管理
- 訪問履歴とバッジシステム
- カスタマイズ可能な設定

### ❤️ お気に入り管理
- 店舗コレクション機能
- 統計と傾向分析
- ソーシャル共有

### 🔔 スマート通知
- 新着店舗情報
- イベント・プロモーション通知
- パーソナライズされた推奨

## 🛠️ 技術スタック

- **フレームワーク**: [Fresh](https://fresh.deno.dev/) (Deno)
- **UI**: Preact + TypeScript
- **スタイリング**: Twind CSS-in-JS
- **PWA**: Service Worker + Web App Manifest
- **API**: RESTful API with Fresh handlers
- **デザインシステム**: やさしいピンクデザインシステム

## 🚀 開発

### 前提条件

- [Deno](https://deno.land/) 1.37以上

### 開発サーバーの起動

```bash
deno task start
```

## 📊 主要な実装内容

### ルーティングシステム
- ホームページ (`/`)
- 店舗検索 (`/search`)
- 地図表示 (`/map`)
- お気に入り (`/favorites`)
- 通知 (`/notifications`)
- プロフィール (`/profile`)
- 店舗詳細 (`/venues/[id]`)

### API エンドポイント
- `GET /api/venues` - 店舗一覧・検索
- `GET /api/venues/[id]` - 店舗詳細
- `GET /api/favorites` - お気に入り管理
- `GET /api/notifications` - 通知管理
- `GET /api/user/profile` - ユーザープロフィール

### PWA機能
- Service Worker によるオフライン対応
- Web App Manifest でアプリライクな体験
- プッシュ通知システム

---

**Nightlife Navigator** - やさしいピンクで案内する、東京の夜を彩る特別な場所
EOF < /dev/null