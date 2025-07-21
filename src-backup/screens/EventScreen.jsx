import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Image,
  Dimensions,
  Share,
  Alert,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme } from '../components/common/ThemeProvider';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

import { EventService } from '../services/EventService';

const { width } = Dimensions.get('window');

const EventScreen = ({ navigation, route }) => {
  const { colors, spacing, typography, borderRadius } = useTheme();
  
  // Route params
  const eventId = route.params?.eventId;
  const event = route.params?.event;

  // State
  const [eventDetails, setEventDetails] = useState(event);
  const [relatedEvents, setRelatedEvents] = useState([]);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(!event);
  const [refreshing, setRefreshing] = useState(false);
  const [isAttending, setIsAttending] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Services
  const [eventService, setEventService] = useState(null);

  // Initialize service
  useEffect(() => {
    const initService = async () => {
      try {
        const service = await EventService.getInstance();
        setEventService(service);
      } catch (error) {
        console.error('Failed to initialize event service:', error);
      }
    };

    initService();
  }, []);

  // Load event data
  const loadEventData = useCallback(async () => {
    if (!eventService) return;

    try {
      setLoading(true);

      let eventData;
      if (eventId && !event) {
        eventData = await eventService.getEventById(eventId);
        setEventDetails(eventData);
      } else {
        eventData = eventDetails;
      }

      if (!eventData) return;

      // Load related events
      const related = await eventService.getRelatedEvents(eventData.id, { limit: 5 });
      setRelatedEvents(related);

      // Load attendees
      const eventAttendees = await eventService.getEventAttendees(eventData.id, { limit: 20 });
      setAttendees(eventAttendees);

      // Check if user is attending
      const userId = 'user_123'; // Mock user ID
      const attendanceStatus = await eventService.getUserAttendanceStatus(eventData.id, userId);
      setIsAttending(attendanceStatus.isAttending);

      // Load available tickets
      const availableTickets = await eventService.getEventTickets(eventData.id);
      setTickets(availableTickets);

    } catch (error) {
      console.error('Failed to load event data:', error);
    } finally {
      setLoading(false);
    }
  }, [eventService, eventId, event, eventDetails]);

  useFocusEffect(
    useCallback(() => {
      loadEventData();
    }, [loadEventData])
  );

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadEventData();
    setRefreshing(false);
  }, [loadEventData]);

  // Handle attendance
  const handleAttendance = async () => {
    if (!eventService || !eventDetails) return;

    try {
      const userId = 'user_123';
      
      if (isAttending) {
        await eventService.removeEventAttendance(eventDetails.id, userId);
        setIsAttending(false);
        setAttendees(prev => prev.filter(attendee => attendee.id !== userId));
      } else {
        await eventService.addEventAttendance(eventDetails.id, userId);
        setIsAttending(true);
        // Add user to attendees list (mock user data)
        setAttendees(prev => [...prev, {
          id: userId,
          name: 'You',
          avatar: 'https://via.placeholder.com/40'
        }]);
      }
    } catch (error) {
      console.error('Failed to update attendance:', error);
      Alert.alert('Error', 'Failed to update attendance. Please try again.');
    }
  };

  // Handle share
  const handleShare = async () => {
    if (!eventDetails) return;

    try {
      await Share.share({
        message: `Check out this event: ${eventDetails.title} at ${eventDetails.venueName}`,
        url: `https://nightlife-app.com/events/${eventDetails.id}`,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  // Handle ticket purchase
  const handleTicketPurchase = (ticket) => {
    setSelectedTicket(ticket);
    // Navigate to ticket purchase flow
    navigation.navigate('TicketPurchase', { 
      event: eventDetails,
      ticket: ticket
    });
  };

  // Handle venue navigation
  const handleVenuePress = () => {
    if (eventDetails?.venue) {
      navigation.navigate('VenueDetail', { venue: eventDetails.venue });
    }
  };

  // Handle related event press
  const handleRelatedEventPress = (relatedEvent) => {
    navigation.push('Event', { event: relatedEvent });
  };

  // Format date and time
  const formatEventDateTime = () => {
    if (!eventDetails) return '';

    const startDate = new Date(eventDetails.startDate);
    const endDate = eventDetails.endDate ? new Date(eventDetails.endDate) : null;

    const dateOptions = { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric' 
    };

    const timeOptions = { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    };

    let dateTimeString = startDate.toLocaleDateString('en-US', dateOptions);
    dateTimeString += ` at ${startDate.toLocaleTimeString('en-US', timeOptions)}`;

    if (endDate) {
      if (endDate.toDateString() === startDate.toDateString()) {
        dateTimeString += ` - ${endDate.toLocaleTimeString('en-US', timeOptions)}`;
      } else {
        dateTimeString += ` - ${endDate.toLocaleDateString('en-US', dateOptions)} at ${endDate.toLocaleTimeString('en-US', timeOptions)}`;
      }
    }

    return dateTimeString;
  };

  // Render header image
  const renderHeaderImage = () => {
    if (!eventDetails?.image) return null;

    return (
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: eventDetails.image }}
          style={styles.eventImage}
          resizeMode="cover"
        />
        <View style={styles.imageOverlay}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.imageActions}>
            <TouchableOpacity
              style={styles.imageActionButton}
              onPress={() => setShowShareModal(true)}
            >
              <Ionicons name="share-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.imageActionButton}
              onPress={handleAttendance}
            >
              <Ionicons 
                name={isAttending ? "heart" : "heart-outline"} 
                size={24} 
                color={isAttending ? colors.error : "#FFFFFF"} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Render event info
  const renderEventInfo = () => {
    if (!eventDetails) return null;

    return (
      <Card style={styles.infoCard}>
        <View style={styles.eventHeader}>
          <Text style={[styles.eventTitle, { color: colors.text }]}>
            {eventDetails.title}
          </Text>
          
          {eventDetails.category && (
            <View style={[styles.categoryBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.categoryText, { color: '#FFFFFF' }]}>
                {eventDetails.category.toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.eventDateTime, { color: colors.textSecondary }]}>
          {formatEventDateTime()}
        </Text>

        <TouchableOpacity style={styles.venueInfo} onPress={handleVenuePress}>
          <Ionicons name="location" size={16} color={colors.primary} />
          <Text style={[styles.venueName, { color: colors.primary }]}>
            {eventDetails.venueName}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </TouchableOpacity>

        {eventDetails.description && (
          <Text style={[styles.eventDescription, { color: colors.textSecondary }]}>
            {eventDetails.description}
          </Text>
        )}

        <View style={styles.eventStats}>
          <View style={styles.statItem}>
            <Ionicons name="people" size={16} color={colors.textSecondary} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              {attendees.length} attending
            </Text>
          </View>

          {eventDetails.ticketPrice && (
            <View style={styles.statItem}>
              <Ionicons name="ticket" size={16} color={colors.textSecondary} />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>
                From ${eventDetails.ticketPrice}
              </Text>
            </View>
          )}

          {eventDetails.ageRestriction && (
            <View style={styles.statItem}>
              <Ionicons name="warning" size={16} color={colors.warning} />
              <Text style={[styles.statText, { color: colors.warning }]}>
                {eventDetails.ageRestriction}+
              </Text>
            </View>
          )}
        </View>
      </Card>
    );
  };

  // Render action buttons
  const renderActionButtons = () => (
    <View style={styles.actionButtonsContainer}>
      <Button
        title={isAttending ? "I'm Going" : "Attend Event"}
        icon={isAttending ? "checkmark" : "add"}
        style={[
          styles.attendButton,
          isAttending && { backgroundColor: colors.success }
        ]}
        onPress={handleAttendance}
      />
      
      <View style={styles.secondaryActions}>
        <Button
          title="Share"
          variant="outline"
          size="small"
          icon="share-outline"
          style={styles.secondaryButton}
          onPress={handleShare}
        />
        
        {tickets.length > 0 && (
          <Button
            title="Buy Tickets"
            size="small"
            icon="ticket"
            style={styles.secondaryButton}
            onPress={() => handleTicketPurchase(tickets[0])}
          />
        )}
      </View>
    </View>
  );

  // Render attendees
  const renderAttendees = () => {
    if (attendees.length === 0) return null;

    return (
      <Card style={styles.attendeesCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Attendees ({attendees.length})
        </Text>
        
        <FlatList
          data={attendees.slice(0, 10)}
          renderItem={({ item: attendee }) => (
            <View style={styles.attendeeItem}>
              <Image
                source={{ uri: attendee.avatar || 'https://via.placeholder.com/40' }}
                style={styles.attendeeAvatar}
              />
              <Text style={[styles.attendeeName, { color: colors.text }]} numberOfLines={1}>
                {attendee.name}
              </Text>
            </View>
          )}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.attendeesList}
        />
        
        {attendees.length > 10 && (
          <TouchableOpacity
            style={styles.viewAllAttendees}
            onPress={() => {
              // Navigate to full attendees list
              Alert.alert('Attendees', 'Full attendees list coming soon!');
            }}
          >
            <Text style={[styles.viewAllText, { color: colors.primary }]}>
              View all {attendees.length} attendees
            </Text>
          </TouchableOpacity>
        )}
      </Card>
    );
  };

  // Render related events
  const renderRelatedEvents = () => {
    if (relatedEvents.length === 0) return null;

    return (
      <Card style={styles.relatedCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Related Events
        </Text>
        
        <FlatList
          data={relatedEvents}
          renderItem={({ item: relatedEvent }) => (
            <TouchableOpacity
              style={[styles.relatedEventItem, { borderBottomColor: colors.border }]}
              onPress={() => handleRelatedEventPress(relatedEvent)}
            >
              <Image
                source={{ uri: relatedEvent.image || 'https://via.placeholder.com/60' }}
                style={styles.relatedEventImage}
              />
              <View style={styles.relatedEventInfo}>
                <Text style={[styles.relatedEventTitle, { color: colors.text }]} numberOfLines={1}>
                  {relatedEvent.title}
                </Text>
                <Text style={[styles.relatedEventDate, { color: colors.textSecondary }]}>
                  {new Date(relatedEvent.startDate).toLocaleDateString()}
                </Text>
                <Text style={[styles.relatedEventVenue, { color: colors.primary }]} numberOfLines={1}>
                  {relatedEvent.venueName}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      </Card>
    );
  };

  // Render share modal
  const renderShareModal = () => (
    <Modal
      visible={showShareModal}
      transparent
      animationType="slide"
    >
      <View style={styles.shareModalOverlay}>
        <View style={[styles.shareModal, { backgroundColor: colors.card }]}>
          <Text style={[styles.shareTitle, { color: colors.text }]}>
            Share Event
          </Text>
          
          <View style={styles.shareOptions}>
            <TouchableOpacity
              style={styles.shareOption}
              onPress={() => {
                setShowShareModal(false);
                handleShare();
              }}
            >
              <Ionicons name="share-outline" size={24} color={colors.primary} />
              <Text style={[styles.shareOptionText, { color: colors.text }]}>
                Share Link
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.shareOption}
              onPress={() => {
                setShowShareModal(false);
                // Copy to clipboard
                Alert.alert('Copied', 'Event link copied to clipboard!');
              }}
            >
              <Ionicons name="copy-outline" size={24} color={colors.primary} />
              <Text style={[styles.shareOptionText, { color: colors.text }]}>
                Copy Link
              </Text>
            </TouchableOpacity>
          </View>
          
          <Button
            title="Cancel"
            variant="outline"
            onPress={() => setShowShareModal(false)}
            style={styles.shareCancelButton}
          />
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading event...
        </Text>
      </View>
    );
  }

  if (!eventDetails) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>
          Event not found
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderHeaderImage()}
        {renderEventInfo()}
        {renderActionButtons()}
        {renderAttendees()}
        {renderRelatedEvents()}
        
        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {renderShareModal()}
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
  imageContainer: {
    height: 300,
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: 300,
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
  imageActions: {
    flexDirection: 'row',
    gap: 8,
  },
  imageActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    margin: 16,
    marginTop: -30,
    padding: 20,
    borderRadius: 16,
    zIndex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  eventDateTime: {
    fontSize: 16,
    marginBottom: 12,
  },
  venueInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  venueName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  eventDescription: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
  },
  eventStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
  },
  actionButtonsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  attendButton: {
    marginBottom: 12,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
  },
  attendeesCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  attendeesList: {
    gap: 12,
  },
  attendeeItem: {
    alignItems: 'center',
    width: 60,
  },
  attendeeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 4,
  },
  attendeeName: {
    fontSize: 12,
    textAlign: 'center',
  },
  viewAllAttendees: {
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  relatedCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  relatedEventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  relatedEventImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  relatedEventInfo: {
    flex: 1,
  },
  relatedEventTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  relatedEventDate: {
    fontSize: 14,
    marginBottom: 2,
  },
  relatedEventVenue: {
    fontSize: 14,
    fontWeight: '500',
  },
  shareModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  shareModal: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    paddingBottom: 40,
  },
  shareTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  shareOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  shareOption: {
    alignItems: 'center',
    gap: 8,
  },
  shareOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  shareCancelButton: {
    marginTop: 8,
  },
  loadingText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
  },
  bottomSpacing: {
    height: 32,
  },
});

export default EventScreen;