import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from './AuthService';

class ReviewService {
  constructor() {
    this.initialized = false;
    this.reviews = new Map();
    this.listeners = [];
    this.storageKeys = {
      reviews: '@nightlife_navigator:reviews',
      reviewStats: '@nightlife_navigator:review_stats',
    };
  }

  static getInstance() {
    if (!ReviewService.instance) {
      ReviewService.instance = new ReviewService();
    }
    return ReviewService.instance;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      await this.loadReviews();
      await this.initializeMockReviews();
      
      this.initialized = true;
      console.log('ReviewService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ReviewService:', error);
      throw error;
    }
  }

  async loadReviews() {
    try {
      const stored = await AsyncStorage.getItem(this.storageKeys.reviews);
      const reviewsList = stored ? JSON.parse(stored) : [];

      this.reviews.clear();
      reviewsList.forEach(review => {
        this.reviews.set(review.id, {
          ...review,
          createdAt: new Date(review.createdAt),
          updatedAt: review.updatedAt ? new Date(review.updatedAt) : null,
        });
      });

      console.log(`Loaded ${this.reviews.size} reviews`);
    } catch (error) {
      console.error('Failed to load reviews:', error);
      this.reviews.clear();
    }
  }

  async saveReviews() {
    try {
      const reviewsList = Array.from(this.reviews.values()).map(review => ({
        ...review,
        createdAt: review.createdAt.toISOString(),
        updatedAt: review.updatedAt ? review.updatedAt.toISOString() : null,
      }));

      await AsyncStorage.setItem(
        this.storageKeys.reviews,
        JSON.stringify(reviewsList)
      );
    } catch (error) {
      console.error('Failed to save reviews:', error);
    }
  }

  async initializeMockReviews() {
    if (this.reviews.size === 0) {
      const mockReviews = [
        {
          id: 'review_1',
          venueId: 'venue_1',
          venueName: '渋谷 VISION',
          userId: 'user_mock_1',
          userName: '田中太郎',
          rating: 4.5,
          title: '音響設備が素晴らしい！',
          content: '音響設備のクオリティが非常に高く、DJの音楽を最高の状態で楽しめました。スタッフの対応も丁寧で、また来たいと思います。',
          categories: {
            music: 5,
            atmosphere: 4,
            service: 4,
            drinks: 4,
            price: 3,
          },
          tags: ['音響良し', 'DJ', 'ダンス'],
          images: [],
          helpful: 12,
          unhelpful: 1,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          updatedAt: null,
        },
        {
          id: 'review_2',
          venueId: 'venue_2',
          venueName: '六本木 バーン',
          userId: 'user_mock_2',
          userName: '佐藤花子',
          rating: 4.0,
          title: 'カクテルが美味しい大人の空間',
          content: 'バーテンダーの技術が高く、どのカクテルも絶品でした。少し価格は高めですが、雰囲気とサービスを考えると妥当だと思います。',
          categories: {
            drinks: 5,
            atmosphere: 4,
            service: 5,
            music: 3,
            price: 3,
          },
          tags: ['カクテル', '大人', '高級'],
          images: [],
          helpful: 8,
          unhelpful: 0,
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          updatedAt: null,
        },
        {
          id: 'review_3',
          venueId: 'venue_3',
          venueName: '新宿 ラウンジ アジュール',
          userId: 'user_mock_3',
          userName: '山田次郎',
          rating: 3.5,
          title: '落ち着いた雰囲気で会話を楽しめる',
          content: 'ゆったりとした空間で友人との時間を過ごせました。料理も美味しかったです。ただ、もう少し音楽の音量を下げてもらえるとより良いと思います。',
          categories: {
            atmosphere: 4,
            service: 4,
            drinks: 3,
            music: 2,
            price: 4,
          },
          tags: ['落ち着き', '会話', 'ラウンジ'],
          images: [],
          helpful: 5,
          unhelpful: 2,
          createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
          updatedAt: null,
        }
      ];

      for (const review of mockReviews) {
        this.reviews.set(review.id, review);
      }

      await this.saveReviews();
      console.log('Mock reviews initialized');
    }
  }

  // レビューを作成
  async createReview(reviewData) {
    try {
      const currentUser = AuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('レビューを投稿するにはログインが必要です');
      }

      const review = {
        id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        venueId: reviewData.venueId,
        venueName: reviewData.venueName,
        userId: currentUser.id,
        userName: currentUser.displayName,
        rating: reviewData.rating,
        title: reviewData.title,
        content: reviewData.content,
        categories: reviewData.categories || {},
        tags: reviewData.tags || [],
        images: reviewData.images || [],
        helpful: 0,
        unhelpful: 0,
        createdAt: new Date(),
        updatedAt: null,
      };

      // バリデーション
      if (!review.venueId || !review.rating || !review.title || !review.content) {
        throw new Error('必須項目を入力してください');
      }

      if (review.rating < 1 || review.rating > 5) {
        throw new Error('評価は1-5の範囲で入力してください');
      }

      if (review.title.length < 5 || review.title.length > 100) {
        throw new Error('タイトルは5-100文字で入力してください');
      }

      if (review.content.length < 10 || review.content.length > 1000) {
        throw new Error('レビュー内容は10-1000文字で入力してください');
      }

      // 重複チェック（同じユーザーが同じ店舗に複数レビューを投稿することを防ぐ）
      const existingReview = Array.from(this.reviews.values()).find(
        r => r.venueId === review.venueId && r.userId === review.userId
      );

      if (existingReview) {
        throw new Error('この店舗には既にレビューを投稿済みです。編集をご利用ください。');
      }

      this.reviews.set(review.id, review);
      await this.saveReviews();

      this.emit('reviewCreated', review);
      this.emit('reviewsUpdated', this.getReviewsByVenue(review.venueId));

      return { success: true, review };
    } catch (error) {
      console.error('Failed to create review:', error);
      return { success: false, error: error.message };
    }
  }

  // レビューを更新
  async updateReview(reviewId, updates) {
    try {
      const review = this.reviews.get(reviewId);
      if (!review) {
        throw new Error('レビューが見つかりません');
      }

      const currentUser = AuthService.getCurrentUser();
      if (!currentUser || review.userId !== currentUser.id) {
        throw new Error('自分のレビューのみ編集できます');
      }

      // バリデーション
      if (updates.rating && (updates.rating < 1 || updates.rating > 5)) {
        throw new Error('評価は1-5の範囲で入力してください');
      }

      if (updates.title && (updates.title.length < 5 || updates.title.length > 100)) {
        throw new Error('タイトルは5-100文字で入力してください');
      }

      if (updates.content && (updates.content.length < 10 || updates.content.length > 1000)) {
        throw new Error('レビュー内容は10-1000文字で入力してください');
      }

      const updatedReview = {
        ...review,
        ...updates,
        updatedAt: new Date(),
      };

      this.reviews.set(reviewId, updatedReview);
      await this.saveReviews();

      this.emit('reviewUpdated', updatedReview);
      this.emit('reviewsUpdated', this.getReviewsByVenue(updatedReview.venueId));

      return { success: true, review: updatedReview };
    } catch (error) {
      console.error('Failed to update review:', error);
      return { success: false, error: error.message };
    }
  }

  // レビューを削除
  async deleteReview(reviewId) {
    try {
      const review = this.reviews.get(reviewId);
      if (!review) {
        throw new Error('レビューが見つかりません');
      }

      const currentUser = AuthService.getCurrentUser();
      if (!currentUser || review.userId !== currentUser.id) {
        throw new Error('自分のレビューのみ削除できます');
      }

      this.reviews.delete(reviewId);
      await this.saveReviews();

      this.emit('reviewDeleted', review);
      this.emit('reviewsUpdated', this.getReviewsByVenue(review.venueId));

      return { success: true };
    } catch (error) {
      console.error('Failed to delete review:', error);
      return { success: false, error: error.message };
    }
  }

  // レビューにヘルプフル投票
  async markReviewHelpful(reviewId, isHelpful = true) {
    try {
      const review = this.reviews.get(reviewId);
      if (!review) {
        throw new Error('レビューが見つかりません');
      }

      const currentUser = AuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('ログインが必要です');
      }

      if (review.userId === currentUser.id) {
        throw new Error('自分のレビューには投票できません');
      }

      // 実際の実装では、ユーザーの投票履歴を管理する必要がある
      const updatedReview = {
        ...review,
        helpful: isHelpful ? review.helpful + 1 : review.helpful,
        unhelpful: !isHelpful ? review.unhelpful + 1 : review.unhelpful,
      };

      this.reviews.set(reviewId, updatedReview);
      await this.saveReviews();

      this.emit('reviewVoted', updatedReview);

      return { success: true, review: updatedReview };
    } catch (error) {
      console.error('Failed to vote review:', error);
      return { success: false, error: error.message };
    }
  }

  // 店舗のレビュー一覧を取得
  getReviewsByVenue(venueId, options = {}) {
    const {
      limit = 20,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      minRating = null,
      maxRating = null,
    } = options;

    let reviews = Array.from(this.reviews.values()).filter(
      review => review.venueId === venueId
    );

    // 評価フィルタ
    if (minRating !== null) {
      reviews = reviews.filter(review => review.rating >= minRating);
    }
    if (maxRating !== null) {
      reviews = reviews.filter(review => review.rating <= maxRating);
    }

    // ソート
    reviews.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      
      if (sortOrder === 'desc') {
        return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
      } else {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      }
    });

    // ページネーション
    return reviews.slice(offset, offset + limit);
  }

  // ユーザーのレビュー一覧を取得
  getReviewsByUser(userId, options = {}) {
    const { limit = 20, offset = 0 } = options;

    const reviews = Array.from(this.reviews.values())
      .filter(review => review.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);

    return reviews.slice(offset, offset + limit);
  }

  // 店舗の評価統計を計算
  getVenueRatingStats(venueId) {
    const reviews = this.getReviewsByVenue(venueId);
    
    if (reviews.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        categoryAverages: {},
        recentReviews: [],
      };
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    // 評価分布
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      const rating = Math.round(review.rating);
      ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
    });

    // カテゴリ別平均
    const categoryAverages = {};
    const categoryTotals = {};
    const categoryCounts = {};

    reviews.forEach(review => {
      Object.entries(review.categories || {}).forEach(([category, rating]) => {
        if (!categoryTotals[category]) {
          categoryTotals[category] = 0;
          categoryCounts[category] = 0;
        }
        categoryTotals[category] += rating;
        categoryCounts[category]++;
      });
    });

    Object.keys(categoryTotals).forEach(category => {
      categoryAverages[category] = categoryTotals[category] / categoryCounts[category];
    });

    // 最新のレビュー（3件）
    const recentReviews = reviews
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 3);

    return {
      totalReviews: reviews.length,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
      categoryAverages,
      recentReviews,
    };
  }

  // 人気のタグを取得
  getPopularTags(venueId = null, limit = 10) {
    let reviews = Array.from(this.reviews.values());
    
    if (venueId) {
      reviews = reviews.filter(review => review.venueId === venueId);
    }

    const tagCounts = {};
    reviews.forEach(review => {
      review.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }));
  }

  // レビューを検索
  searchReviews(query, options = {}) {
    const {
      venueId = null,
      minRating = null,
      maxRating = null,
      limit = 20,
      offset = 0,
    } = options;

    let reviews = Array.from(this.reviews.values());

    // 店舗フィルタ
    if (venueId) {
      reviews = reviews.filter(review => review.venueId === venueId);
    }

    // 評価フィルタ
    if (minRating !== null) {
      reviews = reviews.filter(review => review.rating >= minRating);
    }
    if (maxRating !== null) {
      reviews = reviews.filter(review => review.rating <= maxRating);
    }

    // テキスト検索
    if (query && query.trim()) {
      const searchTerm = query.toLowerCase().trim();
      reviews = reviews.filter(review => 
        review.title.toLowerCase().includes(searchTerm) ||
        review.content.toLowerCase().includes(searchTerm) ||
        review.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // ソートと制限
    reviews.sort((a, b) => b.createdAt - a.createdAt);
    return reviews.slice(offset, offset + limit);
  }

  // レビューを取得
  getReview(reviewId) {
    return this.reviews.get(reviewId) || null;
  }

  // イベントシステム
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
      .forEach(listener => {
        try {
          listener.callback(data);
        } catch (error) {
          console.error(`Error in review event listener for ${eventType}:`, error);
        }
      });
  }

  async cleanup() {
    try {
      this.listeners = [];
      this.reviews.clear();
      this.initialized = false;
      console.log('ReviewService cleaned up');
    } catch (error) {
      console.error('Failed to cleanup ReviewService:', error);
    }
  }
}

export default ReviewService.getInstance();