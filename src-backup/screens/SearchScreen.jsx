import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  SafeAreaView,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme } from '../components/common/ThemeProvider';
import VenueCard from '../components/common/VenueCard';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

import { VenueSearchService } from '../services/VenueSearchService';
import { EventService } from '../services/EventService';

const { width, height } = Dimensions.get('window');

const SearchScreen = ({ navigation, route }) => {
  const { colors, spacing, typography, borderRadius } = useTheme();
  const searchInputRef = useRef(null);
  
  // Route params
  const initialQuery = route.params?.query || '';
  const autoFocus = route.params?.autoFocus || false;
  const featured = route.params?.featured || false;
  const tabParam = route.params?.tab || 'venues';

  // State
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(tabParam);
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  
  // Filter state
  const [filters, setFilters] = useState({
    type: '',
    priceRange: '',
    rating: '',
    distance: '',
    features: [],
    openNow: false,
  });

  // Services
  const [venueService, setVenueService] = useState(null);
  const [eventService, setEventService] = useState(null);

  // Initialize services
  useEffect(() => {
    const initServices = async () => {
      try {
        const venue = await VenueSearchService.getInstance();
        const event = await EventService.getInstance();
        
        setVenueService(venue);
        setEventService(event);
      } catch (error) {
        console.error('Failed to initialize services:', error);
      }
    };

    initServices();
  }, []);

  // Auto focus search input
  useEffect(() => {
    if (autoFocus && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current.focus();
      }, 100);
    }
  }, [autoFocus]);

  // Load featured venues if specified
  useEffect(() => {
    if (featured && venueService) {
      loadFeaturedVenues();
    }
  }, [featured, venueService]);

  // Load recent searches
  useEffect(() => {
    if (venueService) {
      loadRecentSearches();
    }
  }, [venueService]);

  const loadFeaturedVenues = async () => {
    try {
      setLoading(true);
      const results = await venueService.getFeaturedVenues({ limit: 20 });
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to load featured venues:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentSearches = async () => {
    try {
      const recent = await venueService.getSearchHistory('user_123', { limit: 5 });
      setRecentSearches(recent);
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  };

  // Search functionality
  const performSearch = useCallback(async (query = searchQuery) => {
    if (!venueService || !eventService) return;
    if (!query.trim() && !Object.values(filters).some(v => v)) return;

    try {
      setLoading(true);

      if (activeTab === 'venues') {
        const searchOptions = {
          query: query.trim(),
          location: { latitude: 37.7749, longitude: -122.4194 }, // San Francisco
          radius: filters.distance ? parseInt(filters.distance) : 10,
          ...filters,
          limit: 50,
        };

        const results = await venueService.searchVenues(searchOptions);
        setSearchResults(results.venues || []);

        // Save search to history
        if (query.trim()) {
          await venueService.saveSearchQuery('user_123', query);
        }
      } else {
        const results = await eventService.searchEvents({
          query: query.trim(),
          limit: 50,
        });
        setEvents(results);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters, activeTab, venueService, eventService]);

  // Get suggestions
  const getSuggestions = useCallback(async (query) => {
    if (!venueService || query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const results = await venueService.getSearchSuggestions(query);
      setSuggestions(results);
    } catch (error) {
      console.error('Failed to get suggestions:', error);
    }
  }, [venueService]);

  // Handle search input change
  const handleSearchChange = (text) => {
    setSearchQuery(text);
    getSuggestions(text);
  };

  // Handle search submit
  const handleSearchSubmit = () => {
    Keyboard.dismiss();
    performSearch();
  };

  // Handle suggestion select
  const handleSuggestionSelect = (suggestion) => {
    setSearchQuery(suggestion.text);
    setSuggestions([]);
    performSearch(suggestion.text);
  };

  // Filter handlers
  const applyFilters = (newFilters) => {
    setFilters(newFilters);
    setShowFilters(false);
    performSearch();
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      priceRange: '',
      rating: '',
      distance: '',
      features: [],
      openNow: false,
    });
  };

  // Venue handlers
  const handleVenuePress = (venue) => {
    navigation.navigate('VenueDetail', { venue });
  };

  const handleEventPress = (event) => {
    navigation.navigate('EventDetail', { event });
  };

  // Render components
  const renderSearchHeader = () => (
    <View style={[styles.searchHeader, { backgroundColor: colors.background }]}>
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          ref={searchInputRef}
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search venues, events, locations..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={handleSearchChange}
          onSubmitEditing={handleSearchSubmit}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[styles.filterButton, { backgroundColor: colors.primary }]}
        onPress={() => setShowFilters(true)}
      >
        <Ionicons name="options" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  const renderTabs = () => (
    <View style={[styles.tabContainer, { backgroundColor: colors.surface }]}>
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'venues' && { backgroundColor: colors.primary }
        ]}
        onPress={() => setActiveTab('venues')}
      >
        <Text
          style={[
            styles.tabText,
            {
              color: activeTab === 'venues' ? '#FFFFFF' : colors.textSecondary
            }
          ]}
        >
          Venues
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'events' && { backgroundColor: colors.primary }
        ]}
        onPress={() => setActiveTab('events')}
      >
        <Text
          style={[
            styles.tabText,
            {
              color: activeTab === 'events' ? '#FFFFFF' : colors.textSecondary
            }
          ]}
        >
          Events
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSuggestions = () => {
    if (suggestions.length === 0) return null;

    return (
      <View style={[styles.suggestionsContainer, { backgroundColor: colors.card }]}>
        {suggestions.map((suggestion, index) => (
          <TouchableOpacity
            key={index}
            style={styles.suggestionItem}
            onPress={() => handleSuggestionSelect(suggestion)}
          >
            <Ionicons name="search" size={16} color={colors.textSecondary} />
            <Text style={[styles.suggestionText, { color: colors.text }]}>
              {suggestion.text}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderRecentSearches = () => {
    if (searchQuery.length > 0 || recentSearches.length === 0) return null;

    return (
      <View style={styles.recentContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Recent Searches
        </Text>
        {recentSearches.map((search, index) => (
          <TouchableOpacity
            key={index}
            style={styles.recentItem}
            onPress={() => {
              setSearchQuery(search.query);
              performSearch(search.query);
            }}
          >
            <Ionicons name="time" size={16} color={colors.textSecondary} />
            <Text style={[styles.recentText, { color: colors.text }]}>
              {search.query}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderVenueItem = ({ item: venue }) => (
    <VenueCard
      venue={venue}
      variant="horizontal"
      onPress={handleVenuePress}
      style={styles.venueItem}
    />
  );

  const renderEventItem = ({ item: event }) => (
    <TouchableOpacity
      style={[styles.eventItem, { backgroundColor: colors.card }]}
      onPress={() => handleEventPress(event)}
    >
      <Text style={[styles.eventTitle, { color: colors.text }]}>
        {event.title}
      </Text>
      <Text style={[styles.eventDate, { color: colors.textSecondary }]}>
        {new Date(event.startDate).toLocaleDateString()}
      </Text>
      <Text style={[styles.eventVenue, { color: colors.primary }]}>
        {event.venueName}
      </Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name={activeTab === 'venues' ? 'business' : 'calendar'}
        size={64}
        color={colors.textSecondary}
      />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {searchQuery
          ? `No ${activeTab} found`
          : `Discover ${activeTab}`
        }
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {searchQuery
          ? 'Try adjusting your search or filters'
          : `Search for ${activeTab} around you`
        }
      </Text>
    </View>
  );

  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <Text style={[styles.modalCancel, { color: colors.primary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Filters
          </Text>
          <TouchableOpacity onPress={clearFilters}>
            <Text style={[styles.modalClear, { color: colors.primary }]}>
              Clear
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.filterContent}>
          {/* Filter options would be implemented here */}
          <Text style={[styles.filterSection, { color: colors.text }]}>
            Filter options coming soon...
          </Text>
        </ScrollView>

        <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
          <Button
            title="Apply Filters"
            onPress={() => applyFilters(filters)}
            style={styles.applyButton}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderSearchHeader()}
      {renderTabs()}
      
      {suggestions.length > 0 && renderSuggestions()}

      <View style={styles.content}>
        {!searchQuery && renderRecentSearches()}

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Searching...
            </Text>
          </View>
        ) : (
          <FlatList
            data={activeTab === 'venues' ? searchResults : events}
            renderItem={activeTab === 'venues' ? renderVenueItem : renderEventItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={renderEmptyState}
          />
        )}
      </View>

      {renderFilterModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchHeader: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  suggestionsContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  suggestionText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  recentContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  recentText: {
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  venueItem: {
    marginBottom: 12,
  },
  eventItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    marginBottom: 4,
  },
  eventVenue: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  loadingText: {
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalCancel: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalClear: {
    fontSize: 16,
  },
  filterContent: {
    flex: 1,
    padding: 16,
  },
  filterSection: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 64,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
  },
  applyButton: {
    width: '100%',
  },
});

export default SearchScreen;