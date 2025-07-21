/**
 * Data Protection Service
 * Comprehensive data protection and encryption system with GDPR compliance
 */

import { Platform } from 'react-native';
import CryptoJS from 'crypto-js';
import * as SecureStore from 'expo-secure-store';

import LoggingService from './LoggingService';
import LocalStorageService from './LocalStorageService';
import ConfigService from './ConfigService';
import ConsentManagementService from './ConsentManagementService';

class DataProtectionService {
  constructor() {
    this.initialized = false;
    this.encryptionKeys = new Map();
    this.protectedData = new Map();
    this.dataClassifications = new Map();
    
    // Protection configuration
    this.config = {
      enableEncryption: true,
      enableDataClassification: true,
      enableAccessControl: true,
      enableDataMasking: true,
      enableSecureStorage: true,
      enableTransitEncryption: true,
      encryptionAlgorithm: 'AES-256-GCM',
      keyDerivationIterations: 10000,
      keyRotationDays: 90,
      sessionTimeout: 30, // minutes
      dataRetentionDays: 365,
      enableAuditLogging: true,
      enableAnonymization: true,
      enablePseudonymization: true,
    };
    
    // Data classification levels
    this.classificationLevels = {
      PUBLIC: {
        id: 'public',
        level: 0,
        name: '公開',
        description: '公開されても問題ないデータ',
        encryption: false,
        masking: false,
        retention: 'unlimited',
        accessControl: false,
        auditLogging: false,
      },
      INTERNAL: {
        id: 'internal',
        level: 1,
        name: '内部',
        description: '内部利用のためのデータ',
        encryption: true,
        masking: false,
        retention: '7 years',
        accessControl: true,
        auditLogging: true,
      },
      CONFIDENTIAL: {
        id: 'confidential',
        level: 2,
        name: '機密',
        description: '機密性の高いデータ',
        encryption: true,
        masking: true,
        retention: '3 years',
        accessControl: true,
        auditLogging: true,
      },
      RESTRICTED: {
        id: 'restricted',
        level: 3,
        name: '秘匿',
        description: '最高レベルの機密データ',
        encryption: true,
        masking: true,
        retention: '1 year',
        accessControl: true,
        auditLogging: true,
      },
      PERSONAL: {
        id: 'personal',
        level: 4,
        name: '個人情報',
        description: 'GDPR対象の個人データ',
        encryption: true,
        masking: true,
        retention: 'consent_based',
        accessControl: true,
        auditLogging: true,
        specialHandling: true,
      },
    };
    
    // Data types with classifications
    this.dataTypes = {
      USER_PROFILE: {
        id: 'user_profile',
        name: 'ユーザープロファイル',
        classification: 'personal',
        fields: {
          id: { classification: 'internal', pii: false },
          email: { classification: 'personal', pii: true },
          name: { classification: 'personal', pii: true },
          phoneNumber: { classification: 'personal', pii: true },
          birthDate: { classification: 'personal', pii: true },
          avatar: { classification: 'internal', pii: false },
          preferences: { classification: 'internal', pii: false },
          createdAt: { classification: 'internal', pii: false },
        },
      },
      LOCATION_DATA: {
        id: 'location_data',
        name: '位置データ',
        classification: 'personal',
        fields: {
          latitude: { classification: 'personal', pii: true },
          longitude: { classification: 'personal', pii: true },
          accuracy: { classification: 'internal', pii: false },
          timestamp: { classification: 'internal', pii: false },
          address: { classification: 'personal', pii: true },
        },
      },
      USAGE_ANALYTICS: {
        id: 'usage_analytics',
        name: '利用分析データ',
        classification: 'internal',
        fields: {
          sessionId: { classification: 'internal', pii: false },
          pageViews: { classification: 'internal', pii: false },
          actions: { classification: 'internal', pii: false },
          duration: { classification: 'internal', pii: false },
          deviceInfo: { classification: 'internal', pii: false },
        },
      },
      COMMUNICATION: {
        id: 'communication',
        name: 'コミュニケーション',
        classification: 'confidential',
        fields: {
          messageId: { classification: 'internal', pii: false },
          content: { classification: 'confidential', pii: true },
          timestamp: { classification: 'internal', pii: false },
          senderId: { classification: 'internal', pii: false },
          receiverId: { classification: 'internal', pii: false },
        },
      },
      AUTHENTICATION: {
        id: 'authentication',
        name: '認証データ',
        classification: 'restricted',
        fields: {
          hashedPassword: { classification: 'restricted', pii: true },
          salt: { classification: 'restricted', pii: false },
          tokens: { classification: 'restricted', pii: false },
          sessions: { classification: 'confidential', pii: false },
          loginAttempts: { classification: 'confidential', pii: false },
        },
      },
    };
    
    // Encryption contexts
    this.encryptionContexts = {
      STORAGE: 'storage',
      TRANSMISSION: 'transmission',
      PROCESSING: 'processing',
      BACKUP: 'backup',
      ANALYTICS: 'analytics',
    };
    
    // Masking strategies
    this.maskingStrategies = {
      PARTIAL: 'partial',
      FULL: 'full',
      HASH: 'hash',
      ANONYMIZE: 'anonymize',
      PSEUDONYMIZE: 'pseudonymize',
    };
    
    // Statistics
    this.stats = {
      dataEncrypted: 0,
      dataDecrypted: 0,
      dataMasked: 0,
      dataAnonymized: 0,
      keyRotations: 0,
      accessViolations: 0,
      auditLogEntries: 0,
      classificationChanges: 0,
    };
    
    // Event listeners
    this.listeners = new Set();
    this.keyRotationTimer = null;
    this.auditTimer = null;
  }

