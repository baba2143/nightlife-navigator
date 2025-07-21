import { LocalStorageService } from './LocalStorageService';
import { AuditLogService } from './AuditLogService';

class EventService {
  constructor() {
    this.initialized = false;
    this.storageService = null;
    this.auditService = null;
    this.events = new Map();
    this.venueEvents = new Map();
    this.userEvents = new Map();
    this.eventCategories = new Map();
    this.eventAttendees = new Map();
    this.eventPromoters = new Map();
    this.eventTickets = new Map();
    this.eventMetrics = {
      totalEvents: 0,
      upcomingEvents: 0,
      pastEvents: 0,
      totalAttendees: 0,
      averageAttendance: 0,
      popularCategories: {},
      popularVenues: {},
      totalTicketsSold: 0,
      totalRevenue: 0
    };
    this.listeners = [];
    this.eventConfig = {
      maxAdvanceBookingDays: 90,
      enableTicketSales: true,
      enableRSVP: true,
      enableWaitlist: true,
      enablePromoterAccess: true,
      requireAgeVerification: true,
      maxCapacityOverbook: 10, // percentage
      reminderHours: [24, 2], // hours before event
      cancellatonDeadlineHours: 24
    };
    this.eventStatuses = [
      { id: 'draft', name: 'Draft' },
      { id: 'published', name: 'Published' },
      { id: 'cancelled', name: 'Cancelled' },
      { id: 'postponed', name: 'Postponed' },
      { id: 'sold_out', name: 'Sold Out' },
      { id: 'completed', name: 'Completed' }
    ];
    this.eventTypes = [
      { id: 'party', name: 'Party', icon: '🎉' },
      { id: 'concert', name: 'Concert', icon: '🎵' },
      { id: 'club_night', name: 'Club Night', icon: '🕺' },
      { id: 'festival', name: 'Festival', icon: '🎪' },
      { id: 'private_event', name: 'Private Event', icon: '🥂' },
      { id: 'comedy_show', name: 'Comedy Show', icon: '😂' },
      { id: 'karaoke_night', name: 'Karaoke Night', icon: '🎤' },
      { id: 'theme_party', name: 'Theme Party', icon: '🎭' },
      { id: 'live_music', name: 'Live Music', icon: '🎸' },
      { id: 'dj_set', name: 'DJ Set', icon: '🎧' }
    ];
    this.ticketTypes = [
      { id: 'general', name: 'General Admission', transferable: true },
      { id: 'vip', name: 'VIP', transferable: true },
      { id: 'early_bird', name: 'Early Bird', transferable: true },
      { id: 'group', name: 'Group Ticket', transferable: false },
      { id: 'student', name: 'Student', transferable: false },
      { id: 'comp', name: 'Complimentary', transferable: false }
    ];
  }

