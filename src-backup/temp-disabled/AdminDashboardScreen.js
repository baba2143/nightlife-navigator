import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl
} from 'react-native';
import { useBars, useCoupons, useReviews, useBilling } from '../context/AppContext';
import { ADMIN_ROLES, ADMIN_PERMISSIONS, BAR_APPROVAL_STATUS } from '../constants/admin';
import adminAuthService from '../services/AdminAuthService';

export default function AdminDashboardScreen({ onBack, onNavigateToBarApproval, onNavigateToUserManagement, onNavigateToBillingManagement }) {
  const { bars } = useBars();
  const { coupons } = useCoupons();
  const { reviews } = useReviews();
  const { subscription } = useBilling();
  
  const [refreshing, setRefreshing] = useState(false);
  const [adminRole] = useState(ADMIN_ROLES.ADMIN); // デモ用：管理者権限

  // 統計データの計算
  const stats = {
    totalUsers: 1250, // デモ用データ
    activeUsers: 890,
    totalBars: bars.length,
    pendingBars: bars.filter(bar => bar.status === BAR_APPROVAL_STATUS.PENDING).length,
    totalRevenue: 1250000, // デモ用データ
    monthlyRevenue: 180000,
    activeSubscriptions: 45,
    totalReviews: reviews.length,
    totalCoupons: coupons.length
  };

  const onRefresh = () => {
    setRefreshing(true);
    // 実際のアプリではデータを再取得
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'bar_approval':
        if (onNavigateToBarApproval) {
          onNavigateToBarApproval();
        }
        break;
      case 'user_management':
        if (onNavigateToUserManagement) {
          onNavigateToUserManagement();
        }
        break;
      case 'system_settings':
        Alert.alert('システム設定', 'システム設定画面へ遷移します');
        break;
      case 'analytics':
        Alert.alert('分析レポート', '詳細な分析レポートを表示します');
        break;
      case 'billing_management':
        if (onNavigateToBillingManagement) {
          onNavigateToBillingManagement();
        }
        break;
      case 'logout':
        handleLogout();
        break;
      default:
        break;
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'ログアウト',
      '管理者ログアウトしますか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel'
        },
        {
          text: 'ログアウト',
          style: 'destructive',
          onPress: async () => {
            const result = await adminAuthService.logout();
            if (result.success) {
              onBack();
            }
          }
        }
      ]
    );
  };

  const hasPermission = (permission) => {
    return adminAuthService.hasPermission(permission);
  };

  const renderStatsCard = (title, value, subtitle, icon, color = '#D4AF37') => (
    <View style={styles.statsCard}>
      <View style={styles.statsHeader}>
        <Text style={styles.statsIcon}>{icon}</Text>
        <Text style={[styles.statsValue, { color }]}>{value}</Text>
      </View>
      <Text style={styles.statsTitle}>{title}</Text>
      {subtitle && <Text style={styles.statsSubtitle}>{subtitle}</Text>}
    </View>
  );

  const renderQuickAction = (title, icon, action, permission) => {
    if (!hasPermission(permission)) return null;
    
    return (
      <TouchableOpacity
        key={action}
        style={styles.quickActionButton}
        onPress={() => handleQuickAction(action)}
      >
        <Text style={styles.quickActionIcon}>{icon}</Text>
        <Text style={styles.quickActionText}>{title}</Text>
      </TouchableOpacity>
    );
  };

  const renderPendingItem = (item, type) => (
    <View key={item.id} style={styles.pendingItem}>
      <View style={styles.pendingItemHeader}>
        <Text style={styles.pendingItemTitle}>
          {type === 'bar' ? item.name : `${item.userName}の${type === 'review' ? 'レビュー' : 'クーポン'}`}
        </Text>
        <Text style={styles.pendingItemDate}>
          {new Date(item.createdAt).toLocaleDateString('ja-JP')}
        </Text>
      </View>
      <Text style={styles.pendingItemDescription} numberOfLines={2}>
        {type === 'bar' ? item.genre : item.comment || item.title}
      </Text>
      <View style={styles.pendingItemActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => Alert.alert('承認', `${type === 'bar' ? '店舗' : type === 'review' ? 'レビュー' : 'クーポン'}を承認します`)}
        >
          <Text style={styles.actionButtonText}>承認</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => Alert.alert('却下', `${type === 'bar' ? '店舗' : type === 'review' ? 'レビュー' : 'クーポン'}を却下します`)}
        >
          <Text style={styles.actionButtonText}>却下</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>管理者ダッシュボード</Text>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>👤</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 統計サマリー */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 全体統計</Text>
          <View style={styles.statsGrid}>
            {renderStatsCard('総ユーザー数', stats.totalUsers.toLocaleString(), 'アクティブ: ' + stats.activeUsers.toLocaleString(), '👥')}
            {renderStatsCard('登録店舗数', stats.totalBars, '審査待ち: ' + stats.pendingBars, '🏪')}
            {renderStatsCard('月間売上', '¥' + stats.monthlyRevenue.toLocaleString(), '総売上: ¥' + stats.totalRevenue.toLocaleString(), '💰')}
            {renderStatsCard('アクティブ課金', stats.activeSubscriptions, '総レビュー: ' + stats.totalReviews, '💳')}
          </View>
        </View>

        {/* クイックアクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ クイックアクション</Text>
          <View style={styles.quickActions}>
            {renderQuickAction('店舗審査', '🏪', 'bar_approval', ADMIN_PERMISSIONS.APPROVE_BARS)}
            {renderQuickAction('ユーザー管理', '👥', 'user_management', ADMIN_PERMISSIONS.MANAGE_USERS)}
            {renderQuickAction('システム設定', '⚙️', 'system_settings', ADMIN_PERMISSIONS.MANAGE_SYSTEM)}
            {renderQuickAction('分析レポート', '📈', 'analytics', ADMIN_PERMISSIONS.VIEW_ANALYTICS)}
            {renderQuickAction('課金管理', '💰', 'billing_management', ADMIN_PERMISSIONS.MANAGE_BILLING)}
            {renderQuickAction('ログアウト', '🚪', 'logout')}
          </View>
        </View>

        {/* 審査待ち店舗 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⏳ 審査待ち店舗</Text>
            <TouchableOpacity onPress={() => handleQuickAction('bar_approval')}>
              <Text style={styles.viewAllLink}>すべて見る →</Text>
            </TouchableOpacity>
          </View>
          
          {bars
            .filter(bar => bar.status === BAR_APPROVAL_STATUS.PENDING)
            .slice(0, 3)
            .map(bar => renderPendingItem(bar, 'bar'))}
          
          {bars.filter(bar => bar.status === BAR_APPROVAL_STATUS.PENDING).length === 0 && (
            <Text style={styles.emptyMessage}>審査待ちの店舗はありません</Text>
          )}
        </View>

        {/* 最近のレビュー */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📝 最近のレビュー</Text>
            <TouchableOpacity onPress={() => Alert.alert('レビュー管理', 'レビュー管理画面へ遷移します')}>
              <Text style={styles.viewAllLink}>管理 →</Text>
            </TouchableOpacity>
          </View>
          
          {reviews.slice(0, 3).map(review => {
            const bar = bars.find(b => b.id === review.barId);
            return (
              <View key={review.id} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewBar}>{bar?.name}</Text>
                  <Text style={styles.reviewRating}>⭐ {review.rating}</Text>
                </View>
                <Text style={styles.reviewUser}>{review.userName}</Text>
                <Text style={styles.reviewComment} numberOfLines={2}>
                  {review.comment}
                </Text>
                <View style={styles.reviewActions}>
                  <Text style={styles.reviewDate}>
                    {new Date(review.createdAt).toLocaleDateString('ja-JP')}
                  </Text>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.smallButton]}
                    onPress={() => Alert.alert('レビュー削除', 'このレビューを削除しますか？')}
                  >
                    <Text style={styles.actionButtonText}>削除</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* 管理者情報 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 管理者情報</Text>
          <View style={styles.adminInfo}>
            <View style={styles.adminInfoItem}>
              <Text style={styles.adminInfoLabel}>名前:</Text>
              <Text style={styles.adminInfoValue}>{adminAuthService.getCurrentAdmin()?.name || '不明'}</Text>
            </View>
            <View style={styles.adminInfoItem}>
              <Text style={styles.adminInfoLabel}>ロール:</Text>
              <Text style={styles.adminInfoValue}>{adminAuthService.getCurrentAdmin()?.role || '不明'}</Text>
            </View>
            <View style={styles.adminInfoItem}>
              <Text style={styles.adminInfoLabel}>最終ログイン:</Text>
              <Text style={styles.adminInfoValue}>
                {adminAuthService.getCurrentAdmin()?.lastLogin 
                  ? new Date(adminAuthService.getCurrentAdmin().lastLogin).toLocaleString('ja-JP')
                  : '不明'
                }
              </Text>
            </View>
          </View>
        </View>

        {/* システム状況 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔧 システム状況</Text>
          <View style={styles.systemStatus}>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>サーバー状態</Text>
              <View style={[styles.statusIndicator, styles.statusOnline]} />
              <Text style={styles.statusText}>正常</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>データベース</Text>
              <View style={[styles.statusIndicator, styles.statusOnline]} />
              <Text style={styles.statusText}>正常</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>通知サービス</Text>
              <View style={[styles.statusIndicator, styles.statusOnline]} />
              <Text style={styles.statusText}>正常</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>課金システム</Text>
              <View style={[styles.statusIndicator, styles.statusOnline]} />
              <Text style={styles.statusText}>正常</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
  backButton: {
    fontSize: 24,
    color: '#D4AF37'
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 80
  },
  section: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333'
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 15
  },
  viewAllLink: {
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: '600'
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  statsCard: {
    width: '48%',
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center'
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5
  },
  statsIcon: {
    fontSize: 20,
    marginRight: 8
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  statsTitle: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center'
  },
  statsSubtitle: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    marginTop: 2
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  quickActionButton: {
    width: '48%',
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
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
  pendingItem: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#444'
  },
  pendingItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5
  },
  pendingItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff'
  },
  pendingItemDate: {
    fontSize: 12,
    color: '#999'
  },
  pendingItemDescription: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 10
  },
  pendingItemActions: {
    flexDirection: 'row',
    gap: 10
  },
  actionButton: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    alignItems: 'center'
  },
  smallButton: {
    flex: 0,
    paddingHorizontal: 12
  },
  approveButton: {
    backgroundColor: '#4CAF50'
  },
  rejectButton: {
    backgroundColor: '#FF6B6B'
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    padding: 20
  },
  reviewItem: {
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
    marginBottom: 5
  },
  reviewBar: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff'
  },
  reviewRating: {
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: '600'
  },
  reviewUser: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5
  },
  reviewComment: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 10
  },
  reviewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  reviewDate: {
    fontSize: 12,
    color: '#777'
  },
  systemStatus: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  statusItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#2a2a2a',
    padding: 10,
    borderRadius: 8
  },
  statusLabel: {
    fontSize: 12,
    color: '#fff',
    flex: 1
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8
  },
  statusOnline: {
    backgroundColor: '#4CAF50'
  },
  statusOffline: {
    backgroundColor: '#FF6B6B'
  },
  statusText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600'
  },
  adminInfo: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 8
  },
  adminInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  adminInfoLabel: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600'
  },
  adminInfoValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600'
  }
}); 