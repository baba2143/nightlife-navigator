import { useState, useEffect, useCallback } from 'react';
import adminAuthService from '../services/AdminAuthService';
import sessionManager from '../services/SessionManager';
import securityLogger from '../utils/securityLogger';

/**
 * セキュアな認証管理のためのカスタムフック
 */
export const useSecureAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 認証状態を確認
  const checkAuthStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const loggedIn = await adminAuthService.isLoggedIn();
      
      if (loggedIn) {
        const admin = adminAuthService.getCurrentAdmin();
        const sessionId = adminAuthService.currentSessionId;
        
        if (sessionId) {
          const sessionValidation = await sessionManager.validateSession(sessionId);
          
          if (sessionValidation.valid) {
            setIsAuthenticated(true);
            setCurrentAdmin(admin);
            setSessionInfo({
              sessionId,
              lastActivity: sessionValidation.sessionData.lastActivity,
              expiresAt: sessionValidation.sessionData.expiresAt
            });
          } else {
            await adminAuthService.logout();
            setIsAuthenticated(false);
            setCurrentAdmin(null);
            setSessionInfo(null);
          }
        } else {
          setIsAuthenticated(false);
          setCurrentAdmin(null);
          setSessionInfo(null);
        }
      } else {
        setIsAuthenticated(false);
        setCurrentAdmin(null);
        setSessionInfo(null);
      }
    } catch (err) {
      console.error('認証状態確認エラー:', err);
      setError(err.message);
      setIsAuthenticated(false);
      setCurrentAdmin(null);
      setSessionInfo(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ログイン
  const login = useCallback(async (username, password) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await adminAuthService.login(username, password);
      
      if (result.success) {
        setIsAuthenticated(true);
        setCurrentAdmin(result.admin);
        setSessionInfo({
          sessionId: result.sessionId,
          expiresAt: result.sessionExpiresAt
        });
        
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('ログインエラー:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ログアウト
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await adminAuthService.logout();
      
      setIsAuthenticated(false);
      setCurrentAdmin(null);
      setSessionInfo(null);
      setError(null);
      
      return { success: true };
    } catch (err) {
      console.error('ログアウトエラー:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // セッション延長
  const extendSession = useCallback(async () => {
    try {
      const result = await adminAuthService.extendSession();
      
      if (result.success) {
        setSessionInfo(prev => ({
          ...prev,
          expiresAt: result.expiresAt
        }));
      }
      
      return result;
    } catch (err) {
      console.error('セッション延長エラー:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // パスワード変更
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      if (!currentAdmin) {
        return { success: false, error: 'ログインが必要です' };
      }
      
      const result = await adminAuthService.changePassword(
        currentAdmin.id,
        currentPassword,
        newPassword
      );
      
      return result;
    } catch (err) {
      console.error('パスワード変更エラー:', err);
      return { success: false, error: err.message };
    }
  }, [currentAdmin]);

  // 権限チェック
  const hasPermission = useCallback((permission) => {
    return adminAuthService.hasPermission(permission);
  }, []);

  // 複数権限チェック
  const hasAnyPermission = useCallback((permissions) => {
    return adminAuthService.hasAnyPermission(permissions);
  }, []);

  // 全権限チェック
  const hasAllPermissions = useCallback((permissions) => {
    return adminAuthService.hasAllPermissions(permissions);
  }, []);

  // ロールチェック
  const hasRole = useCallback((role) => {
    return adminAuthService.hasRole(role);
  }, []);

  // ロール比較
  const hasRoleOrHigher = useCallback((requiredRole) => {
    return adminAuthService.hasRoleOrHigher(requiredRole);
  }, []);

  // アクティブセッション一覧取得
  const getActiveSessions = useCallback(() => {
    if (!currentAdmin) return [];
    return sessionManager.getActiveSessions(currentAdmin.id);
  }, [currentAdmin]);

  // 他のセッションを終了
  const terminateOtherSessions = useCallback(async () => {
    try {
      if (!currentAdmin) {
        return { success: false, error: 'ログインが必要です' };
      }
      
      const currentSessionId = adminAuthService.currentSessionId;
      const activeSessions = sessionManager.getActiveSessions(currentAdmin.id);
      
      let terminatedCount = 0;
      
      for (const session of activeSessions) {
        if (session.sessionId !== currentSessionId) {
          await sessionManager.destroySession(session.sessionId);
          terminatedCount++;
        }
      }
      
      securityLogger.logSession(currentAdmin.id, 'OTHER_SESSIONS_TERMINATED', {
        terminatedCount,
        remainingSessionId: currentSessionId
      });
      
      return { success: true, terminatedCount };
    } catch (err) {
      console.error('他セッション終了エラー:', err);
      return { success: false, error: err.message };
    }
  }, [currentAdmin]);

  // セッション統計情報取得
  const getSessionStats = useCallback(() => {
    return sessionManager.getSessionStats();
  }, []);

  // セキュリティレポート生成
  const generateSecurityReport = useCallback(() => {
    return adminAuthService.generateSecurityReport();
  }, []);

  // 自動セッション延長の設定
  useEffect(() => {
    let intervalId;
    
    if (isAuthenticated && sessionInfo) {
      // 30分ごとにセッションを延長
      intervalId = setInterval(async () => {
        const result = await extendSession();
        if (!result.success) {
          console.warn('セッション延長に失敗:', result.error);
        }
      }, 30 * 60 * 1000); // 30分
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isAuthenticated, sessionInfo, extendSession]);

  // セッション期限切れ警告
  useEffect(() => {
    let warningTimeoutId;
    
    if (isAuthenticated && sessionInfo?.expiresAt) {
      const expiresAt = new Date(sessionInfo.expiresAt).getTime();
      const now = Date.now();
      const timeUntilExpiration = expiresAt - now;
      const warningTime = timeUntilExpiration - (15 * 60 * 1000); // 15分前に警告
      
      if (warningTime > 0) {
        warningTimeoutId = setTimeout(() => {
          // 警告表示のロジック（実際のアプリではAlertやToastを使用）
          console.warn('セッションが15分後に期限切れになります');
        }, warningTime);
      }
    }
    
    return () => {
      if (warningTimeoutId) {
        clearTimeout(warningTimeoutId);
      }
    };
  }, [isAuthenticated, sessionInfo]);

  // 初回認証状態確認
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  return {
    // 状態
    isAuthenticated,
    currentAdmin,
    sessionInfo,
    isLoading,
    error,
    
    // 認証操作
    login,
    logout,
    extendSession,
    changePassword,
    
    // 権限チェック
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasRoleOrHigher,
    
    // セッション管理
    getActiveSessions,
    terminateOtherSessions,
    getSessionStats,
    
    // セキュリティ
    generateSecurityReport,
    
    // ユーティリティ
    checkAuthStatus,
    clearError: () => setError(null)
  };
};