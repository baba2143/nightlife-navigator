import "$std/dotenv/load.ts";

// 環境変数の型定義
export interface AppConfig {
  // 基本設定
  environment: "development" | "staging" | "production";
  port: number;
  host: string;
  
  // データベース設定
  databaseUrl: string;
  
  // JWT設定
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshTokenExpiresIn: string;
  
  // 外部API設定
  googleMapsApiKey?: string;
  
  // ファイルアップロード設定
  uploadPath: string;
  maxFileSize: number;
  allowedExtensions: string[];
  
  // CORS設定
  corsOrigins: string[];
  
  // レート制限設定
  rateLimitWindow: number;
  rateLimitMaxRequests: number;
  
  // ログ設定
  logLevel: "debug" | "info" | "warn" | "error";
  logFile?: string;
  
  // セキュリティ設定
  sessionSecret: string;
  cookieSecure: boolean;
  cookieSameSite: "strict" | "lax" | "none";
  
  // バックアップ設定
  backupInterval: number;
  backupRetentionDays: number;
}

// 必須環境変数のリスト
const REQUIRED_ENV_VARS = [
  "JWT_SECRET",
  "SESSION_SECRET",
] as const;

// 環境変数のデフォルト値
const DEFAULT_VALUES: Partial<AppConfig> = {
  environment: "development",
  port: 8000,
  host: "localhost",
  databaseUrl: "./data/nightlife_navigator.db",
  jwtExpiresIn: "24h",
  refreshTokenExpiresIn: "7d",
  uploadPath: "./uploads",
  maxFileSize: 10485760, // 10MB
  allowedExtensions: ["jpg", "jpeg", "png", "gif", "webp"],
  corsOrigins: ["http://localhost:8000"],
  rateLimitWindow: 15,
  rateLimitMaxRequests: 100,
  logLevel: "info",
  cookieSecure: false,
  cookieSameSite: "lax",
  backupInterval: 24,
  backupRetentionDays: 30,
};

// 環境変数のバリデーション
class EnvValidationError extends Error {
  constructor(message: string) {
    super(`Environment Variable Error: ${message}`);
    this.name = "EnvValidationError";
  }
}

// 文字列から配列への変換
function parseStringArray(value: string | undefined, defaultValue: string[] = []): string[] {
  if (!value) return defaultValue;
  return value.split(',').map(item => item.trim()).filter(Boolean);
}

// 文字列から数値への変換
function parseNumber(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new EnvValidationError(`Invalid number value: ${value}`);
  }
  return parsed;
}

// 文字列からブール値への変換
function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

// JWT秘密鍵の強度チェック
function validateJwtSecret(secret: string): void {
  if (secret.length < 32) {
    throw new EnvValidationError("JWT_SECRET must be at least 32 characters long");
  }
  
  // 本番環境での弱い秘密鍵チェック
  const weakSecrets = [
    "your-super-secret-jwt-key-change-this-in-production",
    "secret",
    "password",
    "123456",
    "default",
  ];
  
  if (Deno.env.get("DENO_ENV") === "production" && 
      weakSecrets.some(weak => secret.includes(weak))) {
    throw new EnvValidationError("JWT_SECRET appears to be a default/weak value in production");
  }
}

// Google Maps API キーの検証
function validateGoogleMapsApiKey(apiKey: string | undefined): void {
  if (!apiKey) return;
  
  // 基本的な形式チェック
  if (!apiKey.startsWith("AIza") || apiKey.length < 30) {
    throw new EnvValidationError("GOOGLE_MAPS_API_KEY appears to be invalid");
  }
}

