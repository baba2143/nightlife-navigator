import { LocalStorageService } from './LocalStorageService';
import { AuditLogService } from './AuditLogService';

class SecurityIncidentService {
  constructor() {
    this.initialized = false;
    this.storageService = null;
    this.auditService = null;
    this.incidents = new Map();
    this.incidentTypes = new Map();
    this.responseTeam = new Map();
    this.responsePlaybooks = new Map();
    this.evidenceStore = new Map();
    this.communicationTemplates = new Map();
    this.incidentMetrics = {
      totalIncidents: 0,
      resolvedIncidents: 0,
      averageResponseTime: 0,
      averageResolutionTime: 0,
      incidentsByType: {},
      incidentsBySeverity: {},
      falsePositives: 0,
      escalations: 0
    };
    this.alertingRules = new Map();
    this.securityStatus = {
      threatLevel: 'low',
      activeIncidents: 0,
      lastIncident: null,
      systemStatus: 'normal'
    };
    this.listeners = [];
    this.monitoringTimer = null;
    this.escalationLevels = {
      low: { timeout: 4 * 60 * 60 * 1000, assignees: ['security_team'] }, // 4 hours
      medium: { timeout: 2 * 60 * 60 * 1000, assignees: ['security_team', 'dev_team'] }, // 2 hours
      high: { timeout: 1 * 60 * 60 * 1000, assignees: ['security_team', 'dev_team', 'management'] }, // 1 hour
      critical: { timeout: 30 * 60 * 1000, assignees: ['security_team', 'dev_team', 'management', 'executive'] } // 30 minutes
    };
  }

