/**
 * 店舗詳細表示コンポーネント
 * Nightlife Navigator固有の店舗詳細情報表示機能
 */

import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Modal, Alert, Linking } from 'react-native';
import { colors } from '../../design-system/colors-soft-pink';
import { spacingSystem } from '../../design-system/spacing-comfortable';
import { borderRadiusSystem } from '../../design-system/borders-rounded';
import { shadowSystem } from '../../design-system/shadows-soft-pink';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Text } from '../ui/Text';
import { Flex } from '../ui/Layout';
import ReviewSystem from './ReviewSystem';

const { width: screenWidth } = Dimensions.get('window');

// 店舗画像ギャラリー
const VenueImageGallery = ({ images, venueName }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const scrollViewRef = useRef();

  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  const sampleImages = [
    { id: 1, url: null, caption: 'メインエントランス' },
    { id: 2, url: null, caption: 'バーカウンター' },
    { id: 3, url: null, caption: 'VIPルーム' },
    { id: 4, url: null, caption: 'ダンスフロア' },
    { id: 5, url: null, caption: '夜景' },
  ];

  const displayImages = images || sampleImages;

  const handleImageSelect = (index) => {
    setSelectedImage(index);
    scrollViewRef.current?.scrollTo({
      x: index * (screenWidth - spacingSystem.layout.container.md * 2),
      animated: true,
    });
  };

  return (
    <View style={styles.imageGallery}>
      {/* メイン画像 */}
      <TouchableOpacity
        style={styles.mainImage}
        onPress={() => setShowModal(true)}
      >
        <View style={[styles.imagePlaceholder, { backgroundColor: theme.colors.background.pinkLight }]}>
          <Text variant="h3" style={{ color: theme.colors.brand }}>
            📷
          </Text>
          <Text variant="caption" style={{ color: theme.colors.text.secondary }}>
            {displayImages[selectedImage]?.caption || 'メイン画像'}
          </Text>
        </View>
        <View style={styles.imageOverlay}>
          <Badge variant="primary" size="sm">
            {selectedImage + 1} / {displayImages.length}
          </Badge>
        </View>
      </TouchableOpacity>

      {/* 画像サムネイル */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.thumbnailScroll}
        contentContainerStyle={styles.thumbnailContainer}
      >
        {displayImages.map((image, index) => (
          <TouchableOpacity
            key={image.id}
            style={[
              styles.thumbnail,
              {
                borderColor: selectedImage === index ? theme.colors.brand : theme.colors.border.light,
                backgroundColor: theme.colors.background.pinkLight,
              },
            ]}
            onPress={() => handleImageSelect(index)}
          >
            <Text variant="body">📷</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 画像モーダル */}
      <Modal
        visible={showModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowModal(false)}
            >
              <Text variant="h3" style={{ color: theme.colors.white }}>×</Text>
            </TouchableOpacity>
            <View style={[styles.modalImage, { backgroundColor: theme.colors.background.pinkLight }]}>
              <Text variant="h1" style={{ color: theme.colors.brand }}>
                📷
              </Text>
              <Text variant="body" style={{ color: theme.colors.text.secondary }}>
                {displayImages[selectedImage]?.caption}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// 店舗基本情報
const VenueBasicInfo = ({ venue }) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  const getCategoryIcon = (category) => {
    const icons = {
      bar: '🍸',
      club: '🎵',
      lounge: '🛋️',
      restaurant: '🍽️',
      karaoke: '🎤',
      pub: '🍺',
    };
    return icons[category] || '🏪';
  };

  const getPriceRangeLabel = (priceRange) => {
    const labels = {
      budget: '¥ (1,000〜2,000円)',
      moderate: '¥¥ (2,000〜4,000円)',
      expensive: '¥¥¥ (4,000〜8,000円)',
      luxury: '¥¥¥¥ (8,000円以上)',
    };
    return labels[priceRange] || '料金情報なし';
  };

  const formatRating = (rating) => {
    return rating ? rating.toFixed(1) : 'N/A';
  };

  return (
    <Card variant="elevated" style={styles.basicInfo}>
      <View style={styles.venueHeader}>
        <Text variant="displayMedium" style={[styles.venueName, { color: theme.colors.brand }]}>
          {getCategoryIcon(venue.category)} {venue.name}
        </Text>
        <View style={styles.venueRating}>
          <Badge variant="soft" size="md">
            {formatRating(venue.rating)} ★
          </Badge>
          <Text variant="caption" style={{ color: theme.colors.text.secondary }}>
            ({venue.reviewCount || 0}件のレビュー)
          </Text>
        </View>
      </View>

      <Text variant="body" style={styles.venueDescription}>
        {venue.description}
      </Text>

      <View style={styles.venueMetrics}>
        <View style={styles.metricItem}>
          <Text variant="caption" style={styles.metricLabel}>
            カテゴリ
          </Text>
          <Text variant="body" style={styles.metricValue}>
            {venue.categoryLabel || venue.category}
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text variant="caption" style={styles.metricLabel}>
            価格帯
          </Text>
          <Text variant="body" style={styles.metricValue}>
            {getPriceRangeLabel(venue.priceRange)}
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text variant="caption" style={styles.metricLabel}>
            距離
          </Text>
          <Text variant="body" style={styles.metricValue}>
            {venue.distance}m
          </Text>
        </View>
      </View>

      <View style={styles.venueTags}>
        {venue.tags?.map((tag, index) => (
          <Badge key={index} variant="outline" size="sm">
            {tag}
          </Badge>
        ))}
      </View>
    </Card>
  );
};

// 店舗情報詳細
const VenueContactInfo = ({ venue }) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  const handleCall = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleWebsite = (website) => {
    Linking.openURL(website);
  };

  const handleDirections = (address) => {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.google.com/maps?q=${encodedAddress}`;
    Linking.openURL(url);
  };

  return (
    <Card variant="default" style={styles.contactInfo}>
      <Text variant="h4" style={[styles.sectionTitle, { color: theme.colors.brand }]}>
        店舗情報
      </Text>

      <View style={styles.contactItem}>
        <View style={styles.contactIcon}>
          <Text variant="body">📍</Text>
        </View>
        <View style={styles.contactContent}>
          <Text variant="caption" style={styles.contactLabel}>
            住所
          </Text>
          <Text variant="body" style={styles.contactValue}>
            {venue.address}
          </Text>
          <TouchableOpacity
            style={styles.contactAction}
            onPress={() => handleDirections(venue.address)}
          >
            <Text variant="caption" style={{ color: theme.colors.brand }}>
              道順を見る
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {venue.phone && (
        <View style={styles.contactItem}>
          <View style={styles.contactIcon}>
            <Text variant="body">📞</Text>
          </View>
          <View style={styles.contactContent}>
            <Text variant="caption" style={styles.contactLabel}>
              電話番号
            </Text>
            <Text variant="body" style={styles.contactValue}>
              {venue.phone}
            </Text>
            <TouchableOpacity
              style={styles.contactAction}
              onPress={() => handleCall(venue.phone)}
            >
              <Text variant="caption" style={{ color: theme.colors.brand }}>
                電話をかける
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {venue.website && (
        <View style={styles.contactItem}>
          <View style={styles.contactIcon}>
            <Text variant="body">🌐</Text>
          </View>
          <View style={styles.contactContent}>
            <Text variant="caption" style={styles.contactLabel}>
              ウェブサイト
            </Text>
            <Text variant="body" style={styles.contactValue}>
              {venue.website}
            </Text>
            <TouchableOpacity
              style={styles.contactAction}
              onPress={() => handleWebsite(venue.website)}
            >
              <Text variant="caption" style={{ color: theme.colors.brand }}>
                サイトを開く
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.contactItem}>
        <View style={styles.contactIcon}>
          <Text variant="body">
            {venue.isOpen ? '🟢' : '🔴'}
          </Text>
        </View>
        <View style={styles.contactContent}>
          <Text variant="caption" style={styles.contactLabel}>
            営業状況
          </Text>
          <Text
            variant="body"
            style={[
              styles.contactValue,
              { color: venue.isOpen ? theme.colors.success[600] : theme.colors.error[500] }
            ]}
          >
            {venue.isOpen ? '営業中' : '営業時間外'}
          </Text>
        </View>
      </View>
    </Card>
  );
};

// 営業時間表
const VenueHours = ({ hours }) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  const sampleHours = {
    monday: { open: '18:00', close: '02:00', closed: false },
    tuesday: { open: '18:00', close: '02:00', closed: false },
    wednesday: { open: '18:00', close: '02:00', closed: false },
    thursday: { open: '18:00', close: '02:00', closed: false },
    friday: { open: '18:00', close: '03:00', closed: false },
    saturday: { open: '18:00', close: '03:00', closed: false },
    sunday: { open: '18:00', close: '01:00', closed: false },
  };

  const displayHours = hours || sampleHours;

  const dayLabels = {
    monday: '月曜日',
    tuesday: '火曜日',
    wednesday: '水曜日',
    thursday: '木曜日',
    friday: '金曜日',
    saturday: '土曜日',
    sunday: '日曜日',
  };

  const getCurrentDay = () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date().getDay()];
  };

  const currentDay = getCurrentDay();

  return (
    <Card variant="default" style={styles.hoursCard}>
      <Text variant="h4" style={[styles.sectionTitle, { color: theme.colors.brand }]}>
        営業時間
      </Text>
      
      {Object.entries(displayHours).map(([day, schedule]) => (
        <View
          key={day}
          style={[
            styles.hourItem,
            {
              backgroundColor: currentDay === day 
                ? theme.colors.background.pinkLight 
                : 'transparent',
            },
          ]}
        >
          <Text
            variant="body"
            style={[
              styles.dayLabel,
              {
                fontWeight: currentDay === day ? '600' : '400',
                color: currentDay === day ? theme.colors.brand : theme.colors.text.primary,
              },
            ]}
          >
            {dayLabels[day]}
          </Text>
          <Text
            variant="body"
            style={[
              styles.hourValue,
              {
                color: schedule.closed ? theme.colors.text.secondary : theme.colors.text.primary,
              },
            ]}
          >
            {schedule.closed ? '定休日' : `${schedule.open} - ${schedule.close}`}
          </Text>
        </View>
      ))}
    </Card>
  );
};

// アメニティ・設備
const VenueAmenities = ({ amenities }) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  const sampleAmenities = [
    { id: 'parking', name: '駐車場', icon: '🚗', available: true },
    { id: 'wifi', name: 'Wi-Fi', icon: '📶', available: true },
    { id: 'smoking', name: '喫煙可', icon: '🚬', available: true },
    { id: 'card', name: 'クレジットカード', icon: '💳', available: true },
    { id: 'reservation', name: '予約可', icon: '📅', available: true },
    { id: 'private_room', name: '個室あり', icon: '🏠', available: false },
    { id: 'live_music', name: 'ライブ音楽', icon: '🎵', available: true },
    { id: 'food', name: '食事提供', icon: '🍽️', available: true },
    { id: 'wheelchair', name: '車椅子対応', icon: '♿', available: false },
    { id: 'coat_check', name: 'クローク', icon: '🧥', available: true },
  ];

  const displayAmenities = amenities || sampleAmenities;

  return (
    <Card variant="default" style={styles.amenitiesCard}>
      <Text variant="h4" style={[styles.sectionTitle, { color: theme.colors.brand }]}>
        設備・サービス
      </Text>
      
      <View style={styles.amenitiesGrid}>
        {displayAmenities.map((amenity) => (
          <View
            key={amenity.id}
            style={[
              styles.amenityItem,
              {
                backgroundColor: amenity.available 
                  ? theme.colors.background.pinkLight 
                  : theme.colors.background.surface,
                borderColor: amenity.available 
                  ? theme.colors.brand 
                  : theme.colors.border.light,
                opacity: amenity.available ? 1 : 0.5,
              },
            ]}
          >
            <Text variant="body" style={styles.amenityIcon}>
              {amenity.icon}
            </Text>
            <Text
              variant="caption"
              style={[
                styles.amenityName,
                {
                  color: amenity.available 
                    ? theme.colors.text.primary 
                    : theme.colors.text.secondary,
                },
              ]}
            >
              {amenity.name}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
};

// アクションボタン
const VenueActions = ({ venue, onFavorite, onShare, onCheckIn }) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  const [isFavorite, setIsFavorite] = useState(venue.isFavorite || false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    onFavorite?.(venue, !isFavorite);
  };

  const handleShare = () => {
    Alert.alert(
      '共有',
      `${venue.name}の情報を共有しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '共有', onPress: () => onShare?.(venue) },
      ]
    );
  };

  const handleCheckIn = () => {
    if (!isCheckedIn) {
      Alert.alert(
        'チェックイン',
        `${venue.name}にチェックインしますか？`,
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: 'チェックイン', onPress: () => {
            setIsCheckedIn(true);
            onCheckIn?.(venue);
          }},
        ]
      );
    }
  };

  return (
    <Card variant="elevated" style={styles.actionsCard}>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: isFavorite ? theme.colors.error[100] : theme.colors.background.surface,
              borderColor: isFavorite ? theme.colors.error[500] : theme.colors.border.medium,
            },
          ]}
          onPress={handleFavorite}
        >
          <Text variant="body" style={styles.actionIcon}>
            {isFavorite ? '❤️' : '🤍'}
          </Text>
          <Text
            variant="caption"
            style={[
              styles.actionLabel,
              { color: isFavorite ? theme.colors.error[500] : theme.colors.text.secondary },
            ]}
          >
            {isFavorite ? 'お気に入り' : 'お気に入り'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: theme.colors.background.surface,
              borderColor: theme.colors.border.medium,
            },
          ]}
          onPress={handleShare}
        >
          <Text variant="body" style={styles.actionIcon}>
            📤
          </Text>
          <Text variant="caption" style={styles.actionLabel}>
            共有
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: isCheckedIn ? theme.colors.success[100] : theme.colors.background.surface,
              borderColor: isCheckedIn ? theme.colors.success[500] : theme.colors.border.medium,
            },
          ]}
          onPress={handleCheckIn}
          disabled={isCheckedIn}
        >
          <Text variant="body" style={styles.actionIcon}>
            {isCheckedIn ? '✅' : '📍'}
          </Text>
          <Text
            variant="caption"
            style={[
              styles.actionLabel,
              { color: isCheckedIn ? theme.colors.success[500] : theme.colors.text.secondary },
            ]}
          >
            {isCheckedIn ? 'チェックイン済み' : 'チェックイン'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.primaryActions}>
        <Button
          variant="outline"
          size="md"
          onPress={() => Alert.alert('予約', '予約機能は開発中です')}
          style={styles.primaryActionButton}
        >
          予約する
        </Button>
        <Button
          variant="primary"
          size="md"
          onPress={() => Alert.alert('道順', '道順案内を開始します')}
          style={styles.primaryActionButton}
        >
          道順を見る
        </Button>
      </View>
    </Card>
  );
};

