/**
 * Crash Reporting Service
 * Native crash detection and reporting for React Native apps
 */

import { Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ConfigService from './ConfigService';
import LoggingService from './LoggingService';
import ErrorTrackingService from './ErrorTrackingService';

class CrashReportingService {
  constructor() {
    this.initialized = false;
    this.crashBuffer = [];
    this.maxBufferSize = 50;
    this.sessionId = this.generateSessionId();
    this.userId = null;
    this.deviceInfo = {};
    this.appInfo = {};
    
    // Crash detection
    this.isInCrashState = false;
    this.lastCrashTime = null;
    this.crashCount = 0;
    
    // Native crash handlers
    this.nativeCrashHandler = null;
  }

  /**
   * Initialize crash reporting
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      const config = ConfigService.getConfig();
      
      // Only initialize if crash reporting is enabled
      if (!config.features?.crashReporting) {
        console.log('[CrashReportingService] Crash reporting disabled');
        return;
      }

      // Collect device and app information
      await this.collectSystemInfo();
      
      // Setup crash detection
      this.setupCrashDetection();
      
      // Load previous crash reports
      await this.loadPreviousCrashes();
      
      // Check for app restart after crash
      await this.checkCrashRecovery();

      this.initialized = true;
      
      LoggingService.info('[CrashReportingService] Initialized', {
        environment: config.environment,
        platform: Platform.OS,
        sessionId: this.sessionId,
      });

    } catch (error) {
      console.error('[CrashReportingService] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Collect system information
   */
  async collectSystemInfo() {
    try {
      const config = ConfigService.getConfig();
      
      this.deviceInfo = {
        platform: Platform.OS,
        platformVersion: Platform.Version,
        model: await this.getDeviceModel(),
        manufacturer: await this.getDeviceManufacturer(),
        totalMemory: await this.getTotalMemory(),
        availableMemory: await this.getAvailableMemory(),
        batteryLevel: await this.getBatteryLevel(),
        networkType: await this.getNetworkType(),
        orientation: await this.getOrientation(),
      };

      this.appInfo = {
        version: config.version,
        buildNumber: config.buildNumber,
        environment: config.environment,
        bundleId: await this.getBundleId(),
        installTime: await this.getInstallTime(),
        updateTime: await this.getUpdateTime(),
      };

    } catch (error) {
      console.warn('[CrashReportingService] Failed to collect system info:', error);
      
      // Fallback to basic info
      this.deviceInfo = {
        platform: Platform.OS,
        platformVersion: Platform.Version,
      };
      
      this.appInfo = {
        version: ConfigService.get('version', '1.0.0'),
        environment: ConfigService.get('environment', 'unknown'),
      };
    }
  }

  /**
   * Setup crash detection mechanisms
   */
  setupCrashDetection() {
    try {
      // Setup JavaScript error detection
      this.setupJavaScriptCrashDetection();
      
      // Setup native crash detection (platform-specific)
      if (Platform.OS === 'ios') {
        this.setupIOSCrashDetection();
      } else if (Platform.OS === 'android') {
        this.setupAndroidCrashDetection();
      }
      
      // Setup app state monitoring
      this.setupAppStateMonitoring();
      
    } catch (error) {
      console.warn('[CrashReportingService] Failed to setup crash detection:', error);
    }
  }

  /**
   * Setup JavaScript crash detection
   */
  setupJavaScriptCrashDetection() {
    // Hook into ErrorTrackingService for JavaScript errors
    ErrorTrackingService.addListener?.((error, context) => {
      if (context.level === 'fatal' || context.isFatal) {
        this.handleJavaScriptCrash(error, context);
      }
    });
    
    // Monitor for rapid error accumulation (potential crash scenario)
    this.errorAccumulator = [];
    const originalCaptureError = ErrorTrackingService.captureError;
    
    ErrorTrackingService.captureError = (error, context) => {
      this.errorAccumulator.push({
        timestamp: Date.now(),
        error,
        context,
      });
      
      // Remove old errors (older than 10 seconds)
      const now = Date.now();
      this.errorAccumulator = this.errorAccumulator.filter(
        e => now - e.timestamp < 10000
      );
      
      // Check for error storm (potential crash)
      if (this.errorAccumulator.length > 10) {
        this.handleErrorStorm(this.errorAccumulator);
      }
      
      return originalCaptureError.call(ErrorTrackingService, error, context);
    };
  }

  /**
   * Setup iOS crash detection
   */
  setupIOSCrashDetection() {
    try {
      // This would integrate with iOS-specific crash reporting
      // For now, we'll simulate native crash detection
      if (Platform.OS === 'ios') {
        this.setupNativeCrashHandler('ios');
      }
    } catch (error) {
      console.warn('[CrashReportingService] iOS crash detection setup failed:', error);
    }
  }

  /**
   * Setup Android crash detection
   */
  setupAndroidCrashDetection() {
    try {
      // This would integrate with Android-specific crash reporting
      // For now, we'll simulate native crash detection
      if (Platform.OS === 'android') {
        this.setupNativeCrashHandler('android');
      }
    } catch (error) {
      console.warn('[CrashReportingService] Android crash detection setup failed:', error);
    }
  }

  /**
   * Setup native crash handler
   */
  setupNativeCrashHandler(platform) {
    try {
      // This would use native modules for actual crash detection
      // For now, we'll create a mock implementation
      this.nativeCrashHandler = {
        platform,
        enabled: true,
        onCrash: this.handleNativeCrash.bind(this),
      };
      
    } catch (error) {
      console.warn(`[CrashReportingService] ${platform} native crash handler setup failed:`, error);
    }
  }

  /**
   * Setup app state monitoring for crash detection
   */
  setupAppStateMonitoring() {
    try {
      // Monitor app state changes for abnormal terminations
      const { AppState } = require('react-native');
      
      let lastActiveTime = Date.now();
      let backgroundTime = null;
      
      AppState.addEventListener('change', (nextAppState) => {
        const now = Date.now();
        
        if (nextAppState === 'active') {
          if (backgroundTime) {
            const backgroundDuration = now - backgroundTime;
            
            // Check if app was terminated unexpectedly
            if (backgroundDuration > 300000) { // 5 minutes
              this.checkForUnexpectedTermination(backgroundDuration);
            }
          }
          lastActiveTime = now;
          backgroundTime = null;
          
        } else if (nextAppState === 'background') {
          backgroundTime = now;
        }
      });
      
    } catch (error) {
      console.warn('[CrashReportingService] App state monitoring setup failed:', error);
    }
  }

  /**
   * Handle JavaScript crash
   */
  handleJavaScriptCrash(error, context) {
    this.isInCrashState = true;
    this.lastCrashTime = Date.now();
    this.crashCount++;

    const crashReport = this.createCrashReport('javascript', {
      error,
      context,
      stackTrace: error.stack,
    });

    this.processCrashReport(crashReport);
  }

  /**
   * Handle native crash
   */
  handleNativeCrash(crashData) {
    this.isInCrashState = true;
    this.lastCrashTime = Date.now();
    this.crashCount++;

    const crashReport = this.createCrashReport('native', crashData);
    this.processCrashReport(crashReport);
  }

  /**
   * Handle error storm (potential crash scenario)
   */
  handleErrorStorm(errors) {
    const crashReport = this.createCrashReport('error_storm', {
      errorCount: errors.length,
      errors: errors.slice(-5), // Last 5 errors
      timespan: errors[errors.length - 1].timestamp - errors[0].timestamp,
    });

    this.processCrashReport(crashReport);
  }

  /**
   * Check for unexpected termination
   */
  async checkForUnexpectedTermination(backgroundDuration) {
    try {
      const lastSession = await AsyncStorage.getItem('last_active_session');
      
      if (lastSession) {
        const sessionData = JSON.parse(lastSession);
        const now = Date.now();
        
        // Check if previous session ended unexpectedly
        if (!sessionData.cleanExit && (now - sessionData.lastActivity) < backgroundDuration) {
          const crashReport = this.createCrashReport('unexpected_termination', {
            previousSession: sessionData,
            backgroundDuration,
          });
          
          this.processCrashReport(crashReport);
        }
      }
      
    } catch (error) {
      console.warn('[CrashReportingService] Failed to check unexpected termination:', error);
    }
  }

  /**
   * Create crash report
   */
  createCrashReport(type, crashData) {
    return {
      id: this.generateCrashId(),
      type,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId,
      
      // Crash data
      crashData,
      
      // System information
      deviceInfo: { ...this.deviceInfo },
      appInfo: { ...this.appInfo },
      
      // Context
      crashCount: this.crashCount,
      lastCrashTime: this.lastCrashTime,
      
      // Performance data
      memoryUsage: await this.getCurrentMemoryUsage(),
      
      // Recent logs (if available)
      recentLogs: await this.getRecentLogs(),
      
      // Breadcrumbs (if available)
      breadcrumbs: ErrorTrackingService.breadcrumbs || [],
    };
  }

  /**
   * Process crash report
   */
  async processCrashReport(crashReport) {
    try {
      // Add to buffer
      this.crashBuffer.push(crashReport);
      
      // Limit buffer size
      if (this.crashBuffer.length > this.maxBufferSize) {
        this.crashBuffer = this.crashBuffer.slice(-this.maxBufferSize);
      }

      // Log crash
      LoggingService.fatal('Application Crash Detected', {
        type: crashReport.type,
        crashId: crashReport.id,
        crashCount: this.crashCount,
      });

      // Persist crash report immediately
      await this.persistCrashReport(crashReport);
      
      // Send to server immediately
      await this.sendCrashReport(crashReport);
      
      // Update crash recovery info
      await this.updateCrashRecoveryInfo(crashReport);
      
    } catch (error) {
      console.error('[CrashReportingService] Failed to process crash report:', error);
    }
  }

  /**
   * Load previous crash reports
   */
  async loadPreviousCrashes() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const crashKeys = keys.filter(key => key.startsWith('crash_'));
      
      if (crashKeys.length > 0) {
        const crashes = await AsyncStorage.multiGet(crashKeys);
        const parsedCrashes = crashes
          .map(([key, value]) => {
            try {
              return JSON.parse(value);
            } catch {
              return null;
            }
          })
          .filter(Boolean);
        
        // Add to buffer for sending
        this.crashBuffer.push(...parsedCrashes);
        
        // Send to server
        await this.sendPendingCrashReports();
        
        // Remove from storage after sending
        await AsyncStorage.multiRemove(crashKeys);
        
        LoggingService.info('[CrashReportingService] Loaded previous crash reports', {
          count: parsedCrashes.length,
        });
      }
      
    } catch (error) {
      console.warn('[CrashReportingService] Failed to load previous crashes:', error);
    }
  }

  /**
   * Check crash recovery
   */
  async checkCrashRecovery() {
    try {
      const crashRecoveryInfo = await AsyncStorage.getItem('crash_recovery');
      
      if (crashRecoveryInfo) {
        const recoveryData = JSON.parse(crashRecoveryInfo);
        
        // Log successful recovery
        LoggingService.info('[CrashReportingService] App recovered from crash', {
          lastCrashType: recoveryData.lastCrashType,
          crashTime: recoveryData.crashTime,
          recoveryTime: new Date().toISOString(),
        });
        
        // Clear recovery info
        await AsyncStorage.removeItem('crash_recovery');
      }
      
    } catch (error) {
      console.warn('[CrashReportingService] Failed to check crash recovery:', error);
    }
  }

  /**
   * Persist crash report to storage
   */
  async persistCrashReport(crashReport) {
    try {
      const key = `crash_${crashReport.id}`;
      await AsyncStorage.setItem(key, JSON.stringify(crashReport));
      
    } catch (error) {
      console.warn('[CrashReportingService] Failed to persist crash report:', error);
    }
  }

  /**
   * Send crash report to server
   */
  async sendCrashReport(crashReport) {
    try {
      const apiConfig = ConfigService.getApiConfig();
      
      const response = await fetch(`${apiConfig.baseURL}/api/crashes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Version': apiConfig.version,
        },
        body: JSON.stringify(crashReport),
        timeout: 20000,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      LoggingService.debug('[CrashReportingService] Crash report sent', {
        crashId: crashReport.id,
        type: crashReport.type,
      });

    } catch (error) {
      LoggingService.warn('[CrashReportingService] Failed to send crash report', {
        crashId: crashReport.id,
        error: error.message,
      });
    }
  }

  /**
   * Send pending crash reports
   */
  async sendPendingCrashReports() {
    for (const crashReport of this.crashBuffer) {
      await this.sendCrashReport(crashReport);
    }
    
    this.crashBuffer = [];
  }

  /**
   * Update crash recovery information
   */
  async updateCrashRecoveryInfo(crashReport) {
    try {
      const recoveryInfo = {
        lastCrashType: crashReport.type,
        crashTime: crashReport.timestamp,
        crashId: crashReport.id,
        sessionId: this.sessionId,
      };
      
      await AsyncStorage.setItem('crash_recovery', JSON.stringify(recoveryInfo));
      
    } catch (error) {
      console.warn('[CrashReportingService] Failed to update crash recovery info:', error);
    }
  }

  /**
   * Set user context
   */
  setUser(userId, userInfo = {}) {
    this.userId = userId;
    this.userContext = {
      id: userId,
      ...userInfo,
    };
  }

  /**
   * Get current memory usage
   */
  async getCurrentMemoryUsage() {
    try {
      // This would use platform-specific memory APIs
      return {
        used: Math.floor(Math.random() * 100 * 1024 * 1024), // Mock data
        available: Math.floor(Math.random() * 200 * 1024 * 1024),
        total: 2 * 1024 * 1024 * 1024,
      };
    } catch (error) {
      return { used: 0, available: 0, total: 0 };
    }
  }

  /**
   * Get recent logs
   */
  async getRecentLogs() {
    try {
      // Get recent logs from LoggingService
      const logData = await LoggingService.exportLogs?.();
      return logData?.bufferedLogs?.slice(-10) || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Helper methods for device information
   */
  async getDeviceModel() {
    try {
      // This would use native modules to get device model
      return Platform.OS === 'ios' ? 'iPhone' : 'Android Device';
    } catch {
      return 'Unknown';
    }
  }

  async getDeviceManufacturer() {
    try {
      // This would use native modules to get manufacturer
      return Platform.OS === 'ios' ? 'Apple' : 'Unknown';
    } catch {
      return 'Unknown';
    }
  }

  async getTotalMemory() {
    try {
      // This would use native modules to get total memory
      return 2 * 1024 * 1024 * 1024; // 2GB mock
    } catch {
      return 0;
    }
  }

  async getAvailableMemory() {
    try {
      // This would use native modules to get available memory
      return 1 * 1024 * 1024 * 1024; // 1GB mock
    } catch {
      return 0;
    }
  }

  async getBatteryLevel() {
    try {
      // This would use native modules to get battery level
      return Math.random(); // Mock 0-1
    } catch {
      return -1;
    }
  }

  async getNetworkType() {
    try {
      // This would use native modules to get network type
      return 'wifi';
    } catch {
      return 'unknown';
    }
  }

  async getOrientation() {
    try {
      const { Dimensions } = require('react-native');
      const { width, height } = Dimensions.get('window');
      return width > height ? 'landscape' : 'portrait';
    } catch {
      return 'unknown';
    }
  }

  async getBundleId() {
    try {
      // This would get the actual bundle ID
      return Platform.OS === 'ios' ? 'com.nightlife.navigator' : 'com.nightlife.navigator';
    } catch {
      return 'unknown';
    }
  }

  async getInstallTime() {
    try {
      // This would get the actual install time
      return new Date().toISOString();
    } catch {
      return null;
    }
  }

  async getUpdateTime() {
    try {
      // This would get the actual update time
      return new Date().toISOString();
    } catch {
      return null;
    }
  }

  /**
   * Generate unique crash ID
   */
  generateCrashId() {
    return `crash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get crash statistics
   */
  getCrashStatistics() {
    return {
      sessionId: this.sessionId,
      crashCount: this.crashCount,
      lastCrashTime: this.lastCrashTime,
      isInCrashState: this.isInCrashState,
      bufferedCrashes: this.crashBuffer.length,
    };
  }

  /**
   * Export crash data
   */
  async exportCrashData() {
    try {
      const stats = this.getCrashStatistics();
      const crashes = [...this.crashBuffer];
      
      return {
        statistics: stats,
        crashes,
        deviceInfo: this.deviceInfo,
        appInfo: this.appInfo,
        exportedAt: new Date().toISOString(),
      };
      
    } catch (error) {
      console.error('[CrashReportingService] Failed to export crash data:', error);
      return null;
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Send any pending crash reports
    if (this.crashBuffer.length > 0) {
      this.sendPendingCrashReports().catch(() => {
        // Ignore errors during cleanup
      });
    }

    this.crashBuffer = [];
    this.isInCrashState = false;
    this.initialized = false;
  }
}

// Create singleton instance
const crashReportingService = new CrashReportingService();

export default crashReportingService;