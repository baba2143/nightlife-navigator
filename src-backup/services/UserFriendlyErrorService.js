/**
 * User Friendly Error Service
 * Provides user-friendly error messages and guidance for error resolution
 */

import LoggingService from './LoggingService';
import LocalStorageService from './LocalStorageService';
import ConfigService from './ConfigService';

class UserFriendlyErrorService {
  constructor() {
    this.initialized = false;
    this.errorMessages = new Map();
    this.errorActions = new Map();
    this.errorCategories = new Map();
    this.userPreferences = {
      language: 'ja',
      showTechnicalDetails: false,
      showSuggestedActions: true,
      enableVoiceAssistance: false,
    };
    
    // Message templates
    this.templates = {
      network: {
        title: 'ネットワークエラー',
        message: 'インターネット接続に問題があります',
        actions: ['ネットワーク設定を確認', '再試行', 'オフラインモード'],
        icon: 'wifi-off',
        severity: 'warning',
      },
      authentication: {
        title: '認証エラー',
        message: 'ログイン情報に問題があります',
        actions: ['再ログイン', 'パスワードリセット', 'サポートに連絡'],
        icon: 'lock-open',
        severity: 'error',
      },
      permission: {
        title: 'アクセス権限エラー',
        message: '必要な権限がありません',
        actions: ['設定で権限を有効化', '手順を表示', 'スキップ'],
        icon: 'shield-alert',
        severity: 'warning',
      },
      storage: {
        title: 'ストレージエラー',
        message: 'データの保存に問題があります',
        actions: ['ストレージを確認', '不要なデータを削除', '再試行'],
        icon: 'hard-drive',
        severity: 'error',
      },
      validation: {
        title: '入力エラー',
        message: '入力内容に問題があります',
        actions: ['入力内容を確認', '例を表示', 'リセット'],
        icon: 'alert-circle',
        severity: 'info',
      },
      server: {
        title: 'サーバーエラー',
        message: 'サーバーに一時的な問題があります',
        actions: ['しばらく待ってから再試行', 'ステータスを確認', 'サポートに連絡'],
        icon: 'server',
        severity: 'error',
      },
      unknown: {
        title: '予期しないエラー',
        message: '予期しない問題が発生しました',
        actions: ['再試行', 'アプリを再起動', 'サポートに連絡'],
        icon: 'help-circle',
        severity: 'error',
      },
    };
    
    // Localization
    this.localizations = {
      ja: {
        common: {
          retry: '再試行',
          cancel: 'キャンセル',
          ok: 'OK',
          close: '閉じる',
          help: 'ヘルプ',
          settings: '設定',
          support: 'サポート',
          skip: 'スキップ',
        },
        actions: {
          checkNetwork: 'ネットワーク設定を確認',
          enablePermission: '設定で権限を有効化',
          clearStorage: '不要なデータを削除',
          restartApp: 'アプリを再起動',
          contactSupport: 'サポートに連絡',
          showGuide: '手順を表示',
          tryOffline: 'オフラインモード',
          relogin: '再ログイン',
          resetPassword: 'パスワードリセット',
          checkStatus: 'ステータスを確認',
        },
        guidance: {
          networkCheck: 'Wi-Fi接続またはモバイルデータ通信が有効になっているか確認してください',
          permissionGuide: 'デバイスの設定アプリから、このアプリの権限を有効にしてください',
          storageGuide: 'デバイスの空き容量を確認し、不要なファイルを削除してください',
          validationGuide: '入力フィールドの形式と必須項目を確認してください',
        },
      },
      en: {
        common: {
          retry: 'Retry',
          cancel: 'Cancel',
          ok: 'OK',
          close: 'Close',
          help: 'Help',
          settings: 'Settings',
          support: 'Support',
          skip: 'Skip',
        },
        actions: {
          checkNetwork: 'Check network settings',
          enablePermission: 'Enable permission in settings',
          clearStorage: 'Clear unnecessary data',
          restartApp: 'Restart app',
          contactSupport: 'Contact support',
          showGuide: 'Show guide',
          tryOffline: 'Try offline mode',
          relogin: 'Login again',
          resetPassword: 'Reset password',
          checkStatus: 'Check status',
        },
        guidance: {
          networkCheck: 'Please check if Wi-Fi or mobile data connection is enabled',
          permissionGuide: 'Please enable app permissions in your device settings',
          storageGuide: 'Please check available storage space and delete unnecessary files',
          validationGuide: 'Please check input field format and required fields',
        },
      },
    };
    
    // Statistics
    this.stats = {
      errorsShown: 0,
      actionsPerformed: 0,
      helpRequested: 0,
      feedbackSubmitted: 0,
      errorsByCategory: {},
      actionsByType: {},
    };
    
    // Event listeners
    this.listeners = new Set();
  }

