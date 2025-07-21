# 📋 Nightlife Navigator - 現在の機能一覧

## 📅 最終更新日
2025年7月21日

## 🎯 概要
Nightlife NavigatorのMVP版および完全版（バックアップ）の全機能を洗い出し

---

## 🚀 **現在動作中のMVP機能**

### 📱 **アプリ構造**
- **技術**: Expo Router + React Native
- **ナビゲーション**: タブベース（5画面）
- **テーマ**: ピンクカラー（#ea5a7b）統一

### 🏠 **1. ホーム画面** (`app/(tabs)/index.tsx`)
#### **実装済み機能**
- ✅ **ヘッダー**: アプリ名、割引バッジ、アクションアイコン
- ✅ **検索セクション**: エリア・駅 + 店名・ジャンル検索
- ✅ **統計表示**: 店舗数、口コミ数、写真数
- ✅ **エリア検索**: 現在地 + 人気6エリア（渋谷、新宿、六本木等）
- ✅ **ジャンル検索**: ナイトライフ6カテゴリ（バー、クラブ、ラウンジ等）
- ✅ **詳細検索**: フィルター設定、条件適用

#### **デザイン特徴**
- 食べログ風レイアウト
- カード型UI
- グリッドレイアウト
- 画像背景付きボタン

### 🔍 **2. 検索画面** (`app/(tabs)/search.tsx`)
#### **実装済み機能**
- ✅ **検索バー**: テキスト入力、検索アイコン
- ✅ **カテゴリ選択**: 4種類（バー、クラブ、ラウンジ、カラオケ）
- ✅ **状態管理**: useState for検索テキスト

#### **UI コンポーネント**
- SafeAreaView
- TextInput
- TouchableOpacity
- カテゴリカード

### 🗺️ **3. 地図画面** (`app/(tabs)/map.tsx`)
#### **現在の状態**
- 🚧 **プレースホルダー**: 準備中表示
- ✅ **説明文**: 将来の機能説明
- ⏳ **予定機能**: 位置情報、ルート案内

### ❤️ **4. お気に入り画面** (`app/(tabs)/favorites.tsx`)
#### **実装済み機能**
- ✅ **空状態表示**: お気に入りなしの案内
- ✅ **使い方ガイド**: 機能説明
- ✅ **Tips表示**: 3つのヒント

#### **UI要素**
- 空状態アイコン（💝）
- 説明テキスト
- ガイダンス

### 👤 **5. プロフィール画面** (`app/(tabs)/profile.tsx`)
#### **実装済み機能**
- ✅ **ユーザー情報**: ゲストユーザー表示
- ✅ **メニュー項目**: 5つの設定項目
  - プロフィール編集
  - 通知設定
  - プライバシー設定
  - ヘルプ・サポート
  - アプリについて
- ✅ **アクションボタン**: ログイン、新規登録

#### **UI コンポーネント**
- アバター表示
- Ioniconsアイコン
- リスト形式メニュー

### 🎨 **共通デザインシステム**
- **カラーパレット**: ピンク系統一
- **タイポグラフィ**: システムフォント
- **アイコン**: Ionicons使用
- **レイアウト**: SafeAreaView + ScrollView

---

## 💾 **バックアップされた完全版機能**

### 🏗️ **アーキテクチャ（`src-backup/`）**

#### **📱 コンポーネントライブラリ**
**基本コンポーネント (`components/common/`)**
- AnimatedNeonButton.js - ネオン効果ボタン
- AnimatedNeonCard.js - ネオン効果カード
- Badge.js - バッジコンポーネント
- Button.js/jsx - 汎用ボタン
- Card.js/jsx - カードレイアウト
- InteractiveNeonText.js - インタラクティブテキスト
- ThemeProvider.jsx - テーマ管理
- VenueCard.jsx - 店舗カード

**地図関連 (`components/map/`)**
- ClusterMarker.js - クラスター表示
- MapFilter.js - 地図フィルター
- MapSearch.js - 地図検索
- NavigationPanel.js - ナビゲーション
- RouteOverlay.js - ルート表示
- VenueMarker.js - 店舗マーカー

**ナイトライフ特化 (`components/nightlife/`)**
- FavoriteManager.js - お気に入り管理
- NightlifeNavigator.js - メイン画面
- NotificationSystem.js - 通知システム
- ReviewSystem.js - レビューシステム
- UserProfile.js - ユーザープロフィール
- VenueDetails.js - 店舗詳細
- VenueMap.js - 店舗地図
- VenueSearch.js - 店舗検索

**UI システム (`components/ui/`)**
- AccessibilityUtils.js - アクセシビリティ
- AnimatedComponents.js - アニメーション
- Form.js - フォーム部品
- Modal.js - モーダル
- Navigation.js - ナビゲーション
- SearchBar.js - 検索バー
- ThemeSelector.js - テーマ選択

#### **🎨 デザインシステム (`design-system/`)**
**カラーシステム**
- colors.js - 基本カラー
- colors-refined.js - 洗練カラー
- colors-soft-pink.js - ソフトピンク

