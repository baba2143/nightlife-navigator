import { MiddlewareHandlerContext } from "$fresh/server.ts";
import { getConfig } from "./env.ts";

// セキュリティ設定
export interface SecurityConfig {
  cors: {
    origins: string[];
    methods: string[];
    headers: string[];
    credentials: boolean;
  };
  csp: {
    enabled: boolean;
    directives: Record<string, string[]>;
  };
  headers: {
    hsts: boolean;
    xFrameOptions: string;
    xContentTypeOptions: boolean;
    xXssProtection: string;
    referrerPolicy: string;
    permissionsPolicy: string[];
  };
  rateLimit: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
    skipPaths: string[];
  };
}

// デフォルトセキュリティ設定
const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  cors: {
    origins: ["http://localhost:8000"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    headers: [
      "Origin",
      "X-Requested-With", 
      "Content-Type",
      "Accept",
      "Authorization",
      "X-CSRF-Token"
    ],
    credentials: true,
  },
  csp: {
    enabled: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-inline'", "https://maps.googleapis.com"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "img-src": ["'self'", "data:", "https:"],
      "font-src": ["'self'", "https://fonts.gstatic.com"],
      "connect-src": ["'self'", "https://maps.googleapis.com"],
      "frame-src": ["'none'"],
      "object-src": ["'none'"],
      "base-uri": ["'self'"],
      "form-action": ["'self'"],
    },
  },
  headers: {
    hsts: true,
    xFrameOptions: "DENY",
    xContentTypeOptions: true,
    xXssProtection: "1; mode=block",
    referrerPolicy: "strict-origin-when-cross-origin",
    permissionsPolicy: [
      "geolocation=(self)",
      "microphone=()",
      "camera=()",
      "payment=()",
      "usb=()",
      "magnetometer=()",
      "gyroscope=()",
      "accelerometer=()",
    ],
  },
  rateLimit: {
    enabled: true,
    windowMs: 15 * 60 * 1000, // 15分
    maxRequests: 100,
    skipPaths: ["/api/health", "/static"],
  },
};

// レート制限用のメモリストア
class RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();
  
  increment(key: string, windowMs: number): { count: number; resetTime: number } {
    const now = Date.now();
    const resetTime = now + windowMs;
    
    const existing = this.store.get(key);
    
    if (!existing || existing.resetTime < now) {
      // 新しいウィンドウまたは期限切れ
      const entry = { count: 1, resetTime };
      this.store.set(key, entry);
      return entry;
    } else {
      // 既存のウィンドウ内
      existing.count++;
      return existing;
    }
  }
  
  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (value.resetTime < now) {
        this.store.delete(key);
      }
    }
  }
}

const rateLimitStore = new RateLimitStore();

// 定期的にレート制限ストアをクリーンアップ
setInterval(() => {
  rateLimitStore.cleanup();
}, 5 * 60 * 1000); // 5分ごと

// セキュリティ設定の取得
export function getSecurityConfig(): SecurityConfig {
  const appConfig = getConfig();
  
  return {
    ...DEFAULT_SECURITY_CONFIG,
    cors: {
      ...DEFAULT_SECURITY_CONFIG.cors,
      origins: appConfig.corsOrigins,
    },
    headers: {
      ...DEFAULT_SECURITY_CONFIG.headers,
      hsts: appConfig.cookieSecure, // HTTPSが有効な場合のみHSTSを有効
    },
    rateLimit: {
      ...DEFAULT_SECURITY_CONFIG.rateLimit,
      windowMs: appConfig.rateLimitWindow * 60 * 1000,
      maxRequests: appConfig.rateLimitMaxRequests,
    },
  };
}

// CORS処理
function handleCors(req: Request, config: SecurityConfig["cors"]): Headers {
  const headers = new Headers();
  const origin = req.headers.get("Origin");
  
  // Originのチェック
  if (origin && (config.origins.includes("*") || config.origins.includes(origin))) {
    headers.set("Access-Control-Allow-Origin", origin);
  }
  
  headers.set("Access-Control-Allow-Methods", config.methods.join(", "));
  headers.set("Access-Control-Allow-Headers", config.headers.join(", "));
  
  if (config.credentials) {
    headers.set("Access-Control-Allow-Credentials", "true");
  }
  
  // プリフライトリクエストの場合
  if (req.method === "OPTIONS") {
    headers.set("Access-Control-Max-Age", "86400"); // 24時間
  }
  
  return headers;
}

