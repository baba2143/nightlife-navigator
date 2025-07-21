import { LocalStorageService } from './LocalStorageService';
import { AuditLogService } from './AuditLogService';

class SystemHealthService {
  constructor() {
    this.initialized = false;
    this.storageService = null;
    this.auditService = null;
    this.healthChecks = new Map();
    this.healthStatus = {
      overall: 'unknown',
      components: {},
      lastCheck: null,
      issues: []
    };
    this.monitoringConfig = {
      enabled: true,
      interval: 30000, // 30 seconds
      thresholds: {
        response_time: 5000, // 5 seconds
        memory_usage: 85, // 85%
        cpu_usage: 80, // 80%
        disk_usage: 90, // 90%
        error_rate: 5, // 5%
        availability: 99.9 // 99.9%
      }
    };
    this.metrics = {
      system: {
        uptime: 0,
        memory: { used: 0, total: 0, percentage: 0 },
        cpu: { usage: 0, processes: 0 },
        disk: { used: 0, total: 0, percentage: 0 },
        network: { latency: 0, throughput: 0 }
      },
      application: {
        response_time: 0,
        error_rate: 0,
        active_users: 0,
        api_calls: 0,
        database_connections: 0
      }
    };
    this.alertRules = new Map();
    this.listeners = [];
    this.monitoringInterval = null;
  }

