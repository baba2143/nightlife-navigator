/**
 * Retry Service
 * Implements intelligent retry logic with exponential backoff and jitter
 */

import LoggingService from './LoggingService';
import LocalStorageService from './LocalStorageService';
import MonitoringManager from './MonitoringManager';
import CircuitBreakerService from './CircuitBreakerService';

class RetryService {
  constructor() {
    this.initialized = false;
    this.retryPolicies = new Map();
    this.activeRetries = new Map();
    
    // Default retry configuration
    this.defaultConfig = {
      maxAttempts: 3,
      baseDelay: 1000, // 1 second
      maxDelay: 30000, // 30 seconds
      backoffMultiplier: 2,
      jitter: true,
      retryableErrors: [
        'NetworkError',
        'TimeoutError',
        'ServiceUnavailableError',
        'RateLimitError',
      ],
      nonRetryableErrors: [
        'AuthenticationError',
        'AuthorizationError',
        'ValidationError',
        'NotFoundError',
      ],
      circuitBreakerEnabled: true,
    };
    
    // Retry strategies
    this.strategies = {
      EXPONENTIAL_BACKOFF: 'exponential_backoff',
      LINEAR_BACKOFF: 'linear_backoff',
      FIXED_DELAY: 'fixed_delay',
      FIBONACCI: 'fibonacci',
    };
    
    // Statistics
    this.stats = {
      totalRetries: 0,
      successfulRetries: 0,
      failedRetries: 0,
      totalAttempts: 0,
      averageAttempts: 0,
      retriesByError: {},
      retriesByFunction: {},
    };
    
    // Event listeners
    this.listeners = new Set();
  }

  /**
   * Initialize retry service
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Load retry statistics
      await this.loadRetryStats();
      
      // Setup default retry policies
      this.setupDefaultPolicies();
      
      this.initialized = true;
      
      LoggingService.info('[RetryService] Initialized', {
        defaultConfig: this.defaultConfig,
        strategies: Object.keys(this.strategies).length,
      });

    } catch (error) {
      LoggingService.error('[RetryService] Failed to initialize', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Setup default retry policies
   */
  setupDefaultPolicies() {
    // Network requests policy
    this.registerPolicy('network', {
      ...this.defaultConfig,
      maxAttempts: 3,
      strategy: this.strategies.EXPONENTIAL_BACKOFF,
      retryableErrors: ['NetworkError', 'TimeoutError', 'ServiceUnavailableError'],
    });
    
    // API calls policy
    this.registerPolicy('api', {
      ...this.defaultConfig,
      maxAttempts: 5,
      baseDelay: 500,
      strategy: this.strategies.EXPONENTIAL_BACKOFF,
      retryableErrors: ['RateLimitError', 'ServiceUnavailableError', 'TimeoutError'],
    });
    
    // Database operations policy
    this.registerPolicy('database', {
      ...this.defaultConfig,
      maxAttempts: 2,
      baseDelay: 2000,
      strategy: this.strategies.FIXED_DELAY,
      retryableErrors: ['DatabaseLockError', 'ConnectionError'],
    });
    
    // File operations policy
    this.registerPolicy('file', {
      ...this.defaultConfig,
      maxAttempts: 3,
      baseDelay: 1000,
      strategy: this.strategies.LINEAR_BACKOFF,
      retryableErrors: ['FileSystemError', 'PermissionError'],
    });
    
    LoggingService.debug('[RetryService] Default policies registered', {
      policies: this.retryPolicies.size,
    });
  }

  /**
   * Register retry policy
   */
  registerPolicy(name, config) {
    const policy = { ...this.defaultConfig, ...config };
    this.retryPolicies.set(name, policy);
    
    LoggingService.debug('[RetryService] Policy registered', {
      name,
      maxAttempts: policy.maxAttempts,
      strategy: policy.strategy,
    });
  }

