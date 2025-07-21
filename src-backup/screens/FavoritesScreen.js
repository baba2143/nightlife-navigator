import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { BARS } from '../constants/data';
import BarCard from '../components/BarCard';

export default function FavoritesScreen({ onBack, favorites, onToggleFavorite, onBarSelect }) {
  const favoriteBars = BARS.filter(bar => favorites.includes(bar.id));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>お気に入り</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content}>
        {favoriteBars.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>❤️</Text>
            <Text style={styles.emptyText}>お気に入りの店舗がありません</Text>
            <Text style={styles.emptySubText}>気になる店舗をお気に入りに追加しましょう</Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={onBack}
            >
              <Text style={styles.emptyButtonText}>店舗を探す</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.favoriteCount}>
              {favoriteBars.length}件のお気に入り
            </Text>
            {favoriteBars.map((bar) => (
              <BarCard
                key={bar.id}
                bar={bar}
                isFavorite={true}
                onPress={onBarSelect}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </>
        )}
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
    fontSize: 16,
    color: '#D4AF37'
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 80
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 20
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 30
  },
  emptyButton: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000'
  },
  favoriteCount: {
    fontSize: 14,
    color: '#999',
    marginBottom: 15
  }
}); 