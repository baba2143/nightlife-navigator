import { LocalStorageService } from './LocalStorageService';
import { AuditLogService } from './AuditLogService';

class LegalNoticeService {
  constructor() {
    this.initialized = false;
    this.currentNotices = null;
    this.userAcknowledgments = null;
    this.noticeHistory = [];
    this.storageService = null;
    this.auditService = null;
    this.listeners = [];
    this.noticeTemplates = {};
    this.jurisdictions = {};
    this.displayRules = {};
  }

  static getInstance() {
    if (!LegalNoticeService.instance) {
      LegalNoticeService.instance = new LegalNoticeService();
    }
    return LegalNoticeService.instance;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      this.storageService = LocalStorageService.getInstance();
      this.auditService = AuditLogService.getInstance();
      
      await this.loadNotices();
      await this.loadAcknowledgments();
      await this.loadNoticeHistory();
      await this.initializeTemplates();
      await this.loadJurisdictions();
      await this.loadDisplayRules();
      
      this.initialized = true;
      
      await this.auditService.logEvent('legal_notice_system_initialized', {
        timestamp: new Date().toISOString(),
        notices_count: Object.keys(this.currentNotices || {}).length,
        templates_count: Object.keys(this.noticeTemplates).length,
        jurisdictions_count: Object.keys(this.jurisdictions).length
      });
      
      this.emit('serviceInitialized');
    } catch (error) {
      console.error('Failed to initialize LegalNoticeService:', error);
      throw error;
    }
  }

  async loadNotices() {
    try {
      const notices = await this.storageService.getItem('legal_notices');
      this.currentNotices = notices || {
        disclaimer: {
          id: 'disclaimer',
          type: 'disclaimer',
          version: '1.0',
          title: 'Legal Disclaimer',
          content: 'This application provides information about nightlife venues and events. Users must verify information independently.',
          effectiveDate: new Date().toISOString(),
          mandatory: true,
          jurisdictions: ['global'],
          languages: ['en', 'ja'],
          displayConditions: {
            appStart: true,
            beforeVenueBooking: true,
            beforeEventBooking: true
          }
        },
        liability: {
          id: 'liability',
          type: 'liability',
          version: '1.0',
          title: 'Limitation of Liability',
          content: 'The app developers are not responsible for venue availability, pricing accuracy, or event cancellations.',
          effectiveDate: new Date().toISOString(),
          mandatory: true,
          jurisdictions: ['global'],
          languages: ['en', 'ja'],
          displayConditions: {
            beforePayment: true,
            beforeBooking: true
          }
        },
        dataUsage: {
          id: 'dataUsage',
          type: 'data_usage',
          version: '1.0',
          title: 'Data Usage Notice',
          content: 'This app collects location data to provide personalized venue recommendations.',
          effectiveDate: new Date().toISOString(),
          mandatory: true,
          jurisdictions: ['global'],
          languages: ['en', 'ja'],
          displayConditions: {
            beforeLocationAccess: true,
            appStart: true
          }
        },
        ageRestriction: {
          id: 'ageRestriction',
          type: 'age_restriction',
          version: '1.0',
          title: 'Age Restriction Notice',
          content: 'This app is intended for users 18 years or older. Some venues may have additional age restrictions.',
          effectiveDate: new Date().toISOString(),
          mandatory: true,
          jurisdictions: ['global'],
          languages: ['en', 'ja'],
          displayConditions: {
            appStart: true,
            beforeVenueAccess: true
          }
        },
        thirdPartyServices: {
          id: 'thirdPartyServices',
          type: 'third_party',
          version: '1.0',
          title: 'Third-Party Services Notice',
          content: 'This app integrates with third-party services for payments, maps, and social features.',
          effectiveDate: new Date().toISOString(),
          mandatory: false,
          jurisdictions: ['global'],
          languages: ['en', 'ja'],
          displayConditions: {
            beforePayment: true,
            beforeSocialShare: true
          }
        }
      };
      
      await this.storageService.setItem('legal_notices', this.currentNotices);
    } catch (error) {
      console.error('Failed to load legal notices:', error);
      this.currentNotices = {};
    }
  }

  async loadAcknowledgments() {
    try {
      const acknowledgments = await this.storageService.getItem('legal_notice_acknowledgments');
      this.userAcknowledgments = acknowledgments || {};
    } catch (error) {
      console.error('Failed to load acknowledgments:', error);
      this.userAcknowledgments = {};
    }
  }

  async loadNoticeHistory() {
    try {
      const history = await this.storageService.getItem('legal_notice_history');
      this.noticeHistory = history || [];
    } catch (error) {
      console.error('Failed to load notice history:', error);
      this.noticeHistory = [];
    }
  }

  async initializeTemplates() {
    this.noticeTemplates = {
      disclaimer: {
        template: 'This application provides {service_type} services. Users must {user_responsibility}.',
        variables: {
          service_type: 'nightlife venue information',
          user_responsibility: 'verify information independently'
        }
      },
      liability: {
        template: 'The app developers are not responsible for {liability_areas}.',
        variables: {
          liability_areas: 'venue availability, pricing accuracy, or event cancellations'
        }
      },
      dataUsage: {
        template: 'This app collects {data_types} to provide {service_purpose}.',
        variables: {
          data_types: 'location data and usage preferences',
          service_purpose: 'personalized venue recommendations'
        }
      },
      ageRestriction: {
        template: 'This app is intended for users {minimum_age} years or older. {additional_restrictions}',
        variables: {
          minimum_age: '18',
          additional_restrictions: 'Some venues may have additional age restrictions.'
        }
      },
      thirdPartyServices: {
        template: 'This app integrates with third-party services for {service_list}.',
        variables: {
          service_list: 'payments, maps, and social features'
        }
      }
    };
  }

  async loadJurisdictions() {
    this.jurisdictions = {
      global: {
        name: 'Global',
        requirements: {
          disclaimer: ['mandatory_display'],
          liability: ['mandatory_display'],
          dataUsage: ['mandatory_display'],
          ageRestriction: ['mandatory_display']
        }
      },
      eu: {
        name: 'European Union',
        requirements: {
          disclaimer: ['mandatory_display', 'explicit_consent'],
          liability: ['mandatory_display', 'clear_language'],
          dataUsage: ['mandatory_display', 'gdpr_compliance'],
          ageRestriction: ['mandatory_display', 'parental_consent']
        }
      },
      us: {
        name: 'United States',
        requirements: {
          disclaimer: ['mandatory_display'],
          liability: ['mandatory_display', 'state_specific'],
          dataUsage: ['mandatory_display', 'ccpa_compliance'],
          ageRestriction: ['mandatory_display', 'coppa_compliance']
        }
      },
      jp: {
        name: 'Japan',
        requirements: {
          disclaimer: ['mandatory_display', 'japanese_language'],
          liability: ['mandatory_display', 'japanese_language'],
          dataUsage: ['mandatory_display', 'appi_compliance'],
          ageRestriction: ['mandatory_display', 'japanese_language']
        }
      }
    };
  }

  async loadDisplayRules() {
    this.displayRules = {
      appStart: {
        notices: ['disclaimer', 'ageRestriction'],
        displayType: 'modal',
        requiresAcknowledgment: true,
        canSkip: false
      },
      beforeVenueBooking: {
        notices: ['disclaimer', 'liability'],
        displayType: 'inline',
        requiresAcknowledgment: true,
        canSkip: false
      },
      beforePayment: {
        notices: ['liability', 'thirdPartyServices'],
        displayType: 'modal',
        requiresAcknowledgment: true,
        canSkip: false
      },
      beforeLocationAccess: {
        notices: ['dataUsage'],
        displayType: 'alert',
        requiresAcknowledgment: true,
        canSkip: false
      },
      beforeSocialShare: {
        notices: ['thirdPartyServices'],
        displayType: 'inline',
        requiresAcknowledgment: false,
        canSkip: true
      }
    };
  }

  async displayNotice(noticeId, context = {}) {
    try {
      const notice = this.currentNotices[noticeId];
      if (!notice) {
        throw new Error(`Notice ${noticeId} not found`);
      }

      const shouldDisplay = await this.shouldDisplayNotice(noticeId, context);
      if (!shouldDisplay) {
        return { displayed: false, reason: 'already_acknowledged' };
      }

      const displayConfig = this.getDisplayConfig(context.trigger);
      const formattedNotice = this.formatNotice(notice, context);

      await this.auditService.logEvent('legal_notice_displayed', {
        notice_id: noticeId,
        notice_type: notice.type,
        context: context,
        display_config: displayConfig,
        timestamp: new Date().toISOString()
      });

      const result = {
        displayed: true,
        notice: formattedNotice,
        displayConfig: displayConfig,
        requiresAcknowledgment: displayConfig.requiresAcknowledgment
      };

      this.emit('noticeDisplayed', { noticeId, result });
      return result;
    } catch (error) {
      console.error('Failed to display notice:', error);
      await this.auditService.logEvent('legal_notice_display_error', {
        notice_id: noticeId,
        error: error.message,
        context: context,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  async shouldDisplayNotice(noticeId, context) {
    const notice = this.currentNotices[noticeId];
    if (!notice) return false;

    if (!notice.mandatory) {
      const acknowledgment = this.userAcknowledgments[noticeId];
      if (acknowledgment && acknowledgment.version === notice.version) {
        return false;
      }
    }

    const displayConditions = notice.displayConditions || {};
    const trigger = context.trigger;

    if (trigger && !displayConditions[trigger]) {
      return false;
    }

    const jurisdiction = context.jurisdiction || 'global';
    if (!notice.jurisdictions.includes(jurisdiction) && !notice.jurisdictions.includes('global')) {
      return false;
    }

    return true;
  }

  getDisplayConfig(trigger) {
    return this.displayRules[trigger] || {
      displayType: 'inline',
      requiresAcknowledgment: false,
      canSkip: true
    };
  }

  formatNotice(notice, context) {
    let content = notice.content;
    const template = this.noticeTemplates[notice.type];
    
    if (template) {
      content = template.template;
      Object.entries(template.variables).forEach(([key, value]) => {
        content = content.replace(new RegExp(`{${key}}`, 'g'), value);
      });
    }

    const language = context.language || 'en';
    
    return {
      id: notice.id,
      type: notice.type,
      version: notice.version,
      title: notice.title,
      content: content,
      effectiveDate: notice.effectiveDate,
      mandatory: notice.mandatory,
      language: language,
      lastUpdated: notice.lastUpdated || notice.effectiveDate
    };
  }

  async acknowledgeNotice(noticeId, userId = null, context = {}) {
    try {
      const notice = this.currentNotices[noticeId];
      if (!notice) {
        throw new Error(`Notice ${noticeId} not found`);
      }

      const acknowledgment = {
        noticeId: noticeId,
        noticeVersion: notice.version,
        userId: userId,
        timestamp: new Date().toISOString(),
        context: context,
        ipAddress: context.ipAddress || 'unknown',
        userAgent: context.userAgent || 'unknown'
      };

      this.userAcknowledgments[noticeId] = acknowledgment;
      await this.storageService.setItem('legal_notice_acknowledgments', this.userAcknowledgments);

      await this.auditService.logEvent('legal_notice_acknowledged', {
        notice_id: noticeId,
        notice_type: notice.type,
        user_id: userId,
        acknowledgment: acknowledgment,
        timestamp: new Date().toISOString()
      });

      this.emit('noticeAcknowledged', { noticeId, acknowledgment });
      return acknowledgment;
    } catch (error) {
      console.error('Failed to acknowledge notice:', error);
      await this.auditService.logEvent('legal_notice_acknowledgment_error', {
        notice_id: noticeId,
        user_id: userId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  async updateNotice(noticeId, updates) {
    try {
      const notice = this.currentNotices[noticeId];
      if (!notice) {
        throw new Error(`Notice ${noticeId} not found`);
      }

      const oldVersion = notice.version;
      const newVersion = this.generateVersion();

      const updatedNotice = {
        ...notice,
        ...updates,
        version: newVersion,
        lastUpdated: new Date().toISOString()
      };

      this.currentNotices[noticeId] = updatedNotice;
      await this.storageService.setItem('legal_notices', this.currentNotices);

      const historyEntry = {
        noticeId: noticeId,
        oldVersion: oldVersion,
        newVersion: newVersion,
        changes: updates,
        timestamp: new Date().toISOString(),
        reason: updates.reason || 'Manual update'
      };

      this.noticeHistory.push(historyEntry);
      await this.storageService.setItem('legal_notice_history', this.noticeHistory);

      delete this.userAcknowledgments[noticeId];
      await this.storageService.setItem('legal_notice_acknowledgments', this.userAcknowledgments);

      await this.auditService.logEvent('legal_notice_updated', {
        notice_id: noticeId,
        old_version: oldVersion,
        new_version: newVersion,
        changes: updates,
        timestamp: new Date().toISOString()
      });

      this.emit('noticeUpdated', { noticeId, oldVersion, newVersion, changes: updates });
      return updatedNotice;
    } catch (error) {
      console.error('Failed to update notice:', error);
      throw error;
    }
  }

  async getRequiredNotices(context = {}) {
    try {
      const trigger = context.trigger || 'general';
      const jurisdiction = context.jurisdiction || 'global';
      const language = context.language || 'en';

      const requiredNotices = [];

      for (const [noticeId, notice] of Object.entries(this.currentNotices)) {
        if (await this.shouldDisplayNotice(noticeId, { trigger, jurisdiction, language })) {
          requiredNotices.push({
            ...notice,
            formatted: this.formatNotice(notice, context)
          });
        }
      }

      return requiredNotices;
    } catch (error) {
      console.error('Failed to get required notices:', error);
      return [];
    }
  }

  async getNoticeStatus(noticeId) {
    try {
      const notice = this.currentNotices[noticeId];
      if (!notice) {
        return { exists: false };
      }

      const acknowledgment = this.userAcknowledgments[noticeId];
      const isAcknowledged = acknowledgment && acknowledgment.noticeVersion === notice.version;

      return {
        exists: true,
        notice: notice,
        isAcknowledged: isAcknowledged,
        acknowledgment: acknowledgment,
        requiresDisplay: !isAcknowledged && notice.mandatory
      };
    } catch (error) {
      console.error('Failed to get notice status:', error);
      return { exists: false, error: error.message };
    }
  }

  async generateComplianceReport(jurisdiction = 'global') {
    try {
      const requirements = this.jurisdictions[jurisdiction]?.requirements || {};
      const report = {
        jurisdiction: jurisdiction,
        generatedAt: new Date().toISOString(),
        notices: {},
        compliance: {
          totalNotices: Object.keys(this.currentNotices).length,
          mandatoryNotices: 0,
          acknowledgedNotices: 0,
          complianceScore: 0
        }
      };

      for (const [noticeId, notice] of Object.entries(this.currentNotices)) {
        const acknowledgment = this.userAcknowledgments[noticeId];
        const isAcknowledged = acknowledgment && acknowledgment.noticeVersion === notice.version;
        
        if (notice.mandatory) {
          report.compliance.mandatoryNotices++;
          if (isAcknowledged) {
            report.compliance.acknowledgedNotices++;
          }
        }

        const noticeRequirements = requirements[notice.type] || [];
        
        report.notices[noticeId] = {
          type: notice.type,
          version: notice.version,
          mandatory: notice.mandatory,
          isAcknowledged: isAcknowledged,
          acknowledgmentDate: acknowledgment?.timestamp,
          requirements: noticeRequirements,
          compliant: this.checkNoticeCompliance(notice, noticeRequirements)
        };
      }

      report.compliance.complianceScore = 
        report.compliance.mandatoryNotices > 0 
          ? (report.compliance.acknowledgedNotices / report.compliance.mandatoryNotices) * 100
          : 100;

      await this.auditService.logEvent('legal_notice_compliance_report_generated', {
        jurisdiction: jurisdiction,
        report: report,
        timestamp: new Date().toISOString()
      });

      return report;
    } catch (error) {
      console.error('Failed to generate compliance report:', error);
      throw error;
    }
  }

  checkNoticeCompliance(notice, requirements) {
    const checks = {
      mandatory_display: notice.mandatory,
      clear_language: notice.content && notice.content.length > 0,
      explicit_consent: true,
      gdpr_compliance: true,
      ccpa_compliance: true,
      coppa_compliance: true,
      appi_compliance: true,
      japanese_language: notice.languages?.includes('ja') || false,
      state_specific: true,
      parental_consent: true
    };

    return requirements.every(req => checks[req] || false);
  }

  generateVersion() {
    return `${Date.now()}.${Math.random().toString(36).substr(2, 9)}`;
  }

  addEventListener(eventType, callback) {
    this.listeners.push({ eventType, callback });
  }

  removeEventListener(eventType, callback) {
    this.listeners = this.listeners.filter(
      listener => listener.eventType !== eventType || listener.callback !== callback
    );
  }

  emit(eventType, data) {
    this.listeners
      .filter(listener => listener.eventType === eventType)
      .forEach(listener => listener.callback(data));
  }

  async cleanup() {
    try {
      this.listeners = [];
      this.currentNotices = null;
      this.userAcknowledgments = null;
      this.noticeHistory = [];
      this.initialized = false;
      
      await this.auditService.logEvent('legal_notice_service_cleanup', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to cleanup LegalNoticeService:', error);
    }
  }
}

export { LegalNoticeService };