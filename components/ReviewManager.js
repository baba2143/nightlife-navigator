import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ReviewService from '../services/ReviewService';
import AuthService from '../services/AuthService';

// カラーテーマ
const colors = {
  primary: '#ea5a7b',
  white: '#ffffff',
  background: '#fafafa',
  backgroundLight: '#fef7f7',
  text: '#333333',
  textSecondary: '#666666',
  border: '#e0e0e0',
  success: '#4caf50',
  error: '#f44336',
  warning: '#ff9800',
  star: '#ffd700',
};

// 星評価コンポーネント
const StarRating = ({ rating, size = 20, onPress = null, editable = false }) => {
  const stars = [];
  
  for (let i = 1; i <= 5; i++) {
    const filled = i <= rating;
    stars.push(
      <TouchableOpacity
        key={i}
        onPress={() => editable && onPress && onPress(i)}
        disabled={!editable}
        style={styles.starButton}
      >
        <Ionicons
          name={filled ? "star" : "star-outline"}
          size={size}
          color={filled ? colors.star : colors.border}
        />
      </TouchableOpacity>
    );
  }
  
  return <View style={styles.starContainer}>{stars}</View>;
};

// レビューアイテムコンポーネント
const ReviewItem = ({ review, onEdit, onDelete, showVenueName = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const currentUser = AuthService.getCurrentUser();
  const isMyReview = currentUser && review.userId === currentUser.id;

  const formatDate = (date) => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleHelpfulPress = async (isHelpful) => {
    const result = await ReviewService.markReviewHelpful(review.id, isHelpful);
    if (!result.success) {
      Alert.alert('エラー', result.error);
    }
  };

  return (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewUserInfo}>
          <Text style={styles.reviewUserName}>{review.userName}</Text>
          {showVenueName && (
            <Text style={styles.reviewVenueName}>{review.venueName}</Text>
          )}
          <Text style={styles.reviewDate}>
            {formatDate(review.createdAt)}
            {review.updatedAt && ' (編集済み)'}
          </Text>
        </View>
        {isMyReview && (
          <View style={styles.reviewActions}>
            <TouchableOpacity onPress={() => onEdit(review)} style={styles.actionButton}>
              <Ionicons name="pencil-outline" size={16} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(review)} style={styles.actionButton}>
              <Ionicons name="trash-outline" size={16} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.reviewRating}>
        <StarRating rating={review.rating} />
        <Text style={styles.ratingText}>{review.rating}</Text>
      </View>

      <Text style={styles.reviewTitle}>{review.title}</Text>
      
      <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
        <Text style={[styles.reviewContent, !isExpanded && styles.reviewContentCollapsed]}>
          {review.content}
        </Text>
        {review.content.length > 100 && (
          <Text style={styles.expandButton}>
            {isExpanded ? '折りたたむ' : 'もっと見る'}
          </Text>
        )}
      </TouchableOpacity>

      {review.tags.length > 0 && (
        <View style={styles.tagContainer}>
          {review.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {!isMyReview && (
        <View style={styles.helpfulSection}>
          <Text style={styles.helpfulLabel}>このレビューは参考になりましたか？</Text>
          <View style={styles.helpfulButtons}>
            <TouchableOpacity
              style={styles.helpfulButton}
              onPress={() => handleHelpfulPress(true)}
            >
              <Ionicons name="thumbs-up-outline" size={16} color={colors.success} />
              <Text style={styles.helpfulButtonText}>はい ({review.helpful})</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.helpfulButton}
              onPress={() => handleHelpfulPress(false)}
            >
              <Ionicons name="thumbs-down-outline" size={16} color={colors.error} />
              <Text style={styles.helpfulButtonText}>いいえ ({review.unhelpful})</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

// レビュー作成/編集フォーム
const ReviewForm = ({ venue, editReview, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    rating: editReview?.rating || 0,
    title: editReview?.title || '',
    content: editReview?.content || '',
    categories: editReview?.categories || {},
    tags: editReview?.tags?.join(', ') || '',
  });
  const [loading, setLoading] = useState(false);

  const categories = [
    { key: 'music', label: '音楽' },
    { key: 'atmosphere', label: '雰囲気' },
    { key: 'service', label: 'サービス' },
    { key: 'drinks', label: 'ドリンク' },
    { key: 'price', label: '価格' },
  ];

  const handleSubmit = async () => {
    if (formData.rating === 0) {
      Alert.alert('エラー', '総合評価を選択してください');
      return;
    }

    if (!formData.title.trim()) {
      Alert.alert('エラー', 'タイトルを入力してください');
      return;
    }

    if (!formData.content.trim()) {
      Alert.alert('エラー', 'レビュー内容を入力してください');
      return;
    }

    setLoading(true);
    try {
      const reviewData = {
        venueId: venue.id,
        venueName: venue.name,
        rating: formData.rating,
        title: formData.title.trim(),
        content: formData.content.trim(),
        categories: formData.categories,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      };

      let result;
      if (editReview) {
        result = await ReviewService.updateReview(editReview.id, reviewData);
      } else {
        result = await ReviewService.createReview(reviewData);
      }

      if (result.success) {
        Alert.alert(
          '完了',
          editReview ? 'レビューを更新しました' : 'レビューを投稿しました',
          [{ text: 'OK', onPress: () => {
            onSubmit(result.review);
            onClose();
          }}]
        );
      } else {
        Alert.alert('エラー', result.error);
      }
    } catch (error) {
      Alert.alert('エラー', 'レビューの保存に失敗しました');
      console.error('Review submit error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateCategoryRating = (category, rating) => {
    setFormData(prev => ({
      ...prev,
      categories: { ...prev.categories, [category]: rating }
    }));
  };

  return (
    <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>
          {editReview ? 'レビューを編集' : 'レビューを投稿'}
        </Text>
        <Text style={styles.formVenueName}>{venue.name}</Text>
      </View>

      {/* 総合評価 */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>総合評価 *</Text>
        <View style={styles.ratingSection}>
          <StarRating
            rating={formData.rating}
            size={32}
            editable={true}
            onPress={(rating) => updateFormData('rating', rating)}
          />
          <Text style={styles.ratingLabel}>
            {formData.rating > 0 ? `${formData.rating} / 5` : '評価を選択'}
          </Text>
        </View>
      </View>

      {/* カテゴリ別評価 */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>詳細評価</Text>
        {categories.map(category => (
          <View key={category.key} style={styles.categoryRating}>
            <Text style={styles.categoryLabel}>{category.label}</Text>
            <StarRating
              rating={formData.categories[category.key] || 0}
              size={20}
              editable={true}
              onPress={(rating) => updateCategoryRating(category.key, rating)}
            />
          </View>
        ))}
      </View>

      {/* タイトル */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>タイトル *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="レビューのタイトルを入力"
          value={formData.title}
          onChangeText={(value) => updateFormData('title', value)}
          maxLength={100}
        />
        <Text style={styles.charCount}>{formData.title.length}/100</Text>
      </View>

      {/* 内容 */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>レビュー内容 *</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder="具体的な感想をお聞かせください"
          value={formData.content}
          onChangeText={(value) => updateFormData('content', value)}
          multiline={true}
          numberOfLines={5}
          maxLength={1000}
        />
        <Text style={styles.charCount}>{formData.content.length}/1000</Text>
      </View>

      {/* タグ */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>タグ</Text>
        <TextInput
          style={styles.textInput}
          placeholder="カンマ区切りでタグを入力 (例: 音響良し, DJ, ダンス)"
          value={formData.tags}
          onChangeText={(value) => updateFormData('tags', value)}
        />
      </View>

      {/* 送信ボタン */}
      <View style={styles.formActions}>
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelButtonText}>キャンセル</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>
              {editReview ? '更新' : '投稿'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// メインのレビュー管理コンポーネント
const ReviewManager = ({ venue, showMyReviews = false }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('createdAt');

  useEffect(() => {
    loadReviews();
    if (venue) {
      loadStats();
    }
    setupEventListeners();
    
    return () => {
      ReviewService.removeEventListener('reviewCreated', handleReviewsUpdated);
      ReviewService.removeEventListener('reviewUpdated', handleReviewsUpdated);
      ReviewService.removeEventListener('reviewDeleted', handleReviewsUpdated);
    };
  }, [venue, showMyReviews, sortBy]);

  const setupEventListeners = () => {
    ReviewService.addEventListener('reviewCreated', handleReviewsUpdated);
    ReviewService.addEventListener('reviewUpdated', handleReviewsUpdated);
    ReviewService.addEventListener('reviewDeleted', handleReviewsUpdated);
  };

  const handleReviewsUpdated = () => {
    loadReviews();
    if (venue) {
      loadStats();
    }
  };

  const loadReviews = async () => {
    try {
      await ReviewService.initialize();
      
      let reviewList;
      if (showMyReviews) {
        const currentUser = AuthService.getCurrentUser();
        if (currentUser) {
          reviewList = ReviewService.getReviewsByUser(currentUser.id);
        } else {
          reviewList = [];
        }
      } else if (venue) {
        reviewList = ReviewService.getReviewsByVenue(venue.id, { sortBy });
      } else {
        reviewList = [];
      }
      
      setReviews(reviewList);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const reviewStats = ReviewService.getVenueRatingStats(venue.id);
      setStats(reviewStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setShowForm(true);
  };

  const handleDeleteReview = (review) => {
    Alert.alert(
      'レビューを削除',
      'このレビューを削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            const result = await ReviewService.deleteReview(review.id);
            if (!result.success) {
              Alert.alert('エラー', result.error);
            }
          },
        },
      ]
    );
  };

  const handleFormSubmit = (review) => {
    setEditingReview(null);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingReview(null);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>レビューを読み込み中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 統計情報 */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statsHeader}>
            <Text style={styles.statsTitle}>レビュー統計</Text>
            <Text style={styles.statsSubtitle}>{stats.totalReviews}件のレビュー</Text>
          </View>
          
          <View style={styles.ratingOverview}>
            <View style={styles.averageRating}>
              <Text style={styles.averageRatingNumber}>{stats.averageRating}</Text>
              <StarRating rating={Math.round(stats.averageRating)} />
            </View>
            
            <View style={styles.ratingDistribution}>
              {Object.entries(stats.ratingDistribution)
                .reverse()
                .map(([rating, count]) => (
                  <View key={rating} style={styles.ratingBar}>
                    <Text style={styles.ratingNumber}>{rating}</Text>
                    <View style={styles.barContainer}>
                      <View
                        style={[
                          styles.bar,
                          { width: `${(count / stats.totalReviews) * 100}%` }
                        ]}
                      />
                    </View>
                    <Text style={styles.ratingCount}>{count}</Text>
                  </View>
                ))}
            </View>
          </View>
        </View>
      )}

      {/* アクション */}
      <View style={styles.actions}>
        {venue && !showMyReviews && (
          <TouchableOpacity
            style={styles.writeReviewButton}
            onPress={() => setShowForm(true)}
          >
            <Ionicons name="create-outline" size={20} color={colors.white} />
            <Text style={styles.writeReviewButtonText}>レビューを書く</Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.sortControls}>
          <Text style={styles.sortLabel}>並び順：</Text>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'createdAt' && styles.activeSortButton]}
            onPress={() => setSortBy('createdAt')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'createdAt' && styles.activeSortButtonText]}>
              新着順
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'rating' && styles.activeSortButton]}
            onPress={() => setSortBy('rating')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'rating' && styles.activeSortButtonText]}>
              評価順
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* レビュー一覧 */}
      <ScrollView style={styles.reviewsList} showsVerticalScrollIndicator={false}>
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <ReviewItem
              key={review.id}
              review={review}
              onEdit={handleEditReview}
              onDelete={handleDeleteReview}
              showVenueName={showMyReviews}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyTitle}>レビューがありません</Text>
            <Text style={styles.emptyDescription}>
              {showMyReviews 
                ? '投稿したレビューがここに表示されます' 
                : '最初のレビューを投稿してみませんか？'
              }
            </Text>
          </View>
        )}
      </ScrollView>

      {/* レビュー作成/編集フォーム */}
      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleFormClose}
      >
        {venue && (
          <ReviewForm
            venue={venue}
            editReview={editingReview}
            onClose={handleFormClose}
            onSubmit={handleFormSubmit}
          />
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },

  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },

  // 統計情報
  statsContainer: {
    backgroundColor: colors.white,
    padding: 20,
    marginBottom: 16,
  },

  statsHeader: {
    marginBottom: 20,
  },

  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },

  statsSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },

  ratingOverview: {
    flexDirection: 'row',
    gap: 24,
  },

  averageRating: {
    alignItems: 'center',
    gap: 8,
  },

  averageRatingNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },

  ratingDistribution: {
    flex: 1,
    gap: 4,
  },

  ratingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  ratingNumber: {
    fontSize: 12,
    color: colors.textSecondary,
    width: 8,
  },

  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
  },

  bar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },

  ratingCount: {
    fontSize: 12,
    color: colors.textSecondary,
    width: 20,
    textAlign: 'right',
  },

  // アクション
  actions: {
    backgroundColor: colors.white,
    padding: 16,
    marginBottom: 8,
    gap: 12,
  },

  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },

  writeReviewButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },

  sortControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  sortLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },

  activeSortButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  sortButtonText: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  activeSortButtonText: {
    color: colors.white,
    fontWeight: '500',
  },

  // レビュー一覧
  reviewsList: {
    flex: 1,
  },

  reviewItem: {
    backgroundColor: colors.white,
    padding: 16,
    marginBottom: 8,
  },

  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },

  reviewUserInfo: {
    flex: 1,
  },

  reviewUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },

  reviewVenueName: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 2,
  },

  reviewDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  reviewActions: {
    flexDirection: 'row',
    gap: 8,
  },

  actionButton: {
    padding: 4,
  },

  // 星評価
  starContainer: {
    flexDirection: 'row',
    gap: 2,
  },

  starButton: {
    padding: 2,
  },

  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },

  ratingText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },

  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },

  reviewContent: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },

  reviewContentCollapsed: {
    maxHeight: 60,
    overflow: 'hidden',
  },

  expandButton: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
    marginBottom: 8,
  },

  // タグ
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },

  tag: {
    backgroundColor: colors.backgroundLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  tagText: {
    fontSize: 12,
    color: colors.primary,
  },

  // ヘルプフル投票
  helpfulSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },

  helpfulLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },

  helpfulButtons: {
    flexDirection: 'row',
    gap: 12,
  },

  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  helpfulButtonText: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // 空の状態
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },

  emptyIcon: {
    fontSize: 64,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },

  emptyDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // フォーム
  formContainer: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },

  formHeader: {
    marginBottom: 24,
  },

  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },

  formVenueName: {
    fontSize: 16,
    color: colors.primary,
    marginTop: 4,
  },

  formSection: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },

  ratingSection: {
    alignItems: 'center',
    gap: 8,
  },

  ratingLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  categoryRating: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  categoryLabel: {
    fontSize: 14,
    color: colors.text,
  },

  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.white,
  },

  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },

  charCount: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },

  formActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 20,
  },

  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },

  cancelButtonText: {
    fontSize: 16,
    color: colors.textSecondary,
  },

  submitButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },

  submitButtonDisabled: {
    opacity: 0.7,
  },

  submitButtonText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
  },
});

export default ReviewManager;