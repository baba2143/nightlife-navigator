/**
 * Database Schema Service
 * Manages database schema design, validation, and evolution
 */

import DatabaseService from './DatabaseService';
import ConfigService from './ConfigService';
import LoggingService from './LoggingService';
import LocalStorageService from './LocalStorageService';

class DatabaseSchemaService {
  constructor() {
    this.initialized = false;
    this.currentSchema = null;
    this.schemaValidators = new Map();
    this.relationshipMap = new Map();
    this.indexMap = new Map();
    
    // Schema configuration
    this.schemaVersion = '1.0.0';
    this.supportedDataTypes = [
      'TEXT', 'INTEGER', 'REAL', 'BLOB', 'DATETIME', 'BOOLEAN'
    ];
    
    // Schema constraints
    this.constraints = {
      maxTableNameLength: 64,
      maxColumnNameLength: 64,
      maxIndexNameLength: 64,
      maxColumnsPerTable: 100,
      maxIndexesPerTable: 20,
    };
  }

  /**
   * Initialize schema service
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Load current schema
      await this.loadCurrentSchema();
      
      // Setup schema validators
      this.setupSchemaValidators();
      
      // Setup relationships
      this.setupRelationships();
      
      // Setup indexes
      this.setupIndexes();
      
      // Validate current schema
      await this.validateSchema();
      
      this.initialized = true;
      
      LoggingService.info('[DatabaseSchemaService] Initialized', {
        schemaVersion: this.schemaVersion,
        tables: Object.keys(this.currentSchema?.tables || {}).length,
        relationships: this.relationshipMap.size,
        indexes: this.indexMap.size,
      });

    } catch (error) {
      LoggingService.error('[DatabaseSchemaService] Failed to initialize', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Load current schema from database
   */
  async loadCurrentSchema() {
    try {
      // Get schema from database metadata
      const schemaData = await DatabaseService.getMetadata('database_schema');
      
      if (schemaData) {
        this.currentSchema = JSON.parse(schemaData);
      } else {
        // Create default schema
        this.currentSchema = this.getDefaultSchema();
        await this.saveSchema();
      }
      
      LoggingService.debug('[DatabaseSchemaService] Schema loaded', {
        version: this.currentSchema.version,
        tables: Object.keys(this.currentSchema.tables).length,
      });

    } catch (error) {
      LoggingService.error('[DatabaseSchemaService] Failed to load schema', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get default schema definition
   */
  getDefaultSchema() {
    return {
      version: this.schemaVersion,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tables: {
        users: {
          name: 'users',
          columns: {
            id: {
              name: 'id',
              type: 'TEXT',
              primaryKey: true,
              nullable: false,
              unique: true,
            },
            email: {
              name: 'email',
              type: 'TEXT',
              nullable: false,
              unique: true,
              validation: {
                format: 'email',
                maxLength: 255,
              },
            },
            username: {
              name: 'username',
              type: 'TEXT',
              nullable: true,
              unique: true,
              validation: {
                minLength: 3,
                maxLength: 50,
                pattern: '^[a-zA-Z0-9_]+$',
              },
            },
            first_name: {
              name: 'first_name',
              type: 'TEXT',
              nullable: true,
              validation: {
                maxLength: 100,
              },
            },
            last_name: {
              name: 'last_name',
              type: 'TEXT',
              nullable: true,
              validation: {
                maxLength: 100,
              },
            },
            avatar_url: {
              name: 'avatar_url',
              type: 'TEXT',
              nullable: true,
              validation: {
                format: 'url',
              },
            },
            preferences: {
              name: 'preferences',
              type: 'TEXT',
              nullable: true,
              description: 'JSON string of user preferences',
            },
            created_at: {
              name: 'created_at',
              type: 'DATETIME',
              nullable: false,
              defaultValue: 'CURRENT_TIMESTAMP',
            },
            updated_at: {
              name: 'updated_at',
              type: 'DATETIME',
              nullable: false,
              defaultValue: 'CURRENT_TIMESTAMP',
            },
            synced_at: {
              name: 'synced_at',
              type: 'DATETIME',
              nullable: true,
            },
            is_deleted: {
              name: 'is_deleted',
              type: 'INTEGER',
              nullable: false,
              defaultValue: 0,
              validation: {
                in: [0, 1],
              },
            },
          },
          indexes: [
            {
              name: 'idx_users_email',
              columns: ['email'],
              unique: true,
            },
            {
              name: 'idx_users_username',
              columns: ['username'],
              unique: true,
            },
            {
              name: 'idx_users_created_at',
              columns: ['created_at'],
            },
          ],
          constraints: [
            {
              type: 'check',
              name: 'chk_users_email_format',
              expression: 'email LIKE \'%@%.%\'',
            },
          ],
        },
        venues: {
          name: 'venues',
          columns: {
            id: {
              name: 'id',
              type: 'TEXT',
              primaryKey: true,
              nullable: false,
            },
            name: {
              name: 'name',
              type: 'TEXT',
              nullable: false,
              validation: {
                minLength: 1,
                maxLength: 200,
              },
            },
            description: {
              name: 'description',
              type: 'TEXT',
              nullable: true,
              validation: {
                maxLength: 2000,
              },
            },
            address: {
              name: 'address',
              type: 'TEXT',
              nullable: true,
              validation: {
                maxLength: 500,
              },
            },
            latitude: {
              name: 'latitude',
              type: 'REAL',
              nullable: true,
              validation: {
                min: -90,
                max: 90,
              },
            },
            longitude: {
              name: 'longitude',
              type: 'REAL',
              nullable: true,
              validation: {
                min: -180,
                max: 180,
              },
            },
            phone: {
              name: 'phone',
              type: 'TEXT',
              nullable: true,
              validation: {
                pattern: '^[+]?[0-9\\s\\-\\(\\)]+$',
              },
            },
            website: {
              name: 'website',
              type: 'TEXT',
              nullable: true,
              validation: {
                format: 'url',
              },
            },
            category: {
              name: 'category',
              type: 'TEXT',
              nullable: true,
              validation: {
                in: ['restaurant', 'bar', 'club', 'lounge', 'cafe', 'other'],
              },
            },
            rating: {
              name: 'rating',
              type: 'REAL',
              nullable: true,
              validation: {
                min: 0,
                max: 5,
              },
            },
            price_level: {
              name: 'price_level',
              type: 'INTEGER',
              nullable: true,
              validation: {
                min: 1,
                max: 4,
              },
            },
            photos: {
              name: 'photos',
              type: 'TEXT',
              nullable: true,
              description: 'JSON array of photo URLs',
            },
            hours: {
              name: 'hours',
              type: 'TEXT',
              nullable: true,
              description: 'JSON object of operating hours',
            },
            amenities: {
              name: 'amenities',
              type: 'TEXT',
              nullable: true,
              description: 'JSON array of amenities',
            },
            created_at: {
              name: 'created_at',
              type: 'DATETIME',
              nullable: false,
              defaultValue: 'CURRENT_TIMESTAMP',
            },
            updated_at: {
              name: 'updated_at',
              type: 'DATETIME',
              nullable: false,
              defaultValue: 'CURRENT_TIMESTAMP',
            },
            synced_at: {
              name: 'synced_at',
              type: 'DATETIME',
              nullable: true,
            },
            is_deleted: {
              name: 'is_deleted',
              type: 'INTEGER',
              nullable: false,
              defaultValue: 0,
              validation: {
                in: [0, 1],
              },
            },
          },
          indexes: [
            {
              name: 'idx_venues_location',
              columns: ['latitude', 'longitude'],
            },
            {
              name: 'idx_venues_category',
              columns: ['category'],
            },
            {
              name: 'idx_venues_rating',
              columns: ['rating'],
            },
            {
              name: 'idx_venues_name',
              columns: ['name'],
            },
          ],
        },
        user_favorites: {
          name: 'user_favorites',
          columns: {
            id: {
              name: 'id',
              type: 'TEXT',
              primaryKey: true,
              nullable: false,
            },
            user_id: {
              name: 'user_id',
              type: 'TEXT',
              nullable: false,
              foreignKey: {
                table: 'users',
                column: 'id',
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
              },
            },
            venue_id: {
              name: 'venue_id',
              type: 'TEXT',
              nullable: false,
              foreignKey: {
                table: 'venues',
                column: 'id',
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
              },
            },
            created_at: {
              name: 'created_at',
              type: 'DATETIME',
              nullable: false,
              defaultValue: 'CURRENT_TIMESTAMP',
            },
            synced_at: {
              name: 'synced_at',
              type: 'DATETIME',
              nullable: true,
            },
            is_deleted: {
              name: 'is_deleted',
              type: 'INTEGER',
              nullable: false,
              defaultValue: 0,
              validation: {
                in: [0, 1],
              },
            },
          },
          indexes: [
            {
              name: 'idx_user_favorites_user',
              columns: ['user_id'],
            },
            {
              name: 'idx_user_favorites_venue',
              columns: ['venue_id'],
            },
            {
              name: 'idx_user_favorites_unique',
              columns: ['user_id', 'venue_id'],
              unique: true,
            },
          ],
        },
        user_activities: {
          name: 'user_activities',
          columns: {
            id: {
              name: 'id',
              type: 'TEXT',
              primaryKey: true,
              nullable: false,
            },
            user_id: {
              name: 'user_id',
              type: 'TEXT',
              nullable: false,
              foreignKey: {
                table: 'users',
                column: 'id',
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
              },
            },
            venue_id: {
              name: 'venue_id',
              type: 'TEXT',
              nullable: true,
              foreignKey: {
                table: 'venues',
                column: 'id',
                onDelete: 'SET NULL',
                onUpdate: 'CASCADE',
              },
            },
            activity_type: {
              name: 'activity_type',
              type: 'TEXT',
              nullable: false,
              validation: {
                in: ['view', 'favorite', 'unfavorite', 'review', 'share', 'checkin'],
              },
            },
            activity_data: {
              name: 'activity_data',
              type: 'TEXT',
              nullable: true,
              description: 'JSON data for the activity',
            },
            created_at: {
              name: 'created_at',
              type: 'DATETIME',
              nullable: false,
              defaultValue: 'CURRENT_TIMESTAMP',
            },
            synced_at: {
              name: 'synced_at',
              type: 'DATETIME',
              nullable: true,
            },
            is_deleted: {
              name: 'is_deleted',
              type: 'INTEGER',
              nullable: false,
              defaultValue: 0,
              validation: {
                in: [0, 1],
              },
            },
          },
          indexes: [
            {
              name: 'idx_user_activities_user',
              columns: ['user_id'],
            },
            {
              name: 'idx_user_activities_venue',
              columns: ['venue_id'],
            },
            {
              name: 'idx_user_activities_type',
              columns: ['activity_type'],
            },
            {
              name: 'idx_user_activities_created',
              columns: ['created_at'],
            },
          ],
        },
        reviews: {
          name: 'reviews',
          columns: {
            id: {
              name: 'id',
              type: 'TEXT',
              primaryKey: true,
              nullable: false,
            },
            user_id: {
              name: 'user_id',
              type: 'TEXT',
              nullable: false,
              foreignKey: {
                table: 'users',
                column: 'id',
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
              },
            },
            venue_id: {
              name: 'venue_id',
              type: 'TEXT',
              nullable: false,
              foreignKey: {
                table: 'venues',
                column: 'id',
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
              },
            },
            rating: {
              name: 'rating',
              type: 'INTEGER',
              nullable: false,
              validation: {
                min: 1,
                max: 5,
              },
            },
            comment: {
              name: 'comment',
              type: 'TEXT',
              nullable: true,
              validation: {
                maxLength: 2000,
              },
            },
            photos: {
              name: 'photos',
              type: 'TEXT',
              nullable: true,
              description: 'JSON array of photo URLs',
            },
            created_at: {
              name: 'created_at',
              type: 'DATETIME',
              nullable: false,
              defaultValue: 'CURRENT_TIMESTAMP',
            },
            updated_at: {
              name: 'updated_at',
              type: 'DATETIME',
              nullable: false,
              defaultValue: 'CURRENT_TIMESTAMP',
            },
            synced_at: {
              name: 'synced_at',
              type: 'DATETIME',
              nullable: true,
            },
            is_deleted: {
              name: 'is_deleted',
              type: 'INTEGER',
              nullable: false,
              defaultValue: 0,
              validation: {
                in: [0, 1],
              },
            },
          },
          indexes: [
            {
              name: 'idx_reviews_user',
              columns: ['user_id'],
            },
            {
              name: 'idx_reviews_venue',
              columns: ['venue_id'],
            },
            {
              name: 'idx_reviews_rating',
              columns: ['rating'],
            },
            {
              name: 'idx_reviews_created',
              columns: ['created_at'],
            },
          ],
        },
      },
    };
  }

  /**
   * Setup schema validators
   */
  setupSchemaValidators() {
    // Data type validators
    this.schemaValidators.set('TEXT', (value, constraints) => {
      if (typeof value !== 'string') return false;
      if (constraints.minLength && value.length < constraints.minLength) return false;
      if (constraints.maxLength && value.length > constraints.maxLength) return false;
      if (constraints.pattern && !new RegExp(constraints.pattern).test(value)) return false;
      if (constraints.format === 'email' && !this.isValidEmail(value)) return false;
      if (constraints.format === 'url' && !this.isValidUrl(value)) return false;
      if (constraints.in && !constraints.in.includes(value)) return false;
      return true;
    });

    this.schemaValidators.set('INTEGER', (value, constraints) => {
      if (!Number.isInteger(value)) return false;
      if (constraints.min !== undefined && value < constraints.min) return false;
      if (constraints.max !== undefined && value > constraints.max) return false;
      if (constraints.in && !constraints.in.includes(value)) return false;
      return true;
    });

    this.schemaValidators.set('REAL', (value, constraints) => {
      if (typeof value !== 'number') return false;
      if (constraints.min !== undefined && value < constraints.min) return false;
      if (constraints.max !== undefined && value > constraints.max) return false;
      return true;
    });

    this.schemaValidators.set('DATETIME', (value, constraints) => {
      if (value === null || value === undefined) return true;
      const date = new Date(value);
      return !isNaN(date.getTime());
    });

    this.schemaValidators.set('BOOLEAN', (value, constraints) => {
      return typeof value === 'boolean' || value === 0 || value === 1;
    });

    LoggingService.debug('[DatabaseSchemaService] Schema validators setup', {
      validators: this.schemaValidators.size,
    });
  }

  /**
   * Setup relationships
   */
  setupRelationships() {
    const tables = this.currentSchema?.tables || {};
    
    for (const [tableName, table] of Object.entries(tables)) {
      for (const [columnName, column] of Object.entries(table.columns)) {
        if (column.foreignKey) {
          const relationshipKey = `${tableName}.${columnName}`;
          this.relationshipMap.set(relationshipKey, {
            fromTable: tableName,
            fromColumn: columnName,
            toTable: column.foreignKey.table,
            toColumn: column.foreignKey.column,
            onDelete: column.foreignKey.onDelete || 'RESTRICT',
            onUpdate: column.foreignKey.onUpdate || 'RESTRICT',
          });
        }
      }
    }
    
    LoggingService.debug('[DatabaseSchemaService] Relationships setup', {
      relationships: this.relationshipMap.size,
    });
  }

  /**
   * Setup indexes
   */
  setupIndexes() {
    const tables = this.currentSchema?.tables || {};
    
    for (const [tableName, table] of Object.entries(tables)) {
      if (table.indexes) {
        for (const index of table.indexes) {
          const indexKey = `${tableName}.${index.name}`;
          this.indexMap.set(indexKey, {
            table: tableName,
            name: index.name,
            columns: index.columns,
            unique: index.unique || false,
          });
        }
      }
    }
    
    LoggingService.debug('[DatabaseSchemaService] Indexes setup', {
      indexes: this.indexMap.size,
    });
  }

  /**
   * Validate data against schema
   */
  validateData(tableName, data) {
    try {
      const table = this.currentSchema?.tables?.[tableName];
      if (!table) {
        throw new Error(`Table ${tableName} not found in schema`);
      }

      const errors = [];
      
      // Validate each field
      for (const [columnName, column] of Object.entries(table.columns)) {
        const value = data[columnName];
        
        // Check nullable constraint
        if (!column.nullable && (value === null || value === undefined)) {
          errors.push(`Column ${columnName} cannot be null`);
          continue;
        }
        
        // Skip validation for null values on nullable columns
        if (column.nullable && (value === null || value === undefined)) {
          continue;
        }
        
        // Validate data type and constraints
        const validator = this.schemaValidators.get(column.type);
        if (validator && !validator(value, column.validation || {})) {
          errors.push(`Invalid value for column ${columnName}: ${value}`);
        }
      }
      
      // Check for required fields
      for (const [columnName, column] of Object.entries(table.columns)) {
        if (!column.nullable && !column.defaultValue && !(columnName in data)) {
          errors.push(`Required column ${columnName} is missing`);
        }
      }
      
      return {
        valid: errors.length === 0,
        errors,
      };

    } catch (error) {
      LoggingService.error('[DatabaseSchemaService] Data validation failed', {
        error: error.message,
        tableName,
      });
      
      return {
        valid: false,
        errors: [error.message],
      };
    }
  }

  /**
   * Validate schema integrity
   */
  async validateSchema() {
    try {
      const errors = [];
      const warnings = [];
      
      // Validate table structure
      for (const [tableName, table] of Object.entries(this.currentSchema.tables)) {
        // Check table name length
        if (tableName.length > this.constraints.maxTableNameLength) {
          errors.push(`Table name ${tableName} exceeds maximum length`);
        }
        
        // Check column count
        const columnCount = Object.keys(table.columns).length;
        if (columnCount > this.constraints.maxColumnsPerTable) {
          warnings.push(`Table ${tableName} has ${columnCount} columns, exceeding recommended limit`);
        }
        
        // Validate columns
        let hasPrimaryKey = false;
        for (const [columnName, column] of Object.entries(table.columns)) {
          // Check column name length
          if (columnName.length > this.constraints.maxColumnNameLength) {
            errors.push(`Column name ${tableName}.${columnName} exceeds maximum length`);
          }
          
          // Check data type
          if (!this.supportedDataTypes.includes(column.type)) {
            errors.push(`Unsupported data type ${column.type} in ${tableName}.${columnName}`);
          }
          
          // Check primary key
          if (column.primaryKey) {
            if (hasPrimaryKey) {
              errors.push(`Multiple primary keys defined in table ${tableName}`);
            }
            hasPrimaryKey = true;
          }
          
          // Validate foreign key references
          if (column.foreignKey) {
            const referencedTable = this.currentSchema.tables[column.foreignKey.table];
            if (!referencedTable) {
              errors.push(`Foreign key reference to non-existent table ${column.foreignKey.table}`);
            } else if (!referencedTable.columns[column.foreignKey.column]) {
              errors.push(`Foreign key reference to non-existent column ${column.foreignKey.table}.${column.foreignKey.column}`);
            }
          }
        }
        
        if (!hasPrimaryKey) {
          warnings.push(`Table ${tableName} has no primary key defined`);
        }
        
        // Validate indexes
        if (table.indexes) {
          if (table.indexes.length > this.constraints.maxIndexesPerTable) {
            warnings.push(`Table ${tableName} has ${table.indexes.length} indexes, exceeding recommended limit`);
          }
          
          for (const index of table.indexes) {
            if (index.name.length > this.constraints.maxIndexNameLength) {
              errors.push(`Index name ${index.name} exceeds maximum length`);
            }
            
            // Check if indexed columns exist
            for (const columnName of index.columns) {
              if (!table.columns[columnName]) {
                errors.push(`Index ${index.name} references non-existent column ${columnName}`);
              }
            }
          }
        }
      }
      
      LoggingService.info('[DatabaseSchemaService] Schema validation completed', {
        errors: errors.length,
        warnings: warnings.length,
      });
      
      if (errors.length > 0) {
        LoggingService.error('[DatabaseSchemaService] Schema validation errors', { errors });
      }
      
      if (warnings.length > 0) {
        LoggingService.warn('[DatabaseSchemaService] Schema validation warnings', { warnings });
      }
      
      return {
        valid: errors.length === 0,
        errors,
        warnings,
      };

    } catch (error) {
      LoggingService.error('[DatabaseSchemaService] Schema validation failed', {
        error: error.message,
      });
      
      return {
        valid: false,
        errors: [error.message],
        warnings: [],
      };
    }
  }

  /**
   * Generate SQL DDL for schema
   */
  generateSQLDDL() {
    try {
      const ddlStatements = [];
      
      // Generate CREATE TABLE statements
      for (const [tableName, table] of Object.entries(this.currentSchema.tables)) {
        let createTableSQL = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
        
        const columnDefinitions = [];
        const foreignKeys = [];
        
        // Process columns
        for (const [columnName, column] of Object.entries(table.columns)) {
          let columnDef = `  ${columnName} ${column.type}`;
          
          if (column.primaryKey) {
            columnDef += ' PRIMARY KEY';
          }
          
          if (!column.nullable) {
            columnDef += ' NOT NULL';
          }
          
          if (column.unique && !column.primaryKey) {
            columnDef += ' UNIQUE';
          }
          
          if (column.defaultValue) {
            columnDef += ` DEFAULT ${column.defaultValue}`;
          }
          
          columnDefinitions.push(columnDef);
          
          // Collect foreign keys
          if (column.foreignKey) {
            const fkConstraint = `  FOREIGN KEY (${columnName}) REFERENCES ${column.foreignKey.table} (${column.foreignKey.column})`;
            const onDelete = column.foreignKey.onDelete ? ` ON DELETE ${column.foreignKey.onDelete}` : '';
            const onUpdate = column.foreignKey.onUpdate ? ` ON UPDATE ${column.foreignKey.onUpdate}` : '';
            foreignKeys.push(fkConstraint + onDelete + onUpdate);
          }
        }
        
        createTableSQL += columnDefinitions.join(',\n');
        
        if (foreignKeys.length > 0) {
          createTableSQL += ',\n' + foreignKeys.join(',\n');
        }
        
        createTableSQL += '\n);';
        ddlStatements.push(createTableSQL);
        
        // Generate index statements
        if (table.indexes) {
          for (const index of table.indexes) {
            const uniqueKeyword = index.unique ? 'UNIQUE ' : '';
            const indexSQL = `CREATE ${uniqueKeyword}INDEX IF NOT EXISTS ${index.name} ON ${tableName} (${index.columns.join(', ')});`;
            ddlStatements.push(indexSQL);
          }
        }
      }
      
      return ddlStatements.join('\n\n');

    } catch (error) {
      LoggingService.error('[DatabaseSchemaService] Failed to generate SQL DDL', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Save schema to database
   */
  async saveSchema() {
    try {
      this.currentSchema.updatedAt = new Date().toISOString();
      
      await DatabaseService.setMetadata('database_schema', JSON.stringify(this.currentSchema));
      
      LoggingService.debug('[DatabaseSchemaService] Schema saved', {
        version: this.currentSchema.version,
      });

    } catch (error) {
      LoggingService.error('[DatabaseSchemaService] Failed to save schema', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get table schema
   */
  getTableSchema(tableName) {
    return this.currentSchema?.tables?.[tableName] || null;
  }

  /**
   * Get column schema
   */
  getColumnSchema(tableName, columnName) {
    const table = this.getTableSchema(tableName);
    return table?.columns?.[columnName] || null;
  }

  /**
   * Get relationships for table
   */
  getTableRelationships(tableName) {
    const relationships = [];
    
    for (const [key, relationship] of this.relationshipMap) {
      if (relationship.fromTable === tableName || relationship.toTable === tableName) {
        relationships.push(relationship);
      }
    }
    
    return relationships;
  }

  /**
   * Get indexes for table
   */
  getTableIndexes(tableName) {
    const indexes = [];
    
    for (const [key, index] of this.indexMap) {
      if (index.table === tableName) {
        indexes.push(index);
      }
    }
    
    return indexes;
  }

  /**
   * Get schema statistics
   */
  getSchemaStatistics() {
    const tables = this.currentSchema?.tables || {};
    
    let totalColumns = 0;
    let totalIndexes = 0;
    let totalConstraints = 0;
    
    for (const table of Object.values(tables)) {
      totalColumns += Object.keys(table.columns).length;
      totalIndexes += table.indexes?.length || 0;
      totalConstraints += table.constraints?.length || 0;
    }
    
    return {
      version: this.currentSchema?.version,
      tables: Object.keys(tables).length,
      columns: totalColumns,
      indexes: totalIndexes,
      constraints: totalConstraints,
      relationships: this.relationshipMap.size,
      initialized: this.initialized,
    };
  }

  // Helper methods

  /**
   * Validate email format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate URL format
   */
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.schemaValidators.clear();
    this.relationshipMap.clear();
    this.indexMap.clear();
    this.currentSchema = null;
    this.initialized = false;
  }
}

// Create singleton instance
const databaseSchemaService = new DatabaseSchemaService();

export default databaseSchemaService;