  /**
   * Execute function with retry logic
   */
  async executeWithRetry(fn, options = {}) {
    const {
      policyName = 'default',
      functionName = 'anonymous',
      context = {},
      onRetry = null,
      customConfig = {},
    } = options;
    
    const policy = this.getPolicy(policyName, customConfig);
    const retryId = this.generateRetryId();
    
    const retryContext = {
      id: retryId,
      functionName,
      policy,
      context,
      attempt: 0,
      startTime: Date.now(),
      errors: [],
      onRetry,
    };
    
    this.activeRetries.set(retryId, retryContext);
    
    try {
      const result = await this.performRetry(fn, retryContext);
      
      // Update statistics
      this.updateSuccessStats(retryContext);
      
      // Notify listeners
      this.notifyListeners('retry_success', {
        id: retryId,
        functionName,
        attempts: retryContext.attempt,
        duration: Date.now() - retryContext.startTime,
      });
      
      return result;

    } catch (error) {
      // Update statistics
      this.updateFailureStats(retryContext, error);
      
      // Notify listeners
      this.notifyListeners('retry_failed', {
        id: retryId,
        functionName,
        attempts: retryContext.attempt,
        error: error.message,
        duration: Date.now() - retryContext.startTime,
      });
      
      throw error;
      
    } finally {
      this.activeRetries.delete(retryId);
    }
  }

