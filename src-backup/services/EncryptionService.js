import { LocalStorageService } from './LocalStorageService';
import { AuditLogService } from './AuditLogService';

class EncryptionService {
  constructor() {
    this.initialized = false;
    this.storageService = null;
    this.auditService = null;
    this.encryptionKeys = new Map();
    this.keyRotationSchedule = new Map();
    this.encryptionAlgorithms = new Map();
    this.keyPairs = new Map();
    this.certificates = new Map();
    this.encryptionPolicies = new Map();
    this.encryptionMetrics = {
      totalEncryptions: 0,
      totalDecryptions: 0,
      keyRotations: 0,
      algorithmUsage: {},
      encryptionErrors: 0,
      performanceMetrics: {}
    };
    this.listeners = [];
    this.rotationTimer = null;
    this.keyDerivationConfig = {
      iterations: 100000,
      keyLength: 32,
      algorithm: 'PBKDF2',
      hash: 'SHA-256'
    };
    this.encryptionConfig = {
      defaultAlgorithm: 'AES-256-GCM',
      keyRotationInterval: 30 * 24 * 60 * 60 * 1000, // 30 days
      backupEncryption: true,
      compressionBeforeEncryption: true,
      integrityChecking: true
    };
  }

  static getInstance() {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      this.storageService = LocalStorageService.getInstance();
      this.auditService = AuditLogService.getInstance();
      
      await this.loadEncryptionKeys();
      await this.loadEncryptionPolicies();
      await this.loadEncryptionAlgorithms();
      await this.loadKeyPairs();
      await this.loadCertificates();
      await this.loadEncryptionMetrics();
      await this.loadEncryptionConfig();
      await this.initializeDefaultKeys();
      await this.startKeyRotationScheduler();
      
      this.initialized = true;
      
      await this.auditService.logEvent('encryption_service_initialized', {
        timestamp: new Date().toISOString(),
        encryption_keys: this.encryptionKeys.size,
        algorithms: this.encryptionAlgorithms.size,
        key_pairs: this.keyPairs.size
      });
      
      this.emit('serviceInitialized');
    } catch (error) {
      console.error('Failed to initialize EncryptionService:', error);
      throw error;
    }
  }

  async loadEncryptionKeys() {
    try {
      const keys = await this.storageService.getItem('encryption_keys');
      const keyList = keys || [];

      this.encryptionKeys.clear();
      keyList.forEach(keyData => {
        this.encryptionKeys.set(keyData.id, keyData);
      });
    } catch (error) {
      console.error('Failed to load encryption keys:', error);
      this.encryptionKeys.clear();
    }
  }

  async loadEncryptionPolicies() {
    try {
      const policies = await this.storageService.getItem('encryption_policies');
      const policyList = policies || [
        {
          id: 'default_policy',
          name: 'Default Encryption Policy',
          description: 'Standard encryption for general data',
          algorithm: 'AES-256-GCM',
          keyLength: 32,
          keyRotationInterval: 30 * 24 * 60 * 60 * 1000, // 30 days
          backupRequired: true,
          compressionEnabled: true,
          integrityCheckEnabled: true,
          dataTypes: ['user_data', 'preferences', 'cache'],
          enabled: true
        },
        {
          id: 'sensitive_data_policy',
          name: 'Sensitive Data Encryption Policy',
          description: 'High-security encryption for sensitive data',
          algorithm: 'AES-256-GCM',
          keyLength: 32,
          keyRotationInterval: 7 * 24 * 60 * 60 * 1000, // 7 days
          backupRequired: true,
          compressionEnabled: false,
          integrityCheckEnabled: true,
          dataTypes: ['payment_info', 'personal_info', 'auth_tokens'],
          enabled: true
        },
        {
          id: 'database_policy',
          name: 'Database Encryption Policy',
          description: 'Encryption for database records',
          algorithm: 'AES-256-GCM',
          keyLength: 32,
          keyRotationInterval: 90 * 24 * 60 * 60 * 1000, // 90 days
          backupRequired: true,
          compressionEnabled: true,
          integrityCheckEnabled: true,
          dataTypes: ['database_records', 'user_profiles', 'venue_data'],
          enabled: true
        },
        {
          id: 'transport_policy',
          name: 'Transport Encryption Policy',
          description: 'Encryption for data in transit',
          algorithm: 'RSA-OAEP',
          keyLength: 2048,
          keyRotationInterval: 365 * 24 * 60 * 60 * 1000, // 1 year
          backupRequired: true,
          compressionEnabled: false,
          integrityCheckEnabled: true,
          dataTypes: ['api_requests', 'websocket_messages', 'file_transfers'],
          enabled: true
        }
      ];

      this.encryptionPolicies.clear();
      policyList.forEach(policy => {
        this.encryptionPolicies.set(policy.id, policy);
      });

      await this.storageService.setItem('encryption_policies', policyList);
    } catch (error) {
      console.error('Failed to load encryption policies:', error);
      this.encryptionPolicies.clear();
    }
  }

  async loadEncryptionAlgorithms() {
    try {
      const algorithms = await this.storageService.getItem('encryption_algorithms');
      const algorithmList = algorithms || [
        {
          id: 'aes-256-gcm',
          name: 'AES-256-GCM',
          type: 'symmetric',
          keyLength: 32,
          ivLength: 16,
          tagLength: 16,
          description: 'Advanced Encryption Standard with Galois Counter Mode',
          strength: 'high',
          performance: 'fast',
          supported: true
        },
        {
          id: 'aes-128-gcm',
          name: 'AES-128-GCM',
          type: 'symmetric',
          keyLength: 16,
          ivLength: 16,
          tagLength: 16,
          description: 'Advanced Encryption Standard 128-bit with Galois Counter Mode',
          strength: 'medium',
          performance: 'very_fast',
          supported: true
        },
        {
          id: 'rsa-oaep',
          name: 'RSA-OAEP',
          type: 'asymmetric',
          keyLength: 2048,
          description: 'RSA with Optimal Asymmetric Encryption Padding',
          strength: 'high',
          performance: 'slow',
          supported: true
        },
        {
          id: 'ecdh',
          name: 'ECDH',
          type: 'key_exchange',
          curve: 'P-256',
          description: 'Elliptic Curve Diffie-Hellman',
          strength: 'high',
          performance: 'medium',
          supported: true
        },
        {
          id: 'chacha20-poly1305',
          name: 'ChaCha20-Poly1305',
          type: 'symmetric',
          keyLength: 32,
          ivLength: 12,
          tagLength: 16,
          description: 'ChaCha20 stream cipher with Poly1305 authenticator',
          strength: 'high',
          performance: 'fast',
          supported: false // Would need implementation
        }
      ];

      this.encryptionAlgorithms.clear();
      algorithmList.forEach(algorithm => {
        this.encryptionAlgorithms.set(algorithm.id, algorithm);
      });

      await this.storageService.setItem('encryption_algorithms', algorithmList);
    } catch (error) {
      console.error('Failed to load encryption algorithms:', error);
      this.encryptionAlgorithms.clear();
    }
  }

  async loadKeyPairs() {
    try {
      const keyPairs = await this.storageService.getItem('key_pairs');
      const keyPairList = keyPairs || [];

      this.keyPairs.clear();
      keyPairList.forEach(keyPair => {
        this.keyPairs.set(keyPair.id, keyPair);
      });
    } catch (error) {
      console.error('Failed to load key pairs:', error);
      this.keyPairs.clear();
    }
  }

  async loadCertificates() {
    try {
      const certificates = await this.storageService.getItem('certificates');
      const certificateList = certificates || [];

      this.certificates.clear();
      certificateList.forEach(cert => {
        this.certificates.set(cert.id, cert);
      });
    } catch (error) {
      console.error('Failed to load certificates:', error);
      this.certificates.clear();
    }
  }

  async loadEncryptionMetrics() {
    try {
      const metrics = await this.storageService.getItem('encryption_metrics');
      if (metrics) {
        this.encryptionMetrics = { ...this.encryptionMetrics, ...metrics };
      }
    } catch (error) {
      console.error('Failed to load encryption metrics:', error);
    }
  }

  async loadEncryptionConfig() {
    try {
      const config = await this.storageService.getItem('encryption_config');
      if (config) {
        this.encryptionConfig = { ...this.encryptionConfig, ...config };
      }
    } catch (error) {
      console.error('Failed to load encryption config:', error);
    }
  }

  async initializeDefaultKeys() {
    try {
      // Create default encryption key if none exists
      if (this.encryptionKeys.size === 0) {
        await this.generateEncryptionKey('default', 'default_policy');
      }

      // Create default RSA key pair if none exists
      if (this.keyPairs.size === 0) {
        await this.generateKeyPair('default_rsa', 'rsa-oaep', 2048);
      }

      await this.auditService.logEvent('default_keys_initialized', {
        encryption_keys: this.encryptionKeys.size,
        key_pairs: this.keyPairs.size,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to initialize default keys:', error);
    }
  }

  async startKeyRotationScheduler() {
    // Schedule key rotation checks every hour
    this.rotationTimer = setInterval(async () => {
      try {
        await this.checkKeyRotation();
      } catch (error) {
        console.error('Key rotation check error:', error);
      }
    }, 60 * 60 * 1000); // 1 hour

    // Perform initial check
    await this.checkKeyRotation();

    await this.auditService.logEvent('key_rotation_scheduler_started', {
      interval: '1 hour',
      timestamp: new Date().toISOString()
    });
  }

  async generateEncryptionKey(keyId, policyId) {
    try {
      const policy = this.encryptionPolicies.get(policyId);
      if (!policy) {
        throw new Error(`Encryption policy ${policyId} not found`);
      }

      const algorithm = this.encryptionAlgorithms.get(policy.algorithm.toLowerCase());
      if (!algorithm) {
        throw new Error(`Encryption algorithm ${policy.algorithm} not supported`);
      }

      // Generate random key
      const keyBytes = crypto.getRandomValues(new Uint8Array(algorithm.keyLength));
      const keyBase64 = btoa(String.fromCharCode(...keyBytes));

      const encryptionKey = {
        id: keyId,
        policyId: policyId,
        algorithm: policy.algorithm,
        keyLength: algorithm.keyLength,
        key: keyBase64,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + policy.keyRotationInterval).toISOString(),
        rotationCount: 0,
        usage: {
          encryptions: 0,
          decryptions: 0,
          lastUsed: null
        },
        status: 'active',
        backup: policy.backupRequired ? await this.createKeyBackup(keyBase64) : null
      };

      this.encryptionKeys.set(keyId, encryptionKey);
      await this.saveEncryptionKeys();

      await this.auditService.logEvent('encryption_key_generated', {
        key_id: keyId,
        policy_id: policyId,
        algorithm: policy.algorithm,
        key_length: algorithm.keyLength,
        expires_at: encryptionKey.expiresAt,
        timestamp: new Date().toISOString()
      });

      this.emit('keyGenerated', encryptionKey);
      return encryptionKey;
    } catch (error) {
      console.error('Failed to generate encryption key:', error);
      throw error;
    }
  }

  async generateKeyPair(keyId, algorithm, keyLength) {
    try {
      const algorithmConfig = this.encryptionAlgorithms.get(algorithm);
      if (!algorithmConfig) {
        throw new Error(`Algorithm ${algorithm} not supported`);
      }

      let keyPair;
      if (algorithm === 'rsa-oaep') {
        // Generate RSA key pair
        keyPair = await crypto.subtle.generateKey(
          {
            name: 'RSA-OAEP',
            modulusLength: keyLength,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256'
          },
          true,
          ['encrypt', 'decrypt']
        );
      } else if (algorithm === 'ecdh') {
        // Generate ECDH key pair
        keyPair = await crypto.subtle.generateKey(
          {
            name: 'ECDH',
            namedCurve: algorithmConfig.curve
          },
          true,
          ['deriveKey', 'deriveBits']
        );
      } else {
        throw new Error(`Key pair generation not implemented for ${algorithm}`);
      }

      // Export keys
      const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey);
      const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

      const keyPairData = {
        id: keyId,
        algorithm: algorithm,
        keyLength: keyLength,
        publicKey: btoa(String.fromCharCode(...new Uint8Array(publicKey))),
        privateKey: btoa(String.fromCharCode(...new Uint8Array(privateKey))),
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
        usage: {
          encryptions: 0,
          decryptions: 0,
          keyExchanges: 0,
          lastUsed: null
        },
        status: 'active'
      };

      this.keyPairs.set(keyId, keyPairData);
      await this.saveKeyPairs();

      await this.auditService.logEvent('key_pair_generated', {
        key_id: keyId,
        algorithm: algorithm,
        key_length: keyLength,
        expires_at: keyPairData.expiresAt,
        timestamp: new Date().toISOString()
      });

      this.emit('keyPairGenerated', keyPairData);
      return keyPairData;
    } catch (error) {
      console.error('Failed to generate key pair:', error);
      throw error;
    }
  }

  async encrypt(data, dataType = 'user_data', keyId = null) {
    try {
      const startTime = Date.now();
      
      // Get applicable policy
      const policy = this.getApplicablePolicy(dataType);
      if (!policy) {
        throw new Error(`No encryption policy found for data type: ${dataType}`);
      }

      // Get encryption key
      const encryptionKey = keyId ? 
        this.encryptionKeys.get(keyId) : 
        this.getKeyForPolicy(policy.id);

      if (!encryptionKey || encryptionKey.status !== 'active') {
        throw new Error('No active encryption key available');
      }

      // Check if key is expired
      if (new Date(encryptionKey.expiresAt) < new Date()) {
        throw new Error('Encryption key has expired');
      }

      const algorithm = this.encryptionAlgorithms.get(policy.algorithm.toLowerCase());
      if (!algorithm) {
        throw new Error(`Algorithm ${policy.algorithm} not supported`);
      }

      let inputData = data;
      
      // Compress data if enabled
      if (policy.compressionEnabled) {
        inputData = await this.compressData(data);
      }

      // Convert to bytes
      const encoder = new TextEncoder();
      const dataBytes = encoder.encode(typeof inputData === 'string' ? inputData : JSON.stringify(inputData));

      // Generate IV
      const iv = crypto.getRandomValues(new Uint8Array(algorithm.ivLength));

      // Import key
      const keyBytes = new Uint8Array(atob(encryptionKey.key).split('').map(c => c.charCodeAt(0)));
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );

      // Encrypt data
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        cryptoKey,
        dataBytes
      );

      // Create encrypted package
      const encryptedPackage = {
        algorithm: policy.algorithm,
        keyId: encryptionKey.id,
        iv: btoa(String.fromCharCode(...iv)),
        data: btoa(String.fromCharCode(...new Uint8Array(encryptedData))),
        compressed: policy.compressionEnabled,
        timestamp: new Date().toISOString(),
        integrity: null
      };

      // Add integrity check if enabled
      if (policy.integrityCheckEnabled) {
        encryptedPackage.integrity = await this.generateIntegrityHash(encryptedPackage);
      }

      // Update usage statistics
      encryptionKey.usage.encryptions++;
      encryptionKey.usage.lastUsed = new Date().toISOString();
      await this.saveEncryptionKeys();

      // Update metrics
      this.encryptionMetrics.totalEncryptions++;
      if (!this.encryptionMetrics.algorithmUsage[policy.algorithm]) {
        this.encryptionMetrics.algorithmUsage[policy.algorithm] = { encryptions: 0, decryptions: 0 };
      }
      this.encryptionMetrics.algorithmUsage[policy.algorithm].encryptions++;

      const duration = Date.now() - startTime;
      if (!this.encryptionMetrics.performanceMetrics[policy.algorithm]) {
        this.encryptionMetrics.performanceMetrics[policy.algorithm] = { 
          totalTime: 0, 
          operations: 0, 
          averageTime: 0 
        };
      }
      this.encryptionMetrics.performanceMetrics[policy.algorithm].totalTime += duration;
      this.encryptionMetrics.performanceMetrics[policy.algorithm].operations++;
      this.encryptionMetrics.performanceMetrics[policy.algorithm].averageTime = 
        this.encryptionMetrics.performanceMetrics[policy.algorithm].totalTime / 
        this.encryptionMetrics.performanceMetrics[policy.algorithm].operations;

      await this.saveEncryptionMetrics();

      await this.auditService.logEvent('data_encrypted', {
        data_type: dataType,
        key_id: encryptionKey.id,
        algorithm: policy.algorithm,
        compressed: policy.compressionEnabled,
        size: dataBytes.length,
        duration: duration,
        timestamp: new Date().toISOString()
      });

      this.emit('dataEncrypted', { dataType, keyId: encryptionKey.id, algorithm: policy.algorithm });
      return encryptedPackage;
    } catch (error) {
      console.error('Failed to encrypt data:', error);
      this.encryptionMetrics.encryptionErrors++;
      await this.saveEncryptionMetrics();
      throw error;
    }
  }

  async decrypt(encryptedPackage, expectedDataType = null) {
    try {
      const startTime = Date.now();

      // Validate package structure
      if (!encryptedPackage || !encryptedPackage.data || !encryptedPackage.keyId) {
        throw new Error('Invalid encrypted package');
      }

      // Get encryption key
      const encryptionKey = this.encryptionKeys.get(encryptedPackage.keyId);
      if (!encryptionKey) {
        throw new Error('Encryption key not found');
      }

      // Verify integrity if present
      if (encryptedPackage.integrity) {
        const isValid = await this.verifyIntegrityHash(encryptedPackage);
        if (!isValid) {
          throw new Error('Data integrity check failed');
        }
      }

      const algorithm = this.encryptionAlgorithms.get(encryptedPackage.algorithm.toLowerCase());
      if (!algorithm) {
        throw new Error(`Algorithm ${encryptedPackage.algorithm} not supported`);
      }

      // Import key
      const keyBytes = new Uint8Array(atob(encryptionKey.key).split('').map(c => c.charCodeAt(0)));
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );

      // Decrypt data
      const iv = new Uint8Array(atob(encryptedPackage.iv).split('').map(c => c.charCodeAt(0)));
      const encryptedData = new Uint8Array(atob(encryptedPackage.data).split('').map(c => c.charCodeAt(0)));

      const decryptedData = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        cryptoKey,
        encryptedData
      );

      // Convert to string
      const decoder = new TextDecoder();
      let result = decoder.decode(decryptedData);

      // Decompress if needed
      if (encryptedPackage.compressed) {
        result = await this.decompressData(result);
      }

      // Try to parse as JSON
      try {
        result = JSON.parse(result);
      } catch (e) {
        // Keep as string if not valid JSON
      }

      // Update usage statistics
      encryptionKey.usage.decryptions++;
      encryptionKey.usage.lastUsed = new Date().toISOString();
      await this.saveEncryptionKeys();

      // Update metrics
      this.encryptionMetrics.totalDecryptions++;
      if (!this.encryptionMetrics.algorithmUsage[encryptedPackage.algorithm]) {
        this.encryptionMetrics.algorithmUsage[encryptedPackage.algorithm] = { encryptions: 0, decryptions: 0 };
      }
      this.encryptionMetrics.algorithmUsage[encryptedPackage.algorithm].decryptions++;

      const duration = Date.now() - startTime;
      if (!this.encryptionMetrics.performanceMetrics[encryptedPackage.algorithm]) {
        this.encryptionMetrics.performanceMetrics[encryptedPackage.algorithm] = { 
          totalTime: 0, 
          operations: 0, 
          averageTime: 0 
        };
      }
      this.encryptionMetrics.performanceMetrics[encryptedPackage.algorithm].totalTime += duration;
      this.encryptionMetrics.performanceMetrics[encryptedPackage.algorithm].operations++;
      this.encryptionMetrics.performanceMetrics[encryptedPackage.algorithm].averageTime = 
        this.encryptionMetrics.performanceMetrics[encryptedPackage.algorithm].totalTime / 
        this.encryptionMetrics.performanceMetrics[encryptedPackage.algorithm].operations;

      await this.saveEncryptionMetrics();

      await this.auditService.logEvent('data_decrypted', {
        key_id: encryptionKey.id,
        algorithm: encryptedPackage.algorithm,
        compressed: encryptedPackage.compressed,
        duration: duration,
        timestamp: new Date().toISOString()
      });

      this.emit('dataDecrypted', { keyId: encryptionKey.id, algorithm: encryptedPackage.algorithm });
      return result;
    } catch (error) {
      console.error('Failed to decrypt data:', error);
      this.encryptionMetrics.encryptionErrors++;
      await this.saveEncryptionMetrics();
      throw error;
    }
  }

  async deriveKey(password, salt, iterations = null) {
    try {
      const config = this.keyDerivationConfig;
      const iterationCount = iterations || config.iterations;

      // Import password
      const encoder = new TextEncoder();
      const passwordKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );

      // Derive key
      const derivedKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: encoder.encode(salt),
          iterations: iterationCount,
          hash: config.hash
        },
        passwordKey,
        {
          name: 'AES-GCM',
          length: config.keyLength * 8
        },
        true,
        ['encrypt', 'decrypt']
      );

      // Export key
      const exportedKey = await crypto.subtle.exportKey('raw', derivedKey);
      const keyBase64 = btoa(String.fromCharCode(...new Uint8Array(exportedKey)));

      await this.auditService.logEvent('key_derived', {
        iterations: iterationCount,
        key_length: config.keyLength,
        algorithm: config.algorithm,
        timestamp: new Date().toISOString()
      });

      return keyBase64;
    } catch (error) {
      console.error('Failed to derive key:', error);
      throw error;
    }
  }

  async checkKeyRotation() {
    try {
      const now = new Date();
      const keysToRotate = [];

      // Check encryption keys
      for (const [keyId, keyData] of this.encryptionKeys) {
        if (keyData.status === 'active' && new Date(keyData.expiresAt) <= now) {
          keysToRotate.push({ type: 'encryption', id: keyId, data: keyData });
        }
      }

      // Check key pairs
      for (const [keyId, keyData] of this.keyPairs) {
        if (keyData.status === 'active' && new Date(keyData.expiresAt) <= now) {
          keysToRotate.push({ type: 'keypair', id: keyId, data: keyData });
        }
      }

      // Rotate expired keys
      for (const keyInfo of keysToRotate) {
        await this.rotateKey(keyInfo.type, keyInfo.id);
      }

      if (keysToRotate.length > 0) {
        await this.auditService.logEvent('key_rotation_check_completed', {
          keys_rotated: keysToRotate.length,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to check key rotation:', error);
    }
  }

  async rotateKey(keyType, keyId) {
    try {
      if (keyType === 'encryption') {
        const oldKey = this.encryptionKeys.get(keyId);
        if (!oldKey) {
          throw new Error(`Encryption key ${keyId} not found`);
        }

        // Generate new key
        const newKey = await this.generateEncryptionKey(keyId + '_new', oldKey.policyId);
        
        // Mark old key as rotated
        oldKey.status = 'rotated';
        oldKey.rotatedAt = new Date().toISOString();
        oldKey.rotatedTo = newKey.id;
        
        // Replace old key with new key
        this.encryptionKeys.set(keyId, newKey);
        this.encryptionKeys.set(keyId + '_old', oldKey);
        
        await this.saveEncryptionKeys();
        
        this.encryptionMetrics.keyRotations++;
        await this.saveEncryptionMetrics();

        await this.auditService.logEvent('encryption_key_rotated', {
          old_key_id: keyId,
          new_key_id: newKey.id,
          policy_id: oldKey.policyId,
          timestamp: new Date().toISOString()
        });

        this.emit('keyRotated', { type: 'encryption', oldKeyId: keyId, newKeyId: newKey.id });

      } else if (keyType === 'keypair') {
        const oldKeyPair = this.keyPairs.get(keyId);
        if (!oldKeyPair) {
          throw new Error(`Key pair ${keyId} not found`);
        }

        // Generate new key pair
        const newKeyPair = await this.generateKeyPair(keyId + '_new', oldKeyPair.algorithm, oldKeyPair.keyLength);
        
        // Mark old key pair as rotated
        oldKeyPair.status = 'rotated';
        oldKeyPair.rotatedAt = new Date().toISOString();
        oldKeyPair.rotatedTo = newKeyPair.id;
        
        // Replace old key pair with new key pair
        this.keyPairs.set(keyId, newKeyPair);
        this.keyPairs.set(keyId + '_old', oldKeyPair);
        
        await this.saveKeyPairs();

        await this.auditService.logEvent('key_pair_rotated', {
          old_key_id: keyId,
          new_key_id: newKeyPair.id,
          algorithm: oldKeyPair.algorithm,
          timestamp: new Date().toISOString()
        });

        this.emit('keyRotated', { type: 'keypair', oldKeyId: keyId, newKeyId: newKeyPair.id });
      }
    } catch (error) {
      console.error('Failed to rotate key:', error);
      throw error;
    }
  }

  async createKeyBackup(keyData) {
    try {
      // In a real implementation, this would store the backup in a secure location
      const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const backup = {
        id: backupId,
        data: keyData,
        createdAt: new Date().toISOString(),
        location: 'secure_backup_storage'
      };

      await this.auditService.logEvent('key_backup_created', {
        backup_id: backupId,
        timestamp: new Date().toISOString()
      });

      return backup;
    } catch (error) {
      console.error('Failed to create key backup:', error);
      throw error;
    }
  }

  async compressData(data) {
    try {
      // Simple compression simulation - in real implementation would use actual compression
      const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
      return jsonString; // Return as-is for now
    } catch (error) {
      console.error('Failed to compress data:', error);
      return data;
    }
  }

  async decompressData(data) {
    try {
      // Simple decompression simulation - in real implementation would use actual decompression
      return data; // Return as-is for now
    } catch (error) {
      console.error('Failed to decompress data:', error);
      return data;
    }
  }

  async generateIntegrityHash(encryptedPackage) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify({
        algorithm: encryptedPackage.algorithm,
        keyId: encryptedPackage.keyId,
        iv: encryptedPackage.iv,
        data: encryptedPackage.data,
        compressed: encryptedPackage.compressed,
        timestamp: encryptedPackage.timestamp
      }));

      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
    } catch (error) {
      console.error('Failed to generate integrity hash:', error);
      throw error;
    }
  }

  async verifyIntegrityHash(encryptedPackage) {
    try {
      const expectedHash = await this.generateIntegrityHash({
        algorithm: encryptedPackage.algorithm,
        keyId: encryptedPackage.keyId,
        iv: encryptedPackage.iv,
        data: encryptedPackage.data,
        compressed: encryptedPackage.compressed,
        timestamp: encryptedPackage.timestamp
      });

      return expectedHash === encryptedPackage.integrity;
    } catch (error) {
      console.error('Failed to verify integrity hash:', error);
      return false;
    }
  }

  getApplicablePolicy(dataType) {
    const policies = Array.from(this.encryptionPolicies.values())
      .filter(policy => policy.enabled && policy.dataTypes.includes(dataType));

    // Return most specific policy or default
    return policies.length > 0 ? policies[0] : this.encryptionPolicies.get('default_policy');
  }

  getKeyForPolicy(policyId) {
    const keys = Array.from(this.encryptionKeys.values())
      .filter(key => key.policyId === policyId && key.status === 'active');

    return keys.length > 0 ? keys[0] : null;
  }

  async saveEncryptionKeys() {
    try {
      const keyList = Array.from(this.encryptionKeys.values());
      await this.storageService.setItem('encryption_keys', keyList);
    } catch (error) {
      console.error('Failed to save encryption keys:', error);
    }
  }

  async saveKeyPairs() {
    try {
      const keyPairList = Array.from(this.keyPairs.values());
      await this.storageService.setItem('key_pairs', keyPairList);
    } catch (error) {
      console.error('Failed to save key pairs:', error);
    }
  }

  async saveEncryptionMetrics() {
    try {
      await this.storageService.setItem('encryption_metrics', this.encryptionMetrics);
    } catch (error) {
      console.error('Failed to save encryption metrics:', error);
    }
  }

  getEncryptionKeys() {
    return Array.from(this.encryptionKeys.values());
  }

  getKeyPairs() {
    return Array.from(this.keyPairs.values());
  }

  getEncryptionPolicies() {
    return Array.from(this.encryptionPolicies.values());
  }

  getEncryptionAlgorithms() {
    return Array.from(this.encryptionAlgorithms.values());
  }

  getEncryptionMetrics() {
    return this.encryptionMetrics;
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
      if (this.rotationTimer) {
        clearInterval(this.rotationTimer);
        this.rotationTimer = null;
      }

      this.listeners = [];
      this.encryptionKeys.clear();
      this.keyPairs.clear();
      this.encryptionPolicies.clear();
      this.encryptionAlgorithms.clear();
      this.certificates.clear();
      this.initialized = false;
      
      await this.auditService.logEvent('encryption_service_cleanup', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to cleanup EncryptionService:', error);
    }
  }
}

export { EncryptionService };