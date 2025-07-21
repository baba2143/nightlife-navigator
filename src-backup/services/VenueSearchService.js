import { LocalStorageService } from './LocalStorageService';
import { AuditLogService } from './AuditLogService';

class VenueSearchService {
  constructor() {
    this.initialized = false;
    this.storageService = null;
    this.auditService = null;
    this.venues = new Map();
    this.searchHistory = [];
    this.searchFilters = new Map();
    this.searchPreferences = new Map();
    this.popularSearches = new Map();
    this.searchMetrics = {
      totalSearches: 0,
      uniqueSearches: 0,
      filterUsage: {},
      categorySearches: {},
      locationSearches: {},
      averageResponseTime: 0,
      searchErrors: 0
    };
    this.listeners = [];
    this.searchCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    this.maxSearchResults = 100;
    this.searchConfig = {
      enableFuzzySearch: true,
      enableAutoComplete: true,
      enableSearchSuggestions: true,
      enableLocationSearch: true,
      enableCategoryFiltering: true,
      enablePriceFiltering: true,
      enableRatingFiltering: true,
      enableDistanceFiltering: true,
      maxSearchHistory: 50
    };
    this.venueCategories = [
      { id: 'nightclub', name: 'Nightclub', icon: '🎉' },
      { id: 'bar', name: 'Bar', icon: '🍺' },
      { id: 'lounge', name: 'Lounge', icon: '🍸' },
      { id: 'restaurant', name: 'Restaurant', icon: '🍽️' },
      { id: 'pub', name: 'Pub', icon: '🍻' },
      { id: 'karaoke', name: 'Karaoke', icon: '🎤' },
      { id: 'casino', name: 'Casino', icon: '🎲' },
      { id: 'live_music', name: 'Live Music', icon: '🎵' },
      { id: 'rooftop', name: 'Rooftop', icon: '🌆' },
      { id: 'dance_club', name: 'Dance Club', icon: '💃' }
    ];
    this.priceRanges = [
      { id: 'budget', name: 'Budget', symbol: '$', min: 0, max: 25 },
      { id: 'moderate', name: 'Moderate', symbol: '$$', min: 26, max: 50 },
      { id: 'expensive', name: 'Expensive', symbol: '$$$', min: 51, max: 100 },
      { id: 'luxury', name: 'Luxury', symbol: '$$$$', min: 101, max: 999 }
    ];
  }