**レイアウトシステム**
- spacing.js - スペーシング
- spacing-comfortable.js - 快適スペーシング
- typography.js - タイポグラフィ
- typography-refined.js - 洗練タイポグラフィ

**視覚効果**
- shadows.js - シャドウ効果
- animations.js - アニメーション
- borders-rounded.js - 角丸設定

#### **📋 画面コンポーネント (`screens/`)**

**認証関連 (`auth/`)**
- LoginScreen.js - ログイン
- RegisterScreen.js - 新規登録

**メイン機能**
- HomeScreen.js/jsx - ホーム画面
- SearchScreen.js/jsx - 検索画面
- MapScreen.js/jsx - 地図画面
- FavoritesScreen.js - お気に入り
- NotificationsScreen.js - 通知

**詳細機能**
- BarDetailScreen.js - バー詳細
- VenueDetailScreen.jsx - 店舗詳細
- ChatScreen.jsx - チャット
- EventScreen.jsx - イベント
- ReservationScreen.jsx - 予約

**ユーザー管理 (`profile/`)**
- ProfileScreen.js - プロフィール
- ProfileEditScreen.js - プロフィール編集
- ChangePasswordScreen.js - パスワード変更
- SettingsScreen.js - 設定

**アカウント (`account/`)**
- AccountManagementScreen.js - アカウント管理

**通知 (`notifications/`)**
- NotificationHistoryScreen.js - 通知履歴
- NotificationPermissionScreen.js - 通知許可
- NotificationSettingsScreen.js - 通知設定

**プライバシー (`privacy/`)**
- PrivacySettingsScreen.js - プライバシー設定

**セキュリティ (`security/`)**
- AccessHistoryScreen.js - アクセス履歴
- DeviceManagementScreen.js - デバイス管理
- SecuritySettingsScreen.js - セキュリティ設定

**アクティビティ (`activity/`)**
- ActivityScreen.js - アクティビティ

#### **🔧 サービス層 (`services/`)**

**認証・セキュリティ**
- AuthService.js - 認証サービス
- EnhancedAuthService.js - 拡張認証
- JWTService.js - JWT管理
- SessionService.js - セッション管理
- SessionManager.js - セッション制御
- EncryptionService.js - 暗号化
- SecurityManagerService.js - セキュリティ管理
- SecurityIncidentService.js - セキュリティインシデント

**API・通信**
- ApiClient.js - API クライアント
- ApiService.js - API サービス
- ApiSecurityService.js - API セキュリティ
- RateLimiter.js - レート制限
- RetryService.js - リトライ機能
- CircuitBreakerService.js - サーキットブレーカー

**データ管理**
- DatabaseService.js - データベース
- DatabaseSchemaService.js - スキーマ管理
- DataBackupService.js - バックアップ
- DataMigrationService.js - データ移行
- DataSyncService.js - データ同期
- OfflineDataService.js - オフラインデータ
- LocalStorageService.js - ローカルストレージ

**ユーザー機能**
- FavoritesService.js - お気に入り
- ActivityService.js - アクティビティ
- NotificationService.js - 通知
- PushNotificationService.js - プッシュ通知
- LocationService.js - 位置情報

**店舗・地図**
- VenueSearchService.js - 店舗検索
- VenueReviewService.js - 店舗レビュー
- VenueMapService.js - 店舗地図
- MapNavigationService.js - 地図ナビゲーション
- RouteService.js - ルート計算

**予約・決済**
- ReservationService.js - 予約管理
- PaymentService.js - 決済処理
- BillingService.js - 課金管理
- InAppPurchaseService.js - アプリ内課金

**コミュニケーション**
- ChatMessagingService.js - チャット
- SocialService.js - ソーシャル機能
- MediaSharingService.js - メディア共有
- ReviewManagementService.js - レビュー管理

**システム・監視**
- ConfigService.js - 設定管理
- LoggingService.js - ログ記録
- LogManagementService.js - ログ管理
- PerformanceMonitoringService.js - パフォーマンス監視
- MonitoringManager.js - 監視管理
- SystemHealthService.js - システムヘルス
- ErrorHandlerService.js - エラー処理
- ErrorReportService.js - エラーレポート
- ErrorTrackingService.js - エラートラッキング
- CrashReportingService.js - クラッシュレポート
- UserFriendlyErrorService.js - ユーザーフレンドリーエラー

**コンプライアンス・法務**
- DataProtectionService.js - データ保護
- ConsentManagementService.js - 同意管理
- PrivacyPolicyService.js - プライバシーポリシー
- TermsOfServiceService.js - 利用規約
- LegalNoticeService.js - 法的通知
- ComplianceReportService.js - コンプライアンスレポート
- DataErasureService.js - データ削除
- DataPortabilityService.js - データポータビリティ
- AgeVerificationService.js - 年齢確認

**ファイル・ストレージ**
- FileStorageService.js - ファイルストレージ

