/**
 * Data Backup Service
 * Handles data backup, restore, and recovery operations
 */

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import DatabaseService from './DatabaseService';
import LocalStorageService from './LocalStorageService';
import FileStorageService from './FileStorageService';
import ConfigService from './ConfigService';
import LoggingService from './LoggingService';
import MonitoringManager from './MonitoringManager';

class DataBackupService {
  constructor() {
    this.initialized = false;
    this.backupQueue = [];
    this.restoreQueue = [];
    this.isBackingUp = false;
    this.isRestoring = false;
    
    // Backup configuration
    this.backupDirectory = `${FileSystem.documentDirectory}backups/`;
    this.maxBackups = 10;
    this.autoBackupEnabled = false;
    this.autoBackupInterval = 24 * 60 * 60 * 1000; // 24 hours
    this.compressionEnabled = true;
    
    // Backup types
    this.backupTypes = {
      FULL: 'full',
      INCREMENTAL: 'incremental',
      DIFFERENTIAL: 'differential',
      SELECTIVE: 'selective',
    };
    
    // Backup storage options
    this.storageOptions = {
      LOCAL: 'local',
      CLOUD: 'cloud',
      EXPORT: 'export',
    };
    
    // Statistics
    this.stats = {
      backupsCreated: 0,
      backupsRestored: 0,
      totalBackupSize: 0,
      lastBackupAt: null,
      lastRestoreAt: null,
      errors: 0,
    };
    
    // Event listeners
    this.backupListeners = new Set();
    this.restoreListeners = new Set();
    
    this.autoBackupTimer = null;
  }

