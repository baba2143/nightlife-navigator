import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { BARS, GENRES, PRICE_RANGES, FEATURES, COUPONS, COUPON_TYPES, COUPON_ICONS } from '../constants/data';
import BarCard from '../components/BarCard';
import ReviewModal from '../components/ReviewModal';
import CouponCard from '../components/CouponCard';

export default function BarDetailScreen({ bar, onBack, onToggleFavorite, isFavorite }) {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviews, setReviews] = useState([
    {
      id: 'r1',
      userName: 'ナイトライフ愛好家',
      rating: 5,
      comment: 'ママさんが最高！常連さんも優しくて、初めてでも楽しめました。',
      createdAt: '2024-01-16T22:30:00Z',
      ownerReply: null
    },
    {
      id: 'r2',
      userName: 'カクテル好き',
      rating: 4,
      comment: 'カクテルが美味しいです。雰囲気も良くて、また来たいと思います。',
      createdAt: '2024-01-15T21:00:00Z',
      ownerReply: 'ありがとうございます！またのお越しをお待ちしております。'
    }
  ]);

  // このバーのクーポンを取得
  const barCoupons = COUPONS.filter(coupon => coupon.barId === bar.id);

  const handleSubmitReview = (reviewData) => {
    const newReview = {
      id: `r${reviews.length + 1}`,
      userName: 'あなた',
      rating: reviewData.rating,
      comment: reviewData.comment,
      createdAt: new Date().toISOString(),
      ownerReply: null
    };
    setReviews([newReview, ...reviews]);
    setShowReviewModal(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
  };

  const getGenreIcon = (genreName) => {
    const genre = GENRES.find(g => g.name === genreName);
    return genre ? genre.icon : '🍺';
  };

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onToggleFavorite(bar.id)} style={styles.favoriteButton}>
          <Text style={styles.favoriteButtonText}>
            {isFavorite ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* 店舗情報 */}
        <View style={styles.barInfo}>
          <View style={styles.barHeader}>
            <Text style={styles.barName}>{bar.name}</Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.rating}>⭐ {bar.rating}</Text>
              <Text style={styles.reviewCount}>({bar.reviewCount}件)</Text>
            </View>
          </View>
          
          <View style={styles.barDetails}>
            <Text style={styles.genre}>
              {getGenreIcon(bar.genre)} {bar.genre}
            </Text>
            <Text style={styles.priceRange}>💰 {bar.priceRange}</Text>
            <Text style={styles.address}>📍 {bar.address}</Text>
            <Text style={styles.phone}>📞 {bar.phone}</Text>
            {bar.openTime && (
              <Text style={styles.openTime}>🕐 {bar.openTime}</Text>
            )}
          </View>

          {bar.description && (
            <Text style={styles.description}>{bar.description}</Text>
          )}
        </View>

        {/* クーポン・特典セクション */}
        {barCoupons.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🎫 クーポン・特典</Text>
              <Text style={styles.sectionSubtitle}>
                {barCoupons.length}件のクーポンが利用可能
              </Text>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.couponsScrollView}
            >
              {barCoupons.slice(0, 3).map(coupon => (
                <View key={coupon.id} style={styles.couponCardContainer}>
                  <CouponCard
                    coupon={coupon}
                    onPress={() => Alert.alert('クーポン詳細', coupon.title)}
                    showBarName={false}
                  />
                </View>
              ))}
            </ScrollView>
            
            {barCoupons.length > 3 && (
              <TouchableOpacity style={styles.viewAllCouponsButton}>
                <Text style={styles.viewAllCouponsText}>
                  すべてのクーポンを見る ({barCoupons.length}件)
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 設備・サービス */}
        {bar.features && bar.features.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🛠️ 設備・サービス</Text>
            <View style={styles.featuresContainer}>
              {bar.features.map((feature, index) => (
                <View key={index} style={styles.featureTag}>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* レビューセクション */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>💬 レビュー</Text>
            <TouchableOpacity onPress={() => setShowReviewModal(true)}>
              <Text style={styles.addReviewButton}>レビューを書く</Text>
            </TouchableOpacity>
          </View>

          {reviews.map(review => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewUserName}>{review.userName}</Text>
                <Text style={styles.reviewRating}>⭐ {review.rating}</Text>
              </View>
              <Text style={styles.reviewComment}>{review.comment}</Text>
              <Text style={styles.reviewDate}>{formatDate(review.createdAt)}</Text>
              
              {review.ownerReply && (
                <View style={styles.ownerReply}>
                  <Text style={styles.ownerReplyLabel}>🏪 店舗からの返信:</Text>
                  <Text style={styles.ownerReplyText}>{review.ownerReply}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* レビュー投稿モーダル */}
      <ReviewModal
        visible={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={handleSubmitReview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a'
  },
  header: {
    backgroundColor: '#1a1a1a',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4AF37',
    flex: 1,
    textAlign: 'center'
  },
  backButton: {
    fontSize: 16,
    color: '#D4AF37'
  },
  favoriteHeaderButton: {
    fontSize: 20
  },
  content: {
    flex: 1
  },
  detailHero: {
    height: 200,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  detailHeroIcon: {
    fontSize: 60
  },
  detailOpenBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#16a085',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15
  },
  detailOpenBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  detailInfo: {
    padding: 20
  },
  detailName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5
  },
  detailGenre: {
    fontSize: 16,
    color: '#D4AF37',
    marginBottom: 15
  },
  detailRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15
  },
  detailRating: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginRight: 10
  },
  detailReviewCount: {
    fontSize: 14,
    color: '#999'
  },
  detailDescription: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 20
  },
  todayAttendanceSection: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D4AF37'
  },
  todayAttendanceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 10
  },
  todayAttendanceScroll: {
    marginHorizontal: -5
  },
  todayAttendanceCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
    minWidth: 100,
    borderWidth: 1,
    borderColor: '#444'
  },
  todayAttendancePhoto: {
    fontSize: 30,
    marginBottom: 5
  },
  todayAttendanceName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 3
  },
  todayAttendanceRole: {
    fontSize: 12,
    color: '#D4AF37',
    marginBottom: 5
  },
  todayAttendanceTime: {
    fontSize: 11,
    color: '#999'
  },
  detailSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333'
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 10
  },
  reviewSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  reviewButton: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15
  },
  reviewButtonText: {
    fontSize: 12,
    color: '#000',
    fontWeight: '600'
  },
  detailInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  detailInfoLabel: {
    fontSize: 14,
    color: '#999'
  },
  detailInfoValue: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
    textAlign: 'right'
  },
  detailSectionContent: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20
  },
  detailFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  detailFeature: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#444'
  },
  detailFeatureText: {
    fontSize: 12,
    color: '#fff'
  },
  noReviewText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20
  },
  reviewCard: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#444'
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  reviewUser: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff'
  },
  reviewRating: {
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: '600'
  },
  reviewComment: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 8
  },
  reviewDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  reviewDate: {
    fontSize: 12,
    color: '#777'
  },
  reviewPrice: {
    fontSize: 12,
    color: '#D4AF37'
  },
  ownerReplyContainer: {
    backgroundColor: '#1a1a1a',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#D4AF37'
  },
  ownerReplyLabel: {
    fontSize: 12,
    color: '#D4AF37',
    fontWeight: '600',
    marginBottom: 5
  },
  ownerReplyContent: {
    fontSize: 12,
    color: '#ccc'
  },
  castCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#444'
  },
  castPhoto: {
    fontSize: 40,
    marginRight: 15
  },
  castInfo: {
    flex: 1
  },
  castHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5
  },
  castName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff'
  },
  castRole: {
    fontSize: 12,
    color: '#D4AF37',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D4AF37'
  },
  castProfile: {
    fontSize: 13,
    color: '#ccc',
    lineHeight: 18,
    marginBottom: 8
  },
  castDetails: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 5
  },
  castDetailItem: {
    fontSize: 12,
    color: '#999'
  },
  castHobby: {
    fontSize: 12,
    color: '#999'
  },
  barInfo: {
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  barName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginRight: 10
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  rating: {
    fontSize: 18,
    fontWeight: '600',
    color: '#D4AF37'
  },
  reviewCount: {
    fontSize: 14,
    color: '#999'
  },
  barDetails: {
    marginTop: 10,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  genre: {
    fontSize: 16,
    color: '#D4AF37',
    marginBottom: 5
  },
  priceRange: {
    fontSize: 14,
    color: '#999',
    marginBottom: 5
  },
  address: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 5
  },
  phone: {
    fontSize: 14,
    color: '#999',
    marginBottom: 5
  },
  openTime: {
    fontSize: 14,
    color: '#999'
  },
  description: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginTop: 10
  },
  section: {
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333'
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 5
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#999'
  },
  couponsScrollView: {
    marginHorizontal: -5
  },
  couponCardContainer: {
    marginHorizontal: 5
  },
  viewAllCouponsButton: {
    marginTop: 10,
    alignItems: 'center'
  },
  viewAllCouponsText: {
    fontSize: 14,
    color: '#D4AF37',
    textDecorationLine: 'underline'
  },
  addReviewButton: {
    fontSize: 14,
    color: '#D4AF37',
    textDecorationLine: 'underline'
  },
  ownerReply: {
    marginTop: 10,
    backgroundColor: '#1a1a1a',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#D4AF37'
  },
  ownerReplyLabel: {
    fontSize: 12,
    color: '#D4AF37',
    fontWeight: '600',
    marginBottom: 5
  },
  ownerReplyText: {
    fontSize: 12,
    color: '#ccc'
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  featureTag: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#444'
  },
  featureText: {
    fontSize: 12,
    color: '#fff'
  }
}); 