// CSP（Content Security Policy）の生成
function generateCSP(config: SecurityConfig["csp"]): string {
  if (!config.enabled) return "";
  
  const directives = Object.entries(config.directives)
    .map(([directive, sources]) => `${directive} ${sources.join(" ")}`)
    .join("; ");
  
  return directives;
}

// セキュリティヘッダーの設定
function setSecurityHeaders(headers: Headers, config: SecurityConfig): void {
  // HSTS (HTTP Strict Transport Security)
  if (config.headers.hsts) {
    headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
  
  // X-Frame-Options
  headers.set("X-Frame-Options", config.headers.xFrameOptions);
  
  // X-Content-Type-Options
  if (config.headers.xContentTypeOptions) {
    headers.set("X-Content-Type-Options", "nosniff");
  }
  
  // X-XSS-Protection
  headers.set("X-XSS-Protection", config.headers.xXssProtection);
  
  // Referrer-Policy
  headers.set("Referrer-Policy", config.headers.referrerPolicy);
  
  // Permissions-Policy
  if (config.headers.permissionsPolicy.length > 0) {
    headers.set("Permissions-Policy", config.headers.permissionsPolicy.join(", "));
  }
  
  // CSP
  const csp = generateCSP(config.csp);
  if (csp) {
    headers.set("Content-Security-Policy", csp);
  }
  
  // その他のセキュリティヘッダー
  headers.set("X-DNS-Prefetch-Control", "off");
  headers.set("X-Download-Options", "noopen");
  headers.set("X-Permitted-Cross-Domain-Policies", "none");
}

// レート制限チェック
function checkRateLimit(req: Request, config: SecurityConfig["rateLimit"]): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  if (!config.enabled) {
    return { allowed: true, remaining: config.maxRequests, resetTime: Date.now() };
  }
  
  const url = new URL(req.url);
  
  // スキップパスのチェック
  if (config.skipPaths.some(path => url.pathname.startsWith(path))) {
    return { allowed: true, remaining: config.maxRequests, resetTime: Date.now() };
  }
  
  // クライアントIPの取得（プロキシ経由の場合も考慮）
  const forwarded = req.headers.get("X-Forwarded-For");
  const realIp = req.headers.get("X-Real-IP");
  const clientIp = forwarded?.split(",")[0].trim() || realIp || "unknown";
  
  const key = `${clientIp}:${url.pathname}`;
  const result = rateLimitStore.increment(key, config.windowMs);
  
  return {
    allowed: result.count <= config.maxRequests,
    remaining: Math.max(0, config.maxRequests - result.count),
    resetTime: result.resetTime,
  };
}

// 入力サニタイゼーション
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") return "";
  
  return input
    .replace(/[<>]/g, "") // HTMLタグの除去
    .replace(/javascript:/gi, "") // JavaScript URLの除去
    .replace(/on\w+\s*=/gi, "") // イベントハンドラーの除去
    .trim();
}

