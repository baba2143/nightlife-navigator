/**
 * ユーザープロフィールコンポーネント
 * Nightlife Navigator固有のユーザープロフィール機能
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { colors } from '../../design-system/colors-soft-pink';
import { spacingSystem } from '../../design-system/spacing-comfortable';
import { borderRadiusSystem } from '../../design-system/borders-rounded';
import { shadowSystem } from '../../design-system/shadows-soft-pink';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Text } from '../ui/Text';
import { Flex } from '../ui/Layout';

// プロフィール画像コンポーネント
const ProfileAvatar = ({ user, size = 'large', onEdit }) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  const getSizeStyles = () => {
    const sizes = {
      small: { width: 40, height: 40, fontSize: 16 },
      medium: { width: 60, height: 60, fontSize: 24 },
      large: { width: 100, height: 100, fontSize: 36 },
      xlarge: { width: 120, height: 120, fontSize: 48 },
    };
    return sizes[size] || sizes.large;
  };

  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      style={[
        styles.profileAvatar,
        {
          width: sizeStyles.width,
          height: sizeStyles.height,
          borderRadius: sizeStyles.width / 2,
          backgroundColor: theme.colors.background.pinkLight,
          ...theme.shadows.elevation[2],
        },
      ]}
      onPress={onEdit}
    >
      {user.avatar ? (
        <View style={styles.avatarImagePlaceholder}>
          <Text variant="caption" style={{ color: theme.colors.text.secondary }}>
            📷
          </Text>
        </View>
      ) : (
        <Text style={[styles.avatarText, { fontSize: sizeStyles.fontSize, color: theme.colors.brand }]}>
          {user.name.charAt(0).toUpperCase()}
        </Text>
      )}
      {onEdit && (
        <View style={[styles.editBadge, { backgroundColor: theme.colors.brand }]}>
          <Text variant="caption" style={{ color: theme.colors.white, fontSize: 12 }}>
            ✏️
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// プロフィール統計コンポーネント
const ProfileStats = ({ stats }) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  const statItems = [
    { key: 'visitedVenues', label: '訪問店舗', value: stats.visitedVenues || 0, icon: '🏪' },
    { key: 'totalReviews', label: 'レビュー', value: stats.totalReviews || 0, icon: '⭐' },
    { key: 'averageRating', label: '平均評価', value: (stats.averageRating || 0).toFixed(1), icon: '📊' },
    { key: 'helpfulVotes', label: '役に立った', value: stats.helpfulVotes || 0, icon: '👍' },
  ];

  return (
    <Card variant="soft" style={styles.profileStats}>
      <Text variant="h4" style={[styles.statsTitle, { color: theme.colors.brand }]}>
        アクティビティ統計
      </Text>
      <View style={styles.statsGrid}>
        {statItems.map((item) => (
          <View key={item.key} style={styles.statItem}>
            <Text variant="body" style={styles.statIcon}>
              {item.icon}
            </Text>
            <Text variant="h3" style={[styles.statValue, { color: theme.colors.brand }]}>
              {item.value}
            </Text>
            <Text variant="caption" style={styles.statLabel}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
};

// バッジコレクションコンポーネント
const BadgeCollection = ({ badges }) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  const badgeTypes = [
    { id: 'first_review', name: '初回レビュー', icon: '🏆', description: '最初のレビューを投稿' },
    { id: 'regular_visitor', name: '常連客', icon: '🎯', description: '同じ店舗に5回以上訪問' },
    { id: 'helpful_reviewer', name: '役に立つレビュアー', icon: '👍', description: '50回以上「役に立った」を獲得' },
    { id: 'photo_master', name: 'フォトマスター', icon: '📸', description: '100枚以上の写真を投稿' },
    { id: 'nightlife_expert', name: 'ナイトライフエキスパート', icon: '🌃', description: '100店舗以上を訪問' },
    { id: 'social_butterfly', name: 'ソーシャルバタフライ', icon: '🦋', description: '10人以上とつながり' },
  ];

  const earnedBadges = badges || ['first_review', 'regular_visitor'];

  return (
    <Card variant="default" style={styles.badgeCollection}>
      <Text variant="h4" style={[styles.badgeTitle, { color: theme.colors.brand }]}>
        獲得バッジ
      </Text>
      <View style={styles.badgeGrid}>
        {badgeTypes.map((badge) => {
          const isEarned = earnedBadges.includes(badge.id);
          return (
            <View
              key={badge.id}
              style={[
                styles.badgeItem,
                {
                  backgroundColor: isEarned 
                    ? theme.colors.background.pinkLight 
                    : theme.colors.background.surface,
                  borderColor: isEarned 
                    ? theme.colors.brand 
                    : theme.colors.border.light,
                  opacity: isEarned ? 1 : 0.5,
                },
              ]}
            >
              <Text variant="body" style={styles.badgeIcon}>
                {badge.icon}
              </Text>
              <Text variant="caption" style={[
                styles.badgeName,
                { color: isEarned ? theme.colors.brand : theme.colors.text.secondary }
              ]}>
                {badge.name}
              </Text>
              <Text variant="caption" style={styles.badgeDescription}>
                {badge.description}
              </Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
};

// 設定パネルコンポーネント
const SettingsPanel = ({ settings, onSettingsChange }) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  const settingItems = [
    {
      key: 'notifications',
      label: '通知設定',
      type: 'toggle',
      value: settings.notifications,
      description: '新着情報やアップデートの通知を受け取る',
    },
    {
      key: 'locationSharing',
      label: '位置情報共有',
      type: 'toggle',
      value: settings.locationSharing,
      description: '近くの店舗情報を取得するために位置情報を使用',
    },
    {
      key: 'profileVisibility',
      label: 'プロフィール公開',
      type: 'select',
      value: settings.profileVisibility,
      options: [
        { value: 'public', label: '公開' },
        { value: 'friends', label: '友達のみ' },
        { value: 'private', label: '非公開' },
      ],
      description: 'プロフィールの公開範囲を設定',
    },
    {
      key: 'reviewVisibility',
      label: 'レビュー公開',
      type: 'select',
      value: settings.reviewVisibility,
      options: [
        { value: 'public', label: '公開' },
        { value: 'friends', label: '友達のみ' },
        { value: 'private', label: '非公開' },
      ],
      description: 'レビューの公開範囲を設定',
    },
  ];

  const handleToggle = (key) => {
    onSettingsChange(key, !settings[key]);
  };

  const handleSelect = (key, value) => {
    onSettingsChange(key, value);
  };

  return (
    <Card variant="default" style={styles.settingsPanel}>
      <Text variant="h4" style={[styles.settingsTitle, { color: theme.colors.brand }]}>
        設定
      </Text>
      {settingItems.map((item) => (
        <View key={item.key} style={styles.settingItem}>
          <View style={styles.settingHeader}>
            <Text variant="body" style={styles.settingLabel}>
              {item.label}
            </Text>
            {item.type === 'toggle' && (
              <TouchableOpacity
                style={[
                  styles.toggle,
                  {
                    backgroundColor: item.value ? theme.colors.brand : theme.colors.border.medium,
                  },
                ]}
                onPress={() => handleToggle(item.key)}
              >
                <View
                  style={[
                    styles.toggleKnob,
                    {
                      backgroundColor: theme.colors.white,
                      transform: [{ translateX: item.value ? 20 : 2 }],
                    },
                  ]}
                />
              </TouchableOpacity>
            )}
          </View>
          {item.type === 'select' && (
            <View style={styles.selectContainer}>
              {item.options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.selectOption,
                    {
                      backgroundColor: item.value === option.value
                        ? theme.colors.brand
                        : theme.colors.background.surface,
                      borderColor: item.value === option.value
                        ? theme.colors.brand
                        : theme.colors.border.medium,
                    },
                  ]}
                  onPress={() => handleSelect(item.key, option.value)}
                >
                  <Text
                    variant="caption"
                    style={{
                      color: item.value === option.value
                        ? theme.colors.white
                        : theme.colors.text.secondary,
                    }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <Text variant="caption" style={styles.settingDescription}>
            {item.description}
          </Text>
        </View>
      ))}
    </Card>
  );
};

// 最近の活動コンポーネント
const RecentActivity = ({ activities }) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  const sampleActivities = [
    {
      id: 1,
      type: 'review',
      venue: 'GENTLE LOUNGE',
      action: 'レビューを投稿しました',
      timestamp: '2024-01-15T19:30:00Z',
      rating: 5,
    },
    {
      id: 2,
      type: 'visit',
      venue: 'NEON BAR',
      action: 'チェックインしました',
      timestamp: '2024-01-14T20:15:00Z',
    },
    {
      id: 3,
      type: 'favorite',
      venue: 'CLUB TOKYO',
      action: 'お気に入りに追加しました',
      timestamp: '2024-01-13T21:00:00Z',
    },
  ];

  const displayActivities = activities || sampleActivities;

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours}時間前`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}日前`;
    }
  };

  const getActivityIcon = (type) => {
    const icons = {
      review: '⭐',
      visit: '📍',
      favorite: '❤️',
      badge: '🏆',
    };
    return icons[type] || '📋';
  };

  return (
    <Card variant="default" style={styles.recentActivity}>
      <Text variant="h4" style={[styles.activityTitle, { color: theme.colors.brand }]}>
        最近の活動
      </Text>
      <View style={styles.activityList}>
        {displayActivities.map((activity) => (
          <View key={activity.id} style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Text variant="body">
                {getActivityIcon(activity.type)}
              </Text>
            </View>
            <View style={styles.activityContent}>
              <Text variant="body" style={styles.activityVenue}>
                {activity.venue}
              </Text>
              <Text variant="bodySmall" style={styles.activityAction}>
                {activity.action}
              </Text>
              <Text variant="caption" style={styles.activityTime}>
                {formatDate(activity.timestamp)}
              </Text>
            </View>
            {activity.rating && (
              <Badge variant="soft" size="sm">
                {activity.rating}★
              </Badge>
            )}
          </View>
        ))}
      </View>
    </Card>
  );
};

// メインユーザープロフィールコンポーネント
const UserProfile = ({ user, onUserUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);
  const [settings, setSettings] = useState({
    notifications: true,
    locationSharing: true,
    profileVisibility: 'public',
    reviewVisibility: 'public',
  });

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

  const displayUser = user || sampleUser;

  const handleSave = () => {
    if (!editedUser.name.trim()) {
      Alert.alert('エラー', '名前を入力してください');
      return;
    }

    onUserUpdate?.(editedUser);
    setIsEditing(false);
    Alert.alert('完了', 'プロフィールを更新しました');
  };

  const handleCancel = () => {
    setEditedUser(displayUser);
    setIsEditing(false);
  };

  const handleSettingsChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* プロフィールヘッダー */}
      <Card variant="soft" style={styles.profileHeader}>
        <View style={styles.profileHeaderContent}>
          <ProfileAvatar
            user={displayUser}
            size="xlarge"
            onEdit={isEditing ? () => console.log('Edit avatar') : null}
          />
          <View style={styles.profileInfo}>
            {isEditing ? (
              <TextInput
                style={[
                  styles.nameInput,
                  {
                    borderColor: theme.colors.border.medium,
                    backgroundColor: theme.colors.background.surface,
                    color: theme.colors.text.primary,
                  },
                ]}
                value={editedUser.name}
                onChangeText={(text) => setEditedUser(prev => ({ ...prev, name: text }))}
                placeholder="名前"
                placeholderTextColor={theme.colors.text.tertiary}
              />
            ) : (
              <Text variant="h2" style={[styles.userName, { color: theme.colors.brand }]}>
                {displayUser.name}
              </Text>
            )}
            <Text variant="bodySmall" color="textSecondary">
              {displayUser.email}
            </Text>
            <Text variant="caption" color="textTertiary">
              {displayUser.location} • {new Date(displayUser.joinDate).toLocaleDateString('ja-JP')}から参加
            </Text>
          </View>
        </View>

        {isEditing ? (
          <TextInput
            style={[
              styles.bioInput,
              {
                borderColor: theme.colors.border.medium,
                backgroundColor: theme.colors.background.surface,
                color: theme.colors.text.primary,
              },
            ]}
            value={editedUser.bio}
            onChangeText={(text) => setEditedUser(prev => ({ ...prev, bio: text }))}
            placeholder="自己紹介"
            placeholderTextColor={theme.colors.text.tertiary}
            multiline
            numberOfLines={3}
          />
        ) : (
          <Text variant="body" style={styles.userBio}>
            {displayUser.bio}
          </Text>
        )}

        <View style={styles.profileActions}>
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onPress={handleCancel}
                style={styles.profileActionButton}
              >
                キャンセル
              </Button>
              <Button
                variant="primary"
                onPress={handleSave}
                style={styles.profileActionButton}
              >
                保存
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              onPress={() => setIsEditing(true)}
              style={styles.profileActionButton}
            >
              プロフィールを編集
            </Button>
          )}
        </View>
      </Card>

      {/* プロフィール統計 */}
      <ProfileStats stats={displayUser.stats} />

      {/* バッジコレクション */}
      <BadgeCollection badges={displayUser.badges} />

      {/* 最近の活動 */}
      <RecentActivity />

      {/* 設定パネル */}
      <SettingsPanel
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  
  // プロフィールヘッダー
  profileHeader: {
    margin: spacingSystem.layout.container.md,
    padding: spacingSystem.layout.card.paddingLarge,
  },
  
  profileHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingSystem.component.gap.xl,
    marginBottom: spacingSystem.component.margin.lg,
  },
  
  profileAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  
  avatarImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.surface,
    borderRadius: 60,
  },
  
  avatarText: {
    fontWeight: 'bold',
  },
  
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  profileInfo: {
    flex: 1,
    gap: spacingSystem.component.gap.xs,
  },
  
  userName: {
    // Set by variant
  },
  
  nameInput: {
    fontSize: 24,
    fontWeight: '600',
    borderWidth: 1,
    borderRadius: borderRadiusSystem.component.input.medium,
    padding: spacingSystem.component.padding.sm,
  },
  
  userBio: {
    lineHeight: 22,
    marginBottom: spacingSystem.component.margin.lg,
  },
  
  bioInput: {
    fontSize: 16,
    borderWidth: 1,
    borderRadius: borderRadiusSystem.component.input.medium,
    padding: spacingSystem.component.padding.md,
    textAlignVertical: 'top',
    marginBottom: spacingSystem.component.margin.lg,
  },
  
  profileActions: {
    flexDirection: 'row',
    gap: spacingSystem.component.gap.md,
  },
  
  profileActionButton: {
    flex: 1,
  },
  
  // 統計
  profileStats: {
    margin: spacingSystem.layout.container.md,
    padding: spacingSystem.layout.card.padding,
  },
  
  statsTitle: {
    marginBottom: spacingSystem.component.margin.lg,
  },
  
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  
  statItem: {
    alignItems: 'center',
    gap: spacingSystem.component.gap.sm,
  },
  
  statIcon: {
    fontSize: 24,
  },
  
  statValue: {
    // Set by variant
  },
  
  statLabel: {
    color: colors.text.secondary,
  },
  
  // バッジ
  badgeCollection: {
    margin: spacingSystem.layout.container.md,
    padding: spacingSystem.layout.card.padding,
  },
  
  badgeTitle: {
    marginBottom: spacingSystem.component.margin.lg,
  },
  
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacingSystem.component.gap.md,
  },
  
  badgeItem: {
    width: '48%',
    padding: spacingSystem.component.padding.md,
    borderRadius: borderRadiusSystem.component.card.medium,
    borderWidth: 1,
    alignItems: 'center',
    gap: spacingSystem.component.gap.sm,
  },
  
  badgeIcon: {
    fontSize: 32,
  },
  
  badgeName: {
    fontWeight: '600',
    textAlign: 'center',
  },
  
  badgeDescription: {
    textAlign: 'center',
    color: colors.text.tertiary,
  },
  
  // 最近の活動
  recentActivity: {
    margin: spacingSystem.layout.container.md,
    padding: spacingSystem.layout.card.padding,
  },
  
  activityTitle: {
    marginBottom: spacingSystem.component.margin.lg,
  },
  
  activityList: {
    gap: spacingSystem.component.gap.md,
  },
  
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingSystem.component.gap.md,
    paddingVertical: spacingSystem.component.padding.sm,
  },
  
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.pinkLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  activityContent: {
    flex: 1,
    gap: spacingSystem.component.gap.xs,
  },
  
  activityVenue: {
    fontWeight: '600',
  },
  
  activityAction: {
    color: colors.text.secondary,
  },
  
  activityTime: {
    color: colors.text.tertiary,
  },
  
  // 設定
  settingsPanel: {
    margin: spacingSystem.layout.container.md,
    padding: spacingSystem.layout.card.padding,
    marginBottom: spacingSystem.layout.container.xl,
  },
  
  settingsTitle: {
    marginBottom: spacingSystem.component.margin.lg,
  },
  
  settingItem: {
    marginBottom: spacingSystem.component.margin.xl,
  },
  
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingSystem.component.margin.sm,
  },
  
  settingLabel: {
    fontWeight: '600',
  },
  
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    position: 'relative',
  },
  
  toggleKnob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    position: 'absolute',
  },
  
  selectContainer: {
    flexDirection: 'row',
    gap: spacingSystem.component.gap.sm,
    marginBottom: spacingSystem.component.margin.sm,
  },
  
  selectOption: {
    paddingHorizontal: spacingSystem.component.padding.md,
    paddingVertical: spacingSystem.component.padding.sm,
    borderRadius: borderRadiusSystem.component.badge.small,
    borderWidth: 1,
  },
  
  settingDescription: {
    color: colors.text.tertiary,
    lineHeight: 18,
  },
});

export default UserProfile;