  /**
   * Initialize backup service
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Create backup directory
      await this.createBackupDirectory();
      
      // Load backup configuration
      await this.loadBackupConfig();
      
      // Load backup statistics
      await this.loadBackupStats();
      
      // Setup auto backup
      this.setupAutoBackup();
      
      // Clean old backups
      await this.cleanOldBackups();
      
      this.initialized = true;
      
      LoggingService.info('[DataBackupService] Initialized', {
        backupDirectory: this.backupDirectory,
        maxBackups: this.maxBackups,
        autoBackupEnabled: this.autoBackupEnabled,
      });

    } catch (error) {
      LoggingService.error('[DataBackupService] Failed to initialize', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Create backup directory
   */
  async createBackupDirectory() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.backupDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.backupDirectory, { intermediates: true });
        LoggingService.debug('[DataBackupService] Backup directory created', {
          directory: this.backupDirectory,
        });
      }

    } catch (error) {
      LoggingService.error('[DataBackupService] Failed to create backup directory', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Load backup configuration
   */
  async loadBackupConfig() {
    try {
      const config = await LocalStorageService.getItem('backup_config');
      if (config) {
        this.maxBackups = config.maxBackups || this.maxBackups;
        this.autoBackupEnabled = config.autoBackupEnabled || this.autoBackupEnabled;
        this.autoBackupInterval = config.autoBackupInterval || this.autoBackupInterval;
        this.compressionEnabled = config.compressionEnabled !== false;
      }

    } catch (error) {
      LoggingService.warn('[DataBackupService] Failed to load backup config', {
        error: error.message,
      });
    }
  }

  /**
   * Save backup configuration
   */
  async saveBackupConfig() {
    try {
      const config = {
        maxBackups: this.maxBackups,
        autoBackupEnabled: this.autoBackupEnabled,
        autoBackupInterval: this.autoBackupInterval,
        compressionEnabled: this.compressionEnabled,
      };
      
      await LocalStorageService.setItem('backup_config', config);

    } catch (error) {
      LoggingService.warn('[DataBackupService] Failed to save backup config', {
        error: error.message,
      });
    }
  }

  /**
   * Load backup statistics
   */
  async loadBackupStats() {
    try {
      const stats = await LocalStorageService.getItem('backup_stats');
      if (stats) {
        this.stats = { ...this.stats, ...stats };
      }

    } catch (error) {
      LoggingService.warn('[DataBackupService] Failed to load backup stats', {
        error: error.message,
      });
    }
  }

  /**
   * Save backup statistics
   */
  async saveBackupStats() {
    try {
      await LocalStorageService.setItem('backup_stats', this.stats);

    } catch (error) {
      LoggingService.warn('[DataBackupService] Failed to save backup stats', {
        error: error.message,
      });
    }
  }

  /**
   * Create backup
   */
  async createBackup(options = {}) {
    if (this.isBackingUp) {
      throw new Error('Backup already in progress');
    }

    const startTime = Date.now();
    this.isBackingUp = true;
    
    try {
      const {
        type = this.backupTypes.FULL,
        storage = this.storageOptions.LOCAL,
        tables = null,
        includeFiles = true,
        compress = this.compressionEnabled,
        description = '',
      } = options;

      const backupId = this.generateBackupId();
      
      LoggingService.info('[DataBackupService] Starting backup', {
        backupId,
        type,
        storage,
        includeFiles,
        compress,
      });
      
      // Notify listeners
      this.notifyBackupListeners('started', { backupId, type });
      
      // Create backup metadata
      const backupMetadata = {
        id: backupId,
        type,
        storage,
        description,
        createdAt: new Date().toISOString(),
        version: await DatabaseService.getMetadata('database_version') || '1.0.0',
        appVersion: ConfigService.get('version') || '1.0.0',
        platform: Platform.OS,
        compressed: compress,
        includeFiles,
        tables: tables || [],
        status: 'creating',
      };
      
      // Export database data
      const databaseData = await this.exportDatabaseData(tables);
      backupMetadata.databaseSize = JSON.stringify(databaseData).length;
      
      // Export local storage data
      const storageData = await this.exportStorageData();
      backupMetadata.storageSize = JSON.stringify(storageData).length;
      
      // Export file data if requested
      let fileData = null;
      if (includeFiles) {
        fileData = await this.exportFileData();
        backupMetadata.filesCount = fileData?.files?.length || 0;
        backupMetadata.filesSize = fileData?.totalSize || 0;
      }
      
      // Create backup package
      const backupPackage = {
        metadata: backupMetadata,
        database: databaseData,
        storage: storageData,
        files: fileData,
      };
      
      // Save backup based on storage option
      let backupPath;
      switch (storage) {
        case this.storageOptions.LOCAL:
          backupPath = await this.saveLocalBackup(backupId, backupPackage, compress);
          break;
          
        case this.storageOptions.CLOUD:
          backupPath = await this.saveCloudBackup(backupId, backupPackage);
          break;
          
        case this.storageOptions.EXPORT:
          backupPath = await this.exportBackup(backupId, backupPackage);
          break;
          
        default:
          throw new Error(`Unsupported storage option: ${storage}`);
      }
      
      // Update metadata
      backupMetadata.status = 'completed';
      backupMetadata.path = backupPath;
      backupMetadata.size = await this.getBackupSize(backupPath);
      backupMetadata.duration = Date.now() - startTime;
      
      // Save backup metadata
      await this.saveBackupMetadata(backupMetadata);
      
      // Update statistics
      this.stats.backupsCreated++;
      this.stats.totalBackupSize += backupMetadata.size;
      this.stats.lastBackupAt = backupMetadata.createdAt;
      await this.saveBackupStats();
      
      // Clean old backups
      await this.cleanOldBackups();
      
      LoggingService.info('[DataBackupService] Backup completed', {
        backupId,
        size: backupMetadata.size,
        duration: backupMetadata.duration,
        path: backupPath,
      });
      
      // Notify listeners
      this.notifyBackupListeners('completed', { 
        backupId, 
        metadata: backupMetadata,
        path: backupPath,
      });
      
      // Track analytics
      MonitoringManager.trackUserAction?.('backup_created', 'system', {
        type,
        storage,
        size: backupMetadata.size,
        duration: backupMetadata.duration,
      });
      
      return {
        id: backupId,
        path: backupPath,
        metadata: backupMetadata,
      };

    } catch (error) {
      this.stats.errors++;
      
      LoggingService.error('[DataBackupService] Backup failed', {
        error: error.message,
        duration: Date.now() - startTime,
      });
      
      // Notify listeners
      this.notifyBackupListeners('failed', { error: error.message });
      
      throw error;
      
    } finally {
      this.isBackingUp = false;
    }
  }

  /**
   * Restore backup
   */
  async restoreBackup(backupId, options = {}) {
    if (this.isRestoring) {
      throw new Error('Restore already in progress');
    }

    const startTime = Date.now();
    this.isRestoring = true;
    
    try {
      const {
        validateBeforeRestore = true,
        createBackupBeforeRestore = true,
        restoreFiles = true,
      } = options;

      LoggingService.info('[DataBackupService] Starting restore', {
        backupId,
        validateBeforeRestore,
        createBackupBeforeRestore,
        restoreFiles,
      });
      
      // Notify listeners
      this.notifyRestoreListeners('started', { backupId });
      
      // Load backup metadata
      const backupMetadata = await this.loadBackupMetadata(backupId);
      if (!backupMetadata) {
        throw new Error(`Backup ${backupId} not found`);
      }
      
      // Load backup package
      const backupPackage = await this.loadBackup(backupMetadata.path);
      
      // Validate backup if requested
      if (validateBeforeRestore) {
        const validation = await this.validateBackup(backupPackage);
        if (!validation.valid) {
          throw new Error(`Backup validation failed: ${validation.errors.join(', ')}`);
        }
      }
      
      // Create current state backup if requested
      if (createBackupBeforeRestore) {
        await this.createBackup({
          type: this.backupTypes.FULL,
          description: `Pre-restore backup before restoring ${backupId}`,
        });
      }
      
      // Restore database data
      if (backupPackage.database) {
        await DatabaseService.importData(backupPackage.database, {
          overwrite: true,
          validate: false,
        });
      }
      
      // Restore storage data
      if (backupPackage.storage) {
        await this.restoreStorageData(backupPackage.storage);
      }
      
      // Restore files if requested
      if (restoreFiles && backupPackage.files) {
        await this.restoreFileData(backupPackage.files);
      }
      
      const duration = Date.now() - startTime;
      
      // Update statistics
      this.stats.backupsRestored++;
      this.stats.lastRestoreAt = new Date().toISOString();
      await this.saveBackupStats();
      
      LoggingService.info('[DataBackupService] Restore completed', {
        backupId,
        duration,
      });
      
      // Notify listeners
      this.notifyRestoreListeners('completed', { 
        backupId, 
        duration,
        metadata: backupMetadata,
      });
      
      // Track analytics
      MonitoringManager.trackUserAction?.('backup_restored', 'system', {
        backupId,
        duration,
      });
      
      return {
        backupId,
        duration,
        metadata: backupMetadata,
      };

    } catch (error) {
      this.stats.errors++;
      
      LoggingService.error('[DataBackupService] Restore failed', {
        error: error.message,
        backupId,
        duration: Date.now() - startTime,
      });
      
      // Notify listeners
      this.notifyRestoreListeners('failed', { backupId, error: error.message });
      
      throw error;
      
    } finally {
      this.isRestoring = false;
    }
  }

  /**
   * Export database data
   */
  async exportDatabaseData(tables = null) {
    try {
      return await DatabaseService.exportData({
        tables: tables || [],
        includeMetadata: true,
      });

    } catch (error) {
      LoggingService.error('[DataBackupService] Database export failed', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Export storage data
   */
  async exportStorageData() {
    try {
      return await LocalStorageService.exportData({
        includeSecure: false, // For security, don't include sensitive data
      });

    } catch (error) {
      LoggingService.error('[DataBackupService] Storage export failed', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Export file data
   */
  async exportFileData() {
    try {
      // This would include file references and metadata
      // Actual files would be handled separately due to size constraints
      return {
        files: [],
        totalSize: 0,
        note: 'File data export not fully implemented',
      };

    } catch (error) {
      LoggingService.error('[DataBackupService] File export failed', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Restore storage data
   */
  async restoreStorageData(storageData) {
    try {
      await LocalStorageService.importData(storageData, {
        overwrite: true,
        validate: false,
      });

    } catch (error) {
      LoggingService.error('[DataBackupService] Storage restore failed', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Restore file data
   */
  async restoreFileData(fileData) {
    try {
      // Implementation would restore file references and download files
      LoggingService.debug('[DataBackupService] File restore not fully implemented');

    } catch (error) {
      LoggingService.error('[DataBackupService] File restore failed', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Save local backup
   */
  async saveLocalBackup(backupId, backupPackage, compress = false) {
    try {
      const fileName = `backup_${backupId}.json`;
      const filePath = `${this.backupDirectory}${fileName}`;
      
      let content = JSON.stringify(backupPackage, null, compress ? 0 : 2);
      
      // TODO: Implement compression if requested
      if (compress) {
        LoggingService.debug('[DataBackupService] Compression not implemented');
      }
      
      await FileSystem.writeAsStringAsync(filePath, content);
      
      LoggingService.debug('[DataBackupService] Local backup saved', {
        backupId,
        path: filePath,
        size: content.length,
      });
      
      return filePath;

    } catch (error) {
      LoggingService.error('[DataBackupService] Local backup save failed', {
        error: error.message,
        backupId,
      });
      throw error;
    }
  }

  /**
   * Save cloud backup
   */
  async saveCloudBackup(backupId, backupPackage) {
    try {
      // TODO: Implement cloud storage integration
      throw new Error('Cloud backup not implemented');

    } catch (error) {
      LoggingService.error('[DataBackupService] Cloud backup save failed', {
        error: error.message,
        backupId,
      });
      throw error;
    }
  }

  /**
   * Export backup for sharing
   */
  async exportBackup(backupId, backupPackage) {
    try {
      const fileName = `nightlife_backup_${backupId}.json`;
      const filePath = `${this.backupDirectory}${fileName}`;
      
      const content = JSON.stringify(backupPackage, null, 2);
      await FileSystem.writeAsStringAsync(filePath, content);
      
      // Share the backup file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/json',
          dialogTitle: 'Export Backup',
        });
      }
      
      LoggingService.debug('[DataBackupService] Backup exported', {
        backupId,
        path: filePath,
      });
      
      return filePath;

    } catch (error) {
      LoggingService.error('[DataBackupService] Backup export failed', {
        error: error.message,
        backupId,
      });
      throw error;
    }
  }

  /**
   * Load backup
   */
  async loadBackup(backupPath) {
    try {
      const content = await FileSystem.readAsStringAsync(backupPath);
      return JSON.parse(content);

    } catch (error) {
      LoggingService.error('[DataBackupService] Backup load failed', {
        error: error.message,
        backupPath,
      });
      throw error;
    }
  }

  /**
   * Validate backup
   */
  async validateBackup(backupPackage) {
    try {
      const errors = [];
      
      // Check backup structure
      if (!backupPackage.metadata) {
        errors.push('Missing backup metadata');
      }
      
      if (!backupPackage.database) {
        errors.push('Missing database data');
      }
      
      // Validate metadata
      if (backupPackage.metadata) {
        const requiredFields = ['id', 'createdAt', 'version', 'type'];
        for (const field of requiredFields) {
          if (!backupPackage.metadata[field]) {
            errors.push(`Missing metadata field: ${field}`);
          }
        }
      }
      
      // Validate database data
      if (backupPackage.database && backupPackage.database.data) {
        const tables = Object.keys(backupPackage.database.data);
        if (tables.length === 0) {
          errors.push('No database tables found in backup');
        }
      }
      
      return {
        valid: errors.length === 0,
        errors,
      };

    } catch (error) {
      LoggingService.error('[DataBackupService] Backup validation failed', {
        error: error.message,
      });
      
      return {
        valid: false,
        errors: [error.message],
      };
    }
  }

  /**
   * Get backup size
   */
  async getBackupSize(backupPath) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(backupPath);
      return fileInfo.size || 0;

    } catch (error) {
      LoggingService.warn('[DataBackupService] Failed to get backup size', {
        error: error.message,
        backupPath,
      });
      return 0;
    }
  }

  /**
   * Save backup metadata
   */
  async saveBackupMetadata(metadata) {
    try {
      const metadataKey = `backup_metadata_${metadata.id}`;
      await LocalStorageService.setItem(metadataKey, metadata);

    } catch (error) {
      LoggingService.error('[DataBackupService] Failed to save backup metadata', {
        error: error.message,
        backupId: metadata.id,
      });
    }
  }

  /**
   * Load backup metadata
   */
  async loadBackupMetadata(backupId) {
    try {
      const metadataKey = `backup_metadata_${backupId}`;
      return await LocalStorageService.getItem(metadataKey);

    } catch (error) {
      LoggingService.error('[DataBackupService] Failed to load backup metadata', {
        error: error.message,
        backupId,
      });
      return null;
    }
  }

  /**
   * List available backups
   */
  async listBackups() {
    try {
      const keys = await LocalStorageService.getAllKeys();
      const metadataKeys = keys.filter(key => key.startsWith('backup_metadata_'));
      
      const backups = [];
      for (const key of metadataKeys) {
        try {
          const metadata = await LocalStorageService.getItem(key);
          if (metadata) {
            backups.push(metadata);
          }
        } catch (error) {
          LoggingService.warn('[DataBackupService] Failed to load backup metadata', {
            key,
            error: error.message,
          });
        }
      }
      
      // Sort by creation date (newest first)
      return backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    } catch (error) {
      LoggingService.error('[DataBackupService] Failed to list backups', {
        error: error.message,
      });
      return [];
    }
  }

  /**
   * Delete backup
   */
  async deleteBackup(backupId) {
    try {
      const metadata = await this.loadBackupMetadata(backupId);
      if (!metadata) {
        throw new Error(`Backup ${backupId} not found`);
      }
      
      // Delete backup file
      if (metadata.path) {
        const fileInfo = await FileSystem.getInfoAsync(metadata.path);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(metadata.path);
        }
      }
      
      // Delete metadata
      const metadataKey = `backup_metadata_${backupId}`;
      await LocalStorageService.removeItem(metadataKey);
      
      LoggingService.info('[DataBackupService] Backup deleted', {
        backupId,
      });

    } catch (error) {
      LoggingService.error('[DataBackupService] Failed to delete backup', {
        error: error.message,
        backupId,
      });
      throw error;
    }
  }

  /**
   * Clean old backups
   */
  async cleanOldBackups() {
    try {
      const backups = await this.listBackups();
      
      if (backups.length > this.maxBackups) {
        const backupsToDelete = backups
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
          .slice(0, backups.length - this.maxBackups);
        
        for (const backup of backupsToDelete) {
          await this.deleteBackup(backup.id);
        }
        
        LoggingService.debug('[DataBackupService] Old backups cleaned', {
          deletedCount: backupsToDelete.length,
        });
      }

    } catch (error) {
      LoggingService.error('[DataBackupService] Failed to clean old backups', {
        error: error.message,
      });
    }
  }

  /**
   * Setup auto backup
   */
  setupAutoBackup() {
    if (this.autoBackupTimer) {
      clearInterval(this.autoBackupTimer);
    }
    
    if (this.autoBackupEnabled) {
      this.autoBackupTimer = setInterval(async () => {
        try {
          await this.createBackup({
            type: this.backupTypes.INCREMENTAL,
            description: 'Automatic backup',
          });
        } catch (error) {
          LoggingService.error('[DataBackupService] Auto backup failed', {
            error: error.message,
          });
        }
      }, this.autoBackupInterval);
      
      LoggingService.debug('[DataBackupService] Auto backup enabled', {
        interval: this.autoBackupInterval,
      });
    }
  }

  /**
   * Update backup configuration
   */
  async updateBackupConfig(config) {
    try {
      if (config.maxBackups !== undefined) {
        this.maxBackups = config.maxBackups;
      }
      
      if (config.autoBackupEnabled !== undefined) {
        this.autoBackupEnabled = config.autoBackupEnabled;
      }
      
      if (config.autoBackupInterval !== undefined) {
        this.autoBackupInterval = config.autoBackupInterval;
      }
      
      if (config.compressionEnabled !== undefined) {
        this.compressionEnabled = config.compressionEnabled;
      }
      
      await this.saveBackupConfig();
      this.setupAutoBackup();
      
      LoggingService.info('[DataBackupService] Backup configuration updated', config);

    } catch (error) {
      LoggingService.error('[DataBackupService] Failed to update backup config', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get backup statistics
   */
  getBackupStatistics() {
    return {
      ...this.stats,
      isBackingUp: this.isBackingUp,
      isRestoring: this.isRestoring,
      autoBackupEnabled: this.autoBackupEnabled,
      maxBackups: this.maxBackups,
      initialized: this.initialized,
    };
  }

  // Helper methods

  /**
   * Generate backup ID
   */
  generateBackupId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add backup listener
   */
  addBackupListener(listener) {
    this.backupListeners.add(listener);
    
    return () => {
      this.backupListeners.delete(listener);
    };
  }

  /**
   * Add restore listener
   */
  addRestoreListener(listener) {
    this.restoreListeners.add(listener);
    
    return () => {
      this.restoreListeners.delete(listener);
    };
  }

  /**
   * Notify backup listeners
   */
  notifyBackupListeners(event, data) {
    this.backupListeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        LoggingService.error('[DataBackupService] Backup listener error', {
          error: error.message,
          event,
        });
      }
    });
  }

  /**
   * Notify restore listeners
   */
  notifyRestoreListeners(event, data) {
    this.restoreListeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        LoggingService.error('[DataBackupService] Restore listener error', {
          error: error.message,
          event,
        });
      }
    });
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.autoBackupTimer) {
      clearInterval(this.autoBackupTimer);
      this.autoBackupTimer = null;
    }
    
    this.backupListeners.clear();
    this.restoreListeners.clear();
    this.backupQueue = [];
    this.restoreQueue = [];
    this.isBackingUp = false;
    this.isRestoring = false;
    this.initialized = false;
  }
}

// Create singleton instance
const dataBackupService = new DataBackupService();

export default dataBackupService;