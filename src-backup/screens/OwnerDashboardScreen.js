import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import BarRegistrationModal from '../components/BarRegistrationModal';
import CouponManagementModal from '../components/CouponManagementModal';
import notificationService from '../services/NotificationService';
import billingService from '../services/BillingService';
import { useBars, useCoupons, useReviews, useNotifications, useBilling } from '../context/AppContext';

export default function OwnerDashboardScreen({ onBack, onNavigateToBars, onNavigateToReviews }) {
  const [showBarModal, setShowBarModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingBar, setEditingBar] = useState(null);
  const [editingCoupon, setEditingCoupon] = useState(null);
  
  const { myBars, addBar, updateBar } = useBars();
  const { myCoupons, addCoupon, updateCoupon } = useCoupons();
  const { reviews, getReviewsByBar, getPendingReplies } = useReviews();
  const { addNotification } = useNotifications();
  const { canUseCouponManagement, canUsePushNotifications } = useBilling();

  const totalReviews = reviews;
  const averageRating = totalReviews.length > 0 ? 
    totalReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews.length : 0;
  const pendingReplies = getPendingReplies();

  const handleBarSubmit = (barData) => {
    if (editingBar) {
      // 編集モード
      updateBar({ ...editingBar, ...barData });
      Alert.alert('完了', '店舗情報を更新しました');
    } else {
      // 新規登録モード
      const newBar = {
        ...barData,
        id: Date.now(),
        rating: 0,
        reviewCount: 0,
        status: 'pending'
      };
      addBar(newBar);
      Alert.alert('完了', '店舗登録申請を送信しました。審査完了後に公開されます。');
    }
    setEditingBar(null);
  };

  const handleEditBar = (bar) => {
    setEditingBar(bar);
    setShowBarModal(true);
  };

  const handleNewBar = () => {
    setEditingBar(null);
    setShowBarModal(true);
  };

  const handleCouponSubmit = async (couponData) => {
    if (editingCoupon) {
      // 編集モード
      updateCoupon({ ...editingCoupon, ...couponData });
      Alert.alert('完了', 'クーポンを更新しました');
    } else {
      // 新規登録モード
      const newCoupon = {
        ...couponData,
        id: `coupon_${Date.now()}`,
        usedCount: 0,
        createdAt: new Date().toISOString()
      };
      addCoupon(newCoupon);
      
      // 通知送信の確認
      if (couponData.sendNotification) {
        const bar = myBars.find(b => b.id === couponData.barId);
        if (bar) {
          // お気に入りユーザーに通知を送信（デモ用）
          const favoriteUsers = ['user1', 'user2', 'user3']; // 実際のアプリではデータベースから取得
          await notificationService.sendFavoriteBarCouponNotification(
            newCoupon, 
            bar, 
            favoriteUsers, 
            addNotification
          );
        }
      }
      
      Alert.alert('完了', 'クーポンを登録しました');
    }
    setEditingCoupon(null);
  };

  const handleNewCoupon = () => {
    setEditingCoupon(null);
    setShowCouponModal(true);
  };

  const handleEditCoupon = (coupon) => {
    setEditingCoupon(coupon);
    setShowCouponModal(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>オーナーダッシュボード</Text>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.switchModeButton}>👤</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* 統計サマリー */}
        <View style={styles.dashboardSection}>
          <Text style={styles.dashboardSectionTitle}>📊 統計サマリー</Text>
          <View style={styles.statsGrid}>
            <View style={styles.dashboardStatsCard}>
              <Text style={styles.dashboardStatsValue}>{myBars.length}</Text>
              <Text style={styles.dashboardStatsLabel}>登録店舗数</Text>
              <Text style={styles.dashboardStatsIcon}>🏪</Text>
            </View>
            
            <View style={styles.dashboardStatsCard}>
              <Text style={styles.dashboardStatsValue}>{totalReviews.length}</Text>
              <Text style={styles.dashboardStatsLabel}>総レビュー数</Text>
              <Text style={styles.dashboardStatsIcon}>📝</Text>
            </View>
            
            <View style={styles.dashboardStatsCard}>
              <Text style={styles.dashboardStatsValue}>{averageRating.toFixed(1)}</Text>
              <Text style={styles.dashboardStatsLabel}>平均評価</Text>
              <Text style={styles.dashboardStatsIcon}>⭐</Text>
            </View>
            
            <View style={styles.dashboardStatsCard}>
              <Text style={styles.dashboardStatsValue}>{pendingReplies.length}</Text>
              <Text style={styles.dashboardStatsLabel}>未返信レビュー</Text>
              <Text style={styles.dashboardStatsIcon}>💬</Text>
            </View>
            
            <View style={styles.dashboardStatsCard}>
              <Text style={styles.dashboardStatsValue}>{myCoupons.length}</Text>
              <Text style={styles.dashboardStatsLabel}>登録クーポン</Text>
              <Text style={styles.dashboardStatsIcon}>🎫</Text>
            </View>
          </View>
        </View>

        {/* クイックアクション */}
        <View style={styles.dashboardSection}>
          <Text style={styles.dashboardSectionTitle}>⚡ クイックアクション</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={handleNewBar}
            >
              <Text style={styles.quickActionIcon}>🏪</Text>
              <Text style={styles.quickActionText}>新規店舗登録</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => onNavigateToReviews && onNavigateToReviews()}
            >
              <Text style={styles.quickActionIcon}>💬</Text>
              <Text style={styles.quickActionText}>レビュー管理</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => onNavigateToBars && onNavigateToBars()}
            >
              <Text style={styles.quickActionIcon}>📊</Text>
              <Text style={styles.quickActionText}>店舗管理</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.quickActionButton,
                !canUseCouponManagement() && styles.disabledButton
              ]}
              onPress={canUseCouponManagement() ? handleNewCoupon : () => billingService.showUpgradePrompt('COUPON_MANAGEMENT')}
            >
              <Text style={styles.quickActionIcon}>🎫</Text>
              <Text style={styles.quickActionText}>
                {canUseCouponManagement() ? 'クーポン作成' : 'クーポン作成 (要課金)'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 最近のレビュー */}
        <View style={styles.dashboardSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.dashboardSectionTitle}>🆕 最近のレビュー</Text>
            <TouchableOpacity onPress={() => onNavigateToReviews && onNavigateToReviews()}>
              <Text style={styles.viewAllLink}>すべて見る →</Text>
            </TouchableOpacity>
          </View>
          
          {totalReviews.slice(0, 3).map(review => {
            const bar = myBars.find(r => r.id === review.barId);
            return (
              <View key={review.id} style={styles.dashboardReviewCard}>
                <View style={styles.dashboardReviewHeader}>
                  <Text style={styles.dashboardReviewBar}>{bar?.name}</Text>
                  <Text style={styles.dashboardReviewRating}>⭐ {review.rating}</Text>
                </View>
                <Text style={styles.dashboardReviewUser}>{review.userName}</Text>
                <Text style={styles.dashboardReviewComment} numberOfLines={2}>
                  {review.comment}
                </Text>
                <View style={styles.dashboardReviewActions}>
                  <Text style={styles.dashboardReviewDate}>
                    {new Date(review.createdAt).toLocaleDateString('ja-JP')}
                  </Text>
                  {!review.ownerReply && (
                    <TouchableOpacity
                      onPress={() => Alert.alert('返信', 'レビュー返信画面へ')}
                      style={styles.quickReplyButton}
                    >
                      <Text style={styles.quickReplyButtonText}>返信する</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* 店舗一覧 */}
        <View style={styles.dashboardSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.dashboardSectionTitle}>🏪 登録店舗</Text>
            <TouchableOpacity onPress={() => onNavigateToBars && onNavigateToBars()}>
              <Text style={styles.viewAllLink}>管理 →</Text>
            </TouchableOpacity>
          </View>
          
          {myBars.map(bar => (
            <TouchableOpacity 
              key={bar.id} 
              style={styles.dashboardBarCard}
              onPress={() => handleEditBar(bar)}
            >
              <View style={styles.dashboardBarHeader}>
                <Text style={styles.dashboardBarName}>{bar.name}</Text>
                <View style={[
                  styles.statusBadge,
                  bar.status === 'approved' && styles.statusApproved,
                  bar.status === 'pending' && styles.statusPending,
                  bar.status === 'rejected' && styles.statusRejected
                ]}>
                  <Text style={styles.statusText}>
                    {bar.status === 'approved' ? '承認済み' :
                     bar.status === 'pending' ? '審査中' : '却下'}
                  </Text>
                </View>
              </View>
              <Text style={styles.dashboardBarGenre}>{bar.genre}</Text>
              <View style={styles.dashboardBarStats}>
                <Text style={styles.dashboardBarStat}>⭐ {bar.rating || 0}</Text>
                <Text style={styles.dashboardBarStat}>📝 {bar.reviewCount || 0}件</Text>
              </View>
              <Text style={styles.editHint}>タップして編集</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* クーポン一覧 */}
        <View style={styles.dashboardSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.dashboardSectionTitle}>🎫 登録クーポン</Text>
            <TouchableOpacity 
              onPress={canUseCouponManagement() ? handleNewCoupon : () => billingService.showUpgradePrompt('COUPON_MANAGEMENT')}
            >
              <Text style={styles.viewAllLink}>
                {canUseCouponManagement() ? '新規作成 →' : '新規作成 (要課金) →'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {myCoupons.map(coupon => {
            const bar = myBars.find(b => b.id === coupon.barId);
            return (
              <TouchableOpacity 
                key={coupon.id} 
                style={styles.dashboardCouponCard}
                onPress={() => handleEditCoupon(coupon)}
              >
                <View style={styles.dashboardCouponHeader}>
                  <Text style={styles.dashboardCouponTitle}>{coupon.title}</Text>
                  <View style={[
                    styles.statusBadge,
                    coupon.isActive && styles.statusApproved,
                    !coupon.isActive && styles.statusRejected
                  ]}>
                    <Text style={styles.statusText}>
                      {coupon.isActive ? '有効' : '無効'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.dashboardCouponBar}>{bar?.name}</Text>
                <Text style={styles.dashboardCouponDiscount}>{coupon.discount}</Text>
                <View style={styles.dashboardCouponStats}>
                  <Text style={styles.dashboardCouponStat}>使用: {coupon.usedCount}/{coupon.usageLimit}</Text>
                  <Text style={styles.dashboardCouponStat}>
                    {new Date(coupon.validFrom).toLocaleDateString('ja-JP')} - {new Date(coupon.validTo).toLocaleDateString('ja-JP')}
                  </Text>
                </View>
                <Text style={styles.editHint}>タップして編集</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <BarRegistrationModal
        visible={showBarModal}
        onClose={() => {
          setShowBarModal(false);
          setEditingBar(null);
        }}
        onSubmit={handleBarSubmit}
        editingBar={editingBar}
      />

      <CouponManagementModal
        visible={showCouponModal}
        onClose={() => {
          setShowCouponModal(false);
          setEditingCoupon(null);
        }}
        onSubmit={handleCouponSubmit}
        editingCoupon={editingCoupon}
        barId={myBars[0]?.id} // デモ用：最初の店舗のIDを使用
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D4AF37'
  },
  switchModeButton: {
    fontSize: 16,
    color: '#D4AF37',
    fontWeight: '600'
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 80
  },
  dashboardSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333'
  },
  dashboardSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 15
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  dashboardStatsCard: {
    width: '48%',
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#444'
  },
  dashboardStatsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 5
  },
  dashboardStatsLabel: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center'
  },
  dashboardStatsIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    fontSize: 16,
    opacity: 0.7
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#444'
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8
  },
  quickActionText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center'
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  viewAllLink: {
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: '600'
  },
  dashboardReviewCard: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#444'
  },
  dashboardReviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5
  },
  dashboardReviewBar: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff'
  },
  dashboardReviewRating: {
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: '600'
  },
  dashboardReviewUser: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5
  },
  dashboardReviewComment: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 10
  },
  dashboardReviewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  dashboardReviewDate: {
    fontSize: 12,
    color: '#777'
  },
  quickReplyButton: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15
  },
  quickReplyButtonText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600'
  },
  dashboardBarCard: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#444'
  },
  dashboardBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5
  },
  dashboardBarName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff'
  },
  dashboardBarGenre: {
    fontSize: 12,
    color: '#D4AF37',
    marginBottom: 5
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusApproved: {
    backgroundColor: '#16a085'
  },
  statusPending: {
    backgroundColor: '#f39c12'
  },
  statusRejected: {
    backgroundColor: '#e74c3c'
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff'
  },
  dashboardBarStats: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 5
  },
  dashboardBarStat: {
    fontSize: 12,
    color: '#999'
  },
  editHint: {
    fontSize: 10,
    color: '#666',
    fontStyle: 'italic'
  },
  dashboardCouponCard: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#444'
  },
  dashboardCouponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5
  },
  dashboardCouponTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff'
  },
  dashboardCouponBar: {
    fontSize: 12,
    color: '#D4AF37',
    marginBottom: 5
  },
  dashboardCouponDiscount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 5
  },
  dashboardCouponStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5
  },
  dashboardCouponStat: {
    fontSize: 12,
    color: '#999'
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: '#444'
  }
}); 