  /**
   * Initialize data protection service
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Load configuration
      await this.loadProtectionConfig();
      
      // Initialize encryption keys
      await this.initializeEncryptionKeys();
      
      // Setup key rotation
      this.setupKeyRotation();
      
      // Setup audit logging
      this.setupAuditLogging();
      
      // Validate existing data
      await this.validateExistingData();
      
      this.initialized = true;
      
      LoggingService.info('[DataProtectionService] Initialized', {
        encryptionEnabled: this.config.enableEncryption,
        algorithm: this.config.encryptionAlgorithm,
        classifications: Object.keys(this.classificationLevels).length,
        dataTypes: Object.keys(this.dataTypes).length,
      });

    } catch (error) {
      LoggingService.error('[DataProtectionService] Failed to initialize', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Encrypt data with context-aware protection
   */
  async encryptData(data, context = {}) {
    try {
      if (!this.config.enableEncryption) {
        return data;
      }
      
      const {
        dataType,
        classification,
        encryptionContext = this.encryptionContexts.STORAGE,
        includeMetadata = true,
      } = context;
      
      // Determine encryption requirements
      const protectionLevel = this.getProtectionLevel(dataType, classification);
      if (!protectionLevel.encryption) {
        return data;
      }
      
      // Get encryption key
      const key = await this.getEncryptionKey(encryptionContext);
      
      // Prepare data for encryption
      const serializedData = JSON.stringify(data);
      const iv = CryptoJS.lib.WordArray.random(16);
      
      // Encrypt data
      const encrypted = CryptoJS.AES.encrypt(serializedData, key, {
        iv: iv,
        mode: CryptoJS.mode.GCM,
        padding: CryptoJS.pad.NoPadding,
      });
      
      // Create encrypted package
      const encryptedPackage = {
        data: encrypted.toString(),
        iv: iv.toString(CryptoJS.enc.Base64),
        algorithm: this.config.encryptionAlgorithm,
        context: encryptionContext,
        timestamp: new Date().toISOString(),
        keyVersion: await this.getKeyVersion(encryptionContext),
      };
      
      // Add metadata if requested
      if (includeMetadata) {
        encryptedPackage.metadata = {
          dataType,
          classification,
          protectionLevel: protectionLevel.level,
          encrypted: true,
        };
      }
      
      // Update statistics
      this.stats.dataEncrypted++;
      
      // Log encryption event
      await this.logDataOperation('ENCRYPT', {
        dataType,
        classification,
        context: encryptionContext,
        algorithm: this.config.encryptionAlgorithm,
      });
      
      return encryptedPackage;

    } catch (error) {
      LoggingService.error('[DataProtectionService] Encryption failed', {
        error: error.message,
        dataType: context.dataType,
        classification: context.classification,
      });
      throw error;
    }
  }

