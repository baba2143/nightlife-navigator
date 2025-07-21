/**
 * Database Service
 * SQLite database management with migrations and data synchronization
 */

import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

import ConfigService from './ConfigService';
import LoggingService from './LoggingService';
import LocalStorageService from './LocalStorageService';
import MonitoringManager from './MonitoringManager';

class DatabaseService {
  constructor() {
    this.database = null;
    this.initialized = false;
    this.dbName = 'nightlife_navigator.db';
    this.dbVersion = 1;
    this.migrationQueue = [];
    this.transactionQueue = [];
    this.maxRetries = 3;
    
    // Database schema version tracking
    this.currentSchemaVersion = 0;
    this.targetSchemaVersion = 1;
    
    // Connection pool settings
    this.maxConnections = 5;
    this.connectionTimeout = 30000;
    
    // Performance tracking
    this.stats = {
      queries: 0,
      inserts: 0,
      updates: 0,
      deletes: 0,
      transactions: 0,
      errors: 0,
      avgQueryTime: 0,
    };
  }

  /**
   * Initialize database
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Open database connection
      await this.openDatabase();
      
      // Initialize schema and migrations
      await this.initializeSchema();
      
      // Run pending migrations
      await this.runMigrations();
      
      // Setup database optimization
      await this.optimizeDatabase();
      
      this.initialized = true;
      
      LoggingService.info('[DatabaseService] Initialized', {
        dbName: this.dbName,
        version: this.dbVersion,
        schemaVersion: this.currentSchemaVersion,
        platform: Platform.OS,
      });

    } catch (error) {
      LoggingService.error('[DatabaseService] Failed to initialize', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Open database connection
   */
  async openDatabase() {
    try {
      this.database = await SQLite.openDatabaseAsync(this.dbName);
      
      LoggingService.debug('[DatabaseService] Database connection opened', {
        dbName: this.dbName,
      });

    } catch (error) {
      LoggingService.error('[DatabaseService] Failed to open database', {
        error: error.message,
        dbName: this.dbName,
      });
      throw error;
    }
  }