  /**
   * Initialize user friendly error service
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Load user preferences
      await this.loadUserPreferences();
      
      // Setup error message mappings
      this.setupErrorMappings();
      
      // Setup action handlers
      this.setupActionHandlers();
      
      this.initialized = true;
      
      LoggingService.info('[UserFriendlyErrorService] Initialized', {
        language: this.userPreferences.language,
        showTechnicalDetails: this.userPreferences.showTechnicalDetails,
      });

    } catch (error) {
      LoggingService.error('[UserFriendlyErrorService] Failed to initialize', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Setup error message mappings
   */
  setupErrorMappings() {
    // Map error types to categories
    this.errorCategories.set('NetworkError', 'network');
    this.errorCategories.set('TimeoutError', 'network');
    this.errorCategories.set('ConnectionError', 'network');
    this.errorCategories.set('AuthenticationError', 'authentication');
    this.errorCategories.set('AuthorizationError', 'authentication');
    this.errorCategories.set('PermissionError', 'permission');
    this.errorCategories.set('StorageError', 'storage');
    this.errorCategories.set('ValidationError', 'validation');
    this.errorCategories.set('ServerError', 'server');
    this.errorCategories.set('ServiceUnavailableError', 'server');
    
    // Map HTTP status codes to categories
    this.errorCategories.set('400', 'validation');
    this.errorCategories.set('401', 'authentication');
    this.errorCategories.set('403', 'permission');
    this.errorCategories.set('404', 'server');
    this.errorCategories.set('408', 'network');
    this.errorCategories.set('429', 'server');
    this.errorCategories.set('500', 'server');
    this.errorCategories.set('502', 'server');
    this.errorCategories.set('503', 'server');
    this.errorCategories.set('504', 'network');
    
    LoggingService.debug('[UserFriendlyErrorService] Error mappings setup', {
      categories: this.errorCategories.size,
    });
  }

  /**
   * Setup action handlers
   */
  setupActionHandlers() {
    // Register action handlers
    this.errorActions.set('retry', this.handleRetryAction.bind(this));
    this.errorActions.set('checkNetwork', this.handleNetworkCheckAction.bind(this));
    this.errorActions.set('enablePermission', this.handlePermissionAction.bind(this));
    this.errorActions.set('clearStorage', this.handleStorageAction.bind(this));
    this.errorActions.set('restartApp', this.handleRestartAction.bind(this));
    this.errorActions.set('contactSupport', this.handleSupportAction.bind(this));
    this.errorActions.set('showGuide', this.handleGuideAction.bind(this));
    this.errorActions.set('tryOffline', this.handleOfflineAction.bind(this));
    this.errorActions.set('relogin', this.handleReloginAction.bind(this));
    this.errorActions.set('resetPassword', this.handlePasswordResetAction.bind(this));
    
    LoggingService.debug('[UserFriendlyErrorService] Action handlers setup', {
      actions: this.errorActions.size,
    });
  }

