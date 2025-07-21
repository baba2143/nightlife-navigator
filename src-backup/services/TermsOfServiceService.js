/**
 * Terms of Service Service
 * Manages terms of service, user acceptance tracking, and legal compliance
 */

import { Platform, Linking } from 'react-native';

import LoggingService from './LoggingService';
import LocalStorageService from './LocalStorageService';
import ConfigService from './ConfigService';
import MonitoringManager from './MonitoringManager';

class TermsOfServiceService {
  constructor() {
    this.initialized = false;
    this.currentTermsVersion = '1.0.0';
    this.userAcceptance = null;
    
    // Terms configuration
    this.config = {
      termsUrl: 'https://nightlife-navigator.com/terms',
      updateCheckInterval: 24 * 60 * 60 * 1000, // 24 hours
      requireExplicitAcceptance: true,
      allowPartialAcceptance: false,
      gracePeriodDays: 30,
      enableVersionHistory: true,
    };
    
    // Terms sections
    this.termsSections = {
      SERVICE_DESCRIPTION: {
        id: 'service_description',
        title: 'サービスの説明',
        required: true,
        content: 'Nightlife Navigatorは、ナイトライフ関連の店舗情報を提供するアプリケーションです。',
      },
      USER_OBLIGATIONS: {
        id: 'user_obligations',
        title: 'ユーザーの義務',
        required: true,
        content: 'ユーザーは本サービスを適切に利用し、他のユーザーや第三者の権利を尊重する義務があります。',
      },
      PROHIBITED_CONDUCT: {
        id: 'prohibited_conduct',
        title: '禁止事項',
        required: true,
        content: '以下の行為は禁止されています：不正アクセス、迷惑行為、虚偽情報の投稿など。',
      },
      INTELLECTUAL_PROPERTY: {
        id: 'intellectual_property',
        title: '知的財産権',
        required: true,
        content: '本サービスに関する全ての知的財産権は当社に帰属します。',
      },
      DISCLAIMER: {
        id: 'disclaimer',
        title: '免責事項',
        required: true,
        content: '当社は本サービスの利用により生じた損害について責任を負いません。',
      },
      PRIVACY_POLICY: {
        id: 'privacy_policy',
        title: 'プライバシーポリシー',
        required: true,
        content: '個人情報の取り扱いについては、別途プライバシーポリシーに定めます。',
      },
      TERMINATION: {
        id: 'termination',
        title: 'サービス終了',
        required: true,
        content: '当社は任意の理由により本サービスを終了することができます。',
      },
      GOVERNING_LAW: {
        id: 'governing_law',
        title: '準拠法・管轄',
        required: true,
        content: '本規約は日本法に準拠し、東京地方裁判所を専属管轄とします。',
      },
      AGE_RESTRICTIONS: {
        id: 'age_restrictions',
        title: '年齢制限',
        required: true,
        content: '本サービスは18歳以上の方のみご利用いただけます。',
      },
      LOCATION_SERVICES: {
        id: 'location_services',
        title: '位置情報サービス',
        required: false,
        content: '位置情報を利用したサービス提供に関する規定です。',
      },
    };
    
    // Legal requirements
    this.legalRequirements = {
      minAge: 18,
      requiredSections: ['service_description', 'user_obligations', 'prohibited_conduct', 'age_restrictions'],
      acceptanceMethod: 'explicit',
      recordKeeping: true,
      notificationPeriod: 30, // days
    };
    
    // Terms history
    this.termsHistory = [];
    
    // Statistics
    this.stats = {
      termsViewed: 0,
      termsAccepted: 0,
      termsDeclined: 0,
      updatesNotified: 0,
      versionsPublished: 0,
    };
    
    // Event listeners
    this.listeners = new Set();
    this.updateCheckTimer = null;
  }