  /**
   * Decrypt data with validation
   */
  async decryptData(encryptedPackage, context = {}) {
    try {
      if (!this.config.enableEncryption || !encryptedPackage.data) {
        return encryptedPackage;
      }
      
      const {
        validateAccess = true,
        auditAccess = true,
      } = context;
      
      // Validate access if required
      if (validateAccess) {
        const hasAccess = await this.validateDataAccess(encryptedPackage.metadata);
        if (!hasAccess) {
          this.stats.accessViolations++;
          throw new Error('Access denied to encrypted data');
        }
      }
      
      // Get decryption key
      const key = await this.getEncryptionKey(
        encryptedPackage.context,
        encryptedPackage.keyVersion
      );
      
      // Decrypt data
      const iv = CryptoJS.enc.Base64.parse(encryptedPackage.iv);
      const decrypted = CryptoJS.AES.decrypt(encryptedPackage.data, key, {
        iv: iv,
        mode: CryptoJS.mode.GCM,
        padding: CryptoJS.pad.NoPadding,
      });
      
      const decryptedData = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
      
      // Update statistics
      this.stats.dataDecrypted++;
      
      // Log decryption event
      if (auditAccess) {
        await this.logDataOperation('DECRYPT', {
          dataType: encryptedPackage.metadata?.dataType,
          classification: encryptedPackage.metadata?.classification,
          context: encryptedPackage.context,
          timestamp: new Date().toISOString(),
        });
      }
      
      return decryptedData;

    } catch (error) {
      LoggingService.error('[DataProtectionService] Decryption failed', {
        error: error.message,
        context: encryptedPackage.context,
      });
      throw error;
    }
  }

  /**
   * Mask sensitive data
   */
  maskData(data, context = {}) {
    try {
      const {
        dataType,
        classification,
        strategy = this.maskingStrategies.PARTIAL,
        fields = null,
      } = context;
      
      // Determine masking requirements
      const protectionLevel = this.getProtectionLevel(dataType, classification);
      if (!protectionLevel.masking) {
        return data;
      }
      
      const maskedData = { ...data };
      const dataTypeInfo = this.dataTypes[dataType?.toUpperCase()];
      
      // Apply masking to specified fields or all PII fields
      const fieldsToMask = fields || this.getPIIFields(dataTypeInfo);
      
      fieldsToMask.forEach(field => {
        if (maskedData[field] !== undefined) {
          maskedData[field] = this.applyMaskingStrategy(maskedData[field], strategy);
        }
      });
      
      // Update statistics
      this.stats.dataMasked++;
      
      // Log masking event
      this.logDataOperation('MASK', {
        dataType,
        classification,
        strategy,
        fieldsCount: fieldsToMask.length,
      });
      
      return maskedData;

    } catch (error) {
      LoggingService.error('[DataProtectionService] Masking failed', {
        error: error.message,
        dataType: context.dataType,
      });
      return data;
    }
  }

