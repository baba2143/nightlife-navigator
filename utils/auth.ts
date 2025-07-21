import { create, verify, getNumericDate } from "https://deno.land/x/djwt@v3.0.0/mod.ts";
import { crypto } from "https://deno.land/std@0.208.0/crypto/mod.ts";
import { logSecurityEvent } from "./security.ts";
import { getConfig } from "./env.ts";

const config = getConfig();
const JWT_SECRET = config.jwtSecret;
const JWT_ALGORITHM = "HS256";

export interface User {
  id: number;
  email: string;
  name: string;
  hashedPassword: string;
  avatar?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  role: 'user' | 'admin' | 'venue_owner';
}

export interface AuthTokenPayload {
  userId: number;
  email: string;
  name: string;
  role: string;
  iat: number;
  exp: number;
}

// パスワードハッシュ化
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// パスワード検証
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const hashedInput = await hashPassword(password);
  return hashedInput === hashedPassword;
}

// JWTトークン生成
export async function generateToken(user: User): Promise<string> {
  const payload: AuthTokenPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    iat: getNumericDate(new Date()),
    exp: getNumericDate(new Date(Date.now() + 24 * 60 * 60 * 1000)), // 24時間
  };

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );

  return await create({ alg: JWT_ALGORITHM, typ: "JWT" }, payload, key);
}

// JWTトークン検証
export async function verifyToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );

    const payload = await verify(token, key);
    return payload as AuthTokenPayload;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

// リフレッシュトークン生成（有効期限7日）
export async function generateRefreshToken(user: User): Promise<string> {
  const payload = {
    userId: user.id,
    email: user.email,
    type: "refresh",
    iat: getNumericDate(new Date()),
    exp: getNumericDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7日
  };

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );

  return await create({ alg: JWT_ALGORITHM, typ: "JWT" }, payload, key);
}

// Cookieからトークンを取得
export function getTokenFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').map(cookie => cookie.trim());
  const authCookie = cookies.find(cookie => cookie.startsWith('auth-token='));
  
  if (authCookie) {
    return authCookie.split('=')[1];
  }
  
  return null;
}

// Bearerトークンから取得
export function getTokenFromBearer(authHeader: string | null): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }
  
  return null;
}

// リクエストから認証情報を取得
export async function getUserFromRequest(req: Request): Promise<User | null> {
  // Cookieから取得を試行
  let token = getTokenFromCookie(req.headers.get('cookie'));
  
  // なければAuthorizationヘッダーから取得
  if (!token) {
    token = getTokenFromBearer(req.headers.get('authorization'));
  }
  
  if (!token) return null;
  
  const payload = await verifyToken(token);
  if (!payload) return null;
  
  // 実際の実装では、ここでデータベースからユーザー情報を取得
  // 現在はサンプルデータを返す
  return {
    id: payload.userId,
    email: payload.email,
    name: payload.name,
    hashedPassword: "", // セキュリティ上、パスワードハッシュは含めない
    role: payload.role as 'user' | 'admin' | 'venue_owner',
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
  };
}

// パスワード強度チェック
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push("パスワードは8文字以上である必要があります");
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push("パスワードには大文字を含める必要があります");
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push("パスワードには小文字を含める必要があります");
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push("パスワードには数字を含める必要があります");
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("パスワードには特殊文字を含める必要があります");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// メールアドレス検証
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// セキュアなランダム文字列生成
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// 認証ミドルウェア用のヘルパー
export interface AuthMiddlewareOptions {
  requireAuth?: boolean;
  allowedRoles?: string[];
  redirectTo?: string;
}

export async function withAuth(
  req: Request,
  options: AuthMiddlewareOptions = {}
): Promise<{ user: User | null; response: Response | null }> {
  const user = await getUserFromRequest(req);
  
  if (options.requireAuth && !user) {
    const redirectTo = options.redirectTo || '/login';
    return {
      user: null,
      response: new Response(null, {
        status: 302,
        headers: { Location: redirectTo }
      })
    };
  }
  
  if (options.allowedRoles && user && !options.allowedRoles.includes(user.role)) {
    return {
      user,
      response: new Response(JSON.stringify({
        error: 'アクセス権限がありません'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    };
  }
  
  return { user, response: null };
}

// Cookie設定のヘルパー
export function createAuthCookies(token: string, refreshToken: string): string[] {
  const isProduction = Deno.env.get("DENO_ENV") === "production";
  
  return [
    `auth-token=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${24 * 60 * 60}${isProduction ? '; Secure' : ''}`,
    `refresh-token=${refreshToken}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}${isProduction ? '; Secure' : ''}`
  ];
}

// ログアウト用のCookie削除
export function clearAuthCookies(): string[] {
  return [
    `auth-token=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0`,
    `refresh-token=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0`
  ];
}