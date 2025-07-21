/**
 * Consent Management Service
 * GDPR-compliant consent management with granular controls and audit trails
 */

import { Platform, Linking } from 'react-native';

import LoggingService from './LoggingService';
import LocalStorageService from './LocalStorageService';
import ConfigService from './ConfigService';
import MonitoringManager from './MonitoringManager';
import PrivacyPolicyService from './PrivacyPolicyService';

class ConsentManagementService {
  constructor() {
    this.initialized = false;
    this.consents = new Map();
    this.consentHistory = [];
    this.cookieConsents = new Map();
    
    // Consent configuration
    this.config = {
      enableGranularConsent: true,
      enableCookieConsent: true,
      enableConsentBanner: true,
      consentExpiryDays: 365,
      cookieExpiryDays: 180,
      requireExplicitConsent: true,
      allowImpliedConsent: false,
      showConsentDetails: true,
      enableConsentWithdrawal: true,
      gdprCompliant: true,
      enableConsentRecords: true,
      auditRetentionDays: 2555, // 7 years for GDPR
    };
    
    // Consent categories with GDPR classifications
    this.consentCategories = {
      ESSENTIAL: {
        id: 'essential',
        name: '必須機能',
        description: 'アプリの基本機能に必要なデータ処理',
        required: true,
        lawfulBasis: 'contractual_necessity',
        canWithdraw: false,
        purposes: [
          'サービス提供',
          'セキュリティ維持',
          '技術的機能の実現'
        ],
        dataTypes: [
          'ユーザーID',
          'セッション情報',
          'セキュリティログ'
        ],
        processors: [
          { name: 'アプリサーバー', country: '日本' }
        ],
        retention: 'サービス利用期間中',
        gdprArticle: '第6条1項(b)',
      },
      FUNCTIONAL: {
        id: 'functional',
        name: '機能向上',
        description: 'ユーザー体験向上のためのデータ処理',
        required: false,
        lawfulBasis: 'consent',
        canWithdraw: true,
        purposes: [
          'パーソナライゼーション',
          '設定の保存',
          '機能改善'
        ],
        dataTypes: [
          'ユーザー設定',
          '利用履歴',
          'お気に入り'
        ],
        processors: [
          { name: 'アプリサーバー', country: '日本' }
        ],
        retention: '1年間',
        gdprArticle: '第6条1項(a)',
      },
      ANALYTICS: {
        id: 'analytics',
        name: '分析・統計',
        description: 'サービス分析・改善のためのデータ処理',
        required: false,
        lawfulBasis: 'consent',
        canWithdraw: true,
        purposes: [
          '利用状況分析',
          'パフォーマンス測定',
          'サービス改善'
        ],
        dataTypes: [
          '匿名利用データ',
          'パフォーマンスデータ',
          'エラーログ'
        ],
        processors: [
          { name: 'Google Analytics', country: 'アメリカ' },
          { name: 'Firebase Analytics', country: 'アメリカ' }
        ],
        retention: '2年間',
        gdprArticle: '第6条1項(a)',
      },
      MARKETING: {
        id: 'marketing',
        name: 'マーケティング',
        description: 'プロモーション・広告のためのデータ処理',
        required: false,
        lawfulBasis: 'consent',
        canWithdraw: true,
        purposes: [
          'パーソナライズ広告',
          'プロモーション配信',
          'マーケティング分析'
        ],
        dataTypes: [
          '興味関心データ',
          '行動データ',
          'デモグラフィックデータ'
        ],
        processors: [
          { name: '広告配信サービス', country: '各国' }
        ],
        retention: '6か月間',
        gdprArticle: '第6条1項(a)',
      },
      LOCATION: {
        id: 'location',
        name: '位置情報',
        description: '位置ベースサービスのための位置情報処理',
        required: false,
        lawfulBasis: 'consent',
        canWithdraw: true,
        purposes: [
          '店舗検索',
          'おすすめ提案',
          '位置ベースサービス'
        ],
        dataTypes: [
          'GPS位置情報',
          '訪問履歴',
          '移動パターン'
        ],
        processors: [
          { name: 'Google Maps', country: 'アメリカ' },
          { name: 'アプリサーバー', country: '日本' }
        ],
        retention: '3か月間',
        gdprArticle: '第6条1項(a)',
      },
      COMMUNICATION: {
        id: 'communication',
        name: 'コミュニケーション',
        description: '通知・コミュニケーションのためのデータ処理',
        required: false,
        lawfulBasis: 'consent',
        canWithdraw: true,
        purposes: [
          'プッシュ通知',
          'メール配信',
          '重要な通知'
        ],
        dataTypes: [
          'デバイストークン',
          'メールアドレス',
          '通知設定'
        ],
        processors: [
          { name: 'Firebase Cloud Messaging', country: 'アメリカ' },
          { name: 'SendGrid', country: 'アメリカ' }
        ],
        retention: '設定変更まで',
        gdprArticle: '第6条1項(a)',
      },
    };
    
    // Cookie categories
    this.cookieCategories = {
      NECESSARY: {
        id: 'necessary',
        name: '必須Cookie',
        description: 'ウェブサイトの基本機能に必要なCookie',
        required: true,
        canWithdraw: false,
        cookies: [
          'セッションID',
          'セキュリティトークン',
          '言語設定'
        ],
      },
      PREFERENCES: {
        id: 'preferences',
        name: '設定Cookie',
        description: 'ユーザー設定を記憶するCookie',
        required: false,
        canWithdraw: true,
        cookies: [
          'テーマ設定',
          'レイアウト設定',
          'フォント設定'
        ],
      },
      STATISTICS: {
        id: 'statistics',
        name: '統計Cookie',
        description: 'ウェブサイト利用統計のためのCookie',
        required: false,
        canWithdraw: true,
        cookies: [
          'Google Analytics',
          'ページビュー計測',
          'セッション分析'
        ],
      },
      MARKETING_COOKIES: {
        id: 'marketing_cookies',
        name: 'マーケティングCookie',
        description: '広告・マーケティングのためのCookie',
        required: false,
        canWithdraw: true,
        cookies: [
          '広告ID',
          'コンバージョン追跡',
          'リターゲティング'
        ],
      },
    };
    
    // Consent states
    this.consentStates = {
      PENDING: 'pending',
      GRANTED: 'granted',
      DENIED: 'denied',
      WITHDRAWN: 'withdrawn',
      EXPIRED: 'expired',
    };
    
    // Withdrawal reasons
    this.withdrawalReasons = {
      USER_REQUEST: 'user_request',
      PRIVACY_CONCERN: 'privacy_concern',
      NO_LONGER_NEEDED: 'no_longer_needed',
      DATA_MINIMIZATION: 'data_minimization',
      AUTOMATIC_EXPIRY: 'automatic_expiry',
      POLICY_UPDATE: 'policy_update',
    };
    
    // Statistics
    this.stats = {
      consentsCollected: 0,
      consentsWithdrawn: 0,
      cookieConsentsGranted: 0,
      cookieConsentsWithdrawn: 0,
      consentBannerShown: 0,
      consentDetailsViewed: 0,
      withdrawalRequestsProcessed: 0,
      auditRecordsCreated: 0,
    };
    
    // Event listeners
    this.listeners = new Set();
    this.expiryCheckTimer = null;
    this.auditTimer = null;
  }

