import { LocalStorageService } from './LocalStorageService';
import { AuditLogService } from './AuditLogService';

class VersionManagementService {
  constructor() {
    this.initialized = false;
    this.storageService = null;
    this.auditService = null;
    this.currentVersion = null;
    this.versionHistory = [];
    this.rolloutConfig = {};
    this.featureFlags = new Map();
    this.migrations = [];
    this.compatibilityMatrix = {};
    this.listeners = [];
    this.updatePolicy = {
      mandatory: false,
      gracePeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
      allowSkip: true,
      maxSkipCount: 3
    };
  }

  static getInstance() {
    if (!VersionManagementService.instance) {
      VersionManagementService.instance = new VersionManagementService();
    }
    return VersionManagementService.instance;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      this.storageService = LocalStorageService.getInstance();
      this.auditService = AuditLogService.getInstance();
      
      await this.loadCurrentVersion();
      await this.loadVersionHistory();
      await this.loadRolloutConfig();
      await this.loadFeatureFlags();
      await this.loadMigrations();
      await this.loadCompatibilityMatrix();
      await this.loadUpdatePolicy();
      
      this.initialized = true;
      
      await this.auditService.logEvent('version_management_service_initialized', {
        current_version: this.currentVersion,
        version_history_count: this.versionHistory.length,
        timestamp: new Date().toISOString()
      });
      
      this.emit('serviceInitialized');
    } catch (error) {
      console.error('Failed to initialize VersionManagementService:', error);
      throw error;
    }
  }

  async loadCurrentVersion() {
    try {
      const version = await this.storageService.getItem('current_version');
      this.currentVersion = version || {
        version: '1.0.0',
        buildNumber: 1,
        releaseDate: new Date().toISOString(),
        environment: 'development',
        features: ['basic_functionality'],
        minSupportedVersion: '1.0.0',
        deprecated: false,
        forceUpdate: false,
        rolloutPercentage: 100,
        changelog: [
          'Initial release',
          'Core nightlife venue discovery',
          'Basic user authentication',
          'Venue bookings and reservations'
        ]
      };
      
      await this.storageService.setItem('current_version', this.currentVersion);
    } catch (error) {
      console.error('Failed to load current version:', error);
      this.currentVersion = null;
    }
  }

  async loadVersionHistory() {
    try {
      const history = await this.storageService.getItem('version_history');
      this.versionHistory = history || [
        {
          version: '1.0.0',
          buildNumber: 1,
          releaseDate: new Date().toISOString(),
          environment: 'production',
          status: 'active',
          rolloutPercentage: 100,
          adoptionRate: 0,
          crashRate: 0,
          userFeedback: { positive: 0, negative: 0 },
          changelog: [
            'Initial release',
            'Core nightlife venue discovery',
            'Basic user authentication',
            'Venue bookings and reservations'
          ],
          features: ['basic_functionality'],
          bugFixes: [],
          securityUpdates: [],
          performance: {
            appSize: '45MB',
            startupTime: '2.1s',
            memoryUsage: '120MB'
          }
        }
      ];
      
      await this.storageService.setItem('version_history', this.versionHistory);
    } catch (error) {
      console.error('Failed to load version history:', error);
      this.versionHistory = [];
    }
  }

  async loadRolloutConfig() {
    try {
      const config = await this.storageService.getItem('rollout_config');
      this.rolloutConfig = config || {
        strategy: 'gradual',
        stages: [
          { percentage: 5, duration: 24 * 60 * 60 * 1000 }, // 5% for 1 day
          { percentage: 25, duration: 48 * 60 * 60 * 1000 }, // 25% for 2 days
          { percentage: 50, duration: 48 * 60 * 60 * 1000 }, // 50% for 2 days
          { percentage: 100, duration: 0 } // 100% final
        ],
        pauseThreshold: {
          crashRate: 5.0, // 5%
          negativeReviews: 30.0, // 30%
          errorRate: 10.0 // 10%
        },
        targetGroups: ['beta_testers', 'power_users', 'general_users'],
        geoTargeting: {
          enabled: true,
          regions: ['US', 'CA', 'EU', 'AU', 'JP']
        },
        deviceTargeting: {
          minIOSVersion: '12.0',
          minAndroidVersion: '21',
          excludedDevices: []
        }
      };
      
      await this.storageService.setItem('rollout_config', this.rolloutConfig);
    } catch (error) {
      console.error('Failed to load rollout config:', error);
      this.rolloutConfig = {};
    }
  }

  async loadFeatureFlags() {
    try {
      const flags = await this.storageService.getItem('feature_flags');
      const flagList = flags || [
        {
          name: 'premium_features',
          version: '1.1.0',
          enabled: false,
          rolloutPercentage: 0,
          targetUsers: ['premium_subscribers'],
          conditions: {
            minVersion: '1.1.0',
            platforms: ['ios', 'android']
          }
        },
        {
          name: 'social_features',
          version: '1.2.0',
          enabled: false,
          rolloutPercentage: 0,
          targetUsers: ['beta_testers'],
          conditions: {
            minVersion: '1.2.0',
            platforms: ['ios', 'android']
          }
        },
        {
          name: 'ai_recommendations',
          version: '1.3.0',
          enabled: false,
          rolloutPercentage: 0,
          targetUsers: ['power_users'],
          conditions: {
            minVersion: '1.3.0',
            platforms: ['ios', 'android']
          }
        }
      ];
      
      this.featureFlags.clear();
      flagList.forEach(flag => {
        this.featureFlags.set(flag.name, flag);
      });
      
      await this.storageService.setItem('feature_flags', flagList);
    } catch (error) {
      console.error('Failed to load feature flags:', error);
      this.featureFlags.clear();
    }
  }

  async loadMigrations() {
    try {
      const migrations = await this.storageService.getItem('version_migrations');
      this.migrations = migrations || [
        {
          fromVersion: '1.0.0',
          toVersion: '1.1.0',
          type: 'database',
          description: 'Add premium features tables',
          script: 'ALTER TABLE users ADD COLUMN premium_status VARCHAR(20)',
          rollback: 'ALTER TABLE users DROP COLUMN premium_status',
          required: true
        },
        {
          fromVersion: '1.1.0',
          toVersion: '1.2.0',
          type: 'data',
          description: 'Migrate user preferences format',
          script: 'UPDATE user_preferences SET format = "json" WHERE format = "xml"',
          rollback: 'UPDATE user_preferences SET format = "xml" WHERE format = "json"',
          required: true
        },
        {
          fromVersion: '1.2.0',
          toVersion: '1.3.0',
          type: 'storage',
          description: 'Migrate to new storage structure',
          script: 'RENAME TABLE old_venues TO venues_backup; CREATE TABLE venues (...)',
          rollback: 'DROP TABLE venues; RENAME TABLE venues_backup TO venues',
          required: true
        }
      ];
      
      await this.storageService.setItem('version_migrations', this.migrations);
    } catch (error) {
      console.error('Failed to load migrations:', error);
      this.migrations = [];
    }
  }

  async loadCompatibilityMatrix() {
    try {
      const matrix = await this.storageService.getItem('compatibility_matrix');
      this.compatibilityMatrix = matrix || {
        '1.0.0': {
          ios: { min: '12.0', max: '17.0' },
          android: { min: '21', max: '34' },
          server: { min: '1.0', max: '1.2' }
        },
        '1.1.0': {
          ios: { min: '13.0', max: '17.0' },
          android: { min: '23', max: '34' },
          server: { min: '1.1', max: '1.3' }
        },
        '1.2.0': {
          ios: { min: '14.0', max: '17.0' },
          android: { min: '24', max: '34' },
          server: { min: '1.2', max: '1.4' }
        }
      };
      
      await this.storageService.setItem('compatibility_matrix', this.compatibilityMatrix);
    } catch (error) {
      console.error('Failed to load compatibility matrix:', error);
      this.compatibilityMatrix = {};
    }
  }

  async loadUpdatePolicy() {
    try {
      const policy = await this.storageService.getItem('update_policy');
      if (policy) {
        this.updatePolicy = { ...this.updatePolicy, ...policy };
      }
    } catch (error) {
      console.error('Failed to load update policy:', error);
    }
  }

  async createNewVersion(versionData) {
    try {
      const newVersion = {
        version: versionData.version,
        buildNumber: versionData.buildNumber || this.getNextBuildNumber(),
        releaseDate: new Date().toISOString(),
        environment: versionData.environment || 'development',
        status: 'draft',
        rolloutPercentage: 0,
        adoptionRate: 0,
        crashRate: 0,
        userFeedback: { positive: 0, negative: 0 },
        changelog: versionData.changelog || [],
        features: versionData.features || [],
        bugFixes: versionData.bugFixes || [],
        securityUpdates: versionData.securityUpdates || [],
        performance: versionData.performance || {
          appSize: 'TBD',
          startupTime: 'TBD',
          memoryUsage: 'TBD'
        },
        minSupportedVersion: versionData.minSupportedVersion || this.currentVersion.version,
        deprecated: false,
        forceUpdate: versionData.forceUpdate || false,
        migrations: this.getMigrationsForVersion(versionData.version)
      };

      // Add to version history
      this.versionHistory.push(newVersion);
      await this.storageService.setItem('version_history', this.versionHistory);

      await this.auditService.logEvent('new_version_created', {
        version: newVersion.version,
        build_number: newVersion.buildNumber,
        environment: newVersion.environment,
        timestamp: new Date().toISOString()
      });

      this.emit('versionCreated', newVersion);
      return newVersion;
    } catch (error) {
      console.error('Failed to create new version:', error);
      throw error;
    }
  }

  async updateVersionStatus(version, status, metadata = {}) {
    try {
      const versionIndex = this.versionHistory.findIndex(v => v.version === version);
      if (versionIndex === -1) {
        throw new Error(`Version ${version} not found`);
      }

      const oldStatus = this.versionHistory[versionIndex].status;
      this.versionHistory[versionIndex].status = status;
      
      if (metadata.rolloutPercentage !== undefined) {
        this.versionHistory[versionIndex].rolloutPercentage = metadata.rolloutPercentage;
      }
      
      if (metadata.adoptionRate !== undefined) {
        this.versionHistory[versionIndex].adoptionRate = metadata.adoptionRate;
      }
      
      if (metadata.crashRate !== undefined) {
        this.versionHistory[versionIndex].crashRate = metadata.crashRate;
      }
      
      if (metadata.userFeedback) {
        this.versionHistory[versionIndex].userFeedback = metadata.userFeedback;
      }

      await this.storageService.setItem('version_history', this.versionHistory);

      await this.auditService.logEvent('version_status_updated', {
        version: version,
        old_status: oldStatus,
        new_status: status,
        metadata: metadata,
        timestamp: new Date().toISOString()
      });

      this.emit('versionStatusUpdated', { version, oldStatus, newStatus: status, metadata });
      return this.versionHistory[versionIndex];
    } catch (error) {
      console.error('Failed to update version status:', error);
      throw error;
    }
  }

  async promoteVersion(version) {
    try {
      const versionData = this.versionHistory.find(v => v.version === version);
      if (!versionData) {
        throw new Error(`Version ${version} not found`);
      }

      if (versionData.status !== 'ready') {
        throw new Error(`Version ${version} is not ready for promotion`);
      }

      // Update current version
      const oldVersion = this.currentVersion;
      this.currentVersion = {
        ...versionData,
        status: 'active',
        rolloutPercentage: 100
      };
      
      await this.storageService.setItem('current_version', this.currentVersion);

      // Update version in history
      await this.updateVersionStatus(version, 'active', { rolloutPercentage: 100 });

      // Deprecate old version
      if (oldVersion) {
        await this.updateVersionStatus(oldVersion.version, 'deprecated');
      }

      await this.auditService.logEvent('version_promoted', {
        version: version,
        old_version: oldVersion?.version,
        timestamp: new Date().toISOString()
      });

      this.emit('versionPromoted', { version, oldVersion });
      return this.currentVersion;
    } catch (error) {
      console.error('Failed to promote version:', error);
      throw error;
    }
  }

  async rollbackVersion(targetVersion, reason = 'Manual rollback') {
    try {
      const targetVersionData = this.versionHistory.find(v => v.version === targetVersion);
      if (!targetVersionData) {
        throw new Error(`Target version ${targetVersion} not found`);
      }

      const currentVersionBackup = this.currentVersion;
      
      // Set target version as current
      this.currentVersion = {
        ...targetVersionData,
        status: 'active',
        rolloutPercentage: 100
      };
      
      await this.storageService.setItem('current_version', this.currentVersion);

      // Update version statuses
      await this.updateVersionStatus(targetVersion, 'active', { rolloutPercentage: 100 });
      if (currentVersionBackup) {
        await this.updateVersionStatus(currentVersionBackup.version, 'rolled_back');
      }

      // Execute rollback migrations
      await this.executeRollbackMigrations(currentVersionBackup.version, targetVersion);

      await this.auditService.logEvent('version_rolled_back', {
        from_version: currentVersionBackup?.version,
        to_version: targetVersion,
        reason: reason,
        timestamp: new Date().toISOString()
      });

      this.emit('versionRolledBack', { fromVersion: currentVersionBackup, toVersion: targetVersion, reason });
      return this.currentVersion;
    } catch (error) {
      console.error('Failed to rollback version:', error);
      throw error;
    }
  }

  async startGradualRollout(version) {
    try {
      const versionData = this.versionHistory.find(v => v.version === version);
      if (!versionData) {
        throw new Error(`Version ${version} not found`);
      }

      if (versionData.status !== 'ready') {
        throw new Error(`Version ${version} is not ready for rollout`);
      }

      // Start with first stage
      const firstStage = this.rolloutConfig.stages[0];
      await this.updateVersionStatus(version, 'rolling_out', { 
        rolloutPercentage: firstStage.percentage 
      });

      // Schedule next stages
      this.scheduleRolloutStages(version, 0);

      await this.auditService.logEvent('gradual_rollout_started', {
        version: version,
        first_stage_percentage: firstStage.percentage,
        timestamp: new Date().toISOString()
      });

      this.emit('rolloutStarted', { version, stage: 0, percentage: firstStage.percentage });
      return versionData;
    } catch (error) {
      console.error('Failed to start gradual rollout:', error);
      throw error;
    }
  }

  scheduleRolloutStages(version, currentStageIndex) {
    if (currentStageIndex >= this.rolloutConfig.stages.length - 1) {
      return; // All stages completed
    }

    const nextStageIndex = currentStageIndex + 1;
    const nextStage = this.rolloutConfig.stages[nextStageIndex];
    const currentStage = this.rolloutConfig.stages[currentStageIndex];

    setTimeout(async () => {
      try {
        // Check rollout health before proceeding
        const healthCheck = await this.checkRolloutHealth(version);
        if (!healthCheck.healthy) {
          await this.pauseRollout(version, healthCheck.reason);
          return;
        }

        // Proceed to next stage
        await this.updateVersionStatus(version, 'rolling_out', { 
          rolloutPercentage: nextStage.percentage 
        });

        await this.auditService.logEvent('rollout_stage_advanced', {
          version: version,
          stage: nextStageIndex,
          percentage: nextStage.percentage,
          timestamp: new Date().toISOString()
        });

        this.emit('rolloutStageAdvanced', { version, stage: nextStageIndex, percentage: nextStage.percentage });

        // Schedule next stage
        this.scheduleRolloutStages(version, nextStageIndex);

      } catch (error) {
        console.error('Failed to advance rollout stage:', error);
        await this.pauseRollout(version, error.message);
      }
    }, currentStage.duration);
  }

  async checkRolloutHealth(version) {
    try {
      const versionData = this.versionHistory.find(v => v.version === version);
      if (!versionData) {
        return { healthy: false, reason: 'Version not found' };
      }

      const health = {
        healthy: true,
        reason: null,
        metrics: {
          crashRate: versionData.crashRate,
          negativeReviews: versionData.userFeedback.negative,
          errorRate: 0 // Would be calculated from actual metrics
        }
      };

      // Check crash rate
      if (versionData.crashRate > this.rolloutConfig.pauseThreshold.crashRate) {
        health.healthy = false;
        health.reason = `High crash rate: ${versionData.crashRate}%`;
      }

      // Check negative reviews
      const totalReviews = versionData.userFeedback.positive + versionData.userFeedback.negative;
      if (totalReviews > 0) {
        const negativePercentage = (versionData.userFeedback.negative / totalReviews) * 100;
        if (negativePercentage > this.rolloutConfig.pauseThreshold.negativeReviews) {
          health.healthy = false;
          health.reason = `High negative reviews: ${negativePercentage.toFixed(1)}%`;
        }
      }

      return health;
    } catch (error) {
      console.error('Failed to check rollout health:', error);
      return { healthy: false, reason: 'Health check failed' };
    }
  }

  async pauseRollout(version, reason) {
    try {
      await this.updateVersionStatus(version, 'paused');

      await this.auditService.logEvent('rollout_paused', {
        version: version,
        reason: reason,
        timestamp: new Date().toISOString()
      });

      this.emit('rolloutPaused', { version, reason });
    } catch (error) {
      console.error('Failed to pause rollout:', error);
    }
  }

  async executeMigrations(fromVersion, toVersion) {
    try {
      const relevantMigrations = this.migrations.filter(
        migration => migration.fromVersion === fromVersion && migration.toVersion === toVersion
      );

      for (const migration of relevantMigrations) {
        await this.executeMigration(migration);
      }

      await this.auditService.logEvent('migrations_executed', {
        from_version: fromVersion,
        to_version: toVersion,
        migrations_count: relevantMigrations.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to execute migrations:', error);
      throw error;
    }
  }

  async executeRollbackMigrations(fromVersion, toVersion) {
    try {
      const relevantMigrations = this.migrations.filter(
        migration => migration.fromVersion === toVersion && migration.toVersion === fromVersion
      );

      for (const migration of relevantMigrations.reverse()) {
        await this.executeRollbackMigration(migration);
      }

      await this.auditService.logEvent('rollback_migrations_executed', {
        from_version: fromVersion,
        to_version: toVersion,
        migrations_count: relevantMigrations.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to execute rollback migrations:', error);
      throw error;
    }
  }

  async executeMigration(migration) {
    try {
      console.log(`Executing migration: ${migration.description}`);
      // In a real implementation, this would execute the migration script
      // For now, we'll just log it
      
      await this.auditService.logEvent('migration_executed', {
        migration_id: migration.fromVersion + '_to_' + migration.toVersion,
        type: migration.type,
        description: migration.description,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to execute migration:', error);
      throw error;
    }
  }

  async executeRollbackMigration(migration) {
    try {
      console.log(`Executing rollback migration: ${migration.description}`);
      // In a real implementation, this would execute the rollback script
      
      await this.auditService.logEvent('rollback_migration_executed', {
        migration_id: migration.fromVersion + '_to_' + migration.toVersion,
        type: migration.type,
        description: migration.description,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to execute rollback migration:', error);
      throw error;
    }
  }

  async updateFeatureFlag(flagName, updates) {
    try {
      const flag = this.featureFlags.get(flagName);
      if (!flag) {
        throw new Error(`Feature flag ${flagName} not found`);
      }

      const updatedFlag = { ...flag, ...updates };
      this.featureFlags.set(flagName, updatedFlag);

      const flagList = Array.from(this.featureFlags.values());
      await this.storageService.setItem('feature_flags', flagList);

      await this.auditService.logEvent('feature_flag_updated', {
        flag_name: flagName,
        updates: updates,
        timestamp: new Date().toISOString()
      });

      this.emit('featureFlagUpdated', { flagName, flag: updatedFlag });
      return updatedFlag;
    } catch (error) {
      console.error('Failed to update feature flag:', error);
      throw error;
    }
  }

  async isFeatureEnabled(flagName, userContext = {}) {
    try {
      const flag = this.featureFlags.get(flagName);
      if (!flag) {
        return false;
      }

      if (!flag.enabled) {
        return false;
      }

      // Check version compatibility
      if (flag.conditions.minVersion && !this.isVersionCompatible(this.currentVersion.version, flag.conditions.minVersion)) {
        return false;
      }

      // Check platform compatibility
      if (flag.conditions.platforms && !flag.conditions.platforms.includes(userContext.platform)) {
        return false;
      }

      // Check user targeting
      if (flag.targetUsers && flag.targetUsers.length > 0) {
        if (!userContext.userType || !flag.targetUsers.includes(userContext.userType)) {
          return false;
        }
      }

      // Check rollout percentage
      if (flag.rolloutPercentage < 100) {
        const userHash = this.hashUser(userContext.userId || 'anonymous');
        const userPercentile = userHash % 100;
        if (userPercentile >= flag.rolloutPercentage) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to check feature flag:', error);
      return false;
    }
  }

  isVersionCompatible(version1, version2) {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      
      if (v1Part > v2Part) return true;
      if (v1Part < v2Part) return false;
    }
    
    return true; // Equal versions
  }

  hashUser(userId) {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  getNextBuildNumber() {
    const maxBuildNumber = Math.max(...this.versionHistory.map(v => v.buildNumber || 0));
    return maxBuildNumber + 1;
  }

  getMigrationsForVersion(version) {
    return this.migrations.filter(migration => migration.toVersion === version);
  }

  getCurrentVersion() {
    return this.currentVersion;
  }

  getVersionHistory() {
    return this.versionHistory;
  }

  getFeatureFlags() {
    return Array.from(this.featureFlags.values());
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
      this.currentVersion = null;
      this.versionHistory = [];
      this.featureFlags.clear();
      this.migrations = [];
      this.initialized = false;
      
      await this.auditService.logEvent('version_management_service_cleanup', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to cleanup VersionManagementService:', error);
    }
  }
}

export { VersionManagementService };