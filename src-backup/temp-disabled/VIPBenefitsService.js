import { LocalStorageService } from './LocalStorageService.js';
import { AuditLogService } from './AuditLogService.js';

class VIPBenefitsService {
  constructor() {
    if (VIPBenefitsService.instance) {
      return VIPBenefitsService.instance;
    }

    this.isInitialized = false;
    this.listeners = new Map();
    this.metrics = {
      totalVIPMembers: 0,
      benefitsRedeemed: 0,
      totalPointsEarned: 0,
      totalPointsRedeemed: 0,
      averageSpendPerVIP: 0,
      tierDistribution: {},
      benefitPopularity: {},
      retentionRate: 0,
      upgradeRate: 0
    };

    this.vipMembers = new Map();
    this.vipTiers = new Map();
    this.benefits = new Map();
    this.rewardPrograms = new Map();
    this.loyaltyPoints = new Map();
    this.exclusiveOffers = new Map();
    this.tierRequirements = new Map();
    this.benefitRedemptions = new Map();

    VIPBenefitsService.instance = this;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      this.storage = await LocalStorageService.getInstance();
      this.auditLog = await AuditLogService.getInstance();

      await this.initializeVIPTiers();
      await this.initializeBenefits();
      await this.initializeRewardPrograms();
      await this.loadVIPMembers();
      await this.loadLoyaltyPoints();
      await this.loadExclusiveOffers();
      await this.loadMetrics();

      this.startMetricsCollection();
      this.startAutomaticProcessing();
      this.isInitialized = true;

      await this.auditLog.log('vip_benefits_service_initialized', {
        component: 'VIPBenefitsService',
        timestamp: new Date().toISOString(),
        tiersCount: this.vipTiers.size,
        benefitsCount: this.benefits.size,
        vipMembersCount: this.vipMembers.size
      });

      this.emit('initialized');
    } catch (error) {
      console.error('Failed to initialize VIPBenefitsService:', error);
      throw error;
    }
  }

  async initializeVIPTiers() {
    this.vipTiers.set('bronze', {
      id: 'bronze',
      name: 'Bronze VIP',
      level: 1,
      minSpendThreshold: 500,
      minVisitsThreshold: 5,
      benefits: ['priority_support', 'early_access'],
      pointsMultiplier: 1.2,
      discountPercentage: 5,
      color: '#CD7F32',
      icon: 'bronze_medal',
      description: 'Entry level VIP with basic perks'
    });

    this.vipTiers.set('silver', {
      id: 'silver',
      name: 'Silver VIP',
      level: 2,
      minSpendThreshold: 1500,
      minVisitsThreshold: 15,
      benefits: ['priority_support', 'early_access', 'exclusive_events', 'free_upgrades'],
      pointsMultiplier: 1.5,
      discountPercentage: 10,
      color: '#C0C0C0',
      icon: 'silver_medal',
      description: 'Mid-tier VIP with enhanced benefits'
    });

    this.vipTiers.set('gold', {
      id: 'gold',
      name: 'Gold VIP',
      level: 3,
      minSpendThreshold: 3000,
      minVisitsThreshold: 30,
      benefits: ['priority_support', 'early_access', 'exclusive_events', 'free_upgrades', 'personal_concierge'],
      pointsMultiplier: 2.0,
      discountPercentage: 15,
      color: '#FFD700',
      icon: 'gold_medal',
      description: 'Premium VIP with extensive privileges'
    });

    this.vipTiers.set('platinum', {
      id: 'platinum',
      name: 'Platinum VIP',
      level: 4,
      minSpendThreshold: 7500,
      minVisitsThreshold: 75,
      benefits: ['priority_support', 'early_access', 'exclusive_events', 'free_upgrades', 'personal_concierge', 'luxury_amenities'],
      pointsMultiplier: 3.0,
      discountPercentage: 20,
      color: '#E5E4E2',
      icon: 'platinum_medal',
      description: 'Elite VIP with luxury treatment'
    });

    this.vipTiers.set('diamond', {
      id: 'diamond',
      name: 'Diamond VIP',
      level: 5,
      minSpendThreshold: 15000,
      minVisitsThreshold: 150,
      benefits: ['priority_support', 'early_access', 'exclusive_events', 'free_upgrades', 'personal_concierge', 'luxury_amenities', 'lifetime_benefits'],
      pointsMultiplier: 5.0,
      discountPercentage: 25,
      color: '#B9F2FF',
      icon: 'diamond',
      description: 'Ultimate VIP with unparalleled privileges'
    });
  }

  async initializeBenefits() {
    this.benefits.set('priority_support', {
      id: 'priority_support',
      name: 'Priority Customer Support',
      description: 'Skip the queue with dedicated VIP support line',
      type: 'service',
      cost: 0,
      isActive: true,
      requiredTier: 'bronze'
    });

    this.benefits.set('early_access', {
      id: 'early_access',
      name: 'Early Event Access',
      description: 'Get first access to exclusive events and reservations',
      type: 'access',
      cost: 0,
      isActive: true,
      requiredTier: 'bronze'
    });

    this.benefits.set('exclusive_events', {
      id: 'exclusive_events',
      name: 'Exclusive VIP Events',
      description: 'Access to members-only parties and gatherings',
      type: 'event',
      cost: 0,
      isActive: true,
      requiredTier: 'silver'
    });

    this.benefits.set('free_upgrades', {
      id: 'free_upgrades',
      name: 'Complimentary Upgrades',
      description: 'Free table upgrades and premium seating when available',
      type: 'upgrade',
      cost: 0,
      isActive: true,
      requiredTier: 'silver'
    });

    this.benefits.set('personal_concierge', {
      id: 'personal_concierge',
      name: 'Personal Concierge Service',
      description: 'Dedicated concierge for reservations and special requests',
      type: 'service',
      cost: 0,
      isActive: true,
      requiredTier: 'gold'
    });

    this.benefits.set('luxury_amenities', {
      id: 'luxury_amenities',
      name: 'Luxury Amenities',
      description: 'Complimentary premium drinks and VIP lounge access',
      type: 'amenity',
      cost: 0,
      isActive: true,
      requiredTier: 'platinum'
    });

    this.benefits.set('lifetime_benefits', {
      id: 'lifetime_benefits',
      name: 'Lifetime Privileges',
      description: 'Permanent VIP status with guaranteed benefits',
      type: 'status',
      cost: 0,
      isActive: true,
      requiredTier: 'diamond'
    });
  }

  async initializeRewardPrograms() {
    this.rewardPrograms.set('points_for_spend', {
      id: 'points_for_spend',
      name: 'Spend & Earn Points',
      description: 'Earn points for every dollar spent',
      pointsPerDollar: 1,
      isActive: true,
      multiplierByTier: {
        bronze: 1.2,
        silver: 1.5,
        gold: 2.0,
        platinum: 3.0,
        diamond: 5.0
      }
    });

    this.rewardPrograms.set('birthday_bonus', {
      id: 'birthday_bonus',
      name: 'Birthday Bonus',
      description: 'Special points bonus on your birthday month',
      bonusPoints: 500,
      isActive: true
    });

    this.rewardPrograms.set('referral_rewards', {
      id: 'referral_rewards',
      name: 'Referral Rewards',
      description: 'Earn points for successful referrals',
      pointsPerReferral: 1000,
      isActive: true
    });
  }

  async enrollUserInVIP(userId, userSpendingData) {
    try {
      const eligibleTier = await this.calculateEligibleTier(userSpendingData);
      
      if (!eligibleTier) {
        throw new Error('User does not meet minimum VIP requirements');
      }

      const vipMemberId = `vip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const vipMember = {
        id: vipMemberId,
        userId,
        tierId: eligibleTier.id,
        tierName: eligibleTier.name,
        enrolledAt: new Date().toISOString(),
        totalSpent: userSpendingData.totalSpent || 0,
        totalVisits: userSpendingData.totalVisits || 0,
        pointsBalance: 0,
        lifetimePointsEarned: 0,
        benefitsUsed: [],
        status: 'active',
        nextTierRequirement: this.getNextTierRequirement(eligibleTier.id),
        anniversaryDate: new Date().toISOString(),
        preferences: {}
      };

      this.vipMembers.set(userId, vipMember);
      await this.storage.set(`vip_member_${userId}`, vipMember);

      const welcomeBonus = 1000 * eligibleTier.level;
      await this.awardPoints(userId, welcomeBonus, 'vip_welcome_bonus');

      this.metrics.totalVIPMembers++;
      this.updateTierDistribution(eligibleTier.id, 1);

      await this.auditLog.log('vip_enrollment', {
        userId,
        vipMemberId,
        tierId: eligibleTier.id,
        welcomeBonus,
        timestamp: new Date().toISOString()
      });

      this.emit('vipEnrolled', { userId, vipMember, tier: eligibleTier });
      return vipMember;
    } catch (error) {
      console.error('Failed to enroll user in VIP:', error);
      throw error;
    }
  }

  async calculateEligibleTier(userSpendingData) {
    const tiers = Array.from(this.vipTiers.values()).sort((a, b) => b.level - a.level);
    
    for (const tier of tiers) {
      if (userSpendingData.totalSpent >= tier.minSpendThreshold && 
          userSpendingData.totalVisits >= tier.minVisitsThreshold) {
        return tier;
      }
    }
    
    return null;
  }

  getNextTierRequirement(currentTierId) {
    const currentTier = this.vipTiers.get(currentTierId);
    if (!currentTier) return null;

    const nextTier = Array.from(this.vipTiers.values()).find(tier => tier.level === currentTier.level + 1);
    if (!nextTier) return null;

    return {
      tierId: nextTier.id,
      tierName: nextTier.name,
      spendRequired: nextTier.minSpendThreshold,
      visitsRequired: nextTier.minVisitsThreshold
    };
  }

  async checkTierUpgrade(userId, newSpendingData) {
    try {
      const vipMember = this.vipMembers.get(userId);
      if (!vipMember) return false;

      const currentTier = this.vipTiers.get(vipMember.tierId);
      const eligibleTier = await this.calculateEligibleTier(newSpendingData);

      if (eligibleTier && eligibleTier.level > currentTier.level) {
        const oldTierId = vipMember.tierId;
        vipMember.tierId = eligibleTier.id;
        vipMember.tierName = eligibleTier.name;
        vipMember.totalSpent = newSpendingData.totalSpent;
        vipMember.totalVisits = newSpendingData.totalVisits;
        vipMember.nextTierRequirement = this.getNextTierRequirement(eligibleTier.id);

        await this.storage.set(`vip_member_${userId}`, vipMember);

        const upgradeBonus = (eligibleTier.level - currentTier.level) * 2000;
        await this.awardPoints(userId, upgradeBonus, 'tier_upgrade_bonus');

        this.updateTierDistribution(oldTierId, -1);
        this.updateTierDistribution(eligibleTier.id, 1);
        this.metrics.upgradeRate++;

        await this.auditLog.log('tier_upgraded', {
          userId,
          oldTier: oldTierId,
          newTier: eligibleTier.id,
          upgradeBonus,
          timestamp: new Date().toISOString()
        });

        this.emit('tierUpgraded', { userId, vipMember, oldTier: currentTier, newTier: eligibleTier });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to check tier upgrade:', error);
      return false;
    }
  }

  async awardPoints(userId, points, reason) {
    try {
      const vipMember = this.vipMembers.get(userId);
      if (!vipMember) {
        throw new Error('User is not a VIP member');
      }

      const tier = this.vipTiers.get(vipMember.tierId);
      const multipliedPoints = Math.floor(points * tier.pointsMultiplier);

      vipMember.pointsBalance += multipliedPoints;
      vipMember.lifetimePointsEarned += multipliedPoints;

      await this.storage.set(`vip_member_${userId}`, vipMember);

      const pointsTransaction = {
        id: `pts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        points: multipliedPoints,
        originalPoints: points,
        multiplier: tier.pointsMultiplier,
        reason,
        type: 'earned',
        timestamp: new Date().toISOString()
      };

      if (!this.loyaltyPoints.has(userId)) {
        this.loyaltyPoints.set(userId, []);
      }
      this.loyaltyPoints.get(userId).push(pointsTransaction);

      this.metrics.totalPointsEarned += multipliedPoints;

      await this.auditLog.log('points_awarded', {
        userId,
        points: multipliedPoints,
        reason,
        newBalance: vipMember.pointsBalance,
        timestamp: new Date().toISOString()
      });

      this.emit('pointsAwarded', { userId, points: multipliedPoints, reason, newBalance: vipMember.pointsBalance });
      return pointsTransaction;
    } catch (error) {
      console.error('Failed to award points:', error);
      throw error;
    }
  }

  async redeemPoints(userId, pointsToRedeem, rewardType, rewardDetails) {
    try {
      const vipMember = this.vipMembers.get(userId);
      if (!vipMember) {
        throw new Error('User is not a VIP member');
      }

      if (vipMember.pointsBalance < pointsToRedeem) {
        throw new Error('Insufficient points balance');
      }

      vipMember.pointsBalance -= pointsToRedeem;
      await this.storage.set(`vip_member_${userId}`, vipMember);

      const redemptionId = `red_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const redemption = {
        id: redemptionId,
        userId,
        pointsRedeemed: pointsToRedeem,
        rewardType,
        rewardDetails,
        status: 'pending',
        redeemedAt: new Date().toISOString(),
        fulfilledAt: null
      };

      this.benefitRedemptions.set(redemptionId, redemption);

      const pointsTransaction = {
        id: `pts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        points: -pointsToRedeem,
        reason: `Redeemed for ${rewardType}`,
        type: 'redeemed',
        redemptionId,
        timestamp: new Date().toISOString()
      };

      if (!this.loyaltyPoints.has(userId)) {
        this.loyaltyPoints.set(userId, []);
      }
      this.loyaltyPoints.get(userId).push(pointsTransaction);

      this.metrics.totalPointsRedeemed += pointsToRedeem;
      this.metrics.benefitsRedeemed++;

      await this.auditLog.log('points_redeemed', {
        userId,
        pointsRedeemed: pointsToRedeem,
        rewardType,
        redemptionId,
        newBalance: vipMember.pointsBalance,
        timestamp: new Date().toISOString()
      });

      this.emit('pointsRedeemed', { userId, redemption, newBalance: vipMember.pointsBalance });
      return redemption;
    } catch (error) {
      console.error('Failed to redeem points:', error);
      throw error;
    }
  }

  async redeemBenefit(userId, benefitId) {
    try {
      const vipMember = this.vipMembers.get(userId);
      if (!vipMember) {
        throw new Error('User is not a VIP member');
      }

      const benefit = this.benefits.get(benefitId);
      if (!benefit) {
        throw new Error('Benefit not found');
      }

      const tier = this.vipTiers.get(vipMember.tierId);
      if (!tier.benefits.includes(benefitId)) {
        throw new Error('Benefit not available for your VIP tier');
      }

      const redemptionId = `ben_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const benefitRedemption = {
        id: redemptionId,
        userId,
        benefitId,
        benefitName: benefit.name,
        status: 'active',
        redeemedAt: new Date().toISOString(),
        expiresAt: this.calculateBenefitExpiry(benefit),
        usageCount: 0,
        maxUsage: this.getBenefitMaxUsage(benefit)
      };

      this.benefitRedemptions.set(redemptionId, benefitRedemption);
      vipMember.benefitsUsed.push(redemptionId);

      await this.storage.set(`vip_member_${userId}`, vipMember);

      this.updateBenefitPopularity(benefitId);

      await this.auditLog.log('benefit_redeemed', {
        userId,
        benefitId,
        redemptionId,
        timestamp: new Date().toISOString()
      });

      this.emit('benefitRedeemed', { userId, benefitRedemption });
      return benefitRedemption;
    } catch (error) {
      console.error('Failed to redeem benefit:', error);
      throw error;
    }
  }

  calculateBenefitExpiry(benefit) {
    const now = new Date();
    switch (benefit.type) {
      case 'service':
        return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
      case 'access':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      case 'event':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      case 'upgrade':
        return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  getBenefitMaxUsage(benefit) {
    switch (benefit.type) {
      case 'service':
        return -1;
      case 'access':
        return 5;
      case 'event':
        return 1;
      case 'upgrade':
        return 3;
      default:
        return 1;
    }
  }

  async createExclusiveOffer(offerData) {
    try {
      const offerId = `off_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const offer = {
        id: offerId,
        title: offerData.title,
        description: offerData.description,
        type: offerData.type,
        discountPercentage: offerData.discountPercentage,
        pointsCost: offerData.pointsCost,
        eligibleTiers: offerData.eligibleTiers || [],
        validFrom: offerData.validFrom || new Date().toISOString(),
        validUntil: offerData.validUntil,
        maxRedemptions: offerData.maxRedemptions || 100,
        currentRedemptions: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        terms: offerData.terms || []
      };

      this.exclusiveOffers.set(offerId, offer);
      await this.storage.set(`exclusive_offer_${offerId}`, offer);

      await this.auditLog.log('exclusive_offer_created', {
        offerId,
        title: offer.title,
        eligibleTiers: offer.eligibleTiers,
        timestamp: new Date().toISOString()
      });

      this.emit('exclusiveOfferCreated', { offer });
      return offer;
    } catch (error) {
      console.error('Failed to create exclusive offer:', error);
      throw error;
    }
  }

  async getAvailableOffers(userId) {
    try {
      const vipMember = this.vipMembers.get(userId);
      if (!vipMember) return [];

      const now = new Date();
      const availableOffers = Array.from(this.exclusiveOffers.values()).filter(offer => {
        const isActive = offer.isActive;
        const isValid = new Date(offer.validFrom) <= now && new Date(offer.validUntil) >= now;
        const hasRedemptions = offer.currentRedemptions < offer.maxRedemptions;
        const isTierEligible = offer.eligibleTiers.length === 0 || offer.eligibleTiers.includes(vipMember.tierId);

        return isActive && isValid && hasRedemptions && isTierEligible;
      });

      return availableOffers;
    } catch (error) {
      console.error('Failed to get available offers:', error);
      return [];
    }
  }

  async getUserVIPStatus(userId) {
    try {
      const vipMember = this.vipMembers.get(userId);
      if (!vipMember) return null;

      const tier = this.vipTiers.get(vipMember.tierId);
      const pointsHistory = this.loyaltyPoints.get(userId) || [];
      const availableOffers = await this.getAvailableOffers(userId);

      return {
        member: vipMember,
        tier,
        pointsHistory,
        availableOffers,
        availableBenefits: tier.benefits.map(benefitId => this.benefits.get(benefitId)),
        status: 'active'
      };
    } catch (error) {
      console.error('Failed to get user VIP status:', error);
      return null;
    }
  }

  updateTierDistribution(tierId, change) {
    if (!this.metrics.tierDistribution[tierId]) {
      this.metrics.tierDistribution[tierId] = 0;
    }
    this.metrics.tierDistribution[tierId] += change;
  }

  updateBenefitPopularity(benefitId) {
    if (!this.metrics.benefitPopularity[benefitId]) {
      this.metrics.benefitPopularity[benefitId] = 0;
    }
    this.metrics.benefitPopularity[benefitId]++;
  }

  async loadVIPMembers() {
    try {
      const stored = await this.storage.get('vip_members_all');
      if (stored && Array.isArray(stored)) {
        stored.forEach(member => this.vipMembers.set(member.userId, member));
      }
    } catch (error) {
      console.error('Failed to load VIP members:', error);
    }
  }

  async loadLoyaltyPoints() {
    try {
      const stored = await this.storage.get('loyalty_points_all');
      if (stored) {
        Object.entries(stored).forEach(([userId, points]) => {
          this.loyaltyPoints.set(userId, points);
        });
      }
    } catch (error) {
      console.error('Failed to load loyalty points:', error);
    }
  }

  async loadExclusiveOffers() {
    try {
      const stored = await this.storage.get('exclusive_offers_all');
      if (stored && Array.isArray(stored)) {
        stored.forEach(offer => this.exclusiveOffers.set(offer.id, offer));
      }
    } catch (error) {
      console.error('Failed to load exclusive offers:', error);
    }
  }

  async loadMetrics() {
    try {
      const stored = await this.storage.get('vip_metrics');
      if (stored) {
        this.metrics = { ...this.metrics, ...stored };
      }
    } catch (error) {
      console.error('Failed to load VIP metrics:', error);
    }
  }

  startMetricsCollection() {
    setInterval(async () => {
      await this.storage.set('vip_metrics', this.metrics);
    }, 60000);
  }

  startAutomaticProcessing() {
    setInterval(async () => {
      await this.processExpiredOffers();
      await this.processAnniversaryBonuses();
    }, 24 * 60 * 60 * 1000);
  }

  async processExpiredOffers() {
    const now = new Date();
    for (const [offerId, offer] of this.exclusiveOffers) {
      if (offer.isActive && new Date(offer.validUntil) < now) {
        offer.isActive = false;
        await this.storage.set(`exclusive_offer_${offerId}`, offer);
      }
    }
  }

  async processAnniversaryBonuses() {
    const today = new Date();
    for (const [userId, member] of this.vipMembers) {
      const anniversaryDate = new Date(member.anniversaryDate);
      if (anniversaryDate.getMonth() === today.getMonth() && 
          anniversaryDate.getDate() === today.getDate()) {
        const tier = this.vipTiers.get(member.tierId);
        const bonusPoints = 1000 * tier.level;
        await this.awardPoints(userId, bonusPoints, 'anniversary_bonus');
      }
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString()
    };
  }

  getVIPAnalytics(period = 'month') {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const vipMembers = Array.from(this.vipMembers.values())
      .filter(member => new Date(member.enrolledAt) >= startDate);

    const totalSpend = vipMembers.reduce((sum, member) => sum + member.totalSpent, 0);
    const averageSpend = vipMembers.length > 0 ? totalSpend / vipMembers.length : 0;

    return {
      period,
      newVIPMembers: vipMembers.length,
      totalSpend,
      averageSpend,
      tierBreakdown: this.metrics.tierDistribution,
      benefitUsage: this.metrics.benefitPopularity,
      startDate: startDate.toISOString(),
      endDate: now.toISOString()
    };
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in VIP benefits event listener for ${event}:`, error);
        }
      });
    }
  }

  async cleanup() {
    try {
      await this.storage.set('vip_members_all', Array.from(this.vipMembers.values()));
      await this.storage.set('loyalty_points_all', Object.fromEntries(this.loyaltyPoints));
      await this.storage.set('exclusive_offers_all', Array.from(this.exclusiveOffers.values()));
      await this.storage.set('vip_metrics', this.metrics);

      this.listeners.clear();
      this.isInitialized = false;

      await this.auditLog.log('vip_benefits_service_cleanup', {
        component: 'VIPBenefitsService',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to cleanup VIPBenefitsService:', error);
    }
  }

  static async getInstance() {
    if (!VIPBenefitsService.instance) {
      VIPBenefitsService.instance = new VIPBenefitsService();
    }
    if (!VIPBenefitsService.instance.isInitialized) {
      await VIPBenefitsService.instance.initialize();
    }
    return VIPBenefitsService.instance;
  }
}

export { VIPBenefitsService };