import securityLogger from '../utils/securityLogger';

/**
 * 高度なレート制限システム
 */
class RateLimiter {
  constructor() {
    this.requests = new Map(); // IP/User -> リクエスト履歴
    this.rules = new Map(); // エンドポイント -> レート制限ルール
    this.blockedIPs = new Map(); // ブロックされたIP
    this.cleanupInterval = null;
    
    this.initializeDefaultRules();
    this.startCleanupInterval();
  }

  /**
   * デフォルトのレート制限ルールを初期化
   */
  initializeDefaultRules() {
    // ログイン関連の制限
    this.addRule('login', {
      windowMs: 15 * 60 * 1000, // 15分
      maxRequests: 5, // 最大5回
      blockDuration: 30 * 60 * 1000, // 30分ブロック
      skipSuccessfulRequests: true,
      message: 'ログイン試行回数が上限に達しました。しばらく待ってから再試行してください。'
    });

    // パスワード変更の制限
    this.addRule('password-change', {
      windowMs: 60 * 60 * 1000, // 1時間
      maxRequests: 3, // 最大3回
      blockDuration: 60 * 60 * 1000, // 1時間ブロック
      message: 'パスワード変更の試行回数が上限に達しました。'
    });

    // 管理者アカウント作成の制限
    this.addRule('admin-create', {
      windowMs: 60 * 60 * 1000, // 1時間
      maxRequests: 10, // 最大10回
      blockDuration: 2 * 60 * 60 * 1000, // 2時間ブロック
      message: '管理者アカウント作成の試行回数が上限に達しました。'
    });

    // 一般的なAPI制限
    this.addRule('api-general', {
      windowMs: 60 * 1000, // 1分
      maxRequests: 60, // 最大60回/分
      blockDuration: 5 * 60 * 1000, // 5分ブロック
      message: 'API利用制限に達しました。しばらく待ってから再試行してください。'
    });

    // セッション作成の制限
    this.addRule('session-create', {
      windowMs: 60 * 60 * 1000, // 1時間
      maxRequests: 100, // 最大100回
      blockDuration: 30 * 60 * 1000, // 30分ブロック
      message: 'セッション作成の試行回数が上限に達しました。'
    });

    // パスワードリセットの制限
    this.addRule('password-reset', {
      windowMs: 24 * 60 * 60 * 1000, // 24時間
      maxRequests: 5, // 最大5回
      blockDuration: 24 * 60 * 60 * 1000, // 24時間ブロック
      message: 'パスワードリセットの試行回数が上限に達しました。'
    });
  }

  /**
   * レート制限ルールを追加
   * @param {string} endpoint - エンドポイント名
   * @param {Object} rule - ルール設定
   */
  addRule(endpoint, rule) {
    this.rules.set(endpoint, {
      windowMs: rule.windowMs || 60 * 1000,
      maxRequests: rule.maxRequests || 10,
      blockDuration: rule.blockDuration || 5 * 60 * 1000,
      skipSuccessfulRequests: rule.skipSuccessfulRequests || false,
      message: rule.message || 'レート制限に達しました。',
      customHandler: rule.customHandler || null
    });
  }

  /**
   * レート制限をチェック
   * @param {string} endpoint - エンドポイント名
   * @param {string} identifier - 識別子（IP、ユーザーID等）
   * @param {boolean} isSuccess - リクエストが成功したか
   * @returns {Object} 制限結果
   */
  checkLimit(endpoint, identifier, isSuccess = false) {
    const rule = this.rules.get(endpoint);
    if (!rule) {
      return { allowed: true, remainingRequests: Infinity };
    }

    // IPブロックチェック
    if (this.isIPBlocked(identifier)) {
      const blockInfo = this.blockedIPs.get(identifier);
      const remainingTime = Math.ceil((blockInfo.unblockTime - Date.now()) / 1000 / 60);
      
      securityLogger.logSecurityViolation(identifier, 'BLOCKED_IP_ACCESS_ATTEMPT', {
        endpoint,
        remainingBlockTime: remainingTime
      });
      
      return {
        allowed: false,
        reason: 'IP_BLOCKED',
        message: `IPアドレスがブロックされています。${remainingTime}分後に再試行してください。`,
        retryAfter: blockInfo.unblockTime
      };
    }

    const now = Date.now();
    const key = `${endpoint}:${identifier}`;
    
    // リクエスト履歴を取得または作成
    let requestHistory = this.requests.get(key) || {
      requests: [],
      blockedUntil: null
    };

    // 一時的なブロック状態をチェック
    if (requestHistory.blockedUntil && now < requestHistory.blockedUntil) {
      const remainingTime = Math.ceil((requestHistory.blockedUntil - now) / 1000 / 60);
      return {
        allowed: false,
        reason: 'TEMPORARILY_BLOCKED',
        message: rule.message,
        retryAfter: requestHistory.blockedUntil,
        remainingTime
      };
    }

    // 時間枠外の古いリクエストを削除
    requestHistory.requests = requestHistory.requests.filter(
      req => now - req.timestamp < rule.windowMs
    );

    // 成功したリクエストをスキップする設定の場合
    let relevantRequests = requestHistory.requests;
    if (rule.skipSuccessfulRequests) {
      relevantRequests = requestHistory.requests.filter(req => !req.success);
    }

    // リクエスト数をチェック
    if (relevantRequests.length >= rule.maxRequests) {
      // ブロック状態に設定
      requestHistory.blockedUntil = now + rule.blockDuration;
      
      // IP全体をブロック（重要なエンドポイントの場合）
      if (['login', 'password-change', 'admin-create'].includes(endpoint)) {
        this.blockIP(identifier, rule.blockDuration);
      }
      
      // セキュリティログ
      securityLogger.logSecurityViolation(identifier, 'RATE_LIMIT_EXCEEDED', {
        endpoint,
        requestCount: relevantRequests.length,
        maxRequests: rule.maxRequests,
        windowMs: rule.windowMs,
        blockDuration: rule.blockDuration
      });
      
      this.requests.set(key, requestHistory);
      
      return {
        allowed: false,
        reason: 'RATE_LIMIT_EXCEEDED',
        message: rule.message,
        retryAfter: requestHistory.blockedUntil,
        remainingTime: Math.ceil(rule.blockDuration / 1000 / 60)
      };
    }

    // 新しいリクエストを記録
    requestHistory.requests.push({
      timestamp: now,
      success: isSuccess
    });

    this.requests.set(key, requestHistory);

    const remainingRequests = rule.maxRequests - relevantRequests.length - 1;
    
    return {
      allowed: true,
      remainingRequests,
      resetTime: now + rule.windowMs
    };
  }