  static getInstance() {
    if (!SystemHealthService.instance) {
      SystemHealthService.instance = new SystemHealthService();
    }
    return SystemHealthService.instance;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      this.storageService = LocalStorageService.getInstance();
      this.auditService = AuditLogService.getInstance();
      
      await this.loadHealthChecks();
      await this.loadMonitoringConfig();
      await this.loadAlertRules();
      await this.startMonitoring();
      
      this.initialized = true;
      
      await this.auditService.logEvent('system_health_service_initialized', {
        timestamp: new Date().toISOString(),
        health_checks: this.healthChecks.size,
        monitoring_enabled: this.monitoringConfig.enabled
      });
      
      this.emit('serviceInitialized');
    } catch (error) {
      console.error('Failed to initialize SystemHealthService:', error);
      throw error;
    }
  }

  async loadHealthChecks() {
    try {
      const checks = await this.storageService.getItem('health_checks');
      const checkList = checks || [
        {
          id: 'api_server',
          name: 'API Server',
          type: 'http',
          url: 'https://api.nightlife-navigator.com/health',
          method: 'GET',
          timeout: 5000,
          expected_status: 200,
          critical: true,
          enabled: true
        },
        {
          id: 'database',
          name: 'Database Connection',
          type: 'database',
          connection_string: 'postgresql://localhost:5432/nightlife_db',
          timeout: 3000,
          critical: true,
          enabled: true
        },
        {
          id: 'redis_cache',
          name: 'Redis Cache',
          type: 'redis',
          host: 'localhost',
          port: 6379,
          timeout: 2000,
          critical: false,
          enabled: true
        },
        {
          id: 'firebase_auth',
          name: 'Firebase Authentication',
          type: 'firebase',
          service: 'auth',
          timeout: 5000,
          critical: true,
          enabled: true
        },
        {
          id: 'push_notifications',
          name: 'Push Notification Service',
          type: 'fcm',
          timeout: 5000,
          critical: false,
          enabled: true
        },
        {
          id: 'storage_service',
          name: 'File Storage',
          type: 'storage',
          provider: 'aws_s3',
          bucket: 'nightlife-assets',
          timeout: 10000,
          critical: false,
          enabled: true
        },
        {
          id: 'payment_gateway',
          name: 'Payment Gateway',
          type: 'payment',
          provider: 'stripe',
          timeout: 8000,
          critical: true,
          enabled: true
        },
        {
          id: 'geolocation_service',
          name: 'Geolocation Service',
          type: 'geolocation',
          provider: 'google_maps',
          timeout: 5000,
          critical: false,
          enabled: true
        }
      ];

      this.healthChecks.clear();
      checkList.forEach(check => {
        this.healthChecks.set(check.id, {
          ...check,
          status: 'unknown',
          last_check: null,
          response_time: null,
          error_message: null,
          consecutive_failures: 0
        });
      });

      await this.storageService.setItem('health_checks', checkList);
    } catch (error) {
      console.error('Failed to load health checks:', error);
      this.healthChecks.clear();
    }
  }

  async loadMonitoringConfig() {
    try {
      const config = await this.storageService.getItem('monitoring_config');
      if (config) {
        this.monitoringConfig = { ...this.monitoringConfig, ...config };
      }
    } catch (error) {
      console.error('Failed to load monitoring config:', error);
    }
  }

  async loadAlertRules() {
    try {
      const rules = await this.storageService.getItem('alert_rules');
      const ruleList = rules || [
        {
          id: 'critical_service_down',
          name: 'Critical Service Down',
          condition: 'health_check_failure',
          parameters: {
            service_critical: true,
            consecutive_failures: 3
          },
          severity: 'critical',
          enabled: true
        },
        {
          id: 'high_error_rate',
          name: 'High Error Rate',
          condition: 'error_rate_threshold',
          parameters: {
            threshold: 5,
            duration: 300000 // 5 minutes
          },
          severity: 'high',
          enabled: true
        },
        {
          id: 'high_response_time',
          name: 'High Response Time',
          condition: 'response_time_threshold',
          parameters: {
            threshold: 5000,
            duration: 180000 // 3 minutes
          },
          severity: 'medium',
          enabled: true
        },
        {
          id: 'memory_usage_high',
          name: 'High Memory Usage',
          condition: 'memory_threshold',
          parameters: {
            threshold: 85,
            duration: 600000 // 10 minutes
          },
          severity: 'medium',
          enabled: true
        },
        {
          id: 'disk_space_low',
          name: 'Low Disk Space',
          condition: 'disk_threshold',
          parameters: {
            threshold: 90,
            duration: 0 // Immediate
          },
          severity: 'high',
          enabled: true
        }
      ];

      this.alertRules.clear();
      ruleList.forEach(rule => {
        this.alertRules.set(rule.id, rule);
      });

      await this.storageService.setItem('alert_rules', ruleList);
    } catch (error) {
      console.error('Failed to load alert rules:', error);
      this.alertRules.clear();
    }
  }

  async startMonitoring() {
    if (!this.monitoringConfig.enabled) return;

    // Initial health check
    await this.performHealthCheck();

    // Start periodic monitoring
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
        await this.collectMetrics();
        await this.evaluateAlerts();
      } catch (error) {
        console.error('Monitoring error:', error);
      }
    }, this.monitoringConfig.interval);

    await this.auditService.logEvent('monitoring_started', {
      interval: this.monitoringConfig.interval,
      timestamp: new Date().toISOString()
    });
  }

  async performHealthCheck() {
    try {
      const results = [];
      const startTime = Date.now();

      // Run all enabled health checks
      for (const [checkId, check] of this.healthChecks) {
        if (!check.enabled) continue;

        const result = await this.runHealthCheck(check);
        results.push(result);
        
        // Update check status
        this.healthChecks.set(checkId, {
          ...check,
          ...result,
          last_check: new Date().toISOString()
        });
      }

      // Calculate overall health status
      const overallStatus = this.calculateOverallStatus(results);
      const endTime = Date.now();

      this.healthStatus = {
        overall: overallStatus,
        components: Object.fromEntries(this.healthChecks),
        lastCheck: new Date().toISOString(),
        checkDuration: endTime - startTime,
        issues: results.filter(r => r.status !== 'healthy').map(r => ({
          component: r.id,
          status: r.status,
          message: r.error_message,
          critical: r.critical
        }))
      };

      await this.auditService.logEvent('health_check_completed', {
        overall_status: overallStatus,
        check_duration: endTime - startTime,
        issues_count: this.healthStatus.issues.length,
        timestamp: new Date().toISOString()
      });

      this.emit('healthCheckCompleted', this.healthStatus);
    } catch (error) {
      console.error('Failed to perform health check:', error);
      this.healthStatus.overall = 'error';
      this.healthStatus.issues.push({
        component: 'health_check_system',
        status: 'error',
        message: error.message,
        critical: true
      });
    }
  }

  async runHealthCheck(check) {
    const startTime = Date.now();
    
    try {
      let result = { id: check.id, status: 'healthy', response_time: null, error_message: null };

      switch (check.type) {
        case 'http':
          result = await this.checkHttpEndpoint(check);
          break;
        case 'database':
          result = await this.checkDatabase(check);
          break;
        case 'redis':
          result = await this.checkRedis(check);
          break;
        case 'firebase':
          result = await this.checkFirebase(check);
          break;
        case 'fcm':
          result = await this.checkFCM(check);
          break;
        case 'storage':
          result = await this.checkStorage(check);
          break;
        case 'payment':
          result = await this.checkPaymentGateway(check);
          break;
        case 'geolocation':
          result = await this.checkGeolocation(check);
          break;
        default:
          result = { ...result, status: 'unknown', error_message: 'Unknown check type' };
      }

      result.response_time = Date.now() - startTime;
      result.critical = check.critical;

      // Update consecutive failures
      if (result.status === 'healthy') {
        result.consecutive_failures = 0;
      } else {
        result.consecutive_failures = (check.consecutive_failures || 0) + 1;
      }

      return result;
    } catch (error) {
      return {
        id: check.id,
        status: 'error',
        response_time: Date.now() - startTime,
        error_message: error.message,
        critical: check.critical,
        consecutive_failures: (check.consecutive_failures || 0) + 1
      };
    }
  }

  async checkHttpEndpoint(check) {
    // Simulate HTTP endpoint check
    await this.delay(Math.random() * 1000);
    
    const isHealthy = Math.random() > 0.05; // 95% success rate
    
    return {
      id: check.id,
      status: isHealthy ? 'healthy' : 'unhealthy',
      error_message: isHealthy ? null : 'HTTP endpoint not responding'
    };
  }

  async checkDatabase(check) {
    // Simulate database check
    await this.delay(Math.random() * 500);
    
    const isHealthy = Math.random() > 0.02; // 98% success rate
    
    return {
      id: check.id,
      status: isHealthy ? 'healthy' : 'unhealthy',
      error_message: isHealthy ? null : 'Database connection failed'
    };
  }

  async checkRedis(check) {
    // Simulate Redis check
    await this.delay(Math.random() * 200);
    
    const isHealthy = Math.random() > 0.03; // 97% success rate
    
    return {
      id: check.id,
      status: isHealthy ? 'healthy' : 'unhealthy',
      error_message: isHealthy ? null : 'Redis connection failed'
    };
  }

  async checkFirebase(check) {
    // Simulate Firebase check
    await this.delay(Math.random() * 800);
    
    const isHealthy = Math.random() > 0.01; // 99% success rate
    
    return {
      id: check.id,
      status: isHealthy ? 'healthy' : 'unhealthy',
      error_message: isHealthy ? null : 'Firebase service unavailable'
    };
  }

  async checkFCM(check) {
    // Simulate FCM check
    await this.delay(Math.random() * 600);
    
    const isHealthy = Math.random() > 0.04; // 96% success rate
    
    return {
      id: check.id,
      status: isHealthy ? 'healthy' : 'unhealthy',
      error_message: isHealthy ? null : 'FCM service unavailable'
    };
  }

  async checkStorage(check) {
    // Simulate storage check
    await this.delay(Math.random() * 1200);
    
    const isHealthy = Math.random() > 0.02; // 98% success rate
    
    return {
      id: check.id,
      status: isHealthy ? 'healthy' : 'unhealthy',
      error_message: isHealthy ? null : 'Storage service unavailable'
    };
  }

  async checkPaymentGateway(check) {
    // Simulate payment gateway check
    await this.delay(Math.random() * 1000);
    
    const isHealthy = Math.random() > 0.01; // 99% success rate
    
    return {
      id: check.id,
      status: isHealthy ? 'healthy' : 'unhealthy',
      error_message: isHealthy ? null : 'Payment gateway unavailable'
    };
  }

  async checkGeolocation(check) {
    // Simulate geolocation service check
    await this.delay(Math.random() * 700);
    
    const isHealthy = Math.random() > 0.03; // 97% success rate
    
    return {
      id: check.id,
      status: isHealthy ? 'healthy' : 'unhealthy',
      error_message: isHealthy ? null : 'Geolocation service unavailable'
    };
  }

  calculateOverallStatus(results) {
    const criticalIssues = results.filter(r => r.critical && r.status !== 'healthy');
    const anyIssues = results.filter(r => r.status !== 'healthy');
    
    if (criticalIssues.length > 0) {
      return 'critical';
    } else if (anyIssues.length > 0) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  async collectMetrics() {
    try {
      // Simulate system metrics collection
      this.metrics.system = {
        uptime: Date.now() - (Date.now() % (24 * 60 * 60 * 1000)), // Mock uptime
        memory: {
          used: Math.random() * 8 * 1024 * 1024 * 1024, // 0-8GB
          total: 8 * 1024 * 1024 * 1024, // 8GB
          percentage: Math.random() * 100
        },
        cpu: {
          usage: Math.random() * 100,
          processes: Math.floor(Math.random() * 200) + 50
        },
        disk: {
          used: Math.random() * 500 * 1024 * 1024 * 1024, // 0-500GB
          total: 500 * 1024 * 1024 * 1024, // 500GB
          percentage: Math.random() * 100
        },
        network: {
          latency: Math.random() * 100,
          throughput: Math.random() * 1000
        }
      };

      // Simulate application metrics
      this.metrics.application = {
        response_time: Math.random() * 2000,
        error_rate: Math.random() * 10,
        active_users: Math.floor(Math.random() * 1000),
        api_calls: Math.floor(Math.random() * 10000),
        database_connections: Math.floor(Math.random() * 100)
      };

      this.emit('metricsCollected', this.metrics);
    } catch (error) {
      console.error('Failed to collect metrics:', error);
    }
  }

  async evaluateAlerts() {
    try {
      for (const [ruleId, rule] of this.alertRules) {
        if (!rule.enabled) continue;

        const shouldAlert = await this.evaluateAlertRule(rule);
        
        if (shouldAlert) {
          await this.triggerAlert(rule);
        }
      }
    } catch (error) {
      console.error('Failed to evaluate alerts:', error);
    }
  }

  async evaluateAlertRule(rule) {
    try {
      switch (rule.condition) {
        case 'health_check_failure':
          return this.evaluateHealthCheckFailure(rule);
        case 'error_rate_threshold':
          return this.evaluateErrorRateThreshold(rule);
        case 'response_time_threshold':
          return this.evaluateResponseTimeThreshold(rule);
        case 'memory_threshold':
          return this.evaluateMemoryThreshold(rule);
        case 'disk_threshold':
          return this.evaluateDiskThreshold(rule);
        default:
          return false;
      }
    } catch (error) {
      console.error('Failed to evaluate alert rule:', error);
      return false;
    }
  }

  evaluateHealthCheckFailure(rule) {
    const criticalServices = Array.from(this.healthChecks.values())
      .filter(check => check.critical && check.status !== 'healthy');
    
    return criticalServices.some(service => 
      service.consecutive_failures >= rule.parameters.consecutive_failures
    );
  }

  evaluateErrorRateThreshold(rule) {
    return this.metrics.application.error_rate > rule.parameters.threshold;
  }

  evaluateResponseTimeThreshold(rule) {
    return this.metrics.application.response_time > rule.parameters.threshold;
  }

  evaluateMemoryThreshold(rule) {
    return this.metrics.system.memory.percentage > rule.parameters.threshold;
  }

  evaluateDiskThreshold(rule) {
    return this.metrics.system.disk.percentage > rule.parameters.threshold;
  }

  async triggerAlert(rule) {
    try {
      const alert = {
        id: this.generateAlertId(),
        rule_id: rule.id,
        rule_name: rule.name,
        severity: rule.severity,
        message: this.generateAlertMessage(rule),
        timestamp: new Date().toISOString(),
        acknowledged: false,
        resolved: false
      };

      await this.auditService.logEvent('alert_triggered', {
        alert_id: alert.id,
        rule_id: rule.id,
        severity: rule.severity,
        timestamp: new Date().toISOString()
      });

      this.emit('alertTriggered', alert);
      
      // In a real system, this would send notifications
      console.warn(`ALERT: ${alert.rule_name} - ${alert.message}`);
    } catch (error) {
      console.error('Failed to trigger alert:', error);
    }
  }

  generateAlertMessage(rule) {
    const messages = {
      critical_service_down: 'Critical service is down',
      high_error_rate: `Error rate is ${this.metrics.application.error_rate.toFixed(2)}%`,
      high_response_time: `Response time is ${this.metrics.application.response_time.toFixed(0)}ms`,
      memory_usage_high: `Memory usage is ${this.metrics.system.memory.percentage.toFixed(1)}%`,
      disk_space_low: `Disk usage is ${this.metrics.system.disk.percentage.toFixed(1)}%`
    };

    return messages[rule.id] || 'System health issue detected';
  }

  async updateHealthCheck(checkId, updates) {
    try {
      const check = this.healthChecks.get(checkId);
      if (!check) {
        throw new Error(`Health check ${checkId} not found`);
      }

      const updatedCheck = { ...check, ...updates };
      this.healthChecks.set(checkId, updatedCheck);

      const checkList = Array.from(this.healthChecks.values());
      await this.storageService.setItem('health_checks', checkList);

      await this.auditService.logEvent('health_check_updated', {
        check_id: checkId,
        updates: updates,
        timestamp: new Date().toISOString()
      });

      this.emit('healthCheckUpdated', { checkId, check: updatedCheck });
      return updatedCheck;
    } catch (error) {
      console.error('Failed to update health check:', error);
      throw error;
    }
  }

  async updateMonitoringConfig(config) {
    try {
      this.monitoringConfig = { ...this.monitoringConfig, ...config };
      await this.storageService.setItem('monitoring_config', this.monitoringConfig);

      // Restart monitoring with new config
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
        this.monitoringInterval = null;
      }

      if (this.monitoringConfig.enabled) {
        await this.startMonitoring();
      }

      await this.auditService.logEvent('monitoring_config_updated', {
        config: this.monitoringConfig,
        timestamp: new Date().toISOString()
      });

      this.emit('monitoringConfigUpdated', this.monitoringConfig);
      return this.monitoringConfig;
    } catch (error) {
      console.error('Failed to update monitoring config:', error);
      throw error;
    }
  }

  getHealthStatus() {
    return this.healthStatus;
  }

  getMetrics() {
    return this.metrics;
  }

  getHealthChecks() {
    return Array.from(this.healthChecks.values());
  }

  getAlertRules() {
    return Array.from(this.alertRules.values());
  }

  async generateHealthReport() {
    try {
      const report = {
        generated_at: new Date().toISOString(),
        overall_status: this.healthStatus.overall,
        uptime: this.metrics.system.uptime,
        health_checks: {
          total: this.healthChecks.size,
          healthy: Array.from(this.healthChecks.values()).filter(c => c.status === 'healthy').length,
          unhealthy: Array.from(this.healthChecks.values()).filter(c => c.status === 'unhealthy').length,
          critical_issues: Array.from(this.healthChecks.values()).filter(c => c.critical && c.status !== 'healthy').length
        },
        performance: {
          avg_response_time: this.metrics.application.response_time,
          error_rate: this.metrics.application.error_rate,
          active_users: this.metrics.application.active_users
        },
        resources: {
          memory_usage: this.metrics.system.memory.percentage,
          cpu_usage: this.metrics.system.cpu.usage,
          disk_usage: this.metrics.system.disk.percentage
        },
        recommendations: this.generateRecommendations()
      };

      return report;
    } catch (error) {
      console.error('Failed to generate health report:', error);
      throw error;
    }
  }

  generateRecommendations() {
    const recommendations = [];

    // Check for critical issues
    const criticalIssues = Array.from(this.healthChecks.values())
      .filter(c => c.critical && c.status !== 'healthy');
    
    if (criticalIssues.length > 0) {
      recommendations.push({
        priority: 'critical',
        message: `${criticalIssues.length} critical service(s) are down`,
        action: 'Investigate and resolve critical service issues immediately'
      });
    }

    // Check resource usage
    if (this.metrics.system.memory.percentage > 80) {
      recommendations.push({
        priority: 'high',
        message: 'High memory usage detected',
        action: 'Consider scaling up memory or optimizing application'
      });
    }

    if (this.metrics.system.disk.percentage > 85) {
      recommendations.push({
        priority: 'high',
        message: 'Low disk space',
        action: 'Clean up old files or increase disk capacity'
      });
    }

    if (this.metrics.application.error_rate > 2) {
      recommendations.push({
        priority: 'medium',
        message: 'Elevated error rate',
        action: 'Review application logs for error patterns'
      });
    }

    return recommendations;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
        this.monitoringInterval = null;
      }

      this.listeners = [];
      this.healthChecks.clear();
      this.alertRules.clear();
      this.initialized = false;
      
      await this.auditService.logEvent('system_health_service_cleanup', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to cleanup SystemHealthService:', error);
    }
  }
}

export { SystemHealthService };