  /**
   * Generate user-friendly error message
   */
  generateFriendlyError(error, context = {}) {
    try {
      const category = this.categorizeError(error);
      const template = this.templates[category] || this.templates.unknown;
      const localization = this.localizations[this.userPreferences.language] || this.localizations.ja;
      
      const friendlyError = {
        id: this.generateErrorId(),
        timestamp: new Date().toISOString(),
        category,
        title: template.title,
        message: this.generateContextualMessage(error, template, context),
        icon: template.icon,
        severity: template.severity,
        actions: this.generateActions(template, localization),
        guidance: this.generateGuidance(category, localization),
        technicalDetails: this.userPreferences.showTechnicalDetails ? {
          originalError: error.message,
          stack: error.stack,
          context,
        } : null,
        canRetry: this.canRetry(category),
        canGetHelp: true,
        metadata: {
          userInitiated: context.userInitiated || false,
          source: context.source || 'system',
          errorId: error.id || null,
        },
      };
      
      // Update statistics
      this.updateStatistics(category);
      
      // Log the friendly error
      LoggingService.info('[UserFriendlyErrorService] Friendly error generated', {
        category,
        title: friendlyError.title,
        canRetry: friendlyError.canRetry,
      });
      
      // Notify listeners
      this.notifyListeners('error_generated', friendlyError);
      
      return friendlyError;

    } catch (processingError) {
      LoggingService.error('[UserFriendlyErrorService] Failed to generate friendly error', {
        error: processingError.message,
        originalError: error.message,
      });
      
      // Return fallback error
      return this.generateFallbackError(error);
    }
  }

  /**
   * Categorize error
   */
  categorizeError(error) {
    // Check by error type/name
    const errorName = error.constructor.name || error.name || '';
    if (this.errorCategories.has(errorName)) {
      return this.errorCategories.get(errorName);
    }
    
    // Check by HTTP status code
    if (error.status && this.errorCategories.has(error.status.toString())) {
      return this.errorCategories.get(error.status.toString());
    }
    
    // Check by error message patterns
    const message = error.message || '';
    if (message.toLowerCase().includes('network') || message.toLowerCase().includes('connection')) {
      return 'network';
    }
    if (message.toLowerCase().includes('permission') || message.toLowerCase().includes('denied')) {
      return 'permission';
    }
    if (message.toLowerCase().includes('authentication') || message.toLowerCase().includes('unauthorized')) {
      return 'authentication';
    }
    if (message.toLowerCase().includes('validation') || message.toLowerCase().includes('invalid')) {
      return 'validation';
    }
    if (message.toLowerCase().includes('storage') || message.toLowerCase().includes('quota')) {
      return 'storage';
    }
    
    return 'unknown';
  }

  /**
   * Generate contextual message
   */
  generateContextualMessage(error, template, context) {
    let message = template.message;
    
    // Add context-specific information
    if (context.operation) {
      message += ` (${context.operation}中)`;
    }
    
    if (context.resource) {
      message += ` - ${context.resource}`;
    }
    
    // Add specific error details for certain categories
    if (template.severity === 'info' && error.details) {
      message += `：${error.details}`;
    }
    
    return message;
  }

  /**
   * Generate actions
   */
  generateActions(template, localization) {
    return template.actions.map(actionKey => {
      const actionText = localization.actions[actionKey] || actionKey;
      return {
        key: actionKey,
        text: actionText,
        primary: actionKey === 'retry' || actionKey === 'relogin',
        destructive: actionKey === 'clearStorage' || actionKey === 'restartApp',
      };
    });
  }

  /**
   * Generate guidance
   */
  generateGuidance(category, localization) {
    const guidanceKey = `${category}Guide`;
    const guidance = localization.guidance[guidanceKey];
    
    if (!guidance) {
      return null;
    }
    
    return {
      text: guidance,
      showIcon: true,
      expandable: true,
    };
  }

