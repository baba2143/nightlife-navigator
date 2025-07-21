import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  Modal, 
  Alert, 
  Linking 
} from 'react-native';
import FavoritesService from '../services/FavoritesService';

const { width: screenWidth } = Dimensions.get('window');

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
};

// 店舗画像ギャラリー
const VenueImageGallery = ({ images, venueName }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const sampleImages = [
    { id: 1, url: null, caption: 'メインエントランス' },
    { id: 2, url: null, caption: 'バーカウンター' },
    { id: 3, url: null, caption: 'VIPルーム' },
  ];

  const displayImages = images || sampleImages;

  return (
    <View style={styles.imageGallery}>
      {/* メイン画像 */}
      <TouchableOpacity
        style={styles.mainImage}
        onPress={() => setShowModal(true)}
      >
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imageIcon}>📷</Text>
          <Text style={styles.imageCaption}>
            {displayImages[selectedImage]?.caption || 'メイン画像'}
          </Text>
        </View>
        <View style={styles.imageCounter}>
          <Text style={styles.counterText}>
            {selectedImage + 1} / {displayImages.length}
          </Text>
        </View>
      </TouchableOpacity>

      {/* 画像サムネイル */}
      <ScrollView
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
                borderColor: selectedImage === index ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setSelectedImage(index)}
          >
            <Text style={styles.thumbnailIcon}>📷</Text>
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
              <Text style={styles.modalCloseText}>×</Text>
            </TouchableOpacity>
            <View style={styles.modalImage}>
              <Text style={styles.modalImageIcon}>📷</Text>
              <Text style={styles.modalImageCaption}>
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
    <View style={styles.basicInfo}>
      <View style={styles.venueHeader}>
        <Text style={styles.venueName}>
          {getCategoryIcon(venue.category)} {venue.name}
        </Text>
        <View style={styles.venueRating}>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>
              {formatRating(venue.rating)} ★
            </Text>
          </View>
          <Text style={styles.reviewCount}>
            ({venue.reviewCount || 0}件のレビュー)
          </Text>
        </View>
      </View>

      <Text style={styles.venueDescription}>
        {venue.description}
      </Text>

      <View style={styles.venueMetrics}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>カテゴリ</Text>
          <Text style={styles.metricValue}>{venue.categoryLabel || venue.category}</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>価格帯</Text>
          <Text style={styles.metricValue}>{getPriceRangeLabel(venue.priceRange)}</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>距離</Text>
          <Text style={styles.metricValue}>{venue.distance}m</Text>
        </View>
      </View>

      <View style={styles.venueTags}>
        {venue.tags?.slice(0, 3).map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// 店舗連絡先情報
const VenueContactInfo = ({ venue }) => {
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
    <View style={styles.contactInfo}>
      <Text style={styles.sectionTitle}>店舗情報</Text>

      <View style={styles.contactItem}>
        <View style={styles.contactIcon}>
          <Text style={styles.contactIconText}>📍</Text>
        </View>
        <View style={styles.contactContent}>
          <Text style={styles.contactLabel}>住所</Text>
          <Text style={styles.contactValue}>{venue.address}</Text>
          <TouchableOpacity onPress={() => handleDirections(venue.address)}>
            <Text style={styles.contactAction}>道順を見る</Text>
          </TouchableOpacity>
        </View>
      </View>

      {venue.phone && (
        <View style={styles.contactItem}>
          <View style={styles.contactIcon}>
            <Text style={styles.contactIconText}>📞</Text>
          </View>
          <View style={styles.contactContent}>
            <Text style={styles.contactLabel}>電話番号</Text>
            <Text style={styles.contactValue}>{venue.phone}</Text>
            <TouchableOpacity onPress={() => handleCall(venue.phone)}>
              <Text style={styles.contactAction}>電話をかける</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {venue.website && (
        <View style={styles.contactItem}>
          <View style={styles.contactIcon}>
            <Text style={styles.contactIconText}>🌐</Text>
          </View>
          <View style={styles.contactContent}>
            <Text style={styles.contactLabel}>ウェブサイト</Text>
            <Text style={styles.contactValue}>{venue.website}</Text>
            <TouchableOpacity onPress={() => handleWebsite(venue.website)}>
              <Text style={styles.contactAction}>サイトを開く</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.contactItem}>
        <View style={styles.contactIcon}>
          <Text style={styles.contactIconText}>
            {venue.isOpen ? '🟢' : '🔴'}
          </Text>
        </View>
        <View style={styles.contactContent}>
          <Text style={styles.contactLabel}>営業状況</Text>
          <Text
            style={[
              styles.contactValue,
              { color: venue.isOpen ? colors.success : colors.error }
            ]}
          >
            {venue.isOpen ? '営業中' : '営業時間外'}
          </Text>
        </View>
      </View>
    </View>
  );
};

// 営業時間表
const VenueHours = ({ hours }) => {
  const sampleHours = {
    monday: { open: '18:00', close: '02:00', closed: false },
    tuesday: { open: '18:00', close: '02:00', closed: false },
    wednesday: { open: '18:00', close: '02:00', closed: false },
    thursday: { open: '18:00', close: '02:00', closed: false },
    friday: { open: '18:00', close: '03:00', closed: false },
    saturday: { open: '18:00', close: '03:00', closed: false },
    sunday: { closed: true },
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
    <View style={styles.hoursCard}>
      <Text style={styles.sectionTitle}>営業時間</Text>
      
      {Object.entries(displayHours).map(([day, schedule]) => (
        <View
          key={day}
          style={[
            styles.hourItem,
            {
              backgroundColor: currentDay === day ? colors.backgroundLight : 'transparent',
            },
          ]}
        >
          <Text
            style={[
              styles.dayLabel,
              {
                fontWeight: currentDay === day ? '600' : '400',
                color: currentDay === day ? colors.primary : colors.text,
              },
            ]}
          >
            {dayLabels[day]}
          </Text>
          <Text
            style={[
              styles.hourValue,
              {
                color: schedule.closed ? colors.textSecondary : colors.text,
              },
            ]}
          >
            {schedule.closed ? '定休日' : `${schedule.open} - ${schedule.close}`}
          </Text>
        </View>
      ))}
    </View>
  );
};

// アクションボタン
const VenueActions = ({ venue, onFavorite, onShare, onCheckIn }) => {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    initializeFavoriteState();
    setupEventListeners();
    
    return () => {
      cleanupEventListeners();
    };
  }, [venue.id]);

  const initializeFavoriteState = async () => {
    try {
      await FavoritesService.initialize();
      const favoriteState = FavoritesService.isFavorite(venue.id);
      setIsFavorite(favoriteState);
    } catch (error) {
      console.error('Failed to initialize favorite state:', error);
    }
  };

  const setupEventListeners = () => {
    FavoritesService.addEventListener('favoritesChanged', handleFavoritesChanged);
  };

  const cleanupEventListeners = () => {
    FavoritesService.removeEventListener('favoritesChanged', handleFavoritesChanged);
  };

  const handleFavoritesChanged = ({ action, venue: changedVenue }) => {
    if (changedVenue && changedVenue.id === venue.id) {
      setIsFavorite(action === 'added');
    }
  };

  const handleFavorite = async () => {
    try {
      const result = await FavoritesService.toggleFavorite(venue);
      if (result.success) {
        // State is updated by event listener
        onFavorite?.(venue, result.isFavorite);
        
        // Show feedback
        Alert.alert(
          result.isFavorite ? 'お気に入りに追加' : 'お気に入りから削除',
          result.isFavorite 
            ? `${venue.name}をお気に入りに追加しました`
            : `${venue.name}をお気に入りから削除しました`
        );
      } else {
        Alert.alert('エラー', 'お気に入りの更新に失敗しました');
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      Alert.alert('エラー', 'お気に入りの更新に失敗しました');
    }
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
    Alert.alert(
      'チェックイン',
      `${venue.name}にチェックインしますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: 'チェックイン', onPress: () => onCheckIn?.(venue) },
      ]
    );
  };

  return (
    <View style={styles.actionsCard}>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: isFavorite ? '#ffebee' : colors.background,
              borderColor: isFavorite ? colors.error : colors.border,
            },
          ]}
          onPress={handleFavorite}
        >
          <Text style={styles.actionIcon}>
            {isFavorite ? '❤️' : '🤍'}
          </Text>
          <Text style={styles.actionLabel}>
            お気に入り
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Text style={styles.actionIcon}>📤</Text>
          <Text style={styles.actionLabel}>共有</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleCheckIn}>
          <Text style={styles.actionIcon}>📍</Text>
          <Text style={styles.actionLabel}>チェックイン</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.primaryActions}>
        <TouchableOpacity
          style={[styles.primaryButton, styles.outlineButton]}
          onPress={() => Alert.alert('予約', '予約機能は開発中です')}
        >
          <Text style={styles.outlineButtonText}>予約する</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryButton, styles.primaryFillButton]}
          onPress={() => Alert.alert('道順', '道順案内を開始します')}
        >
          <Text style={styles.primaryButtonText}>道順を見る</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// メイン店舗詳細コンポーネント
const VenueDetails = ({ venue, onClose }) => {
  const [activeTab, setActiveTab] = useState('info');

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
          </View>
        );
      case 'reviews':
        return (
          <View style={styles.tabContent}>
            <View style={styles.placeholderSection}>
              <Text style={styles.sectionTitle}>レビュー</Text>
              <Text style={styles.placeholderText}>
                レビュー機能は開発中です
              </Text>
            </View>
          </View>
        );
      case 'photos':
        return (
          <View style={styles.tabContent}>
            <View style={styles.placeholderSection}>
              <Text style={styles.sectionTitle}>店舗写真</Text>
              <Text style={styles.placeholderText}>
                写真ギャラリー機能は開発中です
              </Text>
            </View>
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
        <View style={styles.tabNavigation}>
          <View style={styles.tabButtons}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tabButton,
                  {
                    backgroundColor: activeTab === tab.id ? colors.primary : colors.background,
                  },
                ]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text style={styles.tabIcon}>{tab.icon}</Text>
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: activeTab === tab.id ? colors.white : colors.textSecondary,
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* タブコンテンツ */}
        {renderTabContent()}
      </ScrollView>
      
      {/* 閉じるボタン */}
      {onClose && (
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
        >
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  scrollView: {
    flex: 1,
  },
  
  // 画像ギャラリー
  imageGallery: {
    marginBottom: 16,
  },
  
  mainImage: {
    height: 250,
    position: 'relative',
  },
  
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    gap: 8,
  },
  
  imageIcon: {
    fontSize: 48,
    color: colors.primary,
  },
  
  imageCaption: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  
  imageCounter: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  
  counterText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  
  thumbnailScroll: {
    paddingHorizontal: 16,
  },
  
  thumbnailContainer: {
    gap: 8,
    paddingVertical: 16,
  },
  
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    backgroundColor: colors.backgroundLight,
  },
  
  thumbnailIcon: {
    fontSize: 20,
    color: colors.primary,
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
  
  modalCloseText: {
    fontSize: 30,
    color: colors.white,
    fontWeight: 'bold',
  },
  
  modalImage: {
    flex: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    gap: 16,
  },
  
  modalImageIcon: {
    fontSize: 80,
    color: colors.primary,
  },
  
  modalImageCaption: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  
  // 基本情報
  basicInfo: {
    backgroundColor: colors.white,
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  venueHeader: {
    marginBottom: 16,
  },
  
  venueName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  
  venueRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  
  ratingBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  
  ratingText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  
  reviewCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  
  venueDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    marginBottom: 16,
  },
  
  venueMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  
  metricItem: {
    alignItems: 'center',
    gap: 4,
  },
  
  metricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  
  venueTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  
  tag: {
    backgroundColor: colors.backgroundLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  
  tagText: {
    fontSize: 12,
    color: colors.primary,
  },
  
  // 連絡先情報
  contactInfo: {
    backgroundColor: colors.white,
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 16,
  },
  
  contactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  contactIconText: {
    fontSize: 20,
  },
  
  contactContent: {
    flex: 1,
    gap: 4,
  },
  
  contactLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  
  contactValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  
  contactAction: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  
  // 営業時間
  hoursCard: {
    backgroundColor: colors.white,
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  
  hourItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  
  dayLabel: {
    fontSize: 14,
    width: 80,
  },
  
  hourValue: {
    fontSize: 14,
  },
  
  // アクション
  actionsCard: {
    backgroundColor: colors.white,
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  
  actionButton: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  
  actionIcon: {
    fontSize: 20,
  },
  
  actionLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  
  primaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  
  primaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  
  outlineButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  
  outlineButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  
  primaryFillButton: {
    backgroundColor: colors.primary,
  },
  
  primaryButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  
  // タブナビゲーション
  tabNavigation: {
    backgroundColor: colors.white,
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  
  tabButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  
  tabButton: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
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
    paddingBottom: 50,
  },
  
  placeholderSection: {
    backgroundColor: colors.white,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
  },
  
  placeholderText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  
  // 閉じるボタン
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  
  closeButtonText: {
    fontSize: 24,
    color: colors.white,
    fontWeight: 'bold',
  },
});

export default VenueDetails;