  /**
   * Initialize terms of service
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Load terms configuration
      await this.loadTermsConfig();
      
      // Load user acceptance
      await this.loadUserAcceptance();
      
      // Load terms history
      await this.loadTermsHistory();
      
      // Check for terms updates
      this.setupTermsUpdateCheck();
      
      // Validate existing acceptance
      await this.validateExistingAcceptance();
      
      this.initialized = true;
      
      LoggingService.info('[TermsOfServiceService] Initialized', {
        termsVersion: this.currentTermsVersion,
        hasAcceptance: !!this.userAcceptance,
        requiresAcceptance: this.requiresAcceptance(),
      });

    } catch (error) {
      LoggingService.error('[TermsOfServiceService] Failed to initialize', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get current terms of service
   */
  async getTermsOfService() {
    try {
      const terms = {
        version: this.currentTermsVersion,
        lastUpdated: await this.getTermsLastUpdated(),
        url: this.config.termsUrl,
        sections: this.termsSections,
        legalRequirements: this.legalRequirements,
        acceptanceRequired: this.requiresAcceptance(),
        effectiveDate: await this.getTermsEffectiveDate(),
        previousVersions: this.config.enableVersionHistory ? this.getTermsVersionHistory() : [],
        contactInfo: this.getContactInfo(),
        disputeResolution: this.getDisputeResolutionInfo(),
        modifications: this.getModificationInfo(),
      };
      
      return terms;

    } catch (error) {
      LoggingService.error('[TermsOfServiceService] Failed to get terms of service', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Record user acceptance
   */
  async recordAcceptance(acceptanceData) {
    try {
      // Validate age requirement
      if (acceptanceData.userAge < this.legalRequirements.minAge) {
        throw new Error(`User must be at least ${this.legalRequirements.minAge} years old`);
      }
      
      const acceptance = {
        version: this.currentTermsVersion,
        timestamp: new Date().toISOString(),
        userAge: acceptanceData.userAge,
        ipAddress: await this.getClientIP(),
        userAgent: Platform.OS,
        method: acceptanceData.method || 'app',
        acceptanceId: this.generateAcceptanceId(),
        sections: this.validateAcceptedSections(acceptanceData.sections),
        isExplicit: acceptanceData.isExplicit || false,
        deviceInfo: await this.getDeviceInfo(),
      };
      
      // Store acceptance
      this.userAcceptance = acceptance;
      await this.saveUserAcceptance();
      
      // Update statistics
      this.stats.termsAccepted++;
      await this.saveTermsStats();
      
      LoggingService.info('[TermsOfServiceService] Terms acceptance recorded', {
        acceptanceId: acceptance.acceptanceId,
        version: acceptance.version,
        userAge: acceptance.userAge,
      });
      
      // Track analytics
      MonitoringManager.trackUserAction?.('terms_accepted', 'legal', {
        version: acceptance.version,
        method: acceptance.method,
      });
      
      // Notify listeners
      this.notifyListeners('terms_accepted', acceptance);
      
      return acceptance;

    } catch (error) {
      LoggingService.error('[TermsOfServiceService] Failed to record acceptance', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Record user decline
   */
  async recordDecline(reason = null) {
    try {
      const decline = {
        version: this.currentTermsVersion,
        timestamp: new Date().toISOString(),
        reason,
        ipAddress: await this.getClientIP(),
        userAgent: Platform.OS,
        declineId: this.generateAcceptanceId(),
      };
      
      // Store decline record
      await this.storeDeclineRecord(decline);
      
      // Update statistics
      this.stats.termsDeclined++;
      await this.saveTermsStats();
      
      LoggingService.info('[TermsOfServiceService] Terms decline recorded', {
        declineId: decline.declineId,
        version: decline.version,
        reason,
      });
      
      // Track analytics
      MonitoringManager.trackUserAction?.('terms_declined', 'legal', {
        version: decline.version,
        reason,
      });
      
      // Notify listeners
      this.notifyListeners('terms_declined', decline);
      
      return decline;

    } catch (error) {
      LoggingService.error('[TermsOfServiceService] Failed to record decline', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Check if user acceptance is required
   */
  requiresAcceptance() {
    if (!this.config.requireExplicitAcceptance) {
      return false;
    }
    
    // Check if user has accepted current version
    if (!this.userAcceptance) {
      return true;
    }
    
    // Check if acceptance is for current version
    if (this.userAcceptance.version !== this.currentTermsVersion) {
      return true;
    }
    
    return false;
  }

  /**
   * Check if user has accepted terms
   */
  hasAcceptedTerms() {
    return !!this.userAcceptance && this.userAcceptance.version === this.currentTermsVersion;
  }

  /**
   * View terms of service
   */
  async viewTermsOfService() {
    try {
      // Update statistics
      this.stats.termsViewed++;
      await this.saveTermsStats();
      
      // Open terms URL
      if (this.config.termsUrl) {
        const supported = await Linking.canOpenURL(this.config.termsUrl);
        if (supported) {
          await Linking.openURL(this.config.termsUrl);
        }
      }
      
      // Notify listeners
      this.notifyListeners('terms_viewed', {
        url: this.config.termsUrl,
        version: this.currentTermsVersion,
      });
      
      return {
        url: this.config.termsUrl,
        version: this.currentTermsVersion,
      };

    } catch (error) {
      LoggingService.error('[TermsOfServiceService] Failed to view terms', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Notify users of terms update
   */
  async notifyTermsUpdate(newVersion, changes = []) {
    try {
      const notification = {
        id: this.generateNotificationId(),
        oldVersion: this.currentTermsVersion,
        newVersion,
        changes,
        timestamp: new Date().toISOString(),
        gracePeriodEnd: new Date(Date.now() + this.config.gracePeriodDays * 24 * 60 * 60 * 1000).toISOString(),
        notificationMethod: 'app',
      };
      
      // Store notification
      await this.storeUpdateNotification(notification);
      
      // Update current version
      this.currentTermsVersion = newVersion;
      await this.saveTermsConfig();
      
      // Invalidate existing acceptance
      if (this.userAcceptance) {
        this.userAcceptance.superseded = true;
        this.userAcceptance.supersededAt = notification.timestamp;
        await this.saveUserAcceptance();
      }
      
      // Update statistics
      this.stats.updatesNotified++;
      await this.saveTermsStats();
      
      LoggingService.info('[TermsOfServiceService] Terms update notification sent', {
        notificationId: notification.id,
        oldVersion: notification.oldVersion,
        newVersion: notification.newVersion,
      });
      
      // Notify listeners
      this.notifyListeners('terms_updated', notification);
      
      return notification;

    } catch (error) {
      LoggingService.error('[TermsOfServiceService] Failed to notify terms update', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get user acceptance status
   */
  getAcceptanceStatus() {
    return {
      hasAccepted: this.hasAcceptedTerms(),
      currentVersion: this.currentTermsVersion,
      acceptedVersion: this.userAcceptance?.version || null,
      acceptanceDate: this.userAcceptance?.timestamp || null,
      requiresAcceptance: this.requiresAcceptance(),
      gracePeriod: this.getGracePeriodInfo(),
      acceptanceDetails: this.userAcceptance ? {
        acceptanceId: this.userAcceptance.acceptanceId,
        method: this.userAcceptance.method,
        isExplicit: this.userAcceptance.isExplicit,
      } : null,
    };
  }

  /**
   * Get terms compliance summary
   */
  async getComplianceSummary() {
    try {
      const summary = {
        currentVersion: this.currentTermsVersion,
        userAcceptance: this.getAcceptanceStatus(),
        legalRequirements: {
          minAge: this.legalRequirements.minAge,
          acceptanceMethod: this.legalRequirements.acceptanceMethod,
          recordKeeping: this.legalRequirements.recordKeeping,
          notificationPeriod: this.legalRequirements.notificationPeriod,
        },
        compliance: {
          hasValidAcceptance: this.hasAcceptedTerms(),
          meetsAgeRequirement: this.userAcceptance?.userAge >= this.legalRequirements.minAge,
          hasExplicitConsent: this.userAcceptance?.isExplicit || false,
          recordsRetained: !!this.userAcceptance,
        },
        statistics: this.stats,
        lastUpdated: new Date().toISOString(),
      };
      
      return summary;

    } catch (error) {
      LoggingService.error('[TermsOfServiceService] Failed to get compliance summary', {
        error: error.message,
      });
      throw error;
    }
  }

  // Helper methods

  /**
   * Validate accepted sections
   */
  validateAcceptedSections(sections) {
    const acceptedSections = sections || {};
    
    // Check required sections
    this.legalRequirements.requiredSections.forEach(sectionId => {
      if (!acceptedSections[sectionId]) {
        throw new Error(`Required section '${sectionId}' must be accepted`);
      }
    });
    
    return acceptedSections;
  }

  /**
   * Validate existing acceptance
   */
  async validateExistingAcceptance() {
    if (!this.userAcceptance) {
      return;
    }
    
    // Check if acceptance is still valid
    if (this.userAcceptance.version !== this.currentTermsVersion) {
      LoggingService.info('[TermsOfServiceService] Acceptance version mismatch, requiring new acceptance', {
        currentVersion: this.userAcceptance.version,
        requiredVersion: this.currentTermsVersion,
      });
      
      // Mark as superseded but keep record
      this.userAcceptance.superseded = true;
      this.userAcceptance.supersededAt = new Date().toISOString();
      await this.saveUserAcceptance();
    }
  }

  /**
   * Setup terms update check
   */
  setupTermsUpdateCheck() {
    if (this.updateCheckTimer) {
      clearInterval(this.updateCheckTimer);
    }
    
    this.updateCheckTimer = setInterval(async () => {
      try {
        await this.checkForTermsUpdates();
      } catch (error) {
        LoggingService.error('[TermsOfServiceService] Terms update check failed', {
          error: error.message,
        });
      }
    }, this.config.updateCheckInterval);
  }

  /**
   * Check for terms updates
   */
  async checkForTermsUpdates() {
    try {
      // This would check for terms updates from server
      // For now, just log that we're checking
      LoggingService.debug('[TermsOfServiceService] Checking for terms updates');

    } catch (error) {
      LoggingService.error('[TermsOfServiceService] Failed to check for terms updates', {
        error: error.message,
      });
    }
  }

  /**
   * Get grace period info
   */
  getGracePeriodInfo() {
    if (!this.userAcceptance?.supersededAt) {
      return null;
    }
    
    const supersededDate = new Date(this.userAcceptance.supersededAt);
    const gracePeriodEnd = new Date(supersededDate.getTime() + this.config.gracePeriodDays * 24 * 60 * 60 * 1000);
    const now = new Date();
    
    return {
      inGracePeriod: now < gracePeriodEnd,
      gracePeriodEnd: gracePeriodEnd.toISOString(),
      daysRemaining: Math.max(0, Math.ceil((gracePeriodEnd - now) / (24 * 60 * 60 * 1000))),
    };
  }

  // Data access methods

  /**
   * Get terms information
   */
  getTermsLastUpdated() {
    return '2024-01-01T00:00:00Z'; // This would come from server
  }

  getTermsEffectiveDate() {
    return '2024-01-01T00:00:00Z'; // This would come from server
  }

  getTermsVersionHistory() {
    return this.termsHistory.map(version => ({
      version: version.version,
      publishedDate: version.publishedDate,
      effectiveDate: version.effectiveDate,
      majorChanges: version.majorChanges,
    }));
  }

  getContactInfo() {
    return {
      email: 'legal@nightlife-navigator.com',
      address: '東京都渋谷区...',
      phone: '+81-3-xxxx-xxxx',
      businessHours: '平日 9:00-18:00',
    };
  }

  getDisputeResolutionInfo() {
    return {
      method: '仲裁',
      jurisdiction: '東京地方裁判所',
      governingLaw: '日本法',
      arbitrationRules: '日本商事仲裁協会規則',
      language: '日本語',
    };
  }

  getModificationInfo() {
    return {
      notificationMethod: 'アプリ内通知およびメール',
      notificationPeriod: `${this.config.gracePeriodDays}日前`,
      effectiveDate: '通知から30日後',
      continuedUse: '変更後の継続利用は新規約への同意とみなします',
    };
  }

  /**
   * Get device info for compliance
   */
  async getDeviceInfo() {
    return {
      platform: Platform.OS,
      version: Platform.Version,
      timestamp: new Date().toISOString(),
    };
  }

  // Storage methods

  /**
   * Load terms configuration
   */
  async loadTermsConfig() {
    try {
      const savedConfig = await LocalStorageService.getItem('terms_of_service_config');
      if (savedConfig) {
        this.config = { ...this.config, ...savedConfig };
      }
      
      const savedVersion = await LocalStorageService.getItem('current_terms_version');
      if (savedVersion) {
        this.currentTermsVersion = savedVersion;
      }
    } catch (error) {
      LoggingService.warn('[TermsOfServiceService] Failed to load terms config', {
        error: error.message,
      });
    }
  }

  /**
   * Save terms configuration
   */
  async saveTermsConfig() {
    try {
      await LocalStorageService.setItem('terms_of_service_config', this.config);
      await LocalStorageService.setItem('current_terms_version', this.currentTermsVersion);
    } catch (error) {
      LoggingService.error('[TermsOfServiceService] Failed to save terms config', {
        error: error.message,
      });
    }
  }

  /**
   * Load user acceptance
   */
  async loadUserAcceptance() {
    try {
      this.userAcceptance = await LocalStorageService.getItem('terms_acceptance');
    } catch (error) {
      LoggingService.warn('[TermsOfServiceService] Failed to load user acceptance', {
        error: error.message,
      });
    }
  }

  /**
   * Save user acceptance
   */
  async saveUserAcceptance() {
    try {
      await LocalStorageService.setItem('terms_acceptance', this.userAcceptance);
    } catch (error) {
      LoggingService.error('[TermsOfServiceService] Failed to save user acceptance', {
        error: error.message,
      });
    }
  }

  /**
   * Load terms history
   */
  async loadTermsHistory() {
    try {
      this.termsHistory = await LocalStorageService.getItem('terms_history') || [];
    } catch (error) {
      LoggingService.warn('[TermsOfServiceService] Failed to load terms history', {
        error: error.message,
      });
    }
  }

  /**
   * Save terms statistics
   */
  async saveTermsStats() {
    try {
      await LocalStorageService.setItem('terms_of_service_stats', this.stats);
    } catch (error) {
      LoggingService.warn('[TermsOfServiceService] Failed to save terms stats', {
        error: error.message,
      });
    }
  }

  /**
   * Store decline record
   */
  async storeDeclineRecord(decline) {
    try {
      const declines = await LocalStorageService.getItem('terms_declines') || [];
      declines.push(decline);
      await LocalStorageService.setItem('terms_declines', declines);
    } catch (error) {
      LoggingService.error('[TermsOfServiceService] Failed to store decline record', {
        error: error.message,
      });
    }
  }

  /**
   * Store update notification
   */
  async storeUpdateNotification(notification) {
    try {
      const notifications = await LocalStorageService.getItem('terms_update_notifications') || [];
      notifications.push(notification);
      await LocalStorageService.setItem('terms_update_notifications', notifications);
    } catch (error) {
      LoggingService.error('[TermsOfServiceService] Failed to store update notification', {
        error: error.message,
      });
    }
  }

  // Utility methods

  /**
   * Generate acceptance ID
   */
  generateAcceptanceId() {
    return `acceptance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate notification ID
   */
  generateNotificationId() {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get client IP (placeholder)
   */
  async getClientIP() {
    return '127.0.0.1'; // In production, this would be obtained from server
  }

  /**
   * Get terms statistics
   */
  getTermsStatistics() {
    return {
      ...this.stats,
      initialized: this.initialized,
      hasAcceptance: !!this.userAcceptance,
      requiresAcceptance: this.requiresAcceptance(),
      currentVersion: this.currentTermsVersion,
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
        LoggingService.error('[TermsOfServiceService] Listener error', {
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
const termsOfServiceService = new TermsOfServiceService();

export default termsOfServiceService;