  /**
   * Check if error can be retried
   */
  canRetry(category) {
    const retryableCategories = ['network', 'server', 'storage'];
    return retryableCategories.includes(category);
  }

  /**
   * Generate fallback error
   */
  generateFallbackError(error) {
    const localization = this.localizations[this.userPreferences.language] || this.localizations.ja;
    
    return {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      category: 'unknown',
      title: this.templates.unknown.title,
      message: this.templates.unknown.message,
      icon: this.templates.unknown.icon,
      severity: this.templates.unknown.severity,
      actions: [{
        key: 'retry',
        text: localization.common.retry,
        primary: true,
      }, {
        key: 'contactSupport',
        text: localization.common.support,
        primary: false,
      }],
      guidance: null,
      technicalDetails: this.userPreferences.showTechnicalDetails ? {
        originalError: error.message,
        stack: error.stack,
      } : null,
      canRetry: true,
      canGetHelp: true,
      metadata: {
        fallback: true,
      },
    };
  }

  /**
   * Handle user action
   */
  async handleUserAction(actionKey, errorData, actionContext = {}) {
    try {
      LoggingService.info('[UserFriendlyErrorService] Handling user action', {
        actionKey,
        errorCategory: errorData.category,
        errorId: errorData.id,
      });
      
      // Update statistics
      this.updateActionStatistics(actionKey);
      
      // Get action handler
      const handler = this.errorActions.get(actionKey);
      if (handler) {
        const result = await handler(errorData, actionContext);
        
        // Notify listeners
        this.notifyListeners('action_performed', {
          actionKey,
          errorData,
          result,
          success: true,
        });
        
        return result;
      } else {
        LoggingService.warn('[UserFriendlyErrorService] No handler for action', {
          actionKey,
        });
        
        return { success: false, message: 'Action not supported' };
      }

    } catch (error) {
      LoggingService.error('[UserFriendlyErrorService] Action handling failed', {
        error: error.message,
        actionKey,
      });
      
      // Notify listeners
      this.notifyListeners('action_performed', {
        actionKey,
        errorData,
        error: error.message,
        success: false,
      });
      
      return { success: false, message: error.message };
    }
  }

  // Action handlers

  /**
   * Handle retry action
   */
  async handleRetryAction(errorData, context) {
    LoggingService.info('[UserFriendlyErrorService] Executing retry action');
    
    // This would integrate with the original operation to retry
    // For now, just return success
    return {
      success: true,
      message: 'Retry initiated',
      action: 'retry',
    };
  }

  /**
   * Handle network check action
   */
  async handleNetworkCheckAction(errorData, context) {
    LoggingService.info('[UserFriendlyErrorService] Opening network settings');
    
    // This would open device network settings
    // For now, just return guidance
    return {
      success: true,
      message: 'Please check your network settings manually',
      guidance: 'Go to Settings > Wi-Fi or Mobile Data',
      action: 'network_check',
    };
  }

  /**
   * Handle permission action
   */
  async handlePermissionAction(errorData, context) {
    LoggingService.info('[UserFriendlyErrorService] Opening permission settings');
    
    // This would open app permission settings
    return {
      success: true,
      message: 'Please enable required permissions in settings',
      guidance: 'Go to Settings > Apps > Permissions',
      action: 'permission_request',
    };
  }

  /**
   * Handle storage action
   */
  async handleStorageAction(errorData, context) {
    LoggingService.info('[UserFriendlyErrorService] Initiating storage cleanup');
    
    // This would integrate with storage cleanup functionality
    return {
      success: true,
      message: 'Storage cleanup initiated',
      action: 'storage_cleanup',
    };
  }

  /**
   * Handle restart action
   */
  async handleRestartAction(errorData, context) {
    LoggingService.info('[UserFriendlyErrorService] Initiating app restart');
    
    // This would restart the app
    return {
      success: true,
      message: 'App restart initiated',
      action: 'app_restart',
    };
  }