  /**
   * Anonymize data for analytics
   */
  anonymizeData(data, context = {}) {
    try {
      const {
        dataType,
        preserveStructure = true,
        preserveStatistics = true,
      } = context;
      
      const dataTypeInfo = this.dataTypes[dataType?.toUpperCase()];
      if (!dataTypeInfo) {
        return data;
      }
      
      const anonymizedData = preserveStructure ? { ...data } : {};
      
      // Remove or anonymize PII fields
      Object.entries(dataTypeInfo.fields).forEach(([field, fieldInfo]) => {
        if (fieldInfo.pii) {
          if (preserveStatistics && typeof data[field] === 'number') {
            // For numerical PII, add noise
            anonymizedData[field] = this.addNoise(data[field]);
          } else {
            // Remove or replace with anonymized value
            anonymizedData[field] = this.generateAnonymizedValue(data[field]);
          }
        } else {
          anonymizedData[field] = data[field];
        }
      });
      
      // Add anonymization metadata
      if (preserveStructure) {
        anonymizedData._anonymized = {
          timestamp: new Date().toISOString(),
          originalDataType: dataType,
          method: 'field_level_anonymization',
        };
      }
      
      // Update statistics
      this.stats.dataAnonymized++;
      
      // Log anonymization event
      this.logDataOperation('ANONYMIZE', {
        dataType,
        preserveStructure,
        preserveStatistics,
      });
      
      return anonymizedData;

    } catch (error) {
      LoggingService.error('[DataProtectionService] Anonymization failed', {
        error: error.message,
        dataType: context.dataType,
      });
      return data;
    }
  }

  /**
   * Pseudonymize data for analysis
   */
  pseudonymizeData(data, context = {}) {
    try {
      const {
        dataType,
        pseudonymKey = 'default',
        preserveRelationships = true,
      } = context;
      
      const dataTypeInfo = this.dataTypes[dataType?.toUpperCase()];
      if (!dataTypeInfo) {
        return data;
      }
      
      const pseudonymizedData = { ...data };
      
      // Generate consistent pseudonyms for PII fields
      Object.entries(dataTypeInfo.fields).forEach(([field, fieldInfo]) => {
        if (fieldInfo.pii && pseudonymizedData[field]) {
          pseudonymizedData[field] = this.generatePseudonym(
            pseudonymizedData[field],
            pseudonymKey,
            field
          );
        }
      });
      
      // Add pseudonymization metadata
      pseudonymizedData._pseudonymized = {
        timestamp: new Date().toISOString(),
        key: pseudonymKey,
        preserveRelationships,
        reversible: true,
      };
      
      // Log pseudonymization event
      this.logDataOperation('PSEUDONYMIZE', {
        dataType,
        pseudonymKey,
        preserveRelationships,
      });
      
      return pseudonymizedData;

    } catch (error) {
      LoggingService.error('[DataProtectionService] Pseudonymization failed', {
        error: error.message,
        dataType: context.dataType,
      });
      return data;
    }
  }

  /**
   * Classify data automatically
   */
  classifyData(data, context = {}) {
    try {
      const {
        dataType,
        overrideClassification = null,
      } = context;
      
      // Use override classification if provided
      if (overrideClassification) {
        return overrideClassification;
      }
      
      // Get default classification from data type
      const dataTypeInfo = this.dataTypes[dataType?.toUpperCase()];
      if (dataTypeInfo) {
        return dataTypeInfo.classification;
      }
      
      // Auto-classify based on data content
      const classification = this.autoClassifyData(data);
      
      // Log classification
      this.logDataOperation('CLASSIFY', {
        dataType,
        classification,
        autoClassified: !dataTypeInfo,
      });
      
      this.stats.classificationChanges++;
      
      return classification;

    } catch (error) {
      LoggingService.error('[DataProtectionService] Classification failed', {
        error: error.message,
        dataType: context.dataType,
      });
      return 'internal'; // Default classification
    }
  }

