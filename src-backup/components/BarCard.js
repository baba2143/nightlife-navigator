import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { borderRadius, colors, typography } from '../styles';

export default function BarCard({ bar, isFavorite, onPress, onToggleFavorite }) {
  const getGenreIcon = (genre) => {
    switch (genre) {
      case 'スナック／パブ':
        return '🍺';
      case 'コンカフェ':
        return '☕';
      case 'クラブ／ラウンジ':
        return '🍸';
      default:
        return '🏪';
    }
  };

  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => onPress && onPress(bar)}
    >
      <View style={styles.imageContainer}>
        <Text style={styles.imageIcon}>
          {getGenreIcon(bar.genre)}
        </Text>
        {bar.isOpenNow && (
          <View style={styles.openBadge}>
            <Text style={styles.openBadgeText}>営業中</Text>
          </View>
        )}
        {isFavorite && (
          <View style={styles.favoriteIconContainer}>
            <Text style={styles.favoriteIcon}>❤️</Text>
          </View>
        )}
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.barName}>{bar.name}</Text>
        <Text style={styles.barGenre}>{bar.genre}</Text>
        <View style={styles.ratingContainer}>
          <Text style={styles.star}>⭐</Text>
          <Text style={styles.rating}>{bar.rating}</Text>
          <Text style={styles.reviewCount}>({bar.reviewCount}件)</Text>
        </View>
        <Text style={styles.area}>{bar.area} • {bar.priceRange}</Text>
        <Text style={styles.price}>平均 ¥{bar.averagePrice?.toLocaleString() || '---'}</Text>
        {onToggleFavorite && (
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => onToggleFavorite(bar.id)}
          >
            <Text style={styles.favoriteButtonText}>
              {isFavorite ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: 200
  },
  imageContainer: {
    height: 120,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  imageIcon: {
    fontSize: 40
  },
  openBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.success,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2
  },
  openBadgeText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: typography.weights.semibold
  },
  favoriteIconContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.secondary,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2
  },
  favoriteIcon: {
    fontSize: 16
  },
  cardContent: {
    padding: 15,
    position: 'relative'
  },
  barName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 5
  },
  barGenre: {
    fontSize: typography.sizes.sm,
    color: colors.secondary,
    marginBottom: 8,
    fontWeight: typography.weights.semibold
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  star: {
    fontSize: 16,
    marginRight: 5
  },
  rating: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.accent,
    marginRight: 5
  },
  reviewCount: {
    fontSize: typography.sizes.sm,
    color: colors.textTertiary
  },
  area: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: 5
  },
  price: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.secondary
  },
  favoriteButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    padding: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.secondary,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2
  },
  favoriteButtonText: {
    fontSize: 20
  }
}); 