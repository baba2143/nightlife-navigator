# 🔐 Nightlife Navigator - 認証システム仕様書

## 📅 作成日
2025年7月21日

## 🎯 概要
Nightlife Navigatorの認証システムは、セキュリティとユーザビリティを両立した高度な認証基盤です。

---

## 🏗️ **システム構成**

### **📱 クライアントサイド認証フロー**

#### **1. AuthService (メインサービス)**
```javascript
// src-backup/services/AuthService.js
class AuthService {
  // 基本機能
  - initialize()           // サービス初期化
  - login(credentials)     // ログイン
  - logout()              // ログアウト
  - register(userData)    // ユーザー登録
  - refreshToken()        // トークンリフレッシュ
  
  // 高度機能
  - biometricLogin()      // 生体認証ログイン
  - twoFactorAuth()       // 二段階認証
  - socialLogin()         // ソーシャルログイン
}
```

#### **2. EnhancedAuthService (拡張サービス)**
```javascript
// src-backup/services/EnhancedAuthService.js
class EnhancedAuthService {
  - request()             // 認証付きHTTPリクエスト
  - retryLogic()          // 自動リトライ機能
  - tokenRefresh()        // 自動トークン更新
  - apiIntegration()      // APIサービス統合
}
```

---

## 🔑 **認証方式**

### **1. 基本認証（Email/Password）**
```javascript
// ログイン例
const loginResult = await AuthService.login({
  email: "user@example.com",
  password: "SecurePassword123",
  rememberMe: true,
  enableBiometric: true
});
```

**機能:**
- ✅ JWT ベース認証
- ✅ セキュアストレージ保存
- ✅ 自動トークンリフレッシュ
- ✅ レート制限（5分間に5回まで）
- ✅ アカウントロック機能

### **2. 生体認証**
```javascript
// 生体認証設定
const biometricSetup = {
  enabled: true,
  types: ['fingerprint', 'faceID', 'iris'],
  fallback: 'パスコード認証',
  reason: 'アプリにアクセスするために認証が必要です'
};
```

**対応デバイス:**
- ✅ iOS: Face ID, Touch ID
- ✅ Android: 指紋認証, 顔認証
- ✅ 自動フォールバック機能

### **3. ソーシャルログイン**
```javascript
// 対応プロバイダー
const socialProviders = {
  google: {
    scopes: ['email', 'profile'],
    enabled: true
  },
  apple: {
    scopes: ['email', 'name'],
    enabled: true
  },
  line: {
    scopes: ['profile', 'openid', 'email'],
    enabled: true
  }
};
```

---

## 🛡️ **セキュリティ機能**

### **1. JWTトークン管理**
```javascript
// JWT設定
{
  accessToken: {
    expiry: "15分",
    algorithm: "RS256",
    audience: "nightlife-navigator-users"
  },
  refreshToken: {
    expiry: "7日",
    rotationEnabled: true,
    maxConcurrentSessions: 3
  }
}
```

### **2. パスワードポリシー**
```javascript
// パスワード要件
{
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSymbols: false,    // オプション
  bcryptRounds: 12
}
```

### **3. アカウント保護**
```javascript
// セキュリティ設定
{
  accountLockout: {
    maxAttempts: 5,           // 最大試行回数
    lockoutDuration: "15分",   // ロック時間
    resetTime: "1時間"        // 試行回数リセット
  },
  sessionSecurity: {
    fingerprinting: true,     // デバイスフィンガープリント
    deviceTracking: true,     // デバイス追跡
    ipValidation: false       // IP制限（オプション）
  }
}
```

---

## 👥 **ユーザーロール・権限**