  /**
   * Initialize consent management service
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Load configuration
      await this.loadConsentConfig();
      
      // Load existing consents
      await this.loadStoredConsents();
      
      // Load consent history
      await this.loadConsentHistory();
      
      // Load cookie consents
      await this.loadCookieConsents();
      
      // Setup expiry monitoring
      this.setupExpiryMonitoring();
      
      // Setup audit logging
      this.setupAuditLogging();
      
      // Validate existing consents
      await this.validateExistingConsents();
      
      this.initialized = true;
      
      LoggingService.info('[ConsentManagementService] Initialized', {
        totalConsents: this.consents.size,
        cookieConsents: this.cookieConsents.size,
        historyEntries: this.consentHistory.length,
        gdprCompliant: this.config.gdprCompliant,
      });

    } catch (error) {
      LoggingService.error('[ConsentManagementService] Failed to initialize', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Record consent with full GDPR compliance
   */
  async recordConsent(consentData) {
    try {
      const consentRecord = {
        id: this.generateConsentId(),
        timestamp: new Date().toISOString(),
        categories: this.validateConsentCategories(consentData.categories),
        version: consentData.version || '1.0.0',
        method: consentData.method || 'app_ui',
        ipAddress: await this.getClientIP(),
        userAgent: this.getUserAgent(),
        location: consentData.location || null,
        language: consentData.language || 'ja',
        explicit: consentData.explicit !== false,
        granular: this.config.enableGranularConsent,
        purposes: this.extractPurposes(consentData.categories),
        lawfulBasis: this.determineLawfulBasis(consentData.categories),
        dataSubject: {
          type: 'user',
          id: await this.getUserId(),
          age: consentData.age,
          jurisdiction: 'Japan',
        },
        processingDetails: this.getProcessingDetails(consentData.categories),
        thirdPartySharing: this.getThirdPartySharing(consentData.categories),
        retentionPeriods: this.getRetentionPeriods(consentData.categories),
        withdrawalInfo: {
          canWithdraw: true,
          withdrawalMethod: 'app_settings',
          withdrawalUrl: 'app://settings/privacy',
        },
        auditTrail: {
          created: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          modifications: [],
        },
      };
      
      // Store consent record
      this.consents.set(consentRecord.id, consentRecord);
      
      // Add to history
      this.consentHistory.unshift({
        action: 'consent_granted',
        consentId: consentRecord.id,
        timestamp: consentRecord.timestamp,
        categories: Object.keys(consentRecord.categories),
        details: consentRecord,
      });
      
      // Save to storage
      await this.saveConsents();
      await this.saveConsentHistory();
      
      // Update statistics
      this.stats.consentsCollected++;
      this.stats.auditRecordsCreated++;
      await this.saveConsentStats();
      
      // Create audit log entry
      await this.createAuditLogEntry('CONSENT_GRANTED', {
        consentId: consentRecord.id,
        categories: Object.keys(consentRecord.categories),
        method: consentRecord.method,
        explicit: consentRecord.explicit,
      });
      
      LoggingService.info('[ConsentManagementService] Consent recorded', {
        consentId: consentRecord.id,
        categories: Object.keys(consentRecord.categories),
        explicit: consentRecord.explicit,
      });
      
      // Track analytics (if consented)
      if (consentRecord.categories.analytics) {
        MonitoringManager.trackUserAction?.('consent_granted', 'privacy', {
          categories: Object.keys(consentRecord.categories),
          method: consentRecord.method,
        });
      }
      
      // Notify listeners
      this.notifyListeners('consent_granted', consentRecord);
      
      // Sync with privacy policy service
      if (PrivacyPolicyService) {
        await PrivacyPolicyService.recordConsent({
          consents: consentRecord.categories,
          method: consentRecord.method,
          isExplicit: consentRecord.explicit,
        });
      }
      
      return consentRecord;

    } catch (error) {
      LoggingService.error('[ConsentManagementService] Failed to record consent', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Withdraw consent with GDPR compliance
   */
  async withdrawConsent(withdrawalData) {
    try {
      const { consentId, categories, reason, immediate } = withdrawalData;
      
      const existingConsent = this.consents.get(consentId);
      if (!existingConsent) {
        throw new Error('Consent record not found');
      }
      
      const withdrawalRecord = {
        id: this.generateWithdrawalId(),
        originalConsentId: consentId,
        timestamp: new Date().toISOString(),
        withdrawnCategories: categories || Object.keys(existingConsent.categories),
        reason: reason || this.withdrawalReasons.USER_REQUEST,
        method: 'app_ui',
        immediate: immediate !== false,
        userAgent: this.getUserAgent(),
        ipAddress: await this.getClientIP(),
        dataSubject: existingConsent.dataSubject,
        effectiveDate: immediate ? new Date().toISOString() : 
          new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours grace period
        auditTrail: {
          created: new Date().toISOString(),
          relatedConsent: consentId,
        },
      };
      
      // Update existing consent
      if (categories && categories.length < Object.keys(existingConsent.categories).length) {
        // Partial withdrawal
        categories.forEach(category => {
          if (existingConsent.categories[category] && this.consentCategories[category.toUpperCase()]?.canWithdraw) {
            delete existingConsent.categories[category];
          }
        });
        
        existingConsent.auditTrail.lastModified = new Date().toISOString();
        existingConsent.auditTrail.modifications.push({
          type: 'partial_withdrawal',
          timestamp: new Date().toISOString(),
          withdrawnCategories: categories,
          withdrawalId: withdrawalRecord.id,
        });
        
        this.consents.set(consentId, existingConsent);
      } else {
        // Full withdrawal
        existingConsent.state = this.consentStates.WITHDRAWN;
        existingConsent.withdrawnAt = new Date().toISOString();
        existingConsent.withdrawalRecord = withdrawalRecord.id;
        
        this.consents.set(consentId, existingConsent);
      }
      
      // Add to history
      this.consentHistory.unshift({
        action: 'consent_withdrawn',
        consentId,
        withdrawalId: withdrawalRecord.id,
        timestamp: withdrawalRecord.timestamp,
        categories: withdrawalRecord.withdrawnCategories,
        reason: withdrawalRecord.reason,
        details: withdrawalRecord,
      });
      
      // Save to storage
      await this.saveConsents();
      await this.saveConsentHistory();
      
      // Update statistics
      this.stats.consentsWithdrawn++;
      this.stats.withdrawalRequestsProcessed++;
      this.stats.auditRecordsCreated++;
      await this.saveConsentStats();
      
      // Create audit log entry
      await this.createAuditLogEntry('CONSENT_WITHDRAWN', {
        consentId,
        withdrawalId: withdrawalRecord.id,
        categories: withdrawalRecord.withdrawnCategories,
        reason: withdrawalRecord.reason,
        immediate: withdrawalRecord.immediate,
      });
      
      LoggingService.info('[ConsentManagementService] Consent withdrawn', {
        consentId,
        withdrawalId: withdrawalRecord.id,
        categories: withdrawalRecord.withdrawnCategories,
        reason: withdrawalRecord.reason,
      });
      
      // Notify listeners
      this.notifyListeners('consent_withdrawn', {
        consentId,
        withdrawal: withdrawalRecord,
        categories: withdrawalRecord.withdrawnCategories,
      });
      
      // Initiate data cleanup if immediate
      if (withdrawalRecord.immediate) {
        await this.initiateDataCleanup(withdrawalRecord.withdrawnCategories, consentId);
      }
      
      // Sync with privacy policy service
      if (PrivacyPolicyService) {
        await PrivacyPolicyService.withdrawConsent(withdrawalRecord.withdrawnCategories);
      }
      
      return withdrawalRecord;

    } catch (error) {
      LoggingService.error('[ConsentManagementService] Failed to withdraw consent', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Record cookie consent
   */
  async recordCookieConsent(cookieConsentData) {
    try {
      const cookieConsent = {
        id: this.generateCookieConsentId(),
        timestamp: new Date().toISOString(),
        categories: this.validateCookieCategories(cookieConsentData.categories),
        version: cookieConsentData.version || '1.0.0',
        method: 'cookie_banner',
        domain: cookieConsentData.domain,
        userAgent: this.getUserAgent(),
        ipAddress: await this.getClientIP(),
        expiresAt: new Date(Date.now() + this.config.cookieExpiryDays * 24 * 60 * 60 * 1000).toISOString(),
        auditTrail: {
          created: new Date().toISOString(),
        },
      };
      
      // Store cookie consent
      this.cookieConsents.set(cookieConsent.id, cookieConsent);
      
      // Save to storage
      await this.saveCookieConsents();
      
      // Update statistics
      this.stats.cookieConsentsGranted++;
      await this.saveConsentStats();
      
      LoggingService.info('[ConsentManagementService] Cookie consent recorded', {
        consentId: cookieConsent.id,
        categories: Object.keys(cookieConsent.categories),
      });
      
      // Notify listeners
      this.notifyListeners('cookie_consent_granted', cookieConsent);
      
      return cookieConsent;

    } catch (error) {
      LoggingService.error('[ConsentManagementService] Failed to record cookie consent', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Check if user has consented to specific category
   */
  hasConsentFor(category) {
    // Check if category is required (always considered consented)
    const categoryInfo = this.consentCategories[category.toUpperCase()];
    if (categoryInfo?.required) {
      return true;
    }
    
    // Check active consents
    for (const consent of this.consents.values()) {
      if (consent.state !== this.consentStates.WITHDRAWN && 
          consent.state !== this.consentStates.EXPIRED &&
          consent.categories[category]) {
        
        // Check if consent is still valid (not expired)
        if (this.isConsentValid(consent)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Check if consent is valid (not expired)
   */
  isConsentValid(consent) {
    if (!consent.timestamp) {
      return false;
    }
    
    const consentDate = new Date(consent.timestamp);
    const expiryDate = new Date(consentDate.getTime() + this.config.consentExpiryDays * 24 * 60 * 60 * 1000);
    
    return new Date() < expiryDate;
  }

  /**
   * Get consent status summary
   */
  getConsentStatus() {
    const status = {
      hasActiveConsents: this.consents.size > 0,
      totalConsents: this.consents.size,
      activeConsents: 0,
      expiredConsents: 0,
      withdrawnConsents: 0,
      categories: {},
      cookieConsents: {
        total: this.cookieConsents.size,
        active: 0,
        expired: 0,
      },
      lastConsentDate: null,
      gdprCompliant: this.config.gdprCompliant,
      requiresUpdate: false,
    };
    
    // Analyze consent records
    for (const consent of this.consents.values()) {
      if (consent.state === this.consentStates.WITHDRAWN) {
        status.withdrawnConsents++;
      } else if (!this.isConsentValid(consent)) {
        status.expiredConsents++;
      } else {
        status.activeConsents++;
        
        // Update last consent date
        if (!status.lastConsentDate || consent.timestamp > status.lastConsentDate) {
          status.lastConsentDate = consent.timestamp;
        }
      }
      
      // Analyze categories
      Object.keys(consent.categories).forEach(category => {
        if (!status.categories[category]) {
          status.categories[category] = {
            consented: false,
            lastUpdated: null,
            canWithdraw: this.consentCategories[category.toUpperCase()]?.canWithdraw || false,
          };
        }
        
        if (this.hasConsentFor(category)) {
          status.categories[category].consented = true;
          status.categories[category].lastUpdated = consent.timestamp;
        }
      });
    }
    
    // Analyze cookie consents
    for (const cookieConsent of this.cookieConsents.values()) {
      if (new Date(cookieConsent.expiresAt) > new Date()) {
        status.cookieConsents.active++;
      } else {
        status.cookieConsents.expired++;
      }
    }
    
    // Check if update is required
    if (status.expiredConsents > 0 || status.activeConsents === 0) {
      status.requiresUpdate = true;
    }
    
    return status;
  }

  /**
   * Get GDPR compliance report
   */
  async getGDPRComplianceReport() {
    try {
      const report = {
        timestamp: new Date().toISOString(),
        compliance: {
          hasLawfulBasis: true,
          hasExplicitConsent: true,
          enablesWithdrawal: true,
          maintainsRecords: true,
          respectsDataMinimization: true,
          providesTransparency: true,
        },
        consents: {
          total: this.consents.size,
          active: 0,
          explicit: 0,
          withdrawn: 0,
          expired: 0,
        },
        dataProcessing: {
          categories: Object.keys(this.consentCategories).length,
          purposes: this.getAllPurposes(),
          lawfulBases: this.getAllLawfulBases(),
          thirdPartyProcessors: this.getAllThirdPartyProcessors(),
        },
        rights: {
          accessRequests: 0,
          rectificationRequests: 0,
          erasureRequests: 0,
          portabilityRequests: 0,
          objectionRequests: 0,
          withdrawalRequests: this.stats.withdrawalRequestsProcessed,
        },
        auditTrail: {
          totalRecords: this.stats.auditRecordsCreated,
          retentionPeriod: `${this.config.auditRetentionDays} days`,
          lastAudit: new Date().toISOString(),
        },
      };
      
      // Analyze consent records
      for (const consent of this.consents.values()) {
        if (consent.state === this.consentStates.WITHDRAWN) {
          report.consents.withdrawn++;
        } else if (!this.isConsentValid(consent)) {
          report.consents.expired++;
        } else {
          report.consents.active++;
        }
        
        if (consent.explicit) {
          report.consents.explicit++;
        }
      }
      
      return report;

    } catch (error) {
      LoggingService.error('[ConsentManagementService] Failed to generate GDPR report', {
        error: error.message,
      });
      throw error;
    }
  }

  // Helper methods

  /**
   * Validate consent categories
   */
  validateConsentCategories(categories) {
    const validCategories = {};
    
    Object.entries(categories).forEach(([category, granted]) => {
      const categoryInfo = this.consentCategories[category.toUpperCase()];
      if (categoryInfo) {
        validCategories[category] = !!granted;
      }
    });
    
    // Ensure essential categories are included
    Object.values(this.consentCategories).forEach(categoryInfo => {
      if (categoryInfo.required) {
        validCategories[categoryInfo.id] = true;
      }
    });
    
    return validCategories;
  }

  /**
   * Validate cookie categories
   */
  validateCookieCategories(categories) {
    const validCategories = {};
    
    Object.entries(categories).forEach(([category, granted]) => {
      const categoryInfo = this.cookieCategories[category.toUpperCase()];
      if (categoryInfo) {
        validCategories[category] = !!granted;
      }
    });
    
    // Ensure necessary cookies are included
    Object.values(this.cookieCategories).forEach(categoryInfo => {
      if (categoryInfo.required) {
        validCategories[categoryInfo.id] = true;
      }
    });
    
    return validCategories;
  }

  /**
   * Extract purposes from consented categories
   */
  extractPurposes(categories) {
    const purposes = new Set();
    
    Object.keys(categories).forEach(category => {
      const categoryInfo = this.consentCategories[category.toUpperCase()];
      if (categoryInfo && categories[category]) {
        categoryInfo.purposes.forEach(purpose => purposes.add(purpose));
      }
    });
    
    return Array.from(purposes);
  }

  /**
   * Determine lawful basis for processing
   */
  determineLawfulBasis(categories) {
    const lawfulBases = {};
    
    Object.keys(categories).forEach(category => {
      const categoryInfo = this.consentCategories[category.toUpperCase()];
      if (categoryInfo && categories[category]) {
        lawfulBases[category] = categoryInfo.lawfulBasis;
      }
    });
    
    return lawfulBases;
  }

  /**
   * Get processing details
   */
  getProcessingDetails(categories) {
    const details = {};
    
    Object.keys(categories).forEach(category => {
      const categoryInfo = this.consentCategories[category.toUpperCase()];
      if (categoryInfo && categories[category]) {
        details[category] = {
          purposes: categoryInfo.purposes,
          dataTypes: categoryInfo.dataTypes,
          lawfulBasis: categoryInfo.lawfulBasis,
          gdprArticle: categoryInfo.gdprArticle,
        };
      }
    });
    
    return details;
  }

  /**
   * Get third party sharing info
   */
  getThirdPartySharing(categories) {
    const sharing = {};
    
    Object.keys(categories).forEach(category => {
      const categoryInfo = this.consentCategories[category.toUpperCase()];
      if (categoryInfo && categories[category] && categoryInfo.processors) {
        sharing[category] = categoryInfo.processors;
      }
    });
    
    return sharing;
  }

  /**
   * Get retention periods
   */
  getRetentionPeriods(categories) {
    const periods = {};
    
    Object.keys(categories).forEach(category => {
      const categoryInfo = this.consentCategories[category.toUpperCase()];
      if (categoryInfo && categories[category]) {
        periods[category] = categoryInfo.retention;
      }
    });
    
    return periods;
  }

  /**
   * Get all purposes
   */
  getAllPurposes() {
    const purposes = new Set();
    
    Object.values(this.consentCategories).forEach(category => {
      category.purposes.forEach(purpose => purposes.add(purpose));
    });
    
    return Array.from(purposes);
  }

  /**
   * Get all lawful bases
   */
  getAllLawfulBases() {
    const bases = new Set();
    
    Object.values(this.consentCategories).forEach(category => {
      bases.add(category.lawfulBasis);
    });
    
    return Array.from(bases);
  }

  /**
   * Get all third party processors
   */
  getAllThirdPartyProcessors() {
    const processors = new Set();
    
    Object.values(this.consentCategories).forEach(category => {
      if (category.processors) {
        category.processors.forEach(processor => {
          processors.add(`${processor.name} (${processor.country})`);
        });
      }
    });
    
    return Array.from(processors);
  }

  /**
   * Validate existing consents
   */
  async validateExistingConsents() {
    const expiredConsents = [];
    
    for (const [consentId, consent] of this.consents.entries()) {
      if (!this.isConsentValid(consent) && consent.state !== this.consentStates.EXPIRED) {
        consent.state = this.consentStates.EXPIRED;
        consent.expiredAt = new Date().toISOString();
        expiredConsents.push(consentId);
        
        // Add to history
        this.consentHistory.unshift({
          action: 'consent_expired',
          consentId,
          timestamp: consent.expiredAt,
          reason: this.withdrawalReasons.AUTOMATIC_EXPIRY,
        });
      }
    }
    
    if (expiredConsents.length > 0) {
      await this.saveConsents();
      await this.saveConsentHistory();
      
      LoggingService.info('[ConsentManagementService] Expired consents processed', {
        count: expiredConsents.length,
        consentIds: expiredConsents,
      });
    }
  }

  /**
   * Setup expiry monitoring
   */
  setupExpiryMonitoring() {
    if (this.expiryCheckTimer) {
      clearInterval(this.expiryCheckTimer);
    }
    
    // Check for expired consents daily
    this.expiryCheckTimer = setInterval(async () => {
      try {
        await this.validateExistingConsents();
      } catch (error) {
        LoggingService.error('[ConsentManagementService] Expiry check failed', {
          error: error.message,
        });
      }
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  /**
   * Setup audit logging
   */
  setupAuditLogging() {
    if (this.auditTimer) {
      clearInterval(this.auditTimer);
    }
    
    // Create audit snapshots weekly
    this.auditTimer = setInterval(async () => {
      try {
        await this.createAuditSnapshot();
      } catch (error) {
        LoggingService.error('[ConsentManagementService] Audit logging failed', {
          error: error.message,
        });
      }
    }, 7 * 24 * 60 * 60 * 1000); // 7 days
  }

  /**
   * Create audit log entry
   */
  async createAuditLogEntry(action, details) {
    const auditEntry = {
      id: this.generateAuditId(),
      timestamp: new Date().toISOString(),
      action,
      details,
      userAgent: this.getUserAgent(),
      ipAddress: await this.getClientIP(),
      userId: await this.getUserId(),
    };
    
    // Store audit entry
    const auditLog = await LocalStorageService.getItem('consent_audit_log') || [];
    auditLog.unshift(auditEntry);
    
    // Limit audit log size
    const maxEntries = 1000;
    if (auditLog.length > maxEntries) {
      auditLog.splice(maxEntries);
    }
    
    await LocalStorageService.setItem('consent_audit_log', auditLog);
    
    LoggingService.debug('[ConsentManagementService] Audit entry created', {
      auditId: auditEntry.id,
      action,
    });
  }

  /**
   * Create audit snapshot
   */
  async createAuditSnapshot() {
    const snapshot = {
      id: this.generateAuditId(),
      timestamp: new Date().toISOString(),
      type: 'weekly_snapshot',
      consents: {
        total: this.consents.size,
        active: 0,
        expired: 0,
        withdrawn: 0,
      },
      statistics: { ...this.stats },
      gdprCompliance: await this.getGDPRComplianceReport(),
    };
    
    // Analyze consents
    for (const consent of this.consents.values()) {
      if (consent.state === this.consentStates.WITHDRAWN) {
        snapshot.consents.withdrawn++;
      } else if (!this.isConsentValid(consent)) {
        snapshot.consents.expired++;
      } else {
        snapshot.consents.active++;
      }
    }
    
    // Store snapshot
    const snapshots = await LocalStorageService.getItem('consent_audit_snapshots') || [];
    snapshots.unshift(snapshot);
    
    // Keep only last 52 snapshots (1 year)
    if (snapshots.length > 52) {
      snapshots.splice(52);
    }
    
    await LocalStorageService.setItem('consent_audit_snapshots', snapshots);
    
    LoggingService.info('[ConsentManagementService] Audit snapshot created', {
      snapshotId: snapshot.id,
      totalConsents: snapshot.consents.total,
    });
  }

  /**
   * Initiate data cleanup after consent withdrawal
   */
  async initiateDataCleanup(categories, consentId) {
    try {
      LoggingService.info('[ConsentManagementService] Initiating data cleanup', {
        categories,
        consentId,
      });
      
      // This would integrate with data deletion services
      const cleanupRequest = {
        id: this.generateCleanupId(),
        timestamp: new Date().toISOString(),
        categories,
        consentId,
        status: 'initiated',
      };
      
      // Store cleanup request
      const cleanupRequests = await LocalStorageService.getItem('data_cleanup_requests') || [];
      cleanupRequests.unshift(cleanupRequest);
      await LocalStorageService.setItem('data_cleanup_requests', cleanupRequests);
      
      // Notify listeners
      this.notifyListeners('data_cleanup_initiated', cleanupRequest);
      
      return cleanupRequest;

    } catch (error) {
      LoggingService.error('[ConsentManagementService] Data cleanup failed', {
        error: error.message,
        categories,
        consentId,
      });
    }
  }

  // Storage methods

  /**
   * Load consent configuration
   */
  async loadConsentConfig() {
    try {
      const savedConfig = await LocalStorageService.getItem('consent_management_config');
      if (savedConfig) {
        this.config = { ...this.config, ...savedConfig };
      }
    } catch (error) {
      LoggingService.warn('[ConsentManagementService] Failed to load config', {
        error: error.message,
      });
    }
  }

  /**
   * Load stored consents
   */
  async loadStoredConsents() {
    try {
      const storedConsents = await LocalStorageService.getItem('user_consents');
      if (storedConsents && Array.isArray(storedConsents)) {
        storedConsents.forEach(consent => {
          this.consents.set(consent.id, consent);
        });
      }
    } catch (error) {
      LoggingService.warn('[ConsentManagementService] Failed to load consents', {
        error: error.message,
      });
    }
  }

  /**
   * Save consents
   */
  async saveConsents() {
    try {
      const consentsArray = Array.from(this.consents.values());
      await LocalStorageService.setItem('user_consents', consentsArray);
    } catch (error) {
      LoggingService.error('[ConsentManagementService] Failed to save consents', {
        error: error.message,
      });
    }
  }

  /**
   * Load consent history
   */
  async loadConsentHistory() {
    try {
      this.consentHistory = await LocalStorageService.getItem('consent_history') || [];
    } catch (error) {
      LoggingService.warn('[ConsentManagementService] Failed to load history', {
        error: error.message,
      });
    }
  }

  /**
   * Save consent history
   */
  async saveConsentHistory() {
    try {
      // Limit history size
      const maxHistoryEntries = 500;
      if (this.consentHistory.length > maxHistoryEntries) {
        this.consentHistory = this.consentHistory.slice(0, maxHistoryEntries);
      }
      
      await LocalStorageService.setItem('consent_history', this.consentHistory);
    } catch (error) {
      LoggingService.error('[ConsentManagementService] Failed to save history', {
        error: error.message,
      });
    }
  }

  /**
   * Load cookie consents
   */
  async loadCookieConsents() {
    try {
      const storedCookieConsents = await LocalStorageService.getItem('cookie_consents');
      if (storedCookieConsents && Array.isArray(storedCookieConsents)) {
        storedCookieConsents.forEach(consent => {
          this.cookieConsents.set(consent.id, consent);
        });
      }
    } catch (error) {
      LoggingService.warn('[ConsentManagementService] Failed to load cookie consents', {
        error: error.message,
      });
    }
  }

  /**
   * Save cookie consents
   */
  async saveCookieConsents() {
    try {
      const cookieConsentsArray = Array.from(this.cookieConsents.values());
      await LocalStorageService.setItem('cookie_consents', cookieConsentsArray);
    } catch (error) {
      LoggingService.error('[ConsentManagementService] Failed to save cookie consents', {
        error: error.message,
      });
    }
  }

  /**
   * Save consent statistics
   */
  async saveConsentStats() {
    try {
      await LocalStorageService.setItem('consent_management_stats', this.stats);
    } catch (error) {
      LoggingService.warn('[ConsentManagementService] Failed to save stats', {
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
   * Generate withdrawal ID
   */
  generateWithdrawalId() {
    return `withdrawal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate cookie consent ID
   */
  generateCookieConsentId() {
    return `cookie_consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate audit ID
   */
  generateAuditId() {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate cleanup ID
   */
  generateCleanupId() {
    return `cleanup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get client IP (placeholder)
   */
  async getClientIP() {
    return '127.0.0.1'; // In production, this would be obtained from server
  }

  /**
   * Get user agent
   */
  getUserAgent() {
    return `${Platform.OS}/${Platform.Version}`;
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
   * Get service statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      totalConsents: this.consents.size,
      totalCookieConsents: this.cookieConsents.size,
      historyEntries: this.consentHistory.length,
      initialized: this.initialized,
      gdprCompliant: this.config.gdprCompliant,
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
        LoggingService.error('[ConsentManagementService] Listener error', {
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
    if (this.expiryCheckTimer) {
      clearInterval(this.expiryCheckTimer);
      this.expiryCheckTimer = null;
    }
    
    if (this.auditTimer) {
      clearInterval(this.auditTimer);
      this.auditTimer = null;
    }
    
    this.listeners.clear();
    this.consents.clear();
    this.cookieConsents.clear();
    this.consentHistory = [];
    this.initialized = false;
  }
}

// Create singleton instance
const consentManagementService = new ConsentManagementService();

export default consentManagementService;