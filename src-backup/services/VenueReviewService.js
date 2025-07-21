import { LocalStorageService } from './LocalStorageService';
import { AuditLogService } from './AuditLogService';

class VenueReviewService {
  constructor() {
    this.initialized = false;
    this.storageService = null;
    this.auditService = null;
    this.reviews = new Map();
    this.venueReviews = new Map();
    this.userReviews = new Map();
    this.reviewMetrics = new Map();
    this.reviewReports = new Map();
    this.reviewModeration = new Map();
    this.helpfulnessVotes = new Map();
    this.reviewMetricsData = {
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      totalHelpfulnessVotes: 0,
      moderatedReviews: 0,
      reportedReviews: 0
    };
    this.listeners = [];
    this.reviewConfig = {
      maxReviewLength: 1000,
      minReviewLength: 10,
      enablePhotos: true,
      maxPhotos: 5,
      enableHelpfulnessVoting: true,
      enableReporting: true,
      enableModeration: true,
      requirePurchaseVerification: false,
      autoModerationEnabled: true,
      profanityFilterEnabled: true
    };
    this.reviewCategories = [
      { id: 'overall', name: 'Overall Experience', required: true },
      { id: 'atmosphere', name: 'Atmosphere', required: false },
      { id: 'music', name: 'Music', required: false },
      { id: 'drinks', name: 'Drinks & Service', required: false },
      { id: 'value', name: 'Value for Money', required: false },
      { id: 'cleanliness', name: 'Cleanliness', required: false }
    ];
    this.reportReasons = [
      { id: 'inappropriate', name: 'Inappropriate Content' },
      { id: 'spam', name: 'Spam' },
      { id: 'fake', name: 'Fake Review' },
      { id: 'offensive', name: 'Offensive Language' },
      { id: 'personal_info', name: 'Contains Personal Information' },
      { id: 'copyright', name: 'Copyright Violation' },
      { id: 'other', name: 'Other' }
    ];
    this.moderationActions = [
      { id: 'approved', name: 'Approved' },
      { id: 'rejected', name: 'Rejected' },
      { id: 'flagged', name: 'Flagged for Review' },
      { id: 'edited', name: 'Edited' },
      { id: 'hidden', name: 'Hidden' }
    ];
  }

