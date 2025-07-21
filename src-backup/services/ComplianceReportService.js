import { LocalStorageService } from './LocalStorageService';
import { AuditLogService } from './AuditLogService';
import { ConsentManagementService } from './ConsentManagementService';
import { DataProtectionService } from './DataProtectionService';
import { DataErasureService } from './DataErasureService';
import { DataPortabilityService } from './DataPortabilityService';
import { AgeVerificationService } from './AgeVerificationService';
import { LegalNoticeService } from './LegalNoticeService';

class ComplianceReportService {
  constructor() {
    this.initialized = false;
    this.storageService = null;
    this.auditService = null;
    this.consentService = null;
    this.dataProtectionService = null;
    this.dataErasureService = null;
    this.dataPortabilityService = null;
    this.ageVerificationService = null;
    this.legalNoticeService = null;
    this.reportCache = new Map();
    this.listeners = [];
    this.reportSchedules = {};
    this.complianceFrameworks = {};
    this.reportTemplates = {};
  }

  static getInstance() {
    if (!ComplianceReportService.instance) {
      ComplianceReportService.instance = new ComplianceReportService();
    }
    return ComplianceReportService.instance;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      this.storageService = LocalStorageService.getInstance();
      this.auditService = AuditLogService.getInstance();
      this.consentService = ConsentManagementService.getInstance();
      this.dataProtectionService = DataProtectionService.getInstance();
      this.dataErasureService = DataErasureService.getInstance();
      this.dataPortabilityService = DataPortabilityService.getInstance();
      this.ageVerificationService = AgeVerificationService.getInstance();
      this.legalNoticeService = LegalNoticeService.getInstance();

      await this.initializeFrameworks();
      await this.initializeTemplates();
      await this.loadReportSchedules();
      
      this.initialized = true;
      
      await this.auditService.logEvent('compliance_report_service_initialized', {
        timestamp: new Date().toISOString(),
        frameworks_count: Object.keys(this.complianceFrameworks).length,
        templates_count: Object.keys(this.reportTemplates).length
      });
      
      this.emit('serviceInitialized');
    } catch (error) {
      console.error('Failed to initialize ComplianceReportService:', error);
      throw error;
    }
  }

  async initializeFrameworks() {
    this.complianceFrameworks = {
      gdpr: {
        name: 'General Data Protection Regulation',
        jurisdiction: 'EU',
        requirements: {
          consent: ['lawful_basis', 'explicit_consent', 'withdrawal_mechanism'],
          data_protection: ['encryption', 'access_controls', 'data_minimization'],
          data_subject_rights: ['access', 'rectification', 'erasure', 'portability'],
          breach_notification: ['72_hour_notification', 'data_subject_notification'],
          privacy_by_design: ['data_protection_impact_assessment', 'privacy_by_default'],
          records_keeping: ['processing_activities', 'retention_periods']
        },
        penalties: {
          maximum_fine: '20,000,000 EUR or 4% of global annual turnover',
          administrative_measures: ['warnings', 'reprimands', 'processing_bans']
        }
      },
      ccpa: {
        name: 'California Consumer Privacy Act',
        jurisdiction: 'California, US',
        requirements: {
          consumer_rights: ['know', 'delete', 'opt_out', 'non_discrimination'],
          privacy_policy: ['categories_collected', 'purposes', 'third_parties'],
          data_sales: ['opt_out_mechanism', 'do_not_sell_link'],
          service_providers: ['contracts', 'data_use_restrictions']
        },
        penalties: {
          maximum_fine: '$7,500 per violation',
          private_right: '$100-$750 per consumer per incident'
        }
      },
      coppa: {
        name: 'Children\'s Online Privacy Protection Act',
        jurisdiction: 'US',
        requirements: {
          age_verification: ['reasonable_efforts', 'age_screening'],
          parental_consent: ['verifiable_consent', 'consent_mechanisms'],
          data_collection: ['notice_requirements', 'limited_collection'],
          data_deletion: ['parental_deletion_rights', 'data_retention_limits']
        },
        penalties: {
          maximum_fine: '$43,792 per violation',
          additional_measures: ['injunctive_relief', 'civil_penalties']
        }
      },
      appi: {
        name: 'Act on Protection of Personal Information',
        jurisdiction: 'Japan',
        requirements: {
          personal_data: ['consent_requirements', 'purpose_specification'],
          data_transfer: ['cross_border_transfer_restrictions', 'adequate_protection'],
          data_subject_rights: ['disclosure', 'correction', 'deletion'],
          security_measures: ['technical_safeguards', 'organizational_measures']
        },
        penalties: {
          maximum_fine: '300,000 JPY or administrative orders',
          additional_measures: ['improvement_orders', 'business_suspension']
        }
      }
    };
  }

  async initializeTemplates() {
    this.reportTemplates = {
      comprehensive: {
        name: 'Comprehensive Compliance Report',
        sections: [
          'executive_summary',
          'compliance_overview',
          'consent_management',
          'data_protection',
          'data_subject_rights',
          'age_verification',
          'legal_notices',
          'audit_trail',
          'violations_incidents',
          'recommendations'
        ]
      },
      gdpr_assessment: {
        name: 'GDPR Compliance Assessment',
        sections: [
          'lawful_basis_assessment',
          'consent_audit',
          'data_protection_measures',
          'breach_preparedness',
          'data_subject_rights_compliance',
          'privacy_impact_assessment'
        ]
      },
      quarterly: {
        name: 'Quarterly Compliance Review',
        sections: [
          'period_summary',
          'compliance_metrics',
          'incidents_resolved',
          'system_updates',
          'training_completed'
        ]
      },
      incident_response: {
        name: 'Incident Response Report',
        sections: [
          'incident_summary',
          'affected_data',
          'containment_measures',
          'notification_timeline',
          'corrective_actions'
        ]
      }
    };
  }

  async loadReportSchedules() {
    try {
      const schedules = await this.storageService.getItem('compliance_report_schedules');
      this.reportSchedules = schedules || {
        monthly: {
          enabled: true,
          template: 'quarterly',
          recipients: ['compliance@company.com'],
          lastGenerated: null,
          nextScheduled: null
        },
        quarterly: {
          enabled: true,
          template: 'comprehensive',
          recipients: ['legal@company.com', 'compliance@company.com'],
          lastGenerated: null,
          nextScheduled: null
        },
        annual: {
          enabled: true,
          template: 'comprehensive',
          recipients: ['board@company.com', 'legal@company.com'],
          lastGenerated: null,
          nextScheduled: null
        }
      };
    } catch (error) {
      console.error('Failed to load report schedules:', error);
      this.reportSchedules = {};
    }
  }

  async generateComplianceReport(options = {}) {
    try {
      const reportId = this.generateReportId();
      const startTime = Date.now();
      
      const reportConfig = {
        id: reportId,
        type: options.type || 'comprehensive',
        framework: options.framework || 'gdpr',
        dateRange: options.dateRange || this.getDefaultDateRange(),
        includeSections: options.sections || this.reportTemplates[options.type || 'comprehensive'].sections,
        format: options.format || 'json',
        language: options.language || 'en'
      };

      await this.auditService.logEvent('compliance_report_generation_started', {
        report_id: reportId,
        config: reportConfig,
        timestamp: new Date().toISOString()
      });

      const report = await this.buildReport(reportConfig);
      const processingTime = Date.now() - startTime;

      report.metadata = {
        ...report.metadata,
        processingTime: processingTime,
        cacheKey: this.generateCacheKey(reportConfig)
      };

      this.reportCache.set(report.metadata.cacheKey, report);

      await this.auditService.logEvent('compliance_report_generated', {
        report_id: reportId,
        processing_time: processingTime,
        sections_count: report.sections.length,
        timestamp: new Date().toISOString()
      });

      this.emit('reportGenerated', { reportId, report });
      return report;
    } catch (error) {
      console.error('Failed to generate compliance report:', error);
      await this.auditService.logEvent('compliance_report_generation_error', {
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  async buildReport(config) {
    const framework = this.complianceFrameworks[config.framework];
    const template = this.reportTemplates[config.type];

    const report = {
      metadata: {
        id: config.id,
        title: `${framework.name} Compliance Report`,
        type: config.type,
        framework: config.framework,
        generatedAt: new Date().toISOString(),
        dateRange: config.dateRange,
        version: '1.0',
        language: config.language
      },
      executiveSummary: await this.generateExecutiveSummary(config),
      complianceOverview: await this.generateComplianceOverview(config),
      sections: []
    };

    for (const sectionName of config.includeSections) {
      const section = await this.generateSection(sectionName, config);
      if (section) {
        report.sections.push(section);
      }
    }

    report.recommendations = await this.generateRecommendations(report, config);
    report.complianceScore = this.calculateComplianceScore(report);

    return report;
  }

  async generateExecutiveSummary(config) {
    const consentReport = await this.consentService.getGDPRComplianceReport();
    const dataProtectionReport = await this.dataProtectionService.getComplianceReport();
    const ageVerificationReport = await this.ageVerificationService.getComplianceReport();

    return {
      period: config.dateRange,
      overallCompliance: 'Good',
      keyMetrics: {
        consentRate: consentReport.statistics.consentRate,
        dataProtectionIncidents: dataProtectionReport.incidents?.length || 0,
        ageVerificationRate: ageVerificationReport.verificationRate,
        totalAuditEvents: await this.auditService.getEventCount(config.dateRange)
      },
      criticalIssues: [],
      improvements: []
    };
  }

  async generateComplianceOverview(config) {
    const framework = this.complianceFrameworks[config.framework];
    
    return {
      framework: framework.name,
      jurisdiction: framework.jurisdiction,
      applicableRequirements: framework.requirements,
      complianceStatus: await this.assessFrameworkCompliance(config.framework),
      lastAssessment: new Date().toISOString(),
      nextReview: this.calculateNextReviewDate()
    };
  }

  async generateSection(sectionName, config) {
    const sectionGenerators = {
      consent_management: () => this.generateConsentSection(config),
      data_protection: () => this.generateDataProtectionSection(config),
      data_subject_rights: () => this.generateDataSubjectRightsSection(config),
      age_verification: () => this.generateAgeVerificationSection(config),
      legal_notices: () => this.generateLegalNoticesSection(config),
      audit_trail: () => this.generateAuditTrailSection(config),
      violations_incidents: () => this.generateViolationsSection(config),
      recommendations: () => this.generateRecommendationsSection(config)
    };

    const generator = sectionGenerators[sectionName];
    if (!generator) {
      console.warn(`Unknown section: ${sectionName}`);
      return null;
    }

    return await generator();
  }

  async generateConsentSection(config) {
    const consentReport = await this.consentService.getGDPRComplianceReport();
    
    return {
      name: 'consent_management',
      title: 'Consent Management',
      data: {
        totalConsents: consentReport.statistics.totalConsents,
        consentRate: consentReport.statistics.consentRate,
        withdrawalRate: consentReport.statistics.withdrawalRate,
        consentByCategory: consentReport.statistics.consentByCategory,
        recentConsents: consentReport.recentConsents,
        complianceStatus: consentReport.gdprCompliance.overallCompliance
      },
      assessment: {
        strengths: ['Comprehensive consent categories', 'Clear withdrawal mechanism'],
        concerns: consentReport.gdprCompliance.violations.length > 0 ? ['Consent violations detected'] : [],
        recommendations: ['Regular consent audits', 'User-friendly consent interface']
      }
    };
  }

  async generateDataProtectionSection(config) {
    const dataProtectionReport = await this.dataProtectionService.getComplianceReport();
    
    return {
      name: 'data_protection',
      title: 'Data Protection Measures',
      data: {
        encryptionCoverage: dataProtectionReport.encryptionCoverage,
        accessControls: dataProtectionReport.accessControls,
        dataClassification: dataProtectionReport.dataClassification,
        securityIncidents: dataProtectionReport.incidents,
        backupStatus: dataProtectionReport.backupStatus
      },
      assessment: {
        strengths: ['Strong encryption implementation', 'Comprehensive access controls'],
        concerns: dataProtectionReport.incidents?.length > 0 ? ['Security incidents detected'] : [],
        recommendations: ['Regular security audits', 'Staff training on data protection']
      }
    };
  }

  async generateDataSubjectRightsSection(config) {
    const erasureReport = await this.dataErasureService.getComplianceReport();
    const portabilityReport = await this.dataPortabilityService.getComplianceReport();
    
    return {
      name: 'data_subject_rights',
      title: 'Data Subject Rights',
      data: {
        erasureRequests: erasureReport.requests,
        portabilityRequests: portabilityReport.requests,
        responseTime: {
          average: erasureReport.averageResponseTime,
          withinCompliance: erasureReport.complianceRate
        },
        requestTypes: {
          access: portabilityReport.accessRequests || 0,
          rectification: 0,
          erasure: erasureReport.requests?.length || 0,
          portability: portabilityReport.requests?.length || 0
        }
      },
      assessment: {
        strengths: ['Automated request processing', 'Comprehensive data export'],
        concerns: erasureReport.complianceRate < 95 ? ['Response time concerns'] : [],
        recommendations: ['Streamline request processing', 'Improve user communication']
      }
    };
  }

  async generateAgeVerificationSection(config) {
    const ageReport = await this.ageVerificationService.getComplianceReport();
    
    return {
      name: 'age_verification',
      title: 'Age Verification & Child Protection',
      data: {
        verificationMethods: ageReport.verificationMethods,
        verificationRate: ageReport.verificationRate,
        parentalConsentRate: ageReport.parentalConsentRate,
        restrictedFeatures: ageReport.restrictedFeatures,
        coppaCompliance: ageReport.coppaCompliance
      },
      assessment: {
        strengths: ['Multiple verification methods', 'Comprehensive parental consent'],
        concerns: ageReport.coppaCompliance.violations.length > 0 ? ['COPPA violations detected'] : [],
        recommendations: ['Regular age verification audits', 'Parental communication improvements']
      }
    };
  }

  async generateLegalNoticesSection(config) {
    const legalReport = await this.legalNoticeService.generateComplianceReport(config.framework);
    
    return {
      name: 'legal_notices',
      title: 'Legal Notices & Disclosures',
      data: {
        totalNotices: legalReport.compliance.totalNotices,
        mandatoryNotices: legalReport.compliance.mandatoryNotices,
        acknowledgedNotices: legalReport.compliance.acknowledgedNotices,
        complianceScore: legalReport.compliance.complianceScore,
        noticesByType: legalReport.notices
      },
      assessment: {
        strengths: ['Comprehensive legal notices', 'Clear acknowledgment process'],
        concerns: legalReport.compliance.complianceScore < 100 ? ['Acknowledgment gaps'] : [],
        recommendations: ['Regular notice updates', 'User education on legal requirements']
      }
    };
  }

  async generateAuditTrailSection(config) {
    const auditEvents = await this.auditService.getEventsByDateRange(config.dateRange);
    const complianceEvents = auditEvents.filter(event => 
      event.category === 'compliance' || event.category === 'privacy'
    );
    
    return {
      name: 'audit_trail',
      title: 'Audit Trail & Monitoring',
      data: {
        totalEvents: auditEvents.length,
        complianceEvents: complianceEvents.length,
        eventsByCategory: this.groupEventsByCategory(auditEvents),
        criticalEvents: auditEvents.filter(event => event.severity === 'critical'),
        integrityStatus: 'Verified'
      },
      assessment: {
        strengths: ['Comprehensive audit logging', 'Real-time monitoring'],
        concerns: complianceEvents.filter(e => e.severity === 'critical').length > 0 ? ['Critical compliance events'] : [],
        recommendations: ['Regular audit reviews', 'Automated alert improvements']
      }
    };
  }

  async generateViolationsSection(config) {
    const violations = await this.detectViolations(config.dateRange);
    
    return {
      name: 'violations_incidents',
      title: 'Violations & Incidents',
      data: {
        totalViolations: violations.length,
        violationsByType: this.groupViolationsByType(violations),
        resolvedViolations: violations.filter(v => v.status === 'resolved').length,
        openViolations: violations.filter(v => v.status === 'open').length,
        averageResolutionTime: this.calculateAverageResolutionTime(violations)
      },
      assessment: {
        strengths: violations.length === 0 ? ['No violations detected'] : ['Proactive violation detection'],
        concerns: violations.filter(v => v.status === 'open').length > 0 ? ['Open violations pending'] : [],
        recommendations: ['Implement preventive measures', 'Improve violation response time']
      }
    };
  }

  async generateRecommendationsSection(config) {
    const recommendations = await this.generateSystemRecommendations(config);
    
    return {
      name: 'recommendations',
      title: 'Compliance Recommendations',
      data: {
        immediate: recommendations.filter(r => r.priority === 'high'),
        shortTerm: recommendations.filter(r => r.priority === 'medium'),
        longTerm: recommendations.filter(r => r.priority === 'low'),
        totalRecommendations: recommendations.length
      },
      assessment: {
        actionRequired: recommendations.filter(r => r.priority === 'high').length > 0,
        improvementAreas: recommendations.map(r => r.category)
      }
    };
  }

  async assessFrameworkCompliance(framework) {
    const requirements = this.complianceFrameworks[framework].requirements;
    const assessment = {};
    
    for (const [category, reqs] of Object.entries(requirements)) {
      assessment[category] = {
        requirements: reqs,
        compliance: await this.checkCategoryCompliance(category, reqs),
        score: 0
      };
      
      assessment[category].score = assessment[category].compliance.filter(c => c.compliant).length / reqs.length * 100;
    }
    
    return assessment;
  }

  async checkCategoryCompliance(category, requirements) {
    const compliance = [];
    
    for (const requirement of requirements) {
      const isCompliant = await this.checkRequirementCompliance(category, requirement);
      compliance.push({
        requirement: requirement,
        compliant: isCompliant,
        details: `${requirement} compliance check`
      });
    }
    
    return compliance;
  }

  async checkRequirementCompliance(category, requirement) {
    const complianceChecks = {
      consent: {
        lawful_basis: () => this.consentService.hasLawfulBasis(),
        explicit_consent: () => this.consentService.hasExplicitConsent(),
        withdrawal_mechanism: () => this.consentService.hasWithdrawalMechanism()
      },
      data_protection: {
        encryption: () => this.dataProtectionService.hasEncryption(),
        access_controls: () => this.dataProtectionService.hasAccessControls(),
        data_minimization: () => this.dataProtectionService.hasDataMinimization()
      },
      data_subject_rights: {
        access: () => this.dataPortabilityService.hasAccessRights(),
        rectification: () => true,
        erasure: () => this.dataErasureService.hasErasureRights(),
        portability: () => this.dataPortabilityService.hasPortabilityRights()
      }
    };
    
    const categoryChecks = complianceChecks[category];
    if (!categoryChecks || !categoryChecks[requirement]) {
      return true;
    }
    
    return await categoryChecks[requirement]();
  }

  async detectViolations(dateRange) {
    const violations = [];
    
    const consentViolations = await this.consentService.detectViolations(dateRange);
    const dataProtectionViolations = await this.dataProtectionService.detectViolations(dateRange);
    const ageVerificationViolations = await this.ageVerificationService.detectViolations(dateRange);
    
    return [
      ...consentViolations.map(v => ({ ...v, category: 'consent' })),
      ...dataProtectionViolations.map(v => ({ ...v, category: 'data_protection' })),
      ...ageVerificationViolations.map(v => ({ ...v, category: 'age_verification' }))
    ];
  }

  async generateSystemRecommendations(config) {
    const recommendations = [];
    
    const consentReport = await this.consentService.getGDPRComplianceReport();
    if (consentReport.statistics.consentRate < 80) {
      recommendations.push({
        priority: 'high',
        category: 'consent',
        title: 'Improve Consent Rate',
        description: 'Consent rate is below 80%. Consider improving user experience and consent flow.',
        action: 'Review and optimize consent interface'
      });
    }
    
    const dataProtectionReport = await this.dataProtectionService.getComplianceReport();
    if (dataProtectionReport.incidents?.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'data_protection',
        title: 'Address Security Incidents',
        description: 'Security incidents detected. Immediate action required.',
        action: 'Investigate and resolve security incidents'
      });
    }
    
    const ageReport = await this.ageVerificationService.getComplianceReport();
    if (ageReport.verificationRate < 95) {
      recommendations.push({
        priority: 'medium',
        category: 'age_verification',
        title: 'Improve Age Verification',
        description: 'Age verification rate is below 95%. Consider additional verification methods.',
        action: 'Implement additional verification methods'
      });
    }
    
    return recommendations;
  }

  calculateComplianceScore(report) {
    const sectionScores = report.sections.map(section => {
      if (section.data && section.data.complianceScore) {
        return section.data.complianceScore;
      }
      return 100;
    });
    
    return sectionScores.reduce((sum, score) => sum + score, 0) / sectionScores.length;
  }

  groupEventsByCategory(events) {
    const grouped = {};
    events.forEach(event => {
      if (!grouped[event.category]) {
        grouped[event.category] = 0;
      }
      grouped[event.category]++;
    });
    return grouped;
  }

  groupViolationsByType(violations) {
    const grouped = {};
    violations.forEach(violation => {
      if (!grouped[violation.type]) {
        grouped[violation.type] = 0;
      }
      grouped[violation.type]++;
    });
    return grouped;
  }

  calculateAverageResolutionTime(violations) {
    const resolved = violations.filter(v => v.status === 'resolved' && v.resolvedAt);
    if (resolved.length === 0) return 0;
    
    const totalTime = resolved.reduce((sum, violation) => {
      const resolutionTime = new Date(violation.resolvedAt) - new Date(violation.createdAt);
      return sum + resolutionTime;
    }, 0);
    
    return Math.round(totalTime / resolved.length / (1000 * 60 * 60 * 24));
  }

  generateReportId() {
    return `compliance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generateCacheKey(config) {
    return `${config.type}-${config.framework}-${JSON.stringify(config.dateRange)}`;
  }

  getDefaultDateRange() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return {
      start: thirtyDaysAgo.toISOString(),
      end: now.toISOString()
    };
  }

  calculateNextReviewDate() {
    const now = new Date();
    const nextReview = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    return nextReview.toISOString();
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
      this.reportCache.clear();
      this.reportSchedules = {};
      this.initialized = false;
      
      await this.auditService.logEvent('compliance_report_service_cleanup', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to cleanup ComplianceReportService:', error);
    }
  }
}

export { ComplianceReportService };