### **1. ロール定義**
```javascript
// 4段階のユーザーロール
{
  USER: {
    permissions: [
      'venues.view',         // 店舗閲覧
      'venues.favorite',     // お気に入り
      'coupons.view',        // クーポン閲覧
      'reviews.create',      // レビュー作成
      'profile.edit'         // プロフィール編集
    ]
  },
  
  PREMIUM: {
    permissions: [
      '...USER権限',
      'venues.advanced_search', // 高度検索
      'coupons.premium',        // プレミアムクーポン
      'analytics.view_own'      // 個人分析
    ]
  },
  
  VENUE_OWNER: {
    permissions: [
      'venues.manage_own',      // 自店舗管理
      'coupons.create',         // クーポン作成
      'analytics.view_own',     // 店舗分析
      'customers.view_own',     // 顧客管理
      'reviews.respond'         // レビュー返信
    ]
  },
  
  ADMIN: {
    permissions: [
      'venues.manage_all',      // 全店舗管理
      'users.manage',           // ユーザー管理
      'system.configure',       // システム設定
      'reviews.moderate'        // レビュー管理
    ]
  }
}
```

### **2. 権限チェック機能**
```javascript
// 権限確認例
const canAccessVenueManagement = await AuthService.hasPermission('venues.manage_own');
const userRole = AuthService.getCurrentUserRole();
const permissions = AuthService.getUserPermissions();
```

---

## 📱 **UI コンポーネント**

### **1. ログイン画面 (LoginScreen.js)**
```javascript
// 主要機能
{
  emailLogin: true,           // メール/パスワード
  socialLogin: true,          // ソーシャルログイン
  biometricLogin: true,       // 生体認証
  forgotPassword: true,       // パスワードリセット
  rememberMe: true,           // ログイン状態保持
  validation: 'realtime'      // リアルタイム検証
}
```

**UI要素:**
- ✅ アニメーション付きフォーム
- ✅ ソフトピンクテーマ統一
- ✅ エラーハンドリング表示
- ✅ アクセシビリティ対応

### **2. 新規登録画面 (RegisterScreen.js)**
```javascript
// 登録フロー
{
  step1: 'メールアドレス入力',
  step2: 'パスワード設定',
  step3: 'プロフィール情報',
  step4: 'メール確認',
  step5: '登録完了'
}
```

### **3. 認証関連コンポーネント**
- **SecureLoginForm.js** - セキュア入力フォーム
- **BiometricPrompt** - 生体認証プロンプト
- **SocialLoginButtons** - ソーシャルログインボタン
- **PasswordStrengthMeter** - パスワード強度表示

---

## 🔧 **技術実装**

### **1. ストレージ戦略**
```javascript
// セキュアストレージ
{
  ios: 'Keychain Services',     // iOS Keychain
  android: 'Android Keystore', // Android キーストア
  web: 'AES暗号化 + localStorage' // Web環境
}

// ストレージキー
{
  accessToken: '@nightlife_navigator:access_token',
  refreshToken: '@nightlife_navigator:refresh_token',
  userData: '@nightlife_navigator:user_data',
  biometricEnabled: '@nightlife_navigator:biometric_enabled'
}
```

### **2. API通信**
```javascript
// 認証付きAPIリクエスト
const apiCall = await EnhancedAuthService.request('/api/venues', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  timeout: 10000,
  retryAttempts: 3
});
```

### **3. エラーハンドリング**
```javascript
// 認証エラー分類
{
  INVALID_CREDENTIALS: 'メールアドレスまたはパスワードが正しくありません',
  ACCOUNT_LOCKED: 'アカウントがロックされています',
  EMAIL_NOT_VERIFIED: 'メールアドレスの確認が完了していません',
  TOKEN_EXPIRED: 'セッションの有効期限が切れました',
  BIOMETRIC_NOT_AVAILABLE: '生体認証が利用できません',
  NETWORK_ERROR: 'ネットワークエラーが発生しました'
}
```

---

## 🎯 **状態管理**

### **1. AuthContext**
```javascript
// React Context for認証状態
const AuthContext = {
  isAuthenticated: boolean,
  currentUser: User | null,
  permissions: string[],
  login: (credentials) => Promise,
  logout: () => Promise,
  refreshToken: () => Promise,
  hasPermission: (permission) => boolean
};
```