// SQLインジェクション対策用のエスケープ
export function escapeSql(input: string): string {
  if (typeof input !== "string") return "";
  
  return input.replace(/'/g, "''");
}

// XSS対策用のHTMLエスケープ
export function escapeHtml(input: string): string {
  if (typeof input !== "string") return "";
  
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

// パスワード強度チェック
export function checkPasswordStrength(password: string): {
  isStrong: boolean;
  score: number;
  requirements: { met: boolean; description: string }[];
} {
  const requirements = [
    { test: /.{8,}/, description: "8文字以上" },
    { test: /[A-Z]/, description: "大文字を含む" },
    { test: /[a-z]/, description: "小文字を含む" },
    { test: /[0-9]/, description: "数字を含む" },
    { test: /[!@#$%^&*(),.?":{}|<>]/, description: "特殊文字を含む" },
  ];
  
  const results = requirements.map(req => ({
    met: req.test.test(password),
    description: req.description,
  }));
  
  const score = results.filter(r => r.met).length;
  const isStrong = score >= 4;
  
  return { isStrong, score, requirements: results };
}

// セキュリティミドルウェア
export function securityMiddleware() {
  return async (req: Request, ctx: MiddlewareHandlerContext) => {
    const config = getSecurityConfig();
    const url = new URL(req.url);
    
    // レート制限チェック
    const rateLimitResult = checkRateLimit(req, config.rateLimit);
    
    if (!rateLimitResult.allowed) {
      const headers = new Headers();
      headers.set("Content-Type", "application/json");
      headers.set("Retry-After", Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString());
      
      return new Response(JSON.stringify({
        error: "Too Many Requests",
        message: "レート制限に達しました。しばらく待ってから再試行してください。",
        retryAfter: rateLimitResult.resetTime,
      }), {
        status: 429,
        headers,
      });
    }
    
    // プリフライトリクエストの処理
    if (req.method === "OPTIONS") {
      const corsHeaders = handleCors(req, config.cors);
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }
    
    try {
      const response = await ctx.next();
      
      // レスポンスヘッダーの設定
      const headers = new Headers(response.headers);
      
      // CORSヘッダー
      const corsHeaders = handleCors(req, config.cors);
      for (const [key, value] of corsHeaders.entries()) {
        headers.set(key, value);
      }
      
      // セキュリティヘッダー
      setSecurityHeaders(headers, config);
      
      // レート制限情報
      headers.set("X-RateLimit-Limit", config.rateLimit.maxRequests.toString());
      headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString());
      headers.set("X-RateLimit-Reset", Math.ceil(rateLimitResult.resetTime / 1000).toString());
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
      
    } catch (error) {
      console.error("Security middleware error:", error);
      
      // エラー時も適切なヘッダーを設定
      const headers = new Headers();
      headers.set("Content-Type", "application/json");
      setSecurityHeaders(headers, config);
      
      return new Response(JSON.stringify({
        error: "Internal Server Error",
        message: "サーバー内部エラーが発生しました",
      }), {
        status: 500,
        headers,
      });
    }
  };
}

// セキュリティ監査ログ
export interface SecurityEvent {
  type: "rate_limit_exceeded" | "suspicious_request" | "auth_failure" | "xss_attempt" | "sql_injection_attempt";
  ip: string;
  userAgent: string;
  url: string;
  timestamp: string;
  details?: Record<string, any>;
}

const securityEvents: SecurityEvent[] = [];

export function logSecurityEvent(event: SecurityEvent): void {
  securityEvents.push(event);
  
  // 重要なセキュリティイベントはコンソールにも出力
  if (["sql_injection_attempt", "xss_attempt"].includes(event.type)) {
    console.warn(`🚨 Security Alert: ${event.type} from ${event.ip} at ${event.url}`);
  }
  
  // メモリ使用量制御（最新1000件のみ保持）
  if (securityEvents.length > 1000) {
    securityEvents.splice(0, securityEvents.length - 1000);
  }
}

export function getSecurityEvents(limit = 100): SecurityEvent[] {
  return securityEvents.slice(-limit);
}

// 疑わしいリクエストの検出
export function detectSuspiciousRequest(req: Request): SecurityEvent | null {
  const url = new URL(req.url);
  const userAgent = req.headers.get("User-Agent") || "";
  const forwarded = req.headers.get("X-Forwarded-For");
  const realIp = req.headers.get("X-Real-IP");
  const clientIp = forwarded?.split(",")[0].trim() || realIp || "unknown";
  
  // SQLインジェクション試行の検出
  const sqlPatterns = [
    /union\s+select/i,
    /drop\s+table/i,
    /insert\s+into/i,
    /update\s+.*set/i,
    /delete\s+from/i,
    /exec\s*\(/i,
    /script\s*>/i,
  ];
  
  const queryString = url.search;
  const pathname = url.pathname;
  
  for (const pattern of sqlPatterns) {
    if (pattern.test(queryString) || pattern.test(pathname)) {
      return {
        type: "sql_injection_attempt",
        ip: clientIp,
        userAgent,
        url: req.url,
        timestamp: new Date().toISOString(),
        details: { pattern: pattern.source },
      };
    }
  }
  
  // XSS試行の検出
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /eval\s*\(/i,
  ];
  
  for (const pattern of xssPatterns) {
    if (pattern.test(queryString) || pattern.test(pathname)) {
      return {
        type: "xss_attempt",
        ip: clientIp,
        userAgent,
        url: req.url,
        timestamp: new Date().toISOString(),
        details: { pattern: pattern.source },
      };
    }
  }
  
  return null;
}