import { LocalStorageService } from './LocalStorageService';
import { AuditLogService } from './AuditLogService';

class MapNavigationService {
  constructor() {
    this.initialized = false;
    this.storageService = null;
    this.auditService = null;
    this.userLocation = null;
    this.watchId = null;
    this.venues = new Map();
    this.routes = new Map();
    this.savedLocations = new Map();
    this.locationHistory = [];
    this.navigationSessions = new Map();
    this.nearbyVenues = [];
    this.geofences = new Map();
    this.mapSettings = new Map();
    this.locationMetrics = {
      totalLocationRequests: 0,
      successfulLocationRequests: 0,
      navigationSessions: 0,
      averageAccuracy: 0,
      totalDistance: 0,
      averageNavigationTime: 0,
      popularDestinations: {},
      geofenceEvents: 0
    };
    this.listeners = [];
    this.mapConfig = {
      enableLocationServices: true,
      enableBackgroundLocation: false,
      enableHighAccuracy: true,
      locationTimeout: 10000,
      maximumAge: 60000,
      distanceFilter: 10, // meters
      enableGeofencing: true,
      maxGeofences: 20,
      nearbyRadius: 5000, // meters
      enableOfflineMap: true,
      enableTrafficData: true,
      enablePublicTransport: true,
      defaultZoomLevel: 15,
      enableStreetView: true,
      mapStyle: 'standard' // standard, satellite, hybrid, terrain
    };
    this.transportModes = [
      { id: 'walking', name: 'Walking', icon: '🚶', speed: 5 }, // km/h
      { id: 'driving', name: 'Driving', icon: '🚗', speed: 50 },
      { id: 'transit', name: 'Public Transit', icon: '🚌', speed: 25 },
      { id: 'rideshare', name: 'Rideshare', icon: '🚕', speed: 40 },
      { id: 'cycling', name: 'Cycling', icon: '🚴', speed: 15 }
    ];
    this.locationTypes = [
      { id: 'home', name: 'Home', icon: '🏠' },
      { id: 'work', name: 'Work', icon: '🏢' },
      { id: 'favorite', name: 'Favorite', icon: '⭐' },
      { id: 'recent', name: 'Recent', icon: '🕒' },
      { id: 'venue', name: 'Venue', icon: '🎪' },
      { id: 'event', name: 'Event', icon: '🎉' }
    ];
    this.navigationStatuses = [
      { id: 'planning', name: 'Planning Route' },
      { id: 'navigating', name: 'Navigating' },
      { id: 'arrived', name: 'Arrived' },
      { id: 'cancelled', name: 'Cancelled' },
      { id: 'rerouting', name: 'Rerouting' }
    ];
  }

