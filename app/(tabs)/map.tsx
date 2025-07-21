import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  ScrollView,
  Modal
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import MapService from '../../services/MapService';
import VenueDetails from '../../components/VenueDetails';

export default function MapScreen() {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [showVenueDetails, setShowVenueDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchRadius, setSearchRadius] = useState(1000);

  const initializeMap = async () => {
    try {
      setIsLoading(true);
      await MapService.initialize();
      
      const locationResult = await MapService.getCurrentLocation();
      if (locationResult.success) {
        setCurrentLocation(locationResult.location);
        await searchNearbyVenues();
      } else {
        Alert.alert('位置情報エラー', locationResult.error);
      }
    } catch (error) {
      console.error('Map initialization failed:', error);
      Alert.alert('エラー', '地図の初期化に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeMap();
  }, [initializeMap]);

  const searchNearbyVenues = async () => {
    try {
      const result = await MapService.searchNearbyVenues(searchRadius);
      if (result.success) {
        setVenues(result.venues);
      } else {
        Alert.alert('検索エラー', result.error);
      }
    } catch (error) {
      console.error('Venue search failed:', error);
    }
  };

  const handleLocationButtonPress = async () => {
    try {
      setIsLoading(true);
      const result = await MapService.getCurrentLocation();
      if (result.success) {
        setCurrentLocation(result.location);
        await searchNearbyVenues();
      } else {
        Alert.alert('位置情報エラー', result.error);
      }
    } catch (error) {
      Alert.alert('エラー', '現在位置の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVenuePress = (venue: any) => {
    setSelectedVenue(venue);
    setShowVenueDetails(true);
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      club: 'musical-notes',
      bar: 'wine',
      lounge: 'cafe',
      restaurant: 'restaurant',
    };
    return icons[category] || 'location';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      club: '#ea5a7b',
      bar: '#4caf50',
      lounge: '#ff9800',
      restaurant: '#2196f3',
    };
    return colors[category] || '#666666';
  };

  const formatDistance = (distance: number) => {
    if (distance < 1000) {
      return `${distance}m`;
    }
    return `${(distance / 1000).toFixed(1)}km`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ea5a7b" />
          <Text style={styles.loadingText}>地図を読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🗺️ 地図</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerButton} onPress={handleLocationButtonPress}>
            <Ionicons name="locate-outline" size={20} color="#ea5a7b" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {/* 現在位置情報 */}
        {currentLocation && (
          <View style={styles.locationInfo}>
            <Text style={styles.locationTitle}>📍 現在位置</Text>
            <Text style={styles.locationText}>
              緯度: {currentLocation.latitude.toFixed(6)}
            </Text>
            <Text style={styles.locationText}>
              経度: {currentLocation.longitude.toFixed(6)}
            </Text>
            <Text style={styles.accuracyText}>
              精度: {Math.round(currentLocation.accuracy)}m
            </Text>
          </View>
        )}

        {/* 検索範囲設定 */}
        <View style={styles.radiusControl}>
          <Text style={styles.radiusLabel}>検索範囲: {formatDistance(searchRadius)}</Text>
          <View style={styles.radiusButtons}>
            {[500, 1000, 2000, 5000].map((radius) => (
              <TouchableOpacity
                key={radius}
                style={[
                  styles.radiusButton,
                  searchRadius === radius && styles.activeRadiusButton
                ]}
                onPress={() => {
                  setSearchRadius(radius);
                  searchNearbyVenues();
                }}
              >
                <Text style={[
                  styles.radiusButtonText,
                  searchRadius === radius && styles.activeRadiusButtonText
                ]}>
                  {formatDistance(radius)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 店舗一覧 */}
        <View style={styles.venuesSection}>
          <Text style={styles.venuesTitle}>
            近くの店舗 ({venues.length}件)
          </Text>
          
          <ScrollView style={styles.venuesList} showsVerticalScrollIndicator={false}>
            {venues.map((venue) => (
              <TouchableOpacity
                key={venue.id}
                style={styles.venueItem}
                onPress={() => handleVenuePress(venue)}
              >
                <View style={styles.venueIcon}>
                  <Ionicons
                    name={getCategoryIcon(venue.category)}
                    size={24}
                    color={getCategoryColor(venue.category)}
                  />
                </View>
                
                <View style={styles.venueInfo}>
                  <Text style={styles.venueName}>{venue.name}</Text>
                  <Text style={styles.venueAddress}>{venue.address}</Text>
                  <View style={styles.venueDetails}>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={14} color="#ffd700" />
                      <Text style={styles.rating}>{venue.rating}</Text>
                    </View>
                    <Text style={styles.distance}>{formatDistance(venue.distance)}</Text>
                  </View>
                </View>
                
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            ))}
            
            {venues.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyTitle}>店舗が見つかりません</Text>
                <Text style={styles.emptyText}>
                  検索範囲を広げるか、位置情報を更新してください
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
        
        {/* 地図プレースホルダー */}
        <View style={styles.mapNote}>
          <Text style={styles.noteText}>
            💡 地図表示機能は近日実装予定です。現在は店舗一覧での表示をご利用ください。
          </Text>
        </View>
      </View>

      {/* 店舗詳細モーダル */}
      <Modal
        visible={showVenueDetails}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowVenueDetails(false)}
      >
        {selectedVenue && (
          <VenueDetails
            venue={selectedVenue}
            onClose={() => setShowVenueDetails(false)}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fef7f7',
  },
  
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ea5a7b',
  },
  
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ea5a7b',
  },
  
  content: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  
  locationInfo: {
    backgroundColor: '#fef7f7',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ea5a7b20',
  },
  
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ea5a7b',
    marginBottom: 8,
  },
  
  locationText: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 2,
  },
  
  accuracyText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  
  radiusControl: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  
  radiusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
    textAlign: 'center',
  },
  
  radiusButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  
  radiusButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ea5a7b',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  
  activeRadiusButton: {
    backgroundColor: '#ea5a7b',
  },
  
  radiusButtonText: {
    fontSize: 12,
    color: '#ea5a7b',
    fontWeight: '500',
  },
  
  activeRadiusButtonText: {
    color: '#ffffff',
  },
  
  venuesSection: {
    flex: 1,
  },
  
  venuesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  
  venuesList: {
    flex: 1,
  },
  
  venueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 12,
  },
  
  venueIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fef7f7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  venueInfo: {
    flex: 1,
    gap: 4,
  },
  
  venueName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  
  venueAddress: {
    fontSize: 14,
    color: '#666666',
  },
  
  venueDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  
  rating: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  
  distance: {
    fontSize: 14,
    color: '#ea5a7b',
    fontWeight: '500',
  },
  
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  
  emptyIcon: {
    fontSize: 48,
  },
  
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
  },
  
  emptyText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  mapNote: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  
  noteText: {
    fontSize: 14,
    color: '#1976d2',
    lineHeight: 20,
  },
});