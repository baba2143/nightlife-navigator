import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme } from '../components/common/ThemeProvider';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

import { ReservationService } from '../services/ReservationService';

const { width } = Dimensions.get('window');

const ReservationScreen = ({ navigation, route }) => {
  const { colors, spacing, typography, borderRadius } = useTheme();
  
  // State
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Services
  const [reservationService, setReservationService] = useState(null);

  // Initialize service
  useEffect(() => {
    const initService = async () => {
      try {
        const service = await ReservationService.getInstance();
        setReservationService(service);
      } catch (error) {
        console.error('Failed to initialize reservation service:', error);
      }
    };

    initService();
  }, []);

  // Load reservations
  const loadReservations = useCallback(async () => {
    if (!reservationService) return;

    try {
      setLoading(true);

      const userId = 'user_123'; // Mock user ID
      const userReservations = await reservationService.getUserReservations(userId, {
        status: activeTab === 'upcoming' ? 'confirmed' : 'all',
        sortBy: 'date',
        order: 'asc',
        limit: 50,
      });

      // Filter reservations based on active tab
      const now = new Date();
      const filteredReservations = userReservations.filter(reservation => {
        const reservationDate = new Date(reservation.date);
        
        switch (activeTab) {
          case 'upcoming':
            return reservationDate >= now && reservation.status === 'confirmed';
          case 'past':
            return reservationDate < now;
          case 'cancelled':
            return reservation.status === 'cancelled';
          default:
            return true;
        }
      });

      setReservations(filteredReservations);

    } catch (error) {
      console.error('Failed to load reservations:', error);
    } finally {
      setLoading(false);
    }
  }, [reservationService, activeTab]);

  useFocusEffect(
    useCallback(() => {
      loadReservations();
    }, [loadReservations])
  );

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadReservations();
    setRefreshing(false);
  }, [loadReservations]);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Handle reservation actions
  const handleReservationPress = (reservation) => {
    setSelectedReservation(reservation);
    setShowDetails(true);
  };

  const handleCancelReservation = async () => {
    if (!selectedReservation || !reservationService) return;

    try {
      await reservationService.cancelReservation(selectedReservation.id, {
        reason: 'User cancelled',
      });

      // Update local state
      setReservations(prev => 
        prev.map(res => 
          res.id === selectedReservation.id 
            ? { ...res, status: 'cancelled' }
            : res
        )
      );

      setShowCancelModal(false);
      setShowDetails(false);
      setSelectedReservation(null);

      Alert.alert('Success', 'Reservation cancelled successfully.');

    } catch (error) {
      console.error('Failed to cancel reservation:', error);
      Alert.alert('Error', 'Failed to cancel reservation. Please try again.');
    }
  };

  const handleModifyReservation = () => {
    if (!selectedReservation) return;

    setShowDetails(false);
    navigation.navigate('MakeReservation', { 
      venue: selectedReservation.venue,
      existingReservation: selectedReservation,
      mode: 'modify'
    });
  };

  const handleCheckIn = async () => {
    if (!selectedReservation || !reservationService) return;

    try {
      await reservationService.checkInReservation(selectedReservation.id);
      
      // Update local state
      setReservations(prev => 
        prev.map(res => 
          res.id === selectedReservation.id 
            ? { ...res, status: 'checked_in' }
            : res
        )
      );

      setShowDetails(false);
      Alert.alert('Success', 'Checked in successfully!');

    } catch (error) {
      console.error('Failed to check in:', error);
      Alert.alert('Error', 'Failed to check in. Please try again.');
    }
  };

  // Format date and time
  const formatDateTime = (dateString, timeString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let formattedDate;
    if (date.toDateString() === today.toDateString()) {
      formattedDate = 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      formattedDate = 'Tomorrow';
    } else {
      formattedDate = date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric' 
      });
    }

    return `${formattedDate} at ${timeString}`;
  };

  // Get status color
  const getStatusColor = (status) => {
    const statusColors = {
      confirmed: colors.success,
      pending: colors.warning,
      cancelled: colors.error,
      checked_in: colors.primary,
      completed: colors.textSecondary,
    };
    return statusColors[status] || colors.textSecondary;
  };

  // Get status text
  const getStatusText = (status) => {
    const statusTexts = {
      confirmed: 'Confirmed',
      pending: 'Pending',
      cancelled: 'Cancelled',
      checked_in: 'Checked In',
      completed: 'Completed',
    };
    return statusTexts[status] || status;
  };

  // Render tabs
  const renderTabs = () => {
    const tabs = [
      { key: 'upcoming', label: 'Upcoming' },
      { key: 'past', label: 'Past' },
      { key: 'cancelled', label: 'Cancelled' },
    ];

    return (
      <View style={[styles.tabContainer, { backgroundColor: colors.surface }]}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && { backgroundColor: colors.primary }
            ]}
            onPress={() => handleTabChange(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: activeTab === tab.key ? '#FFFFFF' : colors.textSecondary
                }
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Render reservation item
  const renderReservationItem = ({ item: reservation }) => {
    const canCancel = reservation.status === 'confirmed' && 
                      new Date(reservation.date) > new Date();
    const canCheckIn = reservation.status === 'confirmed' && 
                       new Date(reservation.date).toDateString() === new Date().toDateString();

    return (
      <Card 
        style={styles.reservationCard} 
        onPress={() => handleReservationPress(reservation)}
      >
        <View style={styles.reservationHeader}>
          <Text style={[styles.venueName, { color: colors.text }]} numberOfLines={1}>
            {reservation.venue?.name || 'Unknown Venue'}
          </Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(reservation.status) }
          ]}>
            <Text style={[styles.statusText, { color: '#FFFFFF' }]}>
              {getStatusText(reservation.status)}
            </Text>
          </View>
        </View>

        <Text style={[styles.dateTime, { color: colors.textSecondary }]}>
          {formatDateTime(reservation.date, reservation.time)}
        </Text>

        <View style={styles.reservationDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="people" size={16} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {reservation.partySize} guests
            </Text>
          </View>

          {reservation.tableType && (
            <View style={styles.detailItem}>
              <Ionicons name="restaurant" size={16} color={colors.textSecondary} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                {reservation.tableType}
              </Text>
            </View>
          )}

          {reservation.specialRequests && (
            <View style={styles.detailItem}>
              <Ionicons name="chatbubble" size={16} color={colors.textSecondary} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                Special requests
              </Text>
            </View>
          )}
        </View>

        <View style={styles.reservationActions}>
          {canCheckIn && (
            <Button
              title="Check In"
              size="small"
              style={styles.actionButton}
              onPress={() => {
                setSelectedReservation(reservation);
                handleCheckIn();
              }}
            />
          )}
          
          {canCancel && (
            <Button
              title="Cancel"
              variant="outline"
              size="small"
              style={styles.actionButton}
              onPress={() => {
                setSelectedReservation(reservation);
                setShowCancelModal(true);
              }}
            />
          )}
        </View>
      </Card>
    );
  };

  // Render empty state
  const renderEmptyState = () => {
    const emptyMessages = {
      upcoming: {
        icon: 'calendar-outline',
        title: 'No upcoming reservations',
        subtitle: 'Book a table at your favorite venue',
      },
      past: {
        icon: 'time-outline',
        title: 'No past reservations',
        subtitle: 'Your reservation history will appear here',
      },
      cancelled: {
        icon: 'close-circle-outline',
        title: 'No cancelled reservations',
        subtitle: 'Cancelled reservations will appear here',
      },
    };

    const message = emptyMessages[activeTab];

    return (
      <View style={styles.emptyState}>
        <Ionicons name={message.icon} size={64} color={colors.textSecondary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {message.title}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          {message.subtitle}
        </Text>
        {activeTab === 'upcoming' && (
          <Button
            title="Find Venues"
            style={styles.emptyAction}
            onPress={() => navigation.navigate('Search')}
          />
        )}
      </View>
    );
  };

  // Render reservation details modal
  const renderDetailsModal = () => {
    if (!selectedReservation) return null;

    const reservation = selectedReservation;
    const canCancel = reservation.status === 'confirmed' && 
                      new Date(reservation.date) > new Date();
    const canModify = reservation.status === 'confirmed' && 
                      new Date(reservation.date) > new Date();

    return (
      <Modal
        visible={showDetails}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowDetails(false)}>
              <Text style={[styles.modalCancel, { color: colors.primary }]}>
                Close
              </Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Reservation Details
            </Text>
            <View style={styles.modalPlaceholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.venueSection}>
              <Text style={[styles.venueName, { color: colors.text }]}>
                {reservation.venue?.name}
              </Text>
              <Text style={[styles.venueAddress, { color: colors.textSecondary }]}>
                {reservation.venue?.address}
              </Text>
            </View>

            <View style={styles.detailsSection}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Date & Time
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {formatDateTime(reservation.date, reservation.time)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Party Size
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {reservation.partySize} guests
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Status
                </Text>
                <Text style={[
                  styles.detailValue, 
                  { color: getStatusColor(reservation.status) }
                ]}>
                  {getStatusText(reservation.status)}
                </Text>
              </View>

              {reservation.tableType && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Table Type
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {reservation.tableType}
                  </Text>
                </View>
              )}

              {reservation.confirmationNumber && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Confirmation
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {reservation.confirmationNumber}
                  </Text>
                </View>
              )}
            </View>

            {reservation.specialRequests && (
              <View style={styles.detailsSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Special Requests
                </Text>
                <Text style={[styles.requestsText, { color: colors.textSecondary }]}>
                  {reservation.specialRequests}
                </Text>
              </View>
            )}
          </ScrollView>

          {(canCancel || canModify) && (
            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              {canModify && (
                <Button
                  title="Modify"
                  variant="outline"
                  style={styles.footerButton}
                  onPress={handleModifyReservation}
                />
              )}
              {canCancel && (
                <Button
                  title="Cancel Reservation"
                  style={[styles.footerButton, { backgroundColor: colors.error }]}
                  onPress={() => {
                    setShowDetails(false);
                    setShowCancelModal(true);
                  }}
                />
              )}
            </View>
          )}
        </SafeAreaView>
      </Modal>
    );
  };

  // Render cancel confirmation modal
  const renderCancelModal = () => (
    <Modal
      visible={showCancelModal}
      transparent
      animationType="fade"
    >
      <View style={styles.cancelModalOverlay}>
        <View style={[styles.cancelModal, { backgroundColor: colors.card }]}>
          <Text style={[styles.cancelTitle, { color: colors.text }]}>
            Cancel Reservation
          </Text>
          <Text style={[styles.cancelMessage, { color: colors.textSecondary }]}>
            Are you sure you want to cancel this reservation? This action cannot be undone.
          </Text>
          
          <View style={styles.cancelActions}>
            <Button
              title="Keep Reservation"
              variant="outline"
              style={styles.cancelButton}
              onPress={() => setShowCancelModal(false)}
            />
            <Button
              title="Cancel"
              style={[styles.cancelButton, { backgroundColor: colors.error }]}
              onPress={handleCancelReservation}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading reservations...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderTabs()}

      <FlatList
        data={reservations}
        renderItem={renderReservationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />

      {renderDetailsModal()}
      {renderCancelModal()}
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
  tabContainer: {
    flexDirection: 'row',
    margin: 16,
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
  listContainer: {
    padding: 16,
  },
  reservationCard: {
    marginBottom: 12,
    padding: 16,
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  venueName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateTime: {
    fontSize: 16,
    marginBottom: 12,
  },
  reservationDetails: {
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
  },
  reservationActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyAction: {
    paddingHorizontal: 32,
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
  modalPlaceholder: {
    width: 60,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  venueSection: {
    marginBottom: 24,
  },
  venueAddress: {
    fontSize: 14,
    marginTop: 4,
  },
  detailsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  detailLabel: {
    fontSize: 16,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  requestsText: {
    fontSize: 16,
    lineHeight: 22,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  footerButton: {
    flex: 1,
  },
  cancelModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelModal: {
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  cancelTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  cancelMessage: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  cancelActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
});

export default ReservationScreen;