// メイン店舗詳細コンポーネント
const VenueDetails = ({ venue, onClose }) => {
  const [activeTab, setActiveTab] = useState('info');

  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  // サンプル店舗データ
  const sampleVenue = {
    id: 1,
    name: "GENTLE LOUNGE",
    category: "lounge",
    categoryLabel: "ラウンジ",
    address: "〒150-0041 東京都渋谷区神南1-2-3 ABCビル 5F",
    phone: "03-1234-5678",
    website: "https://gentle-lounge.example.com",
    rating: 4.8,
    reviewCount: 127,
    priceRange: "expensive",
    distance: 250,
    description: "やさしいピンクの温かみのあるデザインで、心地よい雰囲気を演出。大人の上質な時間を過ごせる洗練されたラウンジです。",
    tags: ["ラウンジ", "やさしい", "ピンク", "大人", "上質"],
    isOpen: true,
    isFavorite: false,
    images: null,
    hours: null,
    amenities: null,
  };

  const displayVenue = venue || sampleVenue;

  const tabs = [
    { id: 'info', label: '基本情報', icon: 'ℹ️' },
    { id: 'reviews', label: 'レビュー', icon: '⭐' },
    { id: 'photos', label: '写真', icon: '📷' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return (
          <View style={styles.tabContent}>
            <VenueContactInfo venue={displayVenue} />
            <VenueHours hours={displayVenue.hours} />
            <VenueAmenities amenities={displayVenue.amenities} />
          </View>
        );
      case 'reviews':
        return (
          <View style={styles.tabContent}>
            <ReviewSystem venue={displayVenue} />
          </View>
        );
      case 'photos':
        return (
          <View style={styles.tabContent}>
            <Card variant="default" style={styles.photosSection}>
              <Text variant="h4" style={[styles.sectionTitle, { color: theme.colors.brand }]}>
                店舗写真
              </Text>
              <Text variant="body" style={{ color: theme.colors.text.secondary }}>
                写真ギャラリー機能は開発中です
              </Text>
            </Card>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 画像ギャラリー */}
        <VenueImageGallery images={displayVenue.images} venueName={displayVenue.name} />
        
        {/* 基本情報 */}
        <VenueBasicInfo venue={displayVenue} />
        
        {/* アクションボタン */}
        <VenueActions
          venue={displayVenue}
          onFavorite={(venue, isFavorite) => console.log('Favorite:', venue.name, isFavorite)}
          onShare={(venue) => console.log('Share:', venue.name)}
          onCheckIn={(venue) => console.log('Check in:', venue.name)}
        />
        
        {/* タブナビゲーション */}
        <Card variant="default" style={styles.tabNavigation}>
          <View style={styles.tabButtons}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tabButton,
                  {
                    backgroundColor: activeTab === tab.id 
                      ? theme.colors.brand 
                      : theme.colors.background.surface,
                  },
                ]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text variant="body" style={styles.tabIcon}>
                  {tab.icon}
                </Text>
                <Text
                  variant="caption"
                  style={[
                    styles.tabLabel,
                    {
                      color: activeTab === tab.id 
                        ? theme.colors.white 
                        : theme.colors.text.secondary,
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>
        
        {/* タブコンテンツ */}
        {renderTabContent()}
      </ScrollView>
      
      {/* 閉じるボタン */}
      {onClose && (
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: theme.colors.brand }]}
          onPress={onClose}
        >
          <Text variant="body" style={{ color: theme.colors.white }}>
            ×
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  
  scrollView: {
    flex: 1,
  },
  
  // 画像ギャラリー
  imageGallery: {
    marginBottom: spacingSystem.layout.container.sm,
  },
  
  mainImage: {
    height: 250,
    position: 'relative',
  },
  
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacingSystem.component.gap.sm,
  },
  
  imageOverlay: {
    position: 'absolute',
    top: spacingSystem.component.margin.md,
    right: spacingSystem.component.margin.md,
  },
  
  thumbnailScroll: {
    paddingHorizontal: spacingSystem.layout.container.md,
  },
  
  thumbnailContainer: {
    gap: spacingSystem.component.gap.sm,
    paddingVertical: spacingSystem.component.padding.md,
  },
  
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: borderRadiusSystem.component.image.small,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modalContent: {
    width: '90%',
    height: '80%',
    position: 'relative',
  },
  
  modalClose: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modalImage: {
    flex: 1,
    borderRadius: borderRadiusSystem.component.modal.large,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacingSystem.component.gap.md,
  },
  
  // 基本情報
  basicInfo: {
    margin: spacingSystem.layout.container.md,
    padding: spacingSystem.layout.card.paddingLarge,
  },
  
  venueHeader: {
    marginBottom: spacingSystem.component.margin.lg,
  },
  
  venueName: {
    marginBottom: spacingSystem.component.margin.sm,
  },
  
  venueRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingSystem.component.gap.md,
  },
  
  venueDescription: {
    lineHeight: 22,
    marginBottom: spacingSystem.component.margin.lg,
  },
  
  venueMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacingSystem.component.margin.lg,
  },
  
  metricItem: {
    alignItems: 'center',
    gap: spacingSystem.component.gap.xs,
  },
  
  metricLabel: {
    color: colors.text.secondary,
  },
  
  metricValue: {
    fontWeight: '600',
  },
  
  venueTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacingSystem.component.gap.sm,
  },
  
  // 連絡先情報
  contactInfo: {
    margin: spacingSystem.layout.container.md,
    padding: spacingSystem.layout.card.padding,
  },
  
  sectionTitle: {
    marginBottom: spacingSystem.component.margin.lg,
  },
  
  contactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacingSystem.component.gap.md,
    marginBottom: spacingSystem.component.margin.lg,
  },
  
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.pinkLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  contactContent: {
    flex: 1,
    gap: spacingSystem.component.gap.xs,
  },
  
  contactLabel: {
    color: colors.text.secondary,
  },
  
  contactValue: {
    fontWeight: '500',
  },
  
  contactAction: {
    alignSelf: 'flex-start',
  },
  
  // 営業時間
  hoursCard: {
    margin: spacingSystem.layout.container.md,
    padding: spacingSystem.layout.card.padding,
  },
  
  hourItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacingSystem.component.padding.sm,
    paddingHorizontal: spacingSystem.component.padding.md,
    borderRadius: borderRadiusSystem.component.card.small,
    marginBottom: spacingSystem.component.margin.sm,
  },
  
  dayLabel: {
    width: 80,
  },
  
  hourValue: {
    // Set by component
  },
  
  // 設備
  amenitiesCard: {
    margin: spacingSystem.layout.container.md,
    padding: spacingSystem.layout.card.padding,
  },
  
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacingSystem.component.gap.md,
  },
  
  amenityItem: {
    width: (screenWidth - spacingSystem.layout.container.md * 2 - spacingSystem.layout.card.padding * 2 - spacingSystem.component.gap.md * 2) / 3,
    aspectRatio: 1,
    borderRadius: borderRadiusSystem.component.card.medium,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacingSystem.component.gap.sm,
  },
  
  amenityIcon: {
    fontSize: 24,
  },
  
  amenityName: {
    textAlign: 'center',
    fontSize: 11,
  },
  
  // アクション
  actionsCard: {
    margin: spacingSystem.layout.container.md,
    padding: spacingSystem.layout.card.padding,
  },
  
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacingSystem.component.margin.lg,
  },
  
  actionButton: {
    alignItems: 'center',
    gap: spacingSystem.component.gap.sm,
    paddingVertical: spacingSystem.component.padding.md,
    paddingHorizontal: spacingSystem.component.padding.lg,
    borderRadius: borderRadiusSystem.component.button.medium,
    borderWidth: 1,
  },
  
  actionIcon: {
    fontSize: 20,
  },
  
  actionLabel: {
    fontSize: 12,
  },
  
  primaryActions: {
    flexDirection: 'row',
    gap: spacingSystem.component.gap.md,
  },
  
  primaryActionButton: {
    flex: 1,
  },
  
  // タブナビゲーション
  tabNavigation: {
    margin: spacingSystem.layout.container.md,
    padding: spacingSystem.layout.card.padding,
  },
  
  tabButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  
  tabButton: {
    alignItems: 'center',
    gap: spacingSystem.component.gap.sm,
    paddingVertical: spacingSystem.component.padding.md,
    paddingHorizontal: spacingSystem.component.padding.lg,
    borderRadius: borderRadiusSystem.component.button.medium,
    minWidth: 80,
  },
  
  tabIcon: {
    fontSize: 20,
  },
  
  tabLabel: {
    fontSize: 12,
  },
  
  // タブコンテンツ
  tabContent: {
    paddingBottom: spacingSystem.layout.container.xl,
  },
  
  photosSection: {
    margin: spacingSystem.layout.container.md,
    padding: spacingSystem.layout.card.padding,
    alignItems: 'center',
    gap: spacingSystem.component.gap.md,
  },
  
  // 閉じるボタン
  closeButton: {
    position: 'absolute',
    top: 50,
    right: spacingSystem.layout.container.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadowSystem.elevation[3],
  },
});

export default VenueDetails;