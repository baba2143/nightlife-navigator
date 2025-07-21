import { LocalStorageService } from './LocalStorageService';
import { AuditLogService } from './AuditLogService';

class ApiSecurityService {
  constructor() {
    this.initialized = false;
    this.storageService = null;
    this.auditService = null;
    this.rateLimiters = new Map();
    this.blacklistedIPs = new Set();
    this.apiKeys = new Map();
    this.accessTokens = new Map();
    this.securityPolicies = new Map();
    this.requestLog = [];
    this.alertRules = new Map();
    this.securityMetrics = {
      totalRequests: 0,
      blockedRequests: 0,
      rateLimitViolations: 0,
      authenticationFailures: 0,
      suspiciousActivity: 0,
      apiKeyUsage: {},
      endpointStats: {}
    };
    this.ipWhitelist = new Set();
    this.corsConfig = {
      allowedOrigins: [],
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
      maxAge: 86400
    };
    this.listeners = [];
    this.cleanupInterval = null;
  }

  static getInstance() {
    if (!ApiSecurityService.instance) {
      ApiSecurityService.instance = new ApiSecurityService();
    }
    return ApiSecurityService.instance;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      this.storageService = LocalStorageService.getInstance();
      this.auditService = AuditLogService.getInstance();
      
      await this.loadRateLimiters();
      await this.loadSecurityPolicies();
      await this.loadApiKeys();
      await this.loadAccessTokens();
      await this.loadBlacklistedIPs();
      await this.loadAlertRules();
      await this.loadSecurityMetrics();
      await this.loadCorsConfig();
      await this.loadIPWhitelist();
      await this.startCleanupTask();
      
      this.initialized = true;
      
      await this.auditService.logEvent('api_security_service_initialized', {
        timestamp: new Date().toISOString(),
        rate_limiters: this.rateLimiters.size,
        security_policies: this.securityPolicies.size,
        api_keys: this.apiKeys.size
      });
      
      this.emit('serviceInitialized');
    } catch (error) {
      console.error('Failed to initialize ApiSecurityService:', error);
      throw error;
    }
  }

  async loadRateLimiters() {
    try {
      const limiters = await this.storageService.getItem('api_rate_limiters');
      const limiterList = limiters || [
        {
          id: 'default',
          name: 'Default Rate Limiter',
          windowSize: 60000, // 1 minute
          maxRequests: 100,
          endpoints: ['*'],
          enabled: true
        },
        {
          id: 'authentication',
          name: 'Authentication Endpoints',
          windowSize: 60000, // 1 minute
          maxRequests: 5,
          endpoints: ['/auth/login', '/auth/register', '/auth/forgot-password'],
          enabled: true
        },
        {
          id: 'search',
          name: 'Search Endpoints',
          windowSize: 60000, // 1 minute
          maxRequests: 50,
          endpoints: ['/api/venues/search', '/api/events/search'],
          enabled: true
        },
        {
          id: 'booking',
          name: 'Booking Endpoints',
          windowSize: 60000, // 1 minute
          maxRequests: 10,
          endpoints: ['/api/bookings'],
          enabled: true
        },
        {
          id: 'admin',
          name: 'Admin Endpoints',
          windowSize: 60000, // 1 minute
          maxRequests: 200,
          endpoints: ['/admin/*'],
          enabled: true
        }
      ];

      this.rateLimiters.clear();
      limiterList.forEach(limiter => {
        this.rateLimiters.set(limiter.id, {
          ...limiter,
          requests: new Map(), // IP -> { count, windowStart }
          violations: 0
        });
      });

      await this.storageService.setItem('api_rate_limiters', limiterList);
    } catch (error) {
      console.error('Failed to load rate limiters:', error);
      this.rateLimiters.clear();
    }
  }

  async loadSecurityPolicies() {
    try {
      const policies = await this.storageService.getItem('api_security_policies');
      const policyList = policies || [
        {
          id: 'default_policy',
          name: 'Default Security Policy',
          authentication: {
            required: true,
            methods: ['bearer_token', 'api_key'],
            tokenExpiration: 3600000 // 1 hour
          },
          authorization: {
            enabled: true,
            roles: ['user', 'admin', 'premium'],
            permissions: {}
          },
          encryption: {
            required: true,
            algorithms: ['AES-256-GCM'],
            keyRotation: 30 * 24 * 60 * 60 * 1000 // 30 days
          },
          validation: {
            inputSanitization: true,
            sqlInjectionProtection: true,
            xssProtection: true,
            maxRequestSize: 10 * 1024 * 1024 // 10MB
          },
          logging: {
            enabled: true,
            logLevel: 'info',
            includeSensitiveData: false
          },
          endpoints: ['*'],
          enabled: true
        },
        {
          id: 'public_policy',
          name: 'Public API Policy',
          authentication: {
            required: false,
            methods: [],
            tokenExpiration: 0
          },
          authorization: {
            enabled: false,
            roles: [],
            permissions: {}
          },
          encryption: {
            required: false,
            algorithms: [],
            keyRotation: 0
          },
          validation: {
            inputSanitization: true,
            sqlInjectionProtection: true,
            xssProtection: true,
            maxRequestSize: 1 * 1024 * 1024 // 1MB
          },
          logging: {
            enabled: true,
            logLevel: 'warn',
            includeSensitiveData: false
          },
          endpoints: ['/api/venues/public', '/api/events/public'],
          enabled: true
        },
        {
          id: 'admin_policy',
          name: 'Admin API Policy',
          authentication: {
            required: true,
            methods: ['bearer_token'],
            tokenExpiration: 1800000 // 30 minutes
          },
          authorization: {
            enabled: true,
            roles: ['admin'],
            permissions: {
              'venues.manage': true,
              'users.manage': true,
              'system.configure': true
            }
          },
          encryption: {
            required: true,
            algorithms: ['AES-256-GCM'],
            keyRotation: 7 * 24 * 60 * 60 * 1000 // 7 days
          },
          validation: {
            inputSanitization: true,
            sqlInjectionProtection: true,
            xssProtection: true,
            maxRequestSize: 50 * 1024 * 1024 // 50MB
          },
          logging: {
            enabled: true,
            logLevel: 'debug',
            includeSensitiveData: false
          },
          endpoints: ['/admin/*'],
          enabled: true
        }
      ];

      this.securityPolicies.clear();
      policyList.forEach(policy => {
        this.securityPolicies.set(policy.id, policy);
      });

      await this.storageService.setItem('api_security_policies', policyList);
    } catch (error) {
      console.error('Failed to load security policies:', error);
      this.securityPolicies.clear();
    }
  }

  async loadApiKeys() {
    try {
      const keys = await this.storageService.getItem('api_keys');
      const keyList = keys || [
        {
          id: 'key_1',
          key: 'ak_' + this.generateSecureKey(),
          name: 'Mobile App Key',
          description: 'API key for mobile application',
          userId: 'system',
          permissions: ['venues.read', 'events.read', 'bookings.create'],
          rateLimit: {
            windowSize: 60000,
            maxRequests: 1000
          },
          enabled: true,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
          lastUsed: null,
          usageCount: 0
        },
        {
          id: 'key_2',
          key: 'ak_' + this.generateSecureKey(),
          name: 'Admin Dashboard Key',
          description: 'API key for admin dashboard',
          userId: 'admin',
          permissions: ['*'],
          rateLimit: {
            windowSize: 60000,
            maxRequests: 2000
          },
          enabled: true,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
          lastUsed: null,
          usageCount: 0
        }
      ];

      this.apiKeys.clear();
      keyList.forEach(keyData => {
        this.apiKeys.set(keyData.key, keyData);
      });

      await this.storageService.setItem('api_keys', keyList);
    } catch (error) {
      console.error('Failed to load API keys:', error);
      this.apiKeys.clear();
    }
  }

  async loadAccessTokens() {
    try {
      const tokens = await this.storageService.getItem('access_tokens');
      const tokenList = tokens || [];

      this.accessTokens.clear();
      tokenList.forEach(tokenData => {
        this.accessTokens.set(tokenData.token, tokenData);
      });
    } catch (error) {
      console.error('Failed to load access tokens:', error);
      this.accessTokens.clear();
    }
  }

  async loadBlacklistedIPs() {
    try {
      const ips = await this.storageService.getItem('blacklisted_ips');
      const ipList = ips || [];

      this.blacklistedIPs.clear();
      ipList.forEach(ip => {
        this.blacklistedIPs.add(ip);
      });
    } catch (error) {
      console.error('Failed to load blacklisted IPs:', error);
      this.blacklistedIPs.clear();
    }
  }

  async loadAlertRules() {
    try {
      const rules = await this.storageService.getItem('api_security_alert_rules');
      const ruleList = rules || [
        {
          id: 'rate_limit_violation',
          name: 'Rate Limit Violation',
          condition: 'rate_limit_exceeded',
          threshold: 5,
          timeWindow: 300000, // 5 minutes
          action: 'block_ip',
          severity: 'high',
          enabled: true
        },
        {
          id: 'authentication_failure',
          name: 'Authentication Failure',
          condition: 'auth_failed',
          threshold: 10,
          timeWindow: 600000, // 10 minutes
          action: 'block_ip',
          severity: 'medium',
          enabled: true
        },
        {
          id: 'suspicious_activity',
          name: 'Suspicious Activity Pattern',
          condition: 'suspicious_pattern',
          threshold: 3,
          timeWindow: 180000, // 3 minutes
          action: 'alert_admin',
          severity: 'high',
          enabled: true
        },
        {
          id: 'api_key_abuse',
          name: 'API Key Abuse',
          condition: 'api_key_overuse',
          threshold: 1000,
          timeWindow: 3600000, // 1 hour
          action: 'disable_key',
          severity: 'medium',
          enabled: true
        }
      ];

      this.alertRules.clear();
      ruleList.forEach(rule => {
        this.alertRules.set(rule.id, {
          ...rule,
          violations: []
        });
      });

      await this.storageService.setItem('api_security_alert_rules', ruleList);
    } catch (error) {
      console.error('Failed to load alert rules:', error);
      this.alertRules.clear();
    }
  }

  async loadSecurityMetrics() {
    try {
      const metrics = await this.storageService.getItem('api_security_metrics');
      if (metrics) {
        this.securityMetrics = { ...this.securityMetrics, ...metrics };
      }
    } catch (error) {
      console.error('Failed to load security metrics:', error);
    }
  }

  async loadCorsConfig() {
    try {
      const config = await this.storageService.getItem('cors_config');
      if (config) {
        this.corsConfig = { ...this.corsConfig, ...config };
      }
    } catch (error) {
      console.error('Failed to load CORS config:', error);
    }
  }

  async loadIPWhitelist() {
    try {
      const whitelist = await this.storageService.getItem('ip_whitelist');
      const ipList = whitelist || [];

      this.ipWhitelist.clear();
      ipList.forEach(ip => {
        this.ipWhitelist.add(ip);
      });
    } catch (error) {
      console.error('Failed to load IP whitelist:', error);
      this.ipWhitelist.clear();
    }
  }

  async startCleanupTask() {
    // Clean up old request logs and expired tokens every hour
    this.cleanupInterval = setInterval(async () => {
      try {
        await this.cleanupExpiredTokens();
        await this.cleanupOldRequestLogs();
        await this.cleanupRateLimitData();
      } catch (error) {
        console.error('Cleanup task error:', error);
      }
    }, 60 * 60 * 1000); // 1 hour

    await this.auditService.logEvent('api_security_cleanup_started', {
      interval: '1 hour',
      timestamp: new Date().toISOString()
    });
  }

  async validateRequest(request) {
    try {
      const validation = {
        allowed: true,
        reason: null,
        policy: null,
        rateLimit: null,
        authentication: null,
        authorization: null
      };

      // Check IP blacklist
      if (this.blacklistedIPs.has(request.ip)) {
        validation.allowed = false;
        validation.reason = 'IP blacklisted';
        await this.logSecurityEvent('ip_blacklisted', request);
        return validation;
      }

      // Check rate limiting
      const rateLimitResult = await this.checkRateLimit(request);
      if (!rateLimitResult.allowed) {
        validation.allowed = false;
        validation.reason = 'Rate limit exceeded';
        validation.rateLimit = rateLimitResult;
        await this.logSecurityEvent('rate_limit_exceeded', request);
        return validation;
      }

      // Get applicable security policy
      const policy = this.getApplicablePolicy(request.endpoint);
      validation.policy = policy;

      // Check authentication
      if (policy.authentication.required) {
        const authResult = await this.validateAuthentication(request);
        validation.authentication = authResult;
        if (!authResult.valid) {
          validation.allowed = false;
          validation.reason = 'Authentication failed';
          await this.logSecurityEvent('authentication_failed', request);
          return validation;
        }
      }

      // Check authorization
      if (policy.authorization.enabled) {
        const authzResult = await this.validateAuthorization(request, validation.authentication);
        validation.authorization = authzResult;
        if (!authzResult.authorized) {
          validation.allowed = false;
          validation.reason = 'Authorization failed';
          await this.logSecurityEvent('authorization_failed', request);
          return validation;
        }
      }

      // Validate input
      const inputValidation = await this.validateInput(request, policy);
      if (!inputValidation.valid) {
        validation.allowed = false;
        validation.reason = 'Input validation failed';
        await this.logSecurityEvent('input_validation_failed', request);
        return validation;
      }

      // Log successful request
      await this.logSecurityEvent('request_allowed', request);
      await this.updateSecurityMetrics(request, validation);

      return validation;
    } catch (error) {
      console.error('Failed to validate request:', error);
      return {
        allowed: false,
        reason: 'Internal validation error',
        policy: null,
        rateLimit: null,
        authentication: null,
        authorization: null
      };
    }
  }

  async checkRateLimit(request) {
    try {
      const applicableLimiters = Array.from(this.rateLimiters.values())
        .filter(limiter => limiter.enabled && this.matchesEndpoint(request.endpoint, limiter.endpoints));

      for (const limiter of applicableLimiters) {
        const now = Date.now();
        const clientId = this.getClientId(request);
        
        if (!limiter.requests.has(clientId)) {
          limiter.requests.set(clientId, {
            count: 0,
            windowStart: now
          });
        }

        const clientData = limiter.requests.get(clientId);
        
        // Reset window if expired
        if (now - clientData.windowStart > limiter.windowSize) {
          clientData.count = 0;
          clientData.windowStart = now;
        }

        // Check if limit exceeded
        if (clientData.count >= limiter.maxRequests) {
          limiter.violations++;
          await this.handleRateLimitViolation(request, limiter);
          
          return {
            allowed: false,
            limiterId: limiter.id,
            limit: limiter.maxRequests,
            window: limiter.windowSize,
            current: clientData.count,
            resetTime: clientData.windowStart + limiter.windowSize
          };
        }

        // Increment counter
        clientData.count++;
      }

      return {
        allowed: true,
        limiterId: null,
        limit: null,
        window: null,
        current: null,
        resetTime: null
      };
    } catch (error) {
      console.error('Failed to check rate limit:', error);
      return { allowed: false, limiterId: 'error', limit: 0, window: 0, current: 0, resetTime: 0 };
    }
  }

  async validateAuthentication(request) {
    try {
      const authResult = {
        valid: false,
        method: null,
        user: null,
        token: null,
        apiKey: null
      };

      // Check Bearer token
      if (request.headers.authorization && request.headers.authorization.startsWith('Bearer ')) {
        const token = request.headers.authorization.substring(7);
        const tokenData = this.accessTokens.get(token);
        
        if (tokenData && !this.isTokenExpired(tokenData)) {
          authResult.valid = true;
          authResult.method = 'bearer_token';
          authResult.user = tokenData.user;
          authResult.token = tokenData;
          return authResult;
        }
      }

      // Check API Key
      if (request.headers['x-api-key']) {
        const apiKey = request.headers['x-api-key'];
        const keyData = this.apiKeys.get(apiKey);
        
        if (keyData && keyData.enabled && !this.isApiKeyExpired(keyData)) {
          authResult.valid = true;
          authResult.method = 'api_key';
          authResult.apiKey = keyData;
          
          // Update usage statistics
          keyData.lastUsed = new Date().toISOString();
          keyData.usageCount++;
          
          return authResult;
        }
      }

      return authResult;
    } catch (error) {
      console.error('Failed to validate authentication:', error);
      return { valid: false, method: null, user: null, token: null, apiKey: null };
    }
  }

  async validateAuthorization(request, authentication) {
    try {
      const authzResult = {
        authorized: false,
        permissions: [],
        roles: []
      };

      if (!authentication.valid) {
        return authzResult;
      }

      let userPermissions = [];
      let userRoles = [];

      if (authentication.method === 'bearer_token' && authentication.user) {
        userPermissions = authentication.user.permissions || [];
        userRoles = authentication.user.roles || [];
      } else if (authentication.method === 'api_key' && authentication.apiKey) {
        userPermissions = authentication.apiKey.permissions || [];
        userRoles = ['api_user'];
      }

      // Check if user has required permissions for this endpoint
      const requiredPermissions = this.getRequiredPermissions(request.endpoint, request.method);
      
      if (requiredPermissions.length === 0) {
        authzResult.authorized = true;
        authzResult.permissions = userPermissions;
        authzResult.roles = userRoles;
        return authzResult;
      }

      // Check if user has any of the required permissions
      const hasPermission = requiredPermissions.some(permission => 
        userPermissions.includes(permission) || userPermissions.includes('*')
      );

      authzResult.authorized = hasPermission;
      authzResult.permissions = userPermissions;
      authzResult.roles = userRoles;

      return authzResult;
    } catch (error) {
      console.error('Failed to validate authorization:', error);
      return { authorized: false, permissions: [], roles: [] };
    }
  }

  async validateInput(request, policy) {
    try {
      const validation = {
        valid: true,
        errors: []
      };

      // Check request size
      if (request.body && JSON.stringify(request.body).length > policy.validation.maxRequestSize) {
        validation.valid = false;
        validation.errors.push('Request size exceeds maximum allowed');
      }

      // Basic input sanitization
      if (policy.validation.inputSanitization) {
        const sanitizedBody = this.sanitizeInput(request.body);
        if (JSON.stringify(sanitizedBody) !== JSON.stringify(request.body)) {
          validation.valid = false;
          validation.errors.push('Input contains potentially malicious content');
        }
      }

      // SQL injection protection
      if (policy.validation.sqlInjectionProtection) {
        const hasSqlInjection = this.detectSqlInjection(request);
        if (hasSqlInjection) {
          validation.valid = false;
          validation.errors.push('SQL injection attempt detected');
        }
      }

      // XSS protection
      if (policy.validation.xssProtection) {
        const hasXss = this.detectXss(request);
        if (hasXss) {
          validation.valid = false;
          validation.errors.push('XSS attempt detected');
        }
      }

      return validation;
    } catch (error) {
      console.error('Failed to validate input:', error);
      return { valid: false, errors: ['Input validation error'] };
    }
  }

  sanitizeInput(input) {
    if (typeof input === 'string') {
      return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return input;
  }

  detectSqlInjection(request) {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
      /(\b\d+\s*=\s*\d+\b)/gi,
      /(--|#|\/\*)/gi,
      /(\bUNION\s+(ALL\s+)?SELECT)/gi
    ];

    const checkString = JSON.stringify(request.body) + request.url + JSON.stringify(request.query);
    
    return sqlPatterns.some(pattern => pattern.test(checkString));
  }

  detectXss(request) {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi
    ];

    const checkString = JSON.stringify(request.body) + request.url + JSON.stringify(request.query);
    
    return xssPatterns.some(pattern => pattern.test(checkString));
  }

  getApplicablePolicy(endpoint) {
    const policies = Array.from(this.securityPolicies.values())
      .filter(policy => policy.enabled && this.matchesEndpoint(endpoint, policy.endpoints))
      .sort((a, b) => b.endpoints[0].length - a.endpoints[0].length); // More specific first

    return policies[0] || this.securityPolicies.get('default_policy');
  }

  getRequiredPermissions(endpoint, method) {
    const permissionMap = {
      'GET:/api/venues': ['venues.read'],
      'POST:/api/venues': ['venues.create'],
      'PUT:/api/venues': ['venues.update'],
      'DELETE:/api/venues': ['venues.delete'],
      'GET:/api/bookings': ['bookings.read'],
      'POST:/api/bookings': ['bookings.create'],
      'PUT:/api/bookings': ['bookings.update'],
      'DELETE:/api/bookings': ['bookings.delete'],
      'GET:/admin/*': ['admin.read'],
      'POST:/admin/*': ['admin.create'],
      'PUT:/admin/*': ['admin.update'],
      'DELETE:/admin/*': ['admin.delete']
    };

    const key = `${method.toUpperCase()}:${endpoint}`;
    return permissionMap[key] || [];
  }

  matchesEndpoint(endpoint, patterns) {
    return patterns.some(pattern => {
      if (pattern === '*') return true;
      if (pattern.endsWith('*')) {
        return endpoint.startsWith(pattern.slice(0, -1));
      }
      return endpoint === pattern;
    });
  }

  getClientId(request) {
    // Use API key if available, otherwise use IP
    return request.headers['x-api-key'] || request.ip || 'anonymous';
  }

  isTokenExpired(tokenData) {
    return tokenData.expiresAt && new Date(tokenData.expiresAt) < new Date();
  }

  isApiKeyExpired(keyData) {
    return keyData.expiresAt && new Date(keyData.expiresAt) < new Date();
  }

  async handleRateLimitViolation(request, limiter) {
    try {
      this.securityMetrics.rateLimitViolations++;
      
      await this.auditService.logEvent('rate_limit_violation', {
        ip: request.ip,
        endpoint: request.endpoint,
        limiter_id: limiter.id,
        limit: limiter.maxRequests,
        window: limiter.windowSize,
        timestamp: new Date().toISOString()
      });

      // Check if should trigger alert
      await this.checkAlertRules('rate_limit_exceeded', request);

      this.emit('rateLimitViolation', { request, limiter });
    } catch (error) {
      console.error('Failed to handle rate limit violation:', error);
    }
  }

  async checkAlertRules(condition, request) {
    try {
      for (const [ruleId, rule] of this.alertRules) {
        if (!rule.enabled || rule.condition !== condition) continue;

        const now = Date.now();
        
        // Clean old violations
        rule.violations = rule.violations.filter(v => now - v.timestamp < rule.timeWindow);
        
        // Add current violation
        rule.violations.push({
          timestamp: now,
          ip: request.ip,
          endpoint: request.endpoint
        });

        // Check if threshold exceeded
        if (rule.violations.length >= rule.threshold) {
          await this.triggerAlert(rule, request);
        }
      }
    } catch (error) {
      console.error('Failed to check alert rules:', error);
    }
  }

  async triggerAlert(rule, request) {
    try {
      const alert = {
        id: this.generateAlertId(),
        ruleId: rule.id,
        ruleName: rule.name,
        severity: rule.severity,
        condition: rule.condition,
        threshold: rule.threshold,
        violationCount: rule.violations.length,
        timestamp: new Date().toISOString(),
        request: {
          ip: request.ip,
          endpoint: request.endpoint,
          method: request.method
        }
      };

      // Execute alert action
      await this.executeAlertAction(rule.action, request, alert);

      await this.auditService.logEvent('security_alert_triggered', {
        alert_id: alert.id,
        rule_id: rule.id,
        severity: rule.severity,
        condition: rule.condition,
        ip: request.ip,
        timestamp: new Date().toISOString()
      });

      this.emit('securityAlert', alert);
    } catch (error) {
      console.error('Failed to trigger alert:', error);
    }
  }

  async executeAlertAction(action, request, alert) {
    try {
      switch (action) {
        case 'block_ip':
          await this.blockIP(request.ip, 'Automated block due to security violation');
          break;
        case 'disable_key':
          if (request.headers['x-api-key']) {
            await this.disableApiKey(request.headers['x-api-key'], 'Automated disable due to abuse');
          }
          break;
        case 'alert_admin':
          // In a real implementation, this would send notifications
          console.warn(`SECURITY ALERT: ${alert.ruleName} - ${alert.condition}`);
          break;
        default:
          console.log(`Unknown alert action: ${action}`);
      }
    } catch (error) {
      console.error('Failed to execute alert action:', error);
    }
  }

  async blockIP(ip, reason) {
    try {
      this.blacklistedIPs.add(ip);
      await this.saveBlacklistedIPs();

      await this.auditService.logEvent('ip_blocked', {
        ip: ip,
        reason: reason,
        timestamp: new Date().toISOString()
      });

      this.emit('ipBlocked', { ip, reason });
    } catch (error) {
      console.error('Failed to block IP:', error);
    }
  }

  async disableApiKey(apiKey, reason) {
    try {
      const keyData = this.apiKeys.get(apiKey);
      if (keyData) {
        keyData.enabled = false;
        keyData.disabledReason = reason;
        keyData.disabledAt = new Date().toISOString();

        await this.saveApiKeys();

        await this.auditService.logEvent('api_key_disabled', {
          key_id: keyData.id,
          reason: reason,
          timestamp: new Date().toISOString()
        });

        this.emit('apiKeyDisabled', { keyData, reason });
      }
    } catch (error) {
      console.error('Failed to disable API key:', error);
    }
  }

  async logSecurityEvent(eventType, request) {
    try {
      const logEntry = {
        id: this.generateLogId(),
        timestamp: new Date().toISOString(),
        eventType: eventType,
        ip: request.ip,
        endpoint: request.endpoint,
        method: request.method,
        userAgent: request.headers['user-agent'],
        apiKey: request.headers['x-api-key'] ? 'present' : 'absent',
        authorization: request.headers.authorization ? 'present' : 'absent'
      };

      this.requestLog.push(logEntry);

      // Keep only last 10000 entries
      if (this.requestLog.length > 10000) {
        this.requestLog = this.requestLog.slice(-10000);
      }

      await this.auditService.logEvent('api_security_event', {
        event_type: eventType,
        ip: request.ip,
        endpoint: request.endpoint,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  async updateSecurityMetrics(request, validation) {
    try {
      this.securityMetrics.totalRequests++;

      if (!validation.allowed) {
        this.securityMetrics.blockedRequests++;
      }

      if (validation.authentication && !validation.authentication.valid) {
        this.securityMetrics.authenticationFailures++;
      }

      // Update endpoint stats
      if (!this.securityMetrics.endpointStats[request.endpoint]) {
        this.securityMetrics.endpointStats[request.endpoint] = {
          total: 0,
          blocked: 0,
          authFailures: 0
        };
      }

      this.securityMetrics.endpointStats[request.endpoint].total++;
      if (!validation.allowed) {
        this.securityMetrics.endpointStats[request.endpoint].blocked++;
      }

      // Update API key usage
      if (request.headers['x-api-key']) {
        const keyData = this.apiKeys.get(request.headers['x-api-key']);
        if (keyData) {
          if (!this.securityMetrics.apiKeyUsage[keyData.id]) {
            this.securityMetrics.apiKeyUsage[keyData.id] = 0;
          }
          this.securityMetrics.apiKeyUsage[keyData.id]++;
        }
      }

      // Save metrics periodically
      if (this.securityMetrics.totalRequests % 100 === 0) {
        await this.saveSecurityMetrics();
      }
    } catch (error) {
      console.error('Failed to update security metrics:', error);
    }
  }

  async createApiKey(keyData) {
    try {
      const newKey = {
        id: keyData.id || this.generateKeyId(),
        key: 'ak_' + this.generateSecureKey(),
        name: keyData.name,
        description: keyData.description,
        userId: keyData.userId,
        permissions: keyData.permissions || [],
        rateLimit: keyData.rateLimit || {
          windowSize: 60000,
          maxRequests: 100
        },
        enabled: true,
        createdAt: new Date().toISOString(),
        expiresAt: keyData.expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        lastUsed: null,
        usageCount: 0
      };

      this.apiKeys.set(newKey.key, newKey);
      await this.saveApiKeys();

      await this.auditService.logEvent('api_key_created', {
        key_id: newKey.id,
        name: newKey.name,
        user_id: newKey.userId,
        permissions: newKey.permissions,
        timestamp: new Date().toISOString()
      });

      this.emit('apiKeyCreated', newKey);
      return newKey;
    } catch (error) {
      console.error('Failed to create API key:', error);
      throw error;
    }
  }

  async createAccessToken(tokenData) {
    try {
      const newToken = {
        token: 'at_' + this.generateSecureKey(),
        user: tokenData.user,
        permissions: tokenData.permissions || [],
        scopes: tokenData.scopes || [],
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + (tokenData.expiresIn || 3600000)).toISOString(),
        lastUsed: null,
        usageCount: 0
      };

      this.accessTokens.set(newToken.token, newToken);
      await this.saveAccessTokens();

      await this.auditService.logEvent('access_token_created', {
        user_id: tokenData.user.id,
        permissions: newToken.permissions,
        scopes: newToken.scopes,
        expires_at: newToken.expiresAt,
        timestamp: new Date().toISOString()
      });

      this.emit('accessTokenCreated', newToken);
      return newToken;
    } catch (error) {
      console.error('Failed to create access token:', error);
      throw error;
    }
  }

  async cleanupExpiredTokens() {
    try {
      const now = new Date();
      let expiredCount = 0;

      // Clean up access tokens
      for (const [token, tokenData] of this.accessTokens) {
        if (new Date(tokenData.expiresAt) < now) {
          this.accessTokens.delete(token);
          expiredCount++;
        }
      }

      // Clean up API keys
      for (const [key, keyData] of this.apiKeys) {
        if (keyData.expiresAt && new Date(keyData.expiresAt) < now) {
          this.apiKeys.delete(key);
          expiredCount++;
        }
      }

      if (expiredCount > 0) {
        await this.saveAccessTokens();
        await this.saveApiKeys();

        await this.auditService.logEvent('expired_tokens_cleaned', {
          count: expiredCount,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to cleanup expired tokens:', error);
    }
  }

  async cleanupOldRequestLogs() {
    try {
      const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
      const originalCount = this.requestLog.length;
      
      this.requestLog = this.requestLog.filter(log => 
        new Date(log.timestamp).getTime() > cutoffTime
      );

      const cleanedCount = originalCount - this.requestLog.length;
      if (cleanedCount > 0) {
        await this.auditService.logEvent('old_request_logs_cleaned', {
          count: cleanedCount,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to cleanup old request logs:', error);
    }
  }

  async cleanupRateLimitData() {
    try {
      let cleanedCount = 0;
      
      for (const limiter of this.rateLimiters.values()) {
        const now = Date.now();
        const originalSize = limiter.requests.size;
        
        for (const [clientId, clientData] of limiter.requests) {
          if (now - clientData.windowStart > limiter.windowSize * 2) {
            limiter.requests.delete(clientId);
          }
        }
        
        cleanedCount += originalSize - limiter.requests.size;
      }

      if (cleanedCount > 0) {
        await this.auditService.logEvent('rate_limit_data_cleaned', {
          count: cleanedCount,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to cleanup rate limit data:', error);
    }
  }

  async saveApiKeys() {
    try {
      const keyList = Array.from(this.apiKeys.values());
      await this.storageService.setItem('api_keys', keyList);
    } catch (error) {
      console.error('Failed to save API keys:', error);
    }
  }

  async saveAccessTokens() {
    try {
      const tokenList = Array.from(this.accessTokens.values());
      await this.storageService.setItem('access_tokens', tokenList);
    } catch (error) {
      console.error('Failed to save access tokens:', error);
    }
  }

  async saveBlacklistedIPs() {
    try {
      const ipList = Array.from(this.blacklistedIPs);
      await this.storageService.setItem('blacklisted_ips', ipList);
    } catch (error) {
      console.error('Failed to save blacklisted IPs:', error);
    }
  }

  async saveSecurityMetrics() {
    try {
      await this.storageService.setItem('api_security_metrics', this.securityMetrics);
    } catch (error) {
      console.error('Failed to save security metrics:', error);
    }
  }

  generateSecureKey() {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  generateKeyId() {
    return `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateLogId() {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getSecurityMetrics() {
    return this.securityMetrics;
  }

  getRequestLog(limit = 100) {
    return this.requestLog.slice(-limit);
  }

  getApiKeys() {
    return Array.from(this.apiKeys.values());
  }

  getRateLimiters() {
    return Array.from(this.rateLimiters.values());
  }

  getSecurityPolicies() {
    return Array.from(this.securityPolicies.values());
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
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
        this.cleanupInterval = null;
      }

      this.listeners = [];
      this.rateLimiters.clear();
      this.blacklistedIPs.clear();
      this.apiKeys.clear();
      this.accessTokens.clear();
      this.securityPolicies.clear();
      this.alertRules.clear();
      this.requestLog = [];
      this.initialized = false;
      
      await this.auditService.logEvent('api_security_service_cleanup', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to cleanup ApiSecurityService:', error);
    }
  }
}

export { ApiSecurityService };