  static getInstance() {
    if (!VenueReviewService.instance) {
      VenueReviewService.instance = new VenueReviewService();
    }
    return VenueReviewService.instance;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      this.storageService = LocalStorageService.getInstance();
      this.auditService = AuditLogService.getInstance();
      
      await this.loadReviews();
      await this.loadVenueReviews();
      await this.loadUserReviews();
      await this.loadReviewMetrics();
      await this.loadReviewReports();
      await this.loadReviewModeration();
      await this.loadHelpfulnessVotes();
      await this.loadReviewMetricsData();
      await this.loadReviewConfig();
      
      this.initialized = true;
      
      await this.auditService.logEvent('venue_review_service_initialized', {
        timestamp: new Date().toISOString(),
        reviews: this.reviews.size,
        venues_with_reviews: this.venueReviews.size,
        review_categories: this.reviewCategories.length
      });
      
      this.emit('serviceInitialized');
    } catch (error) {
      console.error('Failed to initialize VenueReviewService:', error);
      throw error;
    }
  }

  async loadReviews() {
    try {
      const reviews = await this.storageService.getItem('reviews');
      const reviewList = reviews || [];

      this.reviews.clear();
      reviewList.forEach(review => {
        this.reviews.set(review.id, review);
      });
    } catch (error) {
      console.error('Failed to load reviews:', error);
      this.reviews.clear();
    }
  }

  async loadVenueReviews() {
    try {
      const venueReviews = await this.storageService.getItem('venue_reviews');
      const venueReviewList = venueReviews || [];

      this.venueReviews.clear();
      venueReviewList.forEach(venueReview => {
        this.venueReviews.set(venueReview.venueId, venueReview);
      });
    } catch (error) {
      console.error('Failed to load venue reviews:', error);
      this.venueReviews.clear();
    }
  }

  async loadUserReviews() {
    try {
      const userReviews = await this.storageService.getItem('user_reviews');
      const userReviewList = userReviews || [];

      this.userReviews.clear();
      userReviewList.forEach(userReview => {
        this.userReviews.set(userReview.userId, userReview);
      });
    } catch (error) {
      console.error('Failed to load user reviews:', error);
      this.userReviews.clear();
    }
  }

  async loadReviewMetrics() {
    try {
      const metrics = await this.storageService.getItem('review_metrics');
      const metricsList = metrics || [];

      this.reviewMetrics.clear();
      metricsList.forEach(metric => {
        this.reviewMetrics.set(metric.venueId, metric);
      });
    } catch (error) {
      console.error('Failed to load review metrics:', error);
      this.reviewMetrics.clear();
    }
  }

  async loadReviewReports() {
    try {
      const reports = await this.storageService.getItem('review_reports');
      const reportList = reports || [];

      this.reviewReports.clear();
      reportList.forEach(report => {
        this.reviewReports.set(report.id, report);
      });
    } catch (error) {
      console.error('Failed to load review reports:', error);
      this.reviewReports.clear();
    }
  }

  async loadReviewModeration() {
    try {
      const moderation = await this.storageService.getItem('review_moderation');
      const moderationList = moderation || [];

      this.reviewModeration.clear();
      moderationList.forEach(mod => {
        this.reviewModeration.set(mod.reviewId, mod);
      });
    } catch (error) {
      console.error('Failed to load review moderation:', error);
      this.reviewModeration.clear();
    }
  }

  async loadHelpfulnessVotes() {
    try {
      const votes = await this.storageService.getItem('helpfulness_votes');
      const voteList = votes || [];

      this.helpfulnessVotes.clear();
      voteList.forEach(vote => {
        this.helpfulnessVotes.set(vote.id, vote);
      });
    } catch (error) {
      console.error('Failed to load helpfulness votes:', error);
      this.helpfulnessVotes.clear();
    }
  }

  async loadReviewMetricsData() {
    try {
      const metrics = await this.storageService.getItem('review_metrics_data');
      if (metrics) {
        this.reviewMetricsData = { ...this.reviewMetricsData, ...metrics };
      }
    } catch (error) {
      console.error('Failed to load review metrics data:', error);
    }
  }

  async loadReviewConfig() {
    try {
      const config = await this.storageService.getItem('review_config');
      if (config) {
        this.reviewConfig = { ...this.reviewConfig, ...config };
      }
    } catch (error) {
      console.error('Failed to load review config:', error);
    }
  }

  async createReview(reviewData) {
    try {
      // Validate review data
      const validation = this.validateReviewData(reviewData);
      if (!validation.isValid) {
        throw new Error(`Invalid review data: ${validation.errors.join(', ')}`);
      }

      // Check for duplicate reviews
      const existingReview = await this.getUserReviewForVenue(reviewData.userId, reviewData.venueId);
      if (existingReview) {
        throw new Error('User has already reviewed this venue');
      }

      // Apply content filtering
      const filteredContent = await this.filterReviewContent(reviewData);

      const review = {
        id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: reviewData.userId,
        venueId: reviewData.venueId,
        rating: reviewData.rating,
        categoryRatings: reviewData.categoryRatings || {},
        title: filteredContent.title,
        content: filteredContent.content,
        photos: reviewData.photos || [],
        visitDate: reviewData.visitDate || new Date().toISOString(),
        tags: reviewData.tags || [],
        recommendToFriends: reviewData.recommendToFriends || false,
        helpfulnessScore: 0,
        helpfulVotes: 0,
        unhelpfulVotes: 0,
        status: this.reviewConfig.autoModerationEnabled ? 'pending_moderation' : 'published',
        moderationFlags: [],
        reportCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Apply auto-moderation
      if (this.reviewConfig.autoModerationEnabled) {
        const moderationResult = await this.autoModerateReview(review);
        review.status = moderationResult.status;
        review.moderationFlags = moderationResult.flags;
      }

      // Save review
      this.reviews.set(review.id, review);
      await this.saveReviews();

      // Update venue reviews
      await this.updateVenueReviews(review.venueId, review);

      // Update user reviews
      await this.updateUserReviews(review.userId, review);

      // Update metrics
      await this.updateReviewMetrics(review.venueId);
      await this.updateReviewMetricsData();

      await this.auditService.logEvent('review_created', {
        review_id: review.id,
        venue_id: review.venueId,
        user_id: review.userId,
        rating: review.rating,
        status: review.status,
        timestamp: new Date().toISOString()
      });

      this.emit('reviewCreated', review);
      return review;
    } catch (error) {
      console.error('Failed to create review:', error);
      throw error;
    }
  }

  async updateReview(reviewId, updateData) {
    try {
      const review = this.reviews.get(reviewId);
      if (!review) {
        throw new Error('Review not found');
      }

      // Validate update data
      const validation = this.validateReviewUpdateData(updateData);
      if (!validation.isValid) {
        throw new Error(`Invalid update data: ${validation.errors.join(', ')}`);
      }

      // Apply content filtering to updated content
      const filteredContent = await this.filterReviewContent(updateData);

      // Update review
      const updatedReview = {
        ...review,
        ...updateData,
        title: filteredContent.title || review.title,
        content: filteredContent.content || review.content,
        updatedAt: new Date().toISOString()
      };

      // Re-apply auto-moderation if content changed
      if (updateData.title || updateData.content) {
        if (this.reviewConfig.autoModerationEnabled) {
          const moderationResult = await this.autoModerateReview(updatedReview);
          updatedReview.status = moderationResult.status;
          updatedReview.moderationFlags = moderationResult.flags;
        }
      }

      this.reviews.set(reviewId, updatedReview);
      await this.saveReviews();

      // Update related data
      await this.updateVenueReviews(updatedReview.venueId, updatedReview);
      await this.updateUserReviews(updatedReview.userId, updatedReview);
      await this.updateReviewMetrics(updatedReview.venueId);

      await this.auditService.logEvent('review_updated', {
        review_id: reviewId,
        venue_id: updatedReview.venueId,
        user_id: updatedReview.userId,
        changes: Object.keys(updateData),
        timestamp: new Date().toISOString()
      });

      this.emit('reviewUpdated', updatedReview);
      return updatedReview;
    } catch (error) {
      console.error('Failed to update review:', error);
      throw error;
    }
  }

  async deleteReview(reviewId, userId) {
    try {
      const review = this.reviews.get(reviewId);
      if (!review) {
        throw new Error('Review not found');
      }

      if (review.userId !== userId) {
        throw new Error('Unauthorized: User can only delete their own reviews');
      }

      // Mark as deleted instead of hard delete
      const deletedReview = {
        ...review,
        status: 'deleted',
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.reviews.set(reviewId, deletedReview);
      await this.saveReviews();

      // Update related data
      await this.updateVenueReviews(review.venueId, deletedReview);
      await this.updateUserReviews(review.userId, deletedReview);
      await this.updateReviewMetrics(review.venueId);
      await this.updateReviewMetricsData();

      await this.auditService.logEvent('review_deleted', {
        review_id: reviewId,
        venue_id: review.venueId,
        user_id: userId,
        timestamp: new Date().toISOString()
      });

      this.emit('reviewDeleted', { reviewId, venueId: review.venueId, userId });
      return deletedReview;
    } catch (error) {
      console.error('Failed to delete review:', error);
      throw error;
    }
  }

  async getVenueReviews(venueId, options = {}) {
    try {
      const venueReviewData = this.venueReviews.get(venueId);
      if (!venueReviewData) {
        return {
          reviews: [],
          total: 0,
          averageRating: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
      }

      let reviews = venueReviewData.reviews
        .filter(reviewId => {
          const review = this.reviews.get(reviewId);
          return review && review.status === 'published';
        })
        .map(reviewId => this.reviews.get(reviewId));

      // Apply filters
      if (options.minRating) {
        reviews = reviews.filter(review => review.rating >= options.minRating);
      }

      if (options.maxRating) {
        reviews = reviews.filter(review => review.rating <= options.maxRating);
      }

      if (options.tags && options.tags.length > 0) {
        reviews = reviews.filter(review => 
          options.tags.some(tag => review.tags.includes(tag))
        );
      }

      // Apply sorting
      const sortBy = options.sortBy || 'newest';
      reviews = this.sortReviews(reviews, sortBy);

      // Apply pagination
      const page = options.page || 1;
      const limit = options.limit || 20;
      const startIndex = (page - 1) * limit;
      const paginatedReviews = reviews.slice(startIndex, startIndex + limit);

      return {
        reviews: paginatedReviews,
        total: reviews.length,
        page: page,
        limit: limit,
        totalPages: Math.ceil(reviews.length / limit),
        averageRating: venueReviewData.averageRating,
        ratingDistribution: venueReviewData.ratingDistribution
      };
    } catch (error) {
      console.error('Failed to get venue reviews:', error);
      throw error;
    }
  }

  async getUserReviews(userId, options = {}) {
    try {
      const userReviewData = this.userReviews.get(userId);
      if (!userReviewData) {
        return {
          reviews: [],
          total: 0
        };
      }

      let reviews = userReviewData.reviews
        .map(reviewId => this.reviews.get(reviewId))
        .filter(review => review && review.status !== 'deleted');

      // Apply sorting
      const sortBy = options.sortBy || 'newest';
      reviews = this.sortReviews(reviews, sortBy);

      // Apply pagination
      const page = options.page || 1;
      const limit = options.limit || 20;
      const startIndex = (page - 1) * limit;
      const paginatedReviews = reviews.slice(startIndex, startIndex + limit);

      return {
        reviews: paginatedReviews,
        total: reviews.length,
        page: page,
        limit: limit,
        totalPages: Math.ceil(reviews.length / limit)
      };
    } catch (error) {
      console.error('Failed to get user reviews:', error);
      throw error;
    }
  }

  async getUserReviewForVenue(userId, venueId) {
    try {
      const userReviewData = this.userReviews.get(userId);
      if (!userReviewData) return null;

      for (const reviewId of userReviewData.reviews) {
        const review = this.reviews.get(reviewId);
        if (review && review.venueId === venueId && review.status !== 'deleted') {
          return review;
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to get user review for venue:', error);
      return null;
    }
  }

  async voteHelpfulness(reviewId, userId, helpful) {
    try {
      const review = this.reviews.get(reviewId);
      if (!review) {
        throw new Error('Review not found');
      }

      if (review.userId === userId) {
        throw new Error('Users cannot vote on their own reviews');
      }

      // Check for existing vote
      const existingVoteId = `${reviewId}_${userId}`;
      const existingVote = this.helpfulnessVotes.get(existingVoteId);

      if (existingVote) {
        // Update existing vote
        if (existingVote.helpful !== helpful) {
          existingVote.helpful = helpful;
          existingVote.updatedAt = new Date().toISOString();
          
          // Update vote counts
          if (helpful) {
            review.helpfulVotes++;
            review.unhelpfulVotes--;
          } else {
            review.helpfulVotes--;
            review.unhelpfulVotes++;
          }
        }
      } else {
        // Create new vote
        const vote = {
          id: existingVoteId,
          reviewId: reviewId,
          userId: userId,
          helpful: helpful,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        this.helpfulnessVotes.set(existingVoteId, vote);

        // Update vote counts
        if (helpful) {
          review.helpfulVotes++;
        } else {
          review.unhelpfulVotes++;
        }
      }

      // Update helpfulness score
      review.helpfulnessScore = review.helpfulVotes - review.unhelpfulVotes;
      review.updatedAt = new Date().toISOString();

      this.reviews.set(reviewId, review);
      await this.saveReviews();
      await this.saveHelpfulnessVotes();

      // Update metrics
      this.reviewMetricsData.totalHelpfulnessVotes++;
      await this.saveReviewMetricsData();

      await this.auditService.logEvent('review_helpfulness_voted', {
        review_id: reviewId,
        voter_user_id: userId,
        helpful: helpful,
        helpfulness_score: review.helpfulnessScore,
        timestamp: new Date().toISOString()
      });

      this.emit('helpfulnessVoted', { reviewId, userId, helpful, helpfulnessScore: review.helpfulnessScore });
      return review;
    } catch (error) {
      console.error('Failed to vote helpfulness:', error);
      throw error;
    }
  }

  async reportReview(reviewId, userId, reason, description = '') {
    try {
      const review = this.reviews.get(reviewId);
      if (!review) {
        throw new Error('Review not found');
      }

      if (review.userId === userId) {
        throw new Error('Users cannot report their own reviews');
      }

      const report = {
        id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        reviewId: reviewId,
        reporterId: userId,
        reason: reason,
        description: description,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.reviewReports.set(report.id, report);
      await this.saveReviewReports();

      // Update review report count
      review.reportCount++;
      review.updatedAt = new Date().toISOString();
      this.reviews.set(reviewId, review);
      await this.saveReviews();

      // Auto-hide review if it reaches threshold
      if (review.reportCount >= 5 && review.status === 'published') {
        review.status = 'hidden_reports';
        await this.saveReviews();
      }

      // Update metrics
      this.reviewMetricsData.reportedReviews++;
      await this.saveReviewMetricsData();

      await this.auditService.logEvent('review_reported', {
        review_id: reviewId,
        reporter_user_id: userId,
        reason: reason,
        report_count: review.reportCount,
        timestamp: new Date().toISOString()
      });

      this.emit('reviewReported', { reviewId, userId, reason, reportCount: review.reportCount });
      return report;
    } catch (error) {
      console.error('Failed to report review:', error);
      throw error;
    }
  }

  async moderateReview(reviewId, moderatorId, action, reason = '') {
    try {
      const review = this.reviews.get(reviewId);
      if (!review) {
        throw new Error('Review not found');
      }

      const moderation = {
        reviewId: reviewId,
        moderatorId: moderatorId,
        action: action,
        reason: reason,
        previousStatus: review.status,
        timestamp: new Date().toISOString()
      };

      this.reviewModeration.set(reviewId, moderation);
      await this.saveReviewModeration();

      // Update review status based on action
      switch (action) {
        case 'approved':
          review.status = 'published';
          break;
        case 'rejected':
          review.status = 'rejected';
          break;
        case 'flagged':
          review.status = 'flagged';
          break;
        case 'hidden':
          review.status = 'hidden';
          break;
      }

      review.updatedAt = new Date().toISOString();
      this.reviews.set(reviewId, review);
      await this.saveReviews();

      // Update metrics
      this.reviewMetricsData.moderatedReviews++;
      await this.saveReviewMetricsData();

      await this.auditService.logEvent('review_moderated', {
        review_id: reviewId,
        moderator_id: moderatorId,
        action: action,
        previous_status: moderation.previousStatus,
        new_status: review.status,
        timestamp: new Date().toISOString()
      });

      this.emit('reviewModerated', { reviewId, action, status: review.status });
      return review;
    } catch (error) {
      console.error('Failed to moderate review:', error);
      throw error;
    }
  }

  async autoModerateReview(review) {
    try {
      const flags = [];
      let status = 'published';

      // Profanity filter
      if (this.reviewConfig.profanityFilterEnabled) {
        if (this.containsProfanity(review.title) || this.containsProfanity(review.content)) {
          flags.push('profanity');
          status = 'pending_moderation';
        }
      }

      // Spam detection
      if (this.isSpamContent(review.content)) {
        flags.push('spam');
        status = 'pending_moderation';
      }

      // Length validation
      if (review.content.length < this.reviewConfig.minReviewLength) {
        flags.push('too_short');
        status = 'pending_moderation';
      }

      // Suspicious patterns
      if (this.hasSuspiciousPatterns(review.content)) {
        flags.push('suspicious_patterns');
        status = 'pending_moderation';
      }

      return { status, flags };
    } catch (error) {
      console.error('Failed to auto-moderate review:', error);
      return { status: 'pending_moderation', flags: ['auto_moderation_error'] };
    }
  }

  validateReviewData(reviewData) {
    const errors = [];

    if (!reviewData.userId) {
      errors.push('User ID is required');
    }

    if (!reviewData.venueId) {
      errors.push('Venue ID is required');
    }

    if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
      errors.push('Rating must be between 1 and 5');
    }

    if (!reviewData.title || reviewData.title.trim().length === 0) {
      errors.push('Review title is required');
    }

    if (!reviewData.content || reviewData.content.trim().length < this.reviewConfig.minReviewLength) {
      errors.push(`Review content must be at least ${this.reviewConfig.minReviewLength} characters`);
    }

    if (reviewData.content && reviewData.content.length > this.reviewConfig.maxReviewLength) {
      errors.push(`Review content must not exceed ${this.reviewConfig.maxReviewLength} characters`);
    }

    if (reviewData.photos && reviewData.photos.length > this.reviewConfig.maxPhotos) {
      errors.push(`Maximum ${this.reviewConfig.maxPhotos} photos allowed`);
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  validateReviewUpdateData(updateData) {
    const errors = [];

    if (updateData.rating && (updateData.rating < 1 || updateData.rating > 5)) {
      errors.push('Rating must be between 1 and 5');
    }

    if (updateData.content && updateData.content.length < this.reviewConfig.minReviewLength) {
      errors.push(`Review content must be at least ${this.reviewConfig.minReviewLength} characters`);
    }

    if (updateData.content && updateData.content.length > this.reviewConfig.maxReviewLength) {
      errors.push(`Review content must not exceed ${this.reviewConfig.maxReviewLength} characters`);
    }

    if (updateData.photos && updateData.photos.length > this.reviewConfig.maxPhotos) {
      errors.push(`Maximum ${this.reviewConfig.maxPhotos} photos allowed`);
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  async filterReviewContent(reviewData) {
    try {
      let filteredTitle = reviewData.title || '';
      let filteredContent = reviewData.content || '';

      // Basic profanity filtering
      if (this.reviewConfig.profanityFilterEnabled) {
        filteredTitle = this.filterProfanity(filteredTitle);
        filteredContent = this.filterProfanity(filteredContent);
      }

      return {
        title: filteredTitle,
        content: filteredContent
      };
    } catch (error) {
      console.error('Failed to filter review content:', error);
      return {
        title: reviewData.title || '',
        content: reviewData.content || ''
      };
    }
  }

  containsProfanity(text) {
    // Simple profanity detection - in real app would use sophisticated filtering
    const profanityWords = ['badword1', 'badword2']; // Placeholder
    const lowercaseText = text.toLowerCase();
    return profanityWords.some(word => lowercaseText.includes(word));
  }

  filterProfanity(text) {
    // Simple profanity filtering - in real app would use sophisticated filtering
    const profanityWords = ['badword1', 'badword2']; // Placeholder
    let filteredText = text;
    profanityWords.forEach(word => {
      const regex = new RegExp(word, 'gi');
      filteredText = filteredText.replace(regex, '*'.repeat(word.length));
    });
    return filteredText;
  }

  isSpamContent(content) {
    // Simple spam detection
    const spamIndicators = [
      /(.)\1{10,}/, // Repeated characters
      /http[s]?:\/\/[^\s]+/gi, // URLs
      /call\s*now/gi, // Promotional language
      /free\s*money/gi
    ];
    
    return spamIndicators.some(pattern => pattern.test(content));
  }

  hasSuspiciousPatterns(content) {
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /\b[A-Z]{5,}\b/g, // All caps words
      /(.{1,3})\1{5,}/, // Repeated patterns
      /\b\d{10,}\b/ // Long numbers (potential phone numbers)
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(content));
  }

  sortReviews(reviews, sortBy) {
    switch (sortBy) {
      case 'newest':
        return reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      case 'oldest':
        return reviews.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      case 'rating_high':
        return reviews.sort((a, b) => b.rating - a.rating);
      
      case 'rating_low':
        return reviews.sort((a, b) => a.rating - b.rating);
      
      case 'helpful':
        return reviews.sort((a, b) => b.helpfulnessScore - a.helpfulnessScore);
      
      default:
        return reviews;
    }
  }

  async updateVenueReviews(venueId, review) {
    try {
      if (!this.venueReviews.has(venueId)) {
        this.venueReviews.set(venueId, {
          venueId: venueId,
          reviews: [],
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          updatedAt: new Date().toISOString()
        });
      }

      const venueReviewData = this.venueReviews.get(venueId);

      // Add review to venue if not already present
      if (!venueReviewData.reviews.includes(review.id)) {
        venueReviewData.reviews.push(review.id);
      }

      // Recalculate metrics
      await this.updateReviewMetrics(venueId);
      await this.saveVenueReviews();
    } catch (error) {
      console.error('Failed to update venue reviews:', error);
    }
  }

  async updateUserReviews(userId, review) {
    try {
      if (!this.userReviews.has(userId)) {
        this.userReviews.set(userId, {
          userId: userId,
          reviews: [],
          totalReviews: 0,
          averageRating: 0,
          updatedAt: new Date().toISOString()
        });
      }

      const userReviewData = this.userReviews.get(userId);

      // Add review to user if not already present
      if (!userReviewData.reviews.includes(review.id)) {
        userReviewData.reviews.push(review.id);
      }

      // Recalculate user metrics
      const userReviews = userReviewData.reviews
        .map(reviewId => this.reviews.get(reviewId))
        .filter(r => r && r.status === 'published');

      userReviewData.totalReviews = userReviews.length;
      userReviewData.averageRating = userReviews.length > 0 ? 
        userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length : 0;
      userReviewData.updatedAt = new Date().toISOString();

      await this.saveUserReviews();
    } catch (error) {
      console.error('Failed to update user reviews:', error);
    }
  }

  async updateReviewMetrics(venueId) {
    try {
      const venueReviewData = this.venueReviews.get(venueId);
      if (!venueReviewData) return;

      // Get published reviews for this venue
      const publishedReviews = venueReviewData.reviews
        .map(reviewId => this.reviews.get(reviewId))
        .filter(review => review && review.status === 'published');

      // Calculate metrics
      const totalReviews = publishedReviews.length;
      const averageRating = totalReviews > 0 ? 
        publishedReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews : 0;

      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      publishedReviews.forEach(review => {
        ratingDistribution[review.rating]++;
      });

      // Update venue review data
      venueReviewData.totalReviews = totalReviews;
      venueReviewData.averageRating = averageRating;
      venueReviewData.ratingDistribution = ratingDistribution;
      venueReviewData.updatedAt = new Date().toISOString();

      // Store detailed metrics
      const metrics = {
        venueId: venueId,
        totalReviews: totalReviews,
        averageRating: averageRating,
        ratingDistribution: ratingDistribution,
        categoryAverages: this.calculateCategoryAverages(publishedReviews),
        helpfulnessStats: this.calculateHelpfulnessStats(publishedReviews),
        reviewTrends: this.calculateReviewTrends(publishedReviews),
        updatedAt: new Date().toISOString()
      };

      this.reviewMetrics.set(venueId, metrics);
      await this.saveReviewMetrics();
    } catch (error) {
      console.error('Failed to update review metrics:', error);
    }
  }

  async updateReviewMetricsData() {
    try {
      const allReviews = Array.from(this.reviews.values())
        .filter(review => review.status === 'published');

      this.reviewMetricsData.totalReviews = allReviews.length;
      this.reviewMetricsData.averageRating = allReviews.length > 0 ? 
        allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length : 0;

      // Calculate rating distribution
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      allReviews.forEach(review => {
        distribution[review.rating]++;
      });
      this.reviewMetricsData.ratingDistribution = distribution;

      await this.saveReviewMetricsData();
    } catch (error) {
      console.error('Failed to update review metrics data:', error);
    }
  }

  calculateCategoryAverages(reviews) {
    const categoryTotals = {};
    const categoryCounts = {};

    reviews.forEach(review => {
      if (review.categoryRatings) {
        Object.entries(review.categoryRatings).forEach(([category, rating]) => {
          if (!categoryTotals[category]) {
            categoryTotals[category] = 0;
            categoryCounts[category] = 0;
          }
          categoryTotals[category] += rating;
          categoryCounts[category]++;
        });
      }
    });

    const categoryAverages = {};
    Object.keys(categoryTotals).forEach(category => {
      categoryAverages[category] = categoryTotals[category] / categoryCounts[category];
    });

    return categoryAverages;
  }

  calculateHelpfulnessStats(reviews) {
    const totalHelpfulVotes = reviews.reduce((sum, review) => sum + review.helpfulVotes, 0);
    const totalUnhelpfulVotes = reviews.reduce((sum, review) => sum + review.unhelpfulVotes, 0);
    const totalVotes = totalHelpfulVotes + totalUnhelpfulVotes;
    
    return {
      totalHelpfulVotes,
      totalUnhelpfulVotes,
      totalVotes,
      helpfulnessRatio: totalVotes > 0 ? totalHelpfulVotes / totalVotes : 0
    };
  }

  calculateReviewTrends(reviews) {
    const last30Days = reviews.filter(review => {
      const reviewDate = new Date(review.createdAt);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return reviewDate >= thirtyDaysAgo;
    });

    const last7Days = reviews.filter(review => {
      const reviewDate = new Date(review.createdAt);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return reviewDate >= sevenDaysAgo;
    });

    return {
      last30Days: last30Days.length,
      last7Days: last7Days.length,
      averageRating30Days: last30Days.length > 0 ? 
        last30Days.reduce((sum, r) => sum + r.rating, 0) / last30Days.length : 0,
      averageRating7Days: last7Days.length > 0 ? 
        last7Days.reduce((sum, r) => sum + r.rating, 0) / last7Days.length : 0
    };
  }

  async saveReviews() {
    try {
      const reviewList = Array.from(this.reviews.values());
      await this.storageService.setItem('reviews', reviewList);
    } catch (error) {
      console.error('Failed to save reviews:', error);
    }
  }

  async saveVenueReviews() {
    try {
      const venueReviewList = Array.from(this.venueReviews.values());
      await this.storageService.setItem('venue_reviews', venueReviewList);
    } catch (error) {
      console.error('Failed to save venue reviews:', error);
    }
  }

  async saveUserReviews() {
    try {
      const userReviewList = Array.from(this.userReviews.values());
      await this.storageService.setItem('user_reviews', userReviewList);
    } catch (error) {
      console.error('Failed to save user reviews:', error);
    }
  }

  async saveReviewMetrics() {
    try {
      const metricsList = Array.from(this.reviewMetrics.values());
      await this.storageService.setItem('review_metrics', metricsList);
    } catch (error) {
      console.error('Failed to save review metrics:', error);
    }
  }

  async saveReviewReports() {
    try {
      const reportList = Array.from(this.reviewReports.values());
      await this.storageService.setItem('review_reports', reportList);
    } catch (error) {
      console.error('Failed to save review reports:', error);
    }
  }

  async saveReviewModeration() {
    try {
      const moderationList = Array.from(this.reviewModeration.values());
      await this.storageService.setItem('review_moderation', moderationList);
    } catch (error) {
      console.error('Failed to save review moderation:', error);
    }
  }

  async saveHelpfulnessVotes() {
    try {
      const voteList = Array.from(this.helpfulnessVotes.values());
      await this.storageService.setItem('helpfulness_votes', voteList);
    } catch (error) {
      console.error('Failed to save helpfulness votes:', error);
    }
  }

  async saveReviewMetricsData() {
    try {
      await this.storageService.setItem('review_metrics_data', this.reviewMetricsData);
    } catch (error) {
      console.error('Failed to save review metrics data:', error);
    }
  }

  getReviews() {
    return Array.from(this.reviews.values());
  }

  getReviewById(reviewId) {
    return this.reviews.get(reviewId);
  }

  getReviewCategories() {
    return this.reviewCategories;
  }

  getReportReasons() {
    return this.reportReasons;
  }

  getModerationActions() {
    return this.moderationActions;
  }

  getReviewMetricsData() {
    return this.reviewMetricsData;
  }

  getVenueMetrics(venueId) {
    return this.reviewMetrics.get(venueId);
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
      this.listeners = [];
      this.reviews.clear();
      this.venueReviews.clear();
      this.userReviews.clear();
      this.reviewMetrics.clear();
      this.reviewReports.clear();
      this.reviewModeration.clear();
      this.helpfulnessVotes.clear();
      this.initialized = false;
      
      await this.auditService.logEvent('venue_review_service_cleanup', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to cleanup VenueReviewService:', error);
    }
  }
}

export { VenueReviewService };