  /**
   * Handle support action
   */
  async handleSupportAction(errorData, context) {
    LoggingService.info('[UserFriendlyErrorService] Opening support contact');
    
    // This would open support contact form or chat
    return {
      success: true,
      message: 'Support contact opened',
      action: 'contact_support',
    };
  }

  /**
   * Handle guide action
   */
  async handleGuideAction(errorData, context) {
    LoggingService.info('[UserFriendlyErrorService] Showing help guide');
    
    // This would show contextual help
    return {
      success: true,
      message: 'Help guide displayed',
      action: 'show_guide',
    };
  }

  /**
   * Handle offline action
   */
  async handleOfflineAction(errorData, context) {
    LoggingService.info('[UserFriendlyErrorService] Switching to offline mode');
    
    // This would enable offline mode
    return {
      success: true,
      message: 'Offline mode enabled',
      action: 'offline_mode',
    };
  }

  /**
   * Handle relogin action
   */
  async handleReloginAction(errorData, context) {
    LoggingService.info('[UserFriendlyErrorService] Initiating relogin');
    
    // This would redirect to login screen
    return {
      success: true,
      message: 'Redirecting to login',
      action: 'relogin',
    };
  }

  /**
   * Handle password reset action
   */
  async handlePasswordResetAction(errorData, context) {
    LoggingService.info('[UserFriendlyErrorService] Initiating password reset');
    
    // This would open password reset flow
    return {
      success: true,
      message: 'Password reset initiated',
      action: 'password_reset',
    };
  }

  /**
   * Load user preferences
   */
  async loadUserPreferences() {
    try {
      const savedPreferences = await LocalStorageService.getItem('user_friendly_error_preferences');
      if (savedPreferences) {
        this.userPreferences = { ...this.userPreferences, ...savedPreferences };
      }
    } catch (error) {
      LoggingService.warn('[UserFriendlyErrorService] Failed to load preferences', {
        error: error.message,
      });
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(updates) {
    try {
      this.userPreferences = { ...this.userPreferences, ...updates };
      
      await LocalStorageService.setItem('user_friendly_error_preferences', this.userPreferences);
      
      LoggingService.info('[UserFriendlyErrorService] Preferences updated', updates);
      
    } catch (error) {
      LoggingService.error('[UserFriendlyErrorService] Failed to update preferences', {
        error: error.message,
      });
    }
  }

  /**
   * Update statistics
   */
  updateStatistics(category) {
    this.stats.errorsShown++;
    
    if (!this.stats.errorsByCategory[category]) {
      this.stats.errorsByCategory[category] = 0;
    }
    this.stats.errorsByCategory[category]++;
  }

  /**
   * Update action statistics
   */
  updateActionStatistics(actionKey) {
    this.stats.actionsPerformed++;
    
    if (!this.stats.actionsByType[actionKey]) {
      this.stats.actionsByType[actionKey] = 0;
    }
    this.stats.actionsByType[actionKey]++;
  }

  /**
   * Generate error ID
   */
  generateErrorId() {
    return `friendly_error_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * Get service statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      preferences: this.userPreferences,
      initialized: this.initialized,
    };
  }

  /**
   * Add custom error mapping
   */
  addErrorMapping(errorType, category) {
    this.errorCategories.set(errorType, category);
    LoggingService.debug('[UserFriendlyErrorService] Custom error mapping added', {
      errorType,
      category,
    });
  }

  /**
   * Add custom template
   */
  addTemplate(category, template) {
    this.templates[category] = template;
    LoggingService.debug('[UserFriendlyErrorService] Custom template added', {
      category,
    });
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
        LoggingService.error('[UserFriendlyErrorService] Listener error', {
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
    this.listeners.clear();
    this.errorMessages.clear();
    this.errorActions.clear();
    this.errorCategories.clear();
    this.initialized = false;
  }
}

// Create singleton instance
const userFriendlyErrorService = new UserFriendlyErrorService();

export default userFriendlyErrorService;