import { crypto } from "https://deno.land/std@0.216.0/crypto/mod.ts";
import { encode, decode } from "https://deno.land/std@0.216.0/encoding/base64.ts";

// 秘密情報管理ユーティリティ

// 強力なランダム文字列の生成
export function generateSecureSecret(length: number = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  return Array.from(array, (byte) => chars[byte % chars.length]).join("");
}

// JWT用の安全な秘密鍵生成
export function generateJwtSecret(): string {
  return generateSecureSecret(64);
}

// セッション用の秘密鍵生成
export function generateSessionSecret(): string {
  return generateSecureSecret(32);
}

// API キーの生成（プレフィックス付き）
export function generateApiKey(prefix: string = "ak"): string {
  const timestamp = Date.now().toString(36);
  const randomPart = generateSecureSecret(24);
  return `${prefix}_${timestamp}_${randomPart}`;
}

// 秘密情報の強度チェック
export interface SecretStrength {
  score: number;
  level: "weak" | "fair" | "good" | "strong";
  suggestions: string[];
}

export function checkSecretStrength(secret: string): SecretStrength {
  let score = 0;
  const suggestions: string[] = [];
  
  // 長さのチェック
  if (secret.length >= 32) {
    score += 25;
  } else if (secret.length >= 16) {
    score += 15;
  } else {
    suggestions.push("最低16文字、推奨32文字以上にしてください");
  }
  
  // 文字種類のチェック
  const hasUppercase = /[A-Z]/.test(secret);
  const hasLowercase = /[a-z]/.test(secret);
  const hasNumbers = /[0-9]/.test(secret);
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(secret);
  
  if (hasUppercase) score += 15;
  else suggestions.push("大文字を含めてください");
  
  if (hasLowercase) score += 15;
  else suggestions.push("小文字を含めてください");
  
  if (hasNumbers) score += 15;
  else suggestions.push("数字を含めてください");
  
  if (hasSpecialChars) score += 20;
  else suggestions.push("特殊文字を含めてください");
  
  // エントロピーのチェック
  const uniqueChars = new Set(secret).size;
  if (uniqueChars / secret.length > 0.6) {
    score += 10;
  } else {
    suggestions.push("より多様な文字を使用してください");
  }
  
  // 弱いパターンのチェック
  const weakPatterns = [
    /(.)\1{3,}/,     // 同じ文字の4回以上の繰り返し
    /123456|password|secret|admin|user/i,  // 一般的な弱いパターン
    /qwerty|asdf|zxcv/i,  // キーボードパターン
  ];
  
  for (const pattern of weakPatterns) {
    if (pattern.test(secret)) {
      score -= 20;
      suggestions.push("予測可能なパターンを避けてください");
      break;
    }
  }
  
  // レベルの決定
  let level: SecretStrength["level"];
  if (score >= 80) level = "strong";
  else if (score >= 60) level = "good";
  else if (score >= 40) level = "fair";
  else level = "weak";
  
  return { score: Math.max(0, score), level, suggestions };
}

// 環境変数ファイルの暗号化
export async function encryptEnvFile(content: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  
  // パスワードからキーを導出
  const passwordData = encoder.encode(password);
  const key = await crypto.subtle.importKey(
    "raw",
    passwordData,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  
  // 暗号化キーの生成
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const encryptionKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    key,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );
  
  // データの暗号化
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedData = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    encryptionKey,
    data
  );
  
  // 結果の結合
  const result = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
  result.set(salt);
  result.set(iv, salt.length);
  result.set(new Uint8Array(encryptedData), salt.length + iv.length);
  
  return encode(result);
}

