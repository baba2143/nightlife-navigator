import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Share,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme } from '../components/common/ThemeProvider';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

import { VenueReviewService } from '../services/VenueReviewService';
import { ReservationService } from '../services/ReservationService';
import { EventService } from '../services/EventService';

const { width } = Dimensions.get('window');

const VenueDetailScreen = ({ navigation, route }) => {
  const { colors, spacing, typography, borderRadius } = useTheme();
  const venue = route.params?.venue;

  // State
  const [reviews, setReviews] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(venue?.isLiked || false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [availability, setAvailability] = useState(null);

  // Services
  const [reviewService, setReviewService] = useState(null);
  const [reservationService, setReservationService] = useState(null);
  const [eventService, setEventService] = useState(null);

  // Initialize services
  useEffect(() => {
    const initServices = async () => {
      try {
        const review = await VenueReviewService.getInstance();
        const reservation = await ReservationService.getInstance();
        const event = await EventService.getInstance();
        
        setReviewService(review);
        setReservationService(reservation);
        setEventService(event);
      } catch (error) {
        console.error('Failed to initialize services:', error);
      }
    };

    initServices();
  }, []);

  // Load venue data
  const loadVenueData = useCallback(async () => {
    if (!reviewService || !eventService || !reservationService) return;

    try {
      setLoading(true);

      // Load reviews
      const venueReviews = await reviewService.getVenueReviews(venue.id, { limit: 5 });
      setReviews(venueReviews);

      // Load events
      const venueEvents = await eventService.getVenueEvents(venue.id, { limit: 3 });
      setEvents(venueEvents);

      // Check availability
      const today = new Date();
      const availabilityData = await reservationService.checkAvailability(venue.id, {
        date: today.toISOString().split('T')[0],
        partySize: 2,
      });
      setAvailability(availabilityData);

    } catch (error) {
      console.error('Failed to load venue data:', error);
    } finally {
      setLoading(false);
    }
  }, [venue.id, reviewService, eventService, reservationService]);

  useFocusEffect(
    useCallback(() => {
      loadVenueData();
    }, [loadVenueData])
  );

  // Handlers
  const handleMakeReservation = () => {
    navigation.navigate('Reservation', { venue });
  };

  const handleLike = async () => {
    setIsLiked(!isLiked);
    // TODO: Implement like functionality
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${venue.name} - ${venue.address}`,
        url: `https://nightlife-app.com/venues/${venue.id}`,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleCall = () => {
    if (venue.phone) {
      Linking.openURL(`tel:${venue.phone}`);
    }
  };

  const handleDirections = () => {
    const url = `maps://app?daddr=${venue.latitude},${venue.longitude}`;
    Linking.openURL(url);
  };

  const handleWriteReview = () => {
    // TODO: Navigate to write review screen
    Alert.alert('Write Review', 'Review functionality coming soon!');
  };

  const handleViewAllReviews = () => {
    // TODO: Navigate to all reviews screen
    Alert.alert('All Reviews', 'All reviews screen coming soon!');
  };

  const handleEventPress = (event) => {
    navigation.navigate('EventDetail', { event });
  };

  // Render components
  const renderImageGallery = () => {
    const images = venue.images || [venue.image];
    
    return (
      <View style={styles.imageContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentImageIndex(index);
          }}
          scrollEventThrottle={16}
        >
          {images.map((image, index) => (
            <Image
              key={index}
              source={{ uri: image }}
              style={styles.venueImage}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
        
        {images.length > 1 && (
          <View style={styles.imageIndicator}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  {
                    backgroundColor: index === currentImageIndex
                      ? '#FFFFFF'
                      : 'rgba(255, 255, 255, 0.5)'
                  }
                ]}
              />
            ))}
          </View>
        )}

        <View style={styles.imageOverlay}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleLike}
            >
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={24}
                color={isLiked ? colors.error : '#FFFFFF'}
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderVenueInfo = () => (
    <Card style={styles.infoCard}>
      <View style={styles.venueHeader}>
        <View style={styles.venueTitle}>
          <Text style={[styles.venueName, { color: colors.text }]}>
            {venue.name}
          </Text>
          <View style={styles.venueType}>
            <Text style={[styles.typeText, { color: colors.primary }]}>
              {venue.type?.toUpperCase() || 'VENUE'}
            </Text>
          </View>
        </View>
        
        <View style={styles.venueRating}>
          <View style={styles.stars}>
            {[...Array(5)].map((_, index) => (
              <Ionicons
                key={index}
                name={index < Math.floor(venue.rating || 0) ? 'star' : 'star-outline'}
                size={16}
                color={colors.warning}
              />
            ))}
          </View>
          <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
            {venue.rating?.toFixed(1)} ({venue.reviewCount || 0} reviews)
          </Text>
        </View>
      </View>

      <Text style={[styles.venueDescription, { color: colors.textSecondary }]}>
        {venue.description}
      </Text>

      <View style={styles.venueDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="location" size={16} color={colors.textSecondary} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {venue.address}
          </Text>
        </View>
        
        {venue.phone && (
          <TouchableOpacity style={styles.detailItem} onPress={handleCall}>
            <Ionicons name="call" size={16} color={colors.primary} />
            <Text style={[styles.detailText, { color: colors.primary }]}>
              {venue.phone}
            </Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.detailItem}>
          <Ionicons name="time" size={16} color={colors.textSecondary} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            Open until {venue.closingTime || '2:00 AM'}
          </Text>
        </View>
        
        <View style={styles.detailItem}>
          <Ionicons name="cash" size={16} color={colors.textSecondary} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {'$'.repeat(venue.priceRange || 2)} • {venue.cuisine || 'Nightlife'}
          </Text>
        </View>
      </View>

      {venue.features && venue.features.length > 0 && (
        <View style={styles.features}>
          {venue.features.map((feature, index) => (
            <View
              key={index}
              style={[styles.featureTag, { backgroundColor: colors.surface }]}
            >
              <Text style={[styles.featureText, { color: colors.text }]}>
                {feature}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );

  const renderActionButtons = () => (
    <View style={styles.actionButtonsContainer}>
      <Button
        title="Make Reservation"
        onPress={handleMakeReservation}
        style={styles.reservationButton}
        icon="calendar"
      />
      
      <View style={styles.secondaryActions}>
        <Button
          title="Call"
          variant="outline"
          size="small"
          icon="call"
          onPress={handleCall}
          style={styles.secondaryButton}
        />
        
        <Button
          title="Directions"
          variant="outline"
          size="small"
          icon="navigate"
          onPress={handleDirections}
          style={styles.secondaryButton}
        />
      </View>
    </View>
  );

  const renderUpcomingEvents = () => {
    if (!events.length) return null;

    return (
      <Card style={styles.eventsCard}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Upcoming Events
          </Text>
        </View>
        
        {events.map((event) => (
          <TouchableOpacity
            key={event.id}
            style={[styles.eventItem, { borderBottomColor: colors.border }]}
            onPress={() => handleEventPress(event)}
          >
            <View style={styles.eventInfo}>
              <Text style={[styles.eventTitle, { color: colors.text }]}>
                {event.title}
              </Text>
              <Text style={[styles.eventDate, { color: colors.textSecondary }]}>
                {new Date(event.startDate).toLocaleDateString()} • {event.startTime}
              </Text>
              {event.ticketPrice && (
                <Text style={[styles.eventPrice, { color: colors.primary }]}>
                  From ${event.ticketPrice}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </Card>
    );
  };

  const renderReviews = () => (
    <Card style={styles.reviewsCard}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Reviews
        </Text>
        <TouchableOpacity onPress={handleViewAllReviews}>
          <Text style={[styles.viewAllText, { color: colors.primary }]}>
            View All
          </Text>
        </TouchableOpacity>
      </View>

      {reviews.length > 0 ? (
        reviews.slice(0, 3).map((review) => (
          <View
            key={review.id}
            style={[styles.reviewItem, { borderBottomColor: colors.border }]}
          >
            <View style={styles.reviewHeader}>
              <Text style={[styles.reviewAuthor, { color: colors.text }]}>
                {review.authorName}
              </Text>
              <View style={styles.reviewRating}>
                {[...Array(5)].map((_, index) => (
                  <Ionicons
                    key={index}
                    name={index < review.rating ? 'star' : 'star-outline'}
                    size={12}
                    color={colors.warning}
                  />
                ))}
              </View>
            </View>
            <Text style={[styles.reviewText, { color: colors.textSecondary }]}>
              {review.content}
            </Text>
            <Text style={[styles.reviewDate, { color: colors.textSecondary }]}>
              {new Date(review.createdAt).toLocaleDateString()}
            </Text>
          </View>
        ))
      ) : (
        <Text style={[styles.noReviews, { color: colors.textSecondary }]}>
          No reviews yet. Be the first to review!
        </Text>
      )}

      <Button
        title="Write a Review"
        variant="outline"
        size="small"
        onPress={handleWriteReview}
        style={styles.writeReviewButton}
      />
    </Card>
  );

  if (!venue) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>
          Venue not found
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderImageGallery()}
      
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderVenueInfo()}
        {renderActionButtons()}
        {renderUpcomingEvents()}
        {renderReviews()}
        
        {/* Bottom spacing for safe area */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    height: 300,
    position: 'relative',
  },
  venueImage: {
    width,
    height: 300,
  },
  imageIndicator: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
  },
  infoCard: {
    margin: 16,
    marginTop: 0,
  },
  venueHeader: {
    marginBottom: 12,
  },
  venueTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  venueName: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
  },
  venueType: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  venueRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 14,
  },
  venueDescription: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
  },
  venueDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    flex: 1,
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtonsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  reservationButton: {
    marginBottom: 12,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
  },
  eventsCard: {
    margin: 16,
  },
  reviewsCard: {
    margin: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    marginBottom: 2,
  },
  eventPrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAuthor: {
    fontSize: 16,
    fontWeight: '600',
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
  },
  noReviews: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 24,
  },
  writeReviewButton: {
    marginTop: 8,
  },
  errorText: {
    fontSize: 16,
  },
  bottomSpacing: {
    height: 32,
  },
});

export default VenueDetailScreen;