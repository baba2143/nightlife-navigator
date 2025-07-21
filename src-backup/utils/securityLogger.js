/**
 * セキュリティ関連のログ記録ユーティリティ
 */
class SecurityLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000; // メモリ制限
  }

  /**
   * セキュリティイベントをログに記録
   * @param {string} eventType - イベントタイプ
   * @param {string} userId - ユーザーID
   * @param {string} action - アクション
   * @param {Object} details - 詳細情報
   * @param {string} severity - 重要度 (low, medium, high, critical)
   */
  log(eventType, userId, action, details = {}, severity = 'medium') {
    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      userId,
      action,
      details,
      severity,
      sessionId: this.generateSessionId(),
      userAgent: this.getUserAgent(),
      ipAddress: this.getClientIP()
    };

    this.logs.push(logEntry);

    // メモリ制限を超えた場合、古いログを削除
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // 重要度に応じてコンソール出力
    this.outputToConsole(logEntry);

    // 本番環境では外部ログサービスに送信
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalLogger(logEntry);
    }
  }

  /**
   * 認証関連のログ
   */
  logAuth(userId, action, details = {}, severity = 'medium') {
    this.log('AUTH', userId, action, details, severity);
  }

  /**
   * パスワード関連のログ
   */
  logPassword(userId, action, details = {}, severity = 'high') {
    this.log('PASSWORD', userId, action, details, severity);
  }

  /**
   * セッション関連のログ
   */
  logSession(userId, action, details = {}, severity = 'medium') {
    this.log('SESSION', userId, action, details, severity);
  }

  /**
   * セキュリティ違反のログ
   */
  logSecurityViolation(userId, action, details = {}) {
    this.log('SECURITY_VIOLATION', userId, action, details, 'critical');
  }

  /**
   * 権限関連のログ
   */
  logPermission(userId, action, details = {}, severity = 'medium') {
    this.log('PERMISSION', userId, action, details, severity);
  }

  /**
   * ログイン試行失敗のログ
   */
  logLoginAttempt(username, success, details = {}) {
    const severity = success ? 'low' : 'high';
    const action = success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED';
    
    this.logAuth(username, action, {
      ...details,
      success,
      timestamp: new Date().toISOString()
    }, severity);
  }

  /**
   * ブルートフォース攻撃の検出
   */
  detectBruteForce(username, timeWindow = 15 * 60 * 1000) { // 15分
    const recentLogs = this.logs.filter(log => {
      const logTime = new Date(log.timestamp);
      const now = new Date();
      return (
        log.eventType === 'AUTH' &&
        log.action === 'LOGIN_FAILED' &&
        log.userId === username &&
        (now - logTime) < timeWindow
      );
    });

    const failedAttempts = recentLogs.length;
    const maxAttempts = 5;

    if (failedAttempts >= maxAttempts) {
      this.logSecurityViolation(username, 'BRUTE_FORCE_DETECTED', {
        attemptCount: failedAttempts,
        timeWindow: timeWindow / 1000 / 60, // 分単位
        recentAttempts: recentLogs.slice(-5)
      });
      return true;
    }

    return false;
  }

  /**
   * 異常なアクセスパターンの検出
   */
  detectAnomalousActivity(userId) {
    const userLogs = this.logs.filter(log => log.userId === userId);
    const recentLogs = userLogs.filter(log => {
      const logTime = new Date(log.timestamp);
      const now = new Date();
      return (now - logTime) < 60 * 60 * 1000; // 1時間
    });

    // 短時間での大量アクセス
    if (recentLogs.length > 100) {
      this.logSecurityViolation(userId, 'EXCESSIVE_ACCESS_DETECTED', {
        requestCount: recentLogs.length,
        timeWindow: '1 hour'
      });
      return true;
    }

    // 異常な時間帯のアクセス
    const hour = new Date().getHours();
    if (hour < 6 || hour > 23) {
      this.logSecurityViolation(userId, 'UNUSUAL_ACCESS_TIME', {
        accessTime: new Date().toISOString(),
        hour
      });
    }

    return false;
  }

  /**
   * ログの検索
   */
  searchLogs(filters = {}) {
    return this.logs.filter(log => {
      if (filters.eventType && log.eventType !== filters.eventType) return false;
      if (filters.userId && log.userId !== filters.userId) return false;
      if (filters.action && log.action !== filters.action) return false;
      if (filters.severity && log.severity !== filters.severity) return false;
      if (filters.startTime && new Date(log.timestamp) < new Date(filters.startTime)) return false;
      if (filters.endTime && new Date(log.timestamp) > new Date(filters.endTime)) return false;
      return true;
    });
  }

  /**
   * セキュリティレポートの生成
   */
  generateSecurityReport(timeRange = 24 * 60 * 60 * 1000) { // 24時間
    const startTime = new Date(Date.now() - timeRange);
    const recentLogs = this.logs.filter(log => 
      new Date(log.timestamp) >= startTime
    );

    const report = {
      timeRange: {
        start: startTime.toISOString(),
        end: new Date().toISOString()
      },
      totalEvents: recentLogs.length,
      eventsByType: {},
      eventsBySeverity: {},
      securityViolations: [],
      topUsers: {},
      recommendations: []
    };

    // イベントタイプ別集計
    recentLogs.forEach(log => {
      report.eventsByType[log.eventType] = (report.eventsByType[log.eventType] || 0) + 1;
      report.eventsBySeverity[log.severity] = (report.eventsBySeverity[log.severity] || 0) + 1;
      report.topUsers[log.userId] = (report.topUsers[log.userId] || 0) + 1;

      if (log.eventType === 'SECURITY_VIOLATION') {
        report.securityViolations.push(log);
      }
    });

    // 推奨事項の生成
    if (report.securityViolations.length > 0) {
      report.recommendations.push('セキュリティ違反が検出されました。詳細な調査が必要です。');
    }

    if (report.eventsBySeverity.critical > 0) {
      report.recommendations.push('重大なセキュリティイベントが発生しています。即座に対応してください。');
    }

    return report;
  }

  /**
   * コンソールへの出力
   */
  outputToConsole(logEntry) {
    const { severity, eventType, userId, action, timestamp } = logEntry;
    
    switch (severity) {
      case 'critical':
        console.error(`🚨 [CRITICAL] ${timestamp} - ${eventType}:${action} - User: ${userId}`);
        break;
      case 'high':
        console.warn(`⚠️  [HIGH] ${timestamp} - ${eventType}:${action} - User: ${userId}`);
        break;
      case 'medium':
        console.info(`ℹ️  [MEDIUM] ${timestamp} - ${eventType}:${action} - User: ${userId}`);
        break;
      case 'low':
        console.log(`✅ [LOW] ${timestamp} - ${eventType}:${action} - User: ${userId}`);
        break;
    }
  }

  /**
   * 外部ログサービスへの送信（本番環境用）
   */
  sendToExternalLogger(logEntry) {
    // 本番環境では Sentry, LogRocket, CloudWatch などに送信
    // 今はコンソールにのみ出力
    if (logEntry.severity === 'critical' || logEntry.severity === 'high') {
      console.log('外部ログサービスに送信:', logEntry);
    }
  }

  /**
   * セッションIDの生成
   */
  generateSessionId() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * ユーザーエージェントの取得
   */
  getUserAgent() {
    // React Nativeの場合
    if (typeof navigator !== 'undefined' && navigator.userAgent) {
      return navigator.userAgent;
    }
    return 'React Native App';
  }

  /**
   * クライアントIPの取得
   */
  getClientIP() {
    // 本番環境では実際のIPアドレスを取得
    return '127.0.0.1'; // デモ用
  }

  /**
   * ログのクリア
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * ログのエクスポート
   */
  exportLogs(format = 'json') {
    switch (format) {
      case 'json':
        return JSON.stringify(this.logs, null, 2);
      case 'csv':
        return this.convertToCSV(this.logs);
      default:
        return this.logs;
    }
  }

  /**
   * CSV形式に変換
   */
  convertToCSV(logs) {
    if (logs.length === 0) return '';
    
    const headers = Object.keys(logs[0]);
    const csvContent = [
      headers.join(','),
      ...logs.map(log => 
        headers.map(header => 
          JSON.stringify(log[header] || '')
        ).join(',')
      )
    ].join('\n');
    
    return csvContent;
  }
}

// シングルトンインスタンス
const securityLogger = new SecurityLogger();

export default securityLogger;