**機能フラグ・実験**
- FeatureFlagService.js - 機能フラグ

**バージョン管理**
- VersionManagementService.js - バージョン管理

**アクセス制御**
- AccessControlService.js - アクセス制御

**イベント**
- EventService.js - イベント管理

**フェイルセーフ**
- FailsafeService.js - フェイルセーフ

**ストア連携**
- AppStoreService.js - アプリストア

**管理者機能**
- AdminAuthService.js - 管理者認証
- AdminBillingService.js - 管理者課金

#### **🔗 API エンドポイント (`services/api/`)**
- ActivityApi.js - アクティビティAPI
- AuthApi.js - 認証API
- NotificationApi.js - 通知API
- SessionApi.js - セッションAPI
- UserApi.js - ユーザーAPI
- VenueApi.js - 店舗API

#### **🎣 カスタムフック (`hooks/`)**
- useApi.js - API フック
- useSecureAuth.js - 認証フック

#### **🧪 テストスイート**
**単体テスト**
- 各コンポーネントのテスト
- サービス層のテスト
- API層のテスト
- ユーティリティのテスト

**統合テスト (`__tests__/integration/`)**
- ApiIntegration.test.js - API統合テスト
- AuthFlow.test.js - 認証フローテスト
- ComponentIntegration.test.js - コンポーネント統合
- EndToEndScenarios.test.js - E2Eシナリオ
- NavigationIntegration.test.js - ナビゲーション統合

---

## 🚧 **一時無効化された機能**

### **管理者機能 (`temp-disabled/`)**
- AdminBillingScreen.js - 管理者課金画面
- AdminDashboardScreen.js - 管理者ダッシュボード
- AdminLoginScreen.js - 管理者ログイン
- UserManagementScreen.js - ユーザー管理

### **VIP・課金機能**
- VIPScreen.jsx - VIP画面
- SubscriptionScreen.js - サブスクリプション
- VIPBenefitsService.js - VIP特典サービス

### **高度なセキュリティ**
- SecurityScanService.js - セキュリティスキャン
- ABTestService.js - A/Bテスト

### **Fresh/Denoコンポーネント**
- Fresh framework関連ファイル全て
- Twind CSS関連
- Deno設定ファイル

---

## 📊 **技術仕様**

### **現在のMVP技術スタック**
- **フレームワーク**: Expo Router
- **UI**: React Native
- **アイコン**: Ionicons
- **ナビゲーション**: Tab-based
- **状態管理**: React hooks (useState)
- **スタイリング**: StyleSheet

### **依存関係（16パッケージ）**
```json
{
  "@expo/vector-icons": "^14.1.0",
  "@react-native-async-storage/async-storage": "^2.1.2",
  "expo": "~53.0.20",
  "expo-constants": "~17.1.7",
  "expo-font": "~13.3.2",
  "expo-linking": "~7.1.7",
  "expo-router": "~5.1.4",
  "expo-splash-screen": "^0.30.10",
  "expo-status-bar": "~2.2.3",
  "expo-system-ui": "~5.0.10",
  "react": "19.0.0",
  "react-native": "0.79.5",
  "react-native-gesture-handler": "~2.24.0",
  "react-native-reanimated": "~3.17.4",
  "react-native-safe-area-context": "^5.4.0",
  "react-native-screens": "~4.11.1"
}
```

### **完全版技術スタック**
- **追加フレームワーク**: Fresh (Deno)
- **CSS**: Twind
- **地図**: Google Maps API
- **認証**: JWT + セキュアストレージ
- **データベース**: 設定済み（詳細はバックアップ参照）
- **決済**: アプリ内課金対応
- **通知**: プッシュ通知
- **分析**: パフォーマンス監視
- **セキュリティ**: 多層防御

---

## 🎯 **機能開発状況**

### **✅ 完了（MVP）**
- 基本UI/UX
- タブナビゲーション
- デザインシステム
- プレースホルダー画面

### **🚧 開発中**
- 地図機能の実装
- 検索機能の実装
- お気に入り機能の実装

### **⏳ 未実装（バックアップ済み）**
- 認証システム
- 店舗詳細表示
- 予約システム
- 決済システム
- 管理者機能
- VIP機能
- 高度なセキュリティ

---

## 📈 **今後の開発ロードマップ**

### **Phase 1: MVP機能強化**
1. 地図機能の実装
2. 検索機能の実装
3. お気に入り機能の実装
4. 基本認証の実装

### **Phase 2: コア機能復旧**
1. 店舗データ連携
2. レビューシステム
3. 通知機能
4. ユーザープロフィール

### **Phase 3: 高度機能**
1. 予約システム
2. 決済機能
3. VIP機能
4. 管理者機能

### **Phase 4: エンタープライズ**
1. 高度セキュリティ
2. 分析・監視
3. A/Bテスト
4. コンプライアンス

---

**📝 注記**: 全ての機能は適切にバックアップされており、段階的に復旧可能です。MVPは本番リリース可能な状態です。