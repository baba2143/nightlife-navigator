import { LocalStorageService } from './LocalStorageService';
import { AuditLogService } from './AuditLogService';

class ReviewManagementService {
  constructor() {
    this.initialized = false;
    this.storageService = null;
    this.auditService = null;
    this.reviews = new Map();
    this.storeReviews = {
      ios: [],
      android: []
    };
    this.reviewResponses = new Map();
    this.reviewAnalytics = {
      ratings: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      averageRating: 0,
      totalReviews: 0,
      responseRate: 0,
      sentiment: { positive: 0, neutral: 0, negative: 0 }
    };
    this.listeners = [];
    this.monitoringSettings = {
      checkInterval: 60000, // 1 minute
      autoResponse: false,
      alertThreshold: 3.0,
      enabled: true
    };
    this.reviewTemplates = {};
  }

  static getInstance() {
    if (!ReviewManagementService.instance) {
      ReviewManagementService.instance = new ReviewManagementService();
    }
    return ReviewManagementService.instance;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      this.storageService = LocalStorageService.getInstance();
      this.auditService = AuditLogService.getInstance();
      
      await this.loadReviews();
      await this.loadReviewResponses();
      await this.loadReviewAnalytics();
      await this.loadMonitoringSettings();
      await this.initializeReviewTemplates();
      await this.startReviewMonitoring();
      
      this.initialized = true;
      
      await this.auditService.logEvent('review_management_service_initialized', {
        timestamp: new Date().toISOString(),
        total_reviews: this.reviews.size,
        average_rating: this.reviewAnalytics.averageRating
      });
      
      this.emit('serviceInitialized');
    } catch (error) {
      console.error('Failed to initialize ReviewManagementService:', error);
      throw error;
    }
  }

  async loadReviews() {
    try {
      const reviews = await this.storageService.getItem('app_reviews');
      const reviewList = reviews || [];
      
      this.reviews.clear();
      reviewList.forEach(review => {
        this.reviews.set(review.id, review);
      });

      // Load platform-specific reviews
      const iosReviews = await this.storageService.getItem('ios_reviews');
      const androidReviews = await this.storageService.getItem('android_reviews');
      
      this.storeReviews.ios = iosReviews || [];
      this.storeReviews.android = androidReviews || [];
    } catch (error) {
      console.error('Failed to load reviews:', error);
      this.reviews.clear();
    }
  }

  async loadReviewResponses() {
    try {
      const responses = await this.storageService.getItem('review_responses');
      const responseList = responses || [];
      
      this.reviewResponses.clear();
      responseList.forEach(response => {
        this.reviewResponses.set(response.reviewId, response);
      });
    } catch (error) {
      console.error('Failed to load review responses:', error);
      this.reviewResponses.clear();
    }
  }

  async loadReviewAnalytics() {
    try {
      const analytics = await this.storageService.getItem('review_analytics');
      if (analytics) {
        this.reviewAnalytics = analytics;
      }
    } catch (error) {
      console.error('Failed to load review analytics:', error);
    }
  }

  async loadMonitoringSettings() {
    try {
      const settings = await this.storageService.getItem('review_monitoring_settings');
      if (settings) {
        this.monitoringSettings = { ...this.monitoringSettings, ...settings };
      }
    } catch (error) {
      console.error('Failed to load monitoring settings:', error);
    }
  }

  async initializeReviewTemplates() {
    try {
      const templates = await this.storageService.getItem('review_templates');
      this.reviewTemplates = templates || {
        thankYou: {
          title: 'Thank You Response',
          content: 'Thank you for your {rating}-star review! We appreciate your feedback and are glad you enjoy using Nightlife Navigator.',
          triggers: ['rating >= 4'],
          language: 'en'
        },
        improvement: {
          title: 'Improvement Response',
          content: 'Thank you for your feedback. We take all reviews seriously and are working to improve the app experience. Please contact us at support@nightlife-navigator.com if you have specific suggestions.',
          triggers: ['rating <= 3'],
          language: 'en'
        },
        bugReport: {
          title: 'Bug Report Response',
          content: 'We apologize for the technical issues you experienced. Our team is actively working on fixes. Please update to the latest version and contact support if problems persist.',
          triggers: ['keywords: bug, crash, error, broken'],
          language: 'en'
        },
        feature: {
          title: 'Feature Request Response',
          content: 'Thank you for your feature suggestion! We value user input and will consider this for future updates. Keep an eye on our updates for new features.',
          triggers: ['keywords: feature, suggest, would like, need'],
          language: 'en'
        },
        japanese: {
          title: 'Japanese Response',
          content: 'レビューをありがとうございます！お客様のフィードバックは非常に重要です。今後もより良いアプリを提供できるよう努力してまいります。',
          triggers: ['language: ja'],
          language: 'ja'
        }
      };
      
      await this.storageService.setItem('review_templates', this.reviewTemplates);
    } catch (error) {
      console.error('Failed to initialize review templates:', error);
    }
  }

  async startReviewMonitoring() {
    if (!this.monitoringSettings.enabled) return;

    setInterval(async () => {
      try {
        await this.checkForNewReviews();
        await this.updateAnalytics();
      } catch (error) {
        console.error('Review monitoring error:', error);
      }
    }, this.monitoringSettings.checkInterval);
  }

  async checkForNewReviews() {
    try {
      // Simulate checking for new reviews from app stores
      const newReviews = await this.fetchNewReviews();
      
      for (const review of newReviews) {
        await this.processNewReview(review);
      }

      if (newReviews.length > 0) {
        await this.auditService.logEvent('new_reviews_processed', {
          count: newReviews.length,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to check for new reviews:', error);
    }
  }

  async fetchNewReviews() {
    // Simulate fetching new reviews from app stores
    const mockReviews = [];
    
    // Random chance of new reviews
    if (Math.random() < 0.1) {
      const reviewCount = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < reviewCount; i++) {
        const review = this.generateMockReview();
        mockReviews.push(review);
      }
    }
    
    return mockReviews;
  }

  generateMockReview() {
    const ratings = [1, 2, 3, 4, 5];
    const platforms = ['ios', 'android'];
    const titles = [
      'Great app!',
      'Love the venue recommendations',
      'Could be better',
      'Amazing nightlife guide',
      'Needs improvement',
      'Perfect for finding bars',
      'App crashes sometimes'
    ];
    const contents = [
      'This app has helped me discover so many great places in the city. Highly recommend!',
      'The venue recommendations are spot on. Love the user interface too.',
      'Good app but sometimes crashes when loading venue details.',
      'Perfect for planning nights out. The map feature is very useful.',
      'App is okay but could use more venues in my area.',
      'Love how easy it is to find bars and clubs nearby.',
      'Great concept but needs more stable performance.'
    ];
    const usernames = [
      'NightOwl2024',
      'CityExplorer',
      'PartyFinder',
      'BarHopper',
      'NightlifeJunkie',
      'TechReviewer',
      'AppUser123'
    ];

    return {
      id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      platform: platforms[Math.floor(Math.random() * platforms.length)],
      rating: ratings[Math.floor(Math.random() * ratings.length)],
      title: titles[Math.floor(Math.random() * titles.length)],
      content: contents[Math.floor(Math.random() * contents.length)],
      username: usernames[Math.floor(Math.random() * usernames.length)],
      date: new Date().toISOString(),
      version: '1.0.0',
      language: 'en',
      country: 'US',
      helpful: Math.floor(Math.random() * 10),
      responded: false
    };
  }

  async processNewReview(review) {
    try {
      // Store the review
      this.reviews.set(review.id, review);
      
      // Add to platform-specific reviews
      if (review.platform === 'ios') {
        this.storeReviews.ios.push(review);
      } else if (review.platform === 'android') {
        this.storeReviews.android.push(review);
      }

      // Save to storage
      await this.saveReviews();

      // Analyze sentiment
      const sentiment = this.analyzeSentiment(review);
      review.sentiment = sentiment;

      // Check for auto-response
      if (this.monitoringSettings.autoResponse) {
        await this.generateAutoResponse(review);
      }

      // Check for alerts
      if (review.rating <= this.monitoringSettings.alertThreshold) {
        await this.triggerAlert(review);
      }

      await this.auditService.logEvent('new_review_processed', {
        review_id: review.id,
        platform: review.platform,
        rating: review.rating,
        sentiment: sentiment,
        timestamp: new Date().toISOString()
      });

      this.emit('newReview', review);
    } catch (error) {
      console.error('Failed to process new review:', error);
    }
  }

  async saveReviews() {
    try {
      const reviewList = Array.from(this.reviews.values());
      await this.storageService.setItem('app_reviews', reviewList);
      await this.storageService.setItem('ios_reviews', this.storeReviews.ios);
      await this.storageService.setItem('android_reviews', this.storeReviews.android);
    } catch (error) {
      console.error('Failed to save reviews:', error);
    }
  }

  analyzeSentiment(review) {
    const positiveWords = ['great', 'love', 'amazing', 'perfect', 'excellent', 'awesome', 'fantastic', 'wonderful'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'useless', 'broken'];
    
    const text = (review.title + ' ' + review.content).toLowerCase();
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveWords.forEach(word => {
      if (text.includes(word)) positiveCount++;
    });
    
    negativeWords.forEach(word => {
      if (text.includes(word)) negativeCount++;
    });
    
    if (positiveCount > negativeCount) {
      return 'positive';
    } else if (negativeCount > positiveCount) {
      return 'negative';
    } else {
      return 'neutral';
    }
  }

  async generateAutoResponse(review) {
    try {
      const template = this.selectResponseTemplate(review);
      if (!template) return;

      const response = {
        id: `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        reviewId: review.id,
        template: template.title,
        content: this.personalizeResponse(template.content, review),
        generatedAt: new Date().toISOString(),
        posted: false,
        automatic: true
      };

      this.reviewResponses.set(review.id, response);
      await this.saveReviewResponses();

      await this.auditService.logEvent('auto_response_generated', {
        review_id: review.id,
        response_id: response.id,
        template: template.title,
        timestamp: new Date().toISOString()
      });

      this.emit('autoResponseGenerated', { review, response });
    } catch (error) {
      console.error('Failed to generate auto response:', error);
    }
  }

  selectResponseTemplate(review) {
    const templates = Object.values(this.reviewTemplates);
    
    for (const template of templates) {
      if (this.matchesTemplate(review, template)) {
        return template;
      }
    }
    
    // Default template based on rating
    if (review.rating >= 4) {
      return this.reviewTemplates.thankYou;
    } else if (review.rating <= 3) {
      return this.reviewTemplates.improvement;
    }
    
    return null;
  }

  matchesTemplate(review, template) {
    for (const trigger of template.triggers) {
      if (trigger.startsWith('rating')) {
        const condition = trigger.replace('rating ', '');
        if (eval(`${review.rating} ${condition}`)) {
          return true;
        }
      } else if (trigger.startsWith('keywords:')) {
        const keywords = trigger.replace('keywords: ', '').split(', ');
        const text = (review.title + ' ' + review.content).toLowerCase();
        if (keywords.some(keyword => text.includes(keyword))) {
          return true;
        }
      } else if (trigger.startsWith('language:')) {
        const language = trigger.replace('language: ', '');
        if (review.language === language) {
          return true;
        }
      }
    }
    return false;
  }

  personalizeResponse(content, review) {
    return content
      .replace('{rating}', review.rating.toString())
      .replace('{username}', review.username)
      .replace('{version}', review.version);
  }

  async saveReviewResponses() {
    try {
      const responseList = Array.from(this.reviewResponses.values());
      await this.storageService.setItem('review_responses', responseList);
    } catch (error) {
      console.error('Failed to save review responses:', error);
    }
  }

  async triggerAlert(review) {
    try {
      const alert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'low_rating',
        reviewId: review.id,
        rating: review.rating,
        message: `Low rating alert: ${review.rating} stars from ${review.username}`,
        timestamp: new Date().toISOString(),
        acknowledged: false
      };

      await this.auditService.logEvent('review_alert_triggered', {
        alert_id: alert.id,
        review_id: review.id,
        rating: review.rating,
        timestamp: new Date().toISOString()
      });

      this.emit('reviewAlert', alert);
    } catch (error) {
      console.error('Failed to trigger alert:', error);
    }
  }

  async updateAnalytics() {
    try {
      const allReviews = Array.from(this.reviews.values());
      
      // Update rating distribution
      const ratings = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let totalRating = 0;
      let totalReviews = allReviews.length;
      
      allReviews.forEach(review => {
        ratings[review.rating]++;
        totalRating += review.rating;
      });

      const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

      // Update sentiment analysis
      const sentiment = { positive: 0, neutral: 0, negative: 0 };
      allReviews.forEach(review => {
        if (review.sentiment) {
          sentiment[review.sentiment]++;
        }
      });

      // Calculate response rate
      const responseCount = Array.from(this.reviewResponses.values()).length;
      const responseRate = totalReviews > 0 ? (responseCount / totalReviews) * 100 : 0;

      this.reviewAnalytics = {
        ratings,
        averageRating: Math.round(averageRating * 100) / 100,
        totalReviews,
        responseRate: Math.round(responseRate * 100) / 100,
        sentiment,
        lastUpdated: new Date().toISOString()
      };

      await this.storageService.setItem('review_analytics', this.reviewAnalytics);
      this.emit('analyticsUpdated', this.reviewAnalytics);
    } catch (error) {
      console.error('Failed to update analytics:', error);
    }
  }

  async respondToReview(reviewId, responseContent, userId = null) {
    try {
      const review = this.reviews.get(reviewId);
      if (!review) {
        throw new Error('Review not found');
      }

      const response = {
        id: `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        reviewId: reviewId,
        content: responseContent,
        userId: userId,
        createdAt: new Date().toISOString(),
        posted: false,
        automatic: false
      };

      this.reviewResponses.set(reviewId, response);
      await this.saveReviewResponses();

      review.responded = true;
      await this.saveReviews();

      await this.auditService.logEvent('review_response_created', {
        review_id: reviewId,
        response_id: response.id,
        user_id: userId,
        timestamp: new Date().toISOString()
      });

      this.emit('reviewResponded', { review, response });
      return response;
    } catch (error) {
      console.error('Failed to respond to review:', error);
      throw error;
    }
  }

  async getReviews(filters = {}) {
    try {
      let reviews = Array.from(this.reviews.values());

      // Apply filters
      if (filters.platform) {
        reviews = reviews.filter(review => review.platform === filters.platform);
      }
      if (filters.rating) {
        reviews = reviews.filter(review => review.rating === filters.rating);
      }
      if (filters.sentiment) {
        reviews = reviews.filter(review => review.sentiment === filters.sentiment);
      }
      if (filters.responded !== undefined) {
        reviews = reviews.filter(review => review.responded === filters.responded);
      }
      if (filters.dateFrom) {
        reviews = reviews.filter(review => new Date(review.date) >= new Date(filters.dateFrom));
      }
      if (filters.dateTo) {
        reviews = reviews.filter(review => new Date(review.date) <= new Date(filters.dateTo));
      }

      // Sort by date (newest first)
      reviews.sort((a, b) => new Date(b.date) - new Date(a.date));

      return reviews;
    } catch (error) {
      console.error('Failed to get reviews:', error);
      return [];
    }
  }

  async getReviewById(reviewId) {
    try {
      const review = this.reviews.get(reviewId);
      const response = this.reviewResponses.get(reviewId);
      
      return {
        review,
        response
      };
    } catch (error) {
      console.error('Failed to get review by ID:', error);
      return null;
    }
  }

  async getAnalytics() {
    try {
      return this.reviewAnalytics;
    } catch (error) {
      console.error('Failed to get analytics:', error);
      return null;
    }
  }

  async updateMonitoringSettings(settings) {
    try {
      this.monitoringSettings = { ...this.monitoringSettings, ...settings };
      await this.storageService.setItem('review_monitoring_settings', this.monitoringSettings);

      await this.auditService.logEvent('monitoring_settings_updated', {
        settings: this.monitoringSettings,
        timestamp: new Date().toISOString()
      });

      this.emit('monitoringSettingsUpdated', this.monitoringSettings);
      return this.monitoringSettings;
    } catch (error) {
      console.error('Failed to update monitoring settings:', error);
      throw error;
    }
  }

  async exportReviews(format = 'json', filters = {}) {
    try {
      const reviews = await this.getReviews(filters);
      
      if (format === 'json') {
        return JSON.stringify(reviews, null, 2);
      } else if (format === 'csv') {
        const headers = ['ID', 'Platform', 'Rating', 'Title', 'Content', 'Username', 'Date', 'Sentiment', 'Responded'];
        const rows = reviews.map(review => [
          review.id,
          review.platform,
          review.rating,
          review.title,
          review.content,
          review.username,
          review.date,
          review.sentiment,
          review.responded
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
      }
      
      return reviews;
    } catch (error) {
      console.error('Failed to export reviews:', error);
      throw error;
    }
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
      this.reviewResponses.clear();
      this.storeReviews = { ios: [], android: [] };
      this.initialized = false;
      
      await this.auditService.logEvent('review_management_service_cleanup', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to cleanup ReviewManagementService:', error);
    }
  }
}

export { ReviewManagementService };