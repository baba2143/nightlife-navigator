import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function MapViewComponent({ bars, onBarPress, userLocation }) {
  const [selectedBar, setSelectedBar] = useState(null);

  const handleBarPress = (bar) => {
    setSelectedBar(bar);
    if (onBarPress) {
      onBarPress(bar);
    }
  };

  const getBarColor = (bar) => {
    if (bar.isOpenNow) return '#4CAF50';
    if (bar.rating >= 4.5) return '#FFD700';
    return '#FF6B6B';
  };

  return (
    <View style={styles.container}>
      {/* 地図の代わりにバーリストを表示 */}
      <View style={styles.mapContainer}>
        <View style={styles.mapHeader}>
          <Text style={styles.mapTitle}>🗺️ 地図表示</Text>
          <Text style={styles.mapSubtitle}>
            {bars.length}件のバーが見つかりました
          </Text>
        </View>
        
        <ScrollView style={styles.barsList}>
          {bars.map((bar) => (
            <TouchableOpacity
              key={bar.id}
              style={[
                styles.barMarker,
                selectedBar?.id === bar.id && styles.selectedBarMarker
              ]}
              onPress={() => handleBarPress(bar)}
            >
              <View style={[
                styles.markerDot,
                { backgroundColor: getBarColor(bar) }
              ]} />
              <View style={styles.barInfo}>
                <Text style={styles.barName}>{bar.name}</Text>
                <Text style={styles.barGenre}>{bar.genre}</Text>
                <View style={styles.barStats}>
                  <Text style={styles.barRating}>⭐ {bar.rating}</Text>
                  <Text style={styles.barStatus}>
                    {bar.isOpenNow ? '🟢 営業中' : '🔴 閉店'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 選択されたバーの詳細 */}
      {selectedBar && (
        <View style={styles.selectedBarDetail}>
          <Text style={styles.selectedBarTitle}>{selectedBar.name}</Text>
          <Text style={styles.selectedBarAddress}>{selectedBar.address}</Text>
          <View style={styles.selectedBarActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleBarPress(selectedBar)}
            >
              <Text style={styles.actionButtonText}>詳細を見る</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  mapContainer: {
    flex: 1,
    padding: 20,
  },
  mapHeader: {
    marginBottom: 20,
  },
  mapTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 5,
  },
  mapSubtitle: {
    fontSize: 14,
    color: '#999',
  },
  barsList: {
    flex: 1,
  },
  barMarker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  selectedBarMarker: {
    borderColor: '#D4AF37',
    borderWidth: 2,
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 15,
  },
  barInfo: {
    flex: 1,
  },
  barName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  barGenre: {
    fontSize: 12,
    color: '#D4AF37',
    marginBottom: 5,
  },
  barStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  barRating: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '600',
  },
  barStatus: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  selectedBarDetail: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  selectedBarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 5,
  },
  selectedBarAddress: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 15,
  },
  selectedBarActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButton: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  actionButtonText: {
    color: '#000',
    fontWeight: '600',
  },
}); 