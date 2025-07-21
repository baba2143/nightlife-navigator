/**
 * Privacy Policy Service
 * Manages privacy policy, consent tracking, and user privacy preferences
 */

import { Platform, Linking } from 'react-native';

import LoggingService from './LoggingService';
import LocalStorageService from './LocalStorageService';
import ConfigService from './ConfigService';
import MonitoringManager from './MonitoringManager';

class PrivacyPolicyService {
  constructor() {
    this.initialized = false;
    this.currentPolicyVersion = '1.0.0';
    this.userConsent = null;
    this.privacySettings = null;
    
    // Privacy policy configuration
    this.config = {
      policyUrl: 'https://nightlife-navigator.com/privacy',
      updateCheckInterval: 24 * 60 * 60 * 1000, // 24 hours
      requireExplicitConsent: true,
      enableGranularConsent: true,
      dataRetentionPeriod: 365 * 24 * 60 * 60 * 1000, // 1 year
      enableDataPortability: true,
      enableRightToErasure: true,
    };
    
    // Privacy categories
    this.privacyCategories = {
      ESSENTIAL: {
        id: 'essential',
        name: '必須機能',
        description: 'アプリの基本機能に必要なデータ',
        required: true,
        purposes: ['アプリの動作', 'セキュリティ', 'エラー対応'],
        dataTypes: ['ユーザーID', 'アプリ設定', 'エラーログ'],
        retention: '利用期間中',
      },
      FUNCTIONAL: {
        id: 'functional',
        name: '機能向上',
        description: 'サービス向上のためのデータ収集',
        required: false,
        purposes: ['機能改善', 'パーソナライゼーション'],
        dataTypes: ['利用履歴', 'お気に入り', '検索履歴'],
        retention: '1年間',
      },
      ANALYTICS: {
        id: 'analytics',
        name: '分析・統計',
        description: 'サービス分析のためのデータ収集',
        required: false,
        purposes: ['利用統計', 'パフォーマンス分析'],
        dataTypes: ['匿名利用データ', 'パフォーマンスデータ'],
        retention: '2年間',
      },
      MARKETING: {
        id: 'marketing',
        name: 'マーケティング',
        description: 'プロモーション・広告のためのデータ',
        required: false,
        purposes: ['パーソナライズ広告', 'プロモーション'],
        dataTypes: ['興味関心データ', '位置情報'],
        retention: '6か月間',
      },
      LOCATION: {
        id: 'location',
        name: '位置情報',
        description: '位置ベースサービスのための位置情報',
        required: false,
        purposes: ['店舗検索', 'おすすめ提案'],
        dataTypes: ['GPS位置情報', '訪問履歴'],
        retention: '3か月間',
      },
    };
    
    // Legal basis types
    this.legalBasisTypes = {
      CONSENT: 'consent',
      CONTRACT: 'contract',
      LEGAL_OBLIGATION: 'legal_obligation',
      VITAL_INTERESTS: 'vital_interests',
      PUBLIC_TASK: 'public_task',
      LEGITIMATE_INTERESTS: 'legitimate_interests',
    };
    
    // Data subject rights
    this.dataSubjectRights = {
      ACCESS: 'access',
      RECTIFICATION: 'rectification',
      ERASURE: 'erasure',
      RESTRICT_PROCESSING: 'restrict_processing',
      DATA_PORTABILITY: 'data_portability',
      OBJECT: 'object',
      WITHDRAW_CONSENT: 'withdraw_consent',
    };
    
    // Statistics
    this.stats = {
      policyViewed: 0,
      consentGiven: 0,
      consentWithdrawn: 0,
      dataRequests: 0,
      privacySettingsChanged: 0,
      rightExercised: {},
    };
    
    // Event listeners
    this.listeners = new Set();
    this.updateCheckTimer = null;
  }

