import { logSecurityEvent } from "./security.ts";
import { getConfig } from "./env.ts";

// 認証セキュリティ拡張

// ログイン試行回数制限
class LoginAttemptTracker {
  private attempts = new Map<string, { count: number; lockUntil?: number; lastAttempt: number }>();
  private readonly maxAttempts = 5;
  private readonly lockDuration = 15 * 60 * 1000; // 15分
  private readonly windowDuration = 5 * 60 * 1000; // 5分
  
  isLocked(identifier: string): boolean {
    const record = this.attempts.get(identifier);
    if (!record) return false;
    
    const now = Date.now();
    
    // ロック期間が過ぎた場合はリセット
    if (record.lockUntil && record.lockUntil < now) {
      this.attempts.delete(identifier);
      return false;
    }
    
    return !!record.lockUntil;
  }
  
  recordFailedAttempt(identifier: string, ip: string, userAgent: string): {
    isLocked: boolean;
    remainingAttempts: number;
    lockUntil?: number;
  } {
    const now = Date.now();
    const record = this.attempts.get(identifier) || { count: 0, lastAttempt: 0 };
    
    // 時間窓がリセットされた場合
    if (now - record.lastAttempt > this.windowDuration) {
      record.count = 1;
    } else {
      record.count++;
    }
    
    record.lastAttempt = now;
    
    // 最大試行回数に達した場合
    if (record.count >= this.maxAttempts) {
      record.lockUntil = now + this.lockDuration;
      
      // セキュリティイベントをログ
      logSecurityEvent({
        type: "auth_failure",
        ip,
        userAgent,
        url: "/api/auth/login",
        timestamp: new Date().toISOString(),
        details: {
          identifier,
          attemptCount: record.count,
          lockDuration: this.lockDuration,
        },
      });
    }
    
    this.attempts.set(identifier, record);
    
    return {
      isLocked: !!record.lockUntil,
      remainingAttempts: Math.max(0, this.maxAttempts - record.count),
      lockUntil: record.lockUntil,
    };
  }
  
  recordSuccessfulLogin(identifier: string): void {
    this.attempts.delete(identifier);
  }
  
  getRemainingLockTime(identifier: string): number {
    const record = this.attempts.get(identifier);
    if (!record?.lockUntil) return 0;
    
    return Math.max(0, record.lockUntil - Date.now());
  }
}

export const loginAttemptTracker = new LoginAttemptTracker();

// セッション管理
export interface SessionInfo {
  sessionId: string;
  userId: number;
  ip: string;
  userAgent: string;
  createdAt: number;
  lastActivity: number;
  isActive: boolean;
}

class SessionManager {
  private sessions = new Map<string, SessionInfo>();
  private userSessions = new Map<number, Set<string>>();
  private readonly maxSessionsPerUser = 5;
  private readonly sessionTimeout = 24 * 60 * 60 * 1000; // 24時間
  
  createSession(userId: number, ip: string, userAgent: string): string {
    const sessionId = this.generateSessionId();
    const now = Date.now();
    
    const session: SessionInfo = {
      sessionId,
      userId,
      ip,
      userAgent,
      createdAt: now,
      lastActivity: now,
      isActive: true,
    };
    
    this.sessions.set(sessionId, session);
    
    // ユーザーのセッション管理
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set());
    }
    
    const userSessionSet = this.userSessions.get(userId)!;
    userSessionSet.add(sessionId);
    
    // 最大セッション数の制限
    if (userSessionSet.size > this.maxSessionsPerUser) {
      const oldestSession = this.findOldestSession(userId);
      if (oldestSession) {
        this.revokeSession(oldestSession);
      }
    }
    
    return sessionId;
  }
  
  validateSession(sessionId: string, ip: string): SessionInfo | null {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) return null;
    
    const now = Date.now();
    
    // セッションタイムアウトチェック
    if (now - session.lastActivity > this.sessionTimeout) {
      this.revokeSession(sessionId);
      return null;
    }
    
    // IP変更の検出（suspicious activity）
    if (session.ip !== ip) {
      logSecurityEvent({
        type: "suspicious_request",
        ip,
        userAgent: session.userAgent,
        url: "/session-validation",
        timestamp: new Date().toISOString(),
        details: {
          sessionId,
          originalIp: session.ip,
          newIp: ip,
          reason: "IP address changed",
        },
      });
      
      // セキュリティのためセッションを無効化
      this.revokeSession(sessionId);
      return null;
    }
    
    // 最終活動時間を更新
    session.lastActivity = now;
    return session;
  }
  
  revokeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.sessions.delete(sessionId);
      
      const userSessionSet = this.userSessions.get(session.userId);
      if (userSessionSet) {
        userSessionSet.delete(sessionId);
      }
    }
  }
  
  revokeAllUserSessions(userId: number): void {
    const userSessionSet = this.userSessions.get(userId);
    if (userSessionSet) {
      for (const sessionId of userSessionSet) {
        this.revokeSession(sessionId);
      }
      this.userSessions.delete(userId);
    }
  }
  
  getUserSessions(userId: number): SessionInfo[] {
    const userSessionSet = this.userSessions.get(userId);
    if (!userSessionSet) return [];
    
    return Array.from(userSessionSet)
      .map(sessionId => this.sessions.get(sessionId))
      .filter((session): session is SessionInfo => 
        session !== undefined && session.isActive
      );
  }
  
  private generateSessionId(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  private findOldestSession(userId: number): string | null {
    const userSessionSet = this.userSessions.get(userId);
    if (!userSessionSet) return null;
    
    let oldestSession = null;
    let oldestTime = Date.now();
    
    for (const sessionId of userSessionSet) {
      const session = this.sessions.get(sessionId);
      if (session && session.createdAt < oldestTime) {
        oldestTime = session.createdAt;
        oldestSession = sessionId;
      }
    }
    
    return oldestSession;
  }
  
  // 定期的なクリーンアップ
  cleanup(): void {
    const now = Date.now();
    const expiredSessions: string[] = [];
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > this.sessionTimeout) {
        expiredSessions.push(sessionId);
      }
    }
    
    expiredSessions.forEach(sessionId => this.revokeSession(sessionId));
  }
}

