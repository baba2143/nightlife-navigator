import AsyncStorage from '@react-native-async-storage/async-storage';

class FavoritesService {
  constructor() {
    this.initialized = false;
    this.favorites = new Map();
    this.listeners = [];
    this.storageKey = '@nightlife_navigator:favorites';
  }

  static getInstance() {
    if (!FavoritesService.instance) {
      FavoritesService.instance = new FavoritesService();
    }
    return FavoritesService.instance;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      await this.loadFavorites();
      this.initialized = true;
      console.log('FavoritesService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize FavoritesService:', error);
      throw error;
    }
  }

  async loadFavorites() {
    try {
      const favorites = await AsyncStorage.getItem(this.storageKey);
      const favoritesList = favorites ? JSON.parse(favorites) : [];

      this.favorites.clear();
      favoritesList.forEach(favorite => {
        this.favorites.set(favorite.id, {
          ...favorite,
          favoriteDate: new Date(favorite.favoriteDate),
        });
      });

      console.log(`Loaded ${this.favorites.size} favorites`);
    } catch (error) {
      console.error('Failed to load favorites:', error);
      this.favorites.clear();
    }
  }

  async saveFavorites() {
    try {
      const favoritesList = Array.from(this.favorites.values()).map(favorite => ({
        ...favorite,
        favoriteDate: favorite.favoriteDate.toISOString(),
      }));
      
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(favoritesList));
    } catch (error) {
      console.error('Failed to save favorites:', error);
    }
  }

  async addFavorite(venue) {
    try {
      if (!venue || !venue.id) {
        throw new Error('Invalid venue data');
      }

      const favoriteItem = {
        id: venue.id,
        name: venue.name,
        category: venue.category,
        rating: venue.rating,
        reviewCount: venue.reviewCount || 0,
        priceRange: venue.priceRange,
        distance: venue.distance,
        description: venue.description,
        address: venue.address,
        phone: venue.phone,
        website: venue.website,
        coordinates: venue.coordinates,
        favoriteDate: new Date(),
        tags: venue.tags || [],
        images: venue.images || [],
      };

      this.favorites.set(venue.id, favoriteItem);
      await this.saveFavorites();

      this.emit('favoriteAdded', { venue: favoriteItem });
      this.emit('favoritesChanged', { 
        action: 'added', 
        venue: favoriteItem,
        totalCount: this.favorites.size 
      });

      return true;
    } catch (error) {
      console.error('Failed to add favorite:', error);
      return false;
    }
  }

  async removeFavorite(venueId) {
    try {
      if (!venueId) {
        throw new Error('Venue ID is required');
      }

      const removedVenue = this.favorites.get(venueId);
      if (!removedVenue) {
        return false; // Already not in favorites
      }

      this.favorites.delete(venueId);
      await this.saveFavorites();

      this.emit('favoriteRemoved', { venue: removedVenue });
      this.emit('favoritesChanged', { 
        action: 'removed', 
        venue: removedVenue,
        totalCount: this.favorites.size 
      });

      return true;
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      return false;
    }
  }

  async toggleFavorite(venue) {
    try {
      if (!venue || !venue.id) {
        throw new Error('Invalid venue data');
      }

      const isFavorite = this.isFavorite(venue.id);
      
      if (isFavorite) {
        await this.removeFavorite(venue.id);
        return { success: true, isFavorite: false, action: 'removed' };
      } else {
        await this.addFavorite(venue);
        return { success: true, isFavorite: true, action: 'added' };
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      return { success: false, error: error.message };
    }
  }

  isFavorite(venueId) {
    return this.favorites.has(venueId);
  }

  getFavorites() {
    return Array.from(this.favorites.values());
  }

  getFavoriteById(venueId) {
    return this.favorites.get(venueId);
  }

  async searchFavorites(query = '') {
    try {
      const favorites = this.getFavorites();
      
      if (!query || query.trim() === '') {
        return favorites;
      }

      const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
      
      return favorites.filter(favorite => {
        const searchableText = [
          favorite.name,
          favorite.description,
          favorite.address,
          favorite.category,
          ...favorite.tags,
        ].join(' ').toLowerCase();

        return searchTerms.some(term => searchableText.includes(term));
      });
    } catch (error) {
      console.error('Failed to search favorites:', error);
      return [];
    }
  }

  getFavoritesByCategory(category) {
    const favorites = this.getFavorites();
    if (!category) return favorites;
    
    return favorites.filter(favorite => favorite.category === category);
  }

  getFavoritesSortedBy(sortBy = 'favoriteDate') {
    const favorites = this.getFavorites();
    
    switch (sortBy) {
      case 'favoriteDate':
        return favorites.sort((a, b) => b.favoriteDate - a.favoriteDate);
      
      case 'name':
        return favorites.sort((a, b) => a.name.localeCompare(b.name));
      
      case 'rating':
        return favorites.sort((a, b) => b.rating - a.rating);
      
      case 'distance':
        return favorites.sort((a, b) => a.distance - b.distance);
      
      case 'category':
        return favorites.sort((a, b) => a.category.localeCompare(b.category));
      
      default:
        return favorites;
    }
  }

  getFavoriteStats() {
    const favorites = this.getFavorites();
    const totalCount = favorites.length;
    
    if (totalCount === 0) {
      return {
        totalCount: 0,
        averageRating: 0,
        categoryBreakdown: {},
        priceRangeBreakdown: {},
        mostFavoritedCategory: null,
        mostFavoritedPriceRange: null,
        oldestFavorite: null,
        newestFavorite: null,
      };
    }

    // 平均評価
    const averageRating = favorites.reduce((sum, fav) => sum + (fav.rating || 0), 0) / totalCount;

    // カテゴリ別集計
    const categoryBreakdown = favorites.reduce((acc, fav) => {
      acc[fav.category] = (acc[fav.category] || 0) + 1;
      return acc;
    }, {});

    // 価格帯別集計
    const priceRangeBreakdown = favorites.reduce((acc, fav) => {
      acc[fav.priceRange] = (acc[fav.priceRange] || 0) + 1;
      return acc;
    }, {});

    // 最多カテゴリ
    const mostFavoritedCategory = Object.entries(categoryBreakdown)
      .reduce((a, b) => a[1] > b[1] ? a : b)[0];

    // 最多価格帯
    const mostFavoritedPriceRange = Object.entries(priceRangeBreakdown)
      .reduce((a, b) => a[1] > b[1] ? a : b)[0];

    // 最古・最新のお気に入り
    const sortedByDate = favorites.sort((a, b) => a.favoriteDate - b.favoriteDate);
    const oldestFavorite = sortedByDate[0];
    const newestFavorite = sortedByDate[sortedByDate.length - 1];

    return {
      totalCount,
      averageRating: parseFloat(averageRating.toFixed(1)),
      categoryBreakdown,
      priceRangeBreakdown,
      mostFavoritedCategory,
      mostFavoritedPriceRange,
      oldestFavorite,
      newestFavorite,
    };
  }

  async clearAllFavorites() {
    try {
      const count = this.favorites.size;
      this.favorites.clear();
      await this.saveFavorites();
      
      this.emit('favoritesCleared', { count });
      this.emit('favoritesChanged', { 
        action: 'cleared', 
        totalCount: 0 
      });

      return true;
    } catch (error) {
      console.error('Failed to clear favorites:', error);
      return false;
    }
  }

  async exportFavorites() {
    try {
      const favorites = this.getFavorites();
      const exportData = {
        exportDate: new Date().toISOString(),
        totalCount: favorites.length,
        favorites: favorites.map(favorite => ({
          ...favorite,
          favoriteDate: favorite.favoriteDate.toISOString(),
        })),
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export favorites:', error);
      return null;
    }
  }

  async importFavorites(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      
      if (!data.favorites || !Array.isArray(data.favorites)) {
        throw new Error('Invalid import data format');
      }

      let importedCount = 0;
      
      for (const favorite of data.favorites) {
        if (favorite.id && !this.favorites.has(favorite.id)) {
          this.favorites.set(favorite.id, {
            ...favorite,
            favoriteDate: new Date(favorite.favoriteDate),
          });
          importedCount++;
        }
      }

      await this.saveFavorites();
      
      this.emit('favoritesImported', { 
        importedCount, 
        totalCount: this.favorites.size 
      });

      return { success: true, importedCount };
    } catch (error) {
      console.error('Failed to import favorites:', error);
      return { success: false, error: error.message };
    }
  }

  // イベントリスナー管理
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
      .forEach(listener => {
        try {
          listener.callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error);
        }
      });
  }

  async cleanup() {
    try {
      this.listeners = [];
      this.favorites.clear();
      this.initialized = false;
      console.log('FavoritesService cleaned up');
    } catch (error) {
      console.error('Failed to cleanup FavoritesService:', error);
    }
  }
}

export default FavoritesService.getInstance();