// 環境変数ファイルの復号化
export async function decryptEnvFile(encryptedContent: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  const data = decode(encryptedContent);
  
  // 各部分の抽出
  const salt = data.slice(0, 16);
  const iv = data.slice(16, 28);
  const encryptedData = data.slice(28);
  
  // パスワードからキーを導出
  const passwordData = encoder.encode(password);
  const key = await crypto.subtle.importKey(
    "raw",
    passwordData,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  
  // 復号化キーの生成
  const decryptionKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    key,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
  
  // データの復号化
  const decryptedData = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    decryptionKey,
    encryptedData
  );
  
  return decoder.decode(decryptedData);
}

// 環境変数のマスキング（ログ出力用）
export function maskSecret(secret: string, visibleChars: number = 4): string {
  if (!secret) return "";
  if (secret.length <= visibleChars * 2) {
    return "*".repeat(secret.length);
  }
  
  const start = secret.slice(0, visibleChars);
  const end = secret.slice(-visibleChars);
  const middle = "*".repeat(secret.length - visibleChars * 2);
  
  return `${start}${middle}${end}`;
}

// 秘密情報のローテーション履歴
export interface SecretRotation {
  type: string;
  oldValue: string;
  newValue: string;
  rotatedAt: string;
  rotatedBy?: string;
}

export class SecretManager {
  private rotationHistory: SecretRotation[] = [];
  
  // 秘密情報のローテーション
  rotateSecret(type: string, oldValue: string, rotatedBy?: string): string {
    let newValue: string;
    
    switch (type) {
      case "jwt":
        newValue = generateJwtSecret();
        break;
      case "session":
        newValue = generateSessionSecret();
        break;
      case "api_key":
        newValue = generateApiKey();
        break;
      default:
        newValue = generateSecureSecret();
    }
    
    // 履歴に記録
    this.rotationHistory.push({
      type,
      oldValue: maskSecret(oldValue),
      newValue: maskSecret(newValue),
      rotatedAt: new Date().toISOString(),
      rotatedBy,
    });
    
    return newValue;
  }
  
  // ローテーション履歴の取得
  getRotationHistory(): SecretRotation[] {
    return [...this.rotationHistory];
  }
  
  // 履歴のクリア
  clearHistory(): void {
    this.rotationHistory = [];
  }
  
  // 秘密情報の定期ローテーションチェック
  needsRotation(lastRotated: Date, rotationInterval: number = 90): boolean {
    const daysSinceRotation = (Date.now() - lastRotated.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceRotation >= rotationInterval;
  }
}

// グローバルシークレットマネージャー
export const secretManager = new SecretManager();

// 設定ファイルテンプレートの生成
export interface ConfigTemplate {
  development: Record<string, string>;
  staging: Record<string, string>;
  production: Record<string, string>;
}

export function generateConfigTemplate(): ConfigTemplate {
  const jwtSecret = generateJwtSecret();
  const sessionSecret = generateSessionSecret();
  
  return {
    development: {
      DENO_ENV: "development",
      PORT: "8000",
      HOST: "localhost",
      DATABASE_URL: "./data/nightlife_navigator.db",
      JWT_SECRET: jwtSecret,
      SESSION_SECRET: sessionSecret,
      COOKIE_SECURE: "false",
      CORS_ORIGINS: "http://localhost:8000",
      LOG_LEVEL: "debug",
    },
    staging: {
      DENO_ENV: "staging",
      PORT: "8000",
      HOST: "0.0.0.0",
      DATABASE_URL: "./data/nightlife_navigator.db",
      JWT_SECRET: generateJwtSecret(),
      SESSION_SECRET: generateSessionSecret(),
      COOKIE_SECURE: "true",
      CORS_ORIGINS: "https://staging.your-domain.com",
      LOG_LEVEL: "info",
    },
    production: {
      DENO_ENV: "production",
      PORT: "8000",
      HOST: "0.0.0.0",
      DATABASE_URL: "./data/nightlife_navigator.db",
      JWT_SECRET: generateJwtSecret(),
      SESSION_SECRET: generateSessionSecret(),
      COOKIE_SECURE: "true",
      CORS_ORIGINS: "https://your-domain.com",
      LOG_LEVEL: "warn",
    },
  };
}