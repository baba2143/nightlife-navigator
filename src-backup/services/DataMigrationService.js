/**
 * Data Migration Service
 * Handles database migrations, data transformations, and version upgrades
 */

import DatabaseService from './DatabaseService';
import DatabaseSchemaService from './DatabaseSchemaService';
import LocalStorageService from './LocalStorageService';
import ConfigService from './ConfigService';
import LoggingService from './LoggingService';
import MonitoringManager from './MonitoringManager';

class DataMigrationService {
  constructor() {
    this.initialized = false;
    this.migrations = new Map();
    this.currentVersion = '1.0.0';
    this.targetVersion = '1.0.0';
    this.migrationHistory = [];
    this.rollbackHistory = [];
    
    // Migration configuration
    this.batchSize = 1000;
    this.maxRetries = 3;
    this.backupBeforeMigration = true;
    this.validateAfterMigration = true;
    
    // Migration states
    this.states = {
      PENDING: 'pending',
      RUNNING: 'running',
      COMPLETED: 'completed',
      FAILED: 'failed',
      ROLLED_BACK: 'rolled_back',
    };
    
    // Migration statistics
    this.stats = {
      migrationsRun: 0,
      recordsMigrated: 0,
      migrationsRolledBack: 0,
      errors: 0,
      totalDuration: 0,
    };
  }

  /**
   * Initialize migration service
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Load migration history
      await this.loadMigrationHistory();
      
      // Register built-in migrations
      this.registerBuiltInMigrations();
      
      // Get current database version
      await this.loadCurrentVersion();
      
      // Check for pending migrations
      await this.checkPendingMigrations();
      
      this.initialized = true;
      
      LoggingService.info('[DataMigrationService] Initialized', {
        currentVersion: this.currentVersion,
        targetVersion: this.targetVersion,
        registeredMigrations: this.migrations.size,
        migrationHistory: this.migrationHistory.length,
      });

    } catch (error) {
      LoggingService.error('[DataMigrationService] Failed to initialize', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Register built-in migrations
   */
  registerBuiltInMigrations() {
    // Migration 1.0.1: Add indexes for performance
    this.registerMigration({
      version: '1.0.1',
      name: 'add_performance_indexes',
      description: 'Add indexes for better query performance',
      up: async () => {
        await DatabaseService.executeQuery(`
          CREATE INDEX IF NOT EXISTS idx_venues_updated_at ON venues (updated_at)
        `);
        await DatabaseService.executeQuery(`
          CREATE INDEX IF NOT EXISTS idx_user_activities_timestamp ON user_activities (created_at DESC)
        `);
        await DatabaseService.executeQuery(`
          CREATE INDEX IF NOT EXISTS idx_reviews_updated_at ON reviews (updated_at)
        `);
      },
      down: async () => {
        await DatabaseService.executeQuery('DROP INDEX IF EXISTS idx_venues_updated_at');
        await DatabaseService.executeQuery('DROP INDEX IF EXISTS idx_user_activities_timestamp');
        await DatabaseService.executeQuery('DROP INDEX IF EXISTS idx_reviews_updated_at');
      },
    });

    // Migration 1.0.2: Add user profile fields
    this.registerMigration({
      version: '1.0.2',
      name: 'add_user_profile_fields',
      description: 'Add additional user profile fields',
      up: async () => {
        // Add columns if they don't exist
        try {
          await DatabaseService.executeQuery(`
            ALTER TABLE users ADD COLUMN date_of_birth DATE
          `);
        } catch (error) {
          // Column might already exist
        }
        
        try {
          await DatabaseService.executeQuery(`
            ALTER TABLE users ADD COLUMN phone_number TEXT
          `);
        } catch (error) {
          // Column might already exist
        }
        
        try {
          await DatabaseService.executeQuery(`
            ALTER TABLE users ADD COLUMN location TEXT
          `);
        } catch (error) {
          // Column might already exist
        }
      },
      down: async () => {
        // SQLite doesn't support DROP COLUMN, so we'd need to recreate the table
        LoggingService.warn('[DataMigrationService] Cannot rollback column additions in SQLite');
      },
    });

    // Migration 1.0.3: Add venue features
    this.registerMigration({
      version: '1.0.3',
      name: 'add_venue_features',
      description: 'Add venue features and attributes',
      up: async () => {
        // Create venue_features table
        await DatabaseService.executeQuery(`
          CREATE TABLE IF NOT EXISTS venue_features (
            id TEXT PRIMARY KEY,
            venue_id TEXT NOT NULL,
            feature_type TEXT NOT NULL,
            feature_value TEXT,
            is_verified INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (venue_id) REFERENCES venues (id) ON DELETE CASCADE
          )
        `);
        
        await DatabaseService.executeQuery(`
          CREATE INDEX IF NOT EXISTS idx_venue_features_venue ON venue_features (venue_id)
        `);
        
        await DatabaseService.executeQuery(`
          CREATE INDEX IF NOT EXISTS idx_venue_features_type ON venue_features (feature_type)
        `);
      },
      down: async () => {
        await DatabaseService.executeQuery('DROP TABLE IF EXISTS venue_features');
      },
    });

    LoggingService.debug('[DataMigrationService] Built-in migrations registered', {
      count: this.migrations.size,
    });
  }

