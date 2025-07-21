import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Keyboard,
} from 'react-native';
import { Colors } from '../../design-system/colors-soft-pink';
import locationService from '../../services/LocationService';

/**
 * 地図検索コンポーネント
 * 場所の検索とジオコーディングを提供
 */
const MapSearch = ({
  visible = false,
  onClose = () => {},
  onLocationSelect = () => {},
  placeholder = '場所を検索...',
  showRecentSearches = true,
  showSuggestions = true,
}) => {
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const searchTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  // 人気の検索キーワード
  const popularSearches = [
    { text: '渋谷', icon: '🏙️' },
    { text: '新宿', icon: '🏙️' },
    { text: '六本木', icon: '🌃' },
    { text: '銀座', icon: '✨' },
    { text: '池袋', icon: '🏙️' },
    { text: '原宿', icon: '🎨' },
    { text: '表参道', icon: '🛍️' },
    { text: '恵比寿', icon: '🍾' },
  ];

  // モーダルが開いたときにフォーカス
  useEffect(() => {
    if (visible && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 100);
    }
  }, [visible]);

  // 検索テキスト変更時の処理
  const handleSearchTextChange = useCallback((text) => {
    setSearchText(text);
    setError(null);

    // デバウンス処理
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (text.trim().length > 1) {
      searchTimeoutRef.current = setTimeout(() => {
        searchSuggestions(text.trim());
      }, 300);
    } else {
      setSuggestions([]);
    }
  }, []);

  // 検索候補の取得
  const searchSuggestions = useCallback(async (query) => {
    if (!showSuggestions) return;

    try {
      setIsLoading(true);
      
      // 日本の主要都市・エリアの候補を生成
      const localSuggestions = generateLocalSuggestions(query);
      
      // Google Places Autocomplete APIを使用（実装時）
      // const placeSuggestions = await getPlaceSuggestions(query);
      
      setSuggestions(localSuggestions);
    } catch (error) {
      console.error('検索候補取得エラー:', error);
      setError('検索候補の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [showSuggestions]);

  // ローカル検索候補の生成
  const generateLocalSuggestions = useCallback((query) => {
    const locations = [
      // 東京の主要エリア
      { name: '渋谷', area: '東京都渋谷区', type: 'area', icon: '🏙️' },
      { name: '新宿', area: '東京都新宿区', type: 'area', icon: '🏙️' },
      { name: '六本木', area: '東京都港区', type: 'area', icon: '🌃' },
      { name: '銀座', area: '東京都中央区', type: 'area', icon: '✨' },
      { name: '池袋', area: '東京都豊島区', type: 'area', icon: '🏙️' },
      { name: '原宿', area: '東京都渋谷区', type: 'area', icon: '🎨' },
      { name: '表参道', area: '東京都港区', type: 'area', icon: '🛍️' },
      { name: '恵比寿', area: '東京都渋谷区', type: 'area', icon: '🍾' },
      { name: '中目黒', area: '東京都目黒区', type: 'area', icon: '🌸' },
      { name: '代官山', area: '東京都渋谷区', type: 'area', icon: '🎪' },
      
      // 主要駅
      { name: '東京駅', area: '東京都千代田区', type: 'station', icon: '🚉' },
      { name: '新宿駅', area: '東京都新宿区', type: 'station', icon: '🚉' },
      { name: '渋谷駅', area: '東京都渋谷区', type: 'station', icon: '🚉' },
      { name: '池袋駅', area: '東京都豊島区', type: 'station', icon: '🚉' },
      { name: '品川駅', area: '東京都港区', type: 'station', icon: '🚉' },
      
      // ランドマーク
      { name: '東京タワー', area: '東京都港区', type: 'landmark', icon: '🗼' },
      { name: 'スカイツリー', area: '東京都墨田区', type: 'landmark', icon: '🗼' },
      { name: '浅草', area: '東京都台東区', type: 'landmark', icon: '⛩️' },
      { name: 'お台場', area: '東京都港区', type: 'landmark', icon: '🌊' },
    ];

    return locations
      .filter(location => 
        location.name.toLowerCase().includes(query.toLowerCase()) ||
        location.area.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 8);
  }, []);

  // 場所の選択処理
  const handleLocationSelect = useCallback(async (location) => {
    try {
      setIsLoading(true);
      setError(null);

      let coordinates;
      let address;

      if (typeof location === 'string') {
        // テキスト検索の場合
        coordinates = await locationService.geocodeAddress(location);
        address = location;
      } else {
        // 候補から選択した場合
        coordinates = await locationService.geocodeAddress(location.area);
        address = `${location.name}, ${location.area}`;
      }

      // 最近の検索に追加
      if (showRecentSearches) {
        setRecentSearches(prev => {
          const newSearch = { text: address, timestamp: Date.now() };
          const filtered = prev.filter(item => item.text !== address);
          return [newSearch, ...filtered].slice(0, 5);
        });
      }

      onLocationSelect({
        coordinates,
        address,
        name: typeof location === 'string' ? location : location.name,
      });

      setSearchText('');
      setSuggestions([]);
      onClose();
    } catch (error) {
      console.error('場所選択エラー:', error);
      setError('場所の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [onLocationSelect, onClose, showRecentSearches]);

  // 検索実行
  const handleSearch = useCallback(() => {
    if (searchText.trim()) {
      handleLocationSelect(searchText.trim());
    }
  }, [searchText, handleLocationSelect]);

  // 現在地の使用
  const handleUseCurrentLocation = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const currentLocation = await locationService.getCurrentLocation();
      const address = await locationService.reverseGeocode(
        currentLocation.latitude,
        currentLocation.longitude
      );

      onLocationSelect({
        coordinates: currentLocation,
        address: address.formattedAddress,
        name: '現在地',
      });

      onClose();
    } catch (error) {
      console.error('現在地取得エラー:', error);
      setError('現在地の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [onLocationSelect, onClose]);

  // モーダルを閉じる
  const handleClose = useCallback(() => {
    setSearchText('');
    setSuggestions([]);
    setError(null);
    Keyboard.dismiss();
    onClose();
  }, [onClose]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleClose}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          
          <View style={styles.searchContainer}>
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder={placeholder}
              placeholderTextColor={Colors.textSecondary}
              value={searchText}
              onChangeText={handleSearchTextChange}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            
            {searchText.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setSearchText('')}
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {/* 現在地ボタン */}
          <TouchableOpacity
            style={styles.currentLocationButton}
            onPress={handleUseCurrentLocation}
            disabled={isLoading}
          >
            <Text style={styles.currentLocationIcon}>📍</Text>
            <Text style={styles.currentLocationText}>現在地を使用</Text>
          </TouchableOpacity>

          {/* エラー表示 */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* 検索候補 */}
          {suggestions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>検索候補</Text>
              {suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => handleLocationSelect(suggestion)}
                >
                  <Text style={styles.suggestionIcon}>{suggestion.icon}</Text>
                  <View style={styles.suggestionContent}>
                    <Text style={styles.suggestionName}>{suggestion.name}</Text>
                    <Text style={styles.suggestionArea}>{suggestion.area}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* 最近の検索 */}
          {showRecentSearches && recentSearches.length > 0 && suggestions.length === 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>最近の検索</Text>
              {recentSearches.map((recent, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.recentItem}
                  onPress={() => handleLocationSelect(recent.text)}
                >
                  <Text style={styles.recentIcon}>🕐</Text>
                  <Text style={styles.recentText}>{recent.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* 人気の検索 */}
          {searchText.length === 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>人気の場所</Text>
              <View style={styles.popularGrid}>
                {popularSearches.map((popular, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.popularItem}
                    onPress={() => handleLocationSelect(popular.text)}
                  >
                    <Text style={styles.popularIcon}>{popular.icon}</Text>
                    <Text style={styles.popularText}>{popular.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 24,
    color: Colors.textPrimary,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
    borderRadius: 25,
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  clearButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightPink,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  currentLocationIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  currentLocationText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  errorContainer: {
    backgroundColor: Colors.errorLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  suggestionIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  suggestionArea: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  recentIcon: {
    fontSize: 16,
    marginRight: 12,
    width: 24,
  },
  recentText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  popularItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  popularIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  popularText: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
});

export default React.memo(MapSearch);