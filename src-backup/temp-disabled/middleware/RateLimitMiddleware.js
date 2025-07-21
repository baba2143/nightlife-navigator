import rateLimiter from '../services/RateLimiter';
import securityLogger from '../utils/securityLogger';

/**
 * React Native用のレート制限ミドルウェア
 */
class RateLimitMiddleware {
  
  /**
   * 関数にレート制限を適用するデコレーター
   * @param {string} endpoint - エンドポイント名
   * @param {string} identifier - 識別子（デフォルトは'default'）
   * @returns {Function} デコレーター関数
   */
  static rateLimit(endpoint, identifier = 'default') {
    return function(target, propertyName, descriptor) {
      const method = descriptor.value;
      
      descriptor.value = async function(...args) {
        // レート制限チェック
        const result = rateLimiter.checkLimit(endpoint, identifier);
        
        if (!result.allowed) {
          securityLogger.logSecurityViolation(identifier, 'RATE_LIMIT_BLOCKED', {
            endpoint,
            reason: result.reason,
            message: result.message
          });
          
          throw new Error(result.message);
        }
        
        try {
          // 元のメソッドを実行
          const methodResult = await method.apply(this, args);
          
          // 成功を記録
          rateLimiter.checkLimit(endpoint, identifier, true);
          
          return methodResult;
        } catch (error) {
          // 失敗を記録
          rateLimiter.checkLimit(endpoint, identifier, false);
          throw error;
        }
      };
      
      return descriptor;
    };
  }

  /**
   * APIコール用のレート制限チェック
   * @param {string} endpoint - エンドポイント名
   * @param {string} identifier - 識別子
   * @param {Function} apiCall - APIコール関数
   * @returns {Promise} APIコールの結果
   */
  static async checkAndExecute(endpoint, identifier, apiCall) {
    // レート制限チェック
    const result = rateLimiter.checkLimit(endpoint, identifier);
    
    if (!result.allowed) {
      const error = new Error(result.message);
      error.rateLimitInfo = {
        reason: result.reason,
        retryAfter: result.retryAfter,
        remainingTime: result.remainingTime
      };
      throw error;
    }
    
    try {
      // APIコールを実行
      const apiResult = await apiCall();
      
      // 成功を記録
      rateLimiter.checkLimit(endpoint, identifier, true);
      
      return apiResult;
    } catch (error) {
      // 失敗を記録
      rateLimiter.checkLimit(endpoint, identifier, false);
      throw error;
    }
  }

  /**
   * React Hook用のレート制限
   * @param {string} endpoint - エンドポイント名
   * @param {string} identifier - 識別子
   * @returns {Object} レート制限情報と実行関数
   */
  static useRateLimit(endpoint, identifier = 'default') {
    const checkLimit = () => {
      return rateLimiter.checkLimit(endpoint, identifier);
    };

    const executeWithLimit = async (callback) => {
      const result = rateLimiter.checkLimit(endpoint, identifier);
      
      if (!result.allowed) {
        throw new Error(result.message);
      }
      
      try {
        const callbackResult = await callback();
        rateLimiter.checkLimit(endpoint, identifier, true);
        return callbackResult;
      } catch (error) {
        rateLimiter.checkLimit(endpoint, identifier, false);
        throw error;
      }
    };

    const getRemainingRequests = () => {
      const result = rateLimiter.checkLimit(endpoint, identifier);
      return result.allowed ? result.remainingRequests : 0;
    };

    const getResetTime = () => {
      const result = rateLimiter.checkLimit(endpoint, identifier);
      return result.resetTime;
    };

    return {
      checkLimit,
      executeWithLimit,
      getRemainingRequests,
      getResetTime,
      isBlocked: () => !checkLimit().allowed
    };
  }

