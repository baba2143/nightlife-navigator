/**
 * Data Synchronization Service
 * Handles bi-directional data sync between local database and server
 */

import NetInfo from '@react-native-netinfo/';
import { Platform } from 'react-native';

import DatabaseService from './DatabaseService';
import ConfigService from './ConfigService';
import LoggingService from './LoggingService';
import LocalStorageService from './LocalStorageService';
import MonitoringManager from './MonitoringManager';

class DataSyncService {
  constructor() {
    this.initialized = false;
    this.isOnline = true;
    this.isSyncing = false;
    this.syncInProgress = new Set();
    this.retryQueue = [];
    
    // Sync configuration
    this.syncInterval = 300000; // 5 minutes
    this.maxRetryAttempts = 3;
    this.retryDelay = 5000; // 5 seconds
    this.batchSize = 50;
    this.conflictResolution = 'server_wins'; // 'server_wins', 'client_wins', 'merge'
    
    // Sync statistics
    this.stats = {
      lastSyncAt: null,
      syncCount: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      conflictsResolved: 0,
      recordsSynced: 0,
      errors: [],
    };
    
    // Event listeners
    this.syncListeners = new Set();
    this.netInfoUnsubscribe = null;
    this.syncTimer = null;
    
    // Tables to sync
    this.syncTables = ['users', 'venues', 'user_favorites', 'user_activities', 'reviews'];
  }

  /**
   * Initialize sync service
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Setup network monitoring
      await this.setupNetworkMonitoring();
      
      // Load sync state
      await this.loadSyncState();
      
      // Setup automatic sync
      this.setupAutoSync();
      
      // Process pending sync queue
      await this.processPendingSyncQueue();
      
      this.initialized = true;
      
      LoggingService.info('[DataSyncService] Initialized', {
        isOnline: this.isOnline,
        syncInterval: this.syncInterval,
        conflictResolution: this.conflictResolution,
      });

    } catch (error) {
      LoggingService.error('[DataSyncService] Failed to initialize', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Setup network monitoring
   */
  async setupNetworkMonitoring() {
    try {
      // Get initial network state
      const netInfo = await NetInfo.fetch();
      this.isOnline = netInfo.isConnected && netInfo.isInternetReachable;
      
      // Listen for network changes
      this.netInfoUnsubscribe = NetInfo.addEventListener(state => {
        const wasOnline = this.isOnline;
        this.isOnline = state.isConnected && state.isInternetReachable;
        
        LoggingService.debug('[DataSyncService] Network state changed', {
          isOnline: this.isOnline,
          wasOnline,
          connectionType: state.type,
        });
        
        // Trigger sync when coming back online
        if (!wasOnline && this.isOnline) {
          this.triggerSync('network_reconnect');
        }
        
        // Notify listeners
        this.notifyListeners('network_changed', { isOnline: this.isOnline });
      });

    } catch (error) {
      LoggingService.error('[DataSyncService] Failed to setup network monitoring', {
        error: error.message,
      });
    }
  }