### **2. ユーザー情報**
```javascript
// ユーザーオブジェクト構造
const currentUser = {
  id: "user_123",
  email: "user@example.com",
  username: "nightlife_user",
  displayName: "ナイトライフユーザー",
  role: "USER",
  permissions: ["venues.view", "coupons.view"],
  profile: {
    avatar: "https://...",
    bio: "ナイトライフ愛好家",
    preferences: {},
    location: "東京都"
  },
  settings: {
    biometricEnabled: true,
    notificationsEnabled: true,
    language: "ja"
  },
  metadata: {
    lastLogin: "2025-07-21T10:00:00Z",
    loginCount: 42,
    deviceInfo: {},
    createdAt: "2025-01-01T00:00:00Z"
  }
};
```

---

## 🔄 **認証フロー**

### **1. 初回ログイン**
```
1. ユーザー入力（メール/パスワード）
2. 入力値検証・サニタイズ
3. レート制限チェック
4. API認証リクエスト
5. JWTトークン受信・検証
6. セキュアストレージ保存
7. ユーザー情報設定
8. 生体認証設定（オプション）
9. ホーム画面遷移
```

### **2. 自動ログイン**
```
1. アプリ起動
2. ストレージからトークン取得
3. JWT有効性検証
4. 期限切れの場合リフレッシュ
5. ユーザー情報復元
6. 認証状態設定
```

### **3. 生体認証ログイン**
```
1. 生体認証利用可能性チェック
2. 生体認証プロンプト表示
3. 認証成功でトークン取得
4. 自動ログイン処理
```

---

## 📊 **監視・ログ機能**

### **1. 認証ログ**
```javascript
// 記録される認証イベント
{
  loginAttempts: true,        // ログイン試行
  successfulLogins: true,     // 成功ログイン
  failedLogins: true,         // 失敗ログイン
  logoutEvents: true,         // ログアウト
  tokenRefresh: false,        // トークンリフレッシュ
  biometricUsage: true,       // 生体認証使用
  passwordChanges: true,      // パスワード変更
  accountLockouts: true       // アカウントロック
}
```

### **2. セキュリティ監視**
```javascript
// セキュリティイベント監視
{
  suspiciousActivity: true,   // 不審なアクティビティ
  bruteForceAttempts: true,   // ブルートフォース攻撃
  multipleDeviceLogins: true, // 複数デバイスログイン
  locationAnomalies: true,    // 位置情報異常
  deviceChanges: true         // デバイス変更
}
```

---

## 🚀 **実装段階**

### **Phase 1: 基本認証 (2-3週間)**
- ✅ メール/パスワード認証
- ✅ JWT トークン管理
- ✅ セキュアストレージ
- ✅ 基本UI

### **Phase 2: 高度認証 (3-4週間)**
- ✅ 生体認証
- ✅ ソーシャルログイン
- ✅ 二段階認証
- ✅ パスワードリセット

### **Phase 3: セキュリティ強化 (2-3週間)**
- ✅ レート制限
- ✅ アカウントロック
- ✅ デバイス追跡
- ✅ 監視・ログ

### **Phase 4: エンタープライズ機能 (3-4週間)**
- ✅ ロール・権限管理
- ✅ 監査ログ
- ✅ コンプライアンス
- ✅ 高度セキュリティ

---

## 💡 **開発推奨事項**

### **1. セキュリティ最優先**
- すべての認証データは暗号化保存
- HTTPS通信必須
- 機密情報のログ出力禁止
- 定期的なセキュリティ監査

### **2. ユーザビリティ重視**
- 生体認証でスムーズなログイン
- 明確なエラーメッセージ
- アクセシビリティ対応
- 直感的なUI/UX

### **3. 段階的実装**
- MVP: 基本認証のみ
- v1.1: 生体認証追加
- v1.2: ソーシャルログイン
- v2.0: エンタープライズ機能

---

**📝 注記**: この認証システムは`src-backup/`に完全実装済みで、段階的に復旧・統合可能です。セキュリティとユーザビリティを両立した業界標準の認証基盤です。