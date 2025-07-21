/**
 * Nightlife Navigator 完全統合デモ
 * Snack Expo用のデモアプリケーション
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar, Modal, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, SafeAreaView } from 'react-native';

// やさしいピンクデザインシステム
const theme = {
  colors: {
    // プライマリ - やさしいピンク
    primary: '#ea5a7b',
    primaryLight: '#f27790',
    primaryDark: '#d63c5e',
    
    // セカンダリ - 補完的なローズピンク
    secondary: '#f43f5e',
    secondaryLight: '#fb7185',
    secondaryDark: '#e11d48',
    
    // アクセント - 明るいピンク
    accent: '#ec4899',
    accentLight: '#f472b6',
    accentDark: '#db2777',
    
    // やさしい背景色
    background: '#ffffff',
    backgroundSecondary: '#fafafa',
    backgroundTertiary: '#f5f5f5',
    
    // カード背景
    surface: '#ffffff',
    surfaceElevated: '#ffffff',
    surfaceSoft: '#fefbfb',
    
    // ピンクアクセント背景
    pinkLight: '#fef7f7',
    pinkSoft: '#fdeaeb',
    pinkAccent: '#fef7f7',
    
    // やさしいテキストカラー
    text: '#1a1a1a',
    textSecondary: '#666666',
    textTertiary: '#999999',
    textDisabled: '#cccccc',
    
    // やさしいボーダーカラー
    border: '#f0f0f0',
    borderLight: '#f8f8f8',
    borderMedium: '#e8e8e8',
    borderStrong: '#d0d0d0',
    
    // 状態カラー
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    
    // 白・黒
    white: '#ffffff',
    black: '#000000',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
  
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    full: 9999,
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.07,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.07,
      shadowRadius: 6,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 15,
      elevation: 5,
    },
    pink: {
      shadowColor: '#ea5a7b',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 4,
    },
  },
};

// UIコンポーネント
const Button = ({ children, variant = 'primary', size = 'md', onPress, style, disabled }) => {
  const variants = {
    primary: {
      backgroundColor: theme.colors.primary,
      color: theme.colors.white,
    },
    secondary: {
      backgroundColor: theme.colors.secondary,
      color: theme.colors.white,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.primary,
      color: theme.colors.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: theme.colors.primary,
    },
  };

  const sizes = {
    sm: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      fontSize: 14,
    },
    md: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      fontSize: 16,
    },
    lg: {
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.lg,
      fontSize: 18,
    },
  };

  const variantStyle = variants[variant];
  const sizeStyle = sizes[size];

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: variantStyle.backgroundColor,
          borderWidth: variantStyle.borderWidth || 0,
          borderColor: variantStyle.borderColor,
          paddingHorizontal: sizeStyle.paddingHorizontal,
          paddingVertical: sizeStyle.paddingVertical,
          borderRadius: theme.borderRadius.md,
          ...theme.shadows.sm,
        },
        disabled && { opacity: 0.5 },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[
        styles.buttonText,
        {
          color: variantStyle.color,
          fontSize: sizeStyle.fontSize,
          fontWeight: '500',
        },
      ]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
};

const Card = ({ children, variant = 'default', style }) => {
  const variants = {
    default: {
      backgroundColor: theme.colors.surface,
      ...theme.shadows.sm,
    },
    elevated: {
      backgroundColor: theme.colors.surfaceElevated,
      ...theme.shadows.md,
    },
    soft: {
      backgroundColor: theme.colors.surfaceSoft,
      ...theme.shadows.sm,
    },
  };

  return (
    <View style={[
      styles.card,
      {
        backgroundColor: variants[variant].backgroundColor,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        ...variants[variant],
      },
      style,
    ]}>
      {children}
    </View>
  );
};

const Badge = ({ children, variant = 'default', size = 'md', style }) => {
  const variants = {
    default: { backgroundColor: theme.colors.borderLight, color: theme.colors.text },
    primary: { backgroundColor: theme.colors.primary, color: theme.colors.white },
    soft: { backgroundColor: theme.colors.pinkLight, color: theme.colors.primary },
    outline: { 
      backgroundColor: 'transparent', 
      borderWidth: 1,
      borderColor: theme.colors.primary,
      color: theme.colors.primary,
    },
  };

  const sizes = {
    sm: { paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs, fontSize: 11 },
    md: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, fontSize: 12 },
    lg: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, fontSize: 14 },
  };

  const variantStyle = variants[variant];
  const sizeStyle = sizes[size];

  return (
    <View style={[
      styles.badge,
      {
        backgroundColor: variantStyle.backgroundColor,
        borderWidth: variantStyle.borderWidth || 0,
        borderColor: variantStyle.borderColor,
        paddingHorizontal: sizeStyle.paddingHorizontal,
        paddingVertical: sizeStyle.paddingVertical,
        borderRadius: theme.borderRadius.full,
      },
      style,
    ]}>
      <Text style={[
        styles.badgeText,
        {
          color: variantStyle.color,
          fontSize: sizeStyle.fontSize,
          fontWeight: '500',
        },
      ]}>
        {children}
      </Text>
    </View>
  );
};

// デモスクリーン
const SearchScreen = ({ onVenueSelect }) => {
  const venues = [
    {
      id: 1,
      name: "GENTLE LOUNGE",
      category: "lounge",
      address: "渋谷区渋谷1-2-3",
      rating: 4.8,
      priceRange: "expensive",
      distance: 250,
      description: "やさしいピンクの温かみのあるデザインで、心地よい雰囲気を演出。",
      tags: ["ラウンジ", "やさしい", "ピンク"],
      isOpen: true,
    },
    {
      id: 2,
      name: "NEON BAR",
      category: "bar",
      address: "新宿区新宿2-3-4",
      rating: 4.5,
      priceRange: "moderate",
      distance: 800,
      description: "ネオンライトが美しい大人のバー。カクテルの種類が豊富。",
      tags: ["バー", "ネオン", "カクテル"],
      isOpen: true,
    },
  ];

  return (
    <ScrollView style={styles.screen}>
      <View style={styles.searchHeader}>
        <Text style={[styles.screenTitle, { color: theme.colors.primary }]}>
          店舗検索
        </Text>
        <Text style={[styles.screenSubtitle, { color: theme.colors.textSecondary }]}>
          {venues.length}件の店舗が見つかりました
        </Text>
      </View>
      
      {venues.map((venue) => (
        <TouchableOpacity key={venue.id} onPress={() => onVenueSelect(venue)}>
          <Card variant="elevated" style={styles.venueCard}>
            <View style={styles.venueHeader}>
              <Text style={[styles.venueName, { color: theme.colors.primary }]}>
                🏪 {venue.name}
              </Text>
              <Badge variant="soft" size="sm">
                {venue.rating} ★
              </Badge>
            </View>
            <Text style={[styles.venueAddress, { color: theme.colors.textSecondary }]}>
              {venue.address}
            </Text>
            <Text style={[styles.venueDescription, { color: theme.colors.text }]}>
              {venue.description}
            </Text>
            <View style={styles.venueTags}>
              {venue.tags.map((tag, index) => (
                <Badge key={index} variant="outline" size="sm">
                  {tag}
                </Badge>
              ))}
            </View>
          </Card>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const MapScreen = () => {
  return (
    <View style={styles.screen}>
      <View style={styles.centerContent}>
        <Text style={[styles.screenTitle, { color: theme.colors.primary }]}>
          地図
        </Text>
        <View style={[styles.mapPlaceholder, { backgroundColor: theme.colors.pinkLight }]}>
          <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
            🗺️ 地図表示エリア
          </Text>
          <Text style={[styles.placeholderSubtext, { color: theme.colors.textTertiary }]}>
            実際の実装では地図ライブラリを使用
          </Text>
        </View>
      </View>
    </View>
  );
};

const FavoritesScreen = () => {
  const [favorites, setFavorites] = useState([
    {
      id: 1,
      name: "GENTLE LOUNGE",
      category: "lounge",
      rating: 4.8,
      favoriteDate: "2024-01-15",
    },
    {
      id: 2,
      name: "NEON BAR",
      category: "bar",
      rating: 4.5,
      favoriteDate: "2024-01-10",
    },
  ]);

  const removeFavorite = (id) => {
    setFavorites(prev => prev.filter(f => f.id !== id));
  };

  return (
    <ScrollView style={styles.screen}>
      <View style={styles.favoriteHeader}>
        <Text style={[styles.screenTitle, { color: theme.colors.primary }]}>
          お気に入り
        </Text>
        <Text style={[styles.screenSubtitle, { color: theme.colors.textSecondary }]}>
          {favorites.length}件のお気に入り
        </Text>
      </View>
      
      {favorites.map((favorite) => (
        <Card key={favorite.id} variant="elevated" style={styles.favoriteCard}>
          <View style={styles.favoriteHeader}>
            <Text style={[styles.favoriteName, { color: theme.colors.primary }]}>
              ❤️ {favorite.name}
            </Text>
            <TouchableOpacity onPress={() => removeFavorite(favorite.id)}>
              <Text style={[styles.removeButton, { color: theme.colors.error }]}>
                削除
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.favoriteRating, { color: theme.colors.textSecondary }]}>
            評価: {favorite.rating} ★
          </Text>
          <Text style={[styles.favoriteDate, { color: theme.colors.textTertiary }]}>
            {favorite.favoriteDate}に追加
          </Text>
        </Card>
      ))}
      
      {favorites.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
            💔 お気に入りはありません
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const NotificationScreen = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'new_venue',
      title: '新しい店舗が追加されました',
      message: '渋谷に新しいラウンジがオープン',
      timestamp: '2分前',
      isRead: false,
    },
    {
      id: 2,
      type: 'review',
      title: 'お気に入り店舗に新しいレビュー',
      message: 'GENTLE LOUNGEに新しいレビュー',
      timestamp: '1時間前',
      isRead: true,
    },
  ]);

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  return (
    <ScrollView style={styles.screen}>
      <View style={styles.notificationHeader}>
        <Text style={[styles.screenTitle, { color: theme.colors.primary }]}>
          通知
        </Text>
        <Text style={[styles.screenSubtitle, { color: theme.colors.textSecondary }]}>
          {notifications.filter(n => !n.isRead).length}件の未読通知
        </Text>
      </View>
      
      {notifications.map((notification) => (
        <TouchableOpacity key={notification.id} onPress={() => markAsRead(notification.id)}>
          <Card 
            variant={notification.isRead ? 'default' : 'soft'} 
            style={[
              styles.notificationCard,
              !notification.isRead && { borderLeftWidth: 4, borderLeftColor: theme.colors.primary }
            ]}
          >
            <View style={styles.notificationHeader}>
              <Text style={[styles.notificationIcon, { color: theme.colors.primary }]}>
                {notification.type === 'new_venue' ? '🏪' : '⭐'}
              </Text>
              <View style={styles.notificationContent}>
                <Text style={[styles.notificationTitle, { fontWeight: '600' }]}>
                  {notification.title}
                </Text>
                <Text style={[styles.notificationMessage, { color: theme.colors.textSecondary }]}>
                  {notification.message}
                </Text>
                <Text style={[styles.notificationTime, { color: theme.colors.textTertiary }]}>
                  {notification.timestamp}
                </Text>
              </View>
              {!notification.isRead && (
                <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]} />
              )}
            </View>
          </Card>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const ProfileScreen = () => {
  const user = {
    name: '田中太郎',
    email: 'tanaka@example.com',
    stats: {
      visitedVenues: 45,
      totalReviews: 32,
      averageRating: 4.2,
    },
  };

  return (
    <ScrollView style={styles.screen}>
      <View style={styles.profileHeader}>
        <View style={[styles.profileAvatar, { backgroundColor: theme.colors.pinkLight }]}>
          <Text style={[styles.profileAvatarText, { color: theme.colors.primary }]}>
            田
          </Text>
        </View>
        <Text style={[styles.profileName, { color: theme.colors.primary }]}>
          {user.name}
        </Text>
        <Text style={[styles.profileEmail, { color: theme.colors.textSecondary }]}>
          {user.email}
        </Text>
      </View>
      
      <Card variant="soft" style={styles.statsCard}>
        <Text style={[styles.statsTitle, { color: theme.colors.primary }]}>
          統計
        </Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {user.stats.visitedVenues}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              訪問店舗
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {user.stats.totalReviews}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              レビュー
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {user.stats.averageRating}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              平均評価
            </Text>
          </View>
        </View>
      </Card>
      
      <Button variant="primary" style={styles.editButton}>
        プロフィールを編集
      </Button>
    </ScrollView>
  );
};

const VenueDetailModal = ({ venue, visible, onClose }) => {
  if (!venue) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: theme.colors.primary }]}>
            店舗詳細
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.closeButton, { color: theme.colors.textTertiary }]}>
              ×
            </Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={[styles.venueImage, { backgroundColor: theme.colors.pinkLight }]}>
            <Text style={[styles.venueImageText, { color: theme.colors.primary }]}>
              📷 店舗画像
            </Text>
          </View>
          
          <Card variant="elevated" style={styles.venueDetailCard}>
            <Text style={[styles.venueDetailName, { color: theme.colors.primary }]}>
              🏪 {venue.name}
            </Text>
            <Text style={[styles.venueDetailAddress, { color: theme.colors.textSecondary }]}>
              {venue.address}
            </Text>
            <View style={styles.venueDetailRating}>
              <Badge variant="soft" size="md">
                {venue.rating} ★
              </Badge>
              <Badge variant="outline" size="md">
                {venue.distance}m
              </Badge>
            </View>
            <Text style={[styles.venueDetailDescription, { color: theme.colors.text }]}>
              {venue.description}
            </Text>
            
            <View style={styles.venueDetailActions}>
              <Button variant="outline" style={styles.actionButton}>
                お気に入り
              </Button>
              <Button variant="primary" style={styles.actionButton}>
                道順を見る
              </Button>
            </View>
          </Card>
          
          <Card variant="default" style={styles.venueDetailCard}>
            <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
              営業時間
            </Text>
            <Text style={[styles.sectionContent, { color: theme.colors.text }]}>
              月-木: 18:00 - 02:00
              {'\n'}金-土: 18:00 - 03:00
              {'\n'}日: 18:00 - 01:00
            </Text>
          </Card>
          
          <Card variant="default" style={styles.venueDetailCard}>
            <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
              設備・サービス
            </Text>
            <View style={styles.amenitiesGrid}>
              {['Wi-Fi', 'クレジットカード', '個室', '喫煙可'].map((amenity, index) => (
                <Badge key={index} variant="outline" size="sm">
                  {amenity}
                </Badge>
              ))}
            </View>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// メインアプリ
export default function NightlifeNavigatorDemo() {
  const [activeTab, setActiveTab] = useState('search');
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [showVenueDetails, setShowVenueDetails] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(2);

  const tabs = [
    { id: 'search', label: '検索', icon: '🔍' },
    { id: 'map', label: '地図', icon: '🗺️' },
    { id: 'favorites', label: 'お気に入り', icon: '❤️' },
    { id: 'notifications', label: '通知', icon: '🔔', badge: unreadNotifications },
    { id: 'profile', label: 'プロフィール', icon: '👤' },
  ];

  const handleVenueSelect = (venue) => {
    setSelectedVenue(venue);
    setShowVenueDetails(true);
  };

  const handleCloseVenueDetails = () => {
    setShowVenueDetails(false);
    setSelectedVenue(null);
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'search':
        return <SearchScreen onVenueSelect={handleVenueSelect} />;
      case 'map':
        return <MapScreen />;
      case 'favorites':
        return <FavoritesScreen />;
      case 'notifications':
        return <NotificationScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <SearchScreen onVenueSelect={handleVenueSelect} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>
          Nightlife Navigator
        </Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setActiveTab('notifications')}>
            <Text style={styles.headerIcon}>🔔</Text>
            {unreadNotifications > 0 && (
              <View style={[styles.notificationBadge, { backgroundColor: theme.colors.error }]}>
                <Text style={[styles.notificationBadgeText, { color: theme.colors.white }]}>
                  {unreadNotifications}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* メインコンテンツ */}
      <View style={styles.content}>
        {renderScreen()}
      </View>

      {/* タブバー */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabItem,
              activeTab === tab.id && { backgroundColor: theme.colors.primary }
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[
              styles.tabLabel,
              { color: activeTab === tab.id ? theme.colors.white : theme.colors.textSecondary }
            ]}>
              {tab.label}
            </Text>
            {tab.badge && (
              <View style={[styles.tabBadge, { backgroundColor: theme.colors.error }]}>
                <Text style={[styles.tabBadgeText, { color: theme.colors.white }]}>
                  {tab.badge}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* 店舗詳細モーダル */}
      <VenueDetailModal
        venue={selectedVenue}
        visible={showVenueDetails}
        onClose={handleCloseVenueDetails}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  // ヘッダー
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  
  headerRight: {
    position: 'relative',
  },
  
  headerIcon: {
    fontSize: 20,
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
    fontSize: 10,
    fontWeight: '600',
  },
  
  // コンテンツ
  content: {
    flex: 1,
  },
  
  screen: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  
  screenTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  
  screenSubtitle: {
    fontSize: 14,
    marginBottom: theme.spacing.xl,
  },
  
  // 検索画面
  searchHeader: {
    marginBottom: theme.spacing.lg,
  },
  
  venueCard: {
    marginBottom: theme.spacing.lg,
  },
  
  venueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  
  venueName: {
    fontSize: 18,
    fontWeight: '600',
  },
  
  venueAddress: {
    fontSize: 14,
    marginBottom: theme.spacing.md,
  },
  
  venueDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  
  venueTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  
  // 地図画面
  mapPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
  },
  
  placeholderSubtext: {
    fontSize: 14,
  },
  
  // お気に入り画面
  favoriteHeader: {
    marginBottom: theme.spacing.lg,
  },
  
  favoriteCard: {
    marginBottom: theme.spacing.lg,
  },
  
  favoriteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  
  favoriteName: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  removeButton: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  favoriteRating: {
    fontSize: 14,
    marginBottom: theme.spacing.xs,
  },
  
  favoriteDate: {
    fontSize: 12,
  },
  
  // 通知画面
  notificationHeader: {
    marginBottom: theme.spacing.lg,
  },
  
  notificationCard: {
    marginBottom: theme.spacing.lg,
  },
  
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  
  notificationIcon: {
    fontSize: 20,
  },
  
  notificationContent: {
    flex: 1,
  },
  
  notificationTitle: {
    fontSize: 14,
    marginBottom: theme.spacing.xs,
  },
  
  notificationMessage: {
    fontSize: 13,
    marginBottom: theme.spacing.xs,
  },
  
  notificationTime: {
    fontSize: 12,
  },
  
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  
  // プロフィール画面
  profileHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  
  profileAvatarText: {
    fontSize: 32,
    fontWeight: '600',
  },
  
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  
  profileEmail: {
    fontSize: 14,
  },
  
  statsCard: {
    marginBottom: theme.spacing.lg,
  },
  
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: theme.spacing.lg,
  },
  
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  
  statItem: {
    alignItems: 'center',
  },
  
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  
  statLabel: {
    fontSize: 12,
  },
  
  editButton: {
    marginTop: theme.spacing.lg,
  },
  
  // タブバー
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.xs,
    position: 'relative',
  },
  
  tabIcon: {
    fontSize: 20,
    marginBottom: theme.spacing.xs,
  },
  
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  
  tabBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  
  // モーダル
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  
  closeButton: {
    fontSize: 24,
    fontWeight: '300',
  },
  
  modalContent: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  
  venueImage: {
    height: 200,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  
  venueImageText: {
    fontSize: 18,
    fontWeight: '600',
  },
  
  venueDetailCard: {
    marginBottom: theme.spacing.lg,
  },
  
  venueDetailName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  
  venueDetailAddress: {
    fontSize: 14,
    marginBottom: theme.spacing.md,
  },
  
  venueDetailRating: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  
  venueDetailDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  
  venueDetailActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  
  actionButton: {
    flex: 1,
  },
  
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  
  sectionContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  
  // 共通スタイル
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  buttonText: {
    textAlign: 'center',
  },
  
  card: {
    // styles applied dynamically
  },
  
  badge: {
    alignSelf: 'flex-start',
  },
  
  badgeText: {
    textAlign: 'center',
  },
  
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
});