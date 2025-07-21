import { LocalStorageService } from './LocalStorageService.js';
import { AuditLogService } from './AuditLogService.js';

class MediaSharingService {
  constructor() {
    if (MediaSharingService.instance) {
      return MediaSharingService.instance;
    }

    this.isInitialized = false;
    this.listeners = new Map();
    this.metrics = {
      totalMediaUploads: 0,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      storageUsed: 0,
      averageEngagement: 0,
      popularMediaTypes: {},
      moderationActions: 0,
      reportedContent: 0
    };

    this.mediaItems = new Map();
    this.mediaAlbums = new Map();
    this.mediaLikes = new Map();
    this.mediaComments = new Map();
    this.mediaShares = new Map();
    this.mediaReports = new Map();
    this.mediaTags = new Map();
    this.privacySettings = new Map();
    this.moderationQueue = new Map();

    MediaSharingService.instance = this;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      this.storage = await LocalStorageService.getInstance();
      this.auditLog = await AuditLogService.getInstance();

      await this.loadMediaItems();
      await this.loadMediaAlbums();
      await this.loadMediaInteractions();
      await this.loadPrivacySettings();
      await this.loadModerationQueue();
      await this.loadMetrics();

      this.startMetricsCollection();
      this.startAutomaticProcessing();
      this.isInitialized = true;

      await this.auditLog.log('media_sharing_service_initialized', {
        component: 'MediaSharingService',
        timestamp: new Date().toISOString(),
        mediaItemsCount: this.mediaItems.size,
        albumsCount: this.mediaAlbums.size
      });

      this.emit('initialized');
    } catch (error) {
      console.error('Failed to initialize MediaSharingService:', error);
      throw error;
    }
  }

  async uploadMedia(userId, mediaData) {
    try {
      if (!this.validateMediaData(mediaData)) {
        throw new Error('Invalid media data');
      }

      if (!await this.checkStorageQuota(userId, mediaData.size)) {
        throw new Error('Storage quota exceeded');
      }

      const mediaId = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const processedMedia = await this.processMediaFile(mediaData);
      const thumbnails = await this.generateThumbnails(processedMedia);
      const metadata = await this.extractMetadata(processedMedia);

      const mediaItem = {
        id: mediaId,
        userId,
        type: mediaData.type,
        title: mediaData.title || '',
        description: mediaData.description || '',
        filename: mediaData.filename,
        originalSize: mediaData.size,
        processedSize: processedMedia.size,
        dimensions: metadata.dimensions,
        duration: metadata.duration,
        mimeType: mediaData.mimeType,
        thumbnails,
        tags: mediaData.tags || [],
        location: mediaData.location,
        privacy: mediaData.privacy || 'public',
        status: 'active',
        moderationStatus: 'pending',
        uploadedAt: new Date().toISOString(),
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        reports: 0,
        lastModified: new Date().toISOString()
      };

      await this.saveMediaFile(mediaId, processedMedia);
      await this.saveThumbnails(mediaId, thumbnails);

      this.mediaItems.set(mediaId, mediaItem);
      await this.storage.set(`media_item_${mediaId}`, mediaItem);

      await this.addToModerationQueue(mediaItem);

      this.metrics.totalMediaUploads++;
      this.metrics.storageUsed += processedMedia.size;
      this.updateMediaTypeMetrics(mediaData.type);

      await this.auditLog.log('media_uploaded', {
        mediaId,
        userId,
        type: mediaData.type,
        size: processedMedia.size,
        privacy: mediaItem.privacy,
        timestamp: new Date().toISOString()
      });

      this.emit('mediaUploaded', { mediaItem });
      return mediaItem;
    } catch (error) {
      console.error('Failed to upload media:', error);
      throw error;
    }
  }

  validateMediaData(mediaData) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/mov'];
    const maxFileSize = 100 * 1024 * 1024;

    if (!mediaData.type || !allowedTypes.includes(mediaData.mimeType)) {
      return false;
    }

    if (mediaData.size > maxFileSize) {
      return false;
    }

    return true;
  }

  async checkStorageQuota(userId, fileSize) {
    const userQuota = 1024 * 1024 * 1024;
    const userMedia = Array.from(this.mediaItems.values()).filter(item => item.userId === userId);
    const usedSpace = userMedia.reduce((total, item) => total + item.processedSize, 0);
    
    return (usedSpace + fileSize) <= userQuota;
  }

  async processMediaFile(mediaData) {
    const isImage = mediaData.mimeType.startsWith('image/');
    const isVideo = mediaData.mimeType.startsWith('video/');

    let processedData = { ...mediaData };

    if (isImage) {
      processedData = await this.compressImage(mediaData);
    } else if (isVideo) {
      processedData = await this.compressVideo(mediaData);
    }

    return processedData;
  }

  async compressImage(imageData) {
    const compressionRatio = 0.8;
    const compressedSize = Math.floor(imageData.size * compressionRatio);
    
    return {
      ...imageData,
      size: compressedSize,
      compressed: true,
      compressionRatio
    };
  }

  async compressVideo(videoData) {
    const compressionRatio = 0.6;
    const compressedSize = Math.floor(videoData.size * compressionRatio);
    
    return {
      ...videoData,
      size: compressedSize,
      compressed: true,
      compressionRatio
    };
  }

  async generateThumbnails(mediaData) {
    const thumbnails = {};

    if (mediaData.mimeType.startsWith('image/')) {
      thumbnails.small = { width: 150, height: 150, size: 5000 };
      thumbnails.medium = { width: 300, height: 300, size: 15000 };
      thumbnails.large = { width: 600, height: 600, size: 45000 };
    } else if (mediaData.mimeType.startsWith('video/')) {
      thumbnails.poster = { width: 640, height: 360, size: 25000, timeCode: '00:00:01' };
      thumbnails.small = { width: 150, height: 85, size: 8000, timeCode: '00:00:01' };
    }

    return thumbnails;
  }

  async extractMetadata(mediaData) {
    const metadata = {
      dimensions: null,
      duration: null,
      createdAt: new Date().toISOString(),
      deviceInfo: null,
      gpsLocation: null
    };

    if (mediaData.mimeType.startsWith('image/')) {
      metadata.dimensions = { width: 1920, height: 1080 };
    } else if (mediaData.mimeType.startsWith('video/')) {
      metadata.dimensions = { width: 1920, height: 1080 };
      metadata.duration = Math.random() * 300 + 10;
    }

    return metadata;
  }

  async saveMediaFile(mediaId, mediaData) {
    await this.storage.set(`media_file_${mediaId}`, {
      id: mediaId,
      data: mediaData,
      savedAt: new Date().toISOString()
    });
  }

  async saveThumbnails(mediaId, thumbnails) {
    await this.storage.set(`media_thumbnails_${mediaId}`, {
      mediaId,
      thumbnails,
      generatedAt: new Date().toISOString()
    });
  }

  async createAlbum(userId, albumData) {
    try {
      const albumId = `album_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const album = {
        id: albumId,
        userId,
        title: albumData.title,
        description: albumData.description || '',
        coverMediaId: albumData.coverMediaId,
        mediaIds: albumData.mediaIds || [],
        tags: albumData.tags || [],
        privacy: albumData.privacy || 'public',
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        views: 0,
        likes: 0,
        shares: 0
      };

      this.mediaAlbums.set(albumId, album);
      await this.storage.set(`media_album_${albumId}`, album);

      await this.auditLog.log('album_created', {
        albumId,
        userId,
        title: albumData.title,
        mediaCount: album.mediaIds.length,
        timestamp: new Date().toISOString()
      });

      this.emit('albumCreated', { album });
      return album;
    } catch (error) {
      console.error('Failed to create album:', error);
      throw error;
    }
  }

  async addMediaToAlbum(albumId, mediaId, userId) {
    try {
      const album = this.mediaAlbums.get(albumId);
      if (!album) {
        throw new Error('Album not found');
      }

      if (album.userId !== userId) {
        throw new Error('Unauthorized: Cannot modify album');
      }

      const media = this.mediaItems.get(mediaId);
      if (!media) {
        throw new Error('Media not found');
      }

      if (!album.mediaIds.includes(mediaId)) {
        album.mediaIds.push(mediaId);
        album.lastModified = new Date().toISOString();

        if (!album.coverMediaId) {
          album.coverMediaId = mediaId;
        }

        await this.storage.set(`media_album_${albumId}`, album);

        await this.auditLog.log('media_added_to_album', {
          albumId,
          mediaId,
          userId,
          timestamp: new Date().toISOString()
        });

        this.emit('mediaAddedToAlbum', { album, mediaId });
      }

      return album;
    } catch (error) {
      console.error('Failed to add media to album:', error);
      throw error;
    }
  }

  async likeMedia(userId, mediaId) {
    try {
      const media = this.mediaItems.get(mediaId);
      if (!media) {
        throw new Error('Media not found');
      }

      const likeId = `like_${userId}_${mediaId}`;
      
      if (!this.mediaLikes.has(likeId)) {
        const like = {
          id: likeId,
          userId,
          mediaId,
          createdAt: new Date().toISOString()
        };

        this.mediaLikes.set(likeId, like);
        media.likes++;
        
        await this.storage.set(`media_item_${mediaId}`, media);
        await this.storage.set(`media_like_${likeId}`, like);

        this.metrics.totalLikes++;

        await this.auditLog.log('media_liked', {
          mediaId,
          userId,
          totalLikes: media.likes,
          timestamp: new Date().toISOString()
        });

        this.emit('mediaLiked', { media, userId });
      }

      return media;
    } catch (error) {
      console.error('Failed to like media:', error);
      throw error;
    }
  }

  async unlikeMedia(userId, mediaId) {
    try {
      const media = this.mediaItems.get(mediaId);
      if (!media) {
        throw new Error('Media not found');
      }

      const likeId = `like_${userId}_${mediaId}`;
      
      if (this.mediaLikes.has(likeId)) {
        this.mediaLikes.delete(likeId);
        media.likes = Math.max(0, media.likes - 1);
        
        await this.storage.set(`media_item_${mediaId}`, media);
        await this.storage.remove(`media_like_${likeId}`);

        this.metrics.totalLikes = Math.max(0, this.metrics.totalLikes - 1);

        await this.auditLog.log('media_unliked', {
          mediaId,
          userId,
          totalLikes: media.likes,
          timestamp: new Date().toISOString()
        });

        this.emit('mediaUnliked', { media, userId });
      }

      return media;
    } catch (error) {
      console.error('Failed to unlike media:', error);
      throw error;
    }
  }

  async commentOnMedia(userId, mediaId, commentText) {
    try {
      const media = this.mediaItems.get(mediaId);
      if (!media) {
        throw new Error('Media not found');
      }

      if (await this.moderateContent(commentText)) {
        throw new Error('Comment contains inappropriate content');
      }

      const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const comment = {
        id: commentId,
        userId,
        mediaId,
        text: commentText,
        createdAt: new Date().toISOString(),
        likes: 0,
        reports: 0,
        status: 'active',
        moderationStatus: 'approved'
      };

      this.mediaComments.set(commentId, comment);
      media.comments++;
      
      await this.storage.set(`media_item_${mediaId}`, media);
      await this.storage.set(`media_comment_${commentId}`, comment);

      this.metrics.totalComments++;

      await this.auditLog.log('media_commented', {
        mediaId,
        commentId,
        userId,
        totalComments: media.comments,
        timestamp: new Date().toISOString()
      });

      this.emit('mediaCommented', { media, comment });
      return comment;
    } catch (error) {
      console.error('Failed to comment on media:', error);
      throw error;
    }
  }

  async shareMedia(userId, mediaId, shareData) {
    try {
      const media = this.mediaItems.get(mediaId);
      if (!media) {
        throw new Error('Media not found');
      }

      if (media.privacy === 'private' && media.userId !== userId) {
        throw new Error('Cannot share private media');
      }

      const shareId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const share = {
        id: shareId,
        userId,
        mediaId,
        platform: shareData.platform || 'internal',
        message: shareData.message || '',
        recipients: shareData.recipients || [],
        createdAt: new Date().toISOString()
      };

      this.mediaShares.set(shareId, share);
      media.shares++;
      
      await this.storage.set(`media_item_${mediaId}`, media);
      await this.storage.set(`media_share_${shareId}`, share);

      this.metrics.totalShares++;

      await this.auditLog.log('media_shared', {
        mediaId,
        shareId,
        userId,
        platform: share.platform,
        totalShares: media.shares,
        timestamp: new Date().toISOString()
      });

      this.emit('mediaShared', { media, share });
      return share;
    } catch (error) {
      console.error('Failed to share media:', error);
      throw error;
    }
  }

  async reportMedia(userId, mediaId, reportReason) {
    try {
      const media = this.mediaItems.get(mediaId);
      if (!media) {
        throw new Error('Media not found');
      }

      const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const report = {
        id: reportId,
        reporterId: userId,
        mediaId,
        reason: reportReason,
        description: '',
        status: 'pending',
        createdAt: new Date().toISOString(),
        reviewedAt: null,
        reviewedBy: null,
        action: null
      };

      this.mediaReports.set(reportId, report);
      media.reports++;
      
      await this.storage.set(`media_item_${mediaId}`, media);
      await this.storage.set(`media_report_${reportId}`, report);

      await this.addToModerationQueue(media, 'reported');

      this.metrics.reportedContent++;

      await this.auditLog.log('media_reported', {
        mediaId,
        reportId,
        reporterId: userId,
        reason: reportReason,
        timestamp: new Date().toISOString()
      });

      this.emit('mediaReported', { media, report });
      return report;
    } catch (error) {
      console.error('Failed to report media:', error);
      throw error;
    }
  }

  async viewMedia(userId, mediaId) {
    try {
      const media = this.mediaItems.get(mediaId);
      if (!media) {
        throw new Error('Media not found');
      }

      if (media.privacy === 'private' && media.userId !== userId) {
        throw new Error('Cannot view private media');
      }

      media.views++;
      media.lastViewed = new Date().toISOString();
      
      await this.storage.set(`media_item_${mediaId}`, media);

      this.metrics.totalViews++;

      if (userId !== media.userId) {
        await this.auditLog.log('media_viewed', {
          mediaId,
          viewerId: userId,
          ownerId: media.userId,
          totalViews: media.views,
          timestamp: new Date().toISOString()
        });
      }

      this.emit('mediaViewed', { media, viewerId: userId });
      return media;
    } catch (error) {
      console.error('Failed to view media:', error);
      throw error;
    }
  }

  async getUserMedia(userId, options = {}) {
    try {
      const userMedia = Array.from(this.mediaItems.values())
        .filter(item => item.userId === userId && item.status === 'active')
        .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

      if (options.type) {
        return userMedia.filter(item => item.type === options.type);
      }

      if (options.limit) {
        return userMedia.slice(0, options.limit);
      }

      return userMedia;
    } catch (error) {
      console.error('Failed to get user media:', error);
      return [];
    }
  }

  async getPublicFeed(userId, options = {}) {
    try {
      const publicMedia = Array.from(this.mediaItems.values())
        .filter(item => 
          item.privacy === 'public' && 
          item.status === 'active' &&
          item.moderationStatus === 'approved'
        )
        .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

      if (options.limit) {
        return publicMedia.slice(0, options.limit);
      }

      return publicMedia;
    } catch (error) {
      console.error('Failed to get public feed:', error);
      return [];
    }
  }

  async moderateContent(content) {
    const inappropriateWords = ['spam', 'hate', 'explicit'];
    const contentLower = content.toLowerCase();
    
    return inappropriateWords.some(word => contentLower.includes(word));
  }

  async addToModerationQueue(mediaItem, priority = 'normal') {
    const queueId = `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const moderationItem = {
      id: queueId,
      mediaId: mediaItem.id,
      userId: mediaItem.userId,
      type: 'media_review',
      priority,
      status: 'pending',
      createdAt: new Date().toISOString(),
      reviewedAt: null,
      reviewerId: null,
      decision: null,
      notes: ''
    };

    this.moderationQueue.set(queueId, moderationItem);
    await this.storage.set(`moderation_${queueId}`, moderationItem);
  }

  updateMediaTypeMetrics(mediaType) {
    if (!this.metrics.popularMediaTypes[mediaType]) {
      this.metrics.popularMediaTypes[mediaType] = 0;
    }
    this.metrics.popularMediaTypes[mediaType]++;
  }

  async loadMediaItems() {
    try {
      const stored = await this.storage.get('media_items_all');
      if (stored && Array.isArray(stored)) {
        stored.forEach(item => this.mediaItems.set(item.id, item));
      }
    } catch (error) {
      console.error('Failed to load media items:', error);
    }
  }

  async loadMediaAlbums() {
    try {
      const stored = await this.storage.get('media_albums_all');
      if (stored && Array.isArray(stored)) {
        stored.forEach(album => this.mediaAlbums.set(album.id, album));
      }
    } catch (error) {
      console.error('Failed to load media albums:', error);
    }
  }

  async loadMediaInteractions() {
    try {
      const likes = await this.storage.get('media_likes_all');
      if (likes && Array.isArray(likes)) {
        likes.forEach(like => this.mediaLikes.set(like.id, like));
      }

      const comments = await this.storage.get('media_comments_all');
      if (comments && Array.isArray(comments)) {
        comments.forEach(comment => this.mediaComments.set(comment.id, comment));
      }

      const shares = await this.storage.get('media_shares_all');
      if (shares && Array.isArray(shares)) {
        shares.forEach(share => this.mediaShares.set(share.id, share));
      }
    } catch (error) {
      console.error('Failed to load media interactions:', error);
    }
  }

  async loadPrivacySettings() {
    try {
      const stored = await this.storage.get('media_privacy_settings');
      if (stored) {
        Object.entries(stored).forEach(([userId, settings]) => {
          this.privacySettings.set(userId, settings);
        });
      }
    } catch (error) {
      console.error('Failed to load privacy settings:', error);
    }
  }

  async loadModerationQueue() {
    try {
      const stored = await this.storage.get('moderation_queue_all');
      if (stored && Array.isArray(stored)) {
        stored.forEach(item => this.moderationQueue.set(item.id, item));
      }
    } catch (error) {
      console.error('Failed to load moderation queue:', error);
    }
  }

  async loadMetrics() {
    try {
      const stored = await this.storage.get('media_sharing_metrics');
      if (stored) {
        this.metrics = { ...this.metrics, ...stored };
      }
    } catch (error) {
      console.error('Failed to load media sharing metrics:', error);
    }
  }

  startMetricsCollection() {
    setInterval(async () => {
      this.calculateEngagementMetrics();
      await this.storage.set('media_sharing_metrics', this.metrics);
    }, 60000);
  }

  calculateEngagementMetrics() {
    const totalMedia = this.mediaItems.size;
    if (totalMedia > 0) {
      const totalEngagement = this.metrics.totalLikes + this.metrics.totalComments + this.metrics.totalShares;
      this.metrics.averageEngagement = totalEngagement / totalMedia;
    }
  }

  startAutomaticProcessing() {
    setInterval(async () => {
      await this.processExpiredContent();
      await this.cleanupTempFiles();
    }, 24 * 60 * 60 * 1000);
  }

  async processExpiredContent() {
    const expirationDays = 365;
    const cutoffDate = new Date(Date.now() - expirationDays * 24 * 60 * 60 * 1000);

    for (const [mediaId, media] of this.mediaItems) {
      if (new Date(media.uploadedAt) < cutoffDate && media.status === 'active') {
        media.status = 'archived';
        await this.storage.set(`media_item_${mediaId}`, media);
      }
    }
  }

  async cleanupTempFiles() {
    console.log('Cleaning up temporary media files...');
  }

  getMetrics() {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString()
    };
  }

  getMediaAnalytics(period = 'month') {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const periodMedia = Array.from(this.mediaItems.values())
      .filter(item => new Date(item.uploadedAt) >= startDate);

    const totalViews = periodMedia.reduce((sum, item) => sum + item.views, 0);
    const totalLikes = periodMedia.reduce((sum, item) => sum + item.likes, 0);
    const totalComments = periodMedia.reduce((sum, item) => sum + item.comments, 0);

    return {
      period,
      uploadsCount: periodMedia.length,
      totalViews,
      totalLikes,
      totalComments,
      engagementRate: periodMedia.length > 0 ? (totalLikes + totalComments) / periodMedia.length : 0,
      startDate: startDate.toISOString(),
      endDate: now.toISOString()
    };
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in media sharing event listener for ${event}:`, error);
        }
      });
    }
  }

  async cleanup() {
    try {
      await this.storage.set('media_items_all', Array.from(this.mediaItems.values()));
      await this.storage.set('media_albums_all', Array.from(this.mediaAlbums.values()));
      await this.storage.set('media_likes_all', Array.from(this.mediaLikes.values()));
      await this.storage.set('media_comments_all', Array.from(this.mediaComments.values()));
      await this.storage.set('media_shares_all', Array.from(this.mediaShares.values()));
      await this.storage.set('moderation_queue_all', Array.from(this.moderationQueue.values()));
      await this.storage.set('media_sharing_metrics', this.metrics);

      this.listeners.clear();
      this.isInitialized = false;

      await this.auditLog.log('media_sharing_service_cleanup', {
        component: 'MediaSharingService',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to cleanup MediaSharingService:', error);
    }
  }

  static async getInstance() {
    if (!MediaSharingService.instance) {
      MediaSharingService.instance = new MediaSharingService();
    }
    if (!MediaSharingService.instance.isInitialized) {
      await MediaSharingService.instance.initialize();
    }
    return MediaSharingService.instance;
  }
}

export { MediaSharingService };