  /**
   * Perform retry logic
   */
  async performRetry(fn, retryContext) {
    const { policy, id, functionName } = retryContext;
    
    while (retryContext.attempt < policy.maxAttempts) {
      retryContext.attempt++;
      this.stats.totalAttempts++;
      
      try {
        // Check circuit breaker if enabled
        if (policy.circuitBreakerEnabled) {
          return await CircuitBreakerService.execute(
            `retry_${functionName}`,
            fn,
            { failureThreshold: 60 } // 60% failure rate threshold
          );
        } else {
          return await fn();
        }

      } catch (error) {
        retryContext.errors.push({
          attempt: retryContext.attempt,
          error: error.message,
          timestamp: Date.now(),
        });
        
        LoggingService.debug('[RetryService] Attempt failed', {
          id,
          attempt: retryContext.attempt,
          error: error.message,
          functionName,
        });
        
        // Check if error is retryable
        if (!this.isRetryableError(error, policy)) {
          LoggingService.info('[RetryService] Non-retryable error', {
            id,
            error: error.message,
            functionName,
          });
          throw error;
        }
        
        // Check if we have more attempts
        if (retryContext.attempt >= policy.maxAttempts) {
          LoggingService.warn('[RetryService] Max attempts reached', {
            id,
            attempts: retryContext.attempt,
            error: error.message,
            functionName,
          });
          throw error;
        }
        
        // Calculate delay and wait
        const delay = this.calculateDelay(retryContext.attempt, policy);
        
        LoggingService.info('[RetryService] Retrying after delay', {
          id,
          attempt: retryContext.attempt,
          nextAttempt: retryContext.attempt + 1,
          delay,
          functionName,
        });
        
        // Notify retry listeners
        if (retryContext.onRetry) {
          try {
            await retryContext.onRetry(retryContext.attempt, error, delay);
          } catch (callbackError) {
            LoggingService.warn('[RetryService] Retry callback failed', {
              error: callbackError.message,
            });
          }
        }
        
        this.notifyListeners('retry_attempt', {
          id,
          attempt: retryContext.attempt,
          nextAttempt: retryContext.attempt + 1,
          delay,
          error: error.message,
          functionName,
        });
        
        // Wait before next attempt
        await this.sleep(delay);
      }
    }
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(error, policy) {
    const errorName = error.constructor.name || error.name || 'Error';
    const errorMessage = error.message || '';
    
    // Check non-retryable errors first
    for (const nonRetryableError of policy.nonRetryableErrors) {
      if (errorName.includes(nonRetryableError) || errorMessage.includes(nonRetryableError)) {
        return false;
      }
    }
    
    // Check retryable errors
    for (const retryableError of policy.retryableErrors) {
      if (errorName.includes(retryableError) || errorMessage.includes(retryableError)) {
        return true;
      }
    }
    
    // Check HTTP status codes
    if (error.status) {
      const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
      return retryableStatusCodes.includes(error.status);
    }
    
    // Default to not retryable for unknown errors
    return false;
  }

  /**
   * Calculate delay based on strategy
   */
  calculateDelay(attempt, policy) {
    let delay;
    
    switch (policy.strategy) {
      case this.strategies.EXPONENTIAL_BACKOFF:
        delay = policy.baseDelay * Math.pow(policy.backoffMultiplier, attempt - 1);
        break;
        
      case this.strategies.LINEAR_BACKOFF:
        delay = policy.baseDelay * attempt;
        break;
        
      case this.strategies.FIXED_DELAY:
        delay = policy.baseDelay;
        break;
        
      case this.strategies.FIBONACCI:
        delay = this.fibonacci(attempt) * policy.baseDelay;
        break;
        
      default:
        delay = policy.baseDelay * Math.pow(policy.backoffMultiplier, attempt - 1);
    }
    
    // Apply maximum delay cap
    delay = Math.min(delay, policy.maxDelay);
    
    // Apply jitter if enabled
    if (policy.jitter) {
      const jitterRange = delay * 0.1; // 10% jitter
      const jitter = (Math.random() - 0.5) * 2 * jitterRange;
      delay = Math.max(0, delay + jitter);
    }
    
    return Math.round(delay);
  }

  /**
   * Calculate fibonacci number
   */
  fibonacci(n) {
    if (n <= 1) return 1;
    let a = 1, b = 1;
    for (let i = 2; i <= n; i++) {
      [a, b] = [b, a + b];
    }
    return b;
  }

  /**
   * Get retry policy
   */
  getPolicy(policyName, customConfig = {}) {
    const basePolicy = this.retryPolicies.get(policyName) || this.defaultConfig;
    return { ...basePolicy, ...customConfig };
  }

  /**
   * Update success statistics
   */
  updateSuccessStats(retryContext) {
    this.stats.totalRetries++;
    
    if (retryContext.attempt > 1) {
      this.stats.successfulRetries++;
    }
    
    // Update function statistics
    if (!this.stats.retriesByFunction[retryContext.functionName]) {
      this.stats.retriesByFunction[retryContext.functionName] = {
        total: 0,
        successful: 0,
        failed: 0,
        totalAttempts: 0,
      };
    }
    
    const funcStats = this.stats.retriesByFunction[retryContext.functionName];
    funcStats.total++;
    if (retryContext.attempt > 1) {
      funcStats.successful++;
    }
    funcStats.totalAttempts += retryContext.attempt;
    
    // Recalculate average attempts
    this.stats.averageAttempts = this.stats.totalAttempts / this.stats.totalRetries;
  }

  /**
   * Update failure statistics
   */
  updateFailureStats(retryContext, finalError) {
    this.stats.totalRetries++;
    this.stats.failedRetries++;
    
    // Update error statistics
    const errorName = finalError.constructor.name || finalError.name || 'Error';
    if (!this.stats.retriesByError[errorName]) {
      this.stats.retriesByError[errorName] = 0;
    }
    this.stats.retriesByError[errorName]++;
    
    // Update function statistics
    if (!this.stats.retriesByFunction[retryContext.functionName]) {
      this.stats.retriesByFunction[retryContext.functionName] = {
        total: 0,
        successful: 0,
        failed: 0,
        totalAttempts: 0,
      };
    }
    
    const funcStats = this.stats.retriesByFunction[retryContext.functionName];
    funcStats.total++;
    funcStats.failed++;
    funcStats.totalAttempts += retryContext.attempt;
    
    // Recalculate average attempts
    this.stats.averageAttempts = this.stats.totalAttempts / this.stats.totalRetries;
    
    // Track analytics
    MonitoringManager.trackEvent?.('retry_failed', {
      functionName: retryContext.functionName,
      attempts: retryContext.attempt,
      errorType: errorName,
    });
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate retry ID
   */
  generateRetryId() {
    return `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get active retries
   */
  getActiveRetries() {
    const retries = [];
    for (const retry of this.activeRetries.values()) {
      retries.push({
        id: retry.id,
        functionName: retry.functionName,
        attempt: retry.attempt,
        maxAttempts: retry.policy.maxAttempts,
        startTime: retry.startTime,
        duration: Date.now() - retry.startTime,
        errors: retry.errors.length,
      });
    }
    return retries;
  }

  /**
   * Cancel active retry
   */
  cancelRetry(retryId) {
    const retry = this.activeRetries.get(retryId);
    if (retry) {
      this.activeRetries.delete(retryId);
      LoggingService.info('[RetryService] Retry cancelled', {
        id: retryId,
        functionName: retry.functionName,
        attempt: retry.attempt,
      });
      
      this.notifyListeners('retry_cancelled', {
        id: retryId,
        functionName: retry.functionName,
        attempt: retry.attempt,
      });
      
      return true;
    }
    return false;
  }

  /**
   * Load retry statistics
   */
  async loadRetryStats() {
    try {
      const savedStats = await LocalStorageService.getItem('retry_service_stats');
      if (savedStats) {
        this.stats = { ...this.stats, ...savedStats };
      }

    } catch (error) {
      LoggingService.warn('[RetryService] Failed to load retry stats', {
        error: error.message,
      });
    }
  }

  /**
   * Save retry statistics
   */
  async saveRetryStats() {
    try {
      await LocalStorageService.setItem('retry_service_stats', this.stats);

    } catch (error) {
      LoggingService.warn('[RetryService] Failed to save retry stats', {
        error: error.message,
      });
    }
  }

  /**
   * Get service statistics
   */
  getStatistics() {
    const successRate = this.stats.totalRetries > 0 
      ? Math.round((this.stats.successfulRetries / this.stats.totalRetries) * 100)
      : 0;
    
    return {
      ...this.stats,
      activeRetries: this.activeRetries.size,
      successRate,
      registeredPolicies: this.retryPolicies.size,
      initialized: this.initialized,
    };
  }

  /**
   * Get policy information
   */
  getPolicyInfo(policyName) {
    return this.retryPolicies.get(policyName) || null;
  }

  /**
   * Get all policies
   */
  getAllPolicies() {
    const policies = {};
    for (const [name, policy] of this.retryPolicies) {
      policies[name] = policy;
    }
    return policies;
  }

  /**
   * Update policy
   */
  updatePolicy(name, updates) {
    const existingPolicy = this.retryPolicies.get(name);
    if (existingPolicy) {
      const updatedPolicy = { ...existingPolicy, ...updates };
      this.retryPolicies.set(name, updatedPolicy);
      
      LoggingService.info('[RetryService] Policy updated', {
        name,
        updates,
      });
      
      return true;
    }
    return false;
  }

  /**
   * Remove policy
   */
  removePolicy(name) {
    const removed = this.retryPolicies.delete(name);
    if (removed) {
      LoggingService.info('[RetryService] Policy removed', { name });
    }
    return removed;
  }

  /**
   * Add event listener
   */
  addListener(listener) {
    this.listeners.add(listener);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify event listeners
   */
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        LoggingService.error('[RetryService] Listener error', {
          error: error.message,
          event,
        });
      }
    });
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.activeRetries.clear();
    this.retryPolicies.clear();
    this.listeners.clear();
    this.initialized = false;
  }
}

// Create singleton instance
const retryService = new RetryService();

export default retryService;