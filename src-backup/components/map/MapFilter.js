import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Slider,
  Modal,
  Animated,
} from 'react-native';
import { Colors } from '../../design-system/colors-soft-pink';

/**
 * 地図フィルターコンポーネント
 * 店舗の表示フィルタリングを管理
 */
const MapFilter = ({
  visible = false,
  onClose = () => {},
  onApplyFilters = () => {},
  initialFilters = {},
}) => {
  const [filters, setFilters] = useState({
    genres: [],
    minRating: 0,
    priceRange: { min: 1, max: 4 },
    maxDistance: 5000, // 5km
    openNow: false,
    features: [],
    keyword: '',
    ...initialFilters,
  });

  const [slideAnim] = useState(new Animated.Value(0));

  // ジャンルオプション
  const genreOptions = useMemo(() => [
    { id: 'bar', label: 'バー', icon: '🍺' },
    { id: 'club', label: 'クラブ', icon: '🎵' },
    { id: 'lounge', label: 'ラウンジ', icon: '🥂' },
    { id: 'restaurant', label: 'レストラン', icon: '🍽️' },
    { id: 'karaoke', label: 'カラオケ', icon: '🎤' },
    { id: 'other', label: 'その他', icon: '🏪' },
  ], []);

  // 特徴オプション
  const featureOptions = useMemo(() => [
    { id: 'wifi', label: 'Wi-Fi', icon: '📶' },
    { id: 'smoking', label: '喫煙可', icon: '🚬' },
    { id: 'parking', label: '駐車場', icon: '🅿️' },
    { id: 'terrace', label: 'テラス席', icon: '🌿' },
    { id: 'live_music', label: 'ライブ音楽', icon: '🎵' },
    { id: 'dance_floor', label: 'ダンスフロア', icon: '💃' },
    { id: 'private_room', label: '個室', icon: '🚪' },
    { id: 'happy_hour', label: 'ハッピーアワー', icon: '🕕' },
    { id: 'credit_card', label: 'カード可', icon: '💳' },
    { id: 'reservation', label: '予約可', icon: '📅' },
  ], []);

  // 距離オプション
  const distanceOptions = useMemo(() => [
    { value: 500, label: '500m' },
    { value: 1000, label: '1km' },
    { value: 2000, label: '2km' },
    { value: 5000, label: '5km' },
    { value: 10000, label: '10km' },
    { value: 50000, label: '制限なし' },
  ], []);

  // モーダル表示アニメーション
  React.useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  // ジャンル選択ハンドラ
  const handleGenreToggle = useCallback((genreId) => {
    setFilters(prev => ({
      ...prev,
      genres: prev.genres.includes(genreId)
        ? prev.genres.filter(id => id !== genreId)
        : [...prev.genres, genreId]
    }));
  }, []);

  // 特徴選択ハンドラ
  const handleFeatureToggle = useCallback((featureId) => {
    setFilters(prev => ({
      ...prev,
      features: prev.features.includes(featureId)
        ? prev.features.filter(id => id !== featureId)
        : [...prev.features, featureId]
    }));
  }, []);

  // 評価変更ハンドラ
  const handleRatingChange = useCallback((rating) => {
    setFilters(prev => ({
      ...prev,
      minRating: rating
    }));
  }, []);

  // 価格帯変更ハンドラ
  const handlePriceRangeChange = useCallback((min, max) => {
    setFilters(prev => ({
      ...prev,
      priceRange: { min, max }
    }));
  }, []);

  // 距離変更ハンドラ
  const handleDistanceChange = useCallback((distance) => {
    setFilters(prev => ({
      ...prev,
      maxDistance: distance
    }));
  }, []);

  // 営業中フィルターハンドラ
  const handleOpenNowToggle = useCallback((value) => {
    setFilters(prev => ({
      ...prev,
      openNow: value
    }));
  }, []);

  // フィルター適用
  const handleApply = useCallback(() => {
    onApplyFilters(filters);
    onClose();
  }, [filters, onApplyFilters, onClose]);

  // フィルターリセット
  const handleReset = useCallback(() => {
    setFilters({
      genres: [],
      minRating: 0,
      priceRange: { min: 1, max: 4 },
      maxDistance: 5000,
      openNow: false,
      features: [],
      keyword: '',
    });
  }, []);

  // 価格レベルの表示
  const formatPriceLevel = useCallback((level) => {
    return '¥'.repeat(level);
  }, []);

  // 距離の表示
  const formatDistance = useCallback((meters) => {
    if (meters >= 50000) return '制限なし';
    if (meters >= 1000) return `${meters / 1000}km`;
    return `${meters}m`;
  }, []);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [600, 0],
                }),
              }],
            },
          ]}
        >
          {/* ヘッダー */}
          <View style={styles.header}>
            <Text style={styles.title}>フィルター</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* ジャンル選択 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ジャンル</Text>
              <View style={styles.optionsGrid}>
                {genreOptions.map((genre) => (
                  <TouchableOpacity
                    key={genre.id}
                    style={[
                      styles.optionButton,
                      filters.genres.includes(genre.id) && styles.optionButtonSelected
                    ]}
                    onPress={() => handleGenreToggle(genre.id)}
                  >
                    <Text style={styles.optionIcon}>{genre.icon}</Text>
                    <Text style={[
                      styles.optionLabel,
                      filters.genres.includes(genre.id) && styles.optionLabelSelected
                    ]}>
                      {genre.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 評価 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                最低評価: {filters.minRating.toFixed(1)}⭐
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={5}
                step={0.5}
                value={filters.minRating}
                onValueChange={handleRatingChange}
                minimumTrackTintColor={Colors.primary}
                maximumTrackTintColor={Colors.lightGray}
                thumbTintColor={Colors.primary}
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>0.0</Text>
                <Text style={styles.sliderLabel}>5.0</Text>
              </View>
            </View>

            {/* 価格帯 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                価格帯: {formatPriceLevel(filters.priceRange.min)} - {formatPriceLevel(filters.priceRange.max)}
              </Text>
              <View style={styles.priceRangeContainer}>
                {[1, 2, 3, 4].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.priceButton,
                      level >= filters.priceRange.min && level <= filters.priceRange.max && styles.priceButtonSelected
                    ]}
                    onPress={() => {
                      if (level < filters.priceRange.min || level > filters.priceRange.max) {
                        // 範囲を拡張
                        handlePriceRangeChange(
                          Math.min(filters.priceRange.min, level),
                          Math.max(filters.priceRange.max, level)
                        );
                      } else {
                        // 範囲を縮小
                        if (level === filters.priceRange.min && level === filters.priceRange.max) {
                          // 単一選択解除
                          handlePriceRangeChange(1, 4);
                        } else if (level === filters.priceRange.min) {
                          handlePriceRangeChange(level + 1, filters.priceRange.max);
                        } else if (level === filters.priceRange.max) {
                          handlePriceRangeChange(filters.priceRange.min, level - 1);
                        }
                      }
                    }}
                  >
                    <Text style={[
                      styles.priceButtonText,
                      level >= filters.priceRange.min && level <= filters.priceRange.max && styles.priceButtonTextSelected
                    ]}>
                      {formatPriceLevel(level)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 距離 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                最大距離: {formatDistance(filters.maxDistance)}
              </Text>
              <View style={styles.distanceOptions}>
                {distanceOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.distanceButton,
                      filters.maxDistance === option.value && styles.distanceButtonSelected
                    ]}
                    onPress={() => handleDistanceChange(option.value)}
                  >
                    <Text style={[
                      styles.distanceButtonText,
                      filters.maxDistance === option.value && styles.distanceButtonTextSelected
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 営業状況 */}
            <View style={styles.section}>
              <View style={styles.switchContainer}>
                <Text style={styles.sectionTitle}>営業中のみ表示</Text>
                <Switch
                  value={filters.openNow}
                  onValueChange={handleOpenNowToggle}
                  trackColor={{ false: Colors.lightGray, true: Colors.lightPink }}
                  thumbColor={filters.openNow ? Colors.primary : Colors.gray}
                />
              </View>
            </View>

            {/* 特徴 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>特徴</Text>
              <View style={styles.featuresGrid}>
                {featureOptions.map((feature) => (
                  <TouchableOpacity
                    key={feature.id}
                    style={[
                      styles.featureButton,
                      filters.features.includes(feature.id) && styles.featureButtonSelected
                    ]}
                    onPress={() => handleFeatureToggle(feature.id)}
                  >
                    <Text style={styles.featureIcon}>{feature.icon}</Text>
                    <Text style={[
                      styles.featureLabel,
                      filters.features.includes(feature.id) && styles.featureLabelSelected
                    ]}>
                      {feature.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* フッター */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>リセット</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>適用</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  optionButtonSelected: {
    backgroundColor: Colors.primary,
  },
  optionIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  optionLabel: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  optionLabelSelected: {
    color: Colors.white,
  },
  slider: {
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  sliderLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  priceRangeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  priceButton: {
    flex: 1,
    backgroundColor: Colors.lightGray,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  priceButtonSelected: {
    backgroundColor: Colors.primary,
  },
  priceButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  priceButtonTextSelected: {
    color: Colors.white,
  },
  distanceOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  distanceButton: {
    backgroundColor: Colors.lightGray,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  distanceButtonSelected: {
    backgroundColor: Colors.primary,
  },
  distanceButtonText: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  distanceButtonTextSelected: {
    color: Colors.white,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 6,
  },
  featureButtonSelected: {
    backgroundColor: Colors.primary,
  },
  featureIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  featureLabel: {
    fontSize: 12,
    color: Colors.textPrimary,
  },
  featureLabelSelected: {
    color: Colors.white,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  resetButton: {
    flex: 1,
    backgroundColor: Colors.lightGray,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  applyButton: {
    flex: 2,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});

export default React.memo(MapFilter);