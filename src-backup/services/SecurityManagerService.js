import { LocalStorageService } from './LocalStorageService';
import { AuditLogService } from './AuditLogService';
import { SecurityScanService } from './SecurityScanService';
import { ApiSecurityService } from './ApiSecurityService';
import { EncryptionService } from './EncryptionService';
import { SecurityIncidentService } from './SecurityIncidentService';
import { AccessControlService } from './AccessControlService';

class SecurityManagerService {
  constructor() {
    this.initialized = false;
    this.storageService = null;
    this.auditService = null;
    this.securityScanService = null;
    this.apiSecurityService = null;
    this.encryptionService = null;
    this.securityIncidentService = null;
    this.accessControlService = null;
    this.securityPolicies = new Map();
    this.complianceFrameworks = new Map();
    this.securityMetrics = {
      overallSecurityScore: 0,
      vulnerabilityCount: 0,
      incidentCount: 0,
      accessViolations: 0,
      encryptionCoverage: 0,
      complianceScore: 0,
      securityTrainingCompletion: 0,
      lastAssessment: null,
      riskLevel: 'unknown'
    };
    this.securityReports = new Map();
    this.securityTraining = new Map();
    this.securityConfiguration = {
      autoResponseEnabled: true,
      alertingEnabled: true,
      encryptionMandatory: true,
      mfaRequired: false,
      deviceTrustRequired: false,
      sessionTimeoutMinutes: 30,
      passwordComplexityRequired: true,
      auditLoggingEnabled: true,
      penetrationTestingScheduled: true,
      securityTrainingMandatory: true
    };
    this.listeners = [];
    this.assessmentTimer = null;
    this.reportTimer = null;
  }