  /**
   * Initialize database schema
   */
  async initializeSchema() {
    try {
      // Create metadata table if not exists
      await this.executeQuery(`
        CREATE TABLE IF NOT EXISTS _metadata (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Get current schema version
      const versionResult = await this.getMetadata('schema_version');
      this.currentSchemaVersion = versionResult ? parseInt(versionResult) : 0;
      
      LoggingService.debug('[DatabaseService] Schema initialized', {
        currentVersion: this.currentSchemaVersion,
        targetVersion: this.targetSchemaVersion,
      });

    } catch (error) {
      LoggingService.error('[DatabaseService] Failed to initialize schema', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Run database migrations
   */
  async runMigrations() {
    try {
      const migrations = this.getMigrations();
      
      for (const migration of migrations) {
        if (migration.version > this.currentSchemaVersion) {
          LoggingService.info('[DatabaseService] Running migration', {
            version: migration.version,
            name: migration.name,
          });
          
          await this.runInTransaction(async () => {
            await migration.up(this);
            await this.setMetadata('schema_version', migration.version.toString());
            this.currentSchemaVersion = migration.version;
          });
          
          LoggingService.info('[DatabaseService] Migration completed', {
            version: migration.version,
          });
        }
      }

    } catch (error) {
      LoggingService.error('[DatabaseService] Migration failed', {
        error: error.message,
        currentVersion: this.currentSchemaVersion,
      });
      throw error;
    }
  }

  /**
   * Get database migrations
   */
  getMigrations() {
    return [
      {
        version: 1,
        name: 'initial_schema',
        up: async (db) => {
          // Users table
          await db.executeQuery(`
            CREATE TABLE IF NOT EXISTS users (
              id TEXT PRIMARY KEY,
              email TEXT UNIQUE NOT NULL,
              username TEXT UNIQUE,
              first_name TEXT,
              last_name TEXT,
              avatar_url TEXT,
              preferences TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              synced_at DATETIME,
              is_deleted INTEGER DEFAULT 0
            )
          `);

          // Venues table
          await db.executeQuery(`
            CREATE TABLE IF NOT EXISTS venues (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              description TEXT,
              address TEXT,
              latitude REAL,
              longitude REAL,
              phone TEXT,
              website TEXT,
              category TEXT,
              rating REAL,
              price_level INTEGER,
              photos TEXT,
              hours TEXT,
              amenities TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              synced_at DATETIME,
              is_deleted INTEGER DEFAULT 0
            )
          `);

          // User favorites table
          await db.executeQuery(`
            CREATE TABLE IF NOT EXISTS user_favorites (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL,
              venue_id TEXT NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              synced_at DATETIME,
              is_deleted INTEGER DEFAULT 0,
              FOREIGN KEY (user_id) REFERENCES users (id),
              FOREIGN KEY (venue_id) REFERENCES venues (id),
              UNIQUE(user_id, venue_id)
            )
          `);

          // User activities table
          await db.executeQuery(`
            CREATE TABLE IF NOT EXISTS user_activities (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL,
              venue_id TEXT,
              activity_type TEXT NOT NULL,
              activity_data TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              synced_at DATETIME,
              is_deleted INTEGER DEFAULT 0,
              FOREIGN KEY (user_id) REFERENCES users (id),
              FOREIGN KEY (venue_id) REFERENCES venues (id)
            )
          `);

          // Reviews table
          await db.executeQuery(`
            CREATE TABLE IF NOT EXISTS reviews (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL,
              venue_id TEXT NOT NULL,
              rating INTEGER NOT NULL,
              comment TEXT,
              photos TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              synced_at DATETIME,
              is_deleted INTEGER DEFAULT 0,
              FOREIGN KEY (user_id) REFERENCES users (id),
              FOREIGN KEY (venue_id) REFERENCES venues (id)
            )
          `);

          // Cache table for API responses
          await db.executeQuery(`
            CREATE TABLE IF NOT EXISTS cache (
              key TEXT PRIMARY KEY,
              value TEXT NOT NULL,
              expires_at DATETIME,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `);

          // Sync queue table
          await db.executeQuery(`
            CREATE TABLE IF NOT EXISTS sync_queue (
              id TEXT PRIMARY KEY,
              table_name TEXT NOT NULL,
              record_id TEXT NOT NULL,
              operation TEXT NOT NULL,
              data TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              attempted_at DATETIME,
              retry_count INTEGER DEFAULT 0,
              status TEXT DEFAULT 'pending'
            )
          `);

          // Create indexes
          await db.executeQuery('CREATE INDEX IF NOT EXISTS idx_venues_location ON venues (latitude, longitude)');
          await db.executeQuery('CREATE INDEX IF NOT EXISTS idx_venues_category ON venues (category)');
          await db.executeQuery('CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites (user_id)');
          await db.executeQuery('CREATE INDEX IF NOT EXISTS idx_user_activities_user ON user_activities (user_id)');
          await db.executeQuery('CREATE INDEX IF NOT EXISTS idx_reviews_venue ON reviews (venue_id)');
          await db.executeQuery('CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache (expires_at)');
          await db.executeQuery('CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue (status)');
        },
      },
    ];
  }

  /**
   * Execute SQL query
   */
  async executeQuery(sql, params = []) {
    try {
      const startTime = Date.now();
      
      const result = await this.database.runAsync(sql, params);
      
      const executionTime = Date.now() - startTime;
      this.updateQueryStats('query', executionTime);
      
      LoggingService.debug('[DatabaseService] Query executed', {
        sql: sql.substring(0, 100) + (sql.length > 100 ? '...' : ''),
        params: params.length,
        executionTime,
        changes: result.changes,
        lastInsertRowId: result.lastInsertRowId,
      });

      return result;

    } catch (error) {
      this.stats.errors++;
      
      LoggingService.error('[DatabaseService] Query execution failed', {
        error: error.message,
        sql: sql.substring(0, 100),
        params,
      });
      
      throw error;
    }
  }

  /**
   * Execute SELECT query
   */
  async selectQuery(sql, params = []) {
    try {
      const startTime = Date.now();
      
      const result = await this.database.getAllAsync(sql, params);
      
      const executionTime = Date.now() - startTime;
      this.updateQueryStats('query', executionTime);
      
      LoggingService.debug('[DatabaseService] Select query executed', {
        sql: sql.substring(0, 100) + (sql.length > 100 ? '...' : ''),
        params: params.length,
        rows: result.length,
        executionTime,
      });

      return result;

    } catch (error) {
      this.stats.errors++;
      
      LoggingService.error('[DatabaseService] Select query failed', {
        error: error.message,
        sql: sql.substring(0, 100),
        params,
      });
      
      throw error;
    }
  }

  /**
   * Run queries in transaction
   */
  async runInTransaction(callback) {
    try {
      const startTime = Date.now();
      
      const result = await this.database.withTransactionAsync(callback);
      
      const executionTime = Date.now() - startTime;
      this.updateQueryStats('transaction', executionTime);
      
      LoggingService.debug('[DatabaseService] Transaction completed', {
        executionTime,
      });

      return result;

    } catch (error) {
      this.stats.errors++;
      
      LoggingService.error('[DatabaseService] Transaction failed', {
        error: error.message,
      });
      
      throw error;
    }
  }

  /**
   * Insert record
   */
  async insert(table, data) {
    try {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const placeholders = keys.map(() => '?').join(', ');
      
      const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
      const result = await this.executeQuery(sql, values);
      
      this.updateQueryStats('insert');
      
      return result;

    } catch (error) {
      LoggingService.error('[DatabaseService] Insert failed', {
        error: error.message,
        table,
        data,
      });
      throw error;
    }
  }

  /**
   * Update record
   */
  async update(table, data, where, whereParams = []) {
    try {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const setClause = keys.map(key => `${key} = ?`).join(', ');
      
      const sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`;
      const result = await this.executeQuery(sql, [...values, ...whereParams]);
      
      this.updateQueryStats('update');
      
      return result;

    } catch (error) {
      LoggingService.error('[DatabaseService] Update failed', {
        error: error.message,
        table,
        data,
        where,
      });
      throw error;
    }
  }

  /**
   * Delete record
   */
  async delete(table, where, whereParams = []) {
    try {
      const sql = `DELETE FROM ${table} WHERE ${where}`;
      const result = await this.executeQuery(sql, whereParams);
      
      this.updateQueryStats('delete');
      
      return result;

    } catch (error) {
      LoggingService.error('[DatabaseService] Delete failed', {
        error: error.message,
        table,
        where,
      });
      throw error;
    }
  }

  /**
   * Select records
   */
  async select(table, options = {}) {
    try {
      const {
        columns = '*',
        where = '',
        whereParams = [],
        orderBy = '',
        limit = '',
        offset = '',
      } = options;

      let sql = `SELECT ${columns} FROM ${table}`;
      
      if (where) {
        sql += ` WHERE ${where}`;
      }
      
      if (orderBy) {
        sql += ` ORDER BY ${orderBy}`;
      }
      
      if (limit) {
        sql += ` LIMIT ${limit}`;
      }
      
      if (offset) {
        sql += ` OFFSET ${offset}`;
      }

      return await this.selectQuery(sql, whereParams);

    } catch (error) {
      LoggingService.error('[DatabaseService] Select failed', {
        error: error.message,
        table,
        options,
      });
      throw error;
    }
  }

  /**
   * Find single record
   */
  async findOne(table, where, whereParams = []) {
    try {
      const results = await this.select(table, {
        where,
        whereParams,
        limit: 1,
      });
      
      return results.length > 0 ? results[0] : null;

    } catch (error) {
      LoggingService.error('[DatabaseService] FindOne failed', {
        error: error.message,
        table,
        where,
      });
      throw error;
    }
  }

  /**
   * Upsert record (insert or update)
   */
  async upsert(table, data, conflictColumns = ['id']) {
    try {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const placeholders = keys.map(() => '?').join(', ');
      const updateClause = keys
        .filter(key => !conflictColumns.includes(key))
        .map(key => `${key} = excluded.${key}`)
        .join(', ');
      
      const sql = `
        INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})
        ON CONFLICT(${conflictColumns.join(', ')}) DO UPDATE SET ${updateClause}
      `;
      
      const result = await this.executeQuery(sql, values);
      
      this.updateQueryStats(result.changes > 0 ? 'update' : 'insert');
      
      return result;

    } catch (error) {
      LoggingService.error('[DatabaseService] Upsert failed', {
        error: error.message,
        table,
        data,
      });
      throw error;
    }
  }

  /**
   * Get record count
   */
  async count(table, where = '', whereParams = []) {
    try {
      let sql = `SELECT COUNT(*) as count FROM ${table}`;
      
      if (where) {
        sql += ` WHERE ${where}`;
      }
      
      const result = await this.selectQuery(sql, whereParams);
      return result[0]?.count || 0;

    } catch (error) {
      LoggingService.error('[DatabaseService] Count failed', {
        error: error.message,
        table,
        where,
      });
      throw error;
    }
  }

  /**
   * Optimize database
   */
  async optimizeDatabase() {
    try {
      // Analyze query patterns
      await this.executeQuery('ANALYZE');
      
      // Vacuum database to reclaim space
      await this.executeQuery('VACUUM');
      
      // Update SQLite settings for performance
      await this.executeQuery('PRAGMA journal_mode = WAL');
      await this.executeQuery('PRAGMA synchronous = NORMAL');
      await this.executeQuery('PRAGMA cache_size = 1000');
      await this.executeQuery('PRAGMA temp_store = MEMORY');
      
      LoggingService.debug('[DatabaseService] Database optimized');

    } catch (error) {
      LoggingService.warn('[DatabaseService] Database optimization failed', {
        error: error.message,
      });
    }
  }

  /**
   * Get/Set metadata
   */
  async getMetadata(key) {
    try {
      const result = await this.findOne('_metadata', 'key = ?', [key]);
      return result?.value || null;

    } catch (error) {
      LoggingService.error('[DatabaseService] Get metadata failed', {
        error: error.message,
        key,
      });
      return null;
    }
  }

  async setMetadata(key, value) {
    try {
      await this.upsert('_metadata', {
        key,
        value,
        updated_at: new Date().toISOString(),
      }, ['key']);

    } catch (error) {
      LoggingService.error('[DatabaseService] Set metadata failed', {
        error: error.message,
        key,
        value,
      });
      throw error;
    }
  }

  /**
   * Cache management
   */
  async setCache(key, value, ttl = 3600000) {
    try {
      const expiresAt = new Date(Date.now() + ttl).toISOString();
      
      await this.upsert('cache', {
        key,
        value: JSON.stringify(value),
        expires_at: expiresAt,
      }, ['key']);

    } catch (error) {
      LoggingService.error('[DatabaseService] Set cache failed', {
        error: error.message,
        key,
      });
    }
  }

  async getCache(key) {
    try {
      const result = await this.findOne('cache', 'key = ? AND (expires_at IS NULL OR expires_at > ?)', [
        key,
        new Date().toISOString(),
      ]);
      
      return result ? JSON.parse(result.value) : null;

    } catch (error) {
      LoggingService.error('[DatabaseService] Get cache failed', {
        error: error.message,
        key,
      });
      return null;
    }
  }

  async clearExpiredCache() {
    try {
      const result = await this.delete('cache', 'expires_at <= ?', [new Date().toISOString()]);
      
      LoggingService.debug('[DatabaseService] Expired cache cleared', {
        deletedRows: result.changes,
      });

    } catch (error) {
      LoggingService.error('[DatabaseService] Clear expired cache failed', {
        error: error.message,
      });
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats() {
    try {
      const tables = ['users', 'venues', 'user_favorites', 'user_activities', 'reviews', 'cache', 'sync_queue'];
      const stats = {};
      
      for (const table of tables) {
        try {
          stats[table] = await this.count(table);
        } catch (error) {
          stats[table] = 0;
        }
      }
      
      return {
        ...this.stats,
        tables: stats,
        schemaVersion: this.currentSchemaVersion,
        initialized: this.initialized,
      };

    } catch (error) {
      LoggingService.error('[DatabaseService] Get database stats failed', {
        error: error.message,
      });
      
      return this.stats;
    }
  }

  /**
   * Export database data
   */
  async exportData(options = {}) {
    try {
      const { tables = [], includeMetadata = true } = options;
      const data = {};
      
      const tablesToExport = tables.length > 0 ? tables : [
        'users', 'venues', 'user_favorites', 'user_activities', 'reviews'
      ];
      
      for (const table of tablesToExport) {
        try {
          data[table] = await this.select(table);
        } catch (error) {
          LoggingService.warn('[DatabaseService] Failed to export table', {
            table,
            error: error.message,
          });
          data[table] = [];
        }
      }
      
      if (includeMetadata) {
        data._metadata = await this.select('_metadata');
      }
      
      return {
        data,
        exportedAt: new Date().toISOString(),
        schemaVersion: this.currentSchemaVersion,
      };

    } catch (error) {
      LoggingService.error('[DatabaseService] Export data failed', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Import database data
   */
  async importData(exportData, options = {}) {
    try {
      const { overwrite = false, validate = true } = options;
      
      if (validate && !this.validateImportData(exportData)) {
        throw new Error('Invalid import data format');
      }
      
      const { data } = exportData;
      const results = {};
      
      await this.runInTransaction(async () => {
        for (const [table, records] of Object.entries(data)) {
          if (table === '_metadata') continue;
          
          try {
            if (overwrite) {
              await this.delete(table, '1=1');
            }
            
            for (const record of records) {
              if (overwrite) {
                await this.insert(table, record);
              } else {
                await this.upsert(table, record);
              }
            }
            
            results[table] = { success: true, imported: records.length };
            
          } catch (error) {
            LoggingService.warn('[DatabaseService] Failed to import table', {
              table,
              error: error.message,
            });
            results[table] = { success: false, error: error.message };
          }
        }
      });
      
      LoggingService.info('[DatabaseService] Data imported', {
        tables: Object.keys(results).length,
        overwrite,
      });
      
      return results;

    } catch (error) {
      LoggingService.error('[DatabaseService] Import data failed', {
        error: error.message,
      });
      throw error;
    }
  }

  // Helper methods

  /**
   * Update query statistics
   */
  updateQueryStats(type, executionTime = 0) {
    this.stats[type === 'query' ? 'queries' : type + 's']++;
    
    if (executionTime > 0) {
      this.stats.avgQueryTime = (
        (this.stats.avgQueryTime * (this.stats.queries - 1) + executionTime) / this.stats.queries
      );
    }
  }

  /**
   * Validate import data
   */
  validateImportData(exportData) {
    return (
      exportData &&
      typeof exportData === 'object' &&
      exportData.data &&
      typeof exportData.data === 'object' &&
      exportData.schemaVersion
    );
  }

  /**
   * Close database connection
   */
  async close() {
    try {
      if (this.database) {
        await this.database.closeAsync();
        this.database = null;
      }
      
      this.initialized = false;
      
      LoggingService.info('[DatabaseService] Database connection closed');

    } catch (error) {
      LoggingService.error('[DatabaseService] Failed to close database', {
        error: error.message,
      });
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.close();
    this.migrationQueue = [];
    this.transactionQueue = [];
  }
}

// Create singleton instance
const databaseService = new DatabaseService();

export default databaseService;