export const sessionManager = new SessionManager();

// セッションの定期クリーンアップ
setInterval(() => {
  sessionManager.cleanup();
}, 60 * 60 * 1000); // 1時間ごと

// パスワードポリシー
export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventReuse: boolean;
  maxAge: number; // 日数
}

export function getPasswordPolicy(): PasswordPolicy {
  return {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    preventReuse: true,
    maxAge: 90, // 3ヶ月
  };
}

export function validatePasswordPolicy(password: string, policy: PasswordPolicy): {
  isValid: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  
  if (password.length < policy.minLength) {
    violations.push(`最低${policy.minLength}文字必要です`);
  }
  
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    violations.push("大文字が必要です");
  }
  
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    violations.push("小文字が必要です");
  }
  
  if (policy.requireNumbers && !/[0-9]/.test(password)) {
    violations.push("数字が必要です");
  }
  
  if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    violations.push("特殊文字が必要です");
  }
  
  return {
    isValid: violations.length === 0,
    violations,
  };
}

// 二要素認証（TOTP）のスタブ実装
export interface TwoFactorAuth {
  enabled: boolean;
  secret?: string;
  backupCodes?: string[];
}

export function generateTOTPSecret(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const secret = Array.from(
    { length: 32 },
    () => alphabet[Math.floor(Math.random() * alphabet.length)]
  ).join("");
  
  return secret;
}

export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    const code = Array.from(
      { length: 8 },
      () => Math.floor(Math.random() * 10)
    ).join("");
    codes.push(code);
  }
  return codes;
}

// デバイス認証
export interface DeviceInfo {
  id: string;
  userId: number;
  name: string;
  fingerprint: string;
  lastSeen: number;
  trusted: boolean;
  createdAt: number;
}

export function generateDeviceFingerprint(userAgent: string, acceptLanguage: string, timezone: string): string {
  const data = `${userAgent}|${acceptLanguage}|${timezone}`;
  const encoder = new TextEncoder();
  return crypto.subtle.digest("SHA-256", encoder.encode(data))
    .then(buffer => Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    );
}

// 監査ログ
export interface AuditLog {
  id: string;
  userId?: number;
  action: string;
  resource: string;
  ip: string;
  userAgent: string;
  timestamp: string;
  details?: Record<string, any>;
}

const auditLogs: AuditLog[] = [];

export function logAuditEvent(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
  const auditLog: AuditLog = {
    ...log,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
  
  auditLogs.push(auditLog);
  
  // メモリ制限（最新1000件のみ保持）
  if (auditLogs.length > 1000) {
    auditLogs.splice(0, auditLogs.length - 1000);
  }
}

export function getAuditLogs(userId?: number, limit = 100): AuditLog[] {
  let logs = auditLogs;
  
  if (userId) {
    logs = logs.filter(log => log.userId === userId);
  }
  
  return logs.slice(-limit);
}

// CSRFトークン管理
class CSRFTokenManager {
  private tokens = new Map<string, { userId: number; expires: number }>();
  private readonly tokenLifetime = 60 * 60 * 1000; // 1時間
  
  generateToken(userId: number): string {
    const token = crypto.randomUUID();
    const expires = Date.now() + this.tokenLifetime;
    
    this.tokens.set(token, { userId, expires });
    
    return token;
  }
  
  validateToken(token: string, userId: number): boolean {
    const tokenData = this.tokens.get(token);
    if (!tokenData) return false;
    
    const now = Date.now();
    
    // 期限切れトークンの削除
    if (tokenData.expires < now) {
      this.tokens.delete(token);
      return false;
    }
    
    // ユーザーIDの一致確認
    if (tokenData.userId !== userId) {
      return false;
    }
    
    // 使用済みトークンを削除（ワンタイム使用）
    this.tokens.delete(token);
    
    return true;
  }
  
  cleanup(): void {
    const now = Date.now();
    const expiredTokens: string[] = [];
    
    for (const [token, data] of this.tokens.entries()) {
      if (data.expires < now) {
        expiredTokens.push(token);
      }
    }
    
    expiredTokens.forEach(token => this.tokens.delete(token));
  }
}

export const csrfTokenManager = new CSRFTokenManager();

// CSRF トークンの定期クリーンアップ
setInterval(() => {
  csrfTokenManager.cleanup();
}, 30 * 60 * 1000); // 30分ごと