  static getInstance() {
    if (!SecurityManagerService.instance) {
      SecurityManagerService.instance = new SecurityManagerService();
    }
    return SecurityManagerService.instance;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Initialize storage and audit services
      this.storageService = LocalStorageService.getInstance();
      this.auditService = AuditLogService.getInstance();

      // Initialize all security services
      this.securityScanService = SecurityScanService.getInstance();
      this.apiSecurityService = ApiSecurityService.getInstance();
      this.encryptionService = EncryptionService.getInstance();
      this.securityIncidentService = SecurityIncidentService.getInstance();
      this.accessControlService = AccessControlService.getInstance();

      // Load configuration and data
      await this.loadSecurityPolicies();
      await this.loadComplianceFrameworks();
      await this.loadSecurityMetrics();
      await this.loadSecurityReports();
      await this.loadSecurityTraining();
      await this.loadSecurityConfiguration();

      // Initialize all security services
      await this.initializeSecurityServices();

      // Set up security monitoring
      await this.startSecurityAssessment();
      await this.startSecurityReporting();

      this.initialized = true;

      await this.auditService.logEvent('security_manager_initialized', {
        timestamp: new Date().toISOString(),
        services_initialized: [
          'SecurityScanService',
          'ApiSecurityService', 
          'EncryptionService',
          'SecurityIncidentService',
          'AccessControlService'
        ],
        security_policies: this.securityPolicies.size,
        compliance_frameworks: this.complianceFrameworks.size
      });

      this.emit('securityManagerInitialized');
      await this.performInitialSecurityAssessment();

    } catch (error) {
      console.error('Failed to initialize SecurityManagerService:', error);
      throw error;
    }
  }

  async initializeSecurityServices() {
    try {
      // Initialize security services in order
      await this.encryptionService.initialize();
      await this.accessControlService.initialize();
      await this.apiSecurityService.initialize();
      await this.securityScanService.initialize();
      await this.securityIncidentService.initialize();

      // Set up inter-service communication
      await this.setupSecurityServiceListeners();

      await this.auditService.logEvent('security_services_initialized', {
        timestamp: new Date().toISOString(),
        services: [
          'EncryptionService',
          'AccessControlService',
          'ApiSecurityService',
          'SecurityScanService',
          'SecurityIncidentService'
        ]
      });

    } catch (error) {
      console.error('Failed to initialize security services:', error);
      throw error;
    }
  }

  async setupSecurityServiceListeners() {
    try {
      // Listen for security scan results
      this.securityScanService.addEventListener('scanCompleted', async (scanResult) => {
        await this.handleSecurityScanResult(scanResult);
      });

      // Listen for security alerts
      this.securityScanService.addEventListener('securityAlert', async (alert) => {
        await this.handleSecurityAlert(alert);
      });

      // Listen for API security events
      this.apiSecurityService.addEventListener('securityAlert', async (alert) => {
        await this.handleApiSecurityAlert(alert);
      });

      // Listen for access control violations
      this.accessControlService.addEventListener('suspiciousActivity', async (activity) => {
        await this.handleSuspiciousActivity(activity);
      });

      // Listen for security incidents
      this.securityIncidentService.addEventListener('incidentCreated', async (incident) => {
        await this.handleSecurityIncident(incident);
      });

      // Listen for encryption events
      this.encryptionService.addEventListener('keyRotated', async (event) => {
        await this.handleEncryptionEvent(event);
      });

      await this.auditService.logEvent('security_service_listeners_setup', {
        timestamp: new Date().toISOString(),
        listeners_configured: 6
      });

    } catch (error) {
      console.error('Failed to setup security service listeners:', error);
    }
  }

  async loadSecurityPolicies() {
    try {
      const policies = await this.storageService.getItem('security_policies');
      const policyList = policies || [
        {
          id: 'data_protection_policy',
          name: 'Data Protection Policy',
          description: 'Comprehensive data protection and privacy policy',
          category: 'data_protection',
          requirements: [
            'All sensitive data must be encrypted at rest',
            'Data transmission must use TLS 1.2 or higher',
            'Personal data must be anonymized when possible',
            'Data retention periods must be enforced',
            'Access to personal data must be logged and monitored'
          ],
          compliance_frameworks: ['GDPR', 'CCPA', 'HIPAA'],
          enforcement_level: 'mandatory',
          last_updated: new Date().toISOString(),
          approved_by: 'Security Team',
          version: '1.0'
        },
        {
          id: 'access_control_policy',
          name: 'Access Control Policy',
          description: 'User access control and authentication policy',
          category: 'access_control',
          requirements: [
            'Multi-factor authentication required for administrative access',
            'Password complexity requirements must be enforced',
            'User accounts must be reviewed quarterly',
            'Privileged access must be logged and monitored',
            'Failed login attempts must be rate limited'
          ],
          compliance_frameworks: ['ISO27001', 'SOC2'],
          enforcement_level: 'mandatory',
          last_updated: new Date().toISOString(),
          approved_by: 'Security Team',
          version: '1.0'
        },
        {
          id: 'incident_response_policy',
          name: 'Incident Response Policy',
          description: 'Security incident detection and response policy',
          category: 'incident_response',
          requirements: [
            'Security incidents must be detected within 24 hours',
            'Critical incidents must be responded to within 1 hour',
            'All incidents must be documented and tracked',
            'Post-incident reviews must be conducted',
            'Incident response team must be trained and prepared'
          ],
          compliance_frameworks: ['ISO27001', 'NIST'],
          enforcement_level: 'mandatory',
          last_updated: new Date().toISOString(),
          approved_by: 'Security Team',
          version: '1.0'
        },
        {
          id: 'vulnerability_management_policy',
          name: 'Vulnerability Management Policy',
          description: 'Vulnerability assessment and management policy',
          category: 'vulnerability_management',
          requirements: [
            'Vulnerability scans must be performed weekly',
            'Critical vulnerabilities must be patched within 48 hours',
            'High vulnerabilities must be patched within 7 days',
            'Vulnerability scan results must be reviewed and approved',
            'Penetration testing must be performed annually'
          ],
          compliance_frameworks: ['PCI-DSS', 'ISO27001'],
          enforcement_level: 'mandatory',
          last_updated: new Date().toISOString(),
          approved_by: 'Security Team',
          version: '1.0'
        }
      ];

      this.securityPolicies.clear();
      policyList.forEach(policy => {
        this.securityPolicies.set(policy.id, policy);
      });

      await this.storageService.setItem('security_policies', policyList);
    } catch (error) {
      console.error('Failed to load security policies:', error);
      this.securityPolicies.clear();
    }
  }

  async loadComplianceFrameworks() {
    try {
      const frameworks = await this.storageService.getItem('compliance_frameworks');
      const frameworkList = frameworks || [
        {
          id: 'gdpr',
          name: 'General Data Protection Regulation',
          description: 'EU data protection and privacy regulation',
          region: 'EU',
          mandatory: true,
          requirements: [
            'Data protection by design and by default',
            'Right to be forgotten',
            'Data portability',
            'Consent management',
            'Data breach notification within 72 hours',
            'Data Protection Officer appointment',
            'Privacy impact assessments'
          ],
          controls: [
            'data_encryption',
            'access_controls',
            'audit_logging',
            'consent_management',
            'breach_notification'
          ],
          assessment_frequency: 'annual',
          last_assessment: null,
          compliance_score: 0,
          status: 'in_progress'
        },
        {
          id: 'ccpa',
          name: 'California Consumer Privacy Act',
          description: 'California state privacy law',
          region: 'US-CA',
          mandatory: true,
          requirements: [
            'Consumer right to know',
            'Consumer right to delete',
            'Consumer right to opt-out',
            'Non-discrimination',
            'Transparency in privacy practices'
          ],
          controls: [
            'data_inventory',
            'consumer_rights',
            'opt_out_mechanisms',
            'privacy_notices'
          ],
          assessment_frequency: 'annual',
          last_assessment: null,
          compliance_score: 0,
          status: 'in_progress'
        },
        {
          id: 'iso27001',
          name: 'ISO/IEC 27001',
          description: 'Information security management standard',
          region: 'Global',
          mandatory: false,
          requirements: [
            'Information security management system',
            'Risk management',
            'Security controls implementation',
            'Continuous improvement',
            'Management review and auditing'
          ],
          controls: [
            'access_control',
            'cryptography',
            'security_monitoring',
            'incident_management',
            'business_continuity'
          ],
          assessment_frequency: 'annual',
          last_assessment: null,
          compliance_score: 0,
          status: 'planned'
        },
        {
          id: 'nist_csf',
          name: 'NIST Cybersecurity Framework',
          description: 'US cybersecurity framework',
          region: 'US',
          mandatory: false,
          requirements: [
            'Identify security risks',
            'Protect critical assets',
            'Detect security events',
            'Respond to incidents',
            'Recover from incidents'
          ],
          controls: [
            'asset_management',
            'access_control',
            'security_monitoring',
            'incident_response',
            'recovery_planning'
          ],
          assessment_frequency: 'annual',
          last_assessment: null,
          compliance_score: 0,
          status: 'in_progress'
        }
      ];

      this.complianceFrameworks.clear();
      frameworkList.forEach(framework => {
        this.complianceFrameworks.set(framework.id, framework);
      });

      await this.storageService.setItem('compliance_frameworks', frameworkList);
    } catch (error) {
      console.error('Failed to load compliance frameworks:', error);
      this.complianceFrameworks.clear();
    }
  }

  async loadSecurityMetrics() {
    try {
      const metrics = await this.storageService.getItem('security_metrics');
      if (metrics) {
        this.securityMetrics = { ...this.securityMetrics, ...metrics };
      }
    } catch (error) {
      console.error('Failed to load security metrics:', error);
    }
  }

  async loadSecurityReports() {
    try {
      const reports = await this.storageService.getItem('security_reports');
      const reportList = reports || [];

      this.securityReports.clear();
      reportList.forEach(report => {
        this.securityReports.set(report.id, report);
      });
    } catch (error) {
      console.error('Failed to load security reports:', error);
      this.securityReports.clear();
    }
  }

  async loadSecurityTraining() {
    try {
      const training = await this.storageService.getItem('security_training');
      const trainingList = training || [
        {
          id: 'security_awareness',
          name: 'Security Awareness Training',
          description: 'Basic security awareness for all employees',
          mandatory: true,
          frequency: 'annual',
          duration: 120, // minutes
          modules: [
            'Password Security',
            'Phishing Awareness',
            'Social Engineering',
            'Data Protection',
            'Incident Reporting'
          ],
          completion_rate: 0,
          last_updated: new Date().toISOString()
        },
        {
          id: 'privacy_training',
          name: 'Privacy and Data Protection Training',
          description: 'GDPR and privacy compliance training',
          mandatory: true,
          frequency: 'annual',
          duration: 90, // minutes
          modules: [
            'GDPR Overview',
            'Data Subject Rights',
            'Data Processing Principles',
            'Consent Management',
            'Breach Notification'
          ],
          completion_rate: 0,
          last_updated: new Date().toISOString()
        },
        {
          id: 'incident_response_training',
          name: 'Incident Response Training',
          description: 'Security incident response procedures',
          mandatory: true,
          frequency: 'annual',
          duration: 60, // minutes
          modules: [
            'Incident Identification',
            'Response Procedures',
            'Evidence Preservation',
            'Communication Protocols',
            'Post-Incident Analysis'
          ],
          completion_rate: 0,
          last_updated: new Date().toISOString()
        }
      ];

      this.securityTraining.clear();
      trainingList.forEach(training => {
        this.securityTraining.set(training.id, training);
      });

      await this.storageService.setItem('security_training', trainingList);
    } catch (error) {
      console.error('Failed to load security training:', error);
      this.securityTraining.clear();
    }
  }

  async loadSecurityConfiguration() {
    try {
      const config = await this.storageService.getItem('security_configuration');
      if (config) {
        this.securityConfiguration = { ...this.securityConfiguration, ...config };
      }
    } catch (error) {
      console.error('Failed to load security configuration:', error);
    }
  }

  async startSecurityAssessment() {
    // Perform security assessment every 6 hours
    this.assessmentTimer = setInterval(async () => {
      try {
        await this.performSecurityAssessment();
      } catch (error) {
        console.error('Security assessment error:', error);
      }
    }, 6 * 60 * 60 * 1000); // 6 hours

    // Perform initial assessment
    await this.performSecurityAssessment();

    await this.auditService.logEvent('security_assessment_started', {
      assessment_interval: '6 hours',
      timestamp: new Date().toISOString()
    });
  }

  async startSecurityReporting() {
    // Generate security reports daily
    this.reportTimer = setInterval(async () => {
      try {
        await this.generateDailySecurityReport();
      } catch (error) {
        console.error('Security reporting error:', error);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours

    await this.auditService.logEvent('security_reporting_started', {
      reporting_interval: '24 hours',
      timestamp: new Date().toISOString()
    });
  }

  async performInitialSecurityAssessment() {
    try {
      // Perform comprehensive initial assessment
      await this.performSecurityAssessment();
      await this.assessComplianceFrameworks();
      await this.generateSecurityReport('initial_assessment');

      await this.auditService.logEvent('initial_security_assessment_completed', {
        timestamp: new Date().toISOString(),
        overall_score: this.securityMetrics.overallSecurityScore,
        risk_level: this.securityMetrics.riskLevel
      });

      this.emit('initialAssessmentCompleted', {
        metrics: this.securityMetrics,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to perform initial security assessment:', error);
    }
  }

  async performSecurityAssessment() {
    try {
      // Collect metrics from all security services
      const scanMetrics = this.securityScanService.getSecurityMetrics();
      const apiMetrics = this.apiSecurityService.getSecurityMetrics();
      const encryptionMetrics = this.encryptionService.getEncryptionMetrics();
      const incidentMetrics = this.securityIncidentService.getIncidentMetrics();
      const accessMetrics = this.accessControlService.getSecurityMetrics();

      // Calculate overall security score
      const securityScore = this.calculateSecurityScore({
        scanMetrics,
        apiMetrics,
        encryptionMetrics,
        incidentMetrics,
        accessMetrics
      });

      // Update security metrics
      this.securityMetrics = {
        ...this.securityMetrics,
        overallSecurityScore: securityScore.overall,
        vulnerabilityCount: scanMetrics.totalVulnerabilities || 0,
        incidentCount: incidentMetrics.totalIncidents || 0,
        accessViolations: accessMetrics.deniedAccesses || 0,
        encryptionCoverage: this.calculateEncryptionCoverage(encryptionMetrics),
        lastAssessment: new Date().toISOString(),
        riskLevel: this.determineRiskLevel(securityScore.overall)
      };

      await this.saveSecurityMetrics();

      await this.auditService.logEvent('security_assessment_completed', {
        overall_score: securityScore.overall,
        risk_level: this.securityMetrics.riskLevel,
        vulnerabilities: this.securityMetrics.vulnerabilityCount,
        incidents: this.securityMetrics.incidentCount,
        timestamp: new Date().toISOString()
      });

      this.emit('securityAssessmentCompleted', {
        metrics: this.securityMetrics,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to perform security assessment:', error);
    }
  }

  calculateSecurityScore(metrics) {
    const weights = {
      vulnerability: 0.3,
      incident: 0.2,
      access: 0.2,
      encryption: 0.15,
      api: 0.15
    };

    // Calculate individual scores (0-100)
    const vulnerabilityScore = Math.max(0, 100 - (metrics.scanMetrics.totalVulnerabilities || 0) * 10);
    const incidentScore = Math.max(0, 100 - (metrics.incidentMetrics.totalIncidents || 0) * 5);
    const accessScore = Math.max(0, 100 - (metrics.accessMetrics.deniedAccesses || 0) * 2);
    const encryptionScore = Math.min(100, (metrics.encryptionMetrics.totalEncryptions || 0) * 5);
    const apiScore = Math.max(0, 100 - (metrics.apiMetrics.blockedRequests || 0) * 1);

    // Calculate weighted overall score
    const overallScore = Math.round(
      vulnerabilityScore * weights.vulnerability +
      incidentScore * weights.incident +
      accessScore * weights.access +
      encryptionScore * weights.encryption +
      apiScore * weights.api
    );

    return {
      overall: overallScore,
      vulnerability: vulnerabilityScore,
      incident: incidentScore,
      access: accessScore,
      encryption: encryptionScore,
      api: apiScore
    };
  }

  calculateEncryptionCoverage(encryptionMetrics) {
    // Calculate encryption coverage percentage
    const totalOperations = encryptionMetrics.totalEncryptions + encryptionMetrics.totalDecryptions;
    const encryptionRate = totalOperations > 0 ? (encryptionMetrics.totalEncryptions / totalOperations) * 100 : 0;
    return Math.round(encryptionRate);
  }

  determineRiskLevel(securityScore) {
    if (securityScore >= 80) return 'low';
    if (securityScore >= 60) return 'medium';
    if (securityScore >= 40) return 'high';
    return 'critical';
  }

  async assessComplianceFrameworks() {
    try {
      for (const [frameworkId, framework] of this.complianceFrameworks) {
        const assessmentResult = await this.assessFrameworkCompliance(framework);
        
        framework.last_assessment = new Date().toISOString();
        framework.compliance_score = assessmentResult.score;
        framework.status = assessmentResult.status;
        framework.gaps = assessmentResult.gaps;
        framework.recommendations = assessmentResult.recommendations;
      }

      await this.saveComplianceFrameworks();

      // Calculate overall compliance score
      const frameworks = Array.from(this.complianceFrameworks.values());
      const totalScore = frameworks.reduce((sum, framework) => sum + framework.compliance_score, 0);
      this.securityMetrics.complianceScore = Math.round(totalScore / frameworks.length);

      await this.saveSecurityMetrics();

      await this.auditService.logEvent('compliance_assessment_completed', {
        frameworks_assessed: frameworks.length,
        overall_compliance_score: this.securityMetrics.complianceScore,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to assess compliance frameworks:', error);
    }
  }

  async assessFrameworkCompliance(framework) {
    try {
      const assessment = {
        score: 0,
        status: 'non_compliant',
        gaps: [],
        recommendations: []
      };

      // Assess each control
      let controlsAssessed = 0;
      let controlsPassed = 0;

      for (const control of framework.controls) {
        const controlResult = await this.assessControl(control);
        controlsAssessed++;
        
        if (controlResult.compliant) {
          controlsPassed++;
        } else {
          assessment.gaps.push({
            control: control,
            issue: controlResult.issue,
            severity: controlResult.severity
          });
          assessment.recommendations.push({
            control: control,
            recommendation: controlResult.recommendation,
            priority: controlResult.priority
          });
        }
      }

      // Calculate compliance score
      assessment.score = Math.round((controlsPassed / controlsAssessed) * 100);

      // Determine status
      if (assessment.score >= 90) {
        assessment.status = 'compliant';
      } else if (assessment.score >= 70) {
        assessment.status = 'partially_compliant';
      } else {
        assessment.status = 'non_compliant';
      }

      return assessment;
    } catch (error) {
      console.error('Failed to assess framework compliance:', error);
      return {
        score: 0,
        status: 'assessment_failed',
        gaps: [],
        recommendations: []
      };
    }
  }

  async assessControl(control) {
    // Simplified control assessment - in real implementation would be more comprehensive
    const controlAssessments = {
      data_encryption: () => {
        const encryptionMetrics = this.encryptionService.getEncryptionMetrics();
        return {
          compliant: encryptionMetrics.totalEncryptions > 0,
          issue: encryptionMetrics.totalEncryptions === 0 ? 'No encryption operations detected' : null,
          severity: 'high',
          recommendation: 'Implement data encryption for sensitive data',
          priority: 'high'
        };
      },
      access_controls: () => {
        const accessMetrics = this.accessControlService.getSecurityMetrics();
        return {
          compliant: accessMetrics.totalAccessAttempts > 0,
          issue: accessMetrics.totalAccessAttempts === 0 ? 'No access control logging detected' : null,
          severity: 'medium',
          recommendation: 'Implement comprehensive access control logging',
          priority: 'medium'
        };
      },
      audit_logging: () => {
        // Check if audit logging is enabled
        return {
          compliant: this.securityConfiguration.auditLoggingEnabled,
          issue: !this.securityConfiguration.auditLoggingEnabled ? 'Audit logging is disabled' : null,
          severity: 'high',
          recommendation: 'Enable comprehensive audit logging',
          priority: 'high'
        };
      },
      security_monitoring: () => {
        const scanMetrics = this.securityScanService.getSecurityMetrics();
        return {
          compliant: scanMetrics.totalScans > 0,
          issue: scanMetrics.totalScans === 0 ? 'No security scans detected' : null,
          severity: 'medium',
          recommendation: 'Implement regular security monitoring and scanning',
          priority: 'medium'
        };
      },
      incident_management: () => {
        const incidentMetrics = this.securityIncidentService.getIncidentMetrics();
        return {
          compliant: incidentMetrics.totalIncidents >= 0, // Always compliant if service is running
          issue: null,
          severity: 'low',
          recommendation: 'Continue maintaining incident management processes',
          priority: 'low'
        };
      }
    };

    const assessmentFunction = controlAssessments[control];
    if (assessmentFunction) {
      return assessmentFunction();
    }

    // Default assessment for unknown controls
    return {
      compliant: false,
      issue: `Control ${control} not implemented`,
      severity: 'medium',
      recommendation: `Implement ${control} control`,
      priority: 'medium'
    };
  }

  async handleSecurityScanResult(scanResult) {
    try {
      // Check if scan found critical vulnerabilities
      const criticalVulns = scanResult.vulnerabilities.filter(v => v.severity === 'critical');
      
      if (criticalVulns.length > 0) {
        // Create security incident for critical vulnerabilities
        await this.securityIncidentService.createIncident({
          type: 'vulnerability_exploitation',
          title: `Critical vulnerabilities detected in security scan`,
          description: `Security scan found ${criticalVulns.length} critical vulnerabilities`,
          severity: 'critical',
          source: 'security_scan',
          reporter: 'SecurityManagerService',
          affectedSystems: ['application'],
          tags: ['vulnerability', 'critical', 'security_scan']
        });
      }

      // Update security metrics
      this.securityMetrics.vulnerabilityCount = scanResult.totalVulnerabilities;
      await this.saveSecurityMetrics();

      await this.auditService.logEvent('security_scan_result_processed', {
        scan_id: scanResult.id,
        total_vulnerabilities: scanResult.totalVulnerabilities,
        critical_vulnerabilities: criticalVulns.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to handle security scan result:', error);
    }
  }

  async handleSecurityAlert(alert) {
    try {
      // Create security incident for high severity alerts
      if (alert.severity === 'high' || alert.severity === 'critical') {
        await this.securityIncidentService.createIncident({
          type: 'system_compromise',
          title: `Security alert: ${alert.rule_name}`,
          description: alert.message,
          severity: alert.severity,
          source: 'security_alert',
          reporter: 'SecurityManagerService',
          tags: ['alert', alert.severity, alert.rule_id]
        });
      }

      await this.auditService.logEvent('security_alert_processed', {
        alert_id: alert.id,
        severity: alert.severity,
        rule_id: alert.rule_id,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to handle security alert:', error);
    }
  }

  async handleApiSecurityAlert(alert) {
    try {
      // Create security incident for API security violations
      await this.securityIncidentService.createIncident({
        type: 'unauthorized_access',
        title: `API security alert: ${alert.ruleName}`,
        description: `API security violation detected: ${alert.condition}`,
        severity: alert.severity,
        source: 'api_security',
        reporter: 'SecurityManagerService',
        affectedSystems: ['api'],
        tags: ['api_security', alert.severity, alert.ruleId]
      });

      await this.auditService.logEvent('api_security_alert_processed', {
        alert_id: alert.id,
        rule_id: alert.ruleId,
        severity: alert.severity,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to handle API security alert:', error);
    }
  }

  async handleSuspiciousActivity(activity) {
    try {
      // Create security incident for high-risk suspicious activities
      if (activity.riskScore >= 7) {
        await this.securityIncidentService.createIncident({
          type: 'insider_threat',
          title: `Suspicious activity detected`,
          description: `High-risk suspicious activity detected (Risk Score: ${activity.riskScore})`,
          severity: activity.riskScore >= 9 ? 'critical' : 'high',
          source: 'access_control',
          reporter: 'SecurityManagerService',
          affectedUsers: 1,
          tags: ['suspicious_activity', 'high_risk', 'access_control']
        });
      }

      await this.auditService.logEvent('suspicious_activity_processed', {
        activity_id: activity.id,
        user_id: activity.userId,
        risk_score: activity.riskScore,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to handle suspicious activity:', error);
    }
  }

  async handleSecurityIncident(incident) {
    try {
      // Update security metrics
      this.securityMetrics.incidentCount++;
      await this.saveSecurityMetrics();

      // Trigger automated response if enabled
      if (this.securityConfiguration.autoResponseEnabled) {
        await this.triggerAutomatedResponse(incident);
      }

      await this.auditService.logEvent('security_incident_processed', {
        incident_id: incident.id,
        type: incident.type,
        severity: incident.severity,
        automated_response: this.securityConfiguration.autoResponseEnabled,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to handle security incident:', error);
    }
  }

  async handleEncryptionEvent(event) {
    try {
      // Log encryption events for audit purposes
      await this.auditService.logEvent('encryption_event_processed', {
        event_type: event.type,
        old_key_id: event.oldKeyId,
        new_key_id: event.newKeyId,
        timestamp: new Date().toISOString()
      });

      // Update encryption coverage metrics
      const encryptionMetrics = this.encryptionService.getEncryptionMetrics();
      this.securityMetrics.encryptionCoverage = this.calculateEncryptionCoverage(encryptionMetrics);
      await this.saveSecurityMetrics();

    } catch (error) {
      console.error('Failed to handle encryption event:', error);
    }
  }

  async triggerAutomatedResponse(incident) {
    try {
      const responseActions = [];

      // Determine automated response based on incident type and severity
      switch (incident.type) {
        case 'data_breach':
          if (incident.severity === 'critical') {
            responseActions.push('isolate_affected_systems');
            responseActions.push('notify_legal_team');
            responseActions.push('prepare_breach_notification');
          }
          break;

        case 'malware_detected':
          responseActions.push('quarantine_affected_systems');
          responseActions.push('update_antivirus_signatures');
          break;

        case 'unauthorized_access':
          responseActions.push('block_suspicious_ip');
          responseActions.push('require_password_reset');
          break;

        case 'ddos_attack':
          responseActions.push('enable_ddos_protection');
          responseActions.push('contact_isp');
          break;

        default:
          responseActions.push('increase_monitoring');
      }

      // Execute automated response actions
      for (const action of responseActions) {
        await this.executeAutomatedAction(incident, action);
      }

      await this.auditService.logEvent('automated_response_triggered', {
        incident_id: incident.id,
        actions: responseActions,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to trigger automated response:', error);
    }
  }

  async executeAutomatedAction(incident, action) {
    try {
      const actionResults = {
        isolate_affected_systems: async () => {
          // Simulate system isolation
          console.log(`Isolating affected systems for incident ${incident.id}`);
          return { success: true, message: 'Systems isolated successfully' };
        },
        
        quarantine_affected_systems: async () => {
          // Simulate system quarantine
          console.log(`Quarantining affected systems for incident ${incident.id}`);
          return { success: true, message: 'Systems quarantined successfully' };
        },
        
        block_suspicious_ip: async () => {
          // Block suspicious IP if available
          if (incident.affectedSystems && incident.affectedSystems.includes('api')) {
            console.log(`Blocking suspicious IP for incident ${incident.id}`);
            return { success: true, message: 'IP blocked successfully' };
          }
          return { success: false, message: 'No IP to block' };
        },
        
        enable_ddos_protection: async () => {
          // Enable DDoS protection
          console.log(`Enabling DDoS protection for incident ${incident.id}`);
          return { success: true, message: 'DDoS protection enabled' };
        },
        
        increase_monitoring: async () => {
          // Increase monitoring intensity
          console.log(`Increasing monitoring for incident ${incident.id}`);
          return { success: true, message: 'Monitoring increased' };
        }
      };

      const actionFunction = actionResults[action];
      if (actionFunction) {
        const result = await actionFunction();
        
        // Log the action result
        await this.securityIncidentService.addResponseAction(incident.id, {
          type: 'automated',
          description: `Automated action: ${action}`,
          executor: 'SecurityManagerService',
          status: result.success ? 'completed' : 'failed',
          result: result.message
        });

        return result;
      }

      return { success: false, message: `Unknown action: ${action}` };
    } catch (error) {
      console.error('Failed to execute automated action:', error);
      return { success: false, message: error.message };
    }
  }

  async generateSecurityReport(reportType = 'comprehensive') {
    try {
      const report = {
        id: this.generateReportId(),
        type: reportType,
        generated_at: new Date().toISOString(),
        generated_by: 'SecurityManagerService',
        period: {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Last 24 hours
          end: new Date().toISOString()
        },
        metrics: { ...this.securityMetrics },
        compliance: this.getComplianceStatus(),
        vulnerabilities: await this.getVulnerabilityReport(),
        incidents: await this.getIncidentReport(),
        recommendations: await this.generateSecurityRecommendations(),
        executive_summary: await this.generateExecutiveSummary()
      };

      this.securityReports.set(report.id, report);
      await this.saveSecurityReports();

      await this.auditService.logEvent('security_report_generated', {
        report_id: report.id,
        report_type: reportType,
        overall_score: report.metrics.overallSecurityScore,
        timestamp: new Date().toISOString()
      });

      this.emit('securityReportGenerated', report);
      return report;

    } catch (error) {
      console.error('Failed to generate security report:', error);
      throw error;
    }
  }

  async generateDailySecurityReport() {
    try {
      const report = await this.generateSecurityReport('daily');
      
      // Send report to stakeholders if configured
      if (this.securityConfiguration.alertingEnabled) {
        await this.sendSecurityReport(report);
      }

      return report;
    } catch (error) {
      console.error('Failed to generate daily security report:', error);
    }
  }

  async sendSecurityReport(report) {
    try {
      // In a real implementation, this would send the report via email/messaging
      console.log(`Sending security report ${report.id} to stakeholders`);
      
      await this.auditService.logEvent('security_report_sent', {
        report_id: report.id,
        report_type: report.type,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to send security report:', error);
    }
  }

  getComplianceStatus() {
    const frameworks = Array.from(this.complianceFrameworks.values());
    return frameworks.map(framework => ({
      id: framework.id,
      name: framework.name,
      status: framework.status,
      score: framework.compliance_score,
      last_assessment: framework.last_assessment
    }));
  }

  async getVulnerabilityReport() {
    try {
      const scanMetrics = this.securityScanService.getSecurityMetrics();
      const recentScans = await this.securityScanService.getScanHistory(5);
      
      return {
        total_vulnerabilities: scanMetrics.totalVulnerabilities || 0,
        critical_vulnerabilities: scanMetrics.criticalVulnerabilities || 0,
        high_vulnerabilities: scanMetrics.highVulnerabilities || 0,
        medium_vulnerabilities: scanMetrics.mediumVulnerabilities || 0,
        low_vulnerabilities: scanMetrics.lowVulnerabilities || 0,
        recent_scans: recentScans.length,
        last_scan: recentScans[0]?.timestamp || null
      };
    } catch (error) {
      console.error('Failed to get vulnerability report:', error);
      return {
        total_vulnerabilities: 0,
        critical_vulnerabilities: 0,
        high_vulnerabilities: 0,
        medium_vulnerabilities: 0,
        low_vulnerabilities: 0,
        recent_scans: 0,
        last_scan: null
      };
    }
  }

  async getIncidentReport() {
    try {
      const incidentMetrics = this.securityIncidentService.getIncidentMetrics();
      const activeIncidents = this.securityIncidentService.getActiveIncidents();
      
      return {
        total_incidents: incidentMetrics.totalIncidents || 0,
        resolved_incidents: incidentMetrics.resolvedIncidents || 0,
        active_incidents: activeIncidents.length,
        average_response_time: incidentMetrics.averageResponseTime || 0,
        average_resolution_time: incidentMetrics.averageResolutionTime || 0,
        incident_types: incidentMetrics.incidentsByType || {}
      };
    } catch (error) {
      console.error('Failed to get incident report:', error);
      return {
        total_incidents: 0,
        resolved_incidents: 0,
        active_incidents: 0,
        average_response_time: 0,
        average_resolution_time: 0,
        incident_types: {}
      };
    }
  }

  async generateSecurityRecommendations() {
    const recommendations = [];
    
    // Analyze security metrics and generate recommendations
    if (this.securityMetrics.overallSecurityScore < 70) {
      recommendations.push({
        priority: 'high',
        category: 'overall_security',
        recommendation: 'Overall security score is below acceptable threshold',
        action: 'Conduct comprehensive security review and implement recommended improvements'
      });
    }

    if (this.securityMetrics.vulnerabilityCount > 10) {
      recommendations.push({
        priority: 'high',
        category: 'vulnerability_management',
        recommendation: 'High number of vulnerabilities detected',
        action: 'Prioritize vulnerability remediation and increase scan frequency'
      });
    }

    if (this.securityMetrics.incidentCount > 5) {
      recommendations.push({
        priority: 'medium',
        category: 'incident_response',
        recommendation: 'Elevated incident count detected',
        action: 'Review incident patterns and strengthen preventive controls'
      });
    }

    if (this.securityMetrics.encryptionCoverage < 80) {
      recommendations.push({
        priority: 'medium',
        category: 'encryption',
        recommendation: 'Encryption coverage below recommended level',
        action: 'Increase encryption usage for sensitive data operations'
      });
    }

    if (this.securityMetrics.complianceScore < 80) {
      recommendations.push({
        priority: 'medium',
        category: 'compliance',
        recommendation: 'Compliance score below target',
        action: 'Address compliance gaps and implement missing controls'
      });
    }

    return recommendations;
  }

  async generateExecutiveSummary() {
    const summary = {
      security_posture: this.securityMetrics.riskLevel,
      overall_score: this.securityMetrics.overallSecurityScore,
      key_metrics: {
        vulnerabilities: this.securityMetrics.vulnerabilityCount,
        incidents: this.securityMetrics.incidentCount,
        compliance_score: this.securityMetrics.complianceScore
      },
      trend: 'stable', // Would be calculated based on historical data
      top_risks: [
        'Vulnerability management',
        'Incident response',
        'Compliance gaps'
      ],
      immediate_actions: [
        'Address critical vulnerabilities',
        'Review incident response procedures',
        'Strengthen compliance controls'
      ]
    };

    return summary;
  }

  async saveSecurityMetrics() {
    try {
      await this.storageService.setItem('security_metrics', this.securityMetrics);
    } catch (error) {
      console.error('Failed to save security metrics:', error);
    }
  }

  async saveSecurityReports() {
    try {
      const reportList = Array.from(this.securityReports.values());
      await this.storageService.setItem('security_reports', reportList);
    } catch (error) {
      console.error('Failed to save security reports:', error);
    }
  }

  async saveComplianceFrameworks() {
    try {
      const frameworkList = Array.from(this.complianceFrameworks.values());
      await this.storageService.setItem('compliance_frameworks', frameworkList);
    } catch (error) {
      console.error('Failed to save compliance frameworks:', error);
    }
  }

  generateReportId() {
    return `SEC-RPT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }

  getSecurityMetrics() {
    return this.securityMetrics;
  }

  getSecurityPolicies() {
    return Array.from(this.securityPolicies.values());
  }

  getComplianceFrameworks() {
    return Array.from(this.complianceFrameworks.values());
  }

  getSecurityReports() {
    return Array.from(this.securityReports.values());
  }

  getSecurityConfiguration() {
    return this.securityConfiguration;
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
      if (this.assessmentTimer) {
        clearInterval(this.assessmentTimer);
        this.assessmentTimer = null;
      }

      if (this.reportTimer) {
        clearInterval(this.reportTimer);
        this.reportTimer = null;
      }

      // Cleanup all security services
      await this.securityScanService.cleanup();
      await this.apiSecurityService.cleanup();
      await this.encryptionService.cleanup();
      await this.securityIncidentService.cleanup();
      await this.accessControlService.cleanup();

      this.listeners = [];
      this.securityPolicies.clear();
      this.complianceFrameworks.clear();
      this.securityReports.clear();
      this.securityTraining.clear();
      this.initialized = false;
      
      await this.auditService.logEvent('security_manager_cleanup', {
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to cleanup SecurityManagerService:', error);
    }
  }
}

export { SecurityManagerService };