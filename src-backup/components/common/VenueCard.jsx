import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './ThemeProvider';
import Card from './Card';

const { width } = Dimensions.get('window');

const VenueCard = ({
  venue,
  onPress,
  onLike,
  onShare,
  variant = 'default',
  style,
}) => {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={i} name="star" size={12} color={colors.warning} />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={12} color={colors.warning} />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons
          key={`empty-${i}`}
          name="star-outline"
          size={12}
          color={colors.textSecondary}
        />
      );
    }

    return stars;
  };

  const renderDistance = () => {
    if (venue.distance) {
      return (
        <View style={styles.distanceContainer}>
          <Ionicons
            name="location-outline"
            size={12}
            color={colors.textSecondary}
          />
          <Text style={[styles.distance, { color: colors.textSecondary }]}>
            {venue.distance < 1
              ? `${Math.round(venue.distance * 1000)}m`
              : `${venue.distance.toFixed(1)}km`}
          </Text>
        </View>
      );
    }
    return null;
  };

  const renderVenueType = () => {
    const typeColors = {
      club: colors.nightlife.primary,
      bar: colors.nightlife.secondary,
      lounge: colors.nightlife.gold,
      restaurant: colors.secondary,
    };

    return (
      <View
        style={[
          styles.typeTag,
          { backgroundColor: typeColors[venue.type] || colors.primary },
        ]}
      >
        <Text style={[styles.typeText, { color: '#FFFFFF' }]}>
          {venue.type?.toUpperCase() || 'VENUE'}
        </Text>
      </View>
    );
  };

  const renderVIPBadge = () => {
    if (venue.hasVipAccess) {
      return (
        <View style={[styles.vipBadge, { backgroundColor: colors.nightlife.gold }]}>
          <Ionicons name="star" size={12} color="#FFFFFF" />
          <Text style={[styles.vipText, { color: '#FFFFFF' }]}>VIP</Text>
        </View>
      );
    }
    return null;
  };

  const renderActions = () => (
    <View style={styles.actions}>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => onLike?.(venue)}
      >
        <Ionicons
          name={venue.isLiked ? 'heart' : 'heart-outline'}
          size={20}
          color={venue.isLiked ? colors.error : colors.textSecondary}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => onShare?.(venue)}
      >
        <Ionicons
          name="share-outline"
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );

  if (variant === 'horizontal') {
    return (
      <Card style={[styles.horizontalCard, style]} onPress={() => onPress?.(venue)}>
        <Image
          source={{ uri: venue.image || venue.images?.[0] }}
          style={styles.horizontalImage}
          resizeMode="cover"
        />
        <View style={styles.horizontalContent}>
          <View style={styles.horizontalHeader}>
            <Text
              style={[styles.horizontalTitle, { color: colors.text }]}
              numberOfLines={1}
            >
              {venue.name}
            </Text>
            {renderVIPBadge()}
          </View>
          
          <View style={styles.horizontalMeta}>
            <View style={styles.rating}>
              {renderStars(venue.rating || 0)}
              <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
                ({venue.reviewCount || 0})
              </Text>
            </View>
            {renderDistance()}
          </View>

          <Text
            style={[styles.horizontalAddress, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {venue.address}
          </Text>

          <View style={styles.horizontalFooter}>
            {renderVenueType()}
            {renderActions()}
          </View>
        </View>
      </Card>
    );
  }

  return (
    <Card style={[styles.card, style]} onPress={() => onPress?.(venue)}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: venue.image || venue.images?.[0] }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.imageOverlay}>
          {renderVenueType()}
          {renderVIPBadge()}
        </View>
        {renderActions()}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={1}
          >
            {venue.name}
          </Text>
          <View style={styles.meta}>
            <View style={styles.rating}>
              {renderStars(venue.rating || 0)}
              <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
                ({venue.reviewCount || 0})
              </Text>
            </View>
            {renderDistance()}
          </View>
        </View>

        <Text
          style={[styles.address, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {venue.address}
        </Text>

        {venue.description && (
          <Text
            style={[styles.description, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {venue.description}
          </Text>
        )}

        <View style={styles.footer}>
          <View style={styles.priceRange}>
            <Text style={[styles.price, { color: colors.primary }]}>
              {'$'.repeat(venue.priceRange || 2)}
            </Text>
          </View>
          
          {venue.isOpen !== undefined && (
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: venue.isOpen
                    ? colors.success
                    : colors.error,
                },
              ]}
            >
              <Text style={[styles.statusText, { color: '#FFFFFF' }]}>
                {venue.isOpen ? 'OPEN' : 'CLOSED'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    overflow: 'hidden',
  },
  horizontalCard: {
    flexDirection: 'row',
    marginBottom: 12,
    padding: 12,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 200,
  },
  horizontalImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    gap: 8,
  },
  actions: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  content: {
    padding: 12,
  },
  horizontalContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  header: {
    marginBottom: 8,
  },
  horizontalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  horizontalTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  horizontalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    marginLeft: 4,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  distance: {
    fontSize: 12,
  },
  address: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 18,
  },
  horizontalAddress: {
    fontSize: 12,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  horizontalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceRange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  vipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
});

export default VenueCard;