  static getInstance() {
    if (!MapNavigationService.instance) {
      MapNavigationService.instance = new MapNavigationService();
    }
    return MapNavigationService.instance;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      this.storageService = LocalStorageService.getInstance();
      this.auditService = AuditLogService.getInstance();
      
      await this.loadVenues();
      await this.loadRoutes();
      await this.loadSavedLocations();
      await this.loadLocationHistory();
      await this.loadNavigationSessions();
      await this.loadGeofences();
      await this.loadMapSettings();
      await this.loadLocationMetrics();
      await this.loadMapConfig();
      
      // Initialize location services if enabled
      if (this.mapConfig.enableLocationServices) {
        await this.initializeLocationServices();
      }
      
      this.initialized = true;
      
      await this.auditService.logEvent('map_navigation_service_initialized', {
        timestamp: new Date().toISOString(),
        location_services_enabled: this.mapConfig.enableLocationServices,
        venues: this.venues.size,
        saved_locations: this.savedLocations.size,
        geofences: this.geofences.size
      });
      
      this.emit('serviceInitialized');
    } catch (error) {
      console.error('Failed to initialize MapNavigationService:', error);
      throw error;
    }
  }

  async loadVenues() {
    try {
      const venues = await this.storageService.getItem('map_venues');
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

  async loadRoutes() {
    try {
      const routes = await this.storageService.getItem('navigation_routes');
      const routeList = routes || [];

      this.routes.clear();
      routeList.forEach(route => {
        this.routes.set(route.id, route);
      });
    } catch (error) {
      console.error('Failed to load routes:', error);
      this.routes.clear();
    }
  }

  async loadSavedLocations() {
    try {
      const locations = await this.storageService.getItem('saved_locations');
      const locationList = locations || [];

      this.savedLocations.clear();
      locationList.forEach(location => {
        this.savedLocations.set(location.id, location);
      });
    } catch (error) {
      console.error('Failed to load saved locations:', error);
      this.savedLocations.clear();
    }
  }

  async loadLocationHistory() {
    try {
      const history = await this.storageService.getItem('location_history');
      this.locationHistory = history || [];
    } catch (error) {
      console.error('Failed to load location history:', error);
      this.locationHistory = [];
    }
  }

  async loadNavigationSessions() {
    try {
      const sessions = await this.storageService.getItem('navigation_sessions');
      const sessionList = sessions || [];

      this.navigationSessions.clear();
      sessionList.forEach(session => {
        this.navigationSessions.set(session.id, session);
      });
    } catch (error) {
      console.error('Failed to load navigation sessions:', error);
      this.navigationSessions.clear();
    }
  }

  async loadGeofences() {
    try {
      const geofences = await this.storageService.getItem('geofences');
      const geofenceList = geofences || [];

      this.geofences.clear();
      geofenceList.forEach(geofence => {
        this.geofences.set(geofence.id, geofence);
      });
    } catch (error) {
      console.error('Failed to load geofences:', error);
      this.geofences.clear();
    }
  }

  async loadMapSettings() {
    try {
      const settings = await this.storageService.getItem('map_settings');
      const settingsList = settings || [];

      this.mapSettings.clear();
      settingsList.forEach(setting => {
        this.mapSettings.set(setting.userId, setting);
      });
    } catch (error) {
      console.error('Failed to load map settings:', error);
      this.mapSettings.clear();
    }
  }

  async loadLocationMetrics() {
    try {
      const metrics = await this.storageService.getItem('location_metrics');
      if (metrics) {
        this.locationMetrics = { ...this.locationMetrics, ...metrics };
      }
    } catch (error) {
      console.error('Failed to load location metrics:', error);
    }
  }

  async loadMapConfig() {
    try {
      const config = await this.storageService.getItem('map_config');
      if (config) {
        this.mapConfig = { ...this.mapConfig, ...config };
      }
    } catch (error) {
      console.error('Failed to load map config:', error);
    }
  }

  async initializeLocationServices() {
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }

      // Request initial position
      await this.getCurrentLocation();

      // Start watching position if background location is enabled
      if (this.mapConfig.enableBackgroundLocation) {
        await this.startLocationTracking();
      }

      await this.auditService.logEvent('location_services_initialized', {
        background_tracking: this.mapConfig.enableBackgroundLocation,
        high_accuracy: this.mapConfig.enableHighAccuracy,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to initialize location services:', error);
      throw error;
    }
  }

  async getCurrentLocation(options = {}) {
    try {
      this.locationMetrics.totalLocationRequests++;

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: options.enableHighAccuracy ?? this.mapConfig.enableHighAccuracy,
            timeout: options.timeout ?? this.mapConfig.locationTimeout,
            maximumAge: options.maximumAge ?? this.mapConfig.maximumAge
          }
        );
      });

      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: new Date(position.timestamp).toISOString()
      };

      this.userLocation = location;
      this.locationMetrics.successfulLocationRequests++;
      
      // Update average accuracy
      const successfulRequests = this.locationMetrics.successfulLocationRequests;
      this.locationMetrics.averageAccuracy = 
        (this.locationMetrics.averageAccuracy * (successfulRequests - 1) + location.accuracy) / successfulRequests;

      // Add to location history
      await this.addLocationToHistory(location);

      // Check geofences
      await this.checkGeofences(location);

      // Update nearby venues
      await this.updateNearbyVenues(location);

      await this.saveLocationMetrics();

      await this.auditService.logEvent('location_obtained', {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        timestamp: location.timestamp
      });

      this.emit('locationUpdated', location);
      return location;
    } catch (error) {
      console.error('Failed to get current location:', error);
      this.emit('locationError', error);
      throw error;
    }
  }

  async startLocationTracking() {
    try {
      if (this.watchId) {
        this.stopLocationTracking();
      }

      this.watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: new Date(position.timestamp).toISOString()
          };

          // Check if location has changed significantly
          if (this.userLocation && 
              this.calculateDistance(this.userLocation, location) < this.mapConfig.distanceFilter) {
            return;
          }

          this.userLocation = location;
          await this.addLocationToHistory(location);
          await this.checkGeofences(location);
          await this.updateNearbyVenues(location);

          this.emit('locationUpdated', location);
        },
        (error) => {
          console.error('Location tracking error:', error);
          this.emit('locationError', error);
        },
        {
          enableHighAccuracy: this.mapConfig.enableHighAccuracy,
          timeout: this.mapConfig.locationTimeout,
          maximumAge: this.mapConfig.maximumAge
        }
      );

      await this.auditService.logEvent('location_tracking_started', {
        watch_id: this.watchId,
        high_accuracy: this.mapConfig.enableHighAccuracy,
        timestamp: new Date().toISOString()
      });

      this.emit('locationTrackingStarted');
    } catch (error) {
      console.error('Failed to start location tracking:', error);
      throw error;
    }
  }

  async stopLocationTracking() {
    try {
      if (this.watchId) {
        navigator.geolocation.clearWatch(this.watchId);
        this.watchId = null;

        await this.auditService.logEvent('location_tracking_stopped', {
          timestamp: new Date().toISOString()
        });

        this.emit('locationTrackingStopped');
      }
    } catch (error) {
      console.error('Failed to stop location tracking:', error);
    }
  }

  async planRoute(origin, destination, options = {}) {
    try {
      const routeId = `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const route = {
        id: routeId,
        origin: origin,
        destination: destination,
        transportMode: options.transportMode || 'driving',
        avoidTolls: options.avoidTolls || false,
        avoidHighways: options.avoidHighways || false,
        optimizeRoute: options.optimizeRoute || false,
        waypoints: options.waypoints || [],
        alternatives: options.alternatives || false,
        departureTime: options.departureTime || new Date().toISOString(),
        status: 'planning',
        createdAt: new Date().toISOString()
      };

      // Calculate basic route information
      const routeInfo = await this.calculateRoute(route);
      route.distance = routeInfo.distance;
      route.duration = routeInfo.duration;
      route.steps = routeInfo.steps;
      route.polyline = routeInfo.polyline;
      route.bounds = routeInfo.bounds;

      this.routes.set(routeId, route);
      await this.saveRoutes();

      await this.auditService.logEvent('route_planned', {
        route_id: routeId,
        origin: origin,
        destination: destination,
        transport_mode: route.transportMode,
        distance: route.distance,
        duration: route.duration,
        waypoints_count: route.waypoints.length,
        timestamp: new Date().toISOString()
      });

      this.emit('routePlanned', route);
      return route;
    } catch (error) {
      console.error('Failed to plan route:', error);
      throw error;
    }
  }

  async startNavigation(routeId, userId) {
    try {
      const route = this.routes.get(routeId);
      if (!route) {
        throw new Error('Route not found');
      }

      const session = {
        id: `navigation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        routeId: routeId,
        userId: userId,
        status: 'navigating',
        startTime: new Date().toISOString(),
        endTime: null,
        currentStep: 0,
        totalSteps: route.steps.length,
        distanceRemaining: route.distance,
        timeRemaining: route.duration,
        distanceTraveled: 0,
        timeTraveled: 0,
        reroutes: 0,
        speedAlerts: 0,
        trafficAlerts: [],
        currentLocation: this.userLocation,
        lastLocationUpdate: new Date().toISOString(),
        isOffTrack: false,
        offTrackDistance: 0
      };

      this.navigationSessions.set(session.id, session);
      await this.saveNavigationSessions();

      // Update metrics
      this.locationMetrics.navigationSessions++;
      await this.saveLocationMetrics();

      // Start real-time location tracking for navigation
      if (!this.watchId) {
        await this.startLocationTracking();
      }

      await this.auditService.logEvent('navigation_started', {
        session_id: session.id,
        route_id: routeId,
        user_id: userId,
        origin: route.origin,
        destination: route.destination,
        transport_mode: route.transportMode,
        total_distance: route.distance,
        estimated_duration: route.duration,
        timestamp: new Date().toISOString()
      });

      this.emit('navigationStarted', session);
      return session;
    } catch (error) {
      console.error('Failed to start navigation:', error);
      throw error;
    }
  }

  async updateNavigationSession(sessionId, currentLocation) {
    try {
      const session = this.navigationSessions.get(sessionId);
      if (!session || session.status !== 'navigating') {
        return;
      }

      const route = this.routes.get(session.routeId);
      if (!route) {
        throw new Error('Route not found');
      }

      const previousLocation = session.currentLocation;
      session.currentLocation = currentLocation;
      session.lastLocationUpdate = new Date().toISOString();

      // Calculate distance traveled since last update
      if (previousLocation) {
        const distanceIncrement = this.calculateDistance(previousLocation, currentLocation);
        session.distanceTraveled += distanceIncrement;
        this.locationMetrics.totalDistance += distanceIncrement;
      }

      // Calculate time traveled
      const startTime = new Date(session.startTime);
      const currentTime = new Date();
      session.timeTraveled = Math.floor((currentTime - startTime) / 1000); // seconds

      // Update remaining distance and time
      session.distanceRemaining = Math.max(0, route.distance - session.distanceTraveled);
      
      // Estimate remaining time based on current progress
      if (session.timeTraveled > 0 && session.distanceTraveled > 0) {
        const averageSpeed = session.distanceTraveled / (session.timeTraveled / 3600); // km/h
        session.timeRemaining = Math.floor(session.distanceRemaining / averageSpeed * 3600); // seconds
      }

      // Check if user is off track
      const nearestPoint = this.findNearestPointOnRoute(currentLocation, route);
      const distanceFromRoute = this.calculateDistance(currentLocation, nearestPoint);
      
      if (distanceFromRoute > 100) { // 100 meters threshold
        session.isOffTrack = true;
        session.offTrackDistance = distanceFromRoute;
        
        // Trigger rerouting if off track for too long
        if (session.offTrackDistance > 500) { // 500 meters threshold
          await this.triggerRerouting(session);
        }
      } else {
        session.isOffTrack = false;
        session.offTrackDistance = 0;
      }

      // Update current step
      session.currentStep = this.getCurrentStep(currentLocation, route);

      // Check if arrived at destination
      const distanceToDestination = this.calculateDistance(currentLocation, route.destination);
      if (distanceToDestination < 50) { // 50 meters threshold
        await this.completeNavigation(sessionId);
        return;
      }

      this.navigationSessions.set(sessionId, session);
      await this.saveNavigationSessions();

      this.emit('navigationUpdated', session);
    } catch (error) {
      console.error('Failed to update navigation session:', error);
    }
  }

  async completeNavigation(sessionId) {
    try {
      const session = this.navigationSessions.get(sessionId);
      if (!session) {
        throw new Error('Navigation session not found');
      }

      session.status = 'arrived';
      session.endTime = new Date().toISOString();

      // Calculate final metrics
      const startTime = new Date(session.startTime);
      const endTime = new Date(session.endTime);
      const totalTime = Math.floor((endTime - startTime) / 1000); // seconds
      
      session.timeTraveled = totalTime;

      // Update global metrics
      const totalSessions = this.locationMetrics.navigationSessions;
      this.locationMetrics.averageNavigationTime = 
        (this.locationMetrics.averageNavigationTime * (totalSessions - 1) + totalTime) / totalSessions;

      // Update popular destinations
      const route = this.routes.get(session.routeId);
      if (route) {
        const destKey = `${route.destination.latitude},${route.destination.longitude}`;
        this.locationMetrics.popularDestinations[destKey] = 
          (this.locationMetrics.popularDestinations[destKey] || 0) + 1;
      }

      await this.saveLocationMetrics();
      this.navigationSessions.set(sessionId, session);
      await this.saveNavigationSessions();

      await this.auditService.logEvent('navigation_completed', {
        session_id: sessionId,
        route_id: session.routeId,
        user_id: session.userId,
        total_distance: session.distanceTraveled,
        total_time: session.timeTraveled,
        reroutes: session.reroutes,
        timestamp: session.endTime
      });

      this.emit('navigationCompleted', session);
      return session;
    } catch (error) {
      console.error('Failed to complete navigation:', error);
      throw error;
    }
  }

  async cancelNavigation(sessionId) {
    try {
      const session = this.navigationSessions.get(sessionId);
      if (!session) {
        throw new Error('Navigation session not found');
      }

      session.status = 'cancelled';
      session.endTime = new Date().toISOString();

      this.navigationSessions.set(sessionId, session);
      await this.saveNavigationSessions();

      await this.auditService.logEvent('navigation_cancelled', {
        session_id: sessionId,
        route_id: session.routeId,
        user_id: session.userId,
        distance_traveled: session.distanceTraveled,
        time_traveled: session.timeTraveled,
        timestamp: session.endTime
      });

      this.emit('navigationCancelled', session);
      return session;
    } catch (error) {
      console.error('Failed to cancel navigation:', error);
      throw error;
    }
  }

  async saveLocation(userId, locationData) {
    try {
      // Validate location data
      const validation = this.validateLocationData(locationData);
      if (!validation.isValid) {
        throw new Error(`Invalid location data: ${validation.errors.join(', ')}`);
      }

      const savedLocation = {
        id: `location_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: userId,
        name: locationData.name,
        type: locationData.type || 'favorite',
        address: locationData.address,
        coordinates: {
          latitude: locationData.latitude,
          longitude: locationData.longitude
        },
        notes: locationData.notes || '',
        tags: locationData.tags || [],
        isPrivate: locationData.isPrivate || false,
        visitCount: 0,
        lastVisited: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.savedLocations.set(savedLocation.id, savedLocation);
      await this.saveSavedLocations();

      await this.auditService.logEvent('location_saved', {
        location_id: savedLocation.id,
        user_id: userId,
        name: savedLocation.name,
        type: savedLocation.type,
        latitude: savedLocation.coordinates.latitude,
        longitude: savedLocation.coordinates.longitude,
        timestamp: new Date().toISOString()
      });

      this.emit('locationSaved', savedLocation);
      return savedLocation;
    } catch (error) {
      console.error('Failed to save location:', error);
      throw error;
    }
  }

  async createGeofence(userId, geofenceData) {
    try {
      // Check geofence limit
      const userGeofences = Array.from(this.geofences.values())
        .filter(g => g.userId === userId && g.isActive);
      
      if (userGeofences.length >= this.mapConfig.maxGeofences) {
        throw new Error(`Maximum ${this.mapConfig.maxGeofences} geofences allowed per user`);
      }

      const geofence = {
        id: `geofence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: userId,
        name: geofenceData.name,
        description: geofenceData.description || '',
        center: {
          latitude: geofenceData.latitude,
          longitude: geofenceData.longitude
        },
        radius: geofenceData.radius, // meters
        triggers: geofenceData.triggers || ['enter', 'exit'], // enter, exit, dwell
        dwellTime: geofenceData.dwellTime || 300, // seconds for dwell trigger
        isActive: true,
        notificationEnabled: geofenceData.notificationEnabled !== false,
        customData: geofenceData.customData || {},
        enterCount: 0,
        exitCount: 0,
        lastTriggered: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.geofences.set(geofence.id, geofence);
      await this.saveGeofences();

      await this.auditService.logEvent('geofence_created', {
        geofence_id: geofence.id,
        user_id: userId,
        name: geofence.name,
        latitude: geofence.center.latitude,
        longitude: geofence.center.longitude,
        radius: geofence.radius,
        triggers: geofence.triggers,
        timestamp: new Date().toISOString()
      });

      this.emit('geofenceCreated', geofence);
      return geofence;
    } catch (error) {
      console.error('Failed to create geofence:', error);
      throw error;
    }
  }

  async findNearbyVenues(location, options = {}) {
    try {
      const radius = options.radius || this.mapConfig.nearbyRadius;
      const categories = options.categories || [];
      const limit = options.limit || 50;

      const nearbyVenues = Array.from(this.venues.values())
        .filter(venue => {
          // Calculate distance
          const distance = this.calculateDistance(location, venue.coordinates);
          if (distance > radius) return false;

          // Filter by categories if specified
          if (categories.length > 0 && !categories.includes(venue.category)) {
            return false;
          }

          return true;
        })
        .map(venue => ({
          ...venue,
          distance: this.calculateDistance(location, venue.coordinates)
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit);

      await this.auditService.logEvent('nearby_venues_searched', {
        location: location,
        radius: radius,
        categories: categories,
        results_count: nearbyVenues.length,
        timestamp: new Date().toISOString()
      });

      return nearbyVenues;
    } catch (error) {
      console.error('Failed to find nearby venues:', error);
      return [];
    }
  }

  async reverseGeocode(latitude, longitude) {
    try {
      // In a real implementation, this would call a geocoding service
      // For now, return a mock address
      const address = {
        formattedAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        streetNumber: '123',
        streetName: 'Main Street',
        city: 'Sample City',
        state: 'Sample State',
        postalCode: '12345',
        country: 'Sample Country',
        countryCode: 'SC'
      };

      await this.auditService.logEvent('reverse_geocode', {
        latitude: latitude,
        longitude: longitude,
        formatted_address: address.formattedAddress,
        timestamp: new Date().toISOString()
      });

      return address;
    } catch (error) {
      console.error('Failed to reverse geocode:', error);
      return null;
    }
  }

  async searchPlaces(query, location = null, options = {}) {
    try {
      const radius = options.radius || 10000; // 10km default
      const type = options.type || 'all';
      const limit = options.limit || 20;

      // In a real implementation, this would call a places API
      // For now, search in our venue database
      let results = Array.from(this.venues.values())
        .filter(venue => {
          // Text search
          if (!venue.name.toLowerCase().includes(query.toLowerCase()) &&
              !venue.address.toLowerCase().includes(query.toLowerCase())) {
            return false;
          }

          // Location filter
          if (location) {
            const distance = this.calculateDistance(location, venue.coordinates);
            if (distance > radius) return false;
          }

          // Type filter
          if (type !== 'all' && venue.category !== type) {
            return false;
          }

          return true;
        });

      // Add distance if location provided
      if (location) {
        results = results.map(venue => ({
          ...venue,
          distance: this.calculateDistance(location, venue.coordinates)
        }));
      }

      // Sort by relevance (distance if location provided, otherwise by name)
      results.sort((a, b) => {
        if (location) {
          return a.distance - b.distance;
        }
        return a.name.localeCompare(b.name);
      });

      results = results.slice(0, limit);

      await this.auditService.logEvent('places_searched', {
        query: query,
        location: location,
        radius: radius,
        type: type,
        results_count: results.length,
        timestamp: new Date().toISOString()
      });

      return results;
    } catch (error) {
      console.error('Failed to search places:', error);
      return [];
    }
  }

  // Helper methods

  calculateDistance(point1, point2) {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c * 1000; // Convert to meters
  }

  async calculateRoute(route) {
    try {
      // Basic route calculation - in real implementation would use routing service
      const distance = this.calculateDistance(route.origin, route.destination);
      const transportMode = this.transportModes.find(mode => mode.id === route.transportMode) || this.transportModes[0];
      const duration = Math.floor((distance / 1000) / transportMode.speed * 3600); // seconds

      // Generate basic steps
      const steps = [
        {
          instruction: `Head ${this.getDirection(route.origin, route.destination)} on Main Street`,
          distance: distance * 0.3,
          duration: duration * 0.3,
          coordinates: route.origin
        },
        {
          instruction: 'Continue straight',
          distance: distance * 0.4,
          duration: duration * 0.4,
          coordinates: {
            latitude: (route.origin.latitude + route.destination.latitude) / 2,
            longitude: (route.origin.longitude + route.destination.longitude) / 2
          }
        },
        {
          instruction: `Turn right and arrive at destination`,
          distance: distance * 0.3,
          duration: duration * 0.3,
          coordinates: route.destination
        }
      ];

      // Generate polyline (simplified)
      const polyline = [
        route.origin,
        {
          latitude: (route.origin.latitude + route.destination.latitude) / 2,
          longitude: (route.origin.longitude + route.destination.longitude) / 2
        },
        route.destination
      ];

      // Calculate bounds
      const bounds = {
        northeast: {
          latitude: Math.max(route.origin.latitude, route.destination.latitude),
          longitude: Math.max(route.origin.longitude, route.destination.longitude)
        },
        southwest: {
          latitude: Math.min(route.origin.latitude, route.destination.latitude),
          longitude: Math.min(route.origin.longitude, route.destination.longitude)
        }
      };

      return {
        distance: distance,
        duration: duration,
        steps: steps,
        polyline: polyline,
        bounds: bounds
      };
    } catch (error) {
      console.error('Failed to calculate route:', error);
      throw error;
    }
  }

  getDirection(from, to) {
    const bearing = this.calculateBearing(from, to);
    
    if (bearing >= -22.5 && bearing < 22.5) return 'north';
    if (bearing >= 22.5 && bearing < 67.5) return 'northeast';
    if (bearing >= 67.5 && bearing < 112.5) return 'east';
    if (bearing >= 112.5 && bearing < 157.5) return 'southeast';
    if (bearing >= 157.5 || bearing < -157.5) return 'south';
    if (bearing >= -157.5 && bearing < -112.5) return 'southwest';
    if (bearing >= -112.5 && bearing < -67.5) return 'west';
    if (bearing >= -67.5 && bearing < -22.5) return 'northwest';
    
    return 'north';
  }

  calculateBearing(from, to) {
    const dLon = (to.longitude - from.longitude) * Math.PI / 180;
    const lat1 = from.latitude * Math.PI / 180;
    const lat2 = to.latitude * Math.PI / 180;
    
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    
    return Math.atan2(y, x) * 180 / Math.PI;
  }

  findNearestPointOnRoute(location, route) {
    // Simple implementation - find nearest polyline point
    let nearestPoint = route.polyline[0];
    let minDistance = this.calculateDistance(location, nearestPoint);

    route.polyline.forEach(point => {
      const distance = this.calculateDistance(location, point);
      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = point;
      }
    });

    return nearestPoint;
  }

  getCurrentStep(location, route) {
    // Determine which step the user is currently on
    let currentStep = 0;
    let minDistance = Infinity;

    route.steps.forEach((step, index) => {
      const distance = this.calculateDistance(location, step.coordinates);
      if (distance < minDistance) {
        minDistance = distance;
        currentStep = index;
      }
    });

    return currentStep;
  }

  async triggerRerouting(session) {
    try {
      session.status = 'rerouting';
      session.reroutes++;

      const route = this.routes.get(session.routeId);
      if (!route) return;

      // Recalculate route from current location
      const newRoute = await this.planRoute(
        session.currentLocation,
        route.destination,
        { transportMode: route.transportMode }
      );

      // Update session with new route
      session.routeId = newRoute.id;
      session.status = 'navigating';
      session.distanceRemaining = newRoute.distance;
      session.timeRemaining = newRoute.duration;

      this.navigationSessions.set(session.id, session);
      await this.saveNavigationSessions();

      await this.auditService.logEvent('navigation_rerouted', {
        session_id: session.id,
        old_route_id: route.id,
        new_route_id: newRoute.id,
        reroute_count: session.reroutes,
        timestamp: new Date().toISOString()
      });

      this.emit('navigationRerouted', { session, newRoute });
    } catch (error) {
      console.error('Failed to trigger rerouting:', error);
    }
  }

  async addLocationToHistory(location) {
    try {
      const historyEntry = {
        ...location,
        id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      this.locationHistory.unshift(historyEntry);

      // Keep only recent 1000 entries
      this.locationHistory = this.locationHistory.slice(0, 1000);

      await this.saveLocationHistory();
    } catch (error) {
      console.error('Failed to add location to history:', error);
    }
  }

  async checkGeofences(location) {
    try {
      const activeGeofences = Array.from(this.geofences.values())
        .filter(g => g.isActive);

      for (const geofence of activeGeofences) {
        const distance = this.calculateDistance(location, geofence.center);
        const isInside = distance <= geofence.radius;

        // Check for enter/exit events
        if (geofence.triggers.includes('enter') && isInside && !geofence.lastInside) {
          await this.triggerGeofenceEvent(geofence, 'enter', location);
        } else if (geofence.triggers.includes('exit') && !isInside && geofence.lastInside) {
          await this.triggerGeofenceEvent(geofence, 'exit', location);
        }

        geofence.lastInside = isInside;
        this.geofences.set(geofence.id, geofence);
      }

      await this.saveGeofences();
    } catch (error) {
      console.error('Failed to check geofences:', error);
    }
  }

  async triggerGeofenceEvent(geofence, eventType, location) {
    try {
      if (eventType === 'enter') {
        geofence.enterCount++;
      } else if (eventType === 'exit') {
        geofence.exitCount++;
      }

      geofence.lastTriggered = new Date().toISOString();
      this.locationMetrics.geofenceEvents++;

      await this.auditService.logEvent('geofence_triggered', {
        geofence_id: geofence.id,
        user_id: geofence.userId,
        event_type: eventType,
        location: location,
        geofence_name: geofence.name,
        timestamp: geofence.lastTriggered
      });

      this.emit('geofenceTriggered', {
        geofence: geofence,
        eventType: eventType,
        location: location
      });
    } catch (error) {
      console.error('Failed to trigger geofence event:', error);
    }
  }

  async updateNearbyVenues(location) {
    try {
      this.nearbyVenues = await this.findNearbyVenues(location, {
        radius: this.mapConfig.nearbyRadius,
        limit: 20
      });

      this.emit('nearbyVenuesUpdated', this.nearbyVenues);
    } catch (error) {
      console.error('Failed to update nearby venues:', error);
    }
  }

  validateLocationData(locationData) {
    const errors = [];

    if (!locationData.name || locationData.name.trim().length === 0) {
      errors.push('Location name is required');
    }

    if (!locationData.latitude || !locationData.longitude) {
      errors.push('Latitude and longitude are required');
    }

    if (locationData.latitude < -90 || locationData.latitude > 90) {
      errors.push('Invalid latitude');
    }

    if (locationData.longitude < -180 || locationData.longitude > 180) {
      errors.push('Invalid longitude');
    }

    if (locationData.type && !this.locationTypes.some(type => type.id === locationData.type)) {
      errors.push('Invalid location type');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Save methods
  async saveRoutes() {
    try {
      const routeList = Array.from(this.routes.values());
      await this.storageService.setItem('navigation_routes', routeList);
    } catch (error) {
      console.error('Failed to save routes:', error);
    }
  }

  async saveSavedLocations() {
    try {
      const locationList = Array.from(this.savedLocations.values());
      await this.storageService.setItem('saved_locations', locationList);
    } catch (error) {
      console.error('Failed to save saved locations:', error);
    }
  }

  async saveLocationHistory() {
    try {
      await this.storageService.setItem('location_history', this.locationHistory);
    } catch (error) {
      console.error('Failed to save location history:', error);
    }
  }

  async saveNavigationSessions() {
    try {
      const sessionList = Array.from(this.navigationSessions.values());
      await this.storageService.setItem('navigation_sessions', sessionList);
    } catch (error) {
      console.error('Failed to save navigation sessions:', error);
    }
  }

  async saveGeofences() {
    try {
      const geofenceList = Array.from(this.geofences.values());
      await this.storageService.setItem('geofences', geofenceList);
    } catch (error) {
      console.error('Failed to save geofences:', error);
    }
  }

  async saveLocationMetrics() {
    try {
      await this.storageService.setItem('location_metrics', this.locationMetrics);
    } catch (error) {
      console.error('Failed to save location metrics:', error);
    }
  }

  // Getter methods
  getUserLocation() {
    return this.userLocation;
  }

  getNearbyVenues() {
    return this.nearbyVenues;
  }

  getTransportModes() {
    return this.transportModes;
  }

  getLocationTypes() {
    return this.locationTypes;
  }

  getNavigationStatuses() {
    return this.navigationStatuses;
  }

  getLocationMetrics() {
    return this.locationMetrics;
  }

  getSavedLocations(userId) {
    return Array.from(this.savedLocations.values())
      .filter(location => location.userId === userId);
  }

  getUserGeofences(userId) {
    return Array.from(this.geofences.values())
      .filter(geofence => geofence.userId === userId);
  }

  getActiveNavigationSession(userId) {
    return Array.from(this.navigationSessions.values())
      .find(session => session.userId === userId && session.status === 'navigating');
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
      // Stop location tracking
      await this.stopLocationTracking();

      this.listeners = [];
      this.venues.clear();
      this.routes.clear();
      this.savedLocations.clear();
      this.locationHistory = [];
      this.navigationSessions.clear();
      this.geofences.clear();
      this.mapSettings.clear();
      this.initialized = false;
      
      await this.auditService.logEvent('map_navigation_service_cleanup', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to cleanup MapNavigationService:', error);
    }
  }
}

export { MapNavigationService };