import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme } from '../components/common/ThemeProvider';
import Button from '../components/common/Button';
import VenueCard from '../components/common/VenueCard';

import { VenueSearchService } from '../services/VenueSearchService';
import { MapNavigationService } from '../services/MapNavigationService';

const { width, height } = Dimensions.get('window');

const MapScreen = ({ navigation, route }) => {
  const { colors, spacing, typography, borderRadius } = useTheme();
  const mapRef = useRef(null);
  
  // Route params
  const initialVenue = route.params?.venue;
  const initialCenter = route.params?.center;

  // State
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(initialVenue);
  const [userLocation, setUserLocation] = useState(null);
  const [region, setRegion] = useState({
    latitude: initialCenter?.latitude || 37.7749,
    longitude: initialCenter?.longitude || -122.4194,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [loading, setLoading] = useState(true);
  const [mapType, setMapType] = useState('standard');
  const [showVenueCard, setShowVenueCard] = useState(false);

  // Services
  const [venueService, setVenueService] = useState(null);
  const [mapService, setMapService] = useState(null);

  // Initialize services
  useEffect(() => {
    const initServices = async () => {
      try {
        const venue = await VenueSearchService.getInstance();
        const map = await MapNavigationService.getInstance();
        
        setVenueService(venue);
        setMapService(map);
      } catch (error) {
        console.error('Failed to initialize services:', error);
      }
    };

    initServices();
  }, []);

  // Request location permission and get current location
  const getCurrentLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'Please enable location services to find nearby venues.',
          [{ text: 'OK' }]
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const userPos = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setUserLocation(userPos);

      if (!initialCenter) {
        setRegion({
          ...userPos,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }

      return userPos;
    } catch (error) {
      console.error('Failed to get location:', error);
      Alert.alert('Error', 'Failed to get your location. Please try again.');
    }
  }, [initialCenter]);

  // Load nearby venues
  const loadNearbyVenues = useCallback(async (center) => {
    if (!venueService) return;

    try {
      setLoading(true);

      const searchOptions = {
        location: center || region,
        radius: 5, // 5km radius
        limit: 50,
      };

      const results = await venueService.searchVenues(searchOptions);
      setVenues(results.venues || []);

    } catch (error) {
      console.error('Failed to load nearby venues:', error);
    } finally {
      setLoading(false);
    }
  }, [venueService, region]);

  // Initialize map
  useFocusEffect(
    useCallback(() => {
      const initializeMap = async () => {
        const location = await getCurrentLocation();
        await loadNearbyVenues(location);
      };

      initializeMap();
    }, [getCurrentLocation, loadNearbyVenues])
  );

  // Handle region change
  const onRegionChangeComplete = useCallback((newRegion) => {
    setRegion(newRegion);
    loadNearbyVenues(newRegion);
  }, [loadNearbyVenues]);

  // Handle marker press
  const handleMarkerPress = (venue) => {
    setSelectedVenue(venue);
    setShowVenueCard(true);
    
    // Center map on selected venue
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: venue.latitude,
        longitude: venue.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  // Handle venue card press
  const handleVenueCardPress = () => {
    if (selectedVenue) {
      navigation.navigate('VenueDetail', { venue: selectedVenue });
    }
  };

  // Handle directions
  const handleDirections = async () => {
    if (!selectedVenue || !userLocation || !mapService) return;

    try {
      await mapService.planRoute(userLocation, {
        latitude: selectedVenue.latitude,
        longitude: selectedVenue.longitude,
      });

      Alert.alert(
        'Directions',
        'Opening directions in your default maps app...',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to get directions:', error);
      Alert.alert('Error', 'Failed to get directions. Please try again.');
    }
  };

  // Toggle map type
  const toggleMapType = () => {
    setMapType(current => current === 'standard' ? 'satellite' : 'standard');
  };

  // Center map on user location
  const centerOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    }
  };

  // Get marker color based on venue type
  const getMarkerColor = (venue) => {
    const colorMap = {
      club: '#FF6B35',
      bar: '#4ECDC4',
      lounge: '#F1C40F',
      restaurant: '#9B59B6',
    };
    return colorMap[venue.type] || '#FF6B35';
  };

  // Custom marker component
  const renderMarker = (venue) => (
    <Marker
      key={venue.id}
      coordinate={{
        latitude: venue.latitude,
        longitude: venue.longitude,
      }}
      onPress={() => handleMarkerPress(venue)}
      pinColor={getMarkerColor(venue)}
    >
      <Callout tooltip>
        <View style={[styles.callout, { backgroundColor: colors.card }]}>
          <Text style={[styles.calloutTitle, { color: colors.text }]}>
            {venue.name}
          </Text>
          <Text style={[styles.calloutSubtitle, { color: colors.textSecondary }]}>
            {venue.type} • {'$'.repeat(venue.priceRange || 2)}
          </Text>
          <View style={styles.calloutRating}>
            <Ionicons name="star" size={12} color={colors.warning} />
            <Text style={[styles.calloutRatingText, { color: colors.textSecondary }]}>
              {venue.rating?.toFixed(1) || 'N/A'}
            </Text>
          </View>
        </View>
      </Callout>
    </Marker>
  );

  // Map controls
  const renderMapControls = () => (
    <View style={styles.mapControls}>
      <TouchableOpacity
        style={[styles.controlButton, { backgroundColor: colors.card }]}
        onPress={toggleMapType}
      >
        <Ionicons
          name={mapType === 'standard' ? 'layers' : 'map'}
          size={20}
          color={colors.text}
        />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.controlButton, { backgroundColor: colors.card }]}
        onPress={centerOnUser}
      >
        <Ionicons name="locate" size={20} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );

  // Venue card overlay
  const renderVenueCard = () => {
    if (!showVenueCard || !selectedVenue) return null;

    return (
      <View style={[styles.venueCardContainer, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setShowVenueCard(false)}
        >
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <VenueCard
          venue={selectedVenue}
          variant="horizontal"
          onPress={handleVenueCardPress}
          style={styles.venueCard}
        />

        <View style={styles.venueActions}>
          <Button
            title="View Details"
            onPress={handleVenueCardPress}
            style={styles.actionButton}
            size="small"
          />
          
          <Button
            title="Directions"
            variant="outline"
            onPress={handleDirections}
            style={styles.actionButton}
            size="small"
            icon="navigate"
          />
        </View>
      </View>
    );
  };

  // Loading overlay
  const renderLoadingOverlay = () => {
    if (!loading) return null;

    return (
      <View style={styles.loadingOverlay}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading nearby venues...
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        mapType={mapType}
        region={region}
        onRegionChangeComplete={onRegionChangeComplete}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
      >
        {venues.map(renderMarker)}
      </MapView>

      {renderMapControls()}
      {renderVenueCard()}
      {renderLoadingOverlay()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  mapControls: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    right: 16,
    gap: 8,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  callout: {
    padding: 12,
    borderRadius: 8,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  calloutSubtitle: {
    fontSize: 12,
    marginBottom: 4,
  },
  calloutRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  calloutRatingText: {
    fontSize: 12,
  },
  venueCardContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  venueCard: {
    marginBottom: 12,
  },
  venueActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 80,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
});

export default MapScreen;