  /**
   * Register a migration
   */
  registerMigration(migration) {
    if (!this.isValidMigration(migration)) {
      throw new Error('Invalid migration object');
    }
    
    this.migrations.set(migration.version, migration);
    
    LoggingService.debug('[DataMigrationService] Migration registered', {
      version: migration.version,
      name: migration.name,
    });
  }

  /**
   * Validate migration object
   */
  isValidMigration(migration) {
    return (
      migration &&
      typeof migration === 'object' &&
      migration.version &&
      migration.name &&
      migration.description &&
      typeof migration.up === 'function' &&
      typeof migration.down === 'function'
    );
  }

  /**
   * Load current database version
   */
  async loadCurrentVersion() {
    try {
      const version = await DatabaseService.getMetadata('database_version');
      this.currentVersion = version || '1.0.0';
      
      LoggingService.debug('[DataMigrationService] Current version loaded', {
        version: this.currentVersion,
      });

    } catch (error) {
      LoggingService.error('[DataMigrationService] Failed to load current version', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Load migration history
   */
  async loadMigrationHistory() {
    try {
      const history = await LocalStorageService.getItem('migration_history');
      this.migrationHistory = history || [];
      
      const rollbackHistory = await LocalStorageService.getItem('rollback_history');
      this.rollbackHistory = rollbackHistory || [];
      
      LoggingService.debug('[DataMigrationService] Migration history loaded', {
        migrations: this.migrationHistory.length,
        rollbacks: this.rollbackHistory.length,
      });

    } catch (error) {
      LoggingService.warn('[DataMigrationService] Failed to load migration history', {
        error: error.message,
      });
    }
  }

  /**
   * Save migration history
   */
  async saveMigrationHistory() {
    try {
      await LocalStorageService.setItem('migration_history', this.migrationHistory);
      await LocalStorageService.setItem('rollback_history', this.rollbackHistory);

    } catch (error) {
      LoggingService.warn('[DataMigrationService] Failed to save migration history', {
        error: error.message,
      });
    }
  }

  /**
   * Check for pending migrations
   */
  async checkPendingMigrations() {
    try {
      const pendingMigrations = this.getPendingMigrations();
      
      if (pendingMigrations.length > 0) {
        LoggingService.info('[DataMigrationService] Pending migrations found', {
          count: pendingMigrations.length,
          versions: pendingMigrations.map(m => m.version),
        });
        
        // Auto-run migrations if configured
        const config = ConfigService.getConfig();
        if (config.database?.autoRunMigrations) {
          await this.runPendingMigrations();
        }
      }

    } catch (error) {
      LoggingService.error('[DataMigrationService] Failed to check pending migrations', {
        error: error.message,
      });
    }
  }

  /**
   * Get pending migrations
   */
  getPendingMigrations() {
    const pendingMigrations = [];
    
    for (const migration of this.migrations.values()) {
      if (this.versionCompare(migration.version, this.currentVersion) > 0) {
        const alreadyRun = this.migrationHistory.some(
          h => h.version === migration.version && h.state === this.states.COMPLETED
        );
        
        if (!alreadyRun) {
          pendingMigrations.push(migration);
        }
      }
    }
    
    // Sort by version
    return pendingMigrations.sort((a, b) => this.versionCompare(a.version, b.version));
  }

  /**
   * Run pending migrations
   */
  async runPendingMigrations() {
    try {
      const pendingMigrations = this.getPendingMigrations();
      
      if (pendingMigrations.length === 0) {
        LoggingService.info('[DataMigrationService] No pending migrations');
        return;
      }
      
      LoggingService.info('[DataMigrationService] Running pending migrations', {
        count: pendingMigrations.length,
      });
      
      for (const migration of pendingMigrations) {
        await this.runMigration(migration);
      }
      
      LoggingService.info('[DataMigrationService] All pending migrations completed');

    } catch (error) {
      LoggingService.error('[DataMigrationService] Failed to run pending migrations', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Run a specific migration
   */
  async runMigration(migration) {
    const startTime = Date.now();
    let migrationRecord = null;
    
    try {
      LoggingService.info('[DataMigrationService] Starting migration', {
        version: migration.version,
        name: migration.name,
        description: migration.description,
      });
      
      // Create migration record
      migrationRecord = {
        version: migration.version,
        name: migration.name,
        description: migration.description,
        state: this.states.PENDING,
        startedAt: new Date().toISOString(),
        completedAt: null,
        duration: 0,
        error: null,
        recordsAffected: 0,
      };
      
      this.migrationHistory.push(migrationRecord);
      migrationRecord.state = this.states.RUNNING;
      
      // Create backup if configured
      let backupData = null;
      if (this.backupBeforeMigration) {
        backupData = await this.createBackup();
        migrationRecord.backupId = backupData.id;
      }
      
      // Run migration in transaction
      await DatabaseService.runInTransaction(async () => {
        await migration.up();
      });
      
      // Validate schema if configured
      if (this.validateAfterMigration) {
        const validation = await DatabaseSchemaService.validateSchema();
        if (!validation.valid) {
          throw new Error(`Schema validation failed: ${validation.errors.join(', ')}`);
        }
      }
      
      // Update version
      await DatabaseService.setMetadata('database_version', migration.version);
      this.currentVersion = migration.version;
      
      // Complete migration record
      const duration = Date.now() - startTime;
      migrationRecord.state = this.states.COMPLETED;
      migrationRecord.completedAt = new Date().toISOString();
      migrationRecord.duration = duration;
      
      // Update statistics
      this.stats.migrationsRun++;
      this.stats.totalDuration += duration;
      
      // Save migration history
      await this.saveMigrationHistory();
      
      LoggingService.info('[DataMigrationService] Migration completed', {
        version: migration.version,
        duration,
      });
      
      // Track analytics
      MonitoringManager.trackUserAction?.('migration_completed', 'system', {
        version: migration.version,
        duration,
      });

    } catch (error) {
      this.stats.errors++;
      
      if (migrationRecord) {
        migrationRecord.state = this.states.FAILED;
        migrationRecord.error = error.message;
        migrationRecord.completedAt = new Date().toISOString();
        migrationRecord.duration = Date.now() - startTime;
      }
      
      LoggingService.error('[DataMigrationService] Migration failed', {
        version: migration.version,
        error: error.message,
        duration: Date.now() - startTime,
      });
      
      // Save failed migration record
      await this.saveMigrationHistory();
      
      throw error;
    }
  }

  /**
   * Rollback a migration
   */
  async rollbackMigration(version) {
    const startTime = Date.now();
    
    try {
      const migration = this.migrations.get(version);
      if (!migration) {
        throw new Error(`Migration ${version} not found`);
      }
      
      const migrationRecord = this.migrationHistory.find(
        h => h.version === version && h.state === this.states.COMPLETED
      );
      
      if (!migrationRecord) {
        throw new Error(`No completed migration found for version ${version}`);
      }
      
      LoggingService.info('[DataMigrationService] Rolling back migration', {
        version,
        name: migration.name,
      });
      
      // Create rollback record
      const rollbackRecord = {
        version,
        name: migration.name,
        originalMigrationId: migrationRecord.id,
        startedAt: new Date().toISOString(),
        completedAt: null,
        duration: 0,
        error: null,
      };
      
      this.rollbackHistory.push(rollbackRecord);
      
      // Run rollback in transaction
      await DatabaseService.runInTransaction(async () => {
        await migration.down();
      });
      
      // Find previous version
      const previousMigration = this.migrationHistory
        .filter(h => h.state === this.states.COMPLETED && this.versionCompare(h.version, version) < 0)
        .sort((a, b) => this.versionCompare(b.version, a.version))[0];
      
      const previousVersion = previousMigration ? previousMigration.version : '1.0.0';
      
      // Update version
      await DatabaseService.setMetadata('database_version', previousVersion);
      this.currentVersion = previousVersion;
      
      // Update migration record
      migrationRecord.state = this.states.ROLLED_BACK;
      
      // Complete rollback record
      const duration = Date.now() - startTime;
      rollbackRecord.completedAt = new Date().toISOString();
      rollbackRecord.duration = duration;
      
      // Update statistics
      this.stats.migrationsRolledBack++;
      
      // Save history
      await this.saveMigrationHistory();
      
      LoggingService.info('[DataMigrationService] Migration rolled back', {
        version,
        duration,
        newVersion: previousVersion,
      });

    } catch (error) {
      this.stats.errors++;
      
      LoggingService.error('[DataMigrationService] Rollback failed', {
        version,
        error: error.message,
        duration: Date.now() - startTime,
      });
      
      throw error;
    }
  }

  /**
   * Create database backup
   */
  async createBackup() {
    try {
      const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const exportData = await DatabaseService.exportData({
        includeMetadata: true,
      });
      
      await LocalStorageService.setItem(`migration_backup_${backupId}`, exportData);
      
      LoggingService.debug('[DataMigrationService] Backup created', {
        backupId,
        tables: Object.keys(exportData.data).length,
      });
      
      return {
        id: backupId,
        createdAt: new Date().toISOString(),
        tables: Object.keys(exportData.data).length,
      };

    } catch (error) {
      LoggingService.error('[DataMigrationService] Backup creation failed', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupId) {
    try {
      const backupData = await LocalStorageService.getItem(`migration_backup_${backupId}`);
      
      if (!backupData) {
        throw new Error(`Backup ${backupId} not found`);
      }
      
      LoggingService.info('[DataMigrationService] Restoring from backup', {
        backupId,
      });
      
      await DatabaseService.importData(backupData, {
        overwrite: true,
        validate: false,
      });
      
      LoggingService.info('[DataMigrationService] Backup restored', {
        backupId,
      });

    } catch (error) {
      LoggingService.error('[DataMigrationService] Backup restoration failed', {
        error: error.message,
        backupId,
      });
      throw error;
    }
  }

  /**
   * Compare version strings
   */
  versionCompare(version1, version2) {
    const v1parts = version1.split('.').map(Number);
    const v2parts = version2.split('.').map(Number);
    
    const maxLength = Math.max(v1parts.length, v2parts.length);
    
    for (let i = 0; i < maxLength; i++) {
      const v1part = v1parts[i] || 0;
      const v2part = v2parts[i] || 0;
      
      if (v1part > v2part) return 1;
      if (v1part < v2part) return -1;
    }
    
    return 0;
  }

  /**
   * Get migration status
   */
  getMigrationStatus() {
    const pendingMigrations = this.getPendingMigrations();
    const lastMigration = this.migrationHistory
      .filter(h => h.state === this.states.COMPLETED)
      .sort((a, b) => this.versionCompare(b.version, a.version))[0];
    
    return {
      currentVersion: this.currentVersion,
      targetVersion: this.targetVersion,
      pendingMigrations: pendingMigrations.length,
      lastMigration: lastMigration ? {
        version: lastMigration.version,
        name: lastMigration.name,
        completedAt: lastMigration.completedAt,
      } : null,
      stats: this.stats,
      initialized: this.initialized,
    };
  }

  /**
   * Get migration history
   */
  getMigrationHistory(limit = 50) {
    return this.migrationHistory
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
      .slice(0, limit);
  }

  /**
   * Get rollback history
   */
  getRollbackHistory(limit = 20) {
    return this.rollbackHistory
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
      .slice(0, limit);
  }

  /**
   * Clean old backups
   */
  async cleanOldBackups(maxAge = 30 * 24 * 60 * 60 * 1000) { // 30 days
    try {
      const keys = await LocalStorageService.getAllKeys();
      const backupKeys = keys.filter(key => key.startsWith('migration_backup_'));
      
      let deletedBackups = 0;
      
      for (const key of backupKeys) {
        const backup = await LocalStorageService.getItem(key);
        if (backup && backup.createdAt) {
          const age = Date.now() - new Date(backup.createdAt).getTime();
          if (age > maxAge) {
            await LocalStorageService.removeItem(key);
            deletedBackups++;
          }
        }
      }
      
      LoggingService.debug('[DataMigrationService] Old backups cleaned', {
        deletedBackups,
      });

    } catch (error) {
      LoggingService.error('[DataMigrationService] Failed to clean old backups', {
        error: error.message,
      });
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.migrations.clear();
    this.migrationHistory = [];
    this.rollbackHistory = [];
    this.initialized = false;
  }
}

// Create singleton instance
const dataMigrationService = new DataMigrationService();

export default dataMigrationService;