  /**
   * Initialize privacy policy service
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Load privacy configuration
      await this.loadPrivacyConfig();
      
      // Load user consent
      await this.loadUserConsent();
      
      // Load privacy settings
      await this.loadPrivacySettings();
      
      // Check for policy updates
      this.setupPolicyUpdateCheck();
      
      // Validate existing consent
      await this.validateExistingConsent();
      
      this.initialized = true;
      
      LoggingService.info('[PrivacyPolicyService] Initialized', {
        policyVersion: this.currentPolicyVersion,
        hasConsent: !!this.userConsent,
        requiresConsent: this.requiresConsent(),
      });

    } catch (error) {
      LoggingService.error('[PrivacyPolicyService] Failed to initialize', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get current privacy policy
   */
  async getPrivacyPolicy() {
    try {
      return {
        version: this.currentPolicyVersion,
        lastUpdated: await this.getPolicyLastUpdated(),
        url: this.config.policyUrl,
        categories: this.privacyCategories,
        dataSubjectRights: this.getDataSubjectRightsInfo(),
        contactInfo: this.getContactInfo(),
        legalBasis: this.getLegalBasisInfo(),
        dataProcessing: this.getDataProcessingInfo(),
        internationalTransfers: this.getInternationalTransfersInfo(),
        retentionPolicy: this.getRetentionPolicyInfo(),
      };

    } catch (error) {
      LoggingService.error('[PrivacyPolicyService] Failed to get privacy policy', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Record user consent
   */
  async recordConsent(consentData) {
    try {
      const consent = {
        version: this.currentPolicyVersion,
        timestamp: new Date().toISOString(),
        consents: consentData.consents || {},
        ipAddress: await this.getClientIP(),
        userAgent: Platform.OS,
        method: consentData.method || 'app',
        consentId: this.generateConsentId(),
        isExplicit: consentData.isExplicit || false,
        categories: this.validateConsentCategories(consentData.consents),
      };
      
      // Store consent
      this.userConsent = consent;
      await this.saveUserConsent();
      
      // Update privacy settings based on consent
      await this.updatePrivacySettingsFromConsent(consent);
      
      // Update statistics
      this.stats.consentGiven++;
      await this.savePrivacyStats();
      
      LoggingService.info('[PrivacyPolicyService] Consent recorded', {
        consentId: consent.consentId,
        version: consent.version,
        categories: Object.keys(consent.consents),
      });
      
      // Track analytics (if consented)
      if (consent.consents.analytics) {
        MonitoringManager.trackUserAction?.('consent_given', 'privacy', {
          version: consent.version,
          categories: Object.keys(consent.consents),
        });
      }
      
      // Notify listeners
      this.notifyListeners('consent_recorded', consent);
      
      return consent;

    } catch (error) {
      LoggingService.error('[PrivacyPolicyService] Failed to record consent', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Withdraw consent
   */
  async withdrawConsent(categories = null) {
    try {
      if (!this.userConsent) {
        throw new Error('No existing consent to withdraw');
      }
      
      const withdrawal = {
        originalConsentId: this.userConsent.consentId,
        withdrawnCategories: categories || Object.keys(this.userConsent.consents),
        timestamp: new Date().toISOString(),
        withdrawalId: this.generateConsentId(),
        method: 'app',
      };
      
      // Update consent
      if (categories) {
        // Partial withdrawal
        categories.forEach(category => {
          delete this.userConsent.consents[category];
        });
        this.userConsent.partialWithdrawals = this.userConsent.partialWithdrawals || [];
        this.userConsent.partialWithdrawals.push(withdrawal);
      } else {
        // Full withdrawal
        this.userConsent = null;
      }
      
      await this.saveUserConsent();
      
      // Update privacy settings
      await this.updatePrivacySettingsFromWithdrawal(withdrawal);
      
      // Update statistics
      this.stats.consentWithdrawn++;
      await this.savePrivacyStats();
      
      LoggingService.info('[PrivacyPolicyService] Consent withdrawn', {
        withdrawalId: withdrawal.withdrawalId,
        categories: withdrawal.withdrawnCategories,
        partial: !!categories,
      });
      
      // Notify listeners
      this.notifyListeners('consent_withdrawn', withdrawal);
      
      // Initiate data cleanup if necessary
      await this.initiateDataCleanup(withdrawal.withdrawnCategories);
      
      return withdrawal;

    } catch (error) {
      LoggingService.error('[PrivacyPolicyService] Failed to withdraw consent', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(settings) {
    try {
      this.privacySettings = {
        ...this.privacySettings,
        ...settings,
        lastUpdated: new Date().toISOString(),
      };
      
      await this.savePrivacySettings();
      
      // Update statistics
      this.stats.privacySettingsChanged++;
      await this.savePrivacyStats();
      
      LoggingService.info('[PrivacyPolicyService] Privacy settings updated', {
        settings: Object.keys(settings),
      });
      
      // Notify listeners
      this.notifyListeners('privacy_settings_updated', this.privacySettings);
      
      return this.privacySettings;

    } catch (error) {
      LoggingService.error('[PrivacyPolicyService] Failed to update privacy settings', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Check if user consent is required
   */
  requiresConsent() {
    if (!this.config.requireExplicitConsent) {
      return false;
    }
    
    // Check if user has valid consent
    if (!this.userConsent) {
      return true;
    }
    
    // Check if consent is for current policy version
    if (this.userConsent.version !== this.currentPolicyVersion) {
      return true;
    }
    
    // Check if consent has expired
    const consentAge = Date.now() - new Date(this.userConsent.timestamp).getTime();
    if (consentAge > this.config.dataRetentionPeriod) {
      return true;
    }
    
    return false;
  }

  /**
   * Check if user has consented to specific category
   */
  hasConsentFor(category) {
    if (!this.userConsent) {
      return false;
    }
    
    // Essential categories are always considered consented
    if (this.privacyCategories[category.toUpperCase()]?.required) {
      return true;
    }
    
    return !!this.userConsent.consents[category];
  }

  /**
   * Get user's data processing summary
   */
  async getDataProcessingSummary() {
    try {
      const summary = {
        consentStatus: this.getConsentStatus(),
        dataCategories: this.getDataCategoriesProcessed(),
        legalBasis: this.getLegalBasisForProcessing(),
        retentionPeriods: this.getRetentionPeriods(),
        dataSharing: this.getDataSharingInfo(),
        userRights: this.getUserRightsStatus(),
        lastUpdated: new Date().toISOString(),
      };
      
      return summary;

    } catch (error) {
      LoggingService.error('[PrivacyPolicyService] Failed to get data processing summary', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Exercise data subject right
   */
  async exerciseDataSubjectRight(rightType, details = {}) {
    try {
      const request = {
        id: this.generateRequestId(),
        type: rightType,
        details,
        timestamp: new Date().toISOString(),
        status: 'submitted',
        userId: await this.getUserId(),
      };
      
      // Store request
      await this.storeDataSubjectRequest(request);
      
      // Update statistics
      if (!this.stats.rightExercised[rightType]) {
        this.stats.rightExercised[rightType] = 0;
      }
      this.stats.rightExercised[rightType]++;
      this.stats.dataRequests++;
      await this.savePrivacyStats();
      
      LoggingService.info('[PrivacyPolicyService] Data subject right exercised', {
        requestId: request.id,
        rightType,
      });
      
      // Handle specific rights
      switch (rightType) {
        case this.dataSubjectRights.ACCESS:
          await this.handleDataAccessRequest(request);
          break;
          
        case this.dataSubjectRights.ERASURE:
          await this.handleDataErasureRequest(request);
          break;
          
        case this.dataSubjectRights.DATA_PORTABILITY:
          await this.handleDataPortabilityRequest(request);
          break;
          
        case this.dataSubjectRights.WITHDRAW_CONSENT:
          await this.withdrawConsent();
          break;
          
        default:
          // Other rights require manual processing
          break;
      }
      
      // Notify listeners
      this.notifyListeners('data_subject_right_exercised', request);
      
      return request;

    } catch (error) {
      LoggingService.error('[PrivacyPolicyService] Failed to exercise data subject right', {
        error: error.message,
        rightType,
      });
      throw error;
    }
  }

  /**
   * View privacy policy
   */
  async viewPrivacyPolicy() {
    try {
      // Update statistics
      this.stats.policyViewed++;
      await this.savePrivacyStats();
      
      // Open policy URL
      if (this.config.policyUrl) {
        const supported = await Linking.canOpenURL(this.config.policyUrl);
        if (supported) {
          await Linking.openURL(this.config.policyUrl);
        }
      }
      
      // Notify listeners
      this.notifyListeners('privacy_policy_viewed', {
        url: this.config.policyUrl,
        version: this.currentPolicyVersion,
      });
      
      return {
        url: this.config.policyUrl,
        version: this.currentPolicyVersion,
      };

    } catch (error) {
      LoggingService.error('[PrivacyPolicyService] Failed to view privacy policy', {
        error: error.message,
      });
      throw error;
    }
  }

  // Helper methods

  /**
   * Validate consent categories
   */
  validateConsentCategories(consents) {
    const validCategories = {};
    
    Object.entries(consents).forEach(([category, granted]) => {
      if (this.privacyCategories[category.toUpperCase()]) {
        validCategories[category] = !!granted;
      }
    });
    
    // Ensure essential categories are always included
    Object.values(this.privacyCategories).forEach(category => {
      if (category.required) {
        validCategories[category.id] = true;
      }
    });
    
    return validCategories;
  }

  /**
   * Update privacy settings from consent
   */
  async updatePrivacySettingsFromConsent(consent) {
    const settings = {};
    
    // Map consent to privacy settings
    settings.analyticsEnabled = consent.consents.analytics || false;
    settings.marketingEnabled = consent.consents.marketing || false;
    settings.locationEnabled = consent.consents.location || false;
    settings.functionalEnabled = consent.consents.functional !== false; // Default true
    
    await this.updatePrivacySettings(settings);
  }

  /**
   * Update privacy settings from withdrawal
   */
  async updatePrivacySettingsFromWithdrawal(withdrawal) {
    const settings = { ...this.privacySettings };
    
    withdrawal.withdrawnCategories.forEach(category => {
      switch (category) {
        case 'analytics':
          settings.analyticsEnabled = false;
          break;
        case 'marketing':
          settings.marketingEnabled = false;
          break;
        case 'location':
          settings.locationEnabled = false;
          break;
        case 'functional':
          settings.functionalEnabled = false;
          break;
      }
    });
    
    await this.updatePrivacySettings(settings);
  }

  /**
   * Initiate data cleanup
   */
  async initiateDataCleanup(categories) {
    try {
      LoggingService.info('[PrivacyPolicyService] Initiating data cleanup', {
        categories,
      });
      
      // This would integrate with data deletion services
      // For now, just log the request
      
      // Notify listeners
      this.notifyListeners('data_cleanup_initiated', { categories });

    } catch (error) {
      LoggingService.error('[PrivacyPolicyService] Data cleanup failed', {
        error: error.message,
        categories,
      });
    }
  }

  /**
   * Handle data access request
   */
  async handleDataAccessRequest(request) {
    try {
      LoggingService.info('[PrivacyPolicyService] Processing data access request', {
        requestId: request.id,
      });
      
      // This would generate a data export
      // For now, just update the request status
      request.status = 'processing';
      await this.updateDataSubjectRequest(request);

    } catch (error) {
      LoggingService.error('[PrivacyPolicyService] Data access request failed', {
        error: error.message,
        requestId: request.id,
      });
    }
  }

  /**
   * Handle data erasure request
   */
  async handleDataErasureRequest(request) {
    try {
      LoggingService.info('[PrivacyPolicyService] Processing data erasure request', {
        requestId: request.id,
      });
      
      // This would initiate data deletion
      // For now, just update the request status
      request.status = 'processing';
      await this.updateDataSubjectRequest(request);

    } catch (error) {
      LoggingService.error('[PrivacyPolicyService] Data erasure request failed', {
        error: error.message,
        requestId: request.id,
      });
    }
  }

  /**
   * Handle data portability request
   */
  async handleDataPortabilityRequest(request) {
    try {
      LoggingService.info('[PrivacyPolicyService] Processing data portability request', {
        requestId: request.id,
      });
      
      // This would generate a portable data export
      // For now, just update the request status
      request.status = 'processing';
      await this.updateDataSubjectRequest(request);

    } catch (error) {
      LoggingService.error('[PrivacyPolicyService] Data portability request failed', {
        error: error.message,
        requestId: request.id,
      });
    }
  }

  /**
   * Setup policy update check
   */
  setupPolicyUpdateCheck() {
    if (this.updateCheckTimer) {
      clearInterval(this.updateCheckTimer);
    }
    
    this.updateCheckTimer = setInterval(async () => {
      try {
        await this.checkForPolicyUpdates();
      } catch (error) {
        LoggingService.error('[PrivacyPolicyService] Policy update check failed', {
          error: error.message,
        });
      }
    }, this.config.updateCheckInterval);
  }

  /**
   * Check for policy updates
   */
  async checkForPolicyUpdates() {
    try {
      // This would check for policy updates from server
      // For now, just log that we're checking
      LoggingService.debug('[PrivacyPolicyService] Checking for policy updates');

    } catch (error) {
      LoggingService.error('[PrivacyPolicyService] Failed to check for policy updates', {
        error: error.message,
      });
    }
  }

  /**
   * Validate existing consent
   */
  async validateExistingConsent() {
    if (!this.userConsent) {
      return;
    }
    
    // Check if consent is still valid
    if (this.userConsent.version !== this.currentPolicyVersion) {
      LoggingService.info('[PrivacyPolicyService] Consent version mismatch, requiring new consent', {
        currentVersion: this.userConsent.version,
        requiredVersion: this.currentPolicyVersion,
      });
      
      // Invalidate existing consent
      this.userConsent = null;
      await this.saveUserConsent();
    }
  }

  // Data access methods

  /**
   * Get consent status
   */
  getConsentStatus() {
    return {
      hasConsent: !!this.userConsent,
      version: this.userConsent?.version || null,
      timestamp: this.userConsent?.timestamp || null,
      categories: this.userConsent?.consents || {},
      requiresUpdate: this.requiresConsent(),
    };
  }

  /**
   * Get data categories processed
   */
  getDataCategoriesProcessed() {
    const categories = [];
    
    if (this.userConsent) {
      Object.entries(this.userConsent.consents).forEach(([category, granted]) => {
        if (granted) {
          categories.push({
            category,
            ...this.privacyCategories[category.toUpperCase()],
          });
        }
      });
    }
    
    return categories;
  }

  /**
   * Get legal basis for processing
   */
  getLegalBasisForProcessing() {
    return {
      essential: this.legalBasisTypes.CONTRACT,
      functional: this.legalBasisTypes.CONSENT,
      analytics: this.legalBasisTypes.CONSENT,
      marketing: this.legalBasisTypes.CONSENT,
      location: this.legalBasisTypes.CONSENT,
    };
  }

  /**
   * Get retention periods
   */
  getRetentionPeriods() {
    const periods = {};
    
    Object.values(this.privacyCategories).forEach(category => {
      periods[category.id] = category.retention;
    });
    
    return periods;
  }

  /**
   * Get data sharing info
   */
  getDataSharingInfo() {
    return {
      thirdParties: [
        {
          name: 'Analytics Provider',
          purpose: 'Service analytics',
          dataTypes: ['Usage data', 'Performance data'],
          category: 'analytics',
        },
        {
          name: 'Push Notification Service',
          purpose: 'Notifications',
          dataTypes: ['Device tokens'],
          category: 'essential',
        },
      ],
      internationalTransfers: this.getInternationalTransfersInfo(),
    };
  }

  /**
   * Get user rights status
   */
  getUserRightsStatus() {
    return {
      available: Object.values(this.dataSubjectRights),
      exercised: this.stats.rightExercised,
      canWithdrawConsent: !!this.userConsent,
      canRequestData: true,
      canRequestDeletion: true,
    };
  }

  /**
   * Get policy information
   */
  getPolicyLastUpdated() {
    return '2024-01-01T00:00:00Z'; // This would come from server
  }

  getDataSubjectRightsInfo() {
    return [
      {
        right: this.dataSubjectRights.ACCESS,
        name: 'アクセス権',
        description: '個人データの処理に関する情報と、データのコピーを取得する権利',
      },
      {
        right: this.dataSubjectRights.RECTIFICATION,
        name: '訂正権',
        description: '不正確な個人データの訂正を求める権利',
      },
      {
        right: this.dataSubjectRights.ERASURE,
        name: '消去権（忘れられる権利）',
        description: '個人データの消去を求める権利',
      },
      {
        right: this.dataSubjectRights.DATA_PORTABILITY,
        name: 'データポータビリティ権',
        description: '構造化された形式でデータを受け取る権利',
      },
      {
        right: this.dataSubjectRights.OBJECT,
        name: '異議申立権',
        description: 'データ処理に異議を申し立てる権利',
      },
      {
        right: this.dataSubjectRights.WITHDRAW_CONSENT,
        name: '同意撤回権',
        description: 'いつでも同意を撤回する権利',
      },
    ];
  }

  getContactInfo() {
    return {
      email: 'privacy@nightlife-navigator.com',
      address: '東京都渋谷区...',
      phone: '+81-3-xxxx-xxxx',
      dpo: 'dpo@nightlife-navigator.com',
    };
  }

  getLegalBasisInfo() {
    return [
      {
        basis: this.legalBasisTypes.CONSENT,
        description: 'ユーザーの明示的な同意に基づく処理',
        categories: ['functional', 'analytics', 'marketing', 'location'],
      },
      {
        basis: this.legalBasisTypes.CONTRACT,
        description: 'サービス提供に必要な契約履行のための処理',
        categories: ['essential'],
      },
      {
        basis: this.legalBasisTypes.LEGITIMATE_INTERESTS,
        description: '正当な利益に基づく処理',
        categories: ['security', 'fraud_prevention'],
      },
    ];
  }

  getDataProcessingInfo() {
    return {
      purposes: [
        'アプリケーションの提供',
        'ユーザーサポート',
        'セキュリティ確保',
        'サービス改善',
        '法的義務の履行',
      ],
      dataTypes: [
        'アカウント情報',
        '利用履歴',
        'デバイス情報',
        '位置情報',
        'コミュニケーション記録',
      ],
      processingActivities: [
        'データ収集',
        'データ保存',
        'データ分析',
        'データ共有',
        'データ削除',
      ],
    };
  }

  getInternationalTransfersInfo() {
    return {
      transfers: [
        {
          destination: 'United States',
          safeguards: 'Standard Contractual Clauses',
          purpose: 'Cloud hosting and analytics',
        },
      ],
      adequacyDecisions: [],
      safeguards: [
        'Standard Contractual Clauses (SCCs)',
        'Binding Corporate Rules (BCRs)',
      ],
    };
  }

  getRetentionPolicyInfo() {
    return {
      defaultPeriod: '1年間',
      categories: this.getRetentionPeriods(),
      deletionProcess: 'Automated deletion after retention period',
      exceptions: [
        '法的義務による保存',
        '法的請求の対応',
        'セキュリティインシデントの調査',
      ],
    };
  }

  // Storage methods

  /**
   * Load privacy configuration
   */
  async loadPrivacyConfig() {
    try {
      const savedConfig = await LocalStorageService.getItem('privacy_policy_config');
      if (savedConfig) {
        this.config = { ...this.config, ...savedConfig };
      }
    } catch (error) {
      LoggingService.warn('[PrivacyPolicyService] Failed to load privacy config', {
        error: error.message,
      });
    }
  }

  /**
   * Load user consent
   */
  async loadUserConsent() {
    try {
      this.userConsent = await LocalStorageService.getItem('user_consent');
    } catch (error) {
      LoggingService.warn('[PrivacyPolicyService] Failed to load user consent', {
        error: error.message,
      });
    }
  }

  /**
   * Save user consent
   */
  async saveUserConsent() {
    try {
      await LocalStorageService.setItem('user_consent', this.userConsent);
    } catch (error) {
      LoggingService.error('[PrivacyPolicyService] Failed to save user consent', {
        error: error.message,
      });
    }
  }

  /**
   * Load privacy settings
   */
  async loadPrivacySettings() {
    try {
      this.privacySettings = await LocalStorageService.getItem('privacy_settings') || {
        analyticsEnabled: false,
        marketingEnabled: false,
        locationEnabled: false,
        functionalEnabled: true,
      };
    } catch (error) {
      LoggingService.warn('[PrivacyPolicyService] Failed to load privacy settings', {
        error: error.message,
      });
    }
  }

  /**
   * Save privacy settings
   */
  async savePrivacySettings() {
    try {
      await LocalStorageService.setItem('privacy_settings', this.privacySettings);
    } catch (error) {
      LoggingService.error('[PrivacyPolicyService] Failed to save privacy settings', {
        error: error.message,
      });
    }
  }

  /**
   * Save privacy statistics
   */
  async savePrivacyStats() {
    try {
      await LocalStorageService.setItem('privacy_policy_stats', this.stats);
    } catch (error) {
      LoggingService.warn('[PrivacyPolicyService] Failed to save privacy stats', {
        error: error.message,
      });
    }
  }

  /**
   * Store data subject request
   */
  async storeDataSubjectRequest(request) {
    try {
      const requests = await LocalStorageService.getItem('data_subject_requests') || [];
      requests.push(request);
      await LocalStorageService.setItem('data_subject_requests', requests);
    } catch (error) {
      LoggingService.error('[PrivacyPolicyService] Failed to store data subject request', {
        error: error.message,
      });
    }
  }

  /**
   * Update data subject request
   */
  async updateDataSubjectRequest(updatedRequest) {
    try {
      const requests = await LocalStorageService.getItem('data_subject_requests') || [];
      const index = requests.findIndex(r => r.id === updatedRequest.id);
      if (index >= 0) {
        requests[index] = updatedRequest;
        await LocalStorageService.setItem('data_subject_requests', requests);
      }
    } catch (error) {
      LoggingService.error('[PrivacyPolicyService] Failed to update data subject request', {
        error: error.message,
      });
    }
  }

  // Utility methods

  /**
   * Generate consent ID
   */
  generateConsentId() {
    return `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate request ID
   */
  generateRequestId() {
    return `request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get client IP (placeholder)
   */
  async getClientIP() {
    return '127.0.0.1'; // In production, this would be obtained from server
  }

  /**
   * Get user ID
   */
  async getUserId() {
    try {
      const userProfile = await LocalStorageService.getItem('user_profile');
      return userProfile?.id || 'anonymous';
    } catch (error) {
      return 'anonymous';
    }
  }

  /**
   * Get current privacy settings
   */
  getCurrentPrivacySettings() {
    return this.privacySettings;
  }

  /**
   * Get privacy statistics
   */
  getPrivacyStatistics() {
    return {
      ...this.stats,
      initialized: this.initialized,
      hasConsent: !!this.userConsent,
      requiresConsent: this.requiresConsent(),
    };
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
        LoggingService.error('[PrivacyPolicyService] Listener error', {
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
    if (this.updateCheckTimer) {
      clearInterval(this.updateCheckTimer);
      this.updateCheckTimer = null;
    }
    
    this.listeners.clear();
    this.initialized = false;
  }
}

// Create singleton instance
const privacyPolicyService = new PrivacyPolicyService();

export default privacyPolicyService;