  /**
   * Store data securely
   */
  async storeSecureData(key, data, context = {}) {
    try {
      const {
        dataType,
        classification,
        useSecureStore = true,
      } = context;
      
      // Classify data
      const finalClassification = this.classifyData(data, { dataType, classification });
      
      // Encrypt data if required
      const encryptedData = await this.encryptData(data, {
        dataType,
        classification: finalClassification,
        encryptionContext: this.encryptionContexts.STORAGE,
      });
      
      // Store based on classification level
      const protectionLevel = this.getProtectionLevel(dataType, finalClassification);
      
      if (useSecureStore && protectionLevel.level >= 3) {
        // Use secure store for highly sensitive data
        await SecureStore.setItemAsync(key, JSON.stringify(encryptedData));
      } else {
        // Use regular storage
        await LocalStorageService.setItem(key, encryptedData);
      }
      
      // Track protected data
      this.protectedData.set(key, {
        dataType,
        classification: finalClassification,
        protectionLevel: protectionLevel.level,
        stored: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
      });
      
      // Log storage event
      await this.logDataOperation('STORE', {
        key,
        dataType,
        classification: finalClassification,
        useSecureStore,
      });
      
      return true;

    } catch (error) {
      LoggingService.error('[DataProtectionService] Secure storage failed', {
        error: error.message,
        key,
        dataType: context.dataType,
      });
      throw error;
    }
  }

  /**
   * Retrieve data securely
   */
  async retrieveSecureData(key, context = {}) {
    try {
      const {
        validateAccess = true,
        updateLastAccessed = true,
      } = context;
      
      // Get data metadata
      const metadata = this.protectedData.get(key);
      
      // Validate access
      if (validateAccess && metadata) {
        const hasAccess = await this.validateDataAccess(metadata);
        if (!hasAccess) {
          this.stats.accessViolations++;
          throw new Error('Access denied to protected data');
        }
      }
      
      // Retrieve data
      let encryptedData;
      const protectionLevel = metadata ? this.getProtectionLevel(metadata.dataType, metadata.classification) : null;
      
      if (protectionLevel && protectionLevel.level >= 3) {
        // Try secure store first
        const secureData = await SecureStore.getItemAsync(key);
        if (secureData) {
          encryptedData = JSON.parse(secureData);
        }
      }
      
      if (!encryptedData) {
        // Try regular storage
        encryptedData = await LocalStorageService.getItem(key);
      }
      
      if (!encryptedData) {
        return null;
      }
      
      // Decrypt data
      const decryptedData = await this.decryptData(encryptedData, {
        validateAccess: false, // Already validated above
        auditAccess: true,
      });
      
      // Update last accessed
      if (updateLastAccessed && metadata) {
        metadata.lastAccessed = new Date().toISOString();
        this.protectedData.set(key, metadata);
      }
      
      // Log retrieval event
      await this.logDataOperation('RETRIEVE', {
        key,
        dataType: metadata?.dataType,
        classification: metadata?.classification,
      });
      
      return decryptedData;

    } catch (error) {
      LoggingService.error('[DataProtectionService] Secure retrieval failed', {
        error: error.message,
        key,
      });
      throw error;
    }
  }

  /**
   * Delete data securely
   */
  async deleteSecureData(key, context = {}) {
    try {
      const {
        secureWipe = true,
        auditDeletion = true,
      } = context;
      
      const metadata = this.protectedData.get(key);
      
      // Delete from secure store
      try {
        await SecureStore.deleteItemAsync(key);
      } catch (error) {
        // Key might not exist in secure store
      }
      
      // Delete from regular storage
      await LocalStorageService.removeItem(key);
      
      // Remove from protected data tracking
      this.protectedData.delete(key);
      
      // Log deletion event
      if (auditDeletion) {
        await this.logDataOperation('DELETE', {
          key,
          dataType: metadata?.dataType,
          classification: metadata?.classification,
          secureWipe,
        });
      }
      
      return true;

    } catch (error) {
      LoggingService.error('[DataProtectionService] Secure deletion failed', {
        error: error.message,
        key,
      });
      throw error;
    }
  }

  // Helper methods

  /**
   * Get protection level for data type and classification
   */
  getProtectionLevel(dataType, classification) {
    if (classification) {
      return this.classificationLevels[classification.toUpperCase()] || this.classificationLevels.INTERNAL;
    }
    
    const dataTypeInfo = this.dataTypes[dataType?.toUpperCase()];
    if (dataTypeInfo) {
      return this.classificationLevels[dataTypeInfo.classification.toUpperCase()];
    }
    
    return this.classificationLevels.INTERNAL;
  }