  static getInstance() {
    if (!VenueSearchService.instance) {
      VenueSearchService.instance = new VenueSearchService();
    }
    return VenueSearchService.instance;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      this.storageService = LocalStorageService.getInstance();
      this.auditService = AuditLogService.getInstance();
      
      await this.loadVenues();
      await this.loadSearchHistory();
      await this.loadSearchFilters();
      await this.loadSearchPreferences();
      await this.loadPopularSearches();
      await this.loadSearchMetrics();
      await this.loadSearchConfig();
      await this.initializeDefaultVenues();
      
      this.initialized = true;
      
      await this.auditService.logEvent('venue_search_service_initialized', {
        timestamp: new Date().toISOString(),
        venues: this.venues.size,
        categories: this.venueCategories.length,
        price_ranges: this.priceRanges.length
      });
      
      this.emit('serviceInitialized');
    } catch (error) {
      console.error('Failed to initialize VenueSearchService:', error);
      throw error;
    }
  }

  async loadVenues() {
    try {
      const venues = await this.storageService.getItem('venues');
      const venueList = venues || [];

      this.venues.clear();
      venueList.forEach(venue => {
        this.venues.set(venue.id, venue);
      });
    } catch (error) {
      console.error('Failed to load venues:', error);
      this.venues.clear();
    }
  }

  async loadSearchHistory() {
    try {
      const history = await this.storageService.getItem('search_history');
      this.searchHistory = history || [];
    } catch (error) {
      console.error('Failed to load search history:', error);
      this.searchHistory = [];
    }
  }

  async loadSearchFilters() {
    try {
      const filters = await this.storageService.getItem('search_filters');
      const filterList = filters || [
        {
          id: 'category_filter',
          name: 'Category',
          type: 'multi_select',
          options: this.venueCategories,
          enabled: true
        },
        {
          id: 'price_filter',
          name: 'Price Range',
          type: 'multi_select',
          options: this.priceRanges,
          enabled: true
        },
        {
          id: 'rating_filter',
          name: 'Rating',
          type: 'range',
          min: 0,
          max: 5,
          step: 0.5,
          enabled: true
        },
        {
          id: 'distance_filter',
          name: 'Distance',
          type: 'range',
          min: 0,
          max: 50,
          step: 1,
          unit: 'km',
          enabled: true
        },
        {
          id: 'open_now_filter',
          name: 'Open Now',
          type: 'boolean',
          enabled: true
        },
        {
          id: 'has_events_filter',
          name: 'Has Events',
          type: 'boolean',
          enabled: true
        },
        {
          id: 'age_restriction_filter',
          name: 'Age Restriction',
          type: 'select',
          options: [
            { id: 'all_ages', name: 'All Ages' },
            { id: '18_plus', name: '18+' },
            { id: '21_plus', name: '21+' }
          ],
          enabled: true
        }
      ];

      this.searchFilters.clear();
      filterList.forEach(filter => {
        this.searchFilters.set(filter.id, filter);
      });

      await this.storageService.setItem('search_filters', filterList);
    } catch (error) {
      console.error('Failed to load search filters:', error);
      this.searchFilters.clear();
    }
  }

  async loadSearchPreferences() {
    try {
      const preferences = await this.storageService.getItem('search_preferences');
      const prefList = preferences || [];

      this.searchPreferences.clear();
      prefList.forEach(pref => {
        this.searchPreferences.set(pref.userId, pref);
      });
    } catch (error) {
      console.error('Failed to load search preferences:', error);
      this.searchPreferences.clear();
    }
  }

  async loadPopularSearches() {
    try {
      const searches = await this.storageService.getItem('popular_searches');
      const searchList = searches || [];

      this.popularSearches.clear();
      searchList.forEach(search => {
        this.popularSearches.set(search.term, search);
      });
    } catch (error) {
      console.error('Failed to load popular searches:', error);
      this.popularSearches.clear();
    }
  }

  async loadSearchMetrics() {
    try {
      const metrics = await this.storageService.getItem('search_metrics');
      if (metrics) {
        this.searchMetrics = { ...this.searchMetrics, ...metrics };
      }
    } catch (error) {
      console.error('Failed to load search metrics:', error);
    }
  }

  async loadSearchConfig() {
    try {
      const config = await this.storageService.getItem('search_config');
      if (config) {
        this.searchConfig = { ...this.searchConfig, ...config };
      }
    } catch (error) {
      console.error('Failed to load search config:', error);
    }
  }

  async initializeDefaultVenues() {
    try {
      if (this.venues.size === 0) {
        const defaultVenues = [
          {
            id: 'venue_1',
            name: 'The Blue Moon',
            category: 'nightclub',
            address: '123 Main Street, Downtown',
            coordinates: { lat: 40.7128, lng: -74.0060 },
            phone: '+1-555-0123',
            website: 'https://bluemoon.com',
            rating: 4.5,
            priceRange: 'expensive',
            images: ['https://example.com/image1.jpg'],
            description: 'Premium nightclub with live DJ performances',
            amenities: ['VIP Area', 'Dance Floor', 'Full Bar', 'Coat Check'],
            openingHours: {
              monday: { open: '21:00', close: '03:00' },
              tuesday: { open: '21:00', close: '03:00' },
              wednesday: { open: '21:00', close: '03:00' },
              thursday: { open: '21:00', close: '03:00' },
              friday: { open: '21:00', close: '04:00' },
              saturday: { open: '21:00', close: '04:00' },
              sunday: { open: '21:00', close: '02:00' }
            },
            ageRestriction: '21_plus',
            dressCode: 'upscale',
            capacity: 500,
            tags: ['dancing', 'nightlife', 'premium', 'dj'],
            events: [],
            reviews: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'venue_2',
            name: 'Skyline Lounge',
            category: 'lounge',
            address: '456 High Street, Uptown',
            coordinates: { lat: 40.7589, lng: -73.9851 },
            phone: '+1-555-0456',
            website: 'https://skylinelounge.com',
            rating: 4.2,
            priceRange: 'luxury',
            images: ['https://example.com/image2.jpg'],
            description: 'Rooftop lounge with panoramic city views',
            amenities: ['Rooftop Terrace', 'Premium Cocktails', 'City View', 'Private Dining'],
            openingHours: {
              monday: { open: '18:00', close: '01:00' },
              tuesday: { open: '18:00', close: '01:00' },
              wednesday: { open: '18:00', close: '01:00' },
              thursday: { open: '18:00', close: '02:00' },
              friday: { open: '18:00', close: '02:00' },
              saturday: { open: '18:00', close: '02:00' },
              sunday: { open: '18:00', close: '01:00' }
            },
            ageRestriction: '21_plus',
            dressCode: 'business_casual',
            capacity: 200,
            tags: ['rooftop', 'cocktails', 'view', 'upscale'],
            events: [],
            reviews: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'venue_3',
            name: 'The Local Pub',
            category: 'pub',
            address: '789 Beer Street, Neighborhood',
            coordinates: { lat: 40.7306, lng: -73.9352 },
            phone: '+1-555-0789',
            website: 'https://localpub.com',
            rating: 4.0,
            priceRange: 'moderate',
            images: ['https://example.com/image3.jpg'],
            description: 'Traditional pub with craft beers and live music',
            amenities: ['Live Music', 'Craft Beer', 'Pool Table', 'Outdoor Seating'],
            openingHours: {
              monday: { open: '16:00', close: '24:00' },
              tuesday: { open: '16:00', close: '24:00' },
              wednesday: { open: '16:00', close: '01:00' },
              thursday: { open: '16:00', close: '01:00' },
              friday: { open: '16:00', close: '02:00' },
              saturday: { open: '14:00', close: '02:00' },
              sunday: { open: '14:00', close: '23:00' }
            },
            ageRestriction: '18_plus',
            dressCode: 'casual',
            capacity: 150,
            tags: ['pub', 'beer', 'live music', 'casual'],
            events: [],
            reviews: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];

        for (const venue of defaultVenues) {
          this.venues.set(venue.id, venue);
        }

        await this.saveVenues();
        
        await this.auditService.logEvent('default_venues_initialized', {
          venues_count: defaultVenues.length,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to initialize default venues:', error);
    }
  }

  async searchVenues(query = '', filters = {}, options = {}) {
    try {
      const startTime = Date.now();
      
      // Generate cache key
      const cacheKey = this.generateCacheKey(query, filters, options);
      
      // Check cache first
      if (this.searchCache.has(cacheKey)) {
        const cachedResult = this.searchCache.get(cacheKey);
        if (Date.now() - cachedResult.timestamp < this.cacheExpiry) {
          return cachedResult.results;
        } else {
          this.searchCache.delete(cacheKey);
        }
      }

      // Perform search
      let results = Array.from(this.venues.values());

      // Apply text search
      if (query && query.trim() !== '') {
        results = this.performTextSearch(results, query.trim());
      }

      // Apply filters
      if (Object.keys(filters).length > 0) {
        results = this.applyFilters(results, filters);
      }

      // Apply sorting
      const sortBy = options.sortBy || 'relevance';
      results = this.sortResults(results, sortBy, query);

      // Apply pagination
      const page = options.page || 1;
      const limit = options.limit || this.maxSearchResults;
      const startIndex = (page - 1) * limit;
      const paginatedResults = results.slice(startIndex, startIndex + limit);

      // Create search result object
      const searchResult = {
        results: paginatedResults,
        total: results.length,
        page: page,
        limit: limit,
        totalPages: Math.ceil(results.length / limit),
        query: query,
        filters: filters,
        sortBy: sortBy,
        searchTime: Date.now() - startTime
      };

      // Cache results
      this.searchCache.set(cacheKey, {
        results: searchResult,
        timestamp: Date.now()
      });

      // Update search history
      await this.updateSearchHistory(query, filters, options);

      // Update metrics
      await this.updateSearchMetrics(query, filters, searchResult);

      // Update popular searches
      await this.updatePopularSearches(query);

      await this.auditService.logEvent('venue_search_performed', {
        query: query,
        filters: Object.keys(filters),
        results_count: searchResult.results.length,
        search_time: searchResult.searchTime,
        timestamp: new Date().toISOString()
      });

      this.emit('searchPerformed', searchResult);
      return searchResult;
    } catch (error) {
      console.error('Failed to search venues:', error);
      this.searchMetrics.searchErrors++;
      await this.saveSearchMetrics();
      throw error;
    }
  }

  performTextSearch(venues, query) {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    
    return venues.filter(venue => {
      const searchableText = [
        venue.name,
        venue.description,
        venue.address,
        venue.category,
        ...venue.tags,
        ...venue.amenities
      ].join(' ').toLowerCase();

      if (this.searchConfig.enableFuzzySearch) {
        // Fuzzy search - match partial terms
        return searchTerms.some(term => 
          searchableText.includes(term) || 
          this.calculateSimilarity(term, searchableText) > 0.7
        );
      } else {
        // Exact match
        return searchTerms.every(term => searchableText.includes(term));
      }
    });
  }

  applyFilters(venues, filters) {
    return venues.filter(venue => {
      // Category filter
      if (filters.categories && filters.categories.length > 0) {
        if (!filters.categories.includes(venue.category)) {
          return false;
        }
      }

      // Price range filter
      if (filters.priceRanges && filters.priceRanges.length > 0) {
        if (!filters.priceRanges.includes(venue.priceRange)) {
          return false;
        }
      }

      // Rating filter
      if (filters.minRating !== undefined) {
        if (venue.rating < filters.minRating) {
          return false;
        }
      }

      // Distance filter
      if (filters.maxDistance !== undefined && filters.userLocation) {
        const distance = this.calculateDistance(
          filters.userLocation.lat,
          filters.userLocation.lng,
          venue.coordinates.lat,
          venue.coordinates.lng
        );
        if (distance > filters.maxDistance) {
          return false;
        }
      }

      // Open now filter
      if (filters.openNow === true) {
        if (!this.isVenueOpen(venue)) {
          return false;
        }
      }

      // Has events filter
      if (filters.hasEvents === true) {
        if (!venue.events || venue.events.length === 0) {
          return false;
        }
      }

      // Age restriction filter
      if (filters.ageRestriction) {
        if (venue.ageRestriction !== filters.ageRestriction) {
          return false;
        }
      }

      return true;
    });
  }

  sortResults(venues, sortBy, query = '') {
    const sortedVenues = [...venues];

    switch (sortBy) {
      case 'relevance':
        return sortedVenues.sort((a, b) => {
          const scoreA = this.calculateRelevanceScore(a, query);
          const scoreB = this.calculateRelevanceScore(b, query);
          return scoreB - scoreA;
        });

      case 'rating':
        return sortedVenues.sort((a, b) => b.rating - a.rating);

      case 'distance':
        return sortedVenues.sort((a, b) => {
          // Would need user location for proper distance sorting
          return 0;
        });

      case 'name':
        return sortedVenues.sort((a, b) => a.name.localeCompare(b.name));

      case 'price_low':
        return sortedVenues.sort((a, b) => {
          const priceA = this.getPriceNumericValue(a.priceRange);
          const priceB = this.getPriceNumericValue(b.priceRange);
          return priceA - priceB;
        });

      case 'price_high':
        return sortedVenues.sort((a, b) => {
          const priceA = this.getPriceNumericValue(a.priceRange);
          const priceB = this.getPriceNumericValue(b.priceRange);
          return priceB - priceA;
        });

      case 'newest':
        return sortedVenues.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      default:
        return sortedVenues;
    }
  }

  calculateRelevanceScore(venue, query) {
    if (!query) return venue.rating;

    let score = 0;
    const queryLower = query.toLowerCase();

    // Name match (highest weight)
    if (venue.name.toLowerCase().includes(queryLower)) {
      score += 100;
    }

    // Category match
    if (venue.category.toLowerCase().includes(queryLower)) {
      score += 50;
    }

    // Tags match
    venue.tags.forEach(tag => {
      if (tag.toLowerCase().includes(queryLower)) {
        score += 30;
      }
    });

    // Description match
    if (venue.description.toLowerCase().includes(queryLower)) {
      score += 20;
    }

    // Address match
    if (venue.address.toLowerCase().includes(queryLower)) {
      score += 10;
    }

    // Add rating as base score
    score += venue.rating * 10;

    return score;
  }

  async getSearchSuggestions(query) {
    try {
      if (!query || query.length < 2) {
        return [];
      }

      const suggestions = [];
      const queryLower = query.toLowerCase();

      // Venue name suggestions
      Array.from(this.venues.values()).forEach(venue => {
        if (venue.name.toLowerCase().includes(queryLower)) {
          suggestions.push({
            type: 'venue',
            text: venue.name,
            venue: venue
          });
        }
      });

      // Category suggestions
      this.venueCategories.forEach(category => {
        if (category.name.toLowerCase().includes(queryLower)) {
          suggestions.push({
            type: 'category',
            text: category.name,
            category: category
          });
        }
      });

      // Popular search suggestions
      Array.from(this.popularSearches.values()).forEach(search => {
        if (search.term.toLowerCase().includes(queryLower)) {
          suggestions.push({
            type: 'popular',
            text: search.term,
            count: search.count
          });
        }
      });

      return suggestions.slice(0, 10);
    } catch (error) {
      console.error('Failed to get search suggestions:', error);
      return [];
    }
  }

  async getSearchHistory(userId) {
    try {
      return this.searchHistory
        .filter(search => search.userId === userId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, this.searchConfig.maxSearchHistory);
    } catch (error) {
      console.error('Failed to get search history:', error);
      return [];
    }
  }

  async clearSearchHistory(userId) {
    try {
      this.searchHistory = this.searchHistory.filter(search => search.userId !== userId);
      await this.saveSearchHistory();

      await this.auditService.logEvent('search_history_cleared', {
        user_id: userId,
        timestamp: new Date().toISOString()
      });

      this.emit('searchHistoryCleared', { userId });
    } catch (error) {
      console.error('Failed to clear search history:', error);
      throw error;
    }
  }

  async updateSearchHistory(query, filters, options) {
    try {
      const userId = options.userId || 'anonymous';
      
      const searchEntry = {
        id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: userId,
        query: query,
        filters: filters,
        timestamp: new Date().toISOString()
      };

      this.searchHistory.unshift(searchEntry);
      
      // Keep only recent searches
      this.searchHistory = this.searchHistory.slice(0, this.searchConfig.maxSearchHistory * 2);
      
      await this.saveSearchHistory();
    } catch (error) {
      console.error('Failed to update search history:', error);
    }
  }

  async updateSearchMetrics(query, filters, searchResult) {
    try {
      this.searchMetrics.totalSearches++;
      
      if (query && query.trim() !== '') {
        this.searchMetrics.uniqueSearches++;
      }

      // Update filter usage
      Object.keys(filters).forEach(filterKey => {
        if (!this.searchMetrics.filterUsage[filterKey]) {
          this.searchMetrics.filterUsage[filterKey] = 0;
        }
        this.searchMetrics.filterUsage[filterKey]++;
      });

      // Update category searches
      if (filters.categories) {
        filters.categories.forEach(category => {
          if (!this.searchMetrics.categorySearches[category]) {
            this.searchMetrics.categorySearches[category] = 0;
          }
          this.searchMetrics.categorySearches[category]++;
        });
      }

      // Update average response time
      const currentAvg = this.searchMetrics.averageResponseTime;
      const newAvg = (currentAvg * (this.searchMetrics.totalSearches - 1) + searchResult.searchTime) / this.searchMetrics.totalSearches;
      this.searchMetrics.averageResponseTime = newAvg;

      await this.saveSearchMetrics();
    } catch (error) {
      console.error('Failed to update search metrics:', error);
    }
  }

  async updatePopularSearches(query) {
    try {
      if (!query || query.trim() === '') return;

      const term = query.trim().toLowerCase();
      
      if (this.popularSearches.has(term)) {
        const search = this.popularSearches.get(term);
        search.count++;
        search.lastSearched = new Date().toISOString();
      } else {
        this.popularSearches.set(term, {
          term: term,
          count: 1,
          firstSearched: new Date().toISOString(),
          lastSearched: new Date().toISOString()
        });
      }

      await this.savePopularSearches();
    } catch (error) {
      console.error('Failed to update popular searches:', error);
    }
  }

  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.calculateEditDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  calculateEditDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  isVenueOpen(venue) {
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
    const currentTime = now.toTimeString().slice(0, 5);
    
    const todayHours = venue.openingHours[currentDay];
    if (!todayHours) return false;
    
    return currentTime >= todayHours.open && currentTime <= todayHours.close;
  }

  getPriceNumericValue(priceRange) {
    const priceMap = {
      'budget': 1,
      'moderate': 2,
      'expensive': 3,
      'luxury': 4
    };
    return priceMap[priceRange] || 0;
  }

  generateCacheKey(query, filters, options) {
    return `${query}_${JSON.stringify(filters)}_${JSON.stringify(options)}`;
  }

  async saveVenues() {
    try {
      const venueList = Array.from(this.venues.values());
      await this.storageService.setItem('venues', venueList);
    } catch (error) {
      console.error('Failed to save venues:', error);
    }
  }

  async saveSearchHistory() {
    try {
      await this.storageService.setItem('search_history', this.searchHistory);
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  }

  async savePopularSearches() {
    try {
      const searchList = Array.from(this.popularSearches.values());
      await this.storageService.setItem('popular_searches', searchList);
    } catch (error) {
      console.error('Failed to save popular searches:', error);
    }
  }

  async saveSearchMetrics() {
    try {
      await this.storageService.setItem('search_metrics', this.searchMetrics);
    } catch (error) {
      console.error('Failed to save search metrics:', error);
    }
  }

  getVenues() {
    return Array.from(this.venues.values());
  }

  getVenueById(venueId) {
    return this.venues.get(venueId);
  }

  getSearchFilters() {
    return Array.from(this.searchFilters.values());
  }

  getVenueCategories() {
    return this.venueCategories;
  }

  getPriceRanges() {
    return this.priceRanges;
  }

  getSearchMetrics() {
    return this.searchMetrics;
  }

  getPopularSearches() {
    return Array.from(this.popularSearches.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  addEventListener(eventType, callback) {
    this.listeners.push({ eventType, callback });
  }

  removeEventListener(eventType, callback) {
    this.listeners = this.listeners.filter(
      listener => listener.eventType !== eventType || listener.callback !== callback
    );
  }

  emit(eventType, data) {
    this.listeners
      .filter(listener => listener.eventType === eventType)
      .forEach(listener => listener.callback(data));
  }

  async cleanup() {
    try {
      this.listeners = [];
      this.venues.clear();
      this.searchHistory = [];
      this.searchFilters.clear();
      this.searchPreferences.clear();
      this.popularSearches.clear();
      this.searchCache.clear();
      this.initialized = false;
      
      await this.auditService.logEvent('venue_search_service_cleanup', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to cleanup VenueSearchService:', error);
    }
  }
}

export { VenueSearchService };