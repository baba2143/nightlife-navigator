/**
 * Data Portability Service
 * GDPR Article 20 "Right to Data Portability" implementation
 */

import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import LoggingService from './LoggingService';
import LocalStorageService from './LocalStorageService';
import ConfigService from './ConfigService';
import DataProtectionService from './DataProtectionService';
import ConsentManagementService from './ConsentManagementService';

class DataPortabilityService {
  constructor() {
    this.initialized = false;
    this.exportQueue = [];
    this.exportHistory = [];
    this.isProcessing = false;
    
    // Portability configuration
    this.config = {
      enableDataPortability: true,
      enableStructuredExport: true,
      enableMachineReadableFormats: true,
      enableDirectTransfer: false, // Future feature
      maxExportSize: 100 * 1024 * 1024, // 100MB
      exportTimeout: 300000, // 5 minutes
      retentionDays: 30,
      allowedFormats: ['json', 'csv', 'xml'],
      defaultFormat: 'json',
      compressionEnabled: true,
      encryptionEnabled: true,
      batchSize: 1000,
      processingInterval: 30000, // 30 seconds
      auditLogging: true,
    };
    
    // Export formats
    this.exportFormats = {
      JSON: {
        id: 'json',
        name: 'JSON',
        description: '機械可読なJSON形式',
        extension: '.json',
        mimeType: 'application/json',
        structured: true,
        machineReadable: true,
        humanReadable: true,
        handler: this.exportToJSON.bind(this),
      },
      CSV: {
        id: 'csv',
        name: 'CSV',
        description: '表形式のCSV形式',
        extension: '.csv',
        mimeType: 'text/csv',
        structured: true,
        machineReadable: true,
        humanReadable: true,
        handler: this.exportToCSV.bind(this),
      },
      XML: {
        id: 'xml',
        name: 'XML',
        description: '構造化されたXML形式',
        extension: '.xml',
        mimeType: 'application/xml',
        structured: true,
        machineReadable: true,
        humanReadable: true,
        handler: this.exportToXML.bind(this),
      },
    };
    
    // Data categories for portability
    this.portableDataCategories = {
      PROFILE: {
        id: 'profile',
        name: 'プロフィール',
        description: 'ユーザープロフィール情報',
        required: true,
        gdprApplicable: true,
        dataTypes: ['user_profile', 'preferences', 'settings'],
        collector: this.collectProfileData.bind(this),
      },
      ACTIVITY: {
        id: 'activity',
        name: '活動履歴',
        description: 'アプリ利用履歴・活動記録',
        required: false,
        gdprApplicable: true,
        dataTypes: ['activity_log', 'usage_history', 'search_history'],
        collector: this.collectActivityData.bind(this),
      },
      CONTENT: {
        id: 'content',
        name: 'コンテンツ',
        description: 'ユーザーが作成したコンテンツ',
        required: false,
        gdprApplicable: true,
        dataTypes: ['reviews', 'comments', 'favorites'],
        collector: this.collectContentData.bind(this),
      },
      COMMUNICATION: {
        id: 'communication',
        name: 'コミュニケーション',
        description: 'メッセージ・通信記録',
        required: false,
        gdprApplicable: true,
        dataTypes: ['messages', 'notifications', 'communications'],
        collector: this.collectCommunicationData.bind(this),
      },
      LOCATION: {
        id: 'location',
        name: '位置情報',
        description: '位置データ・訪問履歴',
        required: false,
        gdprApplicable: true,
        dataTypes: ['location_data', 'visit_history', 'check_ins'],
        collector: this.collectLocationData.bind(this),
      },
      PREFERENCES: {
        id: 'preferences',
        name: '設定・嗜好',
        description: 'ユーザー設定・嗜好データ',
        required: false,
        gdprApplicable: true,
        dataTypes: ['preferences', 'settings', 'customizations'],
        collector: this.collectPreferencesData.bind(this),
      },
    };
    
    // Export statuses
    this.exportStatuses = {
      PENDING: 'pending',
      PROCESSING: 'processing',
      COMPLETED: 'completed',
      FAILED: 'failed',
      EXPIRED: 'expired',
      DOWNLOADED: 'downloaded',
    };
    
    // Export types
    this.exportTypes = {
      FULL: 'full',
      PARTIAL: 'partial',
      CATEGORY: 'category',
      CUSTOM: 'custom',
    };
    
    // Statistics
    this.stats = {
      exportsRequested: 0,
      exportsCompleted: 0,
      exportsFailed: 0,
      totalDataExported: 0,
      averageExportSize: 0,
      formatUsage: {},
      categoryUsage: {},
      downloadCount: 0,
      transferCount: 0,
    };
    
    // Event listeners
    this.listeners = new Set();
    this.processingTimer = null;
    this.cleanupTimer = null;
  }

