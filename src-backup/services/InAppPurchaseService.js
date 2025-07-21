import { LocalStorageService } from './LocalStorageService';
import { AuditLogService } from './AuditLogService';

class InAppPurchaseService {
  constructor() {
    this.initialized = false;
    this.storageService = null;
    this.auditService = null;
    this.products = new Map();
    this.purchaseHistory = [];
    this.subscriptions = new Map();
    this.listeners = [];
    this.storeConnections = {
      ios: null,
      android: null
    };
    this.purchaseStates = {
      PENDING: 'pending',
      PURCHASED: 'purchased',
      FAILED: 'failed',
      RESTORED: 'restored',
      DEFERRED: 'deferred'
    };
  }

  static getInstance() {
    if (!InAppPurchaseService.instance) {
      InAppPurchaseService.instance = new InAppPurchaseService();
    }
    return InAppPurchaseService.instance;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      this.storageService = LocalStorageService.getInstance();
      this.auditService = AuditLogService.getInstance();
      
      await this.loadProducts();
      await this.loadPurchaseHistory();
      await this.loadSubscriptions();
      await this.initializeStoreConnections();
      
      this.initialized = true;
      
      await this.auditService.logEvent('iap_service_initialized', {
        timestamp: new Date().toISOString(),
        products_count: this.products.size,
        subscriptions_count: this.subscriptions.size
      });
      
      this.emit('serviceInitialized');
    } catch (error) {
      console.error('Failed to initialize InAppPurchaseService:', error);
      throw error;
    }
  }

  async loadProducts() {
    try {
      const products = await this.storageService.getItem('iap_products');
      const productList = products || [
        {
          id: 'premium_monthly',
          type: 'subscription',
          platform: 'both',
          title: 'Premium Monthly',
          description: 'Access to premium features including unlimited venue bookings and VIP recommendations',
          price: 9.99,
          currency: 'USD',
          duration: 'P1M',
          trialPeriod: 'P7D',
          features: [
            'Unlimited venue bookings',
            'VIP recommendations',
            'Priority customer support',
            'Advanced filters',
            'Exclusive events access'
          ],
          active: true
        },
        {
          id: 'premium_yearly',
          type: 'subscription',
          platform: 'both',
          title: 'Premium Yearly',
          description: 'Access to premium features with yearly billing (save 25%)',
          price: 89.99,
          currency: 'USD',
          duration: 'P1Y',
          trialPeriod: 'P7D',
          features: [
            'Unlimited venue bookings',
            'VIP recommendations',
            'Priority customer support',
            'Advanced filters',
            'Exclusive events access',
            'Save 25% vs monthly'
          ],
          active: true
        },
        {
          id: 'venue_credits_small',
          type: 'consumable',
          platform: 'both',
          title: '50 Venue Credits',
          description: 'Credits for venue bookings and premium listings',
          price: 4.99,
          currency: 'USD',
          credits: 50,
          active: true
        },
        {
          id: 'venue_credits_large',
          type: 'consumable',
          platform: 'both',
          title: '200 Venue Credits',
          description: 'Credits for venue bookings and premium listings (best value)',
          price: 16.99,
          currency: 'USD',
          credits: 200,
          active: true
        },
        {
          id: 'vip_pass',
          type: 'non_consumable',
          platform: 'both',
          title: 'VIP Pass',
          description: 'Permanent VIP status with exclusive access',
          price: 49.99,
          currency: 'USD',
          features: [
            'Permanent VIP status',
            'Exclusive venue access',
            'Priority booking',
            'VIP customer support'
          ],
          active: true
        }
      ];

      this.products.clear();
      productList.forEach(product => {
        this.products.set(product.id, product);
      });

      await this.storageService.setItem('iap_products', productList);
    } catch (error) {
      console.error('Failed to load products:', error);
      this.products.clear();
    }
  }

  async loadPurchaseHistory() {
    try {
      const history = await this.storageService.getItem('iap_purchase_history');
      this.purchaseHistory = history || [];
    } catch (error) {
      console.error('Failed to load purchase history:', error);
      this.purchaseHistory = [];
    }
  }

  async loadSubscriptions() {
    try {
      const subscriptions = await this.storageService.getItem('iap_subscriptions');
      const subscriptionList = subscriptions || [];
      
      this.subscriptions.clear();
      subscriptionList.forEach(sub => {
        this.subscriptions.set(sub.productId, sub);
      });
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
      this.subscriptions.clear();
    }
  }

  async initializeStoreConnections() {
    try {
      // Initialize iOS App Store connection
      if (this.isIOS()) {
        this.storeConnections.ios = {
          connected: true,
          productIds: Array.from(this.products.keys()),
          lastUpdate: new Date().toISOString()
        };
      }

      // Initialize Google Play Store connection
      if (this.isAndroid()) {
        this.storeConnections.android = {
          connected: true,
          productIds: Array.from(this.products.keys()),
          lastUpdate: new Date().toISOString()
        };
      }

      await this.auditService.logEvent('store_connections_initialized', {
        ios_connected: !!this.storeConnections.ios?.connected,
        android_connected: !!this.storeConnections.android?.connected,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to initialize store connections:', error);
    }
  }

  async getProducts(productIds = null) {
    try {
      const requestedProducts = productIds 
        ? productIds.map(id => this.products.get(id)).filter(Boolean)
        : Array.from(this.products.values());

      const activeProducts = requestedProducts.filter(product => product.active);

      await this.auditService.logEvent('products_requested', {
        requested_ids: productIds,
        returned_count: activeProducts.length,
        timestamp: new Date().toISOString()
      });

      return activeProducts;
    } catch (error) {
      console.error('Failed to get products:', error);
      return [];
    }
  }

  async purchaseProduct(productId, userId = null) {
    try {
      const product = this.products.get(productId);
      if (!product) {
        throw new Error(`Product ${productId} not found`);
      }

      if (!product.active) {
        throw new Error(`Product ${productId} is not active`);
      }

      const purchaseId = this.generatePurchaseId();
      const purchase = {
        id: purchaseId,
        productId: productId,
        userId: userId,
        product: product,
        state: this.purchaseStates.PENDING,
        timestamp: new Date().toISOString(),
        platform: this.getCurrentPlatform(),
        price: product.price,
        currency: product.currency,
        transactionId: null,
        receipt: null
      };

      // Simulate purchase process
      await this.processPurchase(purchase);

      return purchase;
    } catch (error) {
      console.error('Failed to purchase product:', error);
      throw error;
    }
  }

  async processPurchase(purchase) {
    try {
      // Simulate platform-specific purchase flow
      const platform = this.getCurrentPlatform();
      
      if (platform === 'ios') {
        await this.processIOSPurchase(purchase);
      } else if (platform === 'android') {
        await this.processAndroidPurchase(purchase);
      } else {
        // Development/testing mode
        await this.processTestPurchase(purchase);
      }

      // Add to purchase history
      this.purchaseHistory.push(purchase);
      await this.storageService.setItem('iap_purchase_history', this.purchaseHistory);

      // Handle subscription if applicable
      if (purchase.product.type === 'subscription') {
        await this.handleSubscriptionPurchase(purchase);
      }

      // Handle consumable credits
      if (purchase.product.type === 'consumable' && purchase.product.credits) {
        await this.addCredits(purchase.userId, purchase.product.credits);
      }

      await this.auditService.logEvent('purchase_processed', {
        purchase_id: purchase.id,
        product_id: purchase.productId,
        user_id: purchase.userId,
        state: purchase.state,
        platform: purchase.platform,
        timestamp: new Date().toISOString()
      });

      this.emit('purchaseCompleted', purchase);
    } catch (error) {
      purchase.state = this.purchaseStates.FAILED;
      purchase.error = error.message;
      
      await this.auditService.logEvent('purchase_failed', {
        purchase_id: purchase.id,
        product_id: purchase.productId,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      this.emit('purchaseFailed', purchase);
      throw error;
    }
  }

  async processIOSPurchase(purchase) {
    // Simulate iOS App Store purchase
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    purchase.state = this.purchaseStates.PURCHASED;
    purchase.transactionId = `ios_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    purchase.receipt = {
      platform: 'ios',
      bundleId: 'com.nightlife.navigator',
      transactionId: purchase.transactionId,
      originalTransactionId: purchase.transactionId,
      productId: purchase.productId,
      purchaseDate: new Date().toISOString(),
      quantity: 1
    };
  }

  async processAndroidPurchase(purchase) {
    // Simulate Google Play Store purchase
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    purchase.state = this.purchaseStates.PURCHASED;
    purchase.transactionId = `android_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    purchase.receipt = {
      platform: 'android',
      packageName: 'com.nightlife.navigator',
      transactionId: purchase.transactionId,
      productId: purchase.productId,
      purchaseTime: Date.now(),
      purchaseState: 1,
      purchaseToken: Math.random().toString(36).substr(2, 32)
    };
  }

  async processTestPurchase(purchase) {
    // Simulate test purchase for development
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    purchase.state = this.purchaseStates.PURCHASED;
    purchase.transactionId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    purchase.receipt = {
      platform: 'test',
      transactionId: purchase.transactionId,
      productId: purchase.productId,
      purchaseDate: new Date().toISOString(),
      test: true
    };
  }

  async handleSubscriptionPurchase(purchase) {
    try {
      const subscription = {
        productId: purchase.productId,
        userId: purchase.userId,
        purchaseId: purchase.id,
        status: 'active',
        startDate: new Date().toISOString(),
        endDate: this.calculateSubscriptionEndDate(purchase.product.duration),
        autoRenew: true,
        trialEndDate: purchase.product.trialPeriod ? 
          this.calculateTrialEndDate(purchase.product.trialPeriod) : null,
        platform: purchase.platform,
        transactionId: purchase.transactionId
      };

      this.subscriptions.set(purchase.productId, subscription);
      
      const subscriptionList = Array.from(this.subscriptions.values());
      await this.storageService.setItem('iap_subscriptions', subscriptionList);

      await this.auditService.logEvent('subscription_activated', {
        subscription_id: purchase.productId,
        user_id: purchase.userId,
        start_date: subscription.startDate,
        end_date: subscription.endDate,
        timestamp: new Date().toISOString()
      });

      this.emit('subscriptionActivated', subscription);
    } catch (error) {
      console.error('Failed to handle subscription purchase:', error);
      throw error;
    }
  }

  async restorePurchases(userId) {
    try {
      const userPurchases = this.purchaseHistory.filter(
        purchase => purchase.userId === userId && purchase.state === this.purchaseStates.PURCHASED
      );

      const restoredPurchases = [];
      
      for (const purchase of userPurchases) {
        if (purchase.product.type === 'subscription') {
          const subscription = this.subscriptions.get(purchase.productId);
          if (subscription && subscription.status === 'active') {
            restoredPurchases.push(purchase);
          }
        } else if (purchase.product.type === 'non_consumable') {
          restoredPurchases.push(purchase);
        }
      }

      await this.auditService.logEvent('purchases_restored', {
        user_id: userId,
        restored_count: restoredPurchases.length,
        timestamp: new Date().toISOString()
      });

      this.emit('purchasesRestored', { userId, purchases: restoredPurchases });
      return restoredPurchases;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      throw error;
    }
  }

  async cancelSubscription(productId, userId) {
    try {
      const subscription = this.subscriptions.get(productId);
      if (!subscription || subscription.userId !== userId) {
        throw new Error('Subscription not found');
      }

      subscription.status = 'cancelled';
      subscription.cancelledDate = new Date().toISOString();
      subscription.autoRenew = false;

      const subscriptionList = Array.from(this.subscriptions.values());
      await this.storageService.setItem('iap_subscriptions', subscriptionList);

      await this.auditService.logEvent('subscription_cancelled', {
        subscription_id: productId,
        user_id: userId,
        cancelled_date: subscription.cancelledDate,
        timestamp: new Date().toISOString()
      });

      this.emit('subscriptionCancelled', subscription);
      return subscription;
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    }
  }

  async getUserSubscriptions(userId) {
    try {
      const userSubscriptions = Array.from(this.subscriptions.values())
        .filter(sub => sub.userId === userId);

      return userSubscriptions;
    } catch (error) {
      console.error('Failed to get user subscriptions:', error);
      return [];
    }
  }

  async getUserPurchases(userId) {
    try {
      const userPurchases = this.purchaseHistory.filter(
        purchase => purchase.userId === userId
      );

      return userPurchases;
    } catch (error) {
      console.error('Failed to get user purchases:', error);
      return [];
    }
  }

  async addCredits(userId, credits) {
    try {
      const currentCredits = await this.storageService.getItem(`user_credits_${userId}`) || 0;
      const newCredits = currentCredits + credits;
      
      await this.storageService.setItem(`user_credits_${userId}`, newCredits);

      await this.auditService.logEvent('credits_added', {
        user_id: userId,
        credits_added: credits,
        old_balance: currentCredits,
        new_balance: newCredits,
        timestamp: new Date().toISOString()
      });

      this.emit('creditsAdded', { userId, credits, newBalance: newCredits });
      return newCredits;
    } catch (error) {
      console.error('Failed to add credits:', error);
      throw error;
    }
  }

  async getUserCredits(userId) {
    try {
      const credits = await this.storageService.getItem(`user_credits_${userId}`) || 0;
      return credits;
    } catch (error) {
      console.error('Failed to get user credits:', error);
      return 0;
    }
  }

  async spendCredits(userId, amount, reason = 'purchase') {
    try {
      const currentCredits = await this.getUserCredits(userId);
      if (currentCredits < amount) {
        throw new Error('Insufficient credits');
      }

      const newCredits = currentCredits - amount;
      await this.storageService.setItem(`user_credits_${userId}`, newCredits);

      await this.auditService.logEvent('credits_spent', {
        user_id: userId,
        credits_spent: amount,
        reason: reason,
        old_balance: currentCredits,
        new_balance: newCredits,
        timestamp: new Date().toISOString()
      });

      this.emit('creditsSpent', { userId, amount, reason, newBalance: newCredits });
      return newCredits;
    } catch (error) {
      console.error('Failed to spend credits:', error);
      throw error;
    }
  }

  async validateReceipt(receipt, platform) {
    try {
      // Simulate receipt validation
      const validation = {
        valid: true,
        receipt: receipt,
        platform: platform,
        validatedAt: new Date().toISOString(),
        products: []
      };

      if (platform === 'ios') {
        validation.bundleId = receipt.bundleId;
        validation.products = [{
          productId: receipt.productId,
          transactionId: receipt.transactionId,
          purchaseDate: receipt.purchaseDate
        }];
      } else if (platform === 'android') {
        validation.packageName = receipt.packageName;
        validation.products = [{
          productId: receipt.productId,
          purchaseToken: receipt.purchaseToken,
          purchaseTime: receipt.purchaseTime
        }];
      }

      await this.auditService.logEvent('receipt_validated', {
        platform: platform,
        valid: validation.valid,
        product_count: validation.products.length,
        timestamp: new Date().toISOString()
      });

      return validation;
    } catch (error) {
      console.error('Failed to validate receipt:', error);
      return { valid: false, error: error.message };
    }
  }

  calculateSubscriptionEndDate(duration) {
    const now = new Date();
    
    if (duration === 'P1M') {
      return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString();
    } else if (duration === 'P1Y') {
      return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString();
    }
    
    return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  calculateTrialEndDate(trialPeriod) {
    const now = new Date();
    
    if (trialPeriod === 'P7D') {
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (trialPeriod === 'P14D') {
      return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
    }
    
    return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  }

  generatePurchaseId() {
    return `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getCurrentPlatform() {
    if (this.isIOS()) return 'ios';
    if (this.isAndroid()) return 'android';
    return 'test';
  }

  isIOS() {
    return typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  isAndroid() {
    return typeof window !== 'undefined' && /Android/.test(navigator.userAgent);
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
      this.products.clear();
      this.subscriptions.clear();
      this.purchaseHistory = [];
      this.storeConnections = { ios: null, android: null };
      this.initialized = false;
      
      await this.auditService.logEvent('iap_service_cleanup', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to cleanup InAppPurchaseService:', error);
    }
  }
}

export { InAppPurchaseService };