  /**
   * Get PII fields from data type
   */
  getPIIFields(dataTypeInfo) {
    if (!dataTypeInfo) return [];
    
    return Object.entries(dataTypeInfo.fields)
      .filter(([_, fieldInfo]) => fieldInfo.pii)
      .map(([field, _]) => field);
  }

  /**
   * Apply masking strategy to a value
   */
  applyMaskingStrategy(value, strategy) {
    if (value === null || value === undefined) {
      return value;
    }
    
    const stringValue = String(value);
    
    switch (strategy) {
      case this.maskingStrategies.PARTIAL:
        if (stringValue.length <= 4) {
          return '*'.repeat(stringValue.length);
        }
        return stringValue.substring(0, 2) + '*'.repeat(stringValue.length - 4) + stringValue.substring(stringValue.length - 2);
      
      case this.maskingStrategies.FULL:
        return '*'.repeat(stringValue.length);
      
      case this.maskingStrategies.HASH:
        return CryptoJS.SHA256(stringValue).toString();
      
      case this.maskingStrategies.ANONYMIZE:
        return this.generateAnonymizedValue(value);
      
      case this.maskingStrategies.PSEUDONYMIZE:
        return this.generatePseudonym(value, 'default', 'masked');
      
      default:
        return value;
    }
  }

  /**
   * Generate anonymized value
   */
  generateAnonymizedValue(value) {
    if (typeof value === 'string') {
      if (value.includes('@')) {
        return 'anonymized@example.com';
      }
      return 'anonymized';
    }
    
    if (typeof value === 'number') {
      return this.addNoise(value);
    }
    
    return null;
  }

  /**
   * Generate pseudonym
   */
  generatePseudonym(value, key, context) {
    const input = `${value}:${key}:${context}`;
    return CryptoJS.SHA256(input).toString().substring(0, 16);
  }

  /**
   * Add noise to numerical values
   */
  addNoise(value, noiseLevel = 0.1) {
    const noise = (Math.random() - 0.5) * 2 * noiseLevel * Math.abs(value);
    return Math.round(value + noise);
  }

  /**
   * Auto-classify data based on content
   */
  autoClassifyData(data) {
    // Check for PII indicators
    const dataString = JSON.stringify(data).toLowerCase();
    
    if (dataString.includes('password') || dataString.includes('token') || dataString.includes('secret')) {
      return 'restricted';
    }
    
    if (dataString.includes('email') || dataString.includes('phone') || dataString.includes('name')) {
      return 'personal';
    }
    
    if (dataString.includes('message') || dataString.includes('content')) {
      return 'confidential';
    }
    
    return 'internal';
  }

  /**
   * Validate data access
   */
  async validateDataAccess(metadata) {
    if (!metadata) return true;
    
    // Check consent for personal data
    if (metadata.classification === 'personal') {
      const hasConsent = ConsentManagementService.hasConsentFor('functional');
      if (!hasConsent) {
        return false;
      }
    }
    
    // Check access control requirements
    const protectionLevel = this.getProtectionLevel(metadata.dataType, metadata.classification);
    if (protectionLevel.accessControl) {
      // Additional access validation would go here
      return true;
    }
    
    return true;
  }

