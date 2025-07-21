/**
 * Age Verification Service
 * Comprehensive age verification and restriction system for compliance
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import LoggingService from './LoggingService';
import LocalStorageService from './LocalStorageService';
import ConfigService from './ConfigService';
import AuditLogService from './AuditLogService';

class AgeVerificationService {
  constructor() {
    this.initialized = false;
    this.verificationRecords = new Map();
    this.restrictedUsers = new Set();
    this.pendingVerifications = new Map();
    
    // Age verification configuration
    this.config = {
      enableAgeVerification: true,
      minimumAge: 18,
      strictMode: true,
      requireDocumentVerification: false,
      allowSelfDeclaration: true,
      requireParentalConsent: false,
      parentalConsentAge: 13,
      verificationMethods: ['self_declaration', 'document_verification', 'third_party_verification'],
      defaultVerificationMethod: 'self_declaration',
      verificationExpiryDays: 365,
      maxVerificationAttempts: 3,
      blockDuration: 24 * 60 * 60 * 1000, // 24 hours
      enableAgeEstimation: false,
      enableBehavioralAnalysis: false,
      auditLogging: true,
      dataRetentionDays: 2555, // 7 years for legal compliance
    };
    
    // Age verification methods
    this.verificationMethods = {
      SELF_DECLARATION: {
        id: 'self_declaration',
        name: '自己申告',
        description: 'ユーザーが自分の年齢を申告',
        reliability: 'low',
        legal_acceptance: 'basic',
        required_data: ['birth_date'],
        verification_time: 'immediate',
        cost: 'free',
      },
      DOCUMENT_VERIFICATION: {
        id: 'document_verification',
        name: '身分証明書確認',
        description: '政府発行の身分証明書による確認',
        reliability: 'high',
        legal_acceptance: 'strong',
        required_data: ['document_type', 'document_number', 'document_image'],
        verification_time: '24-48 hours',
        cost: 'moderate',
      },
      THIRD_PARTY_VERIFICATION: {
        id: 'third_party_verification',
        name: '第三者認証',
        description: '外部の年齢認証サービスによる確認',
        reliability: 'high',
        legal_acceptance: 'strong',
        required_data: ['third_party_token'],
        verification_time: '1-5 minutes',
        cost: 'high',
      },
      CREDIT_CARD_VERIFICATION: {
        id: 'credit_card_verification',
        name: 'クレジットカード確認',
        description: 'クレジットカード保有による年齢推定',
        reliability: 'medium',
        legal_acceptance: 'moderate',
        required_data: ['card_number', 'expiry_date', 'cvv'],
        verification_time: '1-2 minutes',
        cost: 'low',
      },
      PARENTAL_CONSENT: {
        id: 'parental_consent',
        name: '保護者同意',
        description: '保護者による同意確認',
        reliability: 'medium',
        legal_acceptance: 'coppa_compliant',
        required_data: ['parent_email', 'parent_phone', 'consent_document'],
        verification_time: '24-72 hours',
        cost: 'moderate',
      },
    };
    
    // Document types for verification
    this.documentTypes = {
      DRIVERS_LICENSE: {
        id: 'drivers_license',
        name: '運転免許証',
        country: 'JP',
        reliability: 'high',
        age_verification: true,
        required_fields: ['license_number', 'issue_date', 'expiry_date'],
      },
      PASSPORT: {
        id: 'passport',
        name: 'パスポート',
        country: 'international',
        reliability: 'very_high',
        age_verification: true,
        required_fields: ['passport_number', 'issue_date', 'expiry_date'],
      },
      NATIONAL_ID: {
        id: 'national_id',
        name: 'マイナンバーカード',
        country: 'JP',
        reliability: 'very_high',
        age_verification: true,
        required_fields: ['card_number', 'issue_date'],
      },
      HEALTH_INSURANCE: {
        id: 'health_insurance',
        name: '健康保険証',
        country: 'JP',
        reliability: 'medium',
        age_verification: true,
        required_fields: ['insurance_number', 'issue_date'],
      },
      STUDENT_ID: {
        id: 'student_id',
        name: '学生証',
        country: 'JP',
        reliability: 'low',
        age_verification: false,
        required_fields: ['student_number', 'school_name', 'issue_date'],
      },
    };
    
    // Verification statuses
    this.verificationStatuses = {
      PENDING: 'pending',
      VERIFIED: 'verified',
      REJECTED: 'rejected',
      EXPIRED: 'expired',
      SUSPENDED: 'suspended',
      UNDER_REVIEW: 'under_review',
    };
    
    // Restriction levels
    this.restrictionLevels = {
      NONE: {
        level: 0,
        name: '制限なし',
        description: '年齢制限なし',
        allowed_features: 'all',
        blocked_features: [],
      },
      MINOR: {
        level: 1,
        name: '未成年者制限',
        description: '未成年者向けの制限',
        allowed_features: ['basic_browsing', 'favorites', 'reviews'],
        blocked_features: ['messaging', 'location_sharing', 'payment'],
      },
      STRICT: {
        level: 2,
        name: '厳格な制限',
        description: '厳格な年齢制限',
        allowed_features: ['basic_browsing'],
        blocked_features: ['messaging', 'location_sharing', 'payment', 'favorites', 'reviews'],
      },
      BLOCKED: {
        level: 3,
        name: '完全ブロック',
        description: '完全にブロック',
        allowed_features: [],
        blocked_features: 'all',
      },
    };
    
    // Age groups
    this.ageGroups = {
      CHILD: { min: 0, max: 12, restrictions: 'BLOCKED' },
      TEEN: { min: 13, max: 17, restrictions: 'STRICT' },
      YOUNG_ADULT: { min: 18, max: 20, restrictions: 'MINOR' },
      ADULT: { min: 21, max: 120, restrictions: 'NONE' },
    };
    
    // Legal frameworks
    this.legalFrameworks = {
      COPPA: {
        id: 'coppa',
        name: 'COPPA',
        description: '米国児童オンラインプライバシー保護法',
        age_threshold: 13,
        parental_consent_required: true,
        data_collection_restrictions: true,
      },
      GDPR_CHILD: {
        id: 'gdpr_child',
        name: 'GDPR（児童）',
        description: 'EU一般データ保護規則（児童規定）',
        age_threshold: 16,
        parental_consent_required: true,
        data_collection_restrictions: true,
      },
      JAPAN_APPI: {
        id: 'japan_appi',
        name: '日本個人情報保護法',
        description: '日本の個人情報保護法',
        age_threshold: 18,
        parental_consent_required: false,
        data_collection_restrictions: false,
      },
    };
    
    // Statistics
    this.stats = {
      totalVerifications: 0,
      successfulVerifications: 0,
      failedVerifications: 0,
      pendingVerifications: 0,
      restrictedUsers: 0,
      blockedUsers: 0,
      verificationsByMethod: {},
      verificationsByAge: {},
      averageVerificationTime: 0,
      complianceViolations: 0,
      parentalConsentRequests: 0,
    };
    
    // Event listeners
    this.listeners = new Set();
    this.cleanupTimer = null;
    this.monitoringTimer = null;
  }

  /**
   * Initialize age verification service
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Load configuration
      await this.loadVerificationConfig();
      
      // Load verification records
      await this.loadVerificationRecords();
      
      // Load restricted users
      await this.loadRestrictedUsers();
      
      // Setup monitoring
      this.setupMonitoring();
      
      // Setup cleanup
      this.setupCleanup();
      
      // Validate existing verifications
      await this.validateExistingVerifications();
      
      this.initialized = true;
      
      // Log service initialization
      await AuditLogService.logSystem({
        type: 'age_verification_initialized',
        message: 'Age verification service initialized',
        details: {
          minimumAge: this.config.minimumAge,
          strictMode: this.config.strictMode,
          verificationMethods: this.config.verificationMethods,
          totalRecords: this.verificationRecords.size,
        },
      });
      
      LoggingService.info('[AgeVerificationService] Initialized', {
        minimumAge: this.config.minimumAge,
        verificationMethods: this.config.verificationMethods.length,
        totalRecords: this.verificationRecords.size,
        restrictedUsers: this.restrictedUsers.size,
      });

    } catch (error) {
      LoggingService.error('[AgeVerificationService] Failed to initialize', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Verify user age
   */
  async verifyAge(verificationData) {
    try {
      const {
        userId,
        method = this.config.defaultVerificationMethod,
        birthDate,
        documentData,
        parentalConsent,
        force = false,
      } = verificationData;
      
      // Check if user is already verified
      const existingVerification = this.verificationRecords.get(userId);
      if (existingVerification && existingVerification.status === this.verificationStatuses.VERIFIED && !force) {
        return existingVerification;
      }
      
      // Check if user is temporarily blocked
      if (this.isUserBlocked(userId)) {
        throw new Error('User is temporarily blocked from age verification');
      }
      
      // Validate verification method
      if (!this.config.verificationMethods.includes(method)) {
        throw new Error(`Unsupported verification method: ${method}`);
      }
      
      const verificationRecord = {
        id: this.generateVerificationId(),
        userId,
        method,
        status: this.verificationStatuses.PENDING,
        requestedAt: new Date().toISOString(),
        birthDate,
        documentData: documentData ? this.sanitizeDocumentData(documentData) : null,
        parentalConsent: parentalConsent || null,
        attempts: (existingVerification?.attempts || 0) + 1,
        ipAddress: await this.getClientIP(),
        userAgent: Platform.OS,
        metadata: {
          strictMode: this.config.strictMode,
          minimumAge: this.config.minimumAge,
          legalFramework: this.determineLegalFramework(userId),
        },
      };
      
      // Perform age verification based on method
      const verificationResult = await this.performVerification(verificationRecord);
      
      // Update verification record
      verificationRecord.status = verificationResult.status;
      verificationRecord.verifiedAt = new Date().toISOString();
      verificationRecord.age = verificationResult.age;
      verificationRecord.ageGroup = this.determineAgeGroup(verificationResult.age);
      verificationRecord.restrictions = this.determineRestrictions(verificationResult.age);
      verificationRecord.expiresAt = new Date(Date.now() + this.config.verificationExpiryDays * 24 * 60 * 60 * 1000).toISOString();
      verificationRecord.verificationDetails = verificationResult.details;
      
      // Store verification record
      this.verificationRecords.set(userId, verificationRecord);
      
      // Apply restrictions if necessary
      if (verificationResult.age < this.config.minimumAge) {
        await this.applyAgeRestrictions(userId, verificationRecord);
      } else {
        await this.removeAgeRestrictions(userId);
      }
      
      // Update statistics
      this.updateStatistics(verificationRecord);
      
      // Save records
      await this.saveVerificationRecords();
      
      // Log verification
      await AuditLogService.logCompliance({
        type: 'age_verification_completed',
        message: 'Age verification completed',
        details: {
          userId,
          method,
          status: verificationRecord.status,
          age: verificationRecord.age,
          ageGroup: verificationRecord.ageGroup,
          restrictions: verificationRecord.restrictions,
          attempts: verificationRecord.attempts,
        },
        framework: verificationRecord.metadata.legalFramework,
      });
      
      LoggingService.info('[AgeVerificationService] Age verification completed', {
        userId,
        method,
        status: verificationRecord.status,
        age: verificationRecord.age,
        ageGroup: verificationRecord.ageGroup,
      });
      
      // Notify listeners
      this.notifyListeners('age_verified', verificationRecord);
      
      return verificationRecord;

    } catch (error) {
      // Log failed verification
      await AuditLogService.logSecurity({
        type: 'age_verification_failed',
        message: 'Age verification failed',
        details: {
          userId: verificationData.userId,
          method: verificationData.method,
          error: error.message,
        },
        severity: 'medium',
      });
      
      LoggingService.error('[AgeVerificationService] Age verification failed', {
        userId: verificationData.userId,
        method: verificationData.method,
        error: error.message,
      });
      
      throw error;
    }
  }

  /**
   * Perform verification based on method
   */
  async performVerification(verificationRecord) {
    const method = this.verificationMethods[verificationRecord.method.toUpperCase()];
    if (!method) {
      throw new Error(`Unknown verification method: ${verificationRecord.method}`);
    }
    
    switch (verificationRecord.method) {
      case 'self_declaration':
        return await this.performSelfDeclaration(verificationRecord);
      
      case 'document_verification':
        return await this.performDocumentVerification(verificationRecord);
      
      case 'third_party_verification':
        return await this.performThirdPartyVerification(verificationRecord);
      
      case 'credit_card_verification':
        return await this.performCreditCardVerification(verificationRecord);
      
      case 'parental_consent':
        return await this.performParentalConsent(verificationRecord);
      
      default:
        throw new Error(`Unsupported verification method: ${verificationRecord.method}`);
    }
  }

  /**
   * Perform self declaration verification
   */
  async performSelfDeclaration(verificationRecord) {
    if (!verificationRecord.birthDate) {
      throw new Error('Birth date is required for self declaration');
    }
    
    const age = this.calculateAge(verificationRecord.birthDate);
    
    // Basic validation
    if (age < 0 || age > 120) {
      throw new Error('Invalid age provided');
    }
    
    // Check for suspicious patterns
    if (this.config.strictMode) {
      const suspiciousPatterns = this.detectSuspiciousPatterns(verificationRecord);
      if (suspiciousPatterns.length > 0) {
        return {
          status: this.verificationStatuses.UNDER_REVIEW,
          age,
          details: {
            suspiciousPatterns,
            requiresManualReview: true,
          },
        };
      }
    }
    
    return {
      status: this.verificationStatuses.VERIFIED,
      age,
      details: {
        method: 'self_declaration',
        reliability: 'low',
        birthDate: verificationRecord.birthDate,
      },
    };
  }

  /**
   * Perform document verification
   */
  async performDocumentVerification(verificationRecord) {
    if (!verificationRecord.documentData) {
      throw new Error('Document data is required for document verification');
    }
    
    const documentType = this.documentTypes[verificationRecord.documentData.type?.toUpperCase()];
    if (!documentType) {
      throw new Error(`Unsupported document type: ${verificationRecord.documentData.type}`);
    }
    
    // Validate required fields
    const missingFields = documentType.required_fields.filter(field => 
      !verificationRecord.documentData[field]
    );
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    // For now, simulate document verification
    // In production, this would integrate with document verification services
    const age = this.calculateAge(verificationRecord.birthDate);
    
    return {
      status: this.verificationStatuses.VERIFIED,
      age,
      details: {
        method: 'document_verification',
        reliability: documentType.reliability,
        documentType: verificationRecord.documentData.type,
        verified: true,
      },
    };
  }

  /**
   * Perform third-party verification
   */
  async performThirdPartyVerification(verificationRecord) {
    // This would integrate with third-party age verification services
    // For now, simulate the verification
    
    const age = this.calculateAge(verificationRecord.birthDate);
    
    return {
      status: this.verificationStatuses.VERIFIED,
      age,
      details: {
        method: 'third_party_verification',
        reliability: 'high',
        provider: 'simulated_provider',
        verified: true,
      },
    };
  }

  /**
   * Perform credit card verification
   */
  async performCreditCardVerification(verificationRecord) {
    // This would integrate with payment processors for age verification
    // For now, simulate the verification
    
    const age = this.calculateAge(verificationRecord.birthDate);
    
    return {
      status: this.verificationStatuses.VERIFIED,
      age,
      details: {
        method: 'credit_card_verification',
        reliability: 'medium',
        cardType: 'simulated',
        verified: true,
      },
    };
  }

  /**
   * Perform parental consent verification
   */
  async performParentalConsent(verificationRecord) {
    if (!verificationRecord.parentalConsent) {
      throw new Error('Parental consent data is required');
    }
    
    const age = this.calculateAge(verificationRecord.birthDate);
    
    // Check if parental consent is required
    if (age >= this.config.parentalConsentAge) {
      throw new Error('Parental consent not required for this age');
    }
    
    // For now, mark as pending manual review
    return {
      status: this.verificationStatuses.UNDER_REVIEW,
      age,
      details: {
        method: 'parental_consent',
        reliability: 'medium',
        parentEmail: verificationRecord.parentalConsent.email,
        requiresManualReview: true,
      },
    };
  }

  /**
   * Check if user meets age requirements
   */
  async checkAgeRequirement(userId, requiredAge = null) {
    const minimumAge = requiredAge || this.config.minimumAge;
    const verificationRecord = this.verificationRecords.get(userId);
    
    if (!verificationRecord) {
      return {
        meets_requirement: false,
        reason: 'age_not_verified',
        required_age: minimumAge,
        user_age: null,
        verification_required: true,
      };
    }
    
    if (verificationRecord.status !== this.verificationStatuses.VERIFIED) {
      return {
        meets_requirement: false,
        reason: 'verification_pending',
        required_age: minimumAge,
        user_age: verificationRecord.age,
        verification_status: verificationRecord.status,
      };
    }
    
    if (this.isVerificationExpired(verificationRecord)) {
      return {
        meets_requirement: false,
        reason: 'verification_expired',
        required_age: minimumAge,
        user_age: verificationRecord.age,
        expired_at: verificationRecord.expiresAt,
        renewal_required: true,
      };
    }
    
    const meetsRequirement = verificationRecord.age >= minimumAge;
    
    return {
      meets_requirement: meetsRequirement,
      reason: meetsRequirement ? 'age_verified' : 'age_below_minimum',
      required_age: minimumAge,
      user_age: verificationRecord.age,
      age_group: verificationRecord.ageGroup,
      restrictions: verificationRecord.restrictions,
      verified_at: verificationRecord.verifiedAt,
    };
  }

  /**
   * Apply age restrictions
   */
  async applyAgeRestrictions(userId, verificationRecord) {
    const restrictions = this.restrictionLevels[verificationRecord.restrictions];
    
    // Add to restricted users
    this.restrictedUsers.add(userId);
    
    // Store restriction details
    const restrictionRecord = {
      userId,
      restrictionLevel: verificationRecord.restrictions,
      appliedAt: new Date().toISOString(),
      reason: 'age_below_minimum',
      allowedFeatures: restrictions.allowed_features,
      blockedFeatures: restrictions.blocked_features,
      age: verificationRecord.age,
      minimumAge: this.config.minimumAge,
    };
    
    await LocalStorageService.setItem(`age_restrictions_${userId}`, restrictionRecord);
    
    // Log restriction application
    await AuditLogService.logCompliance({
      type: 'age_restrictions_applied',
      message: 'Age restrictions applied to user',
      details: {
        userId,
        restrictionLevel: verificationRecord.restrictions,
        userAge: verificationRecord.age,
        minimumAge: this.config.minimumAge,
        allowedFeatures: restrictions.allowed_features,
        blockedFeatures: restrictions.blocked_features,
      },
      userId,
    });
    
    // Update statistics
    this.stats.restrictedUsers++;
    
    // Notify listeners
    this.notifyListeners('restrictions_applied', {
      userId,
      restrictions: restrictionRecord,
    });
    
    return restrictionRecord;
  }

  /**
   * Remove age restrictions
   */
  async removeAgeRestrictions(userId) {
    // Remove from restricted users
    this.restrictedUsers.delete(userId);
    
    // Remove restriction record
    await LocalStorageService.removeItem(`age_restrictions_${userId}`);
    
    // Log restriction removal
    await AuditLogService.logCompliance({
      type: 'age_restrictions_removed',
      message: 'Age restrictions removed from user',
      details: {
        userId,
        reason: 'age_verified',
      },
      userId,
    });
    
    // Update statistics
    this.stats.restrictedUsers = Math.max(0, this.stats.restrictedUsers - 1);
    
    // Notify listeners
    this.notifyListeners('restrictions_removed', {
      userId,
    });
  }

  /**
   * Check if feature is allowed for user
   */
  async isFeatureAllowed(userId, feature) {
    const ageCheck = await this.checkAgeRequirement(userId);
    
    if (ageCheck.meets_requirement) {
      return {
        allowed: true,
        reason: 'age_verified',
      };
    }
    
    // Check if user has restrictions
    const restrictionRecord = await LocalStorageService.getItem(`age_restrictions_${userId}`);
    if (!restrictionRecord) {
      return {
        allowed: false,
        reason: 'age_not_verified',
      };
    }
    
    const restrictions = this.restrictionLevels[restrictionRecord.restrictionLevel];
    
    // Check if feature is blocked
    if (restrictions.blocked_features === 'all' || 
        (Array.isArray(restrictions.blocked_features) && restrictions.blocked_features.includes(feature))) {
      return {
        allowed: false,
        reason: 'feature_blocked',
        restriction_level: restrictionRecord.restrictionLevel,
        user_age: restrictionRecord.age,
        minimum_age: restrictionRecord.minimumAge,
      };
    }
    
    // Check if feature is explicitly allowed
    if (restrictions.allowed_features === 'all' || 
        (Array.isArray(restrictions.allowed_features) && restrictions.allowed_features.includes(feature))) {
      return {
        allowed: true,
        reason: 'feature_allowed',
        restriction_level: restrictionRecord.restrictionLevel,
      };
    }
    
    // Default to blocked if not explicitly allowed
    return {
      allowed: false,
      reason: 'feature_not_allowed',
      restriction_level: restrictionRecord.restrictionLevel,
    };
  }

  /**
   * Get user age verification status
   */
  async getUserAgeStatus(userId) {
    const verificationRecord = this.verificationRecords.get(userId);
    
    if (!verificationRecord) {
      return {
        verified: false,
        status: 'not_verified',
        age: null,
        age_group: null,
        restrictions: null,
        verification_required: true,
      };
    }
    
    const isExpired = this.isVerificationExpired(verificationRecord);
    
    return {
      verified: verificationRecord.status === this.verificationStatuses.VERIFIED && !isExpired,
      status: isExpired ? 'expired' : verificationRecord.status,
      age: verificationRecord.age,
      age_group: verificationRecord.ageGroup,
      restrictions: verificationRecord.restrictions,
      verified_at: verificationRecord.verifiedAt,
      expires_at: verificationRecord.expiresAt,
      method: verificationRecord.method,
      attempts: verificationRecord.attempts,
      renewal_required: isExpired,
    };
  }

  /**
   * Request parental consent
   */
  async requestParentalConsent(consentData) {
    try {
      const {
        userId,
        childAge,
        parentEmail,
        parentPhone,
        parentName,
      } = consentData;
      
      const consentRequest = {
        id: this.generateConsentId(),
        userId,
        childAge,
        parentEmail,
        parentPhone,
        parentName,
        status: 'pending',
        requestedAt: new Date().toISOString(),
        consentToken: this.generateConsentToken(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      };
      
      // Store consent request
      await LocalStorageService.setItem(`parental_consent_${consentRequest.id}`, consentRequest);
      
      // Update statistics
      this.stats.parentalConsentRequests++;
      
      // Log consent request
      await AuditLogService.logCompliance({
        type: 'parental_consent_requested',
        message: 'Parental consent requested',
        details: {
          userId,
          childAge,
          parentEmail,
          consentId: consentRequest.id,
        },
        framework: 'coppa',
      });
      
      // Send consent request email (simulated)
      await this.sendConsentRequestEmail(consentRequest);
      
      return consentRequest;

    } catch (error) {
      LoggingService.error('[AgeVerificationService] Parental consent request failed', {
        error: error.message,
        userId: consentData.userId,
      });
      throw error;
    }
  }

  // Helper methods

  /**
   * Calculate age from birth date
   */
  calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Determine age group
   */
  determineAgeGroup(age) {
    for (const [groupName, group] of Object.entries(this.ageGroups)) {
      if (age >= group.min && age <= group.max) {
        return groupName.toLowerCase();
      }
    }
    return 'unknown';
  }

  /**
   * Determine restrictions based on age
   */
  determineRestrictions(age) {
    const ageGroup = this.determineAgeGroup(age);
    const group = this.ageGroups[ageGroup.toUpperCase()];
    return group ? group.restrictions : 'BLOCKED';
  }

  /**
   * Determine legal framework
   */
  determineLegalFramework(userId) {
    // This would determine the applicable legal framework based on user location
    // For now, default to Japanese law
    return 'japan_appi';
  }

  /**
   * Check if verification is expired
   */
  isVerificationExpired(verificationRecord) {
    return new Date() > new Date(verificationRecord.expiresAt);
  }

  /**
   * Check if user is temporarily blocked
   */
  isUserBlocked(userId) {
    const verificationRecord = this.verificationRecords.get(userId);
    if (!verificationRecord) return false;
    
    if (verificationRecord.attempts >= this.config.maxVerificationAttempts) {
      const lastAttempt = new Date(verificationRecord.verifiedAt || verificationRecord.requestedAt);
      const blockExpiry = new Date(lastAttempt.getTime() + this.config.blockDuration);
      return new Date() < blockExpiry;
    }
    
    return false;
  }

  /**
   * Detect suspicious patterns in verification
   */
  detectSuspiciousPatterns(verificationRecord) {
    const patterns = [];
    
    // Check for suspicious birth dates
    const birthDate = new Date(verificationRecord.birthDate);
    const today = new Date();
    
    // Check for future dates
    if (birthDate > today) {
      patterns.push('future_birth_date');
    }
    
    // Check for exact minimum age
    const age = this.calculateAge(verificationRecord.birthDate);
    if (age === this.config.minimumAge) {
      patterns.push('exact_minimum_age');
    }
    
    // Check for common fake dates
    const commonFakeDates = [
      '1990-01-01',
      '2000-01-01',
      '1980-01-01',
      '1985-01-01',
    ];
    
    if (commonFakeDates.includes(verificationRecord.birthDate)) {
      patterns.push('common_fake_date');
    }
    
    return patterns;
  }

  /**
   * Sanitize document data
   */
  sanitizeDocumentData(documentData) {
    const sanitized = { ...documentData };
    
    // Remove sensitive information
    if (sanitized.document_image) {
      sanitized.document_image = '[REDACTED]';
    }
    
    if (sanitized.document_number) {
      sanitized.document_number = sanitized.document_number.replace(/(.{4})/, '****');
    }
    
    return sanitized;
  }

  /**
   * Update statistics
   */
  updateStatistics(verificationRecord) {
    this.stats.totalVerifications++;
    
    if (verificationRecord.status === this.verificationStatuses.VERIFIED) {
      this.stats.successfulVerifications++;
    } else if (verificationRecord.status === this.verificationStatuses.REJECTED) {
      this.stats.failedVerifications++;
    } else {
      this.stats.pendingVerifications++;
    }
    
    // Method statistics
    if (!this.stats.verificationsByMethod[verificationRecord.method]) {
      this.stats.verificationsByMethod[verificationRecord.method] = 0;
    }
    this.stats.verificationsByMethod[verificationRecord.method]++;
    
    // Age statistics
    if (verificationRecord.age) {
      const ageGroup = this.determineAgeGroup(verificationRecord.age);
      if (!this.stats.verificationsByAge[ageGroup]) {
        this.stats.verificationsByAge[ageGroup] = 0;
      }
      this.stats.verificationsByAge[ageGroup]++;
    }
  }

  /**
   * Setup monitoring
   */
  setupMonitoring() {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
    }
    
    this.monitoringTimer = setInterval(async () => {
      try {
        await this.monitorAgeCompliance();
      } catch (error) {
        LoggingService.error('[AgeVerificationService] Monitoring failed', {
          error: error.message,
        });
      }
    }, 60 * 60 * 1000); // Check every hour
  }

  /**
   * Monitor age compliance
   */
  async monitorAgeCompliance() {
    const violations = [];
    
    // Check for expired verifications
    for (const [userId, record] of this.verificationRecords.entries()) {
      if (this.isVerificationExpired(record)) {
        violations.push({
          type: 'expired_verification',
          userId,
          expiredAt: record.expiresAt,
        });
      }
    }
    
    // Check for users without proper restrictions
    for (const [userId, record] of this.verificationRecords.entries()) {
      if (record.age < this.config.minimumAge && !this.restrictedUsers.has(userId)) {
        violations.push({
          type: 'missing_restrictions',
          userId,
          age: record.age,
        });
      }
    }
    
    if (violations.length > 0) {
      await AuditLogService.logCompliance({
        type: 'age_compliance_violations',
        message: 'Age compliance violations detected',
        details: {
          violations,
          count: violations.length,
        },
        violation: 'age_compliance',
      });
      
      this.stats.complianceViolations += violations.length;
    }
  }

  /**
   * Setup cleanup
   */
  setupCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = setInterval(async () => {
      try {
        await this.cleanupExpiredRecords();
      } catch (error) {
        LoggingService.error('[AgeVerificationService] Cleanup failed', {
          error: error.message,
        });
      }
    }, 24 * 60 * 60 * 1000); // Check daily
  }

  /**
   * Cleanup expired records
   */
  async cleanupExpiredRecords() {
    const now = new Date();
    let cleanedCount = 0;
    
    // Clean up expired verification records
    for (const [userId, record] of this.verificationRecords.entries()) {
      const retentionExpiry = new Date(record.requestedAt);
      retentionExpiry.setDate(retentionExpiry.getDate() + this.config.dataRetentionDays);
      
      if (now > retentionExpiry) {
        this.verificationRecords.delete(userId);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      await this.saveVerificationRecords();
      
      LoggingService.info('[AgeVerificationService] Cleaned up expired records', {
        cleanedCount,
      });
    }
  }

  /**
   * Validate existing verifications
   */
  async validateExistingVerifications() {
    let validatedCount = 0;
    let expiredCount = 0;
    
    for (const [userId, record] of this.verificationRecords.entries()) {
      if (this.isVerificationExpired(record)) {
        expiredCount++;
        
        // Update record status
        record.status = this.verificationStatuses.EXPIRED;
        
        // Apply restrictions if user is below minimum age
        if (record.age < this.config.minimumAge) {
          await this.applyAgeRestrictions(userId, record);
        }
      } else {
        validatedCount++;
      }
    }
    
    LoggingService.info('[AgeVerificationService] Validated existing verifications', {
      validatedCount,
      expiredCount,
    });
  }

  /**
   * Send consent request email (simulated)
   */
  async sendConsentRequestEmail(consentRequest) {
    // This would integrate with email service
    LoggingService.info('[AgeVerificationService] Parental consent email sent', {
      consentId: consentRequest.id,
      parentEmail: consentRequest.parentEmail,
    });
  }

  // Storage methods

  /**
   * Load verification configuration
   */
  async loadVerificationConfig() {
    try {
      const savedConfig = await LocalStorageService.getItem('age_verification_config');
      if (savedConfig) {
        this.config = { ...this.config, ...savedConfig };
      }
    } catch (error) {
      LoggingService.warn('[AgeVerificationService] Failed to load config', {
        error: error.message,
      });
    }
  }

  /**
   * Load verification records
   */
  async loadVerificationRecords() {
    try {
      const records = await LocalStorageService.getItem('age_verification_records') || [];
      records.forEach(record => {
        this.verificationRecords.set(record.userId, record);
      });
    } catch (error) {
      LoggingService.warn('[AgeVerificationService] Failed to load records', {
        error: error.message,
      });
    }
  }

  /**
   * Save verification records
   */
  async saveVerificationRecords() {
    try {
      const records = Array.from(this.verificationRecords.values());
      await LocalStorageService.setItem('age_verification_records', records);
    } catch (error) {
      LoggingService.error('[AgeVerificationService] Failed to save records', {
        error: error.message,
      });
    }
  }

  /**
   * Load restricted users
   */
  async loadRestrictedUsers() {
    try {
      const users = await LocalStorageService.getItem('age_restricted_users') || [];
      users.forEach(userId => {
        this.restrictedUsers.add(userId);
      });
    } catch (error) {
      LoggingService.warn('[AgeVerificationService] Failed to load restricted users', {
        error: error.message,
      });
    }
  }

  // Utility methods

  /**
   * Generate verification ID
   */
  generateVerificationId() {
    return `age_verification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate consent ID
   */
  generateConsentId() {
    return `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate consent token
   */
  generateConsentToken() {
    return `token_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
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
      totalRecords: this.verificationRecords.size,
      activeRestrictions: this.restrictedUsers.size,
      pendingRecords: this.pendingVerifications.size,
      initialized: this.initialized,
    };
  }

  /**
   * Get available verification methods
   */
  getAvailableVerificationMethods() {
    return this.config.verificationMethods.map(methodId => ({
      id: methodId,
      ...this.verificationMethods[methodId.toUpperCase()],
    }));
  }

  /**
   * Get age requirements
   */
  getAgeRequirements() {
    return {
      minimumAge: this.config.minimumAge,
      parentalConsentAge: this.config.parentalConsentAge,
      strictMode: this.config.strictMode,
      ageGroups: this.ageGroups,
      restrictionLevels: this.restrictionLevels,
      legalFrameworks: this.legalFrameworks,
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
        LoggingService.error('[AgeVerificationService] Listener error', {
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
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
    
    this.listeners.clear();
    this.verificationRecords.clear();
    this.restrictedUsers.clear();
    this.pendingVerifications.clear();
    this.initialized = false;
  }
}

// Create singleton instance
const ageVerificationService = new AgeVerificationService();

export default ageVerificationService;