/**
 * Nightlife Navigator メインコンポーネント
 * 全ての機能を統合したメインアプリケーション
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar, Modal, Alert } from 'react-native';
import { colors } from '../../design-system/colors-soft-pink';
import { spacingSystem } from '../../design-system/spacing-comfortable';
import { borderRadiusSystem } from '../../design-system/borders-rounded';
import { shadowSystem } from '../../design-system/shadows-soft-pink';
import { SafeContainer } from '../ui/Layout';
import { Header, TabBar } from '../ui/Navigation';
import { Text } from '../ui/Text';

// 機能コンポーネントのインポート
import VenueSearch from './VenueSearch';
import VenueMap from './VenueMap';
import VenueDetails from './VenueDetails';
import ReviewSystem from './ReviewSystem';
import UserProfile from './UserProfile';
import FavoriteManager from './FavoriteManager';
import NotificationSystem from './NotificationSystem';

// メインナビゲーションコンポーネント
const NightlifeNavigator = () => {
  const [activeTab, setActiveTab] = useState('search');
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [showVenueDetails, setShowVenueDetails] = useState(false);
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  // サンプルユーザーデータ
  const sampleUser = {
    id: 1,
    name: '田中太郎',
    email: 'tanaka@example.com',
    bio: 'ナイトライフ愛好家。美味しいお酒と音楽を求めて東京の夜を探索中。',
    joinDate: '2023-06-15',
    location: '東京都渋谷区',
    avatar: null,
    stats: {
      visitedVenues: 45,
      totalReviews: 32,
      averageRating: 4.2,
      helpfulVotes: 128,
    },
    badges: ['first_review', 'regular_visitor', 'helpful_reviewer'],
  };

  // タブ設定
  const tabs = [
    { 
      id: 'search', 
      label: '検索', 
      icon: { name: 'search' },
      component: VenueSearch,
    },
    { 
      id: 'map', 
      label: '地図', 
      icon: { name: 'map' },
      component: VenueMap,
    },
    { 
      id: 'favorites', 
      label: 'お気に入り', 
      icon: { name: 'heart' },
      component: FavoriteManager,
    },
    { 
      id: 'notifications', 
      label: '通知', 
      icon: { name: 'notifications' },
      component: NotificationSystem,
      badge: unreadCount > 0 ? unreadCount.toString() : null,
    },
    { 
      id: 'profile', 
      label: 'プロフィール', 
      icon: { name: 'person' },
      component: UserProfile,
    },
  ];

  useEffect(() => {
    // 初期化
    setUser(sampleUser);
    
    // 未読通知数を更新
    const unread = notifications.filter(n => !n.isRead).length;
    setUnreadCount(unread);
  }, [notifications]);

  // 店舗選択ハンドラー
  const handleVenueSelect = (venue) => {
    setSelectedVenue(venue);
    setShowVenueDetails(true);
  };

  // 店舗詳細を閉じる
  const handleCloseVenueDetails = () => {
    setShowVenueDetails(false);
    setSelectedVenue(null);
  };

  // ユーザー更新ハンドラー
  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  // 通知アクションハンドラー
  const handleNotificationAction = (notification) => {
    console.log('Notification action:', notification);
    
    // 通知タイプに応じて適切な画面に遷移
    switch (notification.type) {
      case 'new_venue':
      case 'event':
      case 'promotion':
        // 店舗詳細を表示（実際の実装では対応する店舗データを取得）
        break;
      case 'review':
        // レビュー画面に遷移
        setActiveTab('search');
        break;
      case 'favorite':
        // お気に入り画面に遷移
        setActiveTab('favorites');
        break;
      case 'social':
        // プロフィール画面に遷移
        setActiveTab('profile');
        break;
      default:
        break;
    }
  };

  // アクティブなタブコンポーネントを取得
  const getActiveTabComponent = () => {
    const activeTabConfig = tabs.find(tab => tab.id === activeTab);
    if (!activeTabConfig) return null;

    const Component = activeTabConfig.component;
    
    // 各コンポーネントに適切なプロパティを渡す
    const componentProps = {
      onVenueSelect: handleVenueSelect,
    };

    // コンポーネント固有のプロパティを追加
    switch (activeTab) {
      case 'search':
        return <Component {...componentProps} />;
      case 'map':
        return (
          <Component 
            {...componentProps}
            selectedVenue={selectedVenue}
            onVenueDetails={handleVenueSelect}
          />
        );
      case 'favorites':
        return <Component {...componentProps} />;
      case 'notifications':
        return (
          <Component 
            onNotificationAction={handleNotificationAction}
          />
        );
      case 'profile':
        return (
          <Component 
            user={user}
            onUserUpdate={handleUserUpdate}
          />
        );
      default:
        return <Component {...componentProps} />;
    }
  };

  // ヘッダータイトルを取得
  const getHeaderTitle = () => {
    const titles = {
      search: '店舗検索',
      map: '地図',
      favorites: 'お気に入り',
      notifications: '通知',
      profile: 'プロフィール',
    };
    return titles[activeTab] || 'Nightlife Navigator';
  };

  return (
    <SafeContainer style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background.primary} />
      
      {/* ヘッダー */}
      <Header
        title={getHeaderTitle()}
        leftIcon={
          activeTab === 'search' ? (
            <Text variant="body">🔍</Text>
          ) : (
            <Text variant="body">🏪</Text>
          )
        }
        rightIcon={
          unreadCount > 0 ? (
            <View style={styles.notificationIcon}>
              <Text variant="body">🔔</Text>
              {unreadCount > 0 && (
                <View style={[styles.notificationBadge, { backgroundColor: theme.colors.error[500] }]}>
                  <Text variant="caption" style={styles.notificationBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <Text variant="body">🔔</Text>
          )
        }
        onRightPress={() => setActiveTab('notifications')}
        variant="default"
      />

      {/* メインコンテンツ */}
      <View style={styles.content}>
        {getActiveTabComponent()}
      </View>

      {/* タブナビゲーション */}
      <TabBar
        tabs={tabs.map(tab => ({
          icon: <Text variant="body">{getTabIcon(tab.id)}</Text>,
          label: tab.label,
          badge: tab.badge,
        }))}
        activeTab={tabs.findIndex(tab => tab.id === activeTab)}
        onTabChange={(index) => setActiveTab(tabs[index].id)}
        variant="default"
      />

      {/* 店舗詳細モーダル */}
      <Modal
        visible={showVenueDetails}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseVenueDetails}
      >
        {selectedVenue && (
          <VenueDetails
            venue={selectedVenue}
            onClose={handleCloseVenueDetails}
          />
        )}
      </Modal>
    </SafeContainer>
  );
};

// タブアイコンを取得するヘルパー関数
const getTabIcon = (tabId) => {
  const icons = {
    search: '🔍',
    map: '🗺️',
    favorites: '❤️',
    notifications: '🔔',
    profile: '👤',
  };
  return icons[tabId] || '📱';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  
  content: {
    flex: 1,
  },
  
  notificationIcon: {
    position: 'relative',
  },
  
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  
  notificationBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
});

export default NightlifeNavigator;