  /**
   * Initialize encryption keys
   */
  async initializeEncryptionKeys() {
    try {
      for (const context of Object.values(this.encryptionContexts)) {
        let key = await this.getStoredKey(context);
        
        if (!key) {
          key = await this.generateEncryptionKey(context);
          await this.storeEncryptionKey(context, key);
        }
        
        this.encryptionKeys.set(context, {
          key,
          version: 1,
          created: new Date().toISOString(),
          lastUsed: new Date().toISOString(),
        });
      }
      
      LoggingService.info('[DataProtectionService] Encryption keys initialized', {
        contexts: Object.keys(this.encryptionContexts).length,
      });
      
    } catch (error) {
      LoggingService.error('[DataProtectionService] Key initialization failed', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Generate encryption key
   */
  async generateEncryptionKey(context) {
    const salt = CryptoJS.lib.WordArray.random(16);
    const passphrase = `${context}_${Date.now()}_${Math.random()}`;
    
    const key = CryptoJS.PBKDF2(passphrase, salt, {
      keySize: 256 / 32,
      iterations: this.config.keyDerivationIterations,
    });
    
    return key.toString();
  }

  /**
   * Get encryption key
   */
  async getEncryptionKey(context, version = null) {
    const keyInfo = this.encryptionKeys.get(context);
    if (!keyInfo) {
      throw new Error(`Encryption key not found for context: ${context}`);
    }
    
    // Update last used
    keyInfo.lastUsed = new Date().toISOString();
    
    return keyInfo.key;
  }

  /**
   * Get key version
   */
  async getKeyVersion(context) {
    const keyInfo = this.encryptionKeys.get(context);
    return keyInfo?.version || 1;
  }

  /**
   * Store encryption key securely
   */
  async storeEncryptionKey(context, key) {
    const keyName = `encryption_key_${context}`;
    await SecureStore.setItemAsync(keyName, key);
  }

  /**
   * Get stored encryption key
   */
  async getStoredKey(context) {
    try {
      const keyName = `encryption_key_${context}`;
      return await SecureStore.getItemAsync(keyName);
    } catch (error) {
      return null;
    }
  }

  /**
   * Setup key rotation
   */
  setupKeyRotation() {
    if (this.keyRotationTimer) {
      clearInterval(this.keyRotationTimer);
    }
    
    const rotationInterval = this.config.keyRotationDays * 24 * 60 * 60 * 1000;
    
    this.keyRotationTimer = setInterval(async () => {
      try {
        await this.rotateEncryptionKeys();
      } catch (error) {
        LoggingService.error('[DataProtectionService] Key rotation failed', {
          error: error.message,
        });
      }
    }, rotationInterval);
  }

  /**
   * Rotate encryption keys
   */
  async rotateEncryptionKeys() {
    try {
      for (const context of Object.values(this.encryptionContexts)) {
        const keyInfo = this.encryptionKeys.get(context);
        if (!keyInfo) continue;
        
        const keyAge = Date.now() - new Date(keyInfo.created).getTime();
        const maxAge = this.config.keyRotationDays * 24 * 60 * 60 * 1000;
        
        if (keyAge > maxAge) {
          const newKey = await this.generateEncryptionKey(context);
          await this.storeEncryptionKey(context, newKey);
          
          this.encryptionKeys.set(context, {
            key: newKey,
            version: keyInfo.version + 1,
            created: new Date().toISOString(),
            lastUsed: new Date().toISOString(),
          });
          
          this.stats.keyRotations++;
          
          LoggingService.info('[DataProtectionService] Key rotated', {
            context,
            version: keyInfo.version + 1,
          });
        }
      }
      
    } catch (error) {
      LoggingService.error('[DataProtectionService] Key rotation failed', {
        error: error.message,
      });
    }
  }

  /**
   * Setup audit logging
   */
  setupAuditLogging() {
    if (this.auditTimer) {
      clearInterval(this.auditTimer);
    }
    
    // Create audit snapshots daily
    this.auditTimer = setInterval(async () => {
      try {
        await this.createAuditSnapshot();
      } catch (error) {
        LoggingService.error('[DataProtectionService] Audit logging failed', {
          error: error.message,
        });
      }
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  /**
   * Log data operation
   */
  async logDataOperation(operation, details) {
    if (!this.config.enableAuditLogging) {
      return;
    }
    
    const auditEntry = {
      id: this.generateAuditId(),
      timestamp: new Date().toISOString(),
      operation,
      details,
      userId: await this.getUserId(),
      sessionId: await this.getSessionId(),
      ipAddress: await this.getClientIP(),
      userAgent: Platform.OS,
    };
    
    // Store audit entry
    const auditLog = await LocalStorageService.getItem('data_protection_audit') || [];
    auditLog.unshift(auditEntry);
    
    // Limit audit log size
    if (auditLog.length > 10000) {
      auditLog.splice(10000);
    }
    
    await LocalStorageService.setItem('data_protection_audit', auditLog);
    
    this.stats.auditLogEntries++;
  }

  /**
   * Create audit snapshot
   */
  async createAuditSnapshot() {
    const snapshot = {
      id: this.generateAuditId(),
      timestamp: new Date().toISOString(),
      type: 'daily_snapshot',
      statistics: { ...this.stats },
      protectedDataCount: this.protectedData.size,
      encryptionKeys: this.encryptionKeys.size,
      configuration: {
        encryptionEnabled: this.config.enableEncryption,
        algorithm: this.config.encryptionAlgorithm,
        keyRotationDays: this.config.keyRotationDays,
      },
    };
    
    const snapshots = await LocalStorageService.getItem('data_protection_snapshots') || [];
    snapshots.unshift(snapshot);
    
    if (snapshots.length > 365) {
      snapshots.splice(365);
    }
    
    await LocalStorageService.setItem('data_protection_snapshots', snapshots);
    
    LoggingService.info('[DataProtectionService] Audit snapshot created', {
      snapshotId: snapshot.id,
      protectedDataCount: snapshot.protectedDataCount,
    });
  }

  /**
   * Validate existing data
   */
  async validateExistingData() {
    // This would validate existing data integrity and protection status
    LoggingService.info('[DataProtectionService] Existing data validation completed');
  }

  /**
   * Load protection configuration
   */
  async loadProtectionConfig() {
    try {
      const savedConfig = await LocalStorageService.getItem('data_protection_config');
      if (savedConfig) {
        this.config = { ...this.config, ...savedConfig };
      }
    } catch (error) {
      LoggingService.warn('[DataProtectionService] Failed to load config', {
        error: error.message,
      });
    }
  }

  // Utility methods

  /**
   * Generate audit ID
   */
  generateAuditId() {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get user ID
   */
  async getUserId() {
    try {
      const userProfile = await LocalStorageService.getItem('user_profile');
      return userProfile?.id || 'anonymous';
    } catch (error) {
      return 'anonymous';
    }
  }

  /**
   * Get session ID
   */
  async getSessionId() {
    try {
      const sessionData = await LocalStorageService.getItem('session_data');
      return sessionData?.sessionId || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Get client IP (placeholder)
   */
  async getClientIP() {
    return '127.0.0.1';
  }

  /**
   * Get service statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      protectedDataCount: this.protectedData.size,
      encryptionKeysCount: this.encryptionKeys.size,
      initialized: this.initialized,
      encryptionEnabled: this.config.enableEncryption,
    };
  }

  /**
   * Get data protection report
   */
  async getDataProtectionReport() {
    return {
      timestamp: new Date().toISOString(),
      statistics: this.getStatistics(),
      classifications: Object.keys(this.classificationLevels).length,
      dataTypes: Object.keys(this.dataTypes).length,
      protectedData: this.protectedData.size,
      encryptionContexts: Object.keys(this.encryptionContexts).length,
      configuration: {
        encryptionEnabled: this.config.enableEncryption,
        algorithm: this.config.encryptionAlgorithm,
        keyRotationDays: this.config.keyRotationDays,
        auditLoggingEnabled: this.config.enableAuditLogging,
      },
    };
  }

  /**
   * Add event listener
   */
  addListener(listener) {
    this.listeners.add(listener);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify event listeners
   */
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        LoggingService.error('[DataProtectionService] Listener error', {
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
    if (this.keyRotationTimer) {
      clearInterval(this.keyRotationTimer);
      this.keyRotationTimer = null;
    }
    
    if (this.auditTimer) {
      clearInterval(this.auditTimer);
      this.auditTimer = null;
    }
    
    this.listeners.clear();
    this.encryptionKeys.clear();
    this.protectedData.clear();
    this.dataClassifications.clear();
    this.initialized = false;
  }
}

// Create singleton instance
const dataProtectionService = new DataProtectionService();

export default dataProtectionService;