// 環境変数の読み込みと検証
export function loadConfig(): AppConfig {
  console.log("🔧 Loading and validating environment variables...");
  
  // 必須環境変数のチェック
  for (const requiredVar of REQUIRED_ENV_VARS) {
    const value = Deno.env.get(requiredVar);
    if (!value) {
      throw new EnvValidationError(`Required environment variable ${requiredVar} is not set`);
    }
  }
  
  // JWT秘密鍵の検証
  const jwtSecret = Deno.env.get("JWT_SECRET")!;
  validateJwtSecret(jwtSecret);
  
  // Google Maps API キーの検証
  const googleMapsApiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
  validateGoogleMapsApiKey(googleMapsApiKey);
  
  // 環境の決定
  const envValue = Deno.env.get("DENO_ENV") || DEFAULT_VALUES.environment!;
  if (!["development", "staging", "production"].includes(envValue)) {
    throw new EnvValidationError(`Invalid DENO_ENV value: ${envValue}`);
  }
  
  // 設定オブジェクトの構築
  const config: AppConfig = {
    environment: envValue as AppConfig["environment"],
    port: parseNumber(Deno.env.get("PORT"), DEFAULT_VALUES.port!),
    host: Deno.env.get("HOST") || DEFAULT_VALUES.host!,
    
    databaseUrl: Deno.env.get("DATABASE_URL") || DEFAULT_VALUES.databaseUrl!,
    
    jwtSecret,
    jwtExpiresIn: Deno.env.get("JWT_EXPIRES_IN") || DEFAULT_VALUES.jwtExpiresIn!,
    refreshTokenExpiresIn: Deno.env.get("REFRESH_TOKEN_EXPIRES_IN") || DEFAULT_VALUES.refreshTokenExpiresIn!,
    
    googleMapsApiKey,
    
    uploadPath: Deno.env.get("UPLOAD_PATH") || DEFAULT_VALUES.uploadPath!,
    maxFileSize: parseNumber(Deno.env.get("MAX_FILE_SIZE"), DEFAULT_VALUES.maxFileSize!),
    allowedExtensions: parseStringArray(Deno.env.get("ALLOWED_EXTENSIONS"), DEFAULT_VALUES.allowedExtensions!),
    
    corsOrigins: parseStringArray(Deno.env.get("CORS_ORIGINS"), DEFAULT_VALUES.corsOrigins!),
    
    rateLimitWindow: parseNumber(Deno.env.get("RATE_LIMIT_WINDOW"), DEFAULT_VALUES.rateLimitWindow!),
    rateLimitMaxRequests: parseNumber(Deno.env.get("RATE_LIMIT_MAX_REQUESTS"), DEFAULT_VALUES.rateLimitMaxRequests!),
    
    logLevel: (Deno.env.get("LOG_LEVEL") as AppConfig["logLevel"]) || DEFAULT_VALUES.logLevel!,
    logFile: Deno.env.get("LOG_FILE"),
    
    sessionSecret: Deno.env.get("SESSION_SECRET")!,
    cookieSecure: parseBoolean(Deno.env.get("COOKIE_SECURE"), DEFAULT_VALUES.cookieSecure!),
    cookieSameSite: (Deno.env.get("COOKIE_SAME_SITE") as AppConfig["cookieSameSite"]) || DEFAULT_VALUES.cookieSameSite!,
    
    backupInterval: parseNumber(Deno.env.get("BACKUP_INTERVAL"), DEFAULT_VALUES.backupInterval!),
    backupRetentionDays: parseNumber(Deno.env.get("BACKUP_RETENTION_DAYS"), DEFAULT_VALUES.backupRetentionDays!),
  };
  
  // 設定の後処理検証
  validateConfig(config);
  
  console.log("✅ Environment variables loaded successfully");
  console.log(`🌍 Environment: ${config.environment}`);
  console.log(`🚪 Server will run on ${config.host}:${config.port}`);
  
  return config;
}

// 設定の整合性チェック
function validateConfig(config: AppConfig): void {
  // ポート番号の範囲チェック
  if (config.port < 1 || config.port > 65535) {
    throw new EnvValidationError(`Invalid port number: ${config.port}`);
  }
  
  // 本番環境でのセキュリティチェック
  if (config.environment === "production") {
    if (!config.cookieSecure) {
      console.warn("⚠️  Warning: COOKIE_SECURE is false in production environment");
    }
    
    if (config.corsOrigins.includes("*")) {
      throw new EnvValidationError("CORS_ORIGINS cannot include '*' in production");
    }
    
    if (config.logLevel === "debug") {
      console.warn("⚠️  Warning: LOG_LEVEL is set to debug in production");
    }
  }
  
  // ファイルサイズの上限チェック
  if (config.maxFileSize > 50 * 1024 * 1024) { // 50MB
    console.warn(`⚠️  Warning: MAX_FILE_SIZE is very large: ${config.maxFileSize} bytes`);
  }
  
  // レート制限の妥当性チェック
  if (config.rateLimitMaxRequests < 1) {
    throw new EnvValidationError("RATE_LIMIT_MAX_REQUESTS must be greater than 0");
  }
}

// グローバル設定インスタンス
let globalConfig: AppConfig | null = null;

// 設定の取得（シングルトンパターン）
export function getConfig(): AppConfig {
  if (!globalConfig) {
    globalConfig = loadConfig();
  }
  return globalConfig;
}

// 設定の再読み込み
export function reloadConfig(): AppConfig {
  globalConfig = loadConfig();
  return globalConfig;
}

// 開発環境の判定
export function isDevelopment(): boolean {
  return getConfig().environment === "development";
}

// 本番環境の判定
export function isProduction(): boolean {
  return getConfig().environment === "production";
}

// ステージング環境の判定
export function isStaging(): boolean {
  return getConfig().environment === "staging";
}

// 設定情報の安全な表示（秘密情報を除外）
export function getConfigSummary(): Record<string, any> {
  const config = getConfig();
  
  return {
    environment: config.environment,
    port: config.port,
    host: config.host,
    databaseUrl: config.databaseUrl.replace(/\/[^\/]+\.db$/, "/*****.db"),
    hasGoogleMapsApiKey: !!config.googleMapsApiKey,
    uploadPath: config.uploadPath,
    maxFileSize: config.maxFileSize,
    allowedExtensions: config.allowedExtensions,
    corsOrigins: config.corsOrigins,
    rateLimitWindow: config.rateLimitWindow,
    rateLimitMaxRequests: config.rateLimitMaxRequests,
    logLevel: config.logLevel,
    cookieSecure: config.cookieSecure,
    cookieSameSite: config.cookieSameSite,
    backupInterval: config.backupInterval,
    backupRetentionDays: config.backupRetentionDays,
  };
}