  /**
   * IPアドレスをブロック
   * @param {string} ip - IPアドレス
   * @param {number} duration - ブロック期間（ミリ秒）
   */
  blockIP(ip, duration) {
    const unblockTime = Date.now() + duration;
    this.blockedIPs.set(ip, {
      blockedAt: Date.now(),
      unblockTime,
      reason: 'RATE_LIMIT_VIOLATION'
    });

    securityLogger.logSecurityViolation(ip, 'IP_BLOCKED', {
      blockDuration: duration / 1000 / 60, // 分単位
      unblockTime: new Date(unblockTime).toISOString()
    });
  }

  /**
   * IPアドレスのブロック状態をチェック
   * @param {string} ip - IPアドレス
   * @returns {boolean} ブロック状態
   */
  isIPBlocked(ip) {
    const blockInfo = this.blockedIPs.get(ip);
    if (!blockInfo) return false;
    
    if (Date.now() > blockInfo.unblockTime) {
      this.blockedIPs.delete(ip);
      return false;
    }
    
    return true;
  }

  /**
   * IPアドレスのブロックを解除
   * @param {string} ip - IPアドレス
   */
  unblockIP(ip) {
    this.blockedIPs.delete(ip);
    securityLogger.logSecurityViolation(ip, 'IP_UNBLOCKED', {
      unblockTime: new Date().toISOString()
    });
  }

  /**
   * 動的レート制限の適用
   * @param {string} endpoint - エンドポイント名
   * @param {string} identifier - 識別子
   * @param {number} suspiciousScore - 疑わしいスコア (0-100)
   */
  applyDynamicLimit(endpoint, identifier, suspiciousScore) {
    const rule = this.rules.get(endpoint);
    if (!rule) return;

    // 疑わしいスコアに基づいて制限を動的に調整
    let adjustedMaxRequests = rule.maxRequests;
    let adjustedBlockDuration = rule.blockDuration;

    if (suspiciousScore > 80) {
      adjustedMaxRequests = Math.floor(rule.maxRequests * 0.2); // 80%削減
      adjustedBlockDuration = rule.blockDuration * 5; // 5倍長く
    } else if (suspiciousScore > 60) {
      adjustedMaxRequests = Math.floor(rule.maxRequests * 0.5); // 50%削減
      adjustedBlockDuration = rule.blockDuration * 2; // 2倍長く
    } else if (suspiciousScore > 40) {
      adjustedMaxRequests = Math.floor(rule.maxRequests * 0.7); // 30%削減
      adjustedBlockDuration = rule.blockDuration * 1.5; // 1.5倍長く
    }

    // 一時的なルールを適用
    this.addRule(`${endpoint}:${identifier}`, {
      ...rule,
      maxRequests: adjustedMaxRequests,
      blockDuration: adjustedBlockDuration
    });

    securityLogger.logSecurityViolation(identifier, 'DYNAMIC_RATE_LIMIT_APPLIED', {
      endpoint,
      suspiciousScore,
      originalMaxRequests: rule.maxRequests,
      adjustedMaxRequests,
      originalBlockDuration: rule.blockDuration,
      adjustedBlockDuration
    });
  }

  /**
   * 地域別制限の適用
   * @param {string} endpoint - エンドポイント名
   * @param {string} identifier - 識別子
   * @param {string} country - 国コード
   */
  applyGeographicLimit(endpoint, identifier, country) {
    // 高リスク地域からのアクセスに対する制限
    const highRiskCountries = ['CN', 'RU', 'KP', 'IR']; // 例
    const mediumRiskCountries = ['PK', 'BD', 'NG']; // 例

    if (highRiskCountries.includes(country)) {
      this.applyDynamicLimit(endpoint, identifier, 90);
    } else if (mediumRiskCountries.includes(country)) {
      this.applyDynamicLimit(endpoint, identifier, 60);
    }
  }