  /**
   * Setup automatic sync
   */
  setupAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    
    this.syncTimer = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.triggerSync('automatic');
      }
    }, this.syncInterval);
    
    LoggingService.debug('[DataSyncService] Auto sync enabled', {
      interval: this.syncInterval,
    });
  }

  /**
   * Load sync state from storage
   */
  async loadSyncState() {
    try {
      const savedStats = await LocalStorageService.getItem('sync_stats');
      if (savedStats) {
        this.stats = { ...this.stats, ...savedStats };
      }
      
      LoggingService.debug('[DataSyncService] Sync state loaded', {
        lastSyncAt: this.stats.lastSyncAt,
        syncCount: this.stats.syncCount,
      });

    } catch (error) {
      LoggingService.warn('[DataSyncService] Failed to load sync state', {
        error: error.message,
      });
    }
  }

  /**
   * Save sync state to storage
   */
  async saveSyncState() {
    try {
      await LocalStorageService.setItem('sync_stats', this.stats, { ttl: null });
      
    } catch (error) {
      LoggingService.warn('[DataSyncService] Failed to save sync state', {
        error: error.message,
      });
    }
  }

  /**
   * Trigger sync
   */
  async triggerSync(reason = 'manual') {
    if (!this.isOnline) {
      LoggingService.debug('[DataSyncService] Sync skipped - offline');
      return { success: false, reason: 'offline' };
    }

    if (this.isSyncing) {
      LoggingService.debug('[DataSyncService] Sync already in progress');
      return { success: false, reason: 'in_progress' };
    }

    try {
      this.isSyncing = true;
      this.stats.syncCount++;
      
      LoggingService.info('[DataSyncService] Sync started', { reason });
      
      // Notify listeners
      this.notifyListeners('sync_started', { reason });
      
      // Run sync process
      const result = await this.performSync();
      
      // Update statistics
      if (result.success) {
        this.stats.successfulSyncs++;
        this.stats.lastSyncAt = new Date().toISOString();
        this.stats.recordsSynced += result.recordsSynced || 0;
      } else {
        this.stats.failedSyncs++;
        this.stats.errors.push({
          timestamp: new Date().toISOString(),
          error: result.error,
          reason,
        });
        
        // Keep only last 10 errors
        if (this.stats.errors.length > 10) {
          this.stats.errors = this.stats.errors.slice(-10);
        }
      }
      
      // Save state
      await this.saveSyncState();
      
      // Notify listeners
      this.notifyListeners('sync_completed', result);
      
      LoggingService.info('[DataSyncService] Sync completed', {
        success: result.success,
        recordsSynced: result.recordsSynced,
        duration: result.duration,
      });
      
      // Track analytics
      MonitoringManager.trackUserAction?.('data_sync', 'system', {
        reason,
        success: result.success,
        recordsSynced: result.recordsSynced,
      });
      
      return result;

    } catch (error) {
      this.stats.failedSyncs++;
      
      LoggingService.error('[DataSyncService] Sync failed', {
        error: error.message,
        reason,
      });
      
      const result = { success: false, error: error.message };
      this.notifyListeners('sync_error', result);
      
      return result;
      
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Perform complete sync process
   */
  async performSync() {
    const startTime = Date.now();
    let recordsSynced = 0;
    
    try {
      // 1. Push local changes to server
      const pushResult = await this.pushLocalChanges();
      recordsSynced += pushResult.recordsPushed || 0;
      
      // 2. Pull server changes to local
      const pullResult = await this.pullServerChanges();
      recordsSynced += pullResult.recordsPulled || 0;
      
      // 3. Resolve conflicts
      const conflictResult = await this.resolveConflicts();
      this.stats.conflictsResolved += conflictResult.conflictsResolved || 0;
      
      // 4. Clean up sync queue
      await this.cleanupSyncQueue();
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        recordsSynced,
        duration,
        pushResult,
        pullResult,
        conflictResult,
      };

    } catch (error) {
      LoggingService.error('[DataSyncService] Sync process failed', {
        error: error.message,
        recordsSynced,
      });
      
      return {
        success: false,
        error: error.message,
        recordsSynced,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Push local changes to server
   */
  async pushLocalChanges() {
    try {
      const pendingChanges = await this.getPendingChanges();
      let recordsPushed = 0;
      
      LoggingService.debug('[DataSyncService] Pushing local changes', {
        pendingCount: pendingChanges.length,
      });
      
      // Process changes in batches
      for (let i = 0; i < pendingChanges.length; i += this.batchSize) {
        const batch = pendingChanges.slice(i, i + this.batchSize);
        
        try {
          const result = await this.pushBatch(batch);
          recordsPushed += result.successful || 0;
          
          // Mark successful items as synced
          await this.markAsSynced(result.successful_items || []);
          
        } catch (error) {
          LoggingService.warn('[DataSyncService] Batch push failed', {
            batchSize: batch.length,
            error: error.message,
          });
          
          // Add failed items back to retry queue
          await this.addToRetryQueue(batch);
        }
      }
      
      return { recordsPushed };

    } catch (error) {
      LoggingService.error('[DataSyncService] Push local changes failed', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Pull server changes to local
   */
  async pullServerChanges() {
    try {
      const lastSyncTime = this.stats.lastSyncAt || new Date(0).toISOString();
      let recordsPulled = 0;
      
      LoggingService.debug('[DataSyncService] Pulling server changes', {
        lastSyncTime,
      });
      
      for (const table of this.syncTables) {
        try {
          const changes = await this.fetchServerChanges(table, lastSyncTime);
          
          if (changes.length > 0) {
            await this.applyServerChanges(table, changes);
            recordsPulled += changes.length;
          }
          
        } catch (error) {
          LoggingService.warn('[DataSyncService] Failed to pull changes for table', {
            table,
            error: error.message,
          });
        }
      }
      
      return { recordsPulled };

    } catch (error) {
      LoggingService.error('[DataSyncService] Pull server changes failed', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get pending changes from sync queue
   */
  async getPendingChanges() {
    try {
      return await DatabaseService.select('sync_queue', {
        where: 'status = ?',
        whereParams: ['pending'],
        orderBy: 'created_at ASC',
        limit: this.batchSize * 5, // Get more items to process
      });

    } catch (error) {
      LoggingService.error('[DataSyncService] Failed to get pending changes', {
        error: error.message,
      });
      return [];
    }
  }

  /**
   * Push batch of changes to server
   */
  async pushBatch(batch) {
    try {
      const apiConfig = ConfigService.getApiConfig();
      
      const response = await fetch(`${apiConfig.baseURL}/api/sync/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Version': apiConfig.version,
        },
        body: JSON.stringify({
          changes: batch.map(item => ({
            id: item.id,
            table: item.table_name,
            recordId: item.record_id,
            operation: item.operation,
            data: JSON.parse(item.data || '{}'),
            timestamp: item.created_at,
          })),
        }),
        timeout: 30000,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      
      LoggingService.debug('[DataSyncService] Batch pushed successfully', {
        batchSize: batch.length,
        successful: result.successful || 0,
        failed: result.failed || 0,
      });
      
      return result;

    } catch (error) {
      LoggingService.error('[DataSyncService] Failed to push batch', {
        error: error.message,
        batchSize: batch.length,
      });
      throw error;
    }
  }

  /**
   * Fetch server changes for table
   */
  async fetchServerChanges(table, since) {
    try {
      const apiConfig = ConfigService.getApiConfig();
      
      const response = await fetch(`${apiConfig.baseURL}/api/sync/pull/${table}?since=${encodeURIComponent(since)}`, {
        method: 'GET',
        headers: {
          'X-API-Version': apiConfig.version,
        },
        timeout: 30000,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      
      LoggingService.debug('[DataSyncService] Server changes fetched', {
        table,
        changes: result.changes?.length || 0,
      });
      
      return result.changes || [];

    } catch (error) {
      LoggingService.error('[DataSyncService] Failed to fetch server changes', {
        error: error.message,
        table,
      });
      throw error;
    }
  }

  /**
   * Apply server changes to local database
   */
  async applyServerChanges(table, changes) {
    try {
      await DatabaseService.runInTransaction(async () => {
        for (const change of changes) {
          try {
            switch (change.operation) {
              case 'insert':
              case 'update':
                await DatabaseService.upsert(table, {
                  ...change.data,
                  synced_at: new Date().toISOString(),
                });
                break;
                
              case 'delete':
                await DatabaseService.update(table, 
                  { 
                    is_deleted: 1,
                    synced_at: new Date().toISOString(),
                  },
                  'id = ?',
                  [change.recordId]
                );
                break;
            }
            
          } catch (error) {
            LoggingService.warn('[DataSyncService] Failed to apply change', {
              table,
              changeId: change.id,
              operation: change.operation,
              error: error.message,
            });
          }
        }
      });
      
      LoggingService.debug('[DataSyncService] Server changes applied', {
        table,
        changesApplied: changes.length,
      });

    } catch (error) {
      LoggingService.error('[DataSyncService] Failed to apply server changes', {
        error: error.message,
        table,
      });
      throw error;
    }
  }

  /**
   * Resolve synchronization conflicts
   */
  async resolveConflicts() {
    try {
      // Implementation depends on conflict resolution strategy
      let conflictsResolved = 0;
      
      // For now, we'll use simple server wins strategy
      if (this.conflictResolution === 'server_wins') {
        // Server changes have already been applied and will overwrite local changes
        conflictsResolved = 0;
      }
      
      return { conflictsResolved };

    } catch (error) {
      LoggingService.error('[DataSyncService] Failed to resolve conflicts', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Mark sync queue items as synced
   */
  async markAsSynced(itemIds) {
    try {
      if (itemIds.length === 0) return;
      
      const placeholders = itemIds.map(() => '?').join(',');
      await DatabaseService.executeQuery(
        `UPDATE sync_queue SET status = 'synced', attempted_at = ? WHERE id IN (${placeholders})`,
        [new Date().toISOString(), ...itemIds]
      );
      
      LoggingService.debug('[DataSyncService] Items marked as synced', {
        count: itemIds.length,
      });

    } catch (error) {
      LoggingService.error('[DataSyncService] Failed to mark items as synced', {
        error: error.message,
        itemIds,
      });
    }
  }

  /**
   * Add items to retry queue
   */
  async addToRetryQueue(items) {
    try {
      const updates = items.map(item => ({
        ...item,
        retry_count: (item.retry_count || 0) + 1,
        attempted_at: new Date().toISOString(),
        status: item.retry_count >= this.maxRetryAttempts ? 'failed' : 'pending',
      }));
      
      for (const update of updates) {
        await DatabaseService.update('sync_queue',
          {
            retry_count: update.retry_count,
            attempted_at: update.attempted_at,
            status: update.status,
          },
          'id = ?',
          [update.id]
        );
      }
      
      LoggingService.debug('[DataSyncService] Items added to retry queue', {
        count: items.length,
      });

    } catch (error) {
      LoggingService.error('[DataSyncService] Failed to add items to retry queue', {
        error: error.message,
      });
    }
  }

  /**
   * Clean up completed sync queue items
   */
  async cleanupSyncQueue() {
    try {
      // Remove old synced items (older than 7 days)
      const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const result = await DatabaseService.delete('sync_queue',
        'status = ? AND attempted_at < ?',
        ['synced', cutoffDate]
      );
      
      LoggingService.debug('[DataSyncService] Sync queue cleaned up', {
        deletedItems: result.changes,
      });

    } catch (error) {
      LoggingService.warn('[DataSyncService] Failed to cleanup sync queue', {
        error: error.message,
      });
    }
  }

  /**
   * Process pending sync queue on startup
   */
  async processPendingSyncQueue() {
    try {
      if (this.isOnline) {
        // Trigger sync for any pending items
        const pendingCount = await DatabaseService.count('sync_queue', 'status = ?', ['pending']);
        
        if (pendingCount > 0) {
          LoggingService.info('[DataSyncService] Processing pending sync queue', {
            pendingCount,
          });
          
          // Schedule sync after a short delay
          setTimeout(() => {
            this.triggerSync('startup_pending');
          }, 5000);
        }
      }

    } catch (error) {
      LoggingService.warn('[DataSyncService] Failed to process pending sync queue', {
        error: error.message,
      });
    }
  }

  /**
   * Queue local change for sync
   */
  async queueChange(table, recordId, operation, data = {}) {
    try {
      const changeId = `${table}_${recordId}_${operation}_${Date.now()}`;
      
      await DatabaseService.insert('sync_queue', {
        id: changeId,
        table_name: table,
        record_id: recordId,
        operation,
        data: JSON.stringify(data),
        status: 'pending',
        retry_count: 0,
      });
      
      LoggingService.debug('[DataSyncService] Change queued for sync', {
        table,
        recordId,
        operation,
        changeId,
      });
      
      // Trigger sync if online and not currently syncing
      if (this.isOnline && !this.isSyncing) {
        // Debounce sync triggers
        setTimeout(() => {
          if (!this.isSyncing) {
            this.triggerSync('data_changed');
          }
        }, 1000);
      }

    } catch (error) {
      LoggingService.error('[DataSyncService] Failed to queue change', {
        error: error.message,
        table,
        recordId,
        operation,
      });
    }
  }

  /**
   * Get sync statistics
   */
  getSyncStatistics() {
    return {
      ...this.stats,
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      initialized: this.initialized,
      syncInterval: this.syncInterval,
      conflictResolution: this.conflictResolution,
    };
  }

  /**
   * Force sync now
   */
  async forcSync() {
    return await this.triggerSync('force');
  }

  /**
   * Add sync event listener
   */
  addSyncListener(listener) {
    this.syncListeners.add(listener);
    
    return () => {
      this.syncListeners.delete(listener);
    };
  }

  /**
   * Notify sync listeners
   */
  notifyListeners(event, data) {
    this.syncListeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        LoggingService.error('[DataSyncService] Listener error', {
          error: error.message,
          event,
        });
      }
    });
  }

  /**
   * Update sync configuration
   */
  updateSyncConfig(config) {
    if (config.syncInterval) {
      this.syncInterval = config.syncInterval;
      this.setupAutoSync();
    }
    
    if (config.conflictResolution) {
      this.conflictResolution = config.conflictResolution;
    }
    
    if (config.batchSize) {
      this.batchSize = config.batchSize;
    }
    
    LoggingService.info('[DataSyncService] Sync configuration updated', config);
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    
    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
      this.netInfoUnsubscribe = null;
    }
    
    this.syncListeners.clear();
    this.retryQueue = [];
    this.initialized = false;
  }
}

// Create singleton instance
const dataSyncService = new DataSyncService();

export default dataSyncService;