  static getInstance() {
    if (!SecurityIncidentService.instance) {
      SecurityIncidentService.instance = new SecurityIncidentService();
    }
    return SecurityIncidentService.instance;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      this.storageService = LocalStorageService.getInstance();
      this.auditService = AuditLogService.getInstance();
      
      await this.loadIncidents();
      await this.loadIncidentTypes();
      await this.loadResponseTeam();
      await this.loadResponsePlaybooks();
      await this.loadEvidenceStore();
      await this.loadCommunicationTemplates();
      await this.loadIncidentMetrics();
      await this.loadAlertingRules();
      await this.loadSecurityStatus();
      await this.startIncidentMonitoring();
      
      this.initialized = true;
      
      await this.auditService.logEvent('security_incident_service_initialized', {
        timestamp: new Date().toISOString(),
        active_incidents: this.getActiveIncidents().length,
        response_team_size: this.responseTeam.size,
        playbooks: this.responsePlaybooks.size
      });
      
      this.emit('serviceInitialized');
    } catch (error) {
      console.error('Failed to initialize SecurityIncidentService:', error);
      throw error;
    }
  }

  async loadIncidents() {
    try {
      const incidents = await this.storageService.getItem('security_incidents');
      const incidentList = incidents || [];

      this.incidents.clear();
      incidentList.forEach(incident => {
        this.incidents.set(incident.id, incident);
      });
    } catch (error) {
      console.error('Failed to load incidents:', error);
      this.incidents.clear();
    }
  }

  async loadIncidentTypes() {
    try {
      const types = await this.storageService.getItem('incident_types');
      const typeList = types || [
        {
          id: 'data_breach',
          name: 'Data Breach',
          description: 'Unauthorized access to sensitive data',
          severity: 'critical',
          category: 'data_security',
          responseTime: 15 * 60 * 1000, // 15 minutes
          escalationPath: ['security_team', 'legal_team', 'management'],
          requiredActions: ['isolate_systems', 'preserve_evidence', 'notify_authorities', 'customer_notification'],
          playbookId: 'data_breach_playbook'
        },
        {
          id: 'malware_detected',
          name: 'Malware Detection',
          description: 'Malicious software detected on systems',
          severity: 'high',
          category: 'malware',
          responseTime: 30 * 60 * 1000, // 30 minutes
          escalationPath: ['security_team', 'it_team'],
          requiredActions: ['quarantine_system', 'scan_network', 'update_signatures'],
          playbookId: 'malware_response_playbook'
        },
        {
          id: 'ddos_attack',
          name: 'DDoS Attack',
          description: 'Distributed Denial of Service attack',
          severity: 'high',
          category: 'availability',
          responseTime: 30 * 60 * 1000, // 30 minutes
          escalationPath: ['security_team', 'network_team'],
          requiredActions: ['enable_ddos_protection', 'traffic_analysis', 'contact_isp'],
          playbookId: 'ddos_response_playbook'
        },
        {
          id: 'unauthorized_access',
          name: 'Unauthorized Access',
          description: 'Suspicious or unauthorized access attempt',
          severity: 'medium',
          category: 'access_control',
          responseTime: 60 * 60 * 1000, // 1 hour
          escalationPath: ['security_team'],
          requiredActions: ['review_access_logs', 'disable_suspicious_accounts', 'strengthen_authentication'],
          playbookId: 'unauthorized_access_playbook'
        },
        {
          id: 'phishing_attack',
          name: 'Phishing Attack',
          description: 'Phishing attempt targeting users',
          severity: 'medium',
          category: 'social_engineering',
          responseTime: 60 * 60 * 1000, // 1 hour
          escalationPath: ['security_team', 'communications_team'],
          requiredActions: ['block_phishing_domain', 'user_notification', 'security_awareness_training'],
          playbookId: 'phishing_response_playbook'
        },
        {
          id: 'insider_threat',
          name: 'Insider Threat',
          description: 'Malicious activity by internal user',
          severity: 'high',
          category: 'insider_threat',
          responseTime: 30 * 60 * 1000, // 30 minutes
          escalationPath: ['security_team', 'hr_team', 'legal_team'],
          requiredActions: ['investigate_user_activity', 'suspend_access', 'document_evidence'],
          playbookId: 'insider_threat_playbook'
        },
        {
          id: 'system_compromise',
          name: 'System Compromise',
          description: 'System has been compromised',
          severity: 'critical',
          category: 'system_security',
          responseTime: 15 * 60 * 1000, // 15 minutes
          escalationPath: ['security_team', 'it_team', 'management'],
          requiredActions: ['isolate_system', 'forensic_analysis', 'rebuild_system'],
          playbookId: 'system_compromise_playbook'
        },
        {
          id: 'vulnerability_exploitation',
          name: 'Vulnerability Exploitation',
          description: 'Active exploitation of known vulnerability',
          severity: 'high',
          category: 'vulnerability',
          responseTime: 30 * 60 * 1000, // 30 minutes
          escalationPath: ['security_team', 'dev_team'],
          requiredActions: ['patch_vulnerability', 'scan_for_indicators', 'update_security_controls'],
          playbookId: 'vulnerability_exploitation_playbook'
        }
      ];

      this.incidentTypes.clear();
      typeList.forEach(type => {
        this.incidentTypes.set(type.id, type);
      });

      await this.storageService.setItem('incident_types', typeList);
    } catch (error) {
      console.error('Failed to load incident types:', error);
      this.incidentTypes.clear();
    }
  }

  async loadResponseTeam() {
    try {
      const team = await this.storageService.getItem('response_team');
      const teamList = team || [
        {
          id: 'security_lead',
          name: 'Security Team Lead',
          role: 'incident_commander',
          email: 'security-lead@nightlife-navigator.com',
          phone: '+1-555-0101',
          expertise: ['incident_response', 'forensics', 'threat_analysis'],
          availability: '24/7',
          escalationLevel: 'all'
        },
        {
          id: 'security_analyst',
          name: 'Security Analyst',
          role: 'analyst',
          email: 'security-analyst@nightlife-navigator.com',
          phone: '+1-555-0102',
          expertise: ['log_analysis', 'threat_detection', 'malware_analysis'],
          availability: 'business_hours',
          escalationLevel: 'medium'
        },
        {
          id: 'dev_team_lead',
          name: 'Development Team Lead',
          role: 'technical_lead',
          email: 'dev-lead@nightlife-navigator.com',
          phone: '+1-555-0103',
          expertise: ['application_security', 'code_review', 'system_architecture'],
          availability: 'business_hours',
          escalationLevel: 'high'
        },
        {
          id: 'it_admin',
          name: 'IT Administrator',
          role: 'infrastructure',
          email: 'it-admin@nightlife-navigator.com',
          phone: '+1-555-0104',
          expertise: ['network_security', 'system_administration', 'backup_recovery'],
          availability: '24/7',
          escalationLevel: 'medium'
        },
        {
          id: 'legal_counsel',
          name: 'Legal Counsel',
          role: 'legal',
          email: 'legal@nightlife-navigator.com',
          phone: '+1-555-0105',
          expertise: ['privacy_law', 'compliance', 'regulatory_requirements'],
          availability: 'business_hours',
          escalationLevel: 'critical'
        },
        {
          id: 'pr_manager',
          name: 'PR Manager',
          role: 'communications',
          email: 'pr@nightlife-navigator.com',
          phone: '+1-555-0106',
          expertise: ['crisis_communication', 'media_relations', 'stakeholder_communication'],
          availability: 'business_hours',
          escalationLevel: 'critical'
        }
      ];

      this.responseTeam.clear();
      teamList.forEach(member => {
        this.responseTeam.set(member.id, member);
      });

      await this.storageService.setItem('response_team', teamList);
    } catch (error) {
      console.error('Failed to load response team:', error);
      this.responseTeam.clear();
    }
  }

  async loadResponsePlaybooks() {
    try {
      const playbooks = await this.storageService.getItem('response_playbooks');
      const playbookList = playbooks || [
        {
          id: 'data_breach_playbook',
          name: 'Data Breach Response Playbook',
          description: 'Comprehensive response plan for data breach incidents',
          incidentTypes: ['data_breach'],
          steps: [
            {
              id: 'assess_scope',
              name: 'Assess Breach Scope',
              description: 'Determine the extent and impact of the data breach',
              timeLimit: 30 * 60 * 1000, // 30 minutes
              assignee: 'security_team',
              checklist: [
                'Identify affected systems',
                'Determine data types exposed',
                'Estimate number of affected users',
                'Assess potential business impact'
              ]
            },
            {
              id: 'contain_breach',
              name: 'Contain the Breach',
              description: 'Prevent further data exposure',
              timeLimit: 60 * 60 * 1000, // 1 hour
              assignee: 'security_team',
              checklist: [
                'Isolate affected systems',
                'Revoke compromised credentials',
                'Block malicious IP addresses',
                'Preserve forensic evidence'
              ]
            },
            {
              id: 'legal_notification',
              name: 'Legal and Regulatory Notification',
              description: 'Notify relevant authorities and stakeholders',
              timeLimit: 72 * 60 * 60 * 1000, // 72 hours
              assignee: 'legal_team',
              checklist: [
                'Notify data protection authority',
                'Prepare breach notification',
                'Review regulatory requirements',
                'Document compliance activities'
              ]
            },
            {
              id: 'user_notification',
              name: 'User Notification',
              description: 'Inform affected users about the breach',
              timeLimit: 72 * 60 * 60 * 1000, // 72 hours
              assignee: 'communications_team',
              checklist: [
                'Prepare user communication',
                'Set up support channels',
                'Provide protective measures guidance',
                'Monitor user feedback'
              ]
            },
            {
              id: 'forensic_investigation',
              name: 'Forensic Investigation',
              description: 'Conduct thorough investigation',
              timeLimit: 7 * 24 * 60 * 60 * 1000, // 7 days
              assignee: 'security_team',
              checklist: [
                'Preserve digital evidence',
                'Analyze attack vectors',
                'Identify root cause',
                'Document findings'
              ]
            },
            {
              id: 'recovery_remediation',
              name: 'Recovery and Remediation',
              description: 'Restore normal operations and prevent recurrence',
              timeLimit: 30 * 24 * 60 * 60 * 1000, // 30 days
              assignee: 'security_team',
              checklist: [
                'Implement security improvements',
                'Update security policies',
                'Conduct security testing',
                'Monitor for suspicious activity'
              ]
            }
          ]
        },
        {
          id: 'ddos_response_playbook',
          name: 'DDoS Attack Response Playbook',
          description: 'Response plan for DDoS attacks',
          incidentTypes: ['ddos_attack'],
          steps: [
            {
              id: 'detect_ddos',
              name: 'Detect and Verify DDoS',
              description: 'Confirm DDoS attack and assess impact',
              timeLimit: 15 * 60 * 1000, // 15 minutes
              assignee: 'security_team',
              checklist: [
                'Analyze traffic patterns',
                'Identify attack vectors',
                'Assess service availability',
                'Estimate attack scale'
              ]
            },
            {
              id: 'activate_protection',
              name: 'Activate DDoS Protection',
              description: 'Enable DDoS mitigation measures',
              timeLimit: 30 * 60 * 1000, // 30 minutes
              assignee: 'network_team',
              checklist: [
                'Enable DDoS protection service',
                'Configure traffic filtering',
                'Implement rate limiting',
                'Redirect traffic to clean pipes'
              ]
            },
            {
              id: 'monitor_mitigate',
              name: 'Monitor and Mitigate',
              description: 'Continuously monitor and adjust mitigation',
              timeLimit: 0, // Ongoing
              assignee: 'security_team',
              checklist: [
                'Monitor traffic patterns',
                'Adjust filtering rules',
                'Communicate with ISP',
                'Document attack characteristics'
              ]
            }
          ]
        }
      ];

      this.responsePlaybooks.clear();
      playbookList.forEach(playbook => {
        this.responsePlaybooks.set(playbook.id, playbook);
      });

      await this.storageService.setItem('response_playbooks', playbookList);
    } catch (error) {
      console.error('Failed to load response playbooks:', error);
      this.responsePlaybooks.clear();
    }
  }

  async loadEvidenceStore() {
    try {
      const evidence = await this.storageService.getItem('evidence_store');
      const evidenceList = evidence || [];

      this.evidenceStore.clear();
      evidenceList.forEach(item => {
        this.evidenceStore.set(item.id, item);
      });
    } catch (error) {
      console.error('Failed to load evidence store:', error);
      this.evidenceStore.clear();
    }
  }

  async loadCommunicationTemplates() {
    try {
      const templates = await this.storageService.getItem('communication_templates');
      const templateList = templates || [
        {
          id: 'data_breach_notification',
          name: 'Data Breach User Notification',
          type: 'user_notification',
          subject: 'Important Security Notice - Data Breach',
          template: `
Dear {{user_name}},

We are writing to inform you of a security incident that may have affected your personal information stored in our Nightlife Navigator application.

**What happened:**
{{incident_description}}

**Information that may have been affected:**
{{affected_data_types}}

**What we are doing:**
{{our_response}}

**What you should do:**
{{user_actions}}

We sincerely apologize for any inconvenience this may cause. Your trust is important to us, and we are committed to protecting your personal information.

For questions, please contact our security team at security@nightlife-navigator.com.

Sincerely,
The Nightlife Navigator Security Team
          `,
          variables: ['user_name', 'incident_description', 'affected_data_types', 'our_response', 'user_actions']
        },
        {
          id: 'incident_status_update',
          name: 'Incident Status Update',
          type: 'internal_communication',
          subject: 'Security Incident Update - {{incident_id}}',
          template: `
Security Incident Update

**Incident ID:** {{incident_id}}
**Status:** {{status}}
**Severity:** {{severity}}
**Last Updated:** {{timestamp}}

**Current Situation:**
{{current_status}}

**Recent Actions:**
{{recent_actions}}

**Next Steps:**
{{next_steps}}

**Estimated Resolution:** {{eta}}

Response Team: {{team_members}}
          `,
          variables: ['incident_id', 'status', 'severity', 'timestamp', 'current_status', 'recent_actions', 'next_steps', 'eta', 'team_members']
        }
      ];

      this.communicationTemplates.clear();
      templateList.forEach(template => {
        this.communicationTemplates.set(template.id, template);
      });

      await this.storageService.setItem('communication_templates', templateList);
    } catch (error) {
      console.error('Failed to load communication templates:', error);
      this.communicationTemplates.clear();
    }
  }

  async loadIncidentMetrics() {
    try {
      const metrics = await this.storageService.getItem('incident_metrics');
      if (metrics) {
        this.incidentMetrics = { ...this.incidentMetrics, ...metrics };
      }
    } catch (error) {
      console.error('Failed to load incident metrics:', error);
    }
  }

  async loadAlertingRules() {
    try {
      const rules = await this.storageService.getItem('alerting_rules');
      const ruleList = rules || [
        {
          id: 'multiple_failed_logins',
          name: 'Multiple Failed Login Attempts',
          description: 'Detect multiple failed login attempts from same source',
          condition: 'failed_login_count > 5',
          timeWindow: 300000, // 5 minutes
          incidentType: 'unauthorized_access',
          severity: 'medium',
          enabled: true
        },
        {
          id: 'suspicious_api_usage',
          name: 'Suspicious API Usage',
          description: 'Detect abnormal API usage patterns',
          condition: 'api_requests > 1000 AND response_time > 5000',
          timeWindow: 600000, // 10 minutes
          incidentType: 'ddos_attack',
          severity: 'high',
          enabled: true
        },
        {
          id: 'privileged_access_anomaly',
          name: 'Privileged Access Anomaly',
          description: 'Detect unusual privileged access patterns',
          condition: 'admin_actions > 10 AND time_of_day NOT IN business_hours',
          timeWindow: 3600000, // 1 hour
          incidentType: 'insider_threat',
          severity: 'high',
          enabled: true
        }
      ];

      this.alertingRules.clear();
      ruleList.forEach(rule => {
        this.alertingRules.set(rule.id, rule);
      });

      await this.storageService.setItem('alerting_rules', ruleList);
    } catch (error) {
      console.error('Failed to load alerting rules:', error);
      this.alertingRules.clear();
    }
  }

  async loadSecurityStatus() {
    try {
      const status = await this.storageService.getItem('security_status');
      if (status) {
        this.securityStatus = { ...this.securityStatus, ...status };
      }
    } catch (error) {
      console.error('Failed to load security status:', error);
    }
  }

  async startIncidentMonitoring() {
    // Monitor for incident escalations every 5 minutes
    this.monitoringTimer = setInterval(async () => {
      try {
        await this.checkIncidentEscalations();
        await this.updateSecurityStatus();
      } catch (error) {
        console.error('Incident monitoring error:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    await this.auditService.logEvent('incident_monitoring_started', {
      monitoring_interval: '5 minutes',
      timestamp: new Date().toISOString()
    });
  }

  async createIncident(incidentData) {
    try {
      const incidentType = this.incidentTypes.get(incidentData.type);
      if (!incidentType) {
        throw new Error(`Unknown incident type: ${incidentData.type}`);
      }

      const incident = {
        id: this.generateIncidentId(),
        type: incidentData.type,
        title: incidentData.title || incidentType.name,
        description: incidentData.description || incidentType.description,
        severity: incidentData.severity || incidentType.severity,
        status: 'open',
        category: incidentType.category,
        source: incidentData.source || 'manual',
        reporter: incidentData.reporter || 'system',
        assignee: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        detectedAt: incidentData.detectedAt || new Date().toISOString(),
        acknowledgedAt: null,
        resolvedAt: null,
        escalationLevel: 0,
        escalationHistory: [],
        timeline: [{
          timestamp: new Date().toISOString(),
          action: 'incident_created',
          description: `Incident created: ${incident.title}`,
          user: incident.reporter
        }],
        affectedSystems: incidentData.affectedSystems || [],
        affectedUsers: incidentData.affectedUsers || 0,
        impact: incidentData.impact || 'unknown',
        artifacts: [],
        evidence: [],
        communications: [],
        responseActions: [],
        rootCause: null,
        resolution: null,
        lessons_learned: [],
        tags: incidentData.tags || []
      };

      // Auto-assign based on incident type
      if (incidentType.escalationPath && incidentType.escalationPath.length > 0) {
        incident.assignee = incidentType.escalationPath[0];
      }

      // Set playbook if available
      if (incidentType.playbookId) {
        incident.playbookId = incidentType.playbookId;
      }

      this.incidents.set(incident.id, incident);
      await this.saveIncidents();

      // Update metrics
      this.incidentMetrics.totalIncidents++;
      if (!this.incidentMetrics.incidentsByType[incident.type]) {
        this.incidentMetrics.incidentsByType[incident.type] = 0;
      }
      this.incidentMetrics.incidentsByType[incident.type]++;

      if (!this.incidentMetrics.incidentsBySeverity[incident.severity]) {
        this.incidentMetrics.incidentsBySeverity[incident.severity] = 0;
      }
      this.incidentMetrics.incidentsBySeverity[incident.severity]++;

      await this.saveIncidentMetrics();

      // Update security status
      await this.updateSecurityStatus();

      await this.auditService.logEvent('security_incident_created', {
        incident_id: incident.id,
        type: incident.type,
        severity: incident.severity,
        source: incident.source,
        reporter: incident.reporter,
        timestamp: new Date().toISOString()
      });

      this.emit('incidentCreated', incident);

      // Start playbook execution if available
      if (incident.playbookId) {
        await this.startPlaybookExecution(incident.id);
      }

      // Send notifications
      await this.sendIncidentNotifications(incident, 'created');

      return incident;
    } catch (error) {
      console.error('Failed to create incident:', error);
      throw error;
    }
  }

  async updateIncident(incidentId, updates) {
    try {
      const incident = this.incidents.get(incidentId);
      if (!incident) {
        throw new Error(`Incident ${incidentId} not found`);
      }

      const oldStatus = incident.status;
      const oldSeverity = incident.severity;
      const oldAssignee = incident.assignee;

      // Update incident properties
      Object.assign(incident, updates);
      incident.updatedAt = new Date().toISOString();

      // Add timeline entry
      const timelineEntry = {
        timestamp: new Date().toISOString(),
        action: 'incident_updated',
        description: `Incident updated`,
        user: updates.updatedBy || 'system',
        changes: updates
      };

      // Handle status changes
      if (updates.status && updates.status !== oldStatus) {
        timelineEntry.action = 'status_changed';
        timelineEntry.description = `Status changed from ${oldStatus} to ${updates.status}`;
        
        if (updates.status === 'acknowledged') {
          incident.acknowledgedAt = new Date().toISOString();
        } else if (updates.status === 'resolved') {
          incident.resolvedAt = new Date().toISOString();
          this.incidentMetrics.resolvedIncidents++;
        }
      }

      // Handle severity changes
      if (updates.severity && updates.severity !== oldSeverity) {
        timelineEntry.action = 'severity_changed';
        timelineEntry.description = `Severity changed from ${oldSeverity} to ${updates.severity}`;
      }

      // Handle assignee changes
      if (updates.assignee && updates.assignee !== oldAssignee) {
        timelineEntry.action = 'assignee_changed';
        timelineEntry.description = `Assignee changed from ${oldAssignee} to ${updates.assignee}`;
      }

      incident.timeline.push(timelineEntry);

      await this.saveIncidents();
      await this.saveIncidentMetrics();

      await this.auditService.logEvent('security_incident_updated', {
        incident_id: incidentId,
        changes: updates,
        updated_by: updates.updatedBy || 'system',
        timestamp: new Date().toISOString()
      });

      this.emit('incidentUpdated', { incident, changes: updates });

      // Send notifications for significant changes
      if (updates.status || updates.severity || updates.assignee) {
        await this.sendIncidentNotifications(incident, 'updated');
      }

      return incident;
    } catch (error) {
      console.error('Failed to update incident:', error);
      throw error;
    }
  }

  async addResponseAction(incidentId, actionData) {
    try {
      const incident = this.incidents.get(incidentId);
      if (!incident) {
        throw new Error(`Incident ${incidentId} not found`);
      }

      const action = {
        id: this.generateActionId(),
        type: actionData.type,
        description: actionData.description,
        executor: actionData.executor,
        timestamp: new Date().toISOString(),
        status: actionData.status || 'completed',
        result: actionData.result || null,
        artifacts: actionData.artifacts || []
      };

      incident.responseActions.push(action);
      incident.timeline.push({
        timestamp: action.timestamp,
        action: 'response_action_added',
        description: `Response action: ${action.description}`,
        user: action.executor
      });

      await this.saveIncidents();

      await this.auditService.logEvent('response_action_added', {
        incident_id: incidentId,
        action_id: action.id,
        action_type: action.type,
        executor: action.executor,
        timestamp: new Date().toISOString()
      });

      this.emit('responseActionAdded', { incidentId, action });

      return action;
    } catch (error) {
      console.error('Failed to add response action:', error);
      throw error;
    }
  }

  async collectEvidence(incidentId, evidenceData) {
    try {
      const incident = this.incidents.get(incidentId);
      if (!incident) {
        throw new Error(`Incident ${incidentId} not found`);
      }

      const evidence = {
        id: this.generateEvidenceId(),
        incidentId: incidentId,
        type: evidenceData.type,
        description: evidenceData.description,
        source: evidenceData.source,
        collector: evidenceData.collector,
        timestamp: new Date().toISOString(),
        hash: evidenceData.hash || null,
        chainOfCustody: [{
          timestamp: new Date().toISOString(),
          action: 'collected',
          user: evidenceData.collector,
          location: evidenceData.location || 'digital'
        }],
        metadata: evidenceData.metadata || {},
        preserved: true
      };

      this.evidenceStore.set(evidence.id, evidence);
      incident.evidence.push(evidence.id);

      incident.timeline.push({
        timestamp: evidence.timestamp,
        action: 'evidence_collected',
        description: `Evidence collected: ${evidence.description}`,
        user: evidence.collector
      });

      await this.saveIncidents();
      await this.saveEvidenceStore();

      await this.auditService.logEvent('evidence_collected', {
        incident_id: incidentId,
        evidence_id: evidence.id,
        evidence_type: evidence.type,
        collector: evidence.collector,
        timestamp: new Date().toISOString()
      });

      this.emit('evidenceCollected', { incidentId, evidence });

      return evidence;
    } catch (error) {
      console.error('Failed to collect evidence:', error);
      throw error;
    }
  }

  async startPlaybookExecution(incidentId) {
    try {
      const incident = this.incidents.get(incidentId);
      if (!incident || !incident.playbookId) {
        return;
      }

      const playbook = this.responsePlaybooks.get(incident.playbookId);
      if (!playbook) {
        throw new Error(`Playbook ${incident.playbookId} not found`);
      }

      // Initialize playbook execution
      incident.playbookExecution = {
        playbookId: playbook.id,
        startedAt: new Date().toISOString(),
        currentStep: 0,
        completedSteps: [],
        stepStatuses: {}
      };

      // Initialize all steps as pending
      playbook.steps.forEach(step => {
        incident.playbookExecution.stepStatuses[step.id] = {
          status: 'pending',
          startedAt: null,
          completedAt: null,
          assignee: step.assignee,
          checklist: step.checklist.map(item => ({ item, completed: false }))
        };
      });

      // Start first step
      if (playbook.steps.length > 0) {
        const firstStep = playbook.steps[0];
        incident.playbookExecution.stepStatuses[firstStep.id].status = 'in_progress';
        incident.playbookExecution.stepStatuses[firstStep.id].startedAt = new Date().toISOString();
      }

      incident.timeline.push({
        timestamp: new Date().toISOString(),
        action: 'playbook_started',
        description: `Started playbook: ${playbook.name}`,
        user: 'system'
      });

      await this.saveIncidents();

      await this.auditService.logEvent('playbook_execution_started', {
        incident_id: incidentId,
        playbook_id: playbook.id,
        playbook_name: playbook.name,
        timestamp: new Date().toISOString()
      });

      this.emit('playbookStarted', { incidentId, playbook });

      return incident.playbookExecution;
    } catch (error) {
      console.error('Failed to start playbook execution:', error);
      throw error;
    }
  }

  async completePlaybookStep(incidentId, stepId, completionData) {
    try {
      const incident = this.incidents.get(incidentId);
      if (!incident || !incident.playbookExecution) {
        throw new Error('Incident or playbook execution not found');
      }

      const stepStatus = incident.playbookExecution.stepStatuses[stepId];
      if (!stepStatus) {
        throw new Error(`Step ${stepId} not found in playbook execution`);
      }

      stepStatus.status = 'completed';
      stepStatus.completedAt = new Date().toISOString();
      stepStatus.completedBy = completionData.completedBy;
      stepStatus.notes = completionData.notes || null;

      // Update checklist if provided
      if (completionData.checklist) {
        stepStatus.checklist = completionData.checklist;
      }

      incident.playbookExecution.completedSteps.push(stepId);

      incident.timeline.push({
        timestamp: new Date().toISOString(),
        action: 'playbook_step_completed',
        description: `Completed playbook step: ${stepId}`,
        user: completionData.completedBy
      });

      // Start next step if available
      const playbook = this.responsePlaybooks.get(incident.playbookExecution.playbookId);
      if (playbook) {
        const currentStepIndex = playbook.steps.findIndex(step => step.id === stepId);
        if (currentStepIndex >= 0 && currentStepIndex < playbook.steps.length - 1) {
          const nextStep = playbook.steps[currentStepIndex + 1];
          incident.playbookExecution.stepStatuses[nextStep.id].status = 'in_progress';
          incident.playbookExecution.stepStatuses[nextStep.id].startedAt = new Date().toISOString();
          incident.playbookExecution.currentStep = currentStepIndex + 1;
        } else {
          // All steps completed
          incident.playbookExecution.completedAt = new Date().toISOString();
          incident.timeline.push({
            timestamp: new Date().toISOString(),
            action: 'playbook_completed',
            description: `Completed playbook: ${playbook.name}`,
            user: 'system'
          });
        }
      }

      await this.saveIncidents();

      await this.auditService.logEvent('playbook_step_completed', {
        incident_id: incidentId,
        step_id: stepId,
        completed_by: completionData.completedBy,
        timestamp: new Date().toISOString()
      });

      this.emit('playbookStepCompleted', { incidentId, stepId, stepStatus });

      return stepStatus;
    } catch (error) {
      console.error('Failed to complete playbook step:', error);
      throw error;
    }
  }

  async escalateIncident(incidentId, escalationData) {
    try {
      const incident = this.incidents.get(incidentId);
      if (!incident) {
        throw new Error(`Incident ${incidentId} not found`);
      }

      const escalation = {
        level: incident.escalationLevel + 1,
        escalatedAt: new Date().toISOString(),
        escalatedBy: escalationData.escalatedBy,
        reason: escalationData.reason,
        previousAssignee: incident.assignee,
        newAssignee: escalationData.newAssignee
      };

      incident.escalationLevel = escalation.level;
      incident.escalationHistory.push(escalation);
      incident.assignee = escalation.newAssignee;

      incident.timeline.push({
        timestamp: escalation.escalatedAt,
        action: 'incident_escalated',
        description: `Incident escalated to level ${escalation.level}. Reason: ${escalation.reason}`,
        user: escalation.escalatedBy
      });

      // Update severity if needed
      if (escalation.level >= 2 && incident.severity === 'low') {
        incident.severity = 'medium';
      } else if (escalation.level >= 3 && incident.severity === 'medium') {
        incident.severity = 'high';
      } else if (escalation.level >= 4 && incident.severity === 'high') {
        incident.severity = 'critical';
      }

      await this.saveIncidents();

      this.incidentMetrics.escalations++;
      await this.saveIncidentMetrics();

      await this.auditService.logEvent('incident_escalated', {
        incident_id: incidentId,
        escalation_level: escalation.level,
        escalated_by: escalation.escalatedBy,
        reason: escalation.reason,
        timestamp: new Date().toISOString()
      });

      this.emit('incidentEscalated', { incident, escalation });

      // Send escalation notifications
      await this.sendEscalationNotifications(incident, escalation);

      return escalation;
    } catch (error) {
      console.error('Failed to escalate incident:', error);
      throw error;
    }
  }

  async checkIncidentEscalations() {
    try {
      const activeIncidents = this.getActiveIncidents();
      const now = new Date();

      for (const incident of activeIncidents) {
        const incidentType = this.incidentTypes.get(incident.type);
        if (!incidentType) continue;

        const createdAt = new Date(incident.createdAt);
        const timeSinceCreation = now - createdAt;

        // Check if incident should be escalated based on response time
        if (timeSinceCreation > incidentType.responseTime && incident.status === 'open') {
          await this.escalateIncident(incident.id, {
            escalatedBy: 'system',
            reason: 'Response time exceeded',
            newAssignee: this.getNextEscalationAssignee(incident)
          });
        }

        // Check escalation timeouts
        const escalationConfig = this.escalationLevels[incident.severity];
        if (escalationConfig && timeSinceCreation > escalationConfig.timeout) {
          const lastEscalation = incident.escalationHistory[incident.escalationHistory.length - 1];
          if (!lastEscalation || (now - new Date(lastEscalation.escalatedAt)) > escalationConfig.timeout) {
            await this.escalateIncident(incident.id, {
              escalatedBy: 'system',
              reason: 'Escalation timeout exceeded',
              newAssignee: this.getNextEscalationAssignee(incident)
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to check incident escalations:', error);
    }
  }

  getNextEscalationAssignee(incident) {
    const incidentType = this.incidentTypes.get(incident.type);
    if (!incidentType || !incidentType.escalationPath) {
      return 'security_team';
    }

    const currentLevel = incident.escalationLevel;
    if (currentLevel < incidentType.escalationPath.length) {
      return incidentType.escalationPath[currentLevel];
    }

    return incidentType.escalationPath[incidentType.escalationPath.length - 1];
  }

  async sendIncidentNotifications(incident, eventType) {
    try {
      const teamMembers = this.getNotificationRecipients(incident);
      
      for (const member of teamMembers) {
        const notification = {
          id: this.generateNotificationId(),
          incidentId: incident.id,
          recipient: member.id,
          type: eventType,
          subject: `Security Incident ${eventType}: ${incident.title}`,
          message: this.generateNotificationMessage(incident, eventType),
          timestamp: new Date().toISOString(),
          sent: false
        };

        // In a real implementation, this would send actual notifications
        console.log(`Sending notification to ${member.name}: ${notification.subject}`);
        
        incident.communications.push(notification);
      }

      await this.saveIncidents();
    } catch (error) {
      console.error('Failed to send incident notifications:', error);
    }
  }

  async sendEscalationNotifications(incident, escalation) {
    try {
      const escalationConfig = this.escalationLevels[incident.severity];
      if (!escalationConfig) return;

      const recipients = escalationConfig.assignees.map(assignee => 
        Array.from(this.responseTeam.values()).find(member => 
          member.role === assignee || member.id === assignee
        )
      ).filter(Boolean);

      for (const recipient of recipients) {
        const notification = {
          id: this.generateNotificationId(),
          incidentId: incident.id,
          recipient: recipient.id,
          type: 'escalation',
          subject: `URGENT: Security Incident Escalated - ${incident.title}`,
          message: `Incident ${incident.id} has been escalated to level ${escalation.level}. Reason: ${escalation.reason}`,
          timestamp: new Date().toISOString(),
          sent: false
        };

        console.log(`Sending escalation notification to ${recipient.name}: ${notification.subject}`);
        
        incident.communications.push(notification);
      }

      await this.saveIncidents();
    } catch (error) {
      console.error('Failed to send escalation notifications:', error);
    }
  }

  getNotificationRecipients(incident) {
    const recipients = [];
    
    // Add assignee
    if (incident.assignee) {
      const assignee = Array.from(this.responseTeam.values()).find(member => 
        member.id === incident.assignee || member.role === incident.assignee
      );
      if (assignee) recipients.push(assignee);
    }

    // Add team members based on escalation level
    const escalationConfig = this.escalationLevels[incident.severity];
    if (escalationConfig) {
      const teamMembers = escalationConfig.assignees.map(assignee => 
        Array.from(this.responseTeam.values()).find(member => 
          member.role === assignee || member.id === assignee
        )
      ).filter(Boolean);
      
      recipients.push(...teamMembers);
    }

    // Remove duplicates
    return [...new Map(recipients.map(r => [r.id, r])).values()];
  }

  generateNotificationMessage(incident, eventType) {
    const messages = {
      created: `A new security incident has been created: ${incident.title}. Severity: ${incident.severity}. Please review and respond as needed.`,
      updated: `Security incident ${incident.id} has been updated. Current status: ${incident.status}. Please review the latest changes.`,
      escalated: `Security incident ${incident.id} has been escalated. Immediate attention required.`,
      resolved: `Security incident ${incident.id} has been resolved. Please review the resolution and lessons learned.`
    };

    return messages[eventType] || `Security incident ${incident.id} event: ${eventType}`;
  }

  async updateSecurityStatus() {
    try {
      const activeIncidents = this.getActiveIncidents();
      const criticalIncidents = activeIncidents.filter(i => i.severity === 'critical');
      const highIncidents = activeIncidents.filter(i => i.severity === 'high');

      let threatLevel = 'low';
      let systemStatus = 'normal';

      if (criticalIncidents.length > 0) {
        threatLevel = 'critical';
        systemStatus = 'critical';
      } else if (highIncidents.length > 0) {
        threatLevel = 'high';
        systemStatus = 'degraded';
      } else if (activeIncidents.length > 0) {
        threatLevel = 'medium';
        systemStatus = 'monitoring';
      }

      const lastIncident = activeIncidents.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      )[0];

      this.securityStatus = {
        threatLevel,
        activeIncidents: activeIncidents.length,
        lastIncident: lastIncident ? {
          id: lastIncident.id,
          type: lastIncident.type,
          severity: lastIncident.severity,
          createdAt: lastIncident.createdAt
        } : null,
        systemStatus,
        lastUpdated: new Date().toISOString()
      };

      await this.saveSecurityStatus();
    } catch (error) {
      console.error('Failed to update security status:', error);
    }
  }

  getActiveIncidents() {
    return Array.from(this.incidents.values())
      .filter(incident => ['open', 'acknowledged', 'investigating'].includes(incident.status));
  }

  getIncidentsByStatus(status) {
    return Array.from(this.incidents.values())
      .filter(incident => incident.status === status);
  }

  getIncidentsBySeverity(severity) {
    return Array.from(this.incidents.values())
      .filter(incident => incident.severity === severity);
  }

  getIncidentsByType(type) {
    return Array.from(this.incidents.values())
      .filter(incident => incident.type === type);
  }

  async saveIncidents() {
    try {
      const incidentList = Array.from(this.incidents.values());
      await this.storageService.setItem('security_incidents', incidentList);
    } catch (error) {
      console.error('Failed to save incidents:', error);
    }
  }

  async saveEvidenceStore() {
    try {
      const evidenceList = Array.from(this.evidenceStore.values());
      await this.storageService.setItem('evidence_store', evidenceList);
    } catch (error) {
      console.error('Failed to save evidence store:', error);
    }
  }

  async saveIncidentMetrics() {
    try {
      await this.storageService.setItem('incident_metrics', this.incidentMetrics);
    } catch (error) {
      console.error('Failed to save incident metrics:', error);
    }
  }

  async saveSecurityStatus() {
    try {
      await this.storageService.setItem('security_status', this.securityStatus);
    } catch (error) {
      console.error('Failed to save security status:', error);
    }
  }

  generateIncidentId() {
    return `INC-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }

  generateActionId() {
    return `ACT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }

  generateEvidenceId() {
    return `EVD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }

  generateNotificationId() {
    return `NOT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }

  getIncidents() {
    return Array.from(this.incidents.values());
  }

  getIncidentTypes() {
    return Array.from(this.incidentTypes.values());
  }

  getResponseTeam() {
    return Array.from(this.responseTeam.values());
  }

  getResponsePlaybooks() {
    return Array.from(this.responsePlaybooks.values());
  }

  getSecurityStatus() {
    return this.securityStatus;
  }

  getIncidentMetrics() {
    return this.incidentMetrics;
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
      if (this.monitoringTimer) {
        clearInterval(this.monitoringTimer);
        this.monitoringTimer = null;
      }

      this.listeners = [];
      this.incidents.clear();
      this.incidentTypes.clear();
      this.responseTeam.clear();
      this.responsePlaybooks.clear();
      this.evidenceStore.clear();
      this.communicationTemplates.clear();
      this.alertingRules.clear();
      this.initialized = false;
      
      await this.auditService.logEvent('security_incident_service_cleanup', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to cleanup SecurityIncidentService:', error);
    }
  }
}

export { SecurityIncidentService };