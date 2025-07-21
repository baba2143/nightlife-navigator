import { LocalStorageService } from './LocalStorageService';
import { AuditLogService } from './AuditLogService';

class ReservationService {
  constructor() {
    this.initialized = false;
    this.storageService = null;
    this.auditService = null;
    this.reservations = new Map();
    this.venueReservations = new Map();
    this.userReservations = new Map();
    this.availabilityCache = new Map();
    this.checkIns = new Map();
    this.waitlists = new Map();
    this.reservationMetrics = {
      totalReservations: 0,
      completedReservations: 0,
      cancelledReservations: 0,
      noShowReservations: 0,
      checkInRate: 0,
      averagePartySize: 0,
      popularTimeSlots: {},
      venuePopularity: {}
    };
    this.listeners = [];
    this.reservationConfig = {
      maxAdvanceBookingDays: 30,
      minAdvanceBookingHours: 2,
      maxPartySize: 20,
      defaultReservationDuration: 120, // minutes
      enableWaitlist: true,
      enableCheckIn: true,
      autoConfirmReservations: false,
      sendConfirmationNotifications: true,
      sendReminderNotifications: true,
      reminderHours: 2,
      cancellationDeadlineHours: 2,
      enableDepositPayments: true,
      depositPercentage: 20
    };
    this.reservationStatuses = [
      { id: 'pending', name: 'Pending Confirmation' },
      { id: 'confirmed', name: 'Confirmed' },
      { id: 'cancelled', name: 'Cancelled' },
      { id: 'completed', name: 'Completed' },
      { id: 'no_show', name: 'No Show' },
      { id: 'checked_in', name: 'Checked In' }
    ];
    this.reservationTypes = [
      { id: 'table', name: 'Table Reservation', requiresDeposit: false },
      { id: 'vip_table', name: 'VIP Table', requiresDeposit: true },
      { id: 'bottle_service', name: 'Bottle Service', requiresDeposit: true },
      { id: 'event_ticket', name: 'Event Ticket', requiresDeposit: false },
      { id: 'private_room', name: 'Private Room', requiresDeposit: true }
    ];
    this.timeSlots = this.generateTimeSlots();
  }

  static getInstance() {
    if (!ReservationService.instance) {
      ReservationService.instance = new ReservationService();
    }
    return ReservationService.instance;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      this.storageService = LocalStorageService.getInstance();
      this.auditService = AuditLogService.getInstance();
      
      await this.loadReservations();
      await this.loadVenueReservations();
      await this.loadUserReservations();
      await this.loadCheckIns();
      await this.loadWaitlists();
      await this.loadReservationMetrics();
      await this.loadReservationConfig();
      
      this.initialized = true;
      
      await this.auditService.logEvent('reservation_service_initialized', {
        timestamp: new Date().toISOString(),
        reservations: this.reservations.size,
        venues_with_reservations: this.venueReservations.size,
        reservation_types: this.reservationTypes.length
      });
      
      this.emit('serviceInitialized');
    } catch (error) {
      console.error('Failed to initialize ReservationService:', error);
      throw error;
    }
  }

  async loadReservations() {
    try {
      const reservations = await this.storageService.getItem('reservations');
      const reservationList = reservations || [];

      this.reservations.clear();
      reservationList.forEach(reservation => {
        this.reservations.set(reservation.id, reservation);
      });
    } catch (error) {
      console.error('Failed to load reservations:', error);
      this.reservations.clear();
    }
  }

  async loadVenueReservations() {
    try {
      const venueReservations = await this.storageService.getItem('venue_reservations');
      const venueReservationList = venueReservations || [];

      this.venueReservations.clear();
      venueReservationList.forEach(venueReservation => {
        this.venueReservations.set(venueReservation.venueId, venueReservation);
      });
    } catch (error) {
      console.error('Failed to load venue reservations:', error);
      this.venueReservations.clear();
    }
  }

  async loadUserReservations() {
    try {
      const userReservations = await this.storageService.getItem('user_reservations');
      const userReservationList = userReservations || [];

      this.userReservations.clear();
      userReservationList.forEach(userReservation => {
        this.userReservations.set(userReservation.userId, userReservation);
      });
    } catch (error) {
      console.error('Failed to load user reservations:', error);
      this.userReservations.clear();
    }
  }

  async loadCheckIns() {
    try {
      const checkIns = await this.storageService.getItem('check_ins');
      const checkInList = checkIns || [];

      this.checkIns.clear();
      checkInList.forEach(checkIn => {
        this.checkIns.set(checkIn.id, checkIn);
      });
    } catch (error) {
      console.error('Failed to load check-ins:', error);
      this.checkIns.clear();
    }
  }

  async loadWaitlists() {
    try {
      const waitlists = await this.storageService.getItem('waitlists');
      const waitlistList = waitlists || [];

      this.waitlists.clear();
      waitlistList.forEach(waitlist => {
        this.waitlists.set(waitlist.id, waitlist);
      });
    } catch (error) {
      console.error('Failed to load waitlists:', error);
      this.waitlists.clear();
    }
  }

  async loadReservationMetrics() {
    try {
      const metrics = await this.storageService.getItem('reservation_metrics');
      if (metrics) {
        this.reservationMetrics = { ...this.reservationMetrics, ...metrics };
      }
    } catch (error) {
      console.error('Failed to load reservation metrics:', error);
    }
  }

  async loadReservationConfig() {
    try {
      const config = await this.storageService.getItem('reservation_config');
      if (config) {
        this.reservationConfig = { ...this.reservationConfig, ...config };
      }
    } catch (error) {
      console.error('Failed to load reservation config:', error);
    }
  }

  async createReservation(reservationData) {
    try {
      // Validate reservation data
      const validation = this.validateReservationData(reservationData);
      if (!validation.isValid) {
        throw new Error(`Invalid reservation data: ${validation.errors.join(', ')}`);
      }

      // Check availability
      const availability = await this.checkAvailability(
        reservationData.venueId,
        reservationData.date,
        reservationData.timeSlot,
        reservationData.partySize,
        reservationData.reservationType
      );

      if (!availability.available) {
        // Add to waitlist if enabled
        if (this.reservationConfig.enableWaitlist && reservationData.joinWaitlist) {
          return await this.addToWaitlist(reservationData);
        } else {
          throw new Error(`No availability for requested time slot: ${availability.reason}`);
        }
      }

      const reservation = {
        id: `reservation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: reservationData.userId,
        venueId: reservationData.venueId,
        date: reservationData.date,
        timeSlot: reservationData.timeSlot,
        partySize: reservationData.partySize,
        reservationType: reservationData.reservationType,
        specialRequests: reservationData.specialRequests || '',
        contactInfo: {
          name: reservationData.contactName,
          phone: reservationData.contactPhone,
          email: reservationData.contactEmail
        },
        status: this.reservationConfig.autoConfirmReservations ? 'confirmed' : 'pending',
        confirmationCode: this.generateConfirmationCode(),
        depositRequired: this.isDepositRequired(reservationData.reservationType),
        depositAmount: this.calculateDepositAmount(reservationData),
        depositPaid: false,
        totalAmount: reservationData.totalAmount || 0,
        cancellationDeadline: this.calculateCancellationDeadline(reservationData.date, reservationData.timeSlot),
        reminderSent: false,
        checkInTime: null,
        checkInCode: null,
        notes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save reservation
      this.reservations.set(reservation.id, reservation);
      await this.saveReservations();

      // Update venue reservations
      await this.updateVenueReservations(reservation.venueId, reservation);

      // Update user reservations
      await this.updateUserReservations(reservation.userId, reservation);

      // Update metrics
      await this.updateReservationMetrics();

      // Clear availability cache
      this.clearAvailabilityCache(reservation.venueId, reservation.date);

      await this.auditService.logEvent('reservation_created', {
        reservation_id: reservation.id,
        venue_id: reservation.venueId,
        user_id: reservation.userId,
        date: reservation.date,
        time_slot: reservation.timeSlot,
        party_size: reservation.partySize,
        type: reservation.reservationType,
        status: reservation.status,
        timestamp: new Date().toISOString()
      });

      this.emit('reservationCreated', reservation);
      return reservation;
    } catch (error) {
      console.error('Failed to create reservation:', error);
      throw error;
    }
  }

  async updateReservation(reservationId, updateData) {
    try {
      const reservation = this.reservations.get(reservationId);
      if (!reservation) {
        throw new Error('Reservation not found');
      }

      // Validate update data
      const validation = this.validateReservationUpdateData(updateData);
      if (!validation.isValid) {
        throw new Error(`Invalid update data: ${validation.errors.join(', ')}`);
      }

      // Check if time/date change requires availability check
      if (updateData.date || updateData.timeSlot || updateData.partySize) {
        const newDate = updateData.date || reservation.date;
        const newTimeSlot = updateData.timeSlot || reservation.timeSlot;
        const newPartySize = updateData.partySize || reservation.partySize;

        const availability = await this.checkAvailability(
          reservation.venueId,
          newDate,
          newTimeSlot,
          newPartySize,
          reservation.reservationType,
          reservationId // exclude current reservation from availability check
        );

        if (!availability.available) {
          throw new Error(`No availability for updated time slot: ${availability.reason}`);
        }
      }

      // Update reservation
      const updatedReservation = {
        ...reservation,
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      // Recalculate cancellation deadline if date/time changed
      if (updateData.date || updateData.timeSlot) {
        updatedReservation.cancellationDeadline = this.calculateCancellationDeadline(
          updatedReservation.date,
          updatedReservation.timeSlot
        );
      }

      this.reservations.set(reservationId, updatedReservation);
      await this.saveReservations();

      // Update related data
      await this.updateVenueReservations(updatedReservation.venueId, updatedReservation);
      await this.updateUserReservations(updatedReservation.userId, updatedReservation);

      // Clear availability cache if time/date changed
      if (updateData.date || updateData.timeSlot) {
        this.clearAvailabilityCache(updatedReservation.venueId, updatedReservation.date);
        if (updateData.date) {
          this.clearAvailabilityCache(updatedReservation.venueId, reservation.date);
        }
      }

      await this.auditService.logEvent('reservation_updated', {
        reservation_id: reservationId,
        venue_id: updatedReservation.venueId,
        user_id: updatedReservation.userId,
        changes: Object.keys(updateData),
        timestamp: new Date().toISOString()
      });

      this.emit('reservationUpdated', updatedReservation);
      return updatedReservation;
    } catch (error) {
      console.error('Failed to update reservation:', error);
      throw error;
    }
  }

  async cancelReservation(reservationId, userId, reason = '') {
    try {
      const reservation = this.reservations.get(reservationId);
      if (!reservation) {
        throw new Error('Reservation not found');
      }

      if (reservation.userId !== userId) {
        throw new Error('Unauthorized: User can only cancel their own reservations');
      }

      if (reservation.status === 'cancelled') {
        throw new Error('Reservation is already cancelled');
      }

      // Check cancellation deadline
      const now = new Date();
      const cancellationDeadline = new Date(reservation.cancellationDeadline);
      
      if (now > cancellationDeadline) {
        throw new Error('Cancellation deadline has passed');
      }

      // Update reservation status
      const cancelledReservation = {
        ...reservation,
        status: 'cancelled',
        cancellationReason: reason,
        cancelledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.reservations.set(reservationId, cancelledReservation);
      await this.saveReservations();

      // Update related data
      await this.updateVenueReservations(reservation.venueId, cancelledReservation);
      await this.updateUserReservations(reservation.userId, cancelledReservation);

      // Update metrics
      this.reservationMetrics.cancelledReservations++;
      await this.saveReservationMetrics();

      // Clear availability cache
      this.clearAvailabilityCache(reservation.venueId, reservation.date);

      // Process waitlist if there are waiting customers
      await this.processWaitlist(reservation.venueId, reservation.date, reservation.timeSlot);

      await this.auditService.logEvent('reservation_cancelled', {
        reservation_id: reservationId,
        venue_id: reservation.venueId,
        user_id: userId,
        reason: reason,
        timestamp: new Date().toISOString()
      });

      this.emit('reservationCancelled', { reservationId, venueId: reservation.venueId, userId, reason });
      return cancelledReservation;
    } catch (error) {
      console.error('Failed to cancel reservation:', error);
      throw error;
    }
  }

  async checkInReservation(reservationId, checkInData) {
    try {
      const reservation = this.reservations.get(reservationId);
      if (!reservation) {
        throw new Error('Reservation not found');
      }

      if (reservation.status !== 'confirmed') {
        throw new Error('Only confirmed reservations can be checked in');
      }

      // Validate check-in time window
      const reservationDateTime = new Date(`${reservation.date}T${reservation.timeSlot}`);
      const now = new Date();
      const timeDiff = Math.abs(now - reservationDateTime) / (1000 * 60); // minutes

      if (timeDiff > 60) { // Allow check-in within 1 hour of reservation time
        throw new Error('Check-in window has expired');
      }

      const checkIn = {
        id: `checkin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        reservationId: reservationId,
        venueId: reservation.venueId,
        userId: reservation.userId,
        actualPartySize: checkInData.actualPartySize || reservation.partySize,
        checkInTime: new Date().toISOString(),
        staffMemberId: checkInData.staffMemberId,
        tableAssigned: checkInData.tableAssigned,
        notes: checkInData.notes || '',
        specialAccommodations: checkInData.specialAccommodations || []
      };

      // Update reservation
      const checkedInReservation = {
        ...reservation,
        status: 'checked_in',
        checkInTime: checkIn.checkInTime,
        checkInCode: checkIn.id,
        actualPartySize: checkIn.actualPartySize,
        updatedAt: new Date().toISOString()
      };

      this.reservations.set(reservationId, checkedInReservation);
      this.checkIns.set(checkIn.id, checkIn);

      await this.saveReservations();
      await this.saveCheckIns();

      // Update metrics
      await this.updateCheckInMetrics();

      await this.auditService.logEvent('reservation_checked_in', {
        reservation_id: reservationId,
        check_in_id: checkIn.id,
        venue_id: reservation.venueId,
        user_id: reservation.userId,
        actual_party_size: checkIn.actualPartySize,
        staff_member_id: checkInData.staffMemberId,
        timestamp: new Date().toISOString()
      });

      this.emit('reservationCheckedIn', { reservation: checkedInReservation, checkIn });
      return { reservation: checkedInReservation, checkIn };
    } catch (error) {
      console.error('Failed to check in reservation:', error);
      throw error;
    }
  }

  async checkAvailability(venueId, date, timeSlot, partySize, reservationType, excludeReservationId = null) {
    try {
      const cacheKey = `${venueId}_${date}_${timeSlot}_${partySize}_${reservationType}`;
      
      // Check cache first
      if (this.availabilityCache.has(cacheKey)) {
        const cachedResult = this.availabilityCache.get(cacheKey);
        if (Date.now() - cachedResult.timestamp < 5 * 60 * 1000) { // 5 minutes cache
          return cachedResult.result;
        }
      }

      // Get venue capacity info (in real app would come from venue service)
      const venueCapacity = this.getVenueCapacity(venueId, reservationType);
      
      // Get existing reservations for this time slot
      const existingReservations = Array.from(this.reservations.values())
        .filter(reservation => 
          reservation.venueId === venueId &&
          reservation.date === date &&
          reservation.timeSlot === timeSlot &&
          reservation.status !== 'cancelled' &&
          reservation.status !== 'no_show' &&
          reservation.id !== excludeReservationId
        );

      // Calculate occupied capacity
      const occupiedCapacity = existingReservations.reduce((total, reservation) => {
        if (reservation.reservationType === reservationType) {
          return total + reservation.partySize;
        }
        return total;
      }, 0);

      const remainingCapacity = venueCapacity - occupiedCapacity;
      const available = remainingCapacity >= partySize;

      const result = {
        available: available,
        remainingCapacity: remainingCapacity,
        totalCapacity: venueCapacity,
        reason: available ? null : 'Insufficient capacity',
        suggestedTimeSlots: available ? [] : await this.getSuggestedTimeSlots(venueId, date, partySize, reservationType)
      };

      // Cache result
      this.availabilityCache.set(cacheKey, {
        result: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error('Failed to check availability:', error);
      return {
        available: false,
        reason: 'Error checking availability',
        remainingCapacity: 0,
        totalCapacity: 0,
        suggestedTimeSlots: []
      };
    }
  }

  async getSuggestedTimeSlots(venueId, date, partySize, reservationType) {
    try {
      const suggestedSlots = [];
      
      for (const timeSlot of this.timeSlots) {
        const availability = await this.checkAvailability(venueId, date, timeSlot, partySize, reservationType);
        if (availability.available) {
          suggestedSlots.push({
            timeSlot: timeSlot,
            remainingCapacity: availability.remainingCapacity
          });
        }
      }

      return suggestedSlots.slice(0, 5); // Return top 5 suggestions
    } catch (error) {
      console.error('Failed to get suggested time slots:', error);
      return [];
    }
  }

  async addToWaitlist(reservationData) {
    try {
      const waitlistEntry = {
        id: `waitlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: reservationData.userId,
        venueId: reservationData.venueId,
        date: reservationData.date,
        timeSlot: reservationData.timeSlot,
        partySize: reservationData.partySize,
        reservationType: reservationData.reservationType,
        contactInfo: {
          name: reservationData.contactName,
          phone: reservationData.contactPhone,
          email: reservationData.contactEmail
        },
        priority: this.calculateWaitlistPriority(reservationData.userId),
        status: 'waiting',
        joinedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        notificationsSent: 0,
        updatedAt: new Date().toISOString()
      };

      this.waitlists.set(waitlistEntry.id, waitlistEntry);
      await this.saveWaitlists();

      await this.auditService.logEvent('waitlist_joined', {
        waitlist_id: waitlistEntry.id,
        venue_id: waitlistEntry.venueId,
        user_id: waitlistEntry.userId,
        date: waitlistEntry.date,
        time_slot: waitlistEntry.timeSlot,
        priority: waitlistEntry.priority,
        timestamp: new Date().toISOString()
      });

      this.emit('waitlistJoined', waitlistEntry);
      return waitlistEntry;
    } catch (error) {
      console.error('Failed to add to waitlist:', error);
      throw error;
    }
  }

  async processWaitlist(venueId, date, timeSlot) {
    try {
      // Find waiting customers for this slot
      const waitingCustomers = Array.from(this.waitlists.values())
        .filter(entry => 
          entry.venueId === venueId &&
          entry.date === date &&
          entry.timeSlot === timeSlot &&
          entry.status === 'waiting'
        )
        .sort((a, b) => b.priority - a.priority || new Date(a.joinedAt) - new Date(b.joinedAt));

      for (const waitlistEntry of waitingCustomers) {
        const availability = await this.checkAvailability(
          venueId,
          date,
          timeSlot,
          waitlistEntry.partySize,
          waitlistEntry.reservationType
        );

        if (availability.available) {
          // Convert waitlist entry to reservation
          await this.convertWaitlistToReservation(waitlistEntry.id);
          break; // Process one at a time
        }
      }
    } catch (error) {
      console.error('Failed to process waitlist:', error);
    }
  }

  async convertWaitlistToReservation(waitlistId) {
    try {
      const waitlistEntry = this.waitlists.get(waitlistId);
      if (!waitlistEntry) {
        throw new Error('Waitlist entry not found');
      }

      // Create reservation from waitlist entry
      const reservationData = {
        userId: waitlistEntry.userId,
        venueId: waitlistEntry.venueId,
        date: waitlistEntry.date,
        timeSlot: waitlistEntry.timeSlot,
        partySize: waitlistEntry.partySize,
        reservationType: waitlistEntry.reservationType,
        contactName: waitlistEntry.contactInfo.name,
        contactPhone: waitlistEntry.contactInfo.phone,
        contactEmail: waitlistEntry.contactInfo.email,
        specialRequests: 'Converted from waitlist'
      };

      const reservation = await this.createReservation(reservationData);

      // Update waitlist entry
      waitlistEntry.status = 'converted';
      waitlistEntry.reservationId = reservation.id;
      waitlistEntry.convertedAt = new Date().toISOString();
      waitlistEntry.updatedAt = new Date().toISOString();

      this.waitlists.set(waitlistId, waitlistEntry);
      await this.saveWaitlists();

      await this.auditService.logEvent('waitlist_converted', {
        waitlist_id: waitlistId,
        reservation_id: reservation.id,
        venue_id: waitlistEntry.venueId,
        user_id: waitlistEntry.userId,
        timestamp: new Date().toISOString()
      });

      this.emit('waitlistConverted', { waitlistEntry, reservation });
      return reservation;
    } catch (error) {
      console.error('Failed to convert waitlist to reservation:', error);
      throw error;
    }
  }

  async getUserReservations(userId, options = {}) {
    try {
      const userReservationData = this.userReservations.get(userId);
      if (!userReservationData) {
        return {
          reservations: [],
          total: 0
        };
      }

      let reservations = userReservationData.reservations
        .map(reservationId => this.reservations.get(reservationId))
        .filter(reservation => reservation);

      // Apply filters
      if (options.status) {
        reservations = reservations.filter(reservation => reservation.status === options.status);
      }

      if (options.fromDate) {
        reservations = reservations.filter(reservation => reservation.date >= options.fromDate);
      }

      if (options.toDate) {
        reservations = reservations.filter(reservation => reservation.date <= options.toDate);
      }

      // Apply sorting
      const sortBy = options.sortBy || 'date_desc';
      reservations = this.sortReservations(reservations, sortBy);

      // Apply pagination
      const page = options.page || 1;
      const limit = options.limit || 20;
      const startIndex = (page - 1) * limit;
      const paginatedReservations = reservations.slice(startIndex, startIndex + limit);

      return {
        reservations: paginatedReservations,
        total: reservations.length,
        page: page,
        limit: limit,
        totalPages: Math.ceil(reservations.length / limit)
      };
    } catch (error) {
      console.error('Failed to get user reservations:', error);
      throw error;
    }
  }

  async getVenueReservations(venueId, date, options = {}) {
    try {
      const reservations = Array.from(this.reservations.values())
        .filter(reservation => 
          reservation.venueId === venueId &&
          reservation.date === date &&
          (options.status ? reservation.status === options.status : true)
        );

      // Apply sorting
      const sortBy = options.sortBy || 'time_asc';
      const sortedReservations = this.sortReservations(reservations, sortBy);

      return {
        reservations: sortedReservations,
        total: sortedReservations.length,
        date: date
      };
    } catch (error) {
      console.error('Failed to get venue reservations:', error);
      throw error;
    }
  }

  validateReservationData(reservationData) {
    const errors = [];

    if (!reservationData.userId) {
      errors.push('User ID is required');
    }

    if (!reservationData.venueId) {
      errors.push('Venue ID is required');
    }

    if (!reservationData.date) {
      errors.push('Date is required');
    } else {
      const reservationDate = new Date(reservationData.date);
      const today = new Date();
      const maxDate = new Date(today.getTime() + this.reservationConfig.maxAdvanceBookingDays * 24 * 60 * 60 * 1000);
      
      if (reservationDate < today) {
        errors.push('Cannot make reservations for past dates');
      }
      
      if (reservationDate > maxDate) {
        errors.push(`Cannot make reservations more than ${this.reservationConfig.maxAdvanceBookingDays} days in advance`);
      }
    }

    if (!reservationData.timeSlot) {
      errors.push('Time slot is required');
    }

    if (!reservationData.partySize || reservationData.partySize < 1) {
      errors.push('Party size must be at least 1');
    }

    if (reservationData.partySize > this.reservationConfig.maxPartySize) {
      errors.push(`Party size cannot exceed ${this.reservationConfig.maxPartySize}`);
    }

    if (!reservationData.reservationType) {
      errors.push('Reservation type is required');
    }

    if (!reservationData.contactName || !reservationData.contactPhone) {
      errors.push('Contact name and phone are required');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  validateReservationUpdateData(updateData) {
    const errors = [];

    if (updateData.partySize && (updateData.partySize < 1 || updateData.partySize > this.reservationConfig.maxPartySize)) {
      errors.push(`Party size must be between 1 and ${this.reservationConfig.maxPartySize}`);
    }

    if (updateData.date) {
      const reservationDate = new Date(updateData.date);
      const today = new Date();
      const maxDate = new Date(today.getTime() + this.reservationConfig.maxAdvanceBookingDays * 24 * 60 * 60 * 1000);
      
      if (reservationDate < today) {
        errors.push('Cannot update to past dates');
      }
      
      if (reservationDate > maxDate) {
        errors.push(`Cannot update to more than ${this.reservationConfig.maxAdvanceBookingDays} days in advance`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  generateTimeSlots() {
    const slots = [];
    for (let hour = 17; hour <= 23; hour++) { // 5 PM to 11 PM
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  }

  generateConfirmationCode() {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  }

  isDepositRequired(reservationType) {
    const reservationTypeInfo = this.reservationTypes.find(type => type.id === reservationType);
    return reservationTypeInfo ? reservationTypeInfo.requiresDeposit : false;
  }

  calculateDepositAmount(reservationData) {
    if (!this.isDepositRequired(reservationData.reservationType)) {
      return 0;
    }

    const baseAmount = reservationData.totalAmount || 0;
    return Math.round(baseAmount * (this.reservationConfig.depositPercentage / 100));
  }

  calculateCancellationDeadline(date, timeSlot) {
    const reservationDateTime = new Date(`${date}T${timeSlot}`);
    const deadlineTime = new Date(reservationDateTime.getTime() - this.reservationConfig.cancellationDeadlineHours * 60 * 60 * 1000);
    return deadlineTime.toISOString();
  }

  calculateWaitlistPriority(userId) {
    // In a real app, this would consider user tier, loyalty points, etc.
    return Math.floor(Math.random() * 100); // Placeholder
  }

  getVenueCapacity(venueId, reservationType) {
    // In a real app, this would come from venue service
    const capacityMap = {
      'table': 100,
      'vip_table': 20,
      'bottle_service': 10,
      'event_ticket': 200,
      'private_room': 5
    };
    return capacityMap[reservationType] || 50;
  }

  sortReservations(reservations, sortBy) {
    switch (sortBy) {
      case 'date_asc':
        return reservations.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      case 'date_desc':
        return reservations.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      case 'time_asc':
        return reservations.sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
      
      case 'time_desc':
        return reservations.sort((a, b) => b.timeSlot.localeCompare(a.timeSlot));
      
      case 'party_size_asc':
        return reservations.sort((a, b) => a.partySize - b.partySize);
      
      case 'party_size_desc':
        return reservations.sort((a, b) => b.partySize - a.partySize);
      
      case 'status':
        return reservations.sort((a, b) => a.status.localeCompare(b.status));
      
      default:
        return reservations;
    }
  }

  clearAvailabilityCache(venueId, date) {
    const keysToDelete = [];
    for (const key of this.availabilityCache.keys()) {
      if (key.startsWith(`${venueId}_${date}`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.availabilityCache.delete(key));
  }

  async updateVenueReservations(venueId, reservation) {
    try {
      if (!this.venueReservations.has(venueId)) {
        this.venueReservations.set(venueId, {
          venueId: venueId,
          reservations: [],
          totalReservations: 0,
          upcomingReservations: 0,
          updatedAt: new Date().toISOString()
        });
      }

      const venueReservationData = this.venueReservations.get(venueId);

      // Add reservation if not already present
      if (!venueReservationData.reservations.includes(reservation.id)) {
        venueReservationData.reservations.push(reservation.id);
      }

      // Recalculate metrics
      const allVenueReservations = venueReservationData.reservations
        .map(reservationId => this.reservations.get(reservationId))
        .filter(r => r);

      venueReservationData.totalReservations = allVenueReservations.length;
      venueReservationData.upcomingReservations = allVenueReservations
        .filter(r => r.status === 'confirmed' && new Date(r.date) >= new Date()).length;
      venueReservationData.updatedAt = new Date().toISOString();

      await this.saveVenueReservations();
    } catch (error) {
      console.error('Failed to update venue reservations:', error);
    }
  }

  async updateUserReservations(userId, reservation) {
    try {
      if (!this.userReservations.has(userId)) {
        this.userReservations.set(userId, {
          userId: userId,
          reservations: [],
          totalReservations: 0,
          upcomingReservations: 0,
          updatedAt: new Date().toISOString()
        });
      }

      const userReservationData = this.userReservations.get(userId);

      // Add reservation if not already present
      if (!userReservationData.reservations.includes(reservation.id)) {
        userReservationData.reservations.push(reservation.id);
      }

      // Recalculate metrics
      const allUserReservations = userReservationData.reservations
        .map(reservationId => this.reservations.get(reservationId))
        .filter(r => r);

      userReservationData.totalReservations = allUserReservations.length;
      userReservationData.upcomingReservations = allUserReservations
        .filter(r => r.status === 'confirmed' && new Date(r.date) >= new Date()).length;
      userReservationData.updatedAt = new Date().toISOString();

      await this.saveUserReservations();
    } catch (error) {
      console.error('Failed to update user reservations:', error);
    }
  }

  async updateReservationMetrics() {
    try {
      const allReservations = Array.from(this.reservations.values());
      
      this.reservationMetrics.totalReservations = allReservations.length;
      this.reservationMetrics.completedReservations = allReservations.filter(r => r.status === 'completed').length;
      this.reservationMetrics.cancelledReservations = allReservations.filter(r => r.status === 'cancelled').length;
      this.reservationMetrics.noShowReservations = allReservations.filter(r => r.status === 'no_show').length;

      const checkedInReservations = allReservations.filter(r => r.status === 'checked_in');
      this.reservationMetrics.checkInRate = allReservations.length > 0 ? 
        checkedInReservations.length / allReservations.length : 0;

      this.reservationMetrics.averagePartySize = allReservations.length > 0 ? 
        allReservations.reduce((sum, r) => sum + r.partySize, 0) / allReservations.length : 0;

      await this.saveReservationMetrics();
    } catch (error) {
      console.error('Failed to update reservation metrics:', error);
    }
  }

  async updateCheckInMetrics() {
    try {
      const totalCheckIns = this.checkIns.size;
      const totalReservations = this.reservations.size;
      
      this.reservationMetrics.checkInRate = totalReservations > 0 ? totalCheckIns / totalReservations : 0;
      
      await this.saveReservationMetrics();
    } catch (error) {
      console.error('Failed to update check-in metrics:', error);
    }
  }

  async saveReservations() {
    try {
      const reservationList = Array.from(this.reservations.values());
      await this.storageService.setItem('reservations', reservationList);
    } catch (error) {
      console.error('Failed to save reservations:', error);
    }
  }

  async saveVenueReservations() {
    try {
      const venueReservationList = Array.from(this.venueReservations.values());
      await this.storageService.setItem('venue_reservations', venueReservationList);
    } catch (error) {
      console.error('Failed to save venue reservations:', error);
    }
  }

  async saveUserReservations() {
    try {
      const userReservationList = Array.from(this.userReservations.values());
      await this.storageService.setItem('user_reservations', userReservationList);
    } catch (error) {
      console.error('Failed to save user reservations:', error);
    }
  }

  async saveCheckIns() {
    try {
      const checkInList = Array.from(this.checkIns.values());
      await this.storageService.setItem('check_ins', checkInList);
    } catch (error) {
      console.error('Failed to save check-ins:', error);
    }
  }

  async saveWaitlists() {
    try {
      const waitlistList = Array.from(this.waitlists.values());
      await this.storageService.setItem('waitlists', waitlistList);
    } catch (error) {
      console.error('Failed to save waitlists:', error);
    }
  }

  async saveReservationMetrics() {
    try {
      await this.storageService.setItem('reservation_metrics', this.reservationMetrics);
    } catch (error) {
      console.error('Failed to save reservation metrics:', error);
    }
  }

  getReservations() {
    return Array.from(this.reservations.values());
  }

  getReservationById(reservationId) {
    return this.reservations.get(reservationId);
  }

  getReservationStatuses() {
    return this.reservationStatuses;
  }

  getReservationTypes() {
    return this.reservationTypes;
  }

  getTimeSlots() {
    return this.timeSlots;
  }

  getReservationMetrics() {
    return this.reservationMetrics;
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
      this.reservations.clear();
      this.venueReservations.clear();
      this.userReservations.clear();
      this.availabilityCache.clear();
      this.checkIns.clear();
      this.waitlists.clear();
      this.initialized = false;
      
      await this.auditService.logEvent('reservation_service_cleanup', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to cleanup ReservationService:', error);
    }
  }
}

export { ReservationService };