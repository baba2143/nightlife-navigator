import AsyncStorage from '@react-native-async-storage/async-storage';

class VenueSearchService {
  constructor() {
    this.initialized = false;
    this.venues = new Map();
    this.searchHistory = [];
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
      { id: 'bar', name: 'バー', icon: '🍸' },
      { id: 'club', name: 'クラブ', icon: '🎵' },
      { id: 'lounge', name: 'ラウンジ', icon: '🛋️' },
      { id: 'restaurant', name: 'レストラン', icon: '🍽️' },
      { id: 'karaoke', name: 'カラオケ', icon: '🎤' },
      { id: 'pub', name: 'パブ', icon: '🍺' }
    ];
    this.priceRanges = [
      { id: 'budget', name: '¥', symbol: '¥', min: 0, max: 2000 },
      { id: 'moderate', name: '¥¥', symbol: '¥¥', min: 2001, max: 4000 },
      { id: 'expensive', name: '¥¥¥', symbol: '¥¥¥', min: 4001, max: 8000 },
      { id: 'luxury', name: '¥¥¥¥', symbol: '¥¥¥¥', min: 8001, max: 20000 }
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
      await this.loadVenues();
      await this.loadSearchHistory();
      await this.initializeDefaultVenues();
      
      this.initialized = true;
      console.log('VenueSearchService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize VenueSearchService:', error);
      throw error;
    }
  }

  async loadVenues() {
    try {
      const venues = await AsyncStorage.getItem('venues');
      const venueList = venues ? JSON.parse(venues) : [];

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
      const history = await AsyncStorage.getItem('search_history');
      this.searchHistory = history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Failed to load search history:', error);
      this.searchHistory = [];
    }
  }

  async initializeDefaultVenues() {
    try {
      if (this.venues.size === 0) {
        const defaultVenues = [
          {
            id: 'venue_1',
            name: '渋谷 VISION',
            category: 'club',
            address: '東京都渋谷区道玄坂2-10-12',
            coordinates: { lat: 35.6581, lng: 139.6986 },
            phone: '03-5784-0111',
            website: 'https://vision-tokyo.com',
            rating: 4.2,
            reviewCount: 256,
            priceRange: 'expensive',
            images: ['https://example.com/vision1.jpg'],
            description: '渋谷最大級のクラブ。国内外の有名DJが出演する人気スポット。',
            amenities: ['VIPエリア', 'ダンスフロア', 'フルバー', 'クローク'],
            openingHours: {
              monday: { closed: true },
              tuesday: { closed: true },
              wednesday: { closed: true },
              thursday: { open: '23:00', close: '05:00' },
              friday: { open: '23:00', close: '05:00' },
              saturday: { open: '23:00', close: '05:00' },
              sunday: { closed: true }
            },
            ageRestriction: '20_plus',
            dressCode: 'upscale',
            capacity: 1000,
            tags: ['クラブ', 'DJ', 'ダンス', '渋谷'],
            events: [],
            reviews: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'venue_2',
            name: '六本木 バーン',
            category: 'bar',
            address: '東京都港区六本木3-15-24',
            coordinates: { lat: 35.6627, lng: 139.7320 },
            phone: '03-3401-5755',
            website: 'https://burn-roppongi.com',
            rating: 4.5,
            reviewCount: 189,
            priceRange: 'luxury',
            images: ['https://example.com/burn1.jpg'],
            description: '六本木の老舗バー。洗練されたカクテルと大人の雰囲気が魅力。',
            amenities: ['プレミアムカクテル', '個室', 'テラス席', 'ソムリエ'],
            openingHours: {
              monday: { open: '18:00', close: '02:00' },
              tuesday: { open: '18:00', close: '02:00' },
              wednesday: { open: '18:00', close: '02:00' },
              thursday: { open: '18:00', close: '02:00' },
              friday: { open: '18:00', close: '02:00' },
              saturday: { open: '18:00', close: '02:00' },
              sunday: { open: '18:00', close: '24:00' }
            },
            ageRestriction: '20_plus',
            dressCode: 'business_casual',
            capacity: 80,
            tags: ['バー', 'カクテル', '六本木', '大人'],
            events: [],
            reviews: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'venue_3',
            name: '新宿 ラウンジ アジュール',
            category: 'lounge',
            address: '東京都新宿区歌舞伎町1-16-3',
            coordinates: { lat: 35.6938, lng: 139.7016 },
            phone: '03-3209-5777',
            website: 'https://azure-shinjuku.com',
            rating: 4.0,
            reviewCount: 142,
            priceRange: 'expensive',
            images: ['https://example.com/azure1.jpg'],
            description: '新宿歌舞伎町の落ち着いたラウンジ。夜景を楽しめる空間。',
            amenities: ['夜景', 'ソファ席', 'プライベート空間', 'シーシャ'],
            openingHours: {
              monday: { open: '19:00', close: '03:00' },
              tuesday: { open: '19:00', close: '03:00' },
              wednesday: { open: '19:00', close: '03:00' },
              thursday: { open: '19:00', close: '03:00' },
              friday: { open: '19:00', close: '05:00' },
              saturday: { open: '19:00', close: '05:00' },
              sunday: { open: '19:00', close: '02:00' }
            },
            ageRestriction: '20_plus',
            dressCode: 'casual',
            capacity: 120,
            tags: ['ラウンジ', 'シーシャ', '新宿', '夜景'],
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
        console.log('Default venues initialized');
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

      return searchResult;
    } catch (error) {
      console.error('Failed to search venues:', error);
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
        // Would need user location for proper distance sorting
        return sortedVenues;

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

      return suggestions.slice(0, 10);
    } catch (error) {
      console.error('Failed to get search suggestions:', error);
      return [];
    }
  }

  async getSearchHistory(userId = 'anonymous') {
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
    if (!todayHours || todayHours.closed) return false;
    
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
      await AsyncStorage.setItem('venues', JSON.stringify(venueList));
    } catch (error) {
      console.error('Failed to save venues:', error);
    }
  }

  async saveSearchHistory() {
    try {
      await AsyncStorage.setItem('search_history', JSON.stringify(this.searchHistory));
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  }

  getVenues() {
    return Array.from(this.venues.values());
  }

  getVenueById(venueId) {
    return this.venues.get(venueId);
  }

  getVenueCategories() {
    return this.venueCategories;
  }

  getPriceRanges() {
    return this.priceRanges;
  }

  async cleanup() {
    try {
      this.venues.clear();
      this.searchHistory = [];
      this.searchCache.clear();
      this.initialized = false;
    } catch (error) {
      console.error('Failed to cleanup VenueSearchService:', error);
    }
  }
}

export default VenueSearchService.getInstance();