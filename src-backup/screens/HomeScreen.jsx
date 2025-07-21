import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme } from '../components/common/ThemeProvider';
import VenueCard from '../components/common/VenueCard';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

import { VenueSearchService } from '../services/VenueSearchService';
import { EventService } from '../services/EventService';
import { VIPBenefitsService } from '../services/VIPBenefitsService';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { colors, spacing, typography } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Data state
  const [featuredVenues, setFeaturedVenues] = useState([]);
  const [nearbyVenues, setNearbyVenues] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [vipStatus, setVipStatus] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Services
  const [venueService, setVenueService] = useState(null);
  const [eventService, setEventService] = useState(null);
  const [vipService, setVipService] = useState(null);

  // Initialize services
  useEffect(() => {
    const initServices = async () => {
      try {
        const venue = await VenueSearchService.getInstance();
        const event = await EventService.getInstance();
        const vip = await VIPBenefitsService.getInstance();
        
        setVenueService(venue);
        setEventService(event);
        setVipService(vip);
      } catch (error) {
        console.error('Failed to initialize services:', error);
      }
    };

    initServices();
  }, []);

  // Load data
  const loadData = useCallback(async () => {
    if (!venueService || !eventService || !vipService) return;

    try {
      setLoading(true);

      // Mock user ID - in real app, get from auth context
      const userId = 'user_123';

      // Load featured venues
      const featured = await venueService.getFeaturedVenues({ limit: 5 });
      setFeaturedVenues(featured);

      // Load nearby venues
      const nearby = await venueService.searchVenues({
        location: { latitude: 37.7749, longitude: -122.4194 }, // San Francisco
        radius: 5,
        limit: 10,
      });
      setNearbyVenues(nearby.venues || []);

      // Load upcoming events
      const events = await eventService.getUpcomingEvents({ limit: 5 });
      setUpcomingEvents(events);

      // Load VIP status
      const vip = await vipService.getUserVIPStatus(userId);
      setVipStatus(vip);

    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, [venueService, eventService, vipService]);

  // Load data when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // Search handler
  const handleSearch = () => {
    navigation.navigate('Search', { 
      query: searchQuery,
      autoFocus: true 
    });
  };

  // Venue handlers
  const handleVenuePress = (venue) => {
    navigation.navigate('VenueDetail', { venue });
  };

  const handleVenueLike = async (venue) => {
    // TODO: Implement like functionality
    console.log('Like venue:', venue.id);
  };

  const handleVenueShare = async (venue) => {
    // TODO: Implement share functionality
    console.log('Share venue:', venue.id);
  };

  // Event handler
  const handleEventPress = (event) => {
    navigation.navigate('EventDetail', { event });
  };

  // VIP section
  const renderVIPSection = () => {
    if (!vipStatus) return null;

    return (
      <Card style={[styles.vipCard, { backgroundColor: colors.nightlife.gold }]}>
        <View style={styles.vipHeader}>
          <Ionicons name="star" size={24} color="#FFFFFF" />
          <Text style={[styles.vipTitle, { color: '#FFFFFF' }]}>
            {vipStatus.tier?.name || 'VIP Member'}
          </Text>
        </View>
        <Text style={[styles.vipPoints, { color: '#FFFFFF' }]}>
          {vipStatus.member?.pointsBalance || 0} points available
        </Text>
        <Button
          title="View Benefits"
          variant="ghost"
          size="small"
          style={styles.vipButton}
          textStyle={{ color: '#FFFFFF' }}
          onPress={() => navigation.navigate('Profile', { screen: 'VIP' })}
        />
      </Card>
    );
  };

  // Quick actions
  const renderQuickActions = () => (
    <View style={styles.quickActions}>
      <TouchableOpacity
        style={[styles.quickAction, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('Search')}
      >
        <Ionicons name="search" size={24} color="#FFFFFF" />
        <Text style={[styles.quickActionText, { color: '#FFFFFF' }]}>
          Search
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.quickAction, { backgroundColor: colors.secondary }]}
        onPress={() => navigation.navigate('Map')}
      >
        <Ionicons name="map" size={24} color="#FFFFFF" />
        <Text style={[styles.quickActionText, { color: '#FFFFFF' }]}>
          Map
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.quickAction, { backgroundColor: colors.accent }]}
        onPress={() => navigation.navigate('Profile', { screen: 'Reservations' })}
      >
        <Ionicons name="calendar" size={24} color="#FFFFFF" />
        <Text style={[styles.quickActionText, { color: '#FFFFFF' }]}>
          Reservations
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.quickAction, { backgroundColor: colors.nightlife.secondary }]}
        onPress={() => navigation.navigate('Chat')}
      >
        <Ionicons name="chatbubbles" size={24} color="#FFFFFF" />
        <Text style={[styles.quickActionText, { color: '#FFFFFF' }]}>
          Chat
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Section header
  const renderSectionHeader = (title, onViewAll) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {title}
      </Text>
      {onViewAll && (
        <TouchableOpacity onPress={onViewAll}>
          <Text style={[styles.viewAllText, { color: colors.primary }]}>
            View All
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Event item
  const renderEventItem = ({ item: event }) => (
    <TouchableOpacity
      style={[styles.eventCard, { backgroundColor: colors.card }]}
      onPress={() => handleEventPress(event)}
    >
      <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={1}>
        {event.title}
      </Text>
      <Text style={[styles.eventDate, { color: colors.textSecondary }]}>
        {new Date(event.startDate).toLocaleDateString()}
      </Text>
      <Text style={[styles.eventVenue, { color: colors.primary }]} numberOfLines={1}>
        {event.venueName}
      </Text>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: colors.text }]}>
            Good Evening! 🌙
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Discover amazing nightlife around you
          </Text>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search venues, events..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* VIP Section */}
        {renderVIPSection()}

        {/* Quick Actions */}
        {renderQuickActions()}

        {/* Featured Venues */}
        {featuredVenues.length > 0 && (
          <View style={styles.section}>
            {renderSectionHeader('Featured Tonight', () => 
              navigation.navigate('Search', { featured: true })
            )}
            <FlatList
              data={featuredVenues}
              renderItem={({ item }) => (
                <View style={styles.featuredVenueItem}>
                  <VenueCard
                    venue={item}
                    onPress={handleVenuePress}
                    onLike={handleVenueLike}
                    onShare={handleVenueShare}
                  />
                </View>
              )}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </View>
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <View style={styles.section}>
            {renderSectionHeader('Upcoming Events', () => 
              navigation.navigate('Search', { tab: 'events' })
            )}
            <FlatList
              data={upcomingEvents}
              renderItem={renderEventItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </View>
        )}

        {/* Nearby Venues */}
        {nearbyVenues.length > 0 && (
          <View style={styles.section}>
            {renderSectionHeader('Near You', () => 
              navigation.navigate('Map')
            )}
            {nearbyVenues.slice(0, 3).map((venue) => (
              <VenueCard
                key={venue.id}
                venue={venue}
                variant="horizontal"
                onPress={handleVenuePress}
                onLike={handleVenueLike}
                onShare={handleVenueShare}
                style={styles.nearbyVenueCard}
              />
            ))}
          </View>
        )}

        {/* Bottom spacing */}
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
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  vipCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
  },
  vipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  vipTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  vipPoints: {
    fontSize: 14,
    marginBottom: 12,
  },
  vipButton: {
    alignSelf: 'flex-start',
    borderColor: '#FFFFFF',
    borderWidth: 1,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
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
  horizontalList: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  featuredVenueItem: {
    width: width * 0.8,
    marginRight: 16,
  },
  eventCard: {
    width: 200,
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 12,
    marginBottom: 4,
  },
  eventVenue: {
    fontSize: 14,
    fontWeight: '500',
  },
  nearbyVenueCard: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 16,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default HomeScreen;