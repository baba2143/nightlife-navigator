import { LocalStorageService } from './LocalStorageService';
import { AuditLogService } from './AuditLogService';

class SecurityScanService {
  constructor() {
    this.initialized = false;
    this.storageService = null;
    this.auditService = null;
    this.scanResults = new Map();
    this.scanConfigurations = new Map();
    this.vulnerabilityDatabase = new Map();
    this.scanHistory = [];
    this.activeScanners = new Map();
    this.scanSchedule = {
      enabled: true,
      interval: 24 * 60 * 60 * 1000, // 24 hours
      quickScanInterval: 4 * 60 * 60 * 1000, // 4 hours
      lastFullScan: null,
      lastQuickScan: null
    };
    this.securityThresholds = {
      critical: 0, // No critical vulnerabilities allowed
      high: 5,
      medium: 20,
      low: 50
    };
    this.listeners = [];
    this.scanTimer = null;
  }

  static getInstance() {
    if (!SecurityScanService.instance) {
      SecurityScanService.instance = new SecurityScanService();
    }
    return SecurityScanService.instance;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      this.storageService = LocalStorageService.getInstance();
      this.auditService = AuditLogService.getInstance();
      
      await this.loadScanConfigurations();
      await this.loadVulnerabilityDatabase();
      await this.loadScanHistory();
      await this.loadScanSchedule();
      await this.initializeScanners();
      await this.startScheduledScans();
      
      this.initialized = true;
      
      await this.auditService.logEvent('security_scan_service_initialized', {
        timestamp: new Date().toISOString(),
        scanners_count: this.activeScanners.size,
        vulnerability_db_size: this.vulnerabilityDatabase.size
      });
      
      this.emit('serviceInitialized');
    } catch (error) {
      console.error('Failed to initialize SecurityScanService:', error);
      throw error;
    }
  }

  async loadScanConfigurations() {
    try {
      const configs = await this.storageService.getItem('security_scan_configs');
      const configList = configs || [
        {
          id: 'dependency_scan',
          name: 'Dependency Vulnerability Scan',
          type: 'dependency',
          description: 'Scans for known vulnerabilities in dependencies',
          enabled: true,
          severity: ['critical', 'high', 'medium', 'low'],
          targets: ['package.json', 'yarn.lock', 'package-lock.json'],
          frequency: 'daily'
        },
        {
          id: 'code_scan',
          name: 'Static Code Analysis',
          type: 'sast',
          description: 'Static analysis for security vulnerabilities in code',
          enabled: true,
          severity: ['critical', 'high', 'medium'],
          targets: ['src/**/*.js', 'src/**/*.jsx', 'src/**/*.ts', 'src/**/*.tsx'],
          frequency: 'daily'
        },
        {
          id: 'api_scan',
          name: 'API Security Scan',
          type: 'api',
          description: 'Scans API endpoints for security vulnerabilities',
          enabled: true,
          severity: ['critical', 'high', 'medium'],
          targets: ['api/**/*.js', 'api/**/*.ts'],
          frequency: 'daily'
        },
        {
          id: 'config_scan',
          name: 'Configuration Security Scan',
          type: 'config',
          description: 'Scans configuration files for security issues',
          enabled: true,
          severity: ['critical', 'high', 'medium'],
          targets: ['*.json', '*.yaml', '*.yml', '.env*'],
          frequency: 'weekly'
        },
        {
          id: 'secrets_scan',
          name: 'Secrets Detection',
          type: 'secrets',
          description: 'Detects exposed secrets, keys, and credentials',
          enabled: true,
          severity: ['critical', 'high'],
          targets: ['**/*'],
          frequency: 'daily'
        },
        {
          id: 'mobile_scan',
          name: 'Mobile App Security Scan',
          type: 'mobile',
          description: 'Mobile-specific security vulnerability scan',
          enabled: true,
          severity: ['critical', 'high', 'medium'],
          targets: ['android/**/*', 'ios/**/*'],
          frequency: 'weekly'
        }
      ];

      this.scanConfigurations.clear();
      configList.forEach(config => {
        this.scanConfigurations.set(config.id, config);
      });

      await this.storageService.setItem('security_scan_configs', configList);
    } catch (error) {
      console.error('Failed to load scan configurations:', error);
      this.scanConfigurations.clear();
    }
  }

  async loadVulnerabilityDatabase() {
    try {
      const database = await this.storageService.getItem('vulnerability_database');
      const vulnerabilities = database || [
        {
          id: 'CVE-2023-1234',
          title: 'SQL Injection Vulnerability',
          description: 'Improper input validation leading to SQL injection',
          severity: 'critical',
          cvss: 9.8,
          category: 'injection',
          cwe: 'CWE-89',
          references: ['https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-1234'],
          affected_versions: ['*'],
          solution: 'Use parameterized queries and input validation'
        },
        {
          id: 'CVE-2023-5678',
          title: 'Cross-Site Scripting (XSS)',
          description: 'Reflected XSS vulnerability in user input handling',
          severity: 'high',
          cvss: 7.5,
          category: 'xss',
          cwe: 'CWE-79',
          references: ['https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-5678'],
          affected_versions: ['< 2.1.0'],
          solution: 'Implement proper output encoding and CSP headers'
        },
        {
          id: 'CVE-2023-9012',
          title: 'Insecure Direct Object References',
          description: 'Missing authorization checks for object access',
          severity: 'high',
          cvss: 8.1,
          category: 'authorization',
          cwe: 'CWE-639',
          references: ['https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-9012'],
          affected_versions: ['*'],
          solution: 'Implement proper authorization checks'
        },
        {
          id: 'MOBILE-2023-001',
          title: 'Insecure Data Storage',
          description: 'Sensitive data stored without encryption',
          severity: 'medium',
          cvss: 6.5,
          category: 'data_storage',
          cwe: 'CWE-922',
          references: ['https://owasp.org/www-project-mobile-top-10/'],
          affected_versions: ['*'],
          solution: 'Use secure storage mechanisms and encryption'
        },
        {
          id: 'MOBILE-2023-002',
          title: 'Insufficient Transport Layer Protection',
          description: 'Weak SSL/TLS configuration',
          severity: 'high',
          cvss: 7.4,
          category: 'transport',
          cwe: 'CWE-319',
          references: ['https://owasp.org/www-project-mobile-top-10/'],
          affected_versions: ['*'],
          solution: 'Implement proper SSL/TLS configuration and certificate pinning'
        }
      ];

      this.vulnerabilityDatabase.clear();
      vulnerabilities.forEach(vuln => {
        this.vulnerabilityDatabase.set(vuln.id, vuln);
      });

      await this.storageService.setItem('vulnerability_database', vulnerabilities);
    } catch (error) {
      console.error('Failed to load vulnerability database:', error);
      this.vulnerabilityDatabase.clear();
    }
  }

  async loadScanHistory() {
    try {
      const history = await this.storageService.getItem('security_scan_history');
      this.scanHistory = history || [];
    } catch (error) {
      console.error('Failed to load scan history:', error);
      this.scanHistory = [];
    }
  }

  async loadScanSchedule() {
    try {
      const schedule = await this.storageService.getItem('security_scan_schedule');
      if (schedule) {
        this.scanSchedule = { ...this.scanSchedule, ...schedule };
      }
    } catch (error) {
      console.error('Failed to load scan schedule:', error);
    }
  }

  async initializeScanners() {
    try {
      const scanners = {
        dependency: new DependencyScanner(),
        sast: new StaticAnalysisScanner(),
        api: new ApiSecurityScanner(),
        config: new ConfigurationScanner(),
        secrets: new SecretsScanner(),
        mobile: new MobileSecurityScanner()
      };

      this.activeScanners.clear();
      for (const [type, scanner] of Object.entries(scanners)) {
        this.activeScanners.set(type, scanner);
      }
    } catch (error) {
      console.error('Failed to initialize scanners:', error);
    }
  }

  async startScheduledScans() {
    if (!this.scanSchedule.enabled) return;

    // Start periodic scanning
    this.scanTimer = setInterval(async () => {
      try {
        await this.performScheduledScan();
      } catch (error) {
        console.error('Scheduled scan error:', error);
      }
    }, this.scanSchedule.quickScanInterval);

    // Perform initial scan
    await this.performScheduledScan();

    await this.auditService.logEvent('scheduled_scans_started', {
      quick_scan_interval: this.scanSchedule.quickScanInterval,
      full_scan_interval: this.scanSchedule.interval,
      timestamp: new Date().toISOString()
    });
  }

  async performScheduledScan() {
    try {
      const now = new Date();
      
      // Check if full scan is needed
      const lastFullScan = this.scanSchedule.lastFullScan ? new Date(this.scanSchedule.lastFullScan) : null;
      const needsFullScan = !lastFullScan || (now - lastFullScan) > this.scanSchedule.interval;
      
      if (needsFullScan) {
        await this.performFullScan();
        this.scanSchedule.lastFullScan = now.toISOString();
      } else {
        await this.performQuickScan();
      }
      
      this.scanSchedule.lastQuickScan = now.toISOString();
      await this.storageService.setItem('security_scan_schedule', this.scanSchedule);
    } catch (error) {
      console.error('Failed to perform scheduled scan:', error);
    }
  }

  async performFullScan() {
    try {
      const scanId = this.generateScanId();
      const startTime = Date.now();
      
      await this.auditService.logEvent('full_security_scan_started', {
        scan_id: scanId,
        timestamp: new Date().toISOString()
      });

      const results = [];
      
      // Run all enabled scanners
      for (const [configId, config] of this.scanConfigurations) {
        if (!config.enabled) continue;
        
        const scanner = this.activeScanners.get(config.type);
        if (!scanner) continue;
        
        const scanResult = await this.runScanner(scanner, config, scanId);
        results.push(scanResult);
      }

      const endTime = Date.now();
      const scanSummary = this.generateScanSummary(results, scanId, startTime, endTime);
      
      // Store results
      this.scanResults.set(scanId, scanSummary);
      this.scanHistory.push({
        id: scanId,
        type: 'full',
        timestamp: new Date().toISOString(),
        duration: endTime - startTime,
        summary: scanSummary
      });

      await this.storageService.setItem('security_scan_history', this.scanHistory);
      
      // Check thresholds and alert if needed
      await this.checkSecurityThresholds(scanSummary);

      await this.auditService.logEvent('full_security_scan_completed', {
        scan_id: scanId,
        duration: endTime - startTime,
        vulnerabilities_found: scanSummary.totalVulnerabilities,
        critical_count: scanSummary.severityBreakdown.critical,
        timestamp: new Date().toISOString()
      });

      this.emit('scanCompleted', scanSummary);
      return scanSummary;
    } catch (error) {
      console.error('Failed to perform full scan:', error);
      throw error;
    }
  }

  async performQuickScan() {
    try {
      const scanId = this.generateScanId();
      const startTime = Date.now();
      
      // Quick scan focuses on critical scanners only
      const quickScanTypes = ['secrets', 'dependency'];
      const results = [];
      
      for (const [configId, config] of this.scanConfigurations) {
        if (!config.enabled || !quickScanTypes.includes(config.type)) continue;
        
        const scanner = this.activeScanners.get(config.type);
        if (!scanner) continue;
        
        const scanResult = await this.runScanner(scanner, config, scanId);
        results.push(scanResult);
      }

      const endTime = Date.now();
      const scanSummary = this.generateScanSummary(results, scanId, startTime, endTime);
      scanSummary.type = 'quick';
      
      // Store results
      this.scanResults.set(scanId, scanSummary);
      
      // Only alert for critical/high severity issues in quick scans
      if (scanSummary.severityBreakdown.critical > 0 || scanSummary.severityBreakdown.high > 0) {
        await this.checkSecurityThresholds(scanSummary);
      }

      this.emit('quickScanCompleted', scanSummary);
      return scanSummary;
    } catch (error) {
      console.error('Failed to perform quick scan:', error);
      throw error;
    }
  }

  async runScanner(scanner, config, scanId) {
    try {
      const startTime = Date.now();
      
      const scanResult = await scanner.scan(config, this.vulnerabilityDatabase);
      
      const endTime = Date.now();
      
      return {
        scanId: scanId,
        configId: config.id,
        scannerType: config.type,
        startTime: startTime,
        endTime: endTime,
        duration: endTime - startTime,
        vulnerabilities: scanResult.vulnerabilities || [],
        metadata: scanResult.metadata || {}
      };
    } catch (error) {
      console.error(`Scanner ${config.type} failed:`, error);
      return {
        scanId: scanId,
        configId: config.id,
        scannerType: config.type,
        error: error.message,
        vulnerabilities: [],
        metadata: {}
      };
    }
  }

  generateScanSummary(results, scanId, startTime, endTime) {
    const allVulnerabilities = results.flatMap(result => result.vulnerabilities || []);
    
    const severityBreakdown = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    const categoryBreakdown = {};
    
    allVulnerabilities.forEach(vuln => {
      if (severityBreakdown[vuln.severity] !== undefined) {
        severityBreakdown[vuln.severity]++;
      }
      
      if (vuln.category) {
        categoryBreakdown[vuln.category] = (categoryBreakdown[vuln.category] || 0) + 1;
      }
    });

    return {
      id: scanId,
      type: 'full',
      timestamp: new Date().toISOString(),
      startTime: startTime,
      endTime: endTime,
      duration: endTime - startTime,
      totalVulnerabilities: allVulnerabilities.length,
      severityBreakdown: severityBreakdown,
      categoryBreakdown: categoryBreakdown,
      scanResults: results,
      vulnerabilities: allVulnerabilities,
      riskScore: this.calculateRiskScore(severityBreakdown),
      recommendations: this.generateRecommendations(allVulnerabilities)
    };
  }

  calculateRiskScore(severityBreakdown) {
    const weights = { critical: 10, high: 7, medium: 4, low: 1 };
    
    return Object.entries(severityBreakdown).reduce((score, [severity, count]) => {
      return score + (weights[severity] * count);
    }, 0);
  }

  generateRecommendations(vulnerabilities) {
    const recommendations = [];
    
    const criticalVulns = vulnerabilities.filter(v => v.severity === 'critical');
    if (criticalVulns.length > 0) {
      recommendations.push({
        priority: 'immediate',
        message: `${criticalVulns.length} critical vulnerabilities found`,
        action: 'Address critical vulnerabilities immediately'
      });
    }

    const injectionVulns = vulnerabilities.filter(v => v.category === 'injection');
    if (injectionVulns.length > 0) {
      recommendations.push({
        priority: 'high',
        message: `${injectionVulns.length} injection vulnerabilities found`,
        action: 'Implement input validation and parameterized queries'
      });
    }

    const xssVulns = vulnerabilities.filter(v => v.category === 'xss');
    if (xssVulns.length > 0) {
      recommendations.push({
        priority: 'high',
        message: `${xssVulns.length} XSS vulnerabilities found`,
        action: 'Implement output encoding and CSP headers'
      });
    }

    const secretsVulns = vulnerabilities.filter(v => v.category === 'secrets');
    if (secretsVulns.length > 0) {
      recommendations.push({
        priority: 'critical',
        message: `${secretsVulns.length} exposed secrets found`,
        action: 'Remove secrets from code and rotate credentials'
      });
    }

    return recommendations;
  }

  async checkSecurityThresholds(scanSummary) {
    try {
      const violations = [];
      
      for (const [severity, threshold] of Object.entries(this.securityThresholds)) {
        const count = scanSummary.severityBreakdown[severity] || 0;
        
        if (count > threshold) {
          violations.push({
            severity: severity,
            count: count,
            threshold: threshold,
            message: `${count} ${severity} vulnerabilities exceed threshold of ${threshold}`
          });
        }
      }

      if (violations.length > 0) {
        await this.triggerSecurityAlert(scanSummary, violations);
      }
    } catch (error) {
      console.error('Failed to check security thresholds:', error);
    }
  }

  async triggerSecurityAlert(scanSummary, violations) {
    try {
      const alert = {
        id: this.generateAlertId(),
        type: 'security_threshold_violation',
        scanId: scanSummary.id,
        timestamp: new Date().toISOString(),
        violations: violations,
        riskScore: scanSummary.riskScore,
        totalVulnerabilities: scanSummary.totalVulnerabilities,
        acknowledged: false
      };

      await this.auditService.logEvent('security_alert_triggered', {
        alert_id: alert.id,
        scan_id: scanSummary.id,
        violations: violations,
        risk_score: scanSummary.riskScore,
        timestamp: new Date().toISOString()
      });

      this.emit('securityAlert', alert);
    } catch (error) {
      console.error('Failed to trigger security alert:', error);
    }
  }

  async getScanResults(scanId) {
    try {
      return this.scanResults.get(scanId) || null;
    } catch (error) {
      console.error('Failed to get scan results:', error);
      return null;
    }
  }

  async getScanHistory(limit = 10) {
    try {
      return this.scanHistory
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get scan history:', error);
      return [];
    }
  }

  async getVulnerabilityDetails(vulnerabilityId) {
    try {
      return this.vulnerabilityDatabase.get(vulnerabilityId) || null;
    } catch (error) {
      console.error('Failed to get vulnerability details:', error);
      return null;
    }
  }

  async updateVulnerabilityDatabase(vulnerabilities) {
    try {
      vulnerabilities.forEach(vuln => {
        this.vulnerabilityDatabase.set(vuln.id, vuln);
      });

      const vulnList = Array.from(this.vulnerabilityDatabase.values());
      await this.storageService.setItem('vulnerability_database', vulnList);

      await this.auditService.logEvent('vulnerability_database_updated', {
        vulnerabilities_count: vulnerabilities.length,
        total_vulnerabilities: this.vulnerabilityDatabase.size,
        timestamp: new Date().toISOString()
      });

      this.emit('vulnerabilityDatabaseUpdated', vulnerabilities);
    } catch (error) {
      console.error('Failed to update vulnerability database:', error);
      throw error;
    }
  }

  async updateScanConfiguration(configId, updates) {
    try {
      const config = this.scanConfigurations.get(configId);
      if (!config) {
        throw new Error(`Scan configuration ${configId} not found`);
      }

      const updatedConfig = { ...config, ...updates };
      this.scanConfigurations.set(configId, updatedConfig);

      const configList = Array.from(this.scanConfigurations.values());
      await this.storageService.setItem('security_scan_configs', configList);

      await this.auditService.logEvent('scan_configuration_updated', {
        config_id: configId,
        updates: updates,
        timestamp: new Date().toISOString()
      });

      this.emit('scanConfigurationUpdated', updatedConfig);
      return updatedConfig;
    } catch (error) {
      console.error('Failed to update scan configuration:', error);
      throw error;
    }
  }

  generateScanId() {
    return `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
      if (this.scanTimer) {
        clearInterval(this.scanTimer);
        this.scanTimer = null;
      }

      this.listeners = [];
      this.scanResults.clear();
      this.scanConfigurations.clear();
      this.vulnerabilityDatabase.clear();
      this.activeScanners.clear();
      this.scanHistory = [];
      this.initialized = false;
      
      await this.auditService.logEvent('security_scan_service_cleanup', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to cleanup SecurityScanService:', error);
    }
  }
}

// Scanner implementations
class DependencyScanner {
  async scan(config, vulnerabilityDatabase) {
    // Simulate dependency scanning
    const vulnerabilities = [];
    
    // Mock finding vulnerabilities in dependencies
    const mockVulns = [
      {
        id: 'DEP-001',
        title: 'Vulnerable Package Version',
        description: 'react-native@0.68.0 has known security vulnerabilities',
        severity: 'high',
        category: 'dependency',
        package: 'react-native',
        version: '0.68.0',
        fixedVersion: '0.72.0',
        cvss: 7.5
      }
    ];

    // Random chance of finding vulnerabilities
    if (Math.random() < 0.3) {
      vulnerabilities.push(...mockVulns);
    }

    return {
      vulnerabilities: vulnerabilities,
      metadata: {
        scannedFiles: ['package.json', 'yarn.lock'],
        totalDependencies: 150,
        vulnerableDependencies: vulnerabilities.length
      }
    };
  }
}

class StaticAnalysisScanner {
  async scan(config, vulnerabilityDatabase) {
    const vulnerabilities = [];
    
    // Mock static analysis results
    const mockVulns = [
      {
        id: 'SAST-001',
        title: 'SQL Injection Risk',
        description: 'Potential SQL injection vulnerability in database query',
        severity: 'high',
        category: 'injection',
        file: 'src/services/DatabaseService.js',
        line: 45,
        cvss: 8.1
      }
    ];

    if (Math.random() < 0.2) {
      vulnerabilities.push(...mockVulns);
    }

    return {
      vulnerabilities: vulnerabilities,
      metadata: {
        scannedFiles: 120,
        linesOfCode: 15000,
        rulesApplied: 500
      }
    };
  }
}

class ApiSecurityScanner {
  async scan(config, vulnerabilityDatabase) {
    const vulnerabilities = [];
    
    const mockVulns = [
      {
        id: 'API-001',
        title: 'Missing Authentication',
        description: 'API endpoint lacks proper authentication',
        severity: 'critical',
        category: 'authorization',
        endpoint: '/api/admin/users',
        method: 'GET',
        cvss: 9.3
      }
    ];

    if (Math.random() < 0.15) {
      vulnerabilities.push(...mockVulns);
    }

    return {
      vulnerabilities: vulnerabilities,
      metadata: {
        endpointsScanned: 45,
        authenticationChecks: 45,
        authorizationChecks: 45
      }
    };
  }
}

class ConfigurationScanner {
  async scan(config, vulnerabilityDatabase) {
    const vulnerabilities = [];
    
    const mockVulns = [
      {
        id: 'CONFIG-001',
        title: 'Insecure Configuration',
        description: 'Debug mode enabled in production configuration',
        severity: 'medium',
        category: 'configuration',
        file: 'app.json',
        cvss: 5.3
      }
    ];

    if (Math.random() < 0.25) {
      vulnerabilities.push(...mockVulns);
    }

    return {
      vulnerabilities: vulnerabilities,
      metadata: {
        configFilesScanned: 8,
        securityChecks: 25
      }
    };
  }
}

class SecretsScanner {
  async scan(config, vulnerabilityDatabase) {
    const vulnerabilities = [];
    
    const mockVulns = [
      {
        id: 'SECRET-001',
        title: 'Exposed API Key',
        description: 'API key found in source code',
        severity: 'critical',
        category: 'secrets',
        file: 'src/config/api.js',
        line: 12,
        cvss: 9.8
      }
    ];

    if (Math.random() < 0.1) {
      vulnerabilities.push(...mockVulns);
    }

    return {
      vulnerabilities: vulnerabilities,
      metadata: {
        filesScanned: 500,
        secretPatterns: 50,
        falsePositives: 5
      }
    };
  }
}

class MobileSecurityScanner {
  async scan(config, vulnerabilityDatabase) {
    const vulnerabilities = [];
    
    const mockVulns = [
      {
        id: 'MOBILE-001',
        title: 'Insecure Data Storage',
        description: 'Sensitive data stored in plain text',
        severity: 'high',
        category: 'data_storage',
        platform: 'both',
        cvss: 7.4
      }
    ];

    if (Math.random() < 0.2) {
      vulnerabilities.push(...mockVulns);
    }

    return {
      vulnerabilities: vulnerabilities,
      metadata: {
        platformsScanned: ['ios', 'android'],
        securityChecks: 30,
        mobileSpecificIssues: vulnerabilities.length
      }
    };
  }
}

export { SecurityScanService };