  /**
   * バッチリクエスト用のレート制限
   * @param {string} endpoint - エンドポイント名
   * @param {string} identifier - 識別子
   * @param {Array} requests - リクエスト配列
   * @param {number} maxConcurrent - 最大同時実行数
   * @returns {Promise<Array>} 結果配列
   */
  static async executeBatch(endpoint, identifier, requests, maxConcurrent = 3) {
    const results = [];
    const chunks = [];
    
    // リクエストをチャンクに分割
    for (let i = 0; i < requests.length; i += maxConcurrent) {
      chunks.push(requests.slice(i, i + maxConcurrent));
    }
    
    for (const chunk of chunks) {
      // 各チャンクのレート制限をチェック
      for (const request of chunk) {
        const result = rateLimiter.checkLimit(endpoint, identifier);
        if (!result.allowed) {
          throw new Error(`バッチ処理中にレート制限に達しました: ${result.message}`);
        }
      }
      
      // チャンクを並列実行
      const chunkPromises = chunk.map(async (request) => {
        try {
          const result = await request();
          rateLimiter.checkLimit(endpoint, identifier, true);
          return { success: true, data: result };
        } catch (error) {
          rateLimiter.checkLimit(endpoint, identifier, false);
          return { success: false, error: error.message };
        }
      });
      
      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
      
      // チャンク間の遅延
      if (chunks.indexOf(chunk) < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  /**
   * 条件付きレート制限
   * @param {string} endpoint - エンドポイント名
   * @param {string} identifier - 識別子
   * @param {Function} condition - 条件関数
   * @param {Function} callback - コールバック関数
   * @returns {Promise} 結果
   */
  static async executeWithCondition(endpoint, identifier, condition, callback) {
    // 条件をチェック
    const shouldApplyLimit = await condition();
    
    if (shouldApplyLimit) {
      return await this.checkAndExecute(endpoint, identifier, callback);
    } else {
      // レート制限を適用しない
      return await callback();
    }
  }

  /**
   * ユーザー別レート制限
   * @param {string} endpoint - エンドポイント名
   * @param {string} userId - ユーザーID
   * @param {string} userRole - ユーザーロール
   * @param {Function} callback - コールバック関数
   * @returns {Promise} 結果
   */
  static async executeWithUserLimit(endpoint, userId, userRole, callback) {
    // ロール別の制限を適用
    let adjustedEndpoint = endpoint;
    
    switch (userRole) {
      case 'SUPER_ADMIN':
        // スーパー管理者は制限を緩和
        adjustedEndpoint = `${endpoint}-super-admin`;
        break;
      case 'ADMIN':
        adjustedEndpoint = `${endpoint}-admin`;
        break;
      case 'MODERATOR':
        adjustedEndpoint = `${endpoint}-moderator`;
        break;
      default:
        adjustedEndpoint = `${endpoint}-default`;
    }
    
    return await this.checkAndExecute(adjustedEndpoint, userId, callback);
  }

  /**
   * IP別レート制限
   * @param {string} endpoint - エンドポイント名
   * @param {string} ipAddress - IPアドレス
   * @param {Function} callback - コールバック関数
   * @returns {Promise} 結果
   */
  static async executeWithIPLimit(endpoint, ipAddress, callback) {
    // IP別の制限を適用
    return await this.checkAndExecute(endpoint, `ip:${ipAddress}`, callback);
  }

  /**
   * 地域別レート制限
   * @param {string} endpoint - エンドポイント名
   * @param {string} identifier - 識別子
   * @param {string} country - 国コード
   * @param {Function} callback - コールバック関数
   * @returns {Promise} 結果
   */
  static async executeWithGeographicLimit(endpoint, identifier, country, callback) {
    // 地域別制限を適用
    rateLimiter.applyGeographicLimit(endpoint, identifier, country);
    
    return await this.checkAndExecute(endpoint, identifier, callback);
  }

  /**
   * 時間帯別レート制限
   * @param {string} endpoint - エンドポイント名
   * @param {string} identifier - 識別子
   * @param {Function} callback - コールバック関数
   * @returns {Promise} 結果
   */
  static async executeWithTimeBasedLimit(endpoint, identifier, callback) {
    // 時間帯別制限を適用
    rateLimiter.applyTimeBasedLimit(endpoint, identifier);
    
    return await this.checkAndExecute(endpoint, identifier, callback);
  }

  /**
   * レート制限統計の取得
   * @returns {Object} 統計情報
   */
  static getStatistics() {
    return rateLimiter.getStatistics();
  }

  /**
   * レート制限設定の取得
   * @param {string} endpoint - エンドポイント名
   * @returns {Object} 設定情報
   */
  static getRuleConfig(endpoint) {
    return rateLimiter.getRuleConfig(endpoint);
  }

  /**
   * レート制限のリセット
   * @param {string} endpoint - エンドポイント名
   * @param {string} identifier - 識別子
   */
  static resetLimit(endpoint, identifier) {
    rateLimiter.resetLimit(endpoint, identifier);
  }

  /**
   * IPブロックの解除
   * @param {string} ipAddress - IPアドレス
   */
  static unblockIP(ipAddress) {
    rateLimiter.unblockIP(ipAddress);
  }
}

export default RateLimitMiddleware;