/**
 * レビュー・評価システムコンポーネント
 * Nightlife Navigator固有のレビュー機能
 */

import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { colors } from '../../design-system/colors-soft-pink';
import { spacingSystem } from '../../design-system/spacing-comfortable';
import { borderRadiusSystem } from '../../design-system/borders-rounded';
import { shadowSystem } from '../../design-system/shadows-soft-pink';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Text } from '../ui/Text';
import { Flex } from '../ui/Layout';

// 星評価コンポーネント
const StarRating = ({ rating, maxRating = 5, size = 20, onRatingChange, editable = false }) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  const renderStar = (index) => {
    const filled = index < rating;
    const halfFilled = index < rating && index + 1 > rating;
    
    return (
      <TouchableOpacity
        key={index}
        disabled={!editable}
        onPress={() => editable && onRatingChange && onRatingChange(index + 1)}
        style={styles.starButton}
      >
        <Text style={[
          styles.star,
          {
            fontSize: size,
            color: filled ? theme.colors.warning[500] : theme.colors.border.medium,
          }
        ]}>
          {filled ? '★' : '☆'}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.starContainer}>
      {[...Array(maxRating)].map((_, index) => renderStar(index))}
    </View>
  );
};

// レビュー作成コンポーネント
const ReviewForm = ({ onSubmit, onCancel }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [aspects, setAspects] = useState({
    atmosphere: 0,
    service: 0,
    drinks: 0,
    music: 0,
    cleanliness: 0,
  });

  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  const aspectLabels = {
    atmosphere: '雰囲気',
    service: 'サービス',
    drinks: 'ドリンク',
    music: '音楽',
    cleanliness: '清潔感',
  };

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert('エラー', '総合評価を選択してください');
      return;
    }
    
    if (comment.trim().length < 10) {
      Alert.alert('エラー', 'コメントは10文字以上入力してください');
      return;
    }

    const review = {
      rating,
      comment: comment.trim(),
      aspects,
      timestamp: new Date().toISOString(),
    };

    onSubmit(review);
  };

  const handleAspectRating = (aspect, value) => {
    setAspects(prev => ({
      ...prev,
      [aspect]: value,
    }));
  };

  return (
    <Card variant="elevated" style={styles.reviewForm}>
      <Text variant="h4" style={[styles.formTitle, { color: theme.colors.brand }]}>
        レビューを書く
      </Text>

      {/* 総合評価 */}
      <View style={styles.formSection}>
        <Text variant="bodySmall" style={styles.sectionTitle}>
          総合評価 <Text style={{ color: theme.colors.error[500] }}>*</Text>
        </Text>
        <StarRating
          rating={rating}
          onRatingChange={setRating}
          editable={true}
          size={30}
        />
      </View>

      {/* 詳細評価 */}
      <View style={styles.formSection}>
        <Text variant="bodySmall" style={styles.sectionTitle}>
          詳細評価
        </Text>
        {Object.entries(aspectLabels).map(([key, label]) => (
          <View key={key} style={styles.aspectRating}>
            <Text variant="caption" style={styles.aspectLabel}>
              {label}
            </Text>
            <StarRating
              rating={aspects[key]}
              onRatingChange={(value) => handleAspectRating(key, value)}
              editable={true}
              size={20}
            />
          </View>
        ))}
      </View>

      {/* コメント */}
      <View style={styles.formSection}>
        <Text variant="bodySmall" style={styles.sectionTitle}>
          コメント <Text style={{ color: theme.colors.error[500] }}>*</Text>
        </Text>
        <TextInput
          style={[
            styles.commentInput,
            {
              borderColor: theme.colors.border.medium,
              backgroundColor: theme.colors.background.surface,
              color: theme.colors.text.primary,
            }
          ]}
          placeholder="この店舗の感想を教えてください..."
          placeholderTextColor={theme.colors.text.tertiary}
          multiline
          numberOfLines={4}
          value={comment}
          onChangeText={setComment}
          maxLength={500}
        />
        <Text variant="caption" style={styles.charCount}>
          {comment.length}/500
        </Text>
      </View>

      {/* アクションボタン */}
      <View style={styles.formActions}>
        <Button
          variant="outline"
          onPress={onCancel}
          style={styles.actionButton}
        >
          キャンセル
        </Button>
        <Button
          variant="primary"
          onPress={handleSubmit}
          style={styles.actionButton}
        >
          投稿する
        </Button>
      </View>
    </Card>
  );
};