  /**
   * 時間帯別制限の適用
   * @param {string} endpoint - エンドポイント名
   * @param {string} identifier - 識別子
   */
  applyTimeBasedLimit(endpoint, identifier) {
    const hour = new Date().getHours();
    
    // 深夜・早朝の制限を強化
    if (hour >= 0 && hour <= 5) {
      this.applyDynamicLimit(endpoint, identifier, 70);
    } else if (hour >= 22 || hour <= 6) {
      this.applyDynamicLimit(endpoint, identifier, 50);
    }
  }

  /**
   * レート制限統計の取得
   * @returns {Object} 統計情報
   */
  getStatistics() {
    const now = Date.now();
    const stats = {
      totalRequests: 0,
      blockedRequests: 0,
      activeBlocks: 0,
      blockedIPs: this.blockedIPs.size,
      endpointStats: {}
    };

    // エンドポイント別統計
    for (const [endpoint, rule] of this.rules.entries()) {
      stats.endpointStats[endpoint] = {
        maxRequests: rule.maxRequests,
        windowMs: rule.windowMs,
        blockDuration: rule.blockDuration,
        activeRequests: 0,
        blockedRequests: 0
      };
    }

    // リクエスト履歴から統計を計算
    for (const [key, history] of this.requests.entries()) {
      const [endpoint] = key.split(':');
      const recentRequests = history.requests.filter(
        req => now - req.timestamp < 60 * 60 * 1000 // 1時間以内
      );
      
      stats.totalRequests += recentRequests.length;
      
      if (stats.endpointStats[endpoint]) {
        stats.endpointStats[endpoint].activeRequests += recentRequests.length;
      }
      
      if (history.blockedUntil && now < history.blockedUntil) {
        stats.activeBlocks++;
        if (stats.endpointStats[endpoint]) {
          stats.endpointStats[endpoint].blockedRequests++;
        }
      }
    }

    return stats;
  }

  /**
   * レート制限の設定を取得
   * @param {string} endpoint - エンドポイント名
   * @returns {Object} 設定情報
   */
  getRuleConfig(endpoint) {
    return this.rules.get(endpoint) || null;
  }

  /**
   * レート制限をリセット
   * @param {string} endpoint - エンドポイント名
   * @param {string} identifier - 識別子
   */
  resetLimit(endpoint, identifier) {
    const key = `${endpoint}:${identifier}`;
    this.requests.delete(key);
    
    securityLogger.logSecurityViolation(identifier, 'RATE_LIMIT_RESET', {
      endpoint,
      resetTime: new Date().toISOString()
    });
  }

  /**
   * 全てのレート制限をリセット
   */
  resetAllLimits() {
    this.requests.clear();
    this.blockedIPs.clear();
    
    securityLogger.logSecurityViolation('system', 'ALL_RATE_LIMITS_RESET', {
      resetTime: new Date().toISOString()
    });
  }

  /**
   * 期限切れのデータをクリーンアップ
   */
  cleanup() {
    const now = Date.now();
    
    // 期限切れのリクエスト履歴を削除
    for (const [key, history] of this.requests.entries()) {
      const [endpoint] = key.split(':');
      const rule = this.rules.get(endpoint);
      
      if (rule) {
        // 時間枠外のリクエストを削除
        history.requests = history.requests.filter(
          req => now - req.timestamp < rule.windowMs
        );
        
        // ブロック期限をチェック
        if (history.blockedUntil && now > history.blockedUntil) {
          history.blockedUntil = null;
        }
        
        // 空の履歴を削除
        if (history.requests.length === 0 && !history.blockedUntil) {
          this.requests.delete(key);
        }
      }
    }
    
    // 期限切れのIPブロックを削除
    for (const [ip, blockInfo] of this.blockedIPs.entries()) {
      if (now > blockInfo.unblockTime) {
        this.blockedIPs.delete(ip);
      }
    }
  }

  /**
   * 定期的なクリーンアップを開始
   */
  startCleanupInterval() {
    // 5分ごとにクリーンアップを実行
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * クリーンアップ間隔を停止
   */
  stopCleanupInterval() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Express.jsミドルウェアの生成
   * @param {string} endpoint - エンドポイント名
   * @returns {Function} ミドルウェア関数
   */
  createMiddleware(endpoint) {
    return (req, res, next) => {
      const identifier = req.ip || req.connection.remoteAddress || 'unknown';
      const result = this.checkLimit(endpoint, identifier);
      
      if (!result.allowed) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: result.message,
          retryAfter: result.retryAfter
        });
      }
      
      // レスポンスヘッダーに制限情報を追加
      res.setHeader('X-RateLimit-Remaining', result.remainingRequests);
      res.setHeader('X-RateLimit-Reset', result.resetTime);
      
      next();
    };
  }
}

// シングルトンインスタンス
const rateLimiter = new RateLimiter();

export default rateLimiter;