import { LocalStorageService } from './LocalStorageService.js';
import { AuditLogService } from './AuditLogService.js';

class PaymentService {
  constructor() {
    if (PaymentService.instance) {
      return PaymentService.instance;
    }

    this.isInitialized = false;
    this.listeners = new Map();
    this.metrics = {
      paymentsProcessed: 0,
      totalRevenue: 0,
      averageTransactionValue: 0,
      paymentMethodUsage: {},
      fraudDetections: 0,
      chargebacks: 0,
      refundsProcessed: 0,
      conversionRate: 0
    };

    this.paymentProviders = new Map();
    this.paymentMethods = new Map();
    this.transactions = new Map();
    this.subscriptions = new Map();
    this.refunds = new Map();
    this.paymentSecurityRules = new Map();
    this.fraudDetectionRules = new Map();

    PaymentService.instance = this;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      this.storage = await LocalStorageService.getInstance();
      this.auditLog = await AuditLogService.getInstance();

      await this.loadPaymentMethods();
      await this.loadTransactionHistory();
      await this.loadSubscriptions();
      await this.initializePaymentProviders();
      await this.setupFraudDetection();
      await this.loadMetrics();

      this.startMetricsCollection();
      this.isInitialized = true;

      await this.auditLog.log('payment_service_initialized', {
        component: 'PaymentService',
        timestamp: new Date().toISOString(),
        paymentMethodsCount: this.paymentMethods.size,
        providersCount: this.paymentProviders.size
      });

      this.emit('initialized');
    } catch (error) {
      console.error('Failed to initialize PaymentService:', error);
      throw error;
    }
  }

  async initializePaymentProviders() {
    this.paymentProviders.set('stripe', {
      id: 'stripe',
      name: 'Stripe',
      enabled: true,
      supportedMethods: ['card', 'apple_pay', 'google_pay'],
      fees: { percentage: 2.9, fixed: 30 },
      processingTime: 'instant',
      settlementTime: '2-7 days'
    });

    this.paymentProviders.set('paypal', {
      id: 'paypal',
      name: 'PayPal',
      enabled: true,
      supportedMethods: ['paypal', 'venmo'],
      fees: { percentage: 3.49, fixed: 49 },
      processingTime: 'instant',
      settlementTime: '1-3 days'
    });

    this.paymentProviders.set('square', {
      id: 'square',
      name: 'Square',
      enabled: true,
      supportedMethods: ['card', 'cash_app'],
      fees: { percentage: 2.6, fixed: 10 },
      processingTime: 'instant',
      settlementTime: '1-2 days'
    });
  }

  async setupFraudDetection() {
    this.fraudDetectionRules.set('velocity_check', {
      enabled: true,
      maxTransactionsPerHour: 10,
      maxAmountPerHour: 1000,
      action: 'flag_review'
    });

    this.fraudDetectionRules.set('location_check', {
      enabled: true,
      checkUnusualLocations: true,
      maxDistanceFromUsual: 100,
      action: 'require_verification'
    });

    this.fraudDetectionRules.set('amount_check', {
      enabled: true,
      unusualAmountThreshold: 500,
      percentageAboveAverage: 300,
      action: 'require_verification'
    });

    this.paymentSecurityRules.set('pci_compliance', {
      enabled: true,
      tokenizeCardData: true,
      encryptSensitiveData: true,
      logAllTransactions: true
    });
  }

  async addPaymentMethod(userId, paymentMethodData) {
    try {
      const paymentMethodId = `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const paymentMethod = {
        id: paymentMethodId,
        userId,
        type: paymentMethodData.type,
        last4: paymentMethodData.last4,
        brand: paymentMethodData.brand,
        expiryMonth: paymentMethodData.expiryMonth,
        expiryYear: paymentMethodData.expiryYear,
        billingAddress: paymentMethodData.billingAddress,
        isDefault: paymentMethodData.isDefault || false,
        isValid: true,
        tokenized: true,
        providerData: {},
        createdAt: new Date().toISOString(),
        lastUsed: null
      };

      const tokenizationResult = await this.tokenizePaymentMethod(paymentMethod);
      paymentMethod.token = tokenizationResult.token;
      paymentMethod.providerData = tokenizationResult.providerData;

      this.paymentMethods.set(paymentMethodId, paymentMethod);
      await this.storage.set(`payment_methods_${userId}`, 
        Array.from(this.paymentMethods.values()).filter(pm => pm.userId === userId)
      );

      await this.auditLog.log('payment_method_added', {
        userId,
        paymentMethodId,
        type: paymentMethod.type,
        brand: paymentMethod.brand,
        timestamp: new Date().toISOString()
      });

      this.emit('paymentMethodAdded', { userId, paymentMethod });
      return paymentMethod;
    } catch (error) {
      console.error('Failed to add payment method:', error);
      throw error;
    }
  }

  async tokenizePaymentMethod(paymentMethod) {
    const token = `tok_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
    
    return {
      token,
      providerData: {
        tokenizedAt: new Date().toISOString(),
        provider: 'internal',
        encrypted: true
      }
    };
  }

  async processPayment(paymentRequest) {
    try {
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const fraudCheck = await this.performFraudCheck(paymentRequest);
      if (fraudCheck.flagged) {
        throw new Error(`Payment flagged for fraud: ${fraudCheck.reason}`);
      }

      const transaction = {
        id: transactionId,
        userId: paymentRequest.userId,
        amount: paymentRequest.amount,
        currency: paymentRequest.currency || 'USD',
        description: paymentRequest.description,
        paymentMethodId: paymentRequest.paymentMethodId,
        providerId: paymentRequest.providerId || 'stripe',
        status: 'processing',
        metadata: paymentRequest.metadata || {},
        fees: this.calculateFees(paymentRequest.amount, paymentRequest.providerId),
        createdAt: new Date().toISOString(),
        processedAt: null,
        failureReason: null
      };

      this.transactions.set(transactionId, transaction);

      const processingResult = await this.processWithProvider(transaction);
      
      transaction.status = processingResult.success ? 'completed' : 'failed';
      transaction.processedAt = new Date().toISOString();
      transaction.providerTransactionId = processingResult.providerTransactionId;
      transaction.failureReason = processingResult.error;

      await this.storage.set(`transaction_${transactionId}`, transaction);

      if (processingResult.success) {
        await this.updatePaymentMethodUsage(paymentRequest.paymentMethodId);
        this.updateMetrics(transaction);
      }

      await this.auditLog.log('payment_processed', {
        transactionId,
        userId: paymentRequest.userId,
        amount: paymentRequest.amount,
        status: transaction.status,
        providerId: transaction.providerId,
        timestamp: new Date().toISOString()
      });

      this.emit('paymentProcessed', { transaction, success: processingResult.success });
      return transaction;
    } catch (error) {
      console.error('Failed to process payment:', error);
      throw error;
    }
  }

  async processWithProvider(transaction) {
    const provider = this.paymentProviders.get(transaction.providerId);
    if (!provider || !provider.enabled) {
      return { success: false, error: 'Provider not available' };
    }

    const processingDelay = Math.random() * 2000 + 1000;
    await new Promise(resolve => setTimeout(resolve, processingDelay));

    const successRate = 0.95;
    const isSuccessful = Math.random() < successRate;

    if (isSuccessful) {
      return {
        success: true,
        providerTransactionId: `${transaction.providerId}_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
      };
    } else {
      return {
        success: false,
        error: this.getRandomFailureReason()
      };
    }
  }

  getRandomFailureReason() {
    const reasons = [
      'Insufficient funds',
      'Card declined',
      'Invalid card number',
      'Expired card',
      'Processing error',
      'Bank authorization failed'
    ];
    return reasons[Math.floor(Math.random() * reasons.length)];
  }

  async performFraudCheck(paymentRequest) {
    const userId = paymentRequest.userId;
    const amount = paymentRequest.amount;

    const velocityRule = this.fraudDetectionRules.get('velocity_check');
    if (velocityRule.enabled) {
      const recentTransactions = await this.getRecentTransactions(userId, 1);
      if (recentTransactions.length >= velocityRule.maxTransactionsPerHour) {
        return { flagged: true, reason: 'Transaction velocity exceeded' };
      }

      const totalAmount = recentTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      if (totalAmount + amount > velocityRule.maxAmountPerHour) {
        return { flagged: true, reason: 'Amount velocity exceeded' };
      }
    }

    const amountRule = this.fraudDetectionRules.get('amount_check');
    if (amountRule.enabled && amount > amountRule.unusualAmountThreshold) {
      const userAverage = await this.getUserAverageTransactionAmount(userId);
      if (amount > userAverage * (amountRule.percentageAboveAverage / 100)) {
        return { flagged: true, reason: 'Unusual transaction amount' };
      }
    }

    return { flagged: false };
  }

  async getRecentTransactions(userId, hours) {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return Array.from(this.transactions.values()).filter(tx => 
      tx.userId === userId && 
      new Date(tx.createdAt) > cutoffTime &&
      tx.status === 'completed'
    );
  }

  async getUserAverageTransactionAmount(userId) {
    const userTransactions = Array.from(this.transactions.values()).filter(tx => 
      tx.userId === userId && tx.status === 'completed'
    );
    
    if (userTransactions.length === 0) return 0;
    
    const total = userTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    return total / userTransactions.length;
  }

  calculateFees(amount, providerId) {
    const provider = this.paymentProviders.get(providerId);
    if (!provider) return { percentage: 0, fixed: 0, total: 0 };

    const percentageFee = (amount * provider.fees.percentage) / 100;
    const fixedFee = provider.fees.fixed / 100;
    
    return {
      percentage: percentageFee,
      fixed: fixedFee,
      total: percentageFee + fixedFee
    };
  }

  async processRefund(transactionId, refundData) {
    try {
      const transaction = this.transactions.get(transactionId);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status !== 'completed') {
        throw new Error('Cannot refund incomplete transaction');
      }

      const refundId = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const refundAmount = refundData.amount || transaction.amount;

      if (refundAmount > transaction.amount) {
        throw new Error('Refund amount cannot exceed transaction amount');
      }

      const refund = {
        id: refundId,
        transactionId,
        userId: transaction.userId,
        amount: refundAmount,
        reason: refundData.reason,
        status: 'processing',
        createdAt: new Date().toISOString(),
        processedAt: null,
        providerRefundId: null
      };

      this.refunds.set(refundId, refund);

      const processingResult = await this.processRefundWithProvider(refund, transaction);
      
      refund.status = processingResult.success ? 'completed' : 'failed';
      refund.processedAt = new Date().toISOString();
      refund.providerRefundId = processingResult.providerRefundId;

      await this.storage.set(`refund_${refundId}`, refund);

      if (processingResult.success) {
        this.metrics.refundsProcessed++;
      }

      await this.auditLog.log('refund_processed', {
        refundId,
        transactionId,
        userId: transaction.userId,
        amount: refundAmount,
        status: refund.status,
        timestamp: new Date().toISOString()
      });

      this.emit('refundProcessed', { refund, success: processingResult.success });
      return refund;
    } catch (error) {
      console.error('Failed to process refund:', error);
      throw error;
    }
  }

  async processRefundWithProvider(refund, transaction) {
    const processingDelay = Math.random() * 1500 + 500;
    await new Promise(resolve => setTimeout(resolve, processingDelay));

    const successRate = 0.98;
    const isSuccessful = Math.random() < successRate;

    if (isSuccessful) {
      return {
        success: true,
        providerRefundId: `ref_${transaction.providerId}_${Date.now()}`
      };
    } else {
      return {
        success: false,
        error: 'Refund processing failed'
      };
    }
  }

  async createSubscription(subscriptionData) {
    try {
      const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const subscription = {
        id: subscriptionId,
        userId: subscriptionData.userId,
        planId: subscriptionData.planId,
        amount: subscriptionData.amount,
        currency: subscriptionData.currency || 'USD',
        interval: subscriptionData.interval,
        paymentMethodId: subscriptionData.paymentMethodId,
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: this.calculateNextBillingDate(subscriptionData.interval),
        trialEnd: subscriptionData.trialEnd,
        cancelAtPeriodEnd: false,
        createdAt: new Date().toISOString(),
        metadata: subscriptionData.metadata || {}
      };

      this.subscriptions.set(subscriptionId, subscription);
      await this.storage.set(`subscription_${subscriptionId}`, subscription);

      await this.auditLog.log('subscription_created', {
        subscriptionId,
        userId: subscriptionData.userId,
        planId: subscriptionData.planId,
        amount: subscriptionData.amount,
        timestamp: new Date().toISOString()
      });

      this.emit('subscriptionCreated', { subscription });
      return subscription;
    } catch (error) {
      console.error('Failed to create subscription:', error);
      throw error;
    }
  }

  calculateNextBillingDate(interval) {
    const now = new Date();
    switch (interval) {
      case 'week':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      case 'month':
        return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString();
      case 'year':
        return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString();
      default:
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  async cancelSubscription(subscriptionId, cancelAtPeriodEnd = true) {
    try {
      const subscription = this.subscriptions.get(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      if (cancelAtPeriodEnd) {
        subscription.cancelAtPeriodEnd = true;
        subscription.status = 'active';
      } else {
        subscription.status = 'canceled';
        subscription.canceledAt = new Date().toISOString();
      }

      await this.storage.set(`subscription_${subscriptionId}`, subscription);

      await this.auditLog.log('subscription_canceled', {
        subscriptionId,
        userId: subscription.userId,
        cancelAtPeriodEnd,
        timestamp: new Date().toISOString()
      });

      this.emit('subscriptionCanceled', { subscription, cancelAtPeriodEnd });
      return subscription;
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    }
  }

  async getUserPaymentMethods(userId) {
    try {
      const stored = await this.storage.get(`payment_methods_${userId}`);
      return stored || [];
    } catch (error) {
      console.error('Failed to get user payment methods:', error);
      return [];
    }
  }

  async getUserTransactions(userId, options = {}) {
    try {
      const userTransactions = Array.from(this.transactions.values())
        .filter(tx => tx.userId === userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      if (options.limit) {
        return userTransactions.slice(0, options.limit);
      }

      return userTransactions;
    } catch (error) {
      console.error('Failed to get user transactions:', error);
      return [];
    }
  }

  async updatePaymentMethodUsage(paymentMethodId) {
    const paymentMethod = this.paymentMethods.get(paymentMethodId);
    if (paymentMethod) {
      paymentMethod.lastUsed = new Date().toISOString();
      await this.storage.set(`payment_methods_${paymentMethod.userId}`, 
        Array.from(this.paymentMethods.values()).filter(pm => pm.userId === paymentMethod.userId)
      );
    }
  }

  updateMetrics(transaction) {
    this.metrics.paymentsProcessed++;
    this.metrics.totalRevenue += transaction.amount;
    this.metrics.averageTransactionValue = this.metrics.totalRevenue / this.metrics.paymentsProcessed;

    const paymentMethod = this.paymentMethods.get(transaction.paymentMethodId);
    if (paymentMethod) {
      const methodType = paymentMethod.type;
      this.metrics.paymentMethodUsage[methodType] = (this.metrics.paymentMethodUsage[methodType] || 0) + 1;
    }
  }

  async loadPaymentMethods() {
    try {
      const stored = await this.storage.get('payment_methods_all');
      if (stored && Array.isArray(stored)) {
        stored.forEach(pm => this.paymentMethods.set(pm.id, pm));
      }
    } catch (error) {
      console.error('Failed to load payment methods:', error);
    }
  }

  async loadTransactionHistory() {
    try {
      const stored = await this.storage.get('transactions_all');
      if (stored && Array.isArray(stored)) {
        stored.forEach(tx => this.transactions.set(tx.id, tx));
      }
    } catch (error) {
      console.error('Failed to load transaction history:', error);
    }
  }

  async loadSubscriptions() {
    try {
      const stored = await this.storage.get('subscriptions_all');
      if (stored && Array.isArray(stored)) {
        stored.forEach(sub => this.subscriptions.set(sub.id, sub));
      }
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
    }
  }

  async loadMetrics() {
    try {
      const stored = await this.storage.get('payment_metrics');
      if (stored) {
        this.metrics = { ...this.metrics, ...stored };
      }
    } catch (error) {
      console.error('Failed to load payment metrics:', error);
    }
  }

  startMetricsCollection() {
    setInterval(async () => {
      await this.storage.set('payment_metrics', this.metrics);
    }, 60000);
  }

  getMetrics() {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString()
    };
  }

  getTransactionAnalytics(period = 'month') {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
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

    const periodTransactions = Array.from(this.transactions.values())
      .filter(tx => new Date(tx.createdAt) >= startDate && tx.status === 'completed');

    const totalAmount = periodTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const averageAmount = periodTransactions.length > 0 ? totalAmount / periodTransactions.length : 0;

    return {
      period,
      transactionCount: periodTransactions.length,
      totalAmount,
      averageAmount,
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
          console.error(`Error in payment event listener for ${event}:`, error);
        }
      });
    }
  }

  async cleanup() {
    try {
      await this.storage.set('payment_methods_all', Array.from(this.paymentMethods.values()));
      await this.storage.set('transactions_all', Array.from(this.transactions.values()));
      await this.storage.set('subscriptions_all', Array.from(this.subscriptions.values()));
      await this.storage.set('payment_metrics', this.metrics);

      this.listeners.clear();
      this.isInitialized = false;

      await this.auditLog.log('payment_service_cleanup', {
        component: 'PaymentService',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to cleanup PaymentService:', error);
    }
  }

  static async getInstance() {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    if (!PaymentService.instance.isInitialized) {
      await PaymentService.instance.initialize();
    }
    return PaymentService.instance;
  }
}

export { PaymentService };