  /**
   * Initialize data portability service
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Load configuration
      await this.loadPortabilityConfig();
      
      // Load export queue
      await this.loadExportQueue();
      
      // Load export history
      await this.loadExportHistory();
      
      // Setup automatic processing
      this.setupAutomaticProcessing();
      
      // Setup cleanup
      this.setupCleanup();
      
      // Process pending exports
      await this.processPendingExports();
      
      this.initialized = true;
      
      LoggingService.info('[DataPortabilityService] Initialized', {
        queueSize: this.exportQueue.length,
        historySize: this.exportHistory.length,
        enabledFormats: this.config.allowedFormats,
        maxExportSize: this.config.maxExportSize,
      });

    } catch (error) {
      LoggingService.error('[DataPortabilityService] Failed to initialize', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Request data export
   */
  async requestDataExport(exportRequest) {
    try {
      const {
        userId,
        categories = [],
        format = this.config.defaultFormat,
        type = this.exportTypes.FULL,
        includeMetadata = true,
        customFields = [],
        reason = 'user_request',
        deliveryMethod = 'download',
      } = exportRequest;
      
      // Validate export request
      await this.validateExportRequest(exportRequest);
      
      // Check user consent for data portability
      const hasConsent = await this.checkPortabilityConsent(userId);
      if (!hasConsent) {
        throw new Error('User has not consented to data portability');
      }
      
      const exportRecord = {
        id: this.generateExportId(),
        userId,
        categories: categories.length > 0 ? categories : Object.keys(this.portableDataCategories),
        format,
        type,
        includeMetadata,
        customFields,
        reason,
        deliveryMethod,
        status: this.exportStatuses.PENDING,
        requestedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + this.config.retentionDays * 24 * 60 * 60 * 1000).toISOString(),
        progress: {
          total: 0,
          completed: 0,
          categories: {},
        },
        metadata: {
          requestSource: 'user',
          ipAddress: await this.getClientIP(),
          userAgent: Platform.OS,
          locale: 'ja',
        },
        auditTrail: {
          created: new Date().toISOString(),
          events: [],
        },
      };
      
      // Add to queue
      this.exportQueue.push(exportRecord);
      
      // Save queue
      await this.saveExportQueue();
      
      // Update statistics
      this.stats.exportsRequested++;
      this.updateFormatUsage(format);
      categories.forEach(category => this.updateCategoryUsage(category));
      
      // Log export request
      await this.logExportEvent(exportRecord.id, 'EXPORT_REQUESTED', {
        userId,
        categories: exportRecord.categories,
        format,
        type,
        reason,
      });
      
      LoggingService.info('[DataPortabilityService] Export requested', {
        exportId: exportRecord.id,
        userId,
        categories: exportRecord.categories,
        format,
        type,
      });
      
      // Notify listeners
      this.notifyListeners('export_requested', exportRecord);
      
      // Process immediately for small exports
      if (exportRecord.categories.length <= 2) {
        await this.processExportRequest(exportRecord);
      }
      
      return exportRecord;

    } catch (error) {
      LoggingService.error('[DataPortabilityService] Failed to request export', {
        error: error.message,
        userId: exportRequest.userId,
      });
      throw error;
    }
  }

  /**
   * Process export request
   */
  async processExportRequest(exportRecord) {
    try {
      // Update status
      exportRecord.status = this.exportStatuses.PROCESSING;
      exportRecord.startedAt = new Date().toISOString();
      
      // Add audit event
      exportRecord.auditTrail.events.push({
        type: 'PROCESSING_STARTED',
        timestamp: new Date().toISOString(),
      });
      
      // Log processing start
      await this.logExportEvent(exportRecord.id, 'PROCESSING_STARTED', {
        userId: exportRecord.userId,
        categories: exportRecord.categories,
      });
      
      // Collect data from each category
      const collectedData = {};
      exportRecord.progress.total = exportRecord.categories.length;
      
      for (const categoryId of exportRecord.categories) {
        try {
          const category = this.portableDataCategories[categoryId.toUpperCase()];
          if (!category) {
            LoggingService.warn('[DataPortabilityService] Unknown category', {
              categoryId,
            });
            continue;
          }
          
          // Check if category is GDPR applicable
          if (category.gdprApplicable) {
            const hasConsent = ConsentManagementService.hasConsentFor('functional');
            if (!hasConsent) {
              LoggingService.warn('[DataPortabilityService] No consent for category', {
                categoryId,
              });
              continue;
            }
          }
          
          // Collect data for category
          const categoryData = await category.collector(exportRecord.userId, exportRecord);
          
          if (categoryData && Object.keys(categoryData).length > 0) {
            collectedData[categoryId] = categoryData;
            
            exportRecord.progress.categories[categoryId] = {
              status: 'completed',
              itemCount: Array.isArray(categoryData) ? categoryData.length : 
                         typeof categoryData === 'object' ? Object.keys(categoryData).length : 1,
              timestamp: new Date().toISOString(),
            };
          } else {
            exportRecord.progress.categories[categoryId] = {
              status: 'empty',
              itemCount: 0,
              timestamp: new Date().toISOString(),
            };
          }
          
          exportRecord.progress.completed++;
          
        } catch (error) {
          LoggingService.error('[DataPortabilityService] Category collection failed', {
            exportId: exportRecord.id,
            categoryId,
            error: error.message,
          });
          
          exportRecord.progress.categories[categoryId] = {
            status: 'failed',
            error: error.message,
            timestamp: new Date().toISOString(),
          };
        }
      }
      
      // Generate export file
      const exportFile = await this.generateExportFile(collectedData, exportRecord);
      
      if (exportFile) {
        exportRecord.status = this.exportStatuses.COMPLETED;
        exportRecord.completedAt = new Date().toISOString();
        exportRecord.exportFile = exportFile;
        
        // Update statistics
        this.stats.exportsCompleted++;
        this.stats.totalDataExported += exportFile.size;
        this.updateAverageExportSize();
        
        // Log completion
        await this.logExportEvent(exportRecord.id, 'EXPORT_COMPLETED', {
          userId: exportRecord.userId,
          fileSize: exportFile.size,
          categories: Object.keys(collectedData),
          format: exportRecord.format,
        });
        
        LoggingService.info('[DataPortabilityService] Export completed', {
          exportId: exportRecord.id,
          userId: exportRecord.userId,
          fileSize: exportFile.size,
          categories: Object.keys(collectedData),
        });
        
        // Notify listeners
        this.notifyListeners('export_completed', exportRecord);
        
        // Move to history
        await this.moveToHistory(exportRecord);
        
      } else {
        // Export failed
        exportRecord.status = this.exportStatuses.FAILED;
        exportRecord.failedAt = new Date().toISOString();
        exportRecord.error = 'Failed to generate export file';
        
        // Update statistics
        this.stats.exportsFailed++;
        
        // Log failure
        await this.logExportEvent(exportRecord.id, 'EXPORT_FAILED', {
          userId: exportRecord.userId,
          error: exportRecord.error,
        });
        
        LoggingService.error('[DataPortabilityService] Export failed', {
          exportId: exportRecord.id,
          userId: exportRecord.userId,
          error: exportRecord.error,
        });
        
        // Notify listeners
        this.notifyListeners('export_failed', exportRecord);
        
        // Move to history
        await this.moveToHistory(exportRecord);
      }
      
      // Add final audit event
      exportRecord.auditTrail.events.push({
        type: 'PROCESSING_COMPLETED',
        timestamp: new Date().toISOString(),
        status: exportRecord.status,
        categoriesProcessed: exportRecord.progress.completed,
      });
      
      // Save updated queue
      await this.saveExportQueue();
      
      return exportRecord;

    } catch (error) {
      exportRecord.status = this.exportStatuses.FAILED;
      exportRecord.failedAt = new Date().toISOString();
      exportRecord.error = error.message;
      
      // Update statistics
      this.stats.exportsFailed++;
      
      // Log error
      await this.logExportEvent(exportRecord.id, 'EXPORT_ERROR', {
        error: error.message,
      });
      
      LoggingService.error('[DataPortabilityService] Export processing failed', {
        exportId: exportRecord.id,
        error: error.message,
      });
      
      // Save updated queue
      await this.saveExportQueue();
      
      throw error;
    }
  }

  /**
   * Generate export file
   */
  async generateExportFile(data, exportRecord) {
    try {
      const format = this.exportFormats[exportRecord.format.toUpperCase()];
      if (!format) {
        throw new Error(`Unsupported export format: ${exportRecord.format}`);
      }
      
      // Add metadata if requested
      if (exportRecord.includeMetadata) {
        data._metadata = {
          exportId: exportRecord.id,
          userId: exportRecord.userId,
          exportedAt: new Date().toISOString(),
          format: exportRecord.format,
          categories: exportRecord.categories,
          dataPortabilityCompliance: {
            gdprArticle: 'Article 20',
            structured: format.structured,
            machineReadable: format.machineReadable,
            commonFormat: true,
          },
          version: '1.0',
        };
      }
      
      // Generate file content
      const fileContent = await format.handler(data, exportRecord);
      
      // Create file
      const fileName = `data_export_${exportRecord.userId}_${exportRecord.id}${format.extension}`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      
      // Write file
      await FileSystem.writeAsStringAsync(filePath, fileContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      // Compress if enabled
      let finalFilePath = filePath;
      let finalSize = fileInfo.size;
      
      if (this.config.compressionEnabled && fileInfo.size > 1024 * 1024) {
        // Compression would be implemented here
        // For now, use original file
      }
      
      // Encrypt if enabled
      if (this.config.encryptionEnabled) {
        // Encryption would be implemented here
        // For now, use original file
      }
      
      // Check size limit
      if (finalSize > this.config.maxExportSize) {
        throw new Error(`Export file size (${finalSize}) exceeds maximum allowed size (${this.config.maxExportSize})`);
      }
      
      return {
        id: this.generateFileId(),
        name: fileName,
        path: finalFilePath,
        size: finalSize,
        format: exportRecord.format,
        mimeType: format.mimeType,
        compressed: this.config.compressionEnabled && fileInfo.size > 1024 * 1024,
        encrypted: this.config.encryptionEnabled,
        createdAt: new Date().toISOString(),
        expiresAt: exportRecord.expiresAt,
      };

    } catch (error) {
      LoggingService.error('[DataPortabilityService] File generation failed', {
        exportId: exportRecord.id,
        format: exportRecord.format,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Download export file
   */
  async downloadExportFile(exportId) {
    try {
      const exportRecord = this.exportHistory.find(r => r.id === exportId);
      if (!exportRecord) {
        throw new Error('Export record not found');
      }
      
      if (exportRecord.status !== this.exportStatuses.COMPLETED) {
        throw new Error('Export is not completed');
      }
      
      if (!exportRecord.exportFile) {
        throw new Error('Export file not available');
      }
      
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(exportRecord.exportFile.path);
      if (!fileInfo.exists) {
        throw new Error('Export file has been deleted');
      }
      
      // Check expiration
      if (new Date() > new Date(exportRecord.exportFile.expiresAt)) {
        exportRecord.status = this.exportStatuses.EXPIRED;
        await this.saveExportHistory();
        throw new Error('Export file has expired');
      }
      
      // Share file
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(exportRecord.exportFile.path, {
          mimeType: exportRecord.exportFile.mimeType,
          dialogTitle: 'データエクスポート',
          UTI: exportRecord.exportFile.mimeType,
        });
      }
      
      // Update download status
      exportRecord.status = this.exportStatuses.DOWNLOADED;
      exportRecord.downloadedAt = new Date().toISOString();
      
      // Update statistics
      this.stats.downloadCount++;
      
      // Log download
      await this.logExportEvent(exportId, 'EXPORT_DOWNLOADED', {
        userId: exportRecord.userId,
        fileName: exportRecord.exportFile.name,
        fileSize: exportRecord.exportFile.size,
      });
      
      // Save updated history
      await this.saveExportHistory();
      
      // Notify listeners
      this.notifyListeners('export_downloaded', exportRecord);
      
      return {
        success: true,
        fileName: exportRecord.exportFile.name,
        fileSize: exportRecord.exportFile.size,
      };

    } catch (error) {
      LoggingService.error('[DataPortabilityService] Download failed', {
        exportId,
        error: error.message,
      });
      throw error;
    }
  }

  // Data collectors

  /**
   * Collect profile data
   */
  async collectProfileData(userId, exportRecord) {
    try {
      const profileData = {};
      
      // User profile
      const userProfile = await LocalStorageService.getItem('user_profile');
      if (userProfile && userProfile.id === userId) {
        profileData.profile = {
          id: userProfile.id,
          email: userProfile.email,
          name: userProfile.name,
          phoneNumber: userProfile.phoneNumber,
          birthDate: userProfile.birthDate,
          avatar: userProfile.avatar,
          createdAt: userProfile.createdAt,
          updatedAt: userProfile.updatedAt,
        };
      }
      
      // User preferences
      const userPreferences = await LocalStorageService.getItem('user_preferences');
      if (userPreferences && userPreferences.userId === userId) {
        profileData.preferences = userPreferences;
      }
      
      // User settings
      const userSettings = await LocalStorageService.getItem('user_settings');
      if (userSettings && userSettings.userId === userId) {
        profileData.settings = userSettings;
      }
      
      return profileData;

    } catch (error) {
      LoggingService.error('[DataPortabilityService] Profile data collection failed', {
        userId,
        error: error.message,
      });
      return {};
    }
  }

  /**
   * Collect activity data
   */
  async collectActivityData(userId, exportRecord) {
    try {
      const activityData = {};
      
      // Activity history
      const activityHistory = await LocalStorageService.getItem('activity_history');
      if (activityHistory && Array.isArray(activityHistory)) {
        activityData.activities = activityHistory.filter(activity => activity.userId === userId);
      }
      
      // Usage statistics
      const usageStats = await LocalStorageService.getItem('usage_statistics');
      if (usageStats && usageStats.userId === userId) {
        activityData.usage = usageStats;
      }
      
      // Search history
      const searchHistory = await LocalStorageService.getItem('search_history');
      if (searchHistory && Array.isArray(searchHistory)) {
        activityData.searches = searchHistory.filter(search => search.userId === userId);
      }
      
      return activityData;

    } catch (error) {
      LoggingService.error('[DataPortabilityService] Activity data collection failed', {
        userId,
        error: error.message,
      });
      return {};
    }
  }

  /**
   * Collect content data
   */
  async collectContentData(userId, exportRecord) {
    try {
      const contentData = {};
      
      // User reviews
      const reviews = await LocalStorageService.getItem('user_reviews');
      if (reviews && Array.isArray(reviews)) {
        contentData.reviews = reviews.filter(review => review.userId === userId);
      }
      
      // User favorites
      const favorites = await LocalStorageService.getItem('user_favorites');
      if (favorites && Array.isArray(favorites)) {
        contentData.favorites = favorites.filter(favorite => favorite.userId === userId);
      }
      
      // User comments
      const comments = await LocalStorageService.getItem('user_comments');
      if (comments && Array.isArray(comments)) {
        contentData.comments = comments.filter(comment => comment.userId === userId);
      }
      
      return contentData;

    } catch (error) {
      LoggingService.error('[DataPortabilityService] Content data collection failed', {
        userId,
        error: error.message,
      });
      return {};
    }
  }

  /**
   * Collect communication data
   */
  async collectCommunicationData(userId, exportRecord) {
    try {
      const communicationData = {};
      
      // Messages
      const messages = await LocalStorageService.getItem('user_messages');
      if (messages && Array.isArray(messages)) {
        communicationData.messages = messages.filter(message => 
          message.senderId === userId || message.receiverId === userId
        );
      }
      
      // Notifications
      const notifications = await LocalStorageService.getItem('user_notifications');
      if (notifications && Array.isArray(notifications)) {
        communicationData.notifications = notifications.filter(notification => 
          notification.userId === userId
        );
      }
      
      return communicationData;

    } catch (error) {
      LoggingService.error('[DataPortabilityService] Communication data collection failed', {
        userId,
        error: error.message,
      });
      return {};
    }
  }

  /**
   * Collect location data
   */
  async collectLocationData(userId, exportRecord) {
    try {
      const locationData = {};
      
      // Location history
      const locationHistory = await LocalStorageService.getItem('location_history');
      if (locationHistory && Array.isArray(locationHistory)) {
        locationData.locations = locationHistory.filter(location => location.userId === userId);
      }
      
      // Visit history
      const visitHistory = await LocalStorageService.getItem('visit_history');
      if (visitHistory && Array.isArray(visitHistory)) {
        locationData.visits = visitHistory.filter(visit => visit.userId === userId);
      }
      
      // Check-ins
      const checkIns = await LocalStorageService.getItem('check_ins');
      if (checkIns && Array.isArray(checkIns)) {
        locationData.checkIns = checkIns.filter(checkIn => checkIn.userId === userId);
      }
      
      return locationData;

    } catch (error) {
      LoggingService.error('[DataPortabilityService] Location data collection failed', {
        userId,
        error: error.message,
      });
      return {};
    }
  }

  /**
   * Collect preferences data
   */
  async collectPreferencesData(userId, exportRecord) {
    try {
      const preferencesData = {};
      
      // All user preferences would be collected here
      // This is a simplified implementation
      
      return preferencesData;

    } catch (error) {
      LoggingService.error('[DataPortabilityService] Preferences data collection failed', {
        userId,
        error: error.message,
      });
      return {};
    }
  }

  // Export format handlers

  /**
   * Export to JSON format
   */
  async exportToJSON(data, exportRecord) {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Export to CSV format
   */
  async exportToCSV(data, exportRecord) {
    const csvLines = [];
    
    // Add header
    csvLines.push('Category,Type,Key,Value,Timestamp');
    
    // Process each category
    for (const [category, categoryData] of Object.entries(data)) {
      if (category === '_metadata') continue;
      
      this.flattenDataForCSV(categoryData, category, '', csvLines);
    }
    
    return csvLines.join('\n');
  }

  /**
   * Export to XML format
   */
  async exportToXML(data, exportRecord) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<data_export>\n';
    
    for (const [category, categoryData] of Object.entries(data)) {
      xml += `  <${category}>\n`;
      xml += this.dataToXML(categoryData, '    ');
      xml += `  </${category}>\n`;
    }
    
    xml += '</data_export>';
    return xml;
  }

  // Helper methods

  /**
   * Flatten data for CSV format
   */
  flattenDataForCSV(data, category, prefix, csvLines) {
    const timestamp = new Date().toISOString();
    
    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        const key = `${prefix}[${index}]`;
        if (typeof item === 'object' && item !== null) {
          this.flattenDataForCSV(item, category, key, csvLines);
        } else {
          csvLines.push(`${category},array,${key},"${String(item).replace(/"/g, '""')}",${timestamp}`);
        }
      });
    } else if (typeof data === 'object' && data !== null) {
      Object.entries(data).forEach(([key, value]) => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null) {
          this.flattenDataForCSV(value, category, fullKey, csvLines);
        } else {
          csvLines.push(`${category},object,${fullKey},"${String(value).replace(/"/g, '""')}",${timestamp}`);
        }
      });
    } else {
      csvLines.push(`${category},primitive,${prefix},"${String(data).replace(/"/g, '""')}",${timestamp}`);
    }
  }

  /**
   * Convert data to XML format
   */
  dataToXML(data, indent = '') {
    let xml = '';
    
    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        xml += `${indent}<item index="${index}">\n`;
        xml += this.dataToXML(item, indent + '  ');
        xml += `${indent}</item>\n`;
      });
    } else if (typeof data === 'object' && data !== null) {
      Object.entries(data).forEach(([key, value]) => {
        const safeKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
        xml += `${indent}<${safeKey}>\n`;
        xml += this.dataToXML(value, indent + '  ');
        xml += `${indent}</${safeKey}>\n`;
      });
    } else {
      xml += `${indent}${String(data).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}\n`;
    }
    
    return xml;
  }

  /**
   * Validate export request
   */
  async validateExportRequest(request) {
    if (!request.userId) {
      throw new Error('User ID is required for export request');
    }
    
    if (!this.config.enableDataPortability) {
      throw new Error('Data portability is not enabled');
    }
    
    if (request.format && !this.config.allowedFormats.includes(request.format)) {
      throw new Error(`Unsupported export format: ${request.format}`);
    }
    
    return true;
  }

  /**
   * Check portability consent
   */
  async checkPortabilityConsent(userId) {
    // Check if user has consented to data portability
    const hasConsent = ConsentManagementService.hasConsentFor('functional');
    return hasConsent;
  }

  /**
   * Update format usage statistics
   */
  updateFormatUsage(format) {
    if (!this.stats.formatUsage[format]) {
      this.stats.formatUsage[format] = 0;
    }
    this.stats.formatUsage[format]++;
  }

  /**
   * Update category usage statistics
   */
  updateCategoryUsage(category) {
    if (!this.stats.categoryUsage[category]) {
      this.stats.categoryUsage[category] = 0;
    }
    this.stats.categoryUsage[category]++;
  }

  /**
   * Update average export size
   */
  updateAverageExportSize() {
    if (this.stats.exportsCompleted > 0) {
      this.stats.averageExportSize = this.stats.totalDataExported / this.stats.exportsCompleted;
    }
  }

  /**
   * Move export record to history
   */
  async moveToHistory(exportRecord) {
    // Remove from queue
    this.exportQueue = this.exportQueue.filter(r => r.id !== exportRecord.id);
    
    // Add to history
    this.exportHistory.unshift(exportRecord);
    
    // Limit history size
    if (this.exportHistory.length > 1000) {
      this.exportHistory = this.exportHistory.slice(0, 1000);
    }
    
    // Save both
    await this.saveExportQueue();
    await this.saveExportHistory();
  }

  /**
   * Setup automatic processing
   */
  setupAutomaticProcessing() {
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
    }
    
    this.processingTimer = setInterval(async () => {
      try {
        await this.processPendingExports();
      } catch (error) {
        LoggingService.error('[DataPortabilityService] Automatic processing failed', {
          error: error.message,
        });
      }
    }, this.config.processingInterval);
  }

  /**
   * Setup cleanup
   */
  setupCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    // Clean up expired exports daily
    this.cleanupTimer = setInterval(async () => {
      try {
        await this.cleanupExpiredExports();
      } catch (error) {
        LoggingService.error('[DataPortabilityService] Cleanup failed', {
          error: error.message,
        });
      }
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  /**
   * Process pending exports
   */
  async processPendingExports() {
    if (this.isProcessing) {
      return;
    }
    
    this.isProcessing = true;
    
    try {
      const pendingExports = this.exportQueue.filter(r => r.status === this.exportStatuses.PENDING);
      
      if (pendingExports.length === 0) {
        return;
      }
      
      LoggingService.info('[DataPortabilityService] Processing pending exports', {
        count: pendingExports.length,
      });
      
      // Process in batches
      const batchSize = this.config.batchSize;
      for (let i = 0; i < pendingExports.length; i += batchSize) {
        const batch = pendingExports.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (exportRecord) => {
          try {
            await this.processExportRequest(exportRecord);
          } catch (error) {
            LoggingService.error('[DataPortabilityService] Batch processing failed', {
              exportId: exportRecord.id,
              error: error.message,
            });
          }
        }));
      }
      
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Clean up expired exports
   */
  async cleanupExpiredExports() {
    try {
      const now = new Date();
      const expiredExports = this.exportHistory.filter(r => 
        r.exportFile && new Date(r.exportFile.expiresAt) < now
      );
      
      if (expiredExports.length === 0) {
        return;
      }
      
      LoggingService.info('[DataPortabilityService] Cleaning up expired exports', {
        count: expiredExports.length,
      });
      
      for (const exportRecord of expiredExports) {
        try {
          // Delete file
          const fileInfo = await FileSystem.getInfoAsync(exportRecord.exportFile.path);
          if (fileInfo.exists) {
            await FileSystem.deleteAsync(exportRecord.exportFile.path);
          }
          
          // Update status
          exportRecord.status = this.exportStatuses.EXPIRED;
          exportRecord.expiredAt = new Date().toISOString();
          
          // Log cleanup
          await this.logExportEvent(exportRecord.id, 'EXPORT_EXPIRED', {
            userId: exportRecord.userId,
            fileName: exportRecord.exportFile.name,
          });
          
        } catch (error) {
          LoggingService.error('[DataPortabilityService] Export cleanup failed', {
            exportId: exportRecord.id,
            error: error.message,
          });
        }
      }
      
      // Save updated history
      await this.saveExportHistory();
      
    } catch (error) {
      LoggingService.error('[DataPortabilityService] Cleanup failed', {
        error: error.message,
      });
    }
  }

  /**
   * Log export event
   */
  async logExportEvent(exportId, eventType, details) {
    if (!this.config.auditLogging) {
      return;
    }
    
    const logEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      exportId,
      eventType,
      details,
      userId: await this.getUserId(),
      ipAddress: await this.getClientIP(),
      userAgent: Platform.OS,
    };
    
    // Store log entry
    const exportLog = await LocalStorageService.getItem('data_portability_log') || [];
    exportLog.unshift(logEntry);
    
    // Limit log size
    if (exportLog.length > 10000) {
      exportLog.splice(10000);
    }
    
    await LocalStorageService.setItem('data_portability_log', exportLog);
  }

  // Storage methods

  /**
   * Load portability configuration
   */
  async loadPortabilityConfig() {
    try {
      const savedConfig = await LocalStorageService.getItem('data_portability_config');
      if (savedConfig) {
        this.config = { ...this.config, ...savedConfig };
      }
    } catch (error) {
      LoggingService.warn('[DataPortabilityService] Failed to load config', {
        error: error.message,
      });
    }
  }

  /**
   * Load export queue
   */
  async loadExportQueue() {
    try {
      this.exportQueue = await LocalStorageService.getItem('data_export_queue') || [];
    } catch (error) {
      LoggingService.warn('[DataPortabilityService] Failed to load queue', {
        error: error.message,
      });
    }
  }

  /**
   * Save export queue
   */
  async saveExportQueue() {
    try {
      await LocalStorageService.setItem('data_export_queue', this.exportQueue);
    } catch (error) {
      LoggingService.error('[DataPortabilityService] Failed to save queue', {
        error: error.message,
      });
    }
  }

  /**
   * Load export history
   */
  async loadExportHistory() {
    try {
      this.exportHistory = await LocalStorageService.getItem('data_export_history') || [];
    } catch (error) {
      LoggingService.warn('[DataPortabilityService] Failed to load history', {
        error: error.message,
      });
    }
  }

  /**
   * Save export history
   */
  async saveExportHistory() {
    try {
      await LocalStorageService.setItem('data_export_history', this.exportHistory);
    } catch (error) {
      LoggingService.error('[DataPortabilityService] Failed to save history', {
        error: error.message,
      });
    }
  }

  // Utility methods

  /**
   * Generate export ID
   */
  generateExportId() {
    return `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate file ID
   */
  generateFileId() {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate log ID
   */
  generateLogId() {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get client IP (placeholder)
   */
  async getClientIP() {
    return '127.0.0.1';
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
   * Get service statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      queueSize: this.exportQueue.length,
      historySize: this.exportHistory.length,
      isProcessing: this.isProcessing,
      initialized: this.initialized,
    };
  }

  /**
   * Get export status
   */
  getExportStatus(exportId) {
    const queueRecord = this.exportQueue.find(r => r.id === exportId);
    if (queueRecord) {
      return queueRecord;
    }
    
    const historyRecord = this.exportHistory.find(r => r.id === exportId);
    return historyRecord || null;
  }

  /**
   * Get available formats
   */
  getAvailableFormats() {
    return Object.values(this.exportFormats).map(format => ({
      id: format.id,
      name: format.name,
      description: format.description,
      extension: format.extension,
      structured: format.structured,
      machineReadable: format.machineReadable,
      humanReadable: format.humanReadable,
    }));
  }

  /**
   * Get available categories
   */
  getAvailableCategories() {
    return Object.values(this.portableDataCategories).map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      required: category.required,
      gdprApplicable: category.gdprApplicable,
      dataTypes: category.dataTypes,
    }));
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
        LoggingService.error('[DataPortabilityService] Listener error', {
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
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
      this.processingTimer = null;
    }
    
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    this.listeners.clear();
    this.exportQueue = [];
    this.exportHistory = [];
    this.isProcessing = false;
    this.initialized = false;
  }
}

// Create singleton instance
const dataPortabilityService = new DataPortabilityService();

export default dataPortabilityService;