// レビューアイテムコンポーネント
const ReviewItem = ({ review, onHelpful, onReport }) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const aspectLabels = {
    atmosphere: '雰囲気',
    service: 'サービス',
    drinks: 'ドリンク',
    music: '音楽',
    cleanliness: '清潔感',
  };

  return (
    <Card variant="default" style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewUserInfo}>
          <View style={styles.reviewAvatar}>
            <Text variant="body" style={{ color: theme.colors.brand }}>
              {review.user.name.charAt(0)}
            </Text>
          </View>
          <View style={styles.reviewUserDetails}>
            <Text variant="bodySmall" style={{ fontWeight: '600' }}>
              {review.user.name}
            </Text>
            <Text variant="caption" color="textTertiary">
              {formatDate(review.timestamp)}
            </Text>
          </View>
        </View>
        <View style={styles.reviewRating}>
          <StarRating rating={review.rating} size={16} />
        </View>
      </View>

      {/* 詳細評価 */}
      {review.aspects && (
        <View style={styles.aspectRatings}>
          {Object.entries(review.aspects).map(([key, value]) => (
            value > 0 && (
              <View key={key} style={styles.aspectRatingItem}>
                <Text variant="caption" style={styles.aspectRatingLabel}>
                  {aspectLabels[key]}
                </Text>
                <StarRating rating={value} size={12} />
              </View>
            )
          ))}
        </View>
      )}

      {/* コメント */}
      <Text variant="body" style={styles.reviewComment}>
        {review.comment}
      </Text>

      {/* 写真 */}
      {review.images && review.images.length > 0 && (
        <View style={styles.reviewImages}>
          {review.images.map((image, index) => (
            <View key={index} style={styles.reviewImage}>
              <Text variant="caption" style={{ color: theme.colors.text.secondary }}>
                📷 写真{index + 1}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* アクション */}
      <View style={styles.reviewActions}>
        <TouchableOpacity
          style={styles.reviewAction}
          onPress={() => onHelpful(review.id)}
        >
          <Text variant="caption" style={{ color: theme.colors.text.secondary }}>
            👍 役に立った ({review.helpfulCount || 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.reviewAction}
          onPress={() => onReport(review.id)}
        >
          <Text variant="caption" style={{ color: theme.colors.text.tertiary }}>
            🚫 報告
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
};

// レビュー統計コンポーネント
const ReviewStats = ({ reviews }) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => {
    const count = reviews.filter(review => review.rating === rating).length;
    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
    return { rating, count, percentage };
  });

  return (
    <Card variant="soft" style={styles.reviewStats}>
      <Text variant="h4" style={[styles.statsTitle, { color: theme.colors.brand }]}>
        レビュー統計
      </Text>

      <View style={styles.statsOverview}>
        <View style={styles.averageRating}>
          <Text variant="displayMedium" style={{ color: theme.colors.brand }}>
            {averageRating.toFixed(1)}
          </Text>
          <StarRating rating={Math.round(averageRating)} size={24} />
          <Text variant="caption" color="textSecondary">
            {totalReviews}件のレビュー
          </Text>
        </View>

        <View style={styles.ratingDistribution}>
          {ratingDistribution.map(({ rating, count, percentage }) => (
            <View key={rating} style={styles.distributionItem}>
              <Text variant="caption" style={styles.distributionRating}>
                {rating}★
              </Text>
              <View style={styles.distributionBar}>
                <View
                  style={[
                    styles.distributionFill,
                    {
                      width: `${percentage}%`,
                      backgroundColor: theme.colors.brand,
                    }
                  ]}
                />
              </View>
              <Text variant="caption" style={styles.distributionCount}>
                {count}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </Card>
  );
};

// メインレビューシステムコンポーネント
const ReviewSystem = ({ venue, reviews = [], onAddReview }) => {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [filterRating, setFilterRating] = useState(0);

  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  // サンプルレビューデータ
  const sampleReviews = [
    {
      id: 1,
      user: { name: '田中太郎', avatar: null },
      rating: 5,
      comment: '最高の雰囲気でした！やさしいピンクの照明が心地よく、スタッフの方もとても親切でした。また必ず来ます。',
      aspects: {
        atmosphere: 5,
        service: 5,
        drinks: 4,
        music: 4,
        cleanliness: 5,
      },
      timestamp: '2024-01-15T19:30:00Z',
      helpfulCount: 12,
      images: ['image1.jpg'],
    },
    {
      id: 2,
      user: { name: '佐藤花子', avatar: null },
      rating: 4,
      comment: 'ドリンクの種類が豊富で、どれも美味しかったです。音楽も良く、友達と楽しい時間を過ごせました。',
      aspects: {
        atmosphere: 4,
        service: 4,
        drinks: 5,
        music: 5,
        cleanliness: 4,
      },
      timestamp: '2024-01-10T20:15:00Z',
      helpfulCount: 8,
    },
    {
      id: 3,
      user: { name: '鈴木一郎', avatar: null },
      rating: 4,
      comment: '落ち着いた雰囲気で、デートにぴったりでした。料金も手頃で、また利用したいと思います。',
      aspects: {
        atmosphere: 5,
        service: 4,
        drinks: 3,
        music: 4,
        cleanliness: 4,
      },
      timestamp: '2024-01-05T21:00:00Z',
      helpfulCount: 5,
    },
  ];

  const displayReviews = reviews.length > 0 ? reviews : sampleReviews;

  const sortedAndFilteredReviews = displayReviews
    .filter(review => filterRating === 0 || review.rating === filterRating)
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.timestamp) - new Date(a.timestamp);
        case 'oldest':
          return new Date(a.timestamp) - new Date(b.timestamp);
        case 'highest':
          return b.rating - a.rating;
        case 'lowest':
          return a.rating - b.rating;
        case 'helpful':
          return (b.helpfulCount || 0) - (a.helpfulCount || 0);
        default:
          return 0;
      }
    });

  const handleAddReview = (review) => {
    const newReview = {
      ...review,
      id: Date.now(),
      user: { name: 'あなた', avatar: null },
      helpfulCount: 0,
    };
    
    onAddReview?.(newReview);
    setShowReviewForm(false);
    Alert.alert('完了', 'レビューを投稿しました');
  };

  const handleHelpful = (reviewId) => {
    console.log('Helpful clicked for review', reviewId);
  };

  const handleReport = (reviewId) => {
    Alert.alert(
      '報告',
      'このレビューを報告しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '報告', onPress: () => console.log('Report review', reviewId) },
      ]
    );
  };

  const renderReviewItem = ({ item }) => (
    <ReviewItem
      review={item}
      onHelpful={handleHelpful}
      onReport={handleReport}
    />
  );

  return (
    <View style={styles.container}>
      {/* 統計情報 */}
      <ReviewStats reviews={displayReviews} />

      {/* レビュー作成フォーム */}
      {showReviewForm ? (
        <ReviewForm
          onSubmit={handleAddReview}
          onCancel={() => setShowReviewForm(false)}
        />
      ) : (
        <View style={styles.addReviewSection}>
          <Button
            variant="primary"
            onPress={() => setShowReviewForm(true)}
            style={styles.addReviewButton}
          >
            レビューを書く
          </Button>
        </View>
      )}

      {/* ソート・フィルターコントロール */}
      <Card variant="default" style={styles.controlsCard}>
        <View style={styles.controls}>
          <View style={styles.controlGroup}>
            <Text variant="caption" style={styles.controlLabel}>
              並び替え
            </Text>
            <View style={styles.controlOptions}>
              {[
                { value: 'newest', label: '新しい順' },
                { value: 'oldest', label: '古い順' },
                { value: 'highest', label: '評価高い順' },
                { value: 'lowest', label: '評価低い順' },
                { value: 'helpful', label: '役に立つ順' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.controlOption,
                    {
                      backgroundColor: sortBy === option.value
                        ? theme.colors.brand
                        : theme.colors.background.surface,
                    }
                  ]}
                  onPress={() => setSortBy(option.value)}
                >
                  <Text
                    variant="caption"
                    style={{
                      color: sortBy === option.value
                        ? theme.colors.white
                        : theme.colors.text.secondary,
                    }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.controlGroup}>
            <Text variant="caption" style={styles.controlLabel}>
              評価フィルター
            </Text>
            <View style={styles.controlOptions}>
              {[
                { value: 0, label: 'すべて' },
                { value: 5, label: '5★' },
                { value: 4, label: '4★' },
                { value: 3, label: '3★' },
                { value: 2, label: '2★' },
                { value: 1, label: '1★' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.controlOption,
                    {
                      backgroundColor: filterRating === option.value
                        ? theme.colors.brand
                        : theme.colors.background.surface,
                    }
                  ]}
                  onPress={() => setFilterRating(option.value)}
                >
                  <Text
                    variant="caption"
                    style={{
                      color: filterRating === option.value
                        ? theme.colors.white
                        : theme.colors.text.secondary,
                    }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Card>

      {/* レビューリスト */}
      <FlatList
        data={sortedAndFilteredReviews}
        renderItem={renderReviewItem}
        keyExtractor={item => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.reviewsList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text variant="body" style={{ color: theme.colors.text.secondary }}>
              まだレビューがありません
            </Text>
            <Button
              variant="outline"
              onPress={() => setShowReviewForm(true)}
              style={styles.emptyStateButton}
            >
              最初のレビューを書く
            </Button>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  
  // 星評価
  starContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  
  starButton: {
    padding: 2,
  },
  
  star: {
    // fontSize will be set dynamically
  },
  
  // レビュー統計
  reviewStats: {
    margin: spacingSystem.layout.container.md,
    padding: spacingSystem.layout.card.padding,
  },
  
  statsTitle: {
    marginBottom: spacingSystem.component.margin.lg,
  },
  
  statsOverview: {
    flexDirection: 'row',
    gap: spacingSystem.component.gap.xl,
  },
  
  averageRating: {
    alignItems: 'center',
    gap: spacingSystem.component.gap.sm,
  },
  
  ratingDistribution: {
    flex: 1,
    gap: spacingSystem.component.gap.sm,
  },
  
  distributionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingSystem.component.gap.sm,
  },
  
  distributionRating: {
    width: 30,
    textAlign: 'right',
  },
  
  distributionBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.border.light,
    borderRadius: 4,
    overflow: 'hidden',
  },
  
  distributionFill: {
    height: '100%',
    borderRadius: 4,
  },
  
  distributionCount: {
    width: 20,
    textAlign: 'left',
  },
  
  // レビュー作成
  addReviewSection: {
    paddingHorizontal: spacingSystem.layout.container.md,
    marginBottom: spacingSystem.component.margin.md,
  },
  
  addReviewButton: {
    // No additional styles needed
  },
  
  reviewForm: {
    margin: spacingSystem.layout.container.md,
    padding: spacingSystem.layout.card.padding,
  },
  
  formTitle: {
    marginBottom: spacingSystem.component.margin.lg,
  },
  
  formSection: {
    marginBottom: spacingSystem.component.margin.xl,
  },
  
  sectionTitle: {
    marginBottom: spacingSystem.component.margin.md,
    fontWeight: '600',
    color: colors.text.primary,
  },
  
  aspectRating: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingSystem.component.margin.sm,
  },
  
  aspectLabel: {
    width: 80,
    color: colors.text.secondary,
  },
  
  commentInput: {
    borderWidth: 1,
    borderRadius: borderRadiusSystem.component.input.medium,
    padding: spacingSystem.component.padding.md,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  
  charCount: {
    textAlign: 'right',
    marginTop: spacingSystem.component.margin.sm,
    color: colors.text.tertiary,
  },
  
  formActions: {
    flexDirection: 'row',
    gap: spacingSystem.component.gap.md,
  },
  
  actionButton: {
    flex: 1,
  },
  
  // コントロール
  controlsCard: {
    margin: spacingSystem.layout.container.md,
    padding: spacingSystem.layout.card.padding,
  },
  
  controls: {
    gap: spacingSystem.component.gap.lg,
  },
  
  controlGroup: {
    // No additional styles needed
  },
  
  controlLabel: {
    marginBottom: spacingSystem.component.margin.sm,
    fontWeight: '600',
    color: colors.text.primary,
  },
  
  controlOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacingSystem.component.gap.sm,
  },
  
  controlOption: {
    paddingHorizontal: spacingSystem.component.padding.md,
    paddingVertical: spacingSystem.component.padding.sm,
    borderRadius: borderRadiusSystem.component.badge.small,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  
  // レビューリスト
  reviewsList: {
    paddingHorizontal: spacingSystem.layout.container.md,
    paddingBottom: spacingSystem.layout.container.xl,
  },
  
  reviewItem: {
    padding: spacingSystem.layout.card.padding,
    marginBottom: spacingSystem.layout.card.margin,
  },
  
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacingSystem.component.margin.md,
  },
  
  reviewUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingSystem.component.gap.md,
  },
  
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.pinkLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  reviewUserDetails: {
    // No additional styles needed
  },
  
  reviewRating: {
    // No additional styles needed
  },
  
  aspectRatings: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacingSystem.component.gap.md,
    marginBottom: spacingSystem.component.margin.md,
  },
  
  aspectRatingItem: {
    alignItems: 'center',
    gap: spacingSystem.component.gap.xs,
  },
  
  aspectRatingLabel: {
    color: colors.text.secondary,
  },
  
  reviewComment: {
    lineHeight: 22,
    marginBottom: spacingSystem.component.margin.md,
  },
  
  reviewImages: {
    flexDirection: 'row',
    gap: spacingSystem.component.gap.sm,
    marginBottom: spacingSystem.component.margin.md,
  },
  
  reviewImage: {
    width: 60,
    height: 60,
    borderRadius: borderRadiusSystem.component.image.small,
    backgroundColor: colors.background.pinkLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  reviewActions: {
    flexDirection: 'row',
    gap: spacingSystem.component.gap.lg,
  },
  
  reviewAction: {
    paddingVertical: spacingSystem.component.padding.sm,
  },
  
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacingSystem.layout.container.xl,
    gap: spacingSystem.component.gap.lg,
  },
  
  emptyStateButton: {
    paddingHorizontal: spacingSystem.component.padding.xl,
  },
});

export default ReviewSystem;