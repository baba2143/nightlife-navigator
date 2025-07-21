/**
 * File Storage Service
 * Handles file uploads, downloads, and management with caching and optimization
 */

import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';

import ConfigService from './ConfigService';
import LoggingService from './LoggingService';
import LocalStorageService from './LocalStorageService';
import MonitoringManager from './MonitoringManager';

class FileStorageService {
  constructor() {
    this.initialized = false;
    this.baseUrl = null;
    this.uploadQueue = [];
    this.downloadQueue = [];
    this.maxConcurrentUploads = 3;
    this.maxConcurrentDownloads = 5;
    this.currentUploads = 0;
    this.currentDownloads = 0;
    
    // Storage directories
    this.directories = {
      cache: `${FileSystem.cacheDirectory}app_cache/`,
      documents: `${FileSystem.documentDirectory}app_files/`,
      images: `${FileSystem.cacheDirectory}images/`,
      temp: `${FileSystem.cacheDirectory}temp/`,
    };
    
    // File type configurations
    this.fileTypes = {
      image: {
        extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        maxSize: 10 * 1024 * 1024, // 10MB
        compressionQuality: 0.8,
        thumbnailSize: { width: 200, height: 200 },
      },
      video: {
        extensions: ['mp4', 'mov', 'avi', 'mkv'],
        maxSize: 100 * 1024 * 1024, // 100MB
        compressionQuality: 0.7,
      },
      document: {
        extensions: ['pdf', 'doc', 'docx', 'txt'],
        maxSize: 50 * 1024 * 1024, // 50MB
      },
      audio: {
        extensions: ['mp3', 'wav', 'aac', 'm4a'],
        maxSize: 20 * 1024 * 1024, // 20MB
      },
    };
    
    // Cache configuration
    this.cachePolicy = {
      maxSize: 500 * 1024 * 1024, // 500MB
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours
    };
    
    // Statistics
    this.stats = {
      uploads: 0,
      downloads: 0,
      cacheHits: 0,
      cacheMisses: 0,
      bytesUploaded: 0,
      bytesDownloaded: 0,
      errors: 0,
    };
    
    // Event listeners
    this.uploadListeners = new Set();
    this.downloadListeners = new Set();
  }

  /**
   * Initialize file storage service
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Get API configuration
      const apiConfig = ConfigService.getApiConfig();
      this.baseUrl = apiConfig.baseURL;
      
      // Create storage directories
      await this.createDirectories();
      
      // Load cache statistics
      await this.loadCacheStats();
      
      // Setup cache cleanup
      this.setupCacheCleanup();
      
      // Request permissions
      await this.requestPermissions();
      
      this.initialized = true;
      
      LoggingService.info('[FileStorageService] Initialized', {
        baseUrl: this.baseUrl,
        directories: Object.keys(this.directories),
      });

    } catch (error) {
      LoggingService.error('[FileStorageService] Failed to initialize', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Create storage directories
   */
  async createDirectories() {
    try {
      for (const [name, path] of Object.entries(this.directories)) {
        const dirInfo = await FileSystem.getInfoAsync(path);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(path, { intermediates: true });
          LoggingService.debug('[FileStorageService] Created directory', {
            name,
            path,
          });
        }
      }

    } catch (error) {
      LoggingService.error('[FileStorageService] Failed to create directories', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Request necessary permissions
   */
  async requestPermissions() {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        
        LoggingService.debug('[FileStorageService] Media library permissions', {
          status,
        });
      }

    } catch (error) {
      LoggingService.warn('[FileStorageService] Failed to request permissions', {
        error: error.message,
      });
    }
  }

  /**
   * Upload file
   */
  async uploadFile(fileUri, options = {}) {
    try {
      const {
        fileName = null,
        fileType = null,
        compress = true,
        generateThumbnail = false,
        metadata = {},
        onProgress = null,
      } = options;

      // Validate file
      const fileInfo = await this.validateFile(fileUri, fileType);
      
      // Add to upload queue
      const uploadId = this.generateUploadId();
      const uploadTask = {
        id: uploadId,
        fileUri,
        fileName: fileName || fileInfo.name,
        fileType: fileType || fileInfo.type,
        fileSize: fileInfo.size,
        compress,
        generateThumbnail,
        metadata,
        onProgress,
        status: 'queued',
        createdAt: Date.now(),
      };
      
      this.uploadQueue.push(uploadTask);
      this.notifyUploadListeners('queued', uploadTask);
      
      // Process upload queue
      this.processUploadQueue();
      
      return uploadId;

    } catch (error) {
      this.stats.errors++;
      
      LoggingService.error('[FileStorageService] Failed to queue upload', {
        error: error.message,
        fileUri,
      });
      
      throw error;
    }
  }

  /**
   * Process upload queue
   */
  async processUploadQueue() {
    if (this.currentUploads >= this.maxConcurrentUploads) {
      return;
    }

    const nextUpload = this.uploadQueue.find(task => task.status === 'queued');
    if (!nextUpload) {
      return;
    }

    try {
      this.currentUploads++;
      nextUpload.status = 'uploading';
      this.notifyUploadListeners('started', nextUpload);
      
      const result = await this.performUpload(nextUpload);
      
      nextUpload.status = 'completed';
      nextUpload.result = result;
      this.notifyUploadListeners('completed', nextUpload);
      
      this.stats.uploads++;
      this.stats.bytesUploaded += nextUpload.fileSize;
      
      LoggingService.info('[FileStorageService] Upload completed', {
        id: nextUpload.id,
        fileName: nextUpload.fileName,
        fileSize: nextUpload.fileSize,
        duration: Date.now() - nextUpload.createdAt,
      });
      
      // Track analytics
      MonitoringManager.trackUserAction?.('file_upload', 'system', {
        fileType: nextUpload.fileType,
        fileSize: nextUpload.fileSize,
      });

    } catch (error) {
      nextUpload.status = 'failed';
      nextUpload.error = error.message;
      this.notifyUploadListeners('failed', nextUpload);
      
      this.stats.errors++;
      
      LoggingService.error('[FileStorageService] Upload failed', {
        error: error.message,
        id: nextUpload.id,
      });

    } finally {
      this.currentUploads--;
      
      // Remove completed/failed uploads from queue
      this.uploadQueue = this.uploadQueue.filter(task => 
        task.status !== 'completed' && task.status !== 'failed'
      );
      
      // Process next upload
      setTimeout(() => this.processUploadQueue(), 100);
    }
  }

  /**
   * Perform actual upload
   */
  async performUpload(uploadTask) {
    const { fileUri, fileName, fileType, compress, generateThumbnail, metadata, onProgress } = uploadTask;
    
    try {
      let processedFileUri = fileUri;
      
      // Compress file if needed
      if (compress && this.shouldCompress(fileType)) {
        processedFileUri = await this.compressFile(fileUri, fileType);
      }
      
      // Generate thumbnail if needed
      let thumbnailUri = null;
      if (generateThumbnail && fileType === 'image') {
        thumbnailUri = await this.generateThumbnail(processedFileUri);
      }
      
      // Upload main file
      const uploadResult = await this.uploadFileToServer(processedFileUri, {
        fileName,
        fileType,
        metadata,
        onProgress,
      });
      
      // Upload thumbnail if generated
      if (thumbnailUri) {
        const thumbnailResult = await this.uploadFileToServer(thumbnailUri, {
          fileName: `thumb_${fileName}`,
          fileType: 'image',
          metadata: { ...metadata, thumbnail: true },
        });
        
        uploadResult.thumbnail = thumbnailResult;
      }
      
      // Clean up temporary files
      if (processedFileUri !== fileUri) {
        await this.deleteFile(processedFileUri);
      }
      if (thumbnailUri) {
        await this.deleteFile(thumbnailUri);
      }
      
      return uploadResult;

    } catch (error) {
      LoggingService.error('[FileStorageService] Upload processing failed', {
        error: error.message,
        uploadId: uploadTask.id,
      });
      throw error;
    }
  }

  /**
   * Upload file to server
   */
  async uploadFileToServer(fileUri, options = {}) {
    const { fileName, fileType, metadata = {}, onProgress } = options;
    
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        name: fileName,
        type: this.getMimeType(fileType),
      });
      formData.append('metadata', JSON.stringify(metadata));
      
      const response = await fetch(`${this.baseUrl}/api/files/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      
      LoggingService.debug('[FileStorageService] File uploaded to server', {
        fileName,
        fileId: result.id,
        url: result.url,
      });
      
      return result;

    } catch (error) {
      LoggingService.error('[FileStorageService] Server upload failed', {
        error: error.message,
        fileName,
      });
      throw error;
    }
  }

  /**
   * Download file
   */
  async downloadFile(url, options = {}) {
    try {
      const {
        fileName = null,
        directory = 'cache',
        useCache = true,
        onProgress = null,
      } = options;

      // Generate cache key
      const cacheKey = this.generateCacheKey(url);
      const localFileName = fileName || this.extractFileNameFromUrl(url);
      const localPath = `${this.directories[directory]}${localFileName}`;
      
      // Check cache first
      if (useCache) {
        const cachedFile = await this.getCachedFile(cacheKey);
        if (cachedFile) {
          this.stats.cacheHits++;
          LoggingService.debug('[FileStorageService] File served from cache', {
            url,
            localPath: cachedFile.path,
          });
          return cachedFile.path;
        }
      }
      
      this.stats.cacheMisses++;
      
      // Add to download queue
      const downloadId = this.generateDownloadId();
      const downloadTask = {
        id: downloadId,
        url,
        localPath,
        cacheKey,
        useCache,
        onProgress,
        status: 'queued',
        createdAt: Date.now(),
      };
      
      this.downloadQueue.push(downloadTask);
      this.notifyDownloadListeners('queued', downloadTask);
      
      // Process download queue
      this.processDownloadQueue();
      
      return new Promise((resolve, reject) => {
        const removeListener = this.addDownloadListener((event, task) => {
          if (task.id === downloadId) {
            if (event === 'completed') {
              removeListener();
              resolve(task.localPath);
            } else if (event === 'failed') {
              removeListener();
              reject(new Error(task.error));
            }
          }
        });
      });

    } catch (error) {
      this.stats.errors++;
      
      LoggingService.error('[FileStorageService] Failed to queue download', {
        error: error.message,
        url,
      });
      
      throw error;
    }
  }

  /**
   * Process download queue
   */
  async processDownloadQueue() {
    if (this.currentDownloads >= this.maxConcurrentDownloads) {
      return;
    }

    const nextDownload = this.downloadQueue.find(task => task.status === 'queued');
    if (!nextDownload) {
      return;
    }

    try {
      this.currentDownloads++;
      nextDownload.status = 'downloading';
      this.notifyDownloadListeners('started', nextDownload);
      
      await this.performDownload(nextDownload);
      
      nextDownload.status = 'completed';
      this.notifyDownloadListeners('completed', nextDownload);
      
      this.stats.downloads++;
      
      LoggingService.info('[FileStorageService] Download completed', {
        id: nextDownload.id,
        url: nextDownload.url,
        duration: Date.now() - nextDownload.createdAt,
      });

    } catch (error) {
      nextDownload.status = 'failed';
      nextDownload.error = error.message;
      this.notifyDownloadListeners('failed', nextDownload);
      
      this.stats.errors++;
      
      LoggingService.error('[FileStorageService] Download failed', {
        error: error.message,
        id: nextDownload.id,
      });

    } finally {
      this.currentDownloads--;
      
      // Remove completed/failed downloads from queue
      this.downloadQueue = this.downloadQueue.filter(task => 
        task.status !== 'completed' && task.status !== 'failed'
      );
      
      // Process next download
      setTimeout(() => this.processDownloadQueue(), 100);
    }
  }

  /**
   * Perform actual download
   */
  async performDownload(downloadTask) {
    const { url, localPath, cacheKey, useCache, onProgress } = downloadTask;
    
    try {
      const downloadOptions = {
        uri: url,
        toFile: localPath,
      };
      
      if (onProgress) {
        downloadOptions.progress = onProgress;
      }
      
      const downloadResult = await FileSystem.downloadAsync(url, localPath);
      
      if (downloadResult.status !== 200) {
        throw new Error(`Download failed with status ${downloadResult.status}`);
      }
      
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      this.stats.bytesDownloaded += fileInfo.size || 0;
      
      // Cache file info if using cache
      if (useCache) {
        await this.setCachedFile(cacheKey, {
          path: localPath,
          url,
          size: fileInfo.size,
          downloadedAt: Date.now(),
        });
      }
      
      LoggingService.debug('[FileStorageService] File downloaded', {
        url,
        localPath,
        size: fileInfo.size,
      });

    } catch (error) {
      LoggingService.error('[FileStorageService] Download processing failed', {
        error: error.message,
        url,
      });
      throw error;
    }
  }

  /**
   * Validate file
   */
  async validateFile(fileUri, expectedType = null) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }
      
      const fileName = fileUri.split('/').pop();
      const extension = fileName.split('.').pop().toLowerCase();
      const fileType = this.getFileTypeFromExtension(extension);
      
      if (expectedType && fileType !== expectedType) {
        throw new Error(`Expected ${expectedType} file, got ${fileType}`);
      }
      
      const typeConfig = this.fileTypes[fileType];
      if (typeConfig && fileInfo.size > typeConfig.maxSize) {
        throw new Error(`File size exceeds maximum allowed size for ${fileType} files`);
      }
      
      return {
        name: fileName,
        type: fileType,
        size: fileInfo.size,
        extension,
        uri: fileUri,
      };

    } catch (error) {
      LoggingService.error('[FileStorageService] File validation failed', {
        error: error.message,
        fileUri,
      });
      throw error;
    }
  }

  /**
   * Compress file
   */
  async compressFile(fileUri, fileType) {
    // Implementation would depend on the file type and available compression libraries
    // For now, return the original file URI
    LoggingService.debug('[FileStorageService] File compression skipped (not implemented)', {
      fileUri,
      fileType,
    });
    
    return fileUri;
  }

  /**
   * Generate thumbnail
   */
  async generateThumbnail(imageUri) {
    // Implementation would use image manipulation library
    // For now, return null
    LoggingService.debug('[FileStorageService] Thumbnail generation skipped (not implemented)', {
      imageUri,
    });
    
    return null;
  }

  /**
   * Get cached file
   */
  async getCachedFile(cacheKey) {
    try {
      const cacheInfo = await LocalStorageService.getItem(`file_cache_${cacheKey}`);
      
      if (!cacheInfo) {
        return null;
      }
      
      // Check if cached file still exists
      const fileInfo = await FileSystem.getInfoAsync(cacheInfo.path);
      if (!fileInfo.exists) {
        await LocalStorageService.removeItem(`file_cache_${cacheKey}`);
        return null;
      }
      
      // Check cache age
      const age = Date.now() - cacheInfo.downloadedAt;
      if (age > this.cachePolicy.maxAge) {
        await this.deleteFile(cacheInfo.path);
        await LocalStorageService.removeItem(`file_cache_${cacheKey}`);
        return null;
      }
      
      return cacheInfo;

    } catch (error) {
      LoggingService.warn('[FileStorageService] Failed to get cached file', {
        error: error.message,
        cacheKey,
      });
      return null;
    }
  }

  /**
   * Set cached file
   */
  async setCachedFile(cacheKey, fileInfo) {
    try {
      await LocalStorageService.setItem(`file_cache_${cacheKey}`, fileInfo, {
        ttl: this.cachePolicy.maxAge,
      });

    } catch (error) {
      LoggingService.warn('[FileStorageService] Failed to cache file info', {
        error: error.message,
        cacheKey,
      });
    }
  }

  /**
   * Delete file
   */
  async deleteFile(fileUri) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(fileUri);
        LoggingService.debug('[FileStorageService] File deleted', { fileUri });
      }

    } catch (error) {
      LoggingService.warn('[FileStorageService] Failed to delete file', {
        error: error.message,
        fileUri,
      });
    }
  }

  /**
   * Clear cache
   */
  async clearCache() {
    try {
      // Clear cache directory
      await FileSystem.deleteAsync(this.directories.cache, { idempotent: true });
      await FileSystem.makeDirectoryAsync(this.directories.cache, { intermediates: true });
      
      // Clear cache metadata
      const keys = await LocalStorageService.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('file_cache_'));
      
      for (const key of cacheKeys) {
        await LocalStorageService.removeItem(key);
      }
      
      LoggingService.info('[FileStorageService] Cache cleared');

    } catch (error) {
      LoggingService.error('[FileStorageService] Failed to clear cache', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get cache size
   */
  async getCacheSize() {
    try {
      const cacheDir = this.directories.cache;
      const files = await FileSystem.readDirectoryAsync(cacheDir);
      
      let totalSize = 0;
      for (const fileName of files) {
        const filePath = `${cacheDir}${fileName}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        totalSize += fileInfo.size || 0;
      }
      
      return {
        files: files.length,
        bytes: totalSize,
        mb: (totalSize / 1024 / 1024).toFixed(2),
      };

    } catch (error) {
      LoggingService.error('[FileStorageService] Failed to get cache size', {
        error: error.message,
      });
      
      return { files: 0, bytes: 0, mb: '0.00' };
    }
  }

  /**
   * Setup cache cleanup
   */
  setupCacheCleanup() {
    setInterval(async () => {
      try {
        await this.cleanupExpiredCache();
      } catch (error) {
        LoggingService.error('[FileStorageService] Cache cleanup failed', {
          error: error.message,
        });
      }
    }, this.cachePolicy.cleanupInterval);
  }

  /**
   * Cleanup expired cache
   */
  async cleanupExpiredCache() {
    try {
      const keys = await LocalStorageService.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('file_cache_'));
      
      let deletedFiles = 0;
      
      for (const key of cacheKeys) {
        const cacheInfo = await LocalStorageService.getItem(key);
        if (cacheInfo) {
          const age = Date.now() - cacheInfo.downloadedAt;
          if (age > this.cachePolicy.maxAge) {
            await this.deleteFile(cacheInfo.path);
            await LocalStorageService.removeItem(key);
            deletedFiles++;
          }
        }
      }
      
      LoggingService.debug('[FileStorageService] Cache cleanup completed', {
        deletedFiles,
      });

    } catch (error) {
      LoggingService.error('[FileStorageService] Cache cleanup failed', {
        error: error.message,
      });
    }
  }

  /**
   * Load cache statistics
   */
  async loadCacheStats() {
    try {
      const savedStats = await LocalStorageService.getItem('file_storage_stats');
      if (savedStats) {
        this.stats = { ...this.stats, ...savedStats };
      }

    } catch (error) {
      LoggingService.warn('[FileStorageService] Failed to load cache stats', {
        error: error.message,
      });
    }
  }

  /**
   * Save cache statistics
   */
  async saveCacheStats() {
    try {
      await LocalStorageService.setItem('file_storage_stats', this.stats);

    } catch (error) {
      LoggingService.warn('[FileStorageService] Failed to save cache stats', {
        error: error.message,
      });
    }
  }

  // Helper methods

  /**
   * Generate upload ID
   */
  generateUploadId() {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate download ID
   */
  generateDownloadId() {
    return `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate cache key
   */
  generateCacheKey(url) {
    return Buffer.from(url).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Extract file name from URL
   */
  extractFileNameFromUrl(url) {
    try {
      const urlParts = url.split('/');
      const fileName = urlParts.pop();
      return fileName.split('?')[0]; // Remove query parameters
    } catch (error) {
      return `file_${Date.now()}`;
    }
  }

  /**
   * Get file type from extension
   */
  getFileTypeFromExtension(extension) {
    for (const [type, config] of Object.entries(this.fileTypes)) {
      if (config.extensions.includes(extension)) {
        return type;
      }
    }
    return 'unknown';
  }

  /**
   * Get MIME type
   */
  getMimeType(fileType) {
    const mimeTypes = {
      image: 'image/*',
      video: 'video/*',
      audio: 'audio/*',
      document: 'application/*',
    };
    
    return mimeTypes[fileType] || 'application/octet-stream';
  }

  /**
   * Check if file should be compressed
   */
  shouldCompress(fileType) {
    const compressibleTypes = ['image', 'video'];
    return compressibleTypes.includes(fileType);
  }

  /**
   * Add upload listener
   */
  addUploadListener(listener) {
    this.uploadListeners.add(listener);
    
    return () => {
      this.uploadListeners.delete(listener);
    };
  }

  /**
   * Add download listener
   */
  addDownloadListener(listener) {
    this.downloadListeners.add(listener);
    
    return () => {
      this.downloadListeners.delete(listener);
    };
  }

  /**
   * Notify upload listeners
   */
  notifyUploadListeners(event, data) {
    this.uploadListeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        LoggingService.error('[FileStorageService] Upload listener error', {
          error: error.message,
          event,
        });
      }
    });
  }

  /**
   * Notify download listeners
   */
  notifyDownloadListeners(event, data) {
    this.downloadListeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        LoggingService.error('[FileStorageService] Download listener error', {
          error: error.message,
          event,
        });
      }
    });
  }

  /**
   * Get storage statistics
   */
  getStorageStatistics() {
    return {
      ...this.stats,
      uploadQueue: this.uploadQueue.length,
      downloadQueue: this.downloadQueue.length,
      currentUploads: this.currentUploads,
      currentDownloads: this.currentDownloads,
      initialized: this.initialized,
    };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.uploadListeners.clear();
    this.downloadListeners.clear();
    this.uploadQueue = [];
    this.downloadQueue = [];
    this.currentUploads = 0;
    this.currentDownloads = 0;
    this.initialized = false;
  }
}

// Create singleton instance
const fileStorageService = new FileStorageService();

export default fileStorageService;