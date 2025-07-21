import { LocalStorageService } from './LocalStorageService';
import { AuditLogService } from './AuditLogService';

class AccessControlService {
  constructor() {
    this.initialized = false;
    this.storageService = null;
    this.auditService = null;
    this.accessPolicies = new Map();
    this.userSessions = new Map();
    this.accessAttempts = new Map();
    this.suspiciousActivities = new Map();
    this.blockedUsers = new Set();
    this.blockedIPs = new Set();
    this.trustedDevices = new Map();
    this.accessRules = new Map();
    this.behaviorProfiles = new Map();
    this.securityMetrics = {
      totalAccessAttempts: 0,
      deniedAccesses: 0,
      suspiciousActivities: 0,
      blockedUsers: 0,
      blockedIPs: 0,
      deviceRegistrations: 0,
      behaviorAnomalies: 0
    };
    this.detectionRules = new Map();
    this.alertThresholds = {
      failedLogins: 5,
      timeWindow: 300000, // 5 minutes
      suspiciousPatterns: 3,
      velocityThreshold: 10,
      geolocationDistance: 1000 // km
    };
    this.listeners = [];
    this.monitoringTimer = null;
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
  }

  static getInstance() {
    if (!AccessControlService.instance) {
      AccessControlService.instance = new AccessControlService();
    }
    return AccessControlService.instance;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      this.storageService = LocalStorageService.getInstance();
      this.auditService = AuditLogService.getInstance();
      
      await this.loadAccessPolicies();
      await this.loadUserSessions();
      await this.loadAccessAttempts();
      await this.loadSuspiciousActivities();
      await this.loadBlockedUsers();
      await this.loadBlockedIPs();
      await this.loadTrustedDevices();
      await this.loadAccessRules();
      await this.loadBehaviorProfiles();
      await this.loadDetectionRules();
      await this.loadSecurityMetrics();
      await this.loadAlertThresholds();
      await this.startAccessMonitoring();
      
      this.initialized = true;
      
      await this.auditService.logEvent('access_control_service_initialized', {
        timestamp: new Date().toISOString(),
        access_policies: this.accessPolicies.size,
        active_sessions: this.userSessions.size,
        detection_rules: this.detectionRules.size,
        blocked_users: this.blockedUsers.size,
        blocked_ips: this.blockedIPs.size
      });
      
      this.emit('serviceInitialized');
    } catch (error) {
      console.error('Failed to initialize AccessControlService:', error);
      throw error;
    }
  }

  async loadAccessPolicies() {
    try {
      const policies = await this.storageService.getItem('access_policies');
      const policyList = policies || [
        {
          id: 'default_policy',
          name: 'Default Access Policy',
          description: 'Standard access control for regular users',
          userRoles: ['user'],
          permissions: ['read', 'write'],
          restrictions: {
            timeRestrictions: [],
            locationRestrictions: [],
            deviceRestrictions: [],
            ipRestrictions: []
          },
          requirements: {
            authentication: true,
            mfa: false,
            deviceTrust: false,
            ipWhitelist: false
          },
          enabled: true
        },
        {
          id: 'admin_policy',
          name: 'Administrator Access Policy',
          description: 'Enhanced access control for administrators',
          userRoles: ['admin'],
          permissions: ['read', 'write', 'delete', 'admin'],
          restrictions: {
            timeRestrictions: [],
            locationRestrictions: [],
            deviceRestrictions: [],
            ipRestrictions: []
          },
          requirements: {
            authentication: true,
            mfa: true,
            deviceTrust: true,
            ipWhitelist: false
          },
          enabled: true
        },
        {
          id: 'premium_policy',
          name: 'Premium User Access Policy',
          description: 'Extended access for premium users',
          userRoles: ['premium'],
          permissions: ['read', 'write', 'premium'],
          restrictions: {
            timeRestrictions: [],
            locationRestrictions: [],
            deviceRestrictions: [],
            ipRestrictions: []
          },
          requirements: {
            authentication: true,
            mfa: false,
            deviceTrust: false,
            ipWhitelist: false
          },
          enabled: true
        },
        {
          id: 'restricted_policy',
          name: 'Restricted Access Policy',
          description: 'Limited access for restricted users',
          userRoles: ['restricted'],
          permissions: ['read'],
          restrictions: {
            timeRestrictions: [{
              start: '09:00',
              end: '17:00',
              timezone: 'UTC'
            }],
            locationRestrictions: [],
            deviceRestrictions: [],
            ipRestrictions: []
          },
          requirements: {
            authentication: true,
            mfa: true,
            deviceTrust: true,
            ipWhitelist: true
          },
          enabled: true
        }
      ];

      this.accessPolicies.clear();
      policyList.forEach(policy => {
        this.accessPolicies.set(policy.id, policy);
      });

      await this.storageService.setItem('access_policies', policyList);
    } catch (error) {
      console.error('Failed to load access policies:', error);
      this.accessPolicies.clear();
    }
  }

  async loadUserSessions() {
    try {
      const sessions = await this.storageService.getItem('user_sessions');
      const sessionList = sessions || [];

      this.userSessions.clear();
      sessionList.forEach(session => {
        this.userSessions.set(session.id, session);
      });

      // Clean up expired sessions
      await this.cleanupExpiredSessions();
    } catch (error) {
      console.error('Failed to load user sessions:', error);
      this.userSessions.clear();
    }
  }

  async loadAccessAttempts() {
    try {
      const attempts = await this.storageService.getItem('access_attempts');
      const attemptList = attempts || [];

      this.accessAttempts.clear();
      attemptList.forEach(attempt => {
        if (!this.accessAttempts.has(attempt.identifier)) {
          this.accessAttempts.set(attempt.identifier, []);
        }
        this.accessAttempts.get(attempt.identifier).push(attempt);
      });

      // Clean up old attempts
      await this.cleanupOldAttempts();
    } catch (error) {
      console.error('Failed to load access attempts:', error);
      this.accessAttempts.clear();
    }
  }

  async loadSuspiciousActivities() {
    try {
      const activities = await this.storageService.getItem('suspicious_activities');
      const activityList = activities || [];

      this.suspiciousActivities.clear();
      activityList.forEach(activity => {
        this.suspiciousActivities.set(activity.id, activity);
      });
    } catch (error) {
      console.error('Failed to load suspicious activities:', error);
      this.suspiciousActivities.clear();
    }
  }

  async loadBlockedUsers() {
    try {
      const blocked = await this.storageService.getItem('blocked_users');
      const blockedList = blocked || [];

      this.blockedUsers.clear();
      blockedList.forEach(userId => {
        this.blockedUsers.add(userId);
      });
    } catch (error) {
      console.error('Failed to load blocked users:', error);
      this.blockedUsers.clear();
    }
  }

  async loadBlockedIPs() {
    try {
      const blocked = await this.storageService.getItem('blocked_ips');
      const blockedList = blocked || [];

      this.blockedIPs.clear();
      blockedList.forEach(ip => {
        this.blockedIPs.add(ip);
      });
    } catch (error) {
      console.error('Failed to load blocked IPs:', error);
      this.blockedIPs.clear();
    }
  }

  async loadTrustedDevices() {
    try {
      const devices = await this.storageService.getItem('trusted_devices');
      const deviceList = devices || [];

      this.trustedDevices.clear();
      deviceList.forEach(device => {
        this.trustedDevices.set(device.id, device);
      });
    } catch (error) {
      console.error('Failed to load trusted devices:', error);
      this.trustedDevices.clear();
    }
  }

  async loadAccessRules() {
    try {
      const rules = await this.storageService.getItem('access_rules');
      const ruleList = rules || [
        {
          id: 'business_hours_rule',
          name: 'Business Hours Access Rule',
          description: 'Restrict access to business hours for certain users',
          condition: 'user.role === "employee" && time_of_day NOT IN business_hours',
          action: 'deny',
          priority: 1,
          enabled: true
        },
        {
          id: 'geolocation_rule',
          name: 'Geolocation Restriction Rule',
          description: 'Block access from unauthorized locations',
          condition: 'location.country NOT IN allowed_countries',
          action: 'deny',
          priority: 2,
          enabled: true
        },
        {
          id: 'device_trust_rule',
          name: 'Device Trust Rule',
          description: 'Require device trust for sensitive operations',
          condition: 'operation.sensitivity === "high" && device.trusted === false',
          action: 'require_verification',
          priority: 3,
          enabled: true
        },
        {
          id: 'velocity_rule',
          name: 'Access Velocity Rule',
          description: 'Detect abnormal access patterns',
          condition: 'access_frequency > normal_threshold',
          action: 'flag_suspicious',
          priority: 4,
          enabled: true
        }
      ];

      this.accessRules.clear();
      ruleList.forEach(rule => {
        this.accessRules.set(rule.id, rule);
      });

      await this.storageService.setItem('access_rules', ruleList);
    } catch (error) {
      console.error('Failed to load access rules:', error);
      this.accessRules.clear();
    }
  }

  async loadBehaviorProfiles() {
    try {
      const profiles = await this.storageService.getItem('behavior_profiles');
      const profileList = profiles || [];

      this.behaviorProfiles.clear();
      profileList.forEach(profile => {
        this.behaviorProfiles.set(profile.userId, profile);
      });
    } catch (error) {
      console.error('Failed to load behavior profiles:', error);
      this.behaviorProfiles.clear();
    }
  }

  async loadDetectionRules() {
    try {
      const rules = await this.storageService.getItem('detection_rules');
      const ruleList = rules || [
        {
          id: 'multiple_failed_logins',
          name: 'Multiple Failed Login Attempts',
          description: 'Detect multiple failed login attempts',
          pattern: 'failed_logins >= 5 within 5_minutes',
          severity: 'high',
          action: 'block_user',
          enabled: true
        },
        {
          id: 'unusual_location',
          name: 'Unusual Location Access',
          description: 'Detect access from unusual locations',
          pattern: 'location.distance > 1000km from last_location within 1_hour',
          severity: 'medium',
          action: 'require_verification',
          enabled: true
        },
        {
          id: 'rapid_requests',
          name: 'Rapid API Requests',
          description: 'Detect abnormally rapid API requests',
          pattern: 'api_requests > 100 within 1_minute',
          severity: 'medium',
          action: 'rate_limit',
          enabled: true
        },
        {
          id: 'privilege_escalation',
          name: 'Privilege Escalation Attempt',
          description: 'Detect attempts to escalate privileges',
          pattern: 'privilege_change OR admin_access_attempt',
          severity: 'critical',
          action: 'block_immediately',
          enabled: true
        },
        {
          id: 'off_hours_access',
          name: 'Off-Hours Access',
          description: 'Detect access during unusual hours',
          pattern: 'access_time NOT IN user.typical_hours',
          severity: 'low',
          action: 'log_suspicious',
          enabled: true
        },
        {
          id: 'concurrent_sessions',
          name: 'Concurrent Session Detection',
          description: 'Detect multiple concurrent sessions',
          pattern: 'active_sessions > 3 for same_user',
          severity: 'medium',
          action: 'terminate_oldest_session',
          enabled: true
        }
      ];

      this.detectionRules.clear();
      ruleList.forEach(rule => {
        this.detectionRules.set(rule.id, rule);
      });

      await this.storageService.setItem('detection_rules', ruleList);
    } catch (error) {
      console.error('Failed to load detection rules:', error);
      this.detectionRules.clear();
    }
  }

  async loadSecurityMetrics() {
    try {
      const metrics = await this.storageService.getItem('access_control_metrics');
      if (metrics) {
        this.securityMetrics = { ...this.securityMetrics, ...metrics };
      }
    } catch (error) {
      console.error('Failed to load security metrics:', error);
    }
  }

  async loadAlertThresholds() {
    try {
      const thresholds = await this.storageService.getItem('alert_thresholds');
      if (thresholds) {
        this.alertThresholds = { ...this.alertThresholds, ...thresholds };
      }
    } catch (error) {
      console.error('Failed to load alert thresholds:', error);
    }
  }

  async startAccessMonitoring() {
    // Monitor access patterns and sessions every 2 minutes
    this.monitoringTimer = setInterval(async () => {
      try {
        await this.monitorAccessPatterns();
        await this.cleanupExpiredSessions();
        await this.cleanupOldAttempts();
        await this.analyzeUserBehavior();
      } catch (error) {
        console.error('Access monitoring error:', error);
      }
    }, 2 * 60 * 1000); // 2 minutes

    await this.auditService.logEvent('access_monitoring_started', {
      monitoring_interval: '2 minutes',
      timestamp: new Date().toISOString()
    });
  }

  async validateAccess(accessRequest) {
    try {
      const validation = {
        allowed: true,
        reason: null,
        requiresVerification: false,
        requiresMFA: false,
        restrictions: [],
        policy: null
      };

      // Check if IP is blocked
      if (this.blockedIPs.has(accessRequest.ip)) {
        validation.allowed = false;
        validation.reason = 'IP address is blocked';
        await this.logAccessAttempt(accessRequest, 'denied', validation.reason);
        return validation;
      }

      // Check if user is blocked
      if (this.blockedUsers.has(accessRequest.userId)) {
        validation.allowed = false;
        validation.reason = 'User is blocked';
        await this.logAccessAttempt(accessRequest, 'denied', validation.reason);
        return validation;
      }

      // Get applicable access policy
      const policy = this.getApplicablePolicy(accessRequest.userRole);
      validation.policy = policy;

      if (!policy) {
        validation.allowed = false;
        validation.reason = 'No applicable access policy';
        await this.logAccessAttempt(accessRequest, 'denied', validation.reason);
        return validation;
      }

      // Check authentication requirements
      if (policy.requirements.authentication && !accessRequest.authenticated) {
        validation.allowed = false;
        validation.reason = 'Authentication required';
        await this.logAccessAttempt(accessRequest, 'denied', validation.reason);
        return validation;
      }

      // Check MFA requirements
      if (policy.requirements.mfa && !accessRequest.mfaVerified) {
        validation.requiresMFA = true;
        validation.reason = 'MFA verification required';
      }

      // Check device trust requirements
      if (policy.requirements.deviceTrust && !this.isDeviceTrusted(accessRequest.deviceId, accessRequest.userId)) {
        validation.requiresVerification = true;
        validation.reason = 'Device trust verification required';
      }

      // Check IP whitelist requirements
      if (policy.requirements.ipWhitelist && !this.isIPWhitelisted(accessRequest.ip)) {
        validation.allowed = false;
        validation.reason = 'IP not in whitelist';
        await this.logAccessAttempt(accessRequest, 'denied', validation.reason);
        return validation;
      }

      // Check access rules
      const ruleViolations = await this.checkAccessRules(accessRequest);
      if (ruleViolations.length > 0) {
        const criticalViolations = ruleViolations.filter(v => v.action === 'deny');
        if (criticalViolations.length > 0) {
          validation.allowed = false;
          validation.reason = `Access rule violation: ${criticalViolations[0].rule}`;
          await this.logAccessAttempt(accessRequest, 'denied', validation.reason);
          return validation;
        }

        const verificationViolations = ruleViolations.filter(v => v.action === 'require_verification');
        if (verificationViolations.length > 0) {
          validation.requiresVerification = true;
          validation.reason = `Verification required: ${verificationViolations[0].rule}`;
        }
      }

      // Check detection rules
      const suspiciousActivities = await this.checkDetectionRules(accessRequest);
      if (suspiciousActivities.length > 0) {
        await this.flagSuspiciousActivity(accessRequest, suspiciousActivities);
        
        const criticalActivities = suspiciousActivities.filter(a => a.severity === 'critical');
        if (criticalActivities.length > 0) {
          validation.allowed = false;
          validation.reason = `Suspicious activity detected: ${criticalActivities[0].name}`;
          await this.logAccessAttempt(accessRequest, 'denied', validation.reason);
          return validation;
        }
      }

      // Check time restrictions
      if (policy.restrictions.timeRestrictions.length > 0) {
        const timeViolation = this.checkTimeRestrictions(accessRequest, policy.restrictions.timeRestrictions);
        if (timeViolation) {
          validation.allowed = false;
          validation.reason = 'Access denied due to time restrictions';
          await this.logAccessAttempt(accessRequest, 'denied', validation.reason);
          return validation;
        }
      }

      // Check location restrictions
      if (policy.restrictions.locationRestrictions.length > 0) {
        const locationViolation = this.checkLocationRestrictions(accessRequest, policy.restrictions.locationRestrictions);
        if (locationViolation) {
          validation.allowed = false;
          validation.reason = 'Access denied due to location restrictions';
          await this.logAccessAttempt(accessRequest, 'denied', validation.reason);
          return validation;
        }
      }

      // Log successful access attempt
      await this.logAccessAttempt(accessRequest, 'allowed', validation.reason);

      // Update behavior profile
      await this.updateBehaviorProfile(accessRequest);

      return validation;
    } catch (error) {
      console.error('Failed to validate access:', error);
      return {
        allowed: false,
        reason: 'Access validation error',
        requiresVerification: false,
        requiresMFA: false,
        restrictions: [],
        policy: null
      };
    }
  }

  async checkAccessRules(accessRequest) {
    const violations = [];
    
    try {
      const enabledRules = Array.from(this.accessRules.values())
        .filter(rule => rule.enabled)
        .sort((a, b) => a.priority - b.priority);

      for (const rule of enabledRules) {
        const violation = await this.evaluateRule(rule, accessRequest);
        if (violation) {
          violations.push({
            rule: rule.name,
            action: rule.action,
            condition: rule.condition
          });
        }
      }
    } catch (error) {
      console.error('Failed to check access rules:', error);
    }

    return violations;
  }

  async checkDetectionRules(accessRequest) {
    const suspiciousActivities = [];
    
    try {
      const enabledRules = Array.from(this.detectionRules.values())
        .filter(rule => rule.enabled);

      for (const rule of enabledRules) {
        const detected = await this.evaluateDetectionRule(rule, accessRequest);
        if (detected) {
          suspiciousActivities.push({
            id: rule.id,
            name: rule.name,
            severity: rule.severity,
            action: rule.action,
            pattern: rule.pattern
          });
        }
      }
    } catch (error) {
      console.error('Failed to check detection rules:', error);
    }

    return suspiciousActivities;
  }

  async evaluateRule(rule, accessRequest) {
    // Simplified rule evaluation - in real implementation would use a proper rule engine
    const { condition } = rule;
    
    try {
      if (condition.includes('time_of_day NOT IN business_hours')) {
        return this.isOutsideBusinessHours(accessRequest.timestamp);
      }
      
      if (condition.includes('location.country NOT IN allowed_countries')) {
        return this.isLocationRestricted(accessRequest.location);
      }
      
      if (condition.includes('device.trusted === false')) {
        return !this.isDeviceTrusted(accessRequest.deviceId, accessRequest.userId);
      }
      
      if (condition.includes('access_frequency > normal_threshold')) {
        return this.isAccessFrequencyAbnormal(accessRequest.userId);
      }
      
      return false;
    } catch (error) {
      console.error('Failed to evaluate rule:', error);
      return false;
    }
  }

  async evaluateDetectionRule(rule, accessRequest) {
    // Simplified detection rule evaluation
    const { pattern } = rule;
    
    try {
      if (pattern.includes('failed_logins >= 5 within 5_minutes')) {
        return this.checkFailedLoginPattern(accessRequest);
      }
      
      if (pattern.includes('location.distance > 1000km')) {
        return this.checkUnusualLocation(accessRequest);
      }
      
      if (pattern.includes('api_requests > 100 within 1_minute')) {
        return this.checkRapidRequests(accessRequest);
      }
      
      if (pattern.includes('privilege_change OR admin_access_attempt')) {
        return this.checkPrivilegeEscalation(accessRequest);
      }
      
      if (pattern.includes('access_time NOT IN user.typical_hours')) {
        return this.checkOffHoursAccess(accessRequest);
      }
      
      if (pattern.includes('active_sessions > 3 for same_user')) {
        return this.checkConcurrentSessions(accessRequest);
      }
      
      return false;
    } catch (error) {
      console.error('Failed to evaluate detection rule:', error);
      return false;
    }
  }

  checkFailedLoginPattern(accessRequest) {
    if (accessRequest.result !== 'failed_login') return false;
    
    const identifier = accessRequest.userId || accessRequest.ip;
    const attempts = this.accessAttempts.get(identifier) || [];
    const recentAttempts = attempts.filter(attempt => 
      attempt.result === 'failed_login' && 
      (Date.now() - new Date(attempt.timestamp).getTime()) < this.alertThresholds.timeWindow
    );
    
    return recentAttempts.length >= this.alertThresholds.failedLogins;
  }

  checkUnusualLocation(accessRequest) {
    if (!accessRequest.location || !accessRequest.userId) return false;
    
    const behaviorProfile = this.behaviorProfiles.get(accessRequest.userId);
    if (!behaviorProfile || !behaviorProfile.typicalLocations) return false;
    
    const { latitude, longitude } = accessRequest.location;
    const isUnusual = !behaviorProfile.typicalLocations.some(location => {
      const distance = this.calculateDistance(
        latitude, longitude,
        location.latitude, location.longitude
      );
      return distance < this.alertThresholds.geolocationDistance;
    });
    
    return isUnusual;
  }

  checkRapidRequests(accessRequest) {
    if (accessRequest.type !== 'api_request') return false;
    
    const identifier = accessRequest.userId || accessRequest.ip;
    const attempts = this.accessAttempts.get(identifier) || [];
    const recentAttempts = attempts.filter(attempt => 
      attempt.type === 'api_request' && 
      (Date.now() - new Date(attempt.timestamp).getTime()) < 60000 // 1 minute
    );
    
    return recentAttempts.length > 100;
  }

  checkPrivilegeEscalation(accessRequest) {
    return accessRequest.action === 'privilege_change' || 
           accessRequest.action === 'admin_access_attempt';
  }

  checkOffHoursAccess(accessRequest) {
    if (!accessRequest.userId) return false;
    
    const behaviorProfile = this.behaviorProfiles.get(accessRequest.userId);
    if (!behaviorProfile || !behaviorProfile.typicalAccessHours) return false;
    
    const accessHour = new Date(accessRequest.timestamp).getHours();
    return !behaviorProfile.typicalAccessHours.includes(accessHour);
  }

  checkConcurrentSessions(accessRequest) {
    if (!accessRequest.userId) return false;
    
    const userSessions = Array.from(this.userSessions.values())
      .filter(session => session.userId === accessRequest.userId && session.active);
    
    return userSessions.length > 3;
  }

  isOutsideBusinessHours(timestamp) {
    const hour = new Date(timestamp).getHours();
    return hour < 9 || hour > 17; // 9 AM - 5 PM
  }

  isLocationRestricted(location) {
    if (!location || !location.country) return false;
    
    const allowedCountries = ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'JP'];
    return !allowedCountries.includes(location.country);
  }

  isDeviceTrusted(deviceId, userId) {
    if (!deviceId || !userId) return false;
    
    const device = this.trustedDevices.get(deviceId);
    return device && device.userId === userId && device.trusted;
  }

  isAccessFrequencyAbnormal(userId) {
    if (!userId) return false;
    
    const attempts = this.accessAttempts.get(userId) || [];
    const recentAttempts = attempts.filter(attempt => 
      (Date.now() - new Date(attempt.timestamp).getTime()) < 60000 // 1 minute
    );
    
    return recentAttempts.length > this.alertThresholds.velocityThreshold;
  }

  isIPWhitelisted(ip) {
    // For demo purposes, assume some IPs are whitelisted
    const whitelistedIPs = ['127.0.0.1', '192.168.1.0/24', '10.0.0.0/8'];
    return whitelistedIPs.some(whitelistedIP => {
      if (whitelistedIP.includes('/')) {
        // CIDR notation - simplified check
        return ip.startsWith(whitelistedIP.split('/')[0].slice(0, -1));
      }
      return ip === whitelistedIP;
    });
  }

  checkTimeRestrictions(accessRequest, timeRestrictions) {
    const now = new Date(accessRequest.timestamp);
    const currentTime = now.toTimeString().substring(0, 5); // HH:MM format
    
    return timeRestrictions.some(restriction => {
      return currentTime < restriction.start || currentTime > restriction.end;
    });
  }

  checkLocationRestrictions(accessRequest, locationRestrictions) {
    if (!accessRequest.location) return false;
    
    return locationRestrictions.some(restriction => {
      if (restriction.countries && !restriction.countries.includes(accessRequest.location.country)) {
        return true;
      }
      if (restriction.regions && !restriction.regions.includes(accessRequest.location.region)) {
        return true;
      }
      return false;
    });
  }

  async logAccessAttempt(accessRequest, result, reason) {
    try {
      const attempt = {
        id: this.generateAttemptId(),
        userId: accessRequest.userId,
        ip: accessRequest.ip,
        userAgent: accessRequest.userAgent,
        deviceId: accessRequest.deviceId,
        location: accessRequest.location,
        timestamp: new Date().toISOString(),
        result: result,
        reason: reason,
        action: accessRequest.action,
        resource: accessRequest.resource,
        type: accessRequest.type || 'access_attempt'
      };

      const identifier = accessRequest.userId || accessRequest.ip;
      if (!this.accessAttempts.has(identifier)) {
        this.accessAttempts.set(identifier, []);
      }
      this.accessAttempts.get(identifier).push(attempt);

      // Update metrics
      this.securityMetrics.totalAccessAttempts++;
      if (result === 'denied') {
        this.securityMetrics.deniedAccesses++;
      }

      await this.saveAccessAttempts();
      await this.saveSecurityMetrics();

      await this.auditService.logEvent('access_attempt', {
        attempt_id: attempt.id,
        user_id: accessRequest.userId,
        ip: accessRequest.ip,
        result: result,
        reason: reason,
        timestamp: new Date().toISOString()
      });

      this.emit('accessAttempt', attempt);
    } catch (error) {
      console.error('Failed to log access attempt:', error);
    }
  }

  async flagSuspiciousActivity(accessRequest, suspiciousActivities) {
    try {
      const activity = {
        id: this.generateActivityId(),
        userId: accessRequest.userId,
        ip: accessRequest.ip,
        deviceId: accessRequest.deviceId,
        location: accessRequest.location,
        timestamp: new Date().toISOString(),
        activities: suspiciousActivities,
        riskScore: this.calculateRiskScore(suspiciousActivities),
        status: 'flagged',
        investigated: false,
        resolved: false
      };

      this.suspiciousActivities.set(activity.id, activity);
      await this.saveSuspiciousActivities();

      this.securityMetrics.suspiciousActivities++;
      await this.saveSecurityMetrics();

      await this.auditService.logEvent('suspicious_activity_flagged', {
        activity_id: activity.id,
        user_id: accessRequest.userId,
        ip: accessRequest.ip,
        risk_score: activity.riskScore,
        activities: suspiciousActivities.map(a => a.name),
        timestamp: new Date().toISOString()
      });

      this.emit('suspiciousActivity', activity);

      // Auto-block if risk score is high
      if (activity.riskScore >= 8) {
        await this.autoBlockUser(accessRequest.userId, `High risk score: ${activity.riskScore}`);
      }
    } catch (error) {
      console.error('Failed to flag suspicious activity:', error);
    }
  }

  calculateRiskScore(suspiciousActivities) {
    const severityScores = {
      low: 1,
      medium: 3,
      high: 5,
      critical: 10
    };

    return suspiciousActivities.reduce((score, activity) => {
      return score + (severityScores[activity.severity] || 1);
    }, 0);
  }

  async updateBehaviorProfile(accessRequest) {
    try {
      if (!accessRequest.userId) return;

      let profile = this.behaviorProfiles.get(accessRequest.userId);
      if (!profile) {
        profile = {
          userId: accessRequest.userId,
          createdAt: new Date().toISOString(),
          typicalAccessHours: [],
          typicalLocations: [],
          typicalDevices: [],
          accessPatterns: {
            totalAccesses: 0,
            averageSessionDuration: 0,
            commonActions: {},
            commonResources: {}
          }
        };
      }

      // Update access hour patterns
      const accessHour = new Date(accessRequest.timestamp).getHours();
      if (!profile.typicalAccessHours.includes(accessHour)) {
        profile.typicalAccessHours.push(accessHour);
      }

      // Update location patterns
      if (accessRequest.location) {
        const existingLocation = profile.typicalLocations.find(loc => 
          this.calculateDistance(
            accessRequest.location.latitude, accessRequest.location.longitude,
            loc.latitude, loc.longitude
          ) < 50 // 50km threshold
        );

        if (!existingLocation) {
          profile.typicalLocations.push({
            latitude: accessRequest.location.latitude,
            longitude: accessRequest.location.longitude,
            country: accessRequest.location.country,
            region: accessRequest.location.region,
            firstSeen: new Date().toISOString(),
            frequency: 1
          });
        } else {
          existingLocation.frequency++;
        }
      }

      // Update device patterns
      if (accessRequest.deviceId) {
        const existingDevice = profile.typicalDevices.find(dev => dev.deviceId === accessRequest.deviceId);
        if (!existingDevice) {
          profile.typicalDevices.push({
            deviceId: accessRequest.deviceId,
            userAgent: accessRequest.userAgent,
            firstSeen: new Date().toISOString(),
            frequency: 1
          });
        } else {
          existingDevice.frequency++;
        }
      }

      // Update access patterns
      profile.accessPatterns.totalAccesses++;
      
      if (accessRequest.action) {
        if (!profile.accessPatterns.commonActions[accessRequest.action]) {
          profile.accessPatterns.commonActions[accessRequest.action] = 0;
        }
        profile.accessPatterns.commonActions[accessRequest.action]++;
      }

      if (accessRequest.resource) {
        if (!profile.accessPatterns.commonResources[accessRequest.resource]) {
          profile.accessPatterns.commonResources[accessRequest.resource] = 0;
        }
        profile.accessPatterns.commonResources[accessRequest.resource]++;
      }

      profile.lastUpdated = new Date().toISOString();
      this.behaviorProfiles.set(accessRequest.userId, profile);

      await this.saveBehaviorProfiles();
    } catch (error) {
      console.error('Failed to update behavior profile:', error);
    }
  }

  async autoBlockUser(userId, reason) {
    try {
      if (!userId) return;

      this.blockedUsers.add(userId);
      await this.saveBlockedUsers();

      this.securityMetrics.blockedUsers++;
      await this.saveSecurityMetrics();

      // Terminate all active sessions for the user
      const userSessions = Array.from(this.userSessions.values())
        .filter(session => session.userId === userId && session.active);
      
      for (const session of userSessions) {
        await this.terminateSession(session.id, 'user_blocked');
      }

      await this.auditService.logEvent('user_auto_blocked', {
        user_id: userId,
        reason: reason,
        timestamp: new Date().toISOString()
      });

      this.emit('userBlocked', { userId, reason, automatic: true });
    } catch (error) {
      console.error('Failed to auto-block user:', error);
    }
  }

  async blockUser(userId, reason, blockedBy) {
    try {
      this.blockedUsers.add(userId);
      await this.saveBlockedUsers();

      this.securityMetrics.blockedUsers++;
      await this.saveSecurityMetrics();

      // Terminate all active sessions for the user
      const userSessions = Array.from(this.userSessions.values())
        .filter(session => session.userId === userId && session.active);
      
      for (const session of userSessions) {
        await this.terminateSession(session.id, 'user_blocked');
      }

      await this.auditService.logEvent('user_blocked', {
        user_id: userId,
        reason: reason,
        blocked_by: blockedBy,
        timestamp: new Date().toISOString()
      });

      this.emit('userBlocked', { userId, reason, blockedBy, automatic: false });
    } catch (error) {
      console.error('Failed to block user:', error);
      throw error;
    }
  }

  async blockIP(ip, reason, blockedBy) {
    try {
      this.blockedIPs.add(ip);
      await this.saveBlockedIPs();

      this.securityMetrics.blockedIPs++;
      await this.saveSecurityMetrics();

      // Terminate all active sessions from this IP
      const ipSessions = Array.from(this.userSessions.values())
        .filter(session => session.ip === ip && session.active);
      
      for (const session of ipSessions) {
        await this.terminateSession(session.id, 'ip_blocked');
      }

      await this.auditService.logEvent('ip_blocked', {
        ip: ip,
        reason: reason,
        blocked_by: blockedBy,
        timestamp: new Date().toISOString()
      });

      this.emit('ipBlocked', { ip, reason, blockedBy });
    } catch (error) {
      console.error('Failed to block IP:', error);
      throw error;
    }
  }

  async unblockUser(userId, reason, unblockedBy) {
    try {
      this.blockedUsers.delete(userId);
      await this.saveBlockedUsers();

      await this.auditService.logEvent('user_unblocked', {
        user_id: userId,
        reason: reason,
        unblocked_by: unblockedBy,
        timestamp: new Date().toISOString()
      });

      this.emit('userUnblocked', { userId, reason, unblockedBy });
    } catch (error) {
      console.error('Failed to unblock user:', error);
      throw error;
    }
  }

  async unblockIP(ip, reason, unblockedBy) {
    try {
      this.blockedIPs.delete(ip);
      await this.saveBlockedIPs();

      await this.auditService.logEvent('ip_unblocked', {
        ip: ip,
        reason: reason,
        unblocked_by: unblockedBy,
        timestamp: new Date().toISOString()
      });

      this.emit('ipUnblocked', { ip, reason, unblockedBy });
    } catch (error) {
      console.error('Failed to unblock IP:', error);
      throw error;
    }
  }

  async registerTrustedDevice(deviceData) {
    try {
      const device = {
        id: deviceData.deviceId,
        userId: deviceData.userId,
        name: deviceData.name || 'Unknown Device',
        type: deviceData.type || 'unknown',
        userAgent: deviceData.userAgent,
        fingerprint: deviceData.fingerprint,
        trusted: true,
        registeredAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
        ipAddress: deviceData.ipAddress,
        location: deviceData.location
      };

      this.trustedDevices.set(device.id, device);
      await this.saveTrustedDevices();

      this.securityMetrics.deviceRegistrations++;
      await this.saveSecurityMetrics();

      await this.auditService.logEvent('trusted_device_registered', {
        device_id: device.id,
        user_id: device.userId,
        device_name: device.name,
        timestamp: new Date().toISOString()
      });

      this.emit('deviceRegistered', device);
      return device;
    } catch (error) {
      console.error('Failed to register trusted device:', error);
      throw error;
    }
  }

  async revokeTrustedDevice(deviceId, reason, revokedBy) {
    try {
      const device = this.trustedDevices.get(deviceId);
      if (!device) {
        throw new Error(`Device ${deviceId} not found`);
      }

      device.trusted = false;
      device.revokedAt = new Date().toISOString();
      device.revokedBy = revokedBy;
      device.revokeReason = reason;

      await this.saveTrustedDevices();

      // Terminate all sessions from this device
      const deviceSessions = Array.from(this.userSessions.values())
        .filter(session => session.deviceId === deviceId && session.active);
      
      for (const session of deviceSessions) {
        await this.terminateSession(session.id, 'device_revoked');
      }

      await this.auditService.logEvent('trusted_device_revoked', {
        device_id: deviceId,
        user_id: device.userId,
        reason: reason,
        revoked_by: revokedBy,
        timestamp: new Date().toISOString()
      });

      this.emit('deviceRevoked', { deviceId, reason, revokedBy });
    } catch (error) {
      console.error('Failed to revoke trusted device:', error);
      throw error;
    }
  }

  async createSession(sessionData) {
    try {
      const session = {
        id: this.generateSessionId(),
        userId: sessionData.userId,
        deviceId: sessionData.deviceId,
        ip: sessionData.ip,
        userAgent: sessionData.userAgent,
        location: sessionData.location,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        expiresAt: new Date(Date.now() + this.sessionTimeout).toISOString(),
        active: true
      };

      this.userSessions.set(session.id, session);
      await this.saveUserSessions();

      await this.auditService.logEvent('session_created', {
        session_id: session.id,
        user_id: session.userId,
        device_id: session.deviceId,
        ip: session.ip,
        timestamp: new Date().toISOString()
      });

      this.emit('sessionCreated', session);
      return session;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }

  async terminateSession(sessionId, reason) {
    try {
      const session = this.userSessions.get(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      session.active = false;
      session.terminatedAt = new Date().toISOString();
      session.terminationReason = reason;

      await this.saveUserSessions();

      await this.auditService.logEvent('session_terminated', {
        session_id: sessionId,
        user_id: session.userId,
        reason: reason,
        timestamp: new Date().toISOString()
      });

      this.emit('sessionTerminated', { sessionId, reason });
    } catch (error) {
      console.error('Failed to terminate session:', error);
      throw error;
    }
  }

  async monitorAccessPatterns() {
    try {
      // Analyze recent access patterns for anomalies
      const recentAttempts = [];
      const cutoffTime = Date.now() - (60 * 60 * 1000); // 1 hour ago

      for (const attempts of this.accessAttempts.values()) {
        const recent = attempts.filter(attempt => 
          new Date(attempt.timestamp).getTime() > cutoffTime
        );
        recentAttempts.push(...recent);
      }

      // Check for patterns that might indicate attacks
      const ipCounts = {};
      const userCounts = {};

      recentAttempts.forEach(attempt => {
        if (attempt.ip) {
          ipCounts[attempt.ip] = (ipCounts[attempt.ip] || 0) + 1;
        }
        if (attempt.userId) {
          userCounts[attempt.userId] = (userCounts[attempt.userId] || 0) + 1;
        }
      });

      // Flag suspicious IPs
      for (const [ip, count] of Object.entries(ipCounts)) {
        if (count > 50 && !this.blockedIPs.has(ip)) {
          await this.flagSuspiciousActivity({
            ip: ip,
            timestamp: new Date().toISOString()
          }, [{
            id: 'high_volume_access',
            name: 'High Volume Access',
            severity: 'high',
            action: 'investigate'
          }]);
        }
      }

      // Update metrics
      this.securityMetrics.behaviorAnomalies = this.suspiciousActivities.size;
      await this.saveSecurityMetrics();

    } catch (error) {
      console.error('Failed to monitor access patterns:', error);
    }
  }

  async analyzeUserBehavior() {
    try {
      for (const [userId, profile] of this.behaviorProfiles) {
        const userSessions = Array.from(this.userSessions.values())
          .filter(session => session.userId === userId);

        if (userSessions.length > 0) {
          const latestSession = userSessions.sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
          )[0];

          // Check for behavioral anomalies
          const anomalies = [];

          // Check unusual access time
          const accessHour = new Date(latestSession.createdAt).getHours();
          if (!profile.typicalAccessHours.includes(accessHour)) {
            anomalies.push({
              type: 'unusual_time',
              severity: 'low',
              description: `Access at unusual hour: ${accessHour}`
            });
          }

          // Check unusual location
          if (latestSession.location && profile.typicalLocations.length > 0) {
            const isUnusualLocation = !profile.typicalLocations.some(loc => 
              this.calculateDistance(
                latestSession.location.latitude, latestSession.location.longitude,
                loc.latitude, loc.longitude
              ) < 100
            );

            if (isUnusualLocation) {
              anomalies.push({
                type: 'unusual_location',
                severity: 'medium',
                description: 'Access from unusual location'
              });
            }
          }

          // Report anomalies
          if (anomalies.length > 0) {
            await this.flagSuspiciousActivity({
              userId: userId,
              timestamp: latestSession.createdAt,
              ip: latestSession.ip,
              deviceId: latestSession.deviceId,
              location: latestSession.location
            }, anomalies.map(anomaly => ({
              id: anomaly.type,
              name: anomaly.description,
              severity: anomaly.severity,
              action: 'log'
            })));
          }
        }
      }
    } catch (error) {
      console.error('Failed to analyze user behavior:', error);
    }
  }

  async cleanupExpiredSessions() {
    try {
      const now = new Date();
      let cleanedCount = 0;

      for (const [sessionId, session] of this.userSessions) {
        if (session.active && new Date(session.expiresAt) < now) {
          await this.terminateSession(sessionId, 'expired');
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        await this.auditService.logEvent('expired_sessions_cleaned', {
          count: cleanedCount,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to cleanup expired sessions:', error);
    }
  }

  async cleanupOldAttempts() {
    try {
      const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
      let cleanedCount = 0;

      for (const [identifier, attempts] of this.accessAttempts) {
        const recentAttempts = attempts.filter(attempt => 
          new Date(attempt.timestamp).getTime() > cutoffTime
        );
        
        if (recentAttempts.length !== attempts.length) {
          this.accessAttempts.set(identifier, recentAttempts);
          cleanedCount += attempts.length - recentAttempts.length;
        }
      }

      if (cleanedCount > 0) {
        await this.saveAccessAttempts();
        await this.auditService.logEvent('old_access_attempts_cleaned', {
          count: cleanedCount,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to cleanup old attempts:', error);
    }
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  getApplicablePolicy(userRole) {
    const policies = Array.from(this.accessPolicies.values())
      .filter(policy => policy.enabled && policy.userRoles.includes(userRole));
    
    return policies.length > 0 ? policies[0] : this.accessPolicies.get('default_policy');
  }

  async saveAccessPolicies() {
    try {
      const policyList = Array.from(this.accessPolicies.values());
      await this.storageService.setItem('access_policies', policyList);
    } catch (error) {
      console.error('Failed to save access policies:', error);
    }
  }

  async saveUserSessions() {
    try {
      const sessionList = Array.from(this.userSessions.values());
      await this.storageService.setItem('user_sessions', sessionList);
    } catch (error) {
      console.error('Failed to save user sessions:', error);
    }
  }

  async saveAccessAttempts() {
    try {
      const attemptList = [];
      for (const attempts of this.accessAttempts.values()) {
        attemptList.push(...attempts);
      }
      await this.storageService.setItem('access_attempts', attemptList);
    } catch (error) {
      console.error('Failed to save access attempts:', error);
    }
  }

  async saveSuspiciousActivities() {
    try {
      const activityList = Array.from(this.suspiciousActivities.values());
      await this.storageService.setItem('suspicious_activities', activityList);
    } catch (error) {
      console.error('Failed to save suspicious activities:', error);
    }
  }

  async saveBlockedUsers() {
    try {
      const blockedList = Array.from(this.blockedUsers);
      await this.storageService.setItem('blocked_users', blockedList);
    } catch (error) {
      console.error('Failed to save blocked users:', error);
    }
  }

  async saveBlockedIPs() {
    try {
      const blockedList = Array.from(this.blockedIPs);
      await this.storageService.setItem('blocked_ips', blockedList);
    } catch (error) {
      console.error('Failed to save blocked IPs:', error);
    }
  }

  async saveTrustedDevices() {
    try {
      const deviceList = Array.from(this.trustedDevices.values());
      await this.storageService.setItem('trusted_devices', deviceList);
    } catch (error) {
      console.error('Failed to save trusted devices:', error);
    }
  }

  async saveBehaviorProfiles() {
    try {
      const profileList = Array.from(this.behaviorProfiles.values());
      await this.storageService.setItem('behavior_profiles', profileList);
    } catch (error) {
      console.error('Failed to save behavior profiles:', error);
    }
  }

  async saveSecurityMetrics() {
    try {
      await this.storageService.setItem('access_control_metrics', this.securityMetrics);
    } catch (error) {
      console.error('Failed to save security metrics:', error);
    }
  }

  generateAttemptId() {
    return `ATT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }

  generateActivityId() {
    return `ACT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }

  generateSessionId() {
    return `SES-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }

  getAccessPolicies() {
    return Array.from(this.accessPolicies.values());
  }

  getActiveUserSessions() {
    return Array.from(this.userSessions.values()).filter(session => session.active);
  }

  getBlockedUsers() {
    return Array.from(this.blockedUsers);
  }

  getBlockedIPs() {
    return Array.from(this.blockedIPs);
  }

  getTrustedDevices() {
    return Array.from(this.trustedDevices.values());
  }

  getSuspiciousActivities() {
    return Array.from(this.suspiciousActivities.values());
  }

  getSecurityMetrics() {
    return this.securityMetrics;
  }

  getBehaviorProfiles() {
    return Array.from(this.behaviorProfiles.values());
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
      this.accessPolicies.clear();
      this.userSessions.clear();
      this.accessAttempts.clear();
      this.suspiciousActivities.clear();
      this.blockedUsers.clear();
      this.blockedIPs.clear();
      this.trustedDevices.clear();
      this.accessRules.clear();
      this.behaviorProfiles.clear();
      this.detectionRules.clear();
      this.initialized = false;
      
      await this.auditService.logEvent('access_control_service_cleanup', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to cleanup AccessControlService:', error);
    }
  }
}

export { AccessControlService };