  static getInstance() {
    if (!EventService.instance) {
      EventService.instance = new EventService();
    }
    return EventService.instance;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      this.storageService = LocalStorageService.getInstance();
      this.auditService = AuditLogService.getInstance();
      
      await this.loadEvents();
      await this.loadVenueEvents();
      await this.loadUserEvents();
      await this.loadEventCategories();
      await this.loadEventAttendees();
      await this.loadEventPromoters();
      await this.loadEventTickets();
      await this.loadEventMetrics();
      await this.loadEventConfig();
      await this.initializeDefaultCategories();
      
      this.initialized = true;
      
      await this.auditService.logEvent('event_service_initialized', {
        timestamp: new Date().toISOString(),
        events: this.events.size,
        categories: this.eventCategories.size,
        event_types: this.eventTypes.length
      });
      
      this.emit('serviceInitialized');
    } catch (error) {
      console.error('Failed to initialize EventService:', error);
      throw error;
    }
  }

  async loadEvents() {
    try {
      const events = await this.storageService.getItem('events');
      const eventList = events || [];

      this.events.clear();
      eventList.forEach(event => {
        this.events.set(event.id, event);
      });
    } catch (error) {
      console.error('Failed to load events:', error);
      this.events.clear();
    }
  }

  async loadVenueEvents() {
    try {
      const venueEvents = await this.storageService.getItem('venue_events');
      const venueEventList = venueEvents || [];

      this.venueEvents.clear();
      venueEventList.forEach(venueEvent => {
        this.venueEvents.set(venueEvent.venueId, venueEvent);
      });
    } catch (error) {
      console.error('Failed to load venue events:', error);
      this.venueEvents.clear();
    }
  }

  async loadUserEvents() {
    try {
      const userEvents = await this.storageService.getItem('user_events');
      const userEventList = userEvents || [];

      this.userEvents.clear();
      userEventList.forEach(userEvent => {
        this.userEvents.set(userEvent.userId, userEvent);
      });
    } catch (error) {
      console.error('Failed to load user events:', error);
      this.userEvents.clear();
    }
  }

  async loadEventCategories() {
    try {
      const categories = await this.storageService.getItem('event_categories');
      const categoryList = categories || [];

      this.eventCategories.clear();
      categoryList.forEach(category => {
        this.eventCategories.set(category.id, category);
      });
    } catch (error) {
      console.error('Failed to load event categories:', error);
      this.eventCategories.clear();
    }
  }

  async loadEventAttendees() {
    try {
      const attendees = await this.storageService.getItem('event_attendees');
      const attendeeList = attendees || [];

      this.eventAttendees.clear();
      attendeeList.forEach(attendee => {
        this.eventAttendees.set(attendee.id, attendee);
      });
    } catch (error) {
      console.error('Failed to load event attendees:', error);
      this.eventAttendees.clear();
    }
  }

  async loadEventPromoters() {
    try {
      const promoters = await this.storageService.getItem('event_promoters');
      const promoterList = promoters || [];

      this.eventPromoters.clear();
      promoterList.forEach(promoter => {
        this.eventPromoters.set(promoter.id, promoter);
      });
    } catch (error) {
      console.error('Failed to load event promoters:', error);
      this.eventPromoters.clear();
    }
  }

  async loadEventTickets() {
    try {
      const tickets = await this.storageService.getItem('event_tickets');
      const ticketList = tickets || [];

      this.eventTickets.clear();
      ticketList.forEach(ticket => {
        this.eventTickets.set(ticket.id, ticket);
      });
    } catch (error) {
      console.error('Failed to load event tickets:', error);
      this.eventTickets.clear();
    }
  }

  async loadEventMetrics() {
    try {
      const metrics = await this.storageService.getItem('event_metrics');
      if (metrics) {
        this.eventMetrics = { ...this.eventMetrics, ...metrics };
      }
    } catch (error) {
      console.error('Failed to load event metrics:', error);
    }
  }

  async loadEventConfig() {
    try {
      const config = await this.storageService.getItem('event_config');
      if (config) {
        this.eventConfig = { ...this.eventConfig, ...config };
      }
    } catch (error) {
      console.error('Failed to load event config:', error);
    }
  }

  async initializeDefaultCategories() {
    try {
      if (this.eventCategories.size === 0) {
        const defaultCategories = [
          {
            id: 'electronic',
            name: 'Electronic Music',
            description: 'Electronic music events and DJ sets',
            color: '#FF6B6B',
            icon: '🎧',
            popular: true,
            createdAt: new Date().toISOString()
          },
          {
            id: 'hip_hop',
            name: 'Hip Hop',
            description: 'Hip hop and rap music events',
            color: '#4ECDC4',
            icon: '🎤',
            popular: true,
            createdAt: new Date().toISOString()
          },
          {
            id: 'rock',
            name: 'Rock',
            description: 'Rock and alternative music events',
            color: '#45B7D1',
            icon: '🎸',
            popular: false,
            createdAt: new Date().toISOString()
          },
          {
            id: 'latin',
            name: 'Latin',
            description: 'Latin music and cultural events',
            color: '#F7DC6F',
            icon: '💃',
            popular: true,
            createdAt: new Date().toISOString()
          },
          {
            id: 'comedy',
            name: 'Comedy',
            description: 'Stand-up comedy and entertainment',
            color: '#BB8FCE',
            icon: '😂',
            popular: false,
            createdAt: new Date().toISOString()
          }
        ];

        for (const category of defaultCategories) {
          this.eventCategories.set(category.id, category);
        }

        await this.saveEventCategories();
        
        await this.auditService.logEvent('default_event_categories_initialized', {
          categories_count: defaultCategories.length,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to initialize default categories:', error);
    }
  }

  async createEvent(eventData) {
    try {
      // Validate event data
      const validation = this.validateEventData(eventData);
      if (!validation.isValid) {
        throw new Error(`Invalid event data: ${validation.errors.join(', ')}`);
      }

      const event = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: eventData.title,
        description: eventData.description,
        venueId: eventData.venueId,
        organizerId: eventData.organizerId,
        promoterId: eventData.promoterId || null,
        categoryId: eventData.categoryId,
        eventType: eventData.eventType,
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        timezone: eventData.timezone || 'UTC',
        capacity: eventData.capacity,
        minAge: eventData.minAge || 18,
        dressCode: eventData.dressCode || 'casual',
        ticketRequired: eventData.ticketRequired || false,
        price: {
          general: eventData.price?.general || 0,
          vip: eventData.price?.vip || 0,
          earlyBird: eventData.price?.earlyBird || 0
        },
        images: eventData.images || [],
        tags: eventData.tags || [],
        features: eventData.features || [],
        performers: eventData.performers || [],
        sponsors: eventData.sponsors || [],
        socialLinks: eventData.socialLinks || {},
        status: eventData.status || 'draft',
        isPrivate: eventData.isPrivate || false,
        requiresApproval: eventData.requiresApproval || false,
        allowGuestList: eventData.allowGuestList || true,
        maxGuestsPerUser: eventData.maxGuestsPerUser || 5,
        cancellationPolicy: eventData.cancellationPolicy || 'standard',
        specialInstructions: eventData.specialInstructions || '',
        attendeeCount: 0,
        interestedCount: 0,
        checkInCount: 0,
        revenue: 0,
        isRecurring: eventData.isRecurring || false,
        recurringPattern: eventData.recurringPattern || null,
        parentEventId: eventData.parentEventId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save event
      this.events.set(event.id, event);
      await this.saveEvents();

      // Update venue events
      await this.updateVenueEvents(event.venueId, event);

      // Update metrics
      await this.updateEventMetrics();

      await this.auditService.logEvent('event_created', {
        event_id: event.id,
        venue_id: event.venueId,
        organizer_id: event.organizerId,
        title: event.title,
        category: event.categoryId,
        type: event.eventType,
        start_date: event.startDate,
        capacity: event.capacity,
        status: event.status,
        timestamp: new Date().toISOString()
      });

      this.emit('eventCreated', event);
      return event;
    } catch (error) {
      console.error('Failed to create event:', error);
      throw error;
    }
  }

  async updateEvent(eventId, updateData) {
    try {
      const event = this.events.get(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      // Validate update data
      const validation = this.validateEventUpdateData(updateData);
      if (!validation.isValid) {
        throw new Error(`Invalid update data: ${validation.errors.join(', ')}`);
      }

      // Update event
      const updatedEvent = {
        ...event,
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      this.events.set(eventId, updatedEvent);
      await this.saveEvents();

      // Update venue events if venue changed
      if (updateData.venueId && updateData.venueId !== event.venueId) {
        await this.updateVenueEvents(updateData.venueId, updatedEvent);
      }

      await this.auditService.logEvent('event_updated', {
        event_id: eventId,
        venue_id: updatedEvent.venueId,
        organizer_id: updatedEvent.organizerId,
        changes: Object.keys(updateData),
        timestamp: new Date().toISOString()
      });

      this.emit('eventUpdated', updatedEvent);
      return updatedEvent;
    } catch (error) {
      console.error('Failed to update event:', error);
      throw error;
    }
  }

  async cancelEvent(eventId, organizerId, reason = '') {
    try {
      const event = this.events.get(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      if (event.organizerId !== organizerId) {
        throw new Error('Unauthorized: Only event organizer can cancel the event');
      }

      if (event.status === 'cancelled') {
        throw new Error('Event is already cancelled');
      }

      // Update event status
      const cancelledEvent = {
        ...event,
        status: 'cancelled',
        cancellationReason: reason,
        cancelledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.events.set(eventId, cancelledEvent);
      await this.saveEvents();

      // Process refunds for ticket holders
      await this.processEventCancellationRefunds(eventId);

      // Notify attendees
      await this.notifyEventCancellation(eventId, reason);

      await this.auditService.logEvent('event_cancelled', {
        event_id: eventId,
        venue_id: event.venueId,
        organizer_id: organizerId,
        reason: reason,
        attendees_affected: event.attendeeCount,
        timestamp: new Date().toISOString()
      });

      this.emit('eventCancelled', { eventId, reason, attendeeCount: event.attendeeCount });
      return cancelledEvent;
    } catch (error) {
      console.error('Failed to cancel event:', error);
      throw error;
    }
  }

  async rsvpToEvent(eventId, userId, rsvpType = 'attending', guestCount = 0) {
    try {
      const event = this.events.get(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      if (event.status !== 'published') {
        throw new Error('Cannot RSVP to unpublished event');
      }

      // Check capacity
      if (rsvpType === 'attending' && this.isEventAtCapacity(event, guestCount + 1)) {
        throw new Error('Event is at capacity');
      }

      // Check for existing RSVP
      const existingRSVP = await this.getUserEventRSVP(eventId, userId);
      
      const rsvp = {
        id: existingRSVP ? existingRSVP.id : `rsvp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        eventId: eventId,
        userId: userId,
        rsvpType: rsvpType, // attending, interested, maybe, not_attending
        guestCount: guestCount,
        checkedIn: false,
        checkInTime: null,
        ticketIds: [],
        specialRequests: '',
        dietaryRestrictions: '',
        createdAt: existingRSVP ? existingRSVP.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Update or create attendee record
      if (existingRSVP) {
        this.eventAttendees.set(rsvp.id, rsvp);
      } else {
        this.eventAttendees.set(rsvp.id, rsvp);
      }
      
      await this.saveEventAttendees();

      // Update event counters
      await this.updateEventAttendanceCounters(eventId);

      // Update user events
      await this.updateUserEvents(userId, event, rsvp);

      await this.auditService.logEvent('event_rsvp', {
        event_id: eventId,
        user_id: userId,
        rsvp_type: rsvpType,
        guest_count: guestCount,
        is_update: !!existingRSVP,
        timestamp: new Date().toISOString()
      });

      this.emit('eventRSVP', { event, rsvp, isUpdate: !!existingRSVP });
      return rsvp;
    } catch (error) {
      console.error('Failed to RSVP to event:', error);
      throw error;
    }
  }

  async purchaseEventTicket(eventId, userId, ticketData) {
    try {
      const event = this.events.get(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      if (!event.ticketRequired) {
        throw new Error('Event does not require tickets');
      }

      if (event.status !== 'published') {
        throw new Error('Cannot purchase tickets for unpublished event');
      }

      // Validate ticket data
      const validation = this.validateTicketPurchase(ticketData);
      if (!validation.isValid) {
        throw new Error(`Invalid ticket data: ${validation.errors.join(', ')}`);
      }

      // Check availability
      const availability = await this.checkTicketAvailability(eventId, ticketData.ticketType, ticketData.quantity);
      if (!availability.available) {
        throw new Error(`Tickets not available: ${availability.reason}`);
      }

      const ticket = {
        id: `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        eventId: eventId,
        userId: userId,
        ticketType: ticketData.ticketType,
        quantity: ticketData.quantity,
        price: ticketData.price,
        totalAmount: ticketData.price * ticketData.quantity,
        fees: this.calculateTicketFees(ticketData.price * ticketData.quantity),
        grandTotal: 0, // Will be calculated with fees
        purchaseMethod: ticketData.purchaseMethod || 'app',
        paymentStatus: 'pending',
        paymentId: null,
        qrCode: this.generateTicketQRCode(),
        transferable: this.isTicketTransferable(ticketData.ticketType),
        transferHistory: [],
        isValid: true,
        usedAt: null,
        checkedInAt: null,
        refundStatus: null,
        refundAmount: 0,
        purchaseDate: new Date().toISOString(),
        validFrom: event.startDate,
        validUntil: event.endDate,
        specialInstructions: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      ticket.grandTotal = ticket.totalAmount + ticket.fees;

      // Save ticket
      this.eventTickets.set(ticket.id, ticket);
      await this.saveEventTickets();

      // Create RSVP automatically
      await this.rsvpToEvent(eventId, userId, 'attending', ticketData.quantity - 1);

      // Update event revenue (will be updated when payment is confirmed)
      // await this.updateEventRevenue(eventId, ticket.grandTotal);

      await this.auditService.logEvent('event_ticket_purchased', {
        event_id: eventId,
        user_id: userId,
        ticket_id: ticket.id,
        ticket_type: ticket.ticketType,
        quantity: ticket.quantity,
        total_amount: ticket.grandTotal,
        timestamp: new Date().toISOString()
      });

      this.emit('ticketPurchased', { event, ticket });
      return ticket;
    } catch (error) {
      console.error('Failed to purchase event ticket:', error);
      throw error;
    }
  }

  async checkInToEvent(eventId, userId, checkInData = {}) {
    try {
      const event = this.events.get(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      // Check if event is active
      const now = new Date();
      const eventStart = new Date(`${event.startDate}T${event.startTime}`);
      const eventEnd = new Date(`${event.endDate}T${event.endTime}`);
      
      if (now < eventStart || now > eventEnd) {
        throw new Error('Event is not currently active for check-in');
      }

      // Get user's RSVP or ticket
      const rsvp = await this.getUserEventRSVP(eventId, userId);
      const tickets = await this.getUserEventTickets(eventId, userId);

      if (!rsvp && tickets.length === 0) {
        throw new Error('User has no RSVP or tickets for this event');
      }

      if (rsvp && rsvp.checkedIn) {
        throw new Error('User has already checked in to this event');
      }

      // Update RSVP check-in status
      if (rsvp) {
        rsvp.checkedIn = true;
        rsvp.checkInTime = new Date().toISOString();
        rsvp.updatedAt = new Date().toISOString();
        this.eventAttendees.set(rsvp.id, rsvp);
      }

      // Update ticket check-in status
      for (const ticket of tickets) {
        if (!ticket.checkedInAt) {
          ticket.checkedInAt = new Date().toISOString();
          ticket.updatedAt = new Date().toISOString();
          this.eventTickets.set(ticket.id, ticket);
        }
      }

      await this.saveEventAttendees();
      await this.saveEventTickets();

      // Update event check-in counter
      const updatedEvent = { ...event };
      updatedEvent.checkInCount = (updatedEvent.checkInCount || 0) + 1;
      updatedEvent.updatedAt = new Date().toISOString();
      this.events.set(eventId, updatedEvent);
      await this.saveEvents();

      const checkIn = {
        eventId: eventId,
        userId: userId,
        checkInTime: new Date().toISOString(),
        method: checkInData.method || 'app',
        location: checkInData.location || null,
        staffId: checkInData.staffId || null
      };

      await this.auditService.logEvent('event_check_in', {
        event_id: eventId,
        user_id: userId,
        check_in_time: checkIn.checkInTime,
        method: checkIn.method,
        staff_id: checkIn.staffId,
        timestamp: new Date().toISOString()
      });

      this.emit('eventCheckIn', { event: updatedEvent, checkIn, rsvp, tickets });
      return checkIn;
    } catch (error) {
      console.error('Failed to check in to event:', error);
      throw error;
    }
  }

  async searchEvents(query = '', filters = {}, options = {}) {
    try {
      let events = Array.from(this.events.values())
        .filter(event => event.status === 'published' || options.includeAllStatuses);

      // Apply text search
      if (query && query.trim() !== '') {
        events = this.performEventTextSearch(events, query.trim());
      }

      // Apply filters
      if (Object.keys(filters).length > 0) {
        events = this.applyEventFilters(events, filters);
      }

      // Apply sorting
      const sortBy = options.sortBy || 'date_asc';
      events = this.sortEvents(events, sortBy);

      // Apply pagination
      const page = options.page || 1;
      const limit = options.limit || 20;
      const startIndex = (page - 1) * limit;
      const paginatedEvents = events.slice(startIndex, startIndex + limit);

      return {
        events: paginatedEvents,
        total: events.length,
        page: page,
        limit: limit,
        totalPages: Math.ceil(events.length / limit),
        query: query,
        filters: filters,
        sortBy: sortBy
      };
    } catch (error) {
      console.error('Failed to search events:', error);
      throw error;
    }
  }

  async getEventsByVenue(venueId, options = {}) {
    try {
      const now = new Date();
      let events = Array.from(this.events.values())
        .filter(event => 
          event.venueId === venueId &&
          (options.includeAllStatuses || event.status === 'published')
        );

      // Filter by time period
      if (options.timeFilter === 'upcoming') {
        events = events.filter(event => new Date(event.startDate) >= now);
      } else if (options.timeFilter === 'past') {
        events = events.filter(event => new Date(event.endDate) < now);
      }

      // Apply sorting
      const sortBy = options.sortBy || 'date_asc';
      events = this.sortEvents(events, sortBy);

      return events;
    } catch (error) {
      console.error('Failed to get events by venue:', error);
      return [];
    }
  }

  async getUserEventRSVP(eventId, userId) {
    try {
      for (const [id, attendee] of this.eventAttendees) {
        if (attendee.eventId === eventId && attendee.userId === userId) {
          return attendee;
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to get user event RSVP:', error);
      return null;
    }
  }

  async getUserEventTickets(eventId, userId) {
    try {
      return Array.from(this.eventTickets.values())
        .filter(ticket => ticket.eventId === eventId && ticket.userId === userId);
    } catch (error) {
      console.error('Failed to get user event tickets:', error);
      return [];
    }
  }

  performEventTextSearch(events, query) {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    
    return events.filter(event => {
      const searchableText = [
        event.title,
        event.description,
        ...event.tags,
        ...event.performers.map(p => p.name || p),
        event.eventType
      ].join(' ').toLowerCase();

      return searchTerms.every(term => searchableText.includes(term));
    });
  }

  applyEventFilters(events, filters) {
    return events.filter(event => {
      // Category filter
      if (filters.categories && filters.categories.length > 0) {
        if (!filters.categories.includes(event.categoryId)) {
          return false;
        }
      }

      // Event type filter
      if (filters.eventTypes && filters.eventTypes.length > 0) {
        if (!filters.eventTypes.includes(event.eventType)) {
          return false;
        }
      }

      // Date range filter
      if (filters.startDate && new Date(event.startDate) < new Date(filters.startDate)) {
        return false;
      }

      if (filters.endDate && new Date(event.startDate) > new Date(filters.endDate)) {
        return false;
      }

      // Price filter
      if (filters.maxPrice !== undefined) {
        const minPrice = Math.min(event.price.general, event.price.vip, event.price.earlyBird);
        if (minPrice > filters.maxPrice) {
          return false;
        }
      }

      if (filters.minPrice !== undefined) {
        const maxPrice = Math.max(event.price.general, event.price.vip, event.price.earlyBird);
        if (maxPrice < filters.minPrice) {
          return false;
        }
      }

      // Age filter
      if (filters.maxAge !== undefined) {
        if (event.minAge > filters.maxAge) {
          return false;
        }
      }

      // Venue filter
      if (filters.venueIds && filters.venueIds.length > 0) {
        if (!filters.venueIds.includes(event.venueId)) {
          return false;
        }
      }

      // Free events filter
      if (filters.freeOnly === true) {
        const isFree = event.price.general === 0 && event.price.vip === 0 && event.price.earlyBird === 0;
        if (!isFree) {
          return false;
        }
      }

      return true;
    });
  }

  sortEvents(events, sortBy) {
    switch (sortBy) {
      case 'date_asc':
        return events.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
      
      case 'date_desc':
        return events.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
      
      case 'popularity':
        return events.sort((a, b) => (b.attendeeCount + b.interestedCount) - (a.attendeeCount + a.interestedCount));
      
      case 'price_low':
        return events.sort((a, b) => {
          const priceA = Math.min(a.price.general || Infinity, a.price.vip || Infinity, a.price.earlyBird || Infinity);
          const priceB = Math.min(b.price.general || Infinity, b.price.vip || Infinity, b.price.earlyBird || Infinity);
          return priceA - priceB;
        });
      
      case 'price_high':
        return events.sort((a, b) => {
          const priceA = Math.max(a.price.general || 0, a.price.vip || 0, a.price.earlyBird || 0);
          const priceB = Math.max(b.price.general || 0, b.price.vip || 0, b.price.earlyBird || 0);
          return priceB - priceA;
        });
      
      case 'title':
        return events.sort((a, b) => a.title.localeCompare(b.title));
      
      default:
        return events;
    }
  }

  validateEventData(eventData) {
    const errors = [];

    if (!eventData.title || eventData.title.trim().length === 0) {
      errors.push('Event title is required');
    }

    if (!eventData.description || eventData.description.trim().length === 0) {
      errors.push('Event description is required');
    }

    if (!eventData.venueId) {
      errors.push('Venue ID is required');
    }

    if (!eventData.organizerId) {
      errors.push('Organizer ID is required');
    }

    if (!eventData.startDate || !eventData.startTime) {
      errors.push('Event start date and time are required');
    }

    if (!eventData.endDate || !eventData.endTime) {
      errors.push('Event end date and time are required');
    }

    if (eventData.startDate && eventData.endDate) {
      const startDateTime = new Date(`${eventData.startDate}T${eventData.startTime}`);
      const endDateTime = new Date(`${eventData.endDate}T${eventData.endTime}`);
      
      if (startDateTime >= endDateTime) {
        errors.push('Event end time must be after start time');
      }

      const now = new Date();
      if (startDateTime <= now) {
        errors.push('Event start time must be in the future');
      }

      const maxAdvanceDate = new Date(now.getTime() + this.eventConfig.maxAdvanceBookingDays * 24 * 60 * 60 * 1000);
      if (startDateTime > maxAdvanceDate) {
        errors.push(`Event cannot be scheduled more than ${this.eventConfig.maxAdvanceBookingDays} days in advance`);
      }
    }

    if (!eventData.capacity || eventData.capacity < 1) {
      errors.push('Event capacity must be at least 1');
    }

    if (eventData.minAge && (eventData.minAge < 0 || eventData.minAge > 100)) {
      errors.push('Minimum age must be between 0 and 100');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  validateEventUpdateData(updateData) {
    const errors = [];

    if (updateData.title !== undefined && updateData.title.trim().length === 0) {
      errors.push('Event title cannot be empty');
    }

    if (updateData.description !== undefined && updateData.description.trim().length === 0) {
      errors.push('Event description cannot be empty');
    }

    if (updateData.capacity !== undefined && updateData.capacity < 1) {
      errors.push('Event capacity must be at least 1');
    }

    if (updateData.minAge !== undefined && (updateData.minAge < 0 || updateData.minAge > 100)) {
      errors.push('Minimum age must be between 0 and 100');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  validateTicketPurchase(ticketData) {
    const errors = [];

    if (!ticketData.ticketType) {
      errors.push('Ticket type is required');
    }

    if (!ticketData.quantity || ticketData.quantity < 1) {
      errors.push('Ticket quantity must be at least 1');
    }

    if (ticketData.quantity > 10) {
      errors.push('Maximum 10 tickets per purchase');
    }

    if (!ticketData.price || ticketData.price < 0) {
      errors.push('Valid ticket price is required');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  async checkTicketAvailability(eventId, ticketType, quantity) {
    try {
      const event = this.events.get(eventId);
      if (!event) {
        return { available: false, reason: 'Event not found' };
      }

      // Get sold tickets for this event and type
      const soldTickets = Array.from(this.eventTickets.values())
        .filter(ticket => 
          ticket.eventId === eventId && 
          ticket.ticketType === ticketType &&
          ticket.paymentStatus === 'completed'
        )
        .reduce((total, ticket) => total + ticket.quantity, 0);

      const availableCapacity = event.capacity - soldTickets;
      const available = availableCapacity >= quantity;

      return {
        available: available,
        availableCapacity: availableCapacity,
        reason: available ? null : 'Insufficient tickets available'
      };
    } catch (error) {
      console.error('Failed to check ticket availability:', error);
      return { available: false, reason: 'Error checking availability' };
    }
  }

  isEventAtCapacity(event, additionalAttendees = 0) {
    const totalAttendees = event.attendeeCount + additionalAttendees;
    const capacityWithOverbook = event.capacity + (event.capacity * this.eventConfig.maxCapacityOverbook / 100);
    return totalAttendees >= capacityWithOverbook;
  }

  isTicketTransferable(ticketType) {
    const ticketTypeInfo = this.ticketTypes.find(type => type.id === ticketType);
    return ticketTypeInfo ? ticketTypeInfo.transferable : false;
  }

  calculateTicketFees(amount) {
    // Basic fee calculation - 5% + $1
    return Math.round((amount * 0.05 + 1) * 100) / 100;
  }

  generateTicketQRCode() {
    return `QR_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
  }

  async processEventCancellationRefunds(eventId) {
    try {
      const tickets = Array.from(this.eventTickets.values())
        .filter(ticket => ticket.eventId === eventId && ticket.paymentStatus === 'completed');

      for (const ticket of tickets) {
        ticket.refundStatus = 'processing';
        ticket.refundAmount = ticket.grandTotal;
        ticket.updatedAt = new Date().toISOString();
        this.eventTickets.set(ticket.id, ticket);
      }

      await this.saveEventTickets();

      // In real implementation, would integrate with payment processor
      await this.auditService.logEvent('event_cancellation_refunds_initiated', {
        event_id: eventId,
        tickets_count: tickets.length,
        total_refund_amount: tickets.reduce((sum, ticket) => sum + ticket.refundAmount, 0),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to process cancellation refunds:', error);
    }
  }

  async notifyEventCancellation(eventId, reason) {
    try {
      // Get all attendees for this event
      const attendees = Array.from(this.eventAttendees.values())
        .filter(attendee => attendee.eventId === eventId);

      // In real implementation, would send notifications
      await this.auditService.logEvent('event_cancellation_notifications_sent', {
        event_id: eventId,
        attendees_notified: attendees.length,
        reason: reason,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to notify event cancellation:', error);
    }
  }

  async updateVenueEvents(venueId, event) {
    try {
      if (!this.venueEvents.has(venueId)) {
        this.venueEvents.set(venueId, {
          venueId: venueId,
          events: [],
          totalEvents: 0,
          upcomingEvents: 0,
          totalAttendees: 0,
          updatedAt: new Date().toISOString()
        });
      }

      const venueEventData = this.venueEvents.get(venueId);

      // Add event if not already present
      if (!venueEventData.events.includes(event.id)) {
        venueEventData.events.push(event.id);
      }

      // Recalculate metrics
      const allVenueEvents = venueEventData.events
        .map(eventId => this.events.get(eventId))
        .filter(e => e);

      const now = new Date();
      venueEventData.totalEvents = allVenueEvents.length;
      venueEventData.upcomingEvents = allVenueEvents
        .filter(e => new Date(e.startDate) >= now && e.status === 'published').length;
      venueEventData.totalAttendees = allVenueEvents
        .reduce((sum, e) => sum + e.attendeeCount, 0);
      venueEventData.updatedAt = new Date().toISOString();

      await this.saveVenueEvents();
    } catch (error) {
      console.error('Failed to update venue events:', error);
    }
  }

  async updateUserEvents(userId, event, rsvp) {
    try {
      if (!this.userEvents.has(userId)) {
        this.userEvents.set(userId, {
          userId: userId,
          attending: [],
          interested: [],
          organizing: [],
          totalEvents: 0,
          updatedAt: new Date().toISOString()
        });
      }

      const userEventData = this.userEvents.get(userId);

      // Update based on RSVP type
      if (rsvp.rsvpType === 'attending') {
        if (!userEventData.attending.includes(event.id)) {
          userEventData.attending.push(event.id);
        }
        // Remove from interested if present
        userEventData.interested = userEventData.interested.filter(id => id !== event.id);
      } else if (rsvp.rsvpType === 'interested') {
        if (!userEventData.interested.includes(event.id)) {
          userEventData.interested.push(event.id);
        }
        // Remove from attending if present
        userEventData.attending = userEventData.attending.filter(id => id !== event.id);
      }

      userEventData.totalEvents = userEventData.attending.length + userEventData.interested.length;
      userEventData.updatedAt = new Date().toISOString();

      await this.saveUserEvents();
    } catch (error) {
      console.error('Failed to update user events:', error);
    }
  }

  async updateEventAttendanceCounters(eventId) {
    try {
      const event = this.events.get(eventId);
      if (!event) return;

      const attendees = Array.from(this.eventAttendees.values())
        .filter(attendee => attendee.eventId === eventId);

      const attendingCount = attendees.filter(a => a.rsvpType === 'attending').length;
      const interestedCount = attendees.filter(a => a.rsvpType === 'interested').length;

      event.attendeeCount = attendingCount;
      event.interestedCount = interestedCount;
      event.updatedAt = new Date().toISOString();

      this.events.set(eventId, event);
      await this.saveEvents();
    } catch (error) {
      console.error('Failed to update event attendance counters:', error);
    }
  }

  async updateEventMetrics() {
    try {
      const allEvents = Array.from(this.events.values());
      const now = new Date();

      this.eventMetrics.totalEvents = allEvents.length;
      this.eventMetrics.upcomingEvents = allEvents.filter(e => 
        new Date(e.startDate) >= now && e.status === 'published'
      ).length;
      this.eventMetrics.pastEvents = allEvents.filter(e => 
        new Date(e.endDate) < now
      ).length;

      this.eventMetrics.totalAttendees = allEvents.reduce((sum, e) => sum + e.attendeeCount, 0);
      this.eventMetrics.averageAttendance = allEvents.length > 0 ? 
        this.eventMetrics.totalAttendees / allEvents.length : 0;

      // Calculate popular categories
      const categoryCount = {};
      allEvents.forEach(event => {
        categoryCount[event.categoryId] = (categoryCount[event.categoryId] || 0) + 1;
      });
      this.eventMetrics.popularCategories = categoryCount;

      // Calculate popular venues
      const venueCount = {};
      allEvents.forEach(event => {
        venueCount[event.venueId] = (venueCount[event.venueId] || 0) + 1;
      });
      this.eventMetrics.popularVenues = venueCount;

      // Calculate ticket metrics
      const allTickets = Array.from(this.eventTickets.values());
      this.eventMetrics.totalTicketsSold = allTickets
        .filter(t => t.paymentStatus === 'completed')
        .reduce((sum, t) => sum + t.quantity, 0);

      this.eventMetrics.totalRevenue = allTickets
        .filter(t => t.paymentStatus === 'completed')
        .reduce((sum, t) => sum + t.grandTotal, 0);

      await this.saveEventMetrics();
    } catch (error) {
      console.error('Failed to update event metrics:', error);
    }
  }

  async saveEvents() {
    try {
      const eventList = Array.from(this.events.values());
      await this.storageService.setItem('events', eventList);
    } catch (error) {
      console.error('Failed to save events:', error);
    }
  }

  async saveVenueEvents() {
    try {
      const venueEventList = Array.from(this.venueEvents.values());
      await this.storageService.setItem('venue_events', venueEventList);
    } catch (error) {
      console.error('Failed to save venue events:', error);
    }
  }

  async saveUserEvents() {
    try {
      const userEventList = Array.from(this.userEvents.values());
      await this.storageService.setItem('user_events', userEventList);
    } catch (error) {
      console.error('Failed to save user events:', error);
    }
  }

  async saveEventCategories() {
    try {
      const categoryList = Array.from(this.eventCategories.values());
      await this.storageService.setItem('event_categories', categoryList);
    } catch (error) {
      console.error('Failed to save event categories:', error);
    }
  }

  async saveEventAttendees() {
    try {
      const attendeeList = Array.from(this.eventAttendees.values());
      await this.storageService.setItem('event_attendees', attendeeList);
    } catch (error) {
      console.error('Failed to save event attendees:', error);
    }
  }

  async saveEventPromoters() {
    try {
      const promoterList = Array.from(this.eventPromoters.values());
      await this.storageService.setItem('event_promoters', promoterList);
    } catch (error) {
      console.error('Failed to save event promoters:', error);
    }
  }

  async saveEventTickets() {
    try {
      const ticketList = Array.from(this.eventTickets.values());
      await this.storageService.setItem('event_tickets', ticketList);
    } catch (error) {
      console.error('Failed to save event tickets:', error);
    }
  }

  async saveEventMetrics() {
    try {
      await this.storageService.setItem('event_metrics', this.eventMetrics);
    } catch (error) {
      console.error('Failed to save event metrics:', error);
    }
  }

  getEvents() {
    return Array.from(this.events.values());
  }

  getEventById(eventId) {
    return this.events.get(eventId);
  }

  getEventStatuses() {
    return this.eventStatuses;
  }

  getEventTypes() {
    return this.eventTypes;
  }

  getTicketTypes() {
    return this.ticketTypes;
  }

  getEventCategories() {
    return Array.from(this.eventCategories.values());
  }

  getEventMetrics() {
    return this.eventMetrics;
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
      this.events.clear();
      this.venueEvents.clear();
      this.userEvents.clear();
      this.eventCategories.clear();
      this.eventAttendees.clear();
      this.eventPromoters.clear();
      this.eventTickets.clear();
      this.initialized = false;
      
      await this.auditService.logEvent('event_service_cleanup', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to cleanup EventService:', error);
    }
  }
}

export { EventService };