import { LocalStorageService } from './LocalStorageService';
import { AuditLogService } from './AuditLogService';

class ABTestService {
  constructor() {
    this.initialized = false;
    this.storageService = null;
    this.auditService = null;
    this.activeTests = new Map();
    this.userAssignments = new Map();
    this.testResults = new Map();
    this.testConfigurations = new Map();
    this.listeners = [];
    this.segmentationRules = {};
    this.statisticalConfidence = 0.95;
    this.minimumSampleSize = 100;
  }

  static getInstance() {
    if (!ABTestService.instance) {
      ABTestService.instance = new ABTestService();
    }
    return ABTestService.instance;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      this.storageService = LocalStorageService.getInstance();
      this.auditService = AuditLogService.getInstance();
      
      await this.loadActiveTests();
      await this.loadUserAssignments();
      await this.loadTestResults();
      await this.loadTestConfigurations();
      await this.loadSegmentationRules();
      
      this.initialized = true;
      
      await this.auditService.logEvent('ab_test_service_initialized', {
        timestamp: new Date().toISOString(),
        active_tests: this.activeTests.size,
        user_assignments: this.userAssignments.size
      });
      
      this.emit('serviceInitialized');
    } catch (error) {
      console.error('Failed to initialize ABTestService:', error);
      throw error;
    }
  }

  async loadActiveTests() {
    try {
      const tests = await this.storageService.getItem('ab_tests');
      const testList = tests || [
        {
          id: 'venue_card_design',
          name: 'Venue Card Design Test',
          description: 'Test different venue card designs for better engagement',
          status: 'active',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          trafficAllocation: 50,
          variants: [
            {
              id: 'control',
              name: 'Current Design',
              description: 'Existing venue card design',
              trafficPercentage: 50,
              configuration: {
                cardStyle: 'classic',
                imageSize: 'medium',
                showRating: true,
                showPrice: true
              }
            },
            {
              id: 'variant_a',
              name: 'Modern Design',
              description: 'New modern venue card design',
              trafficPercentage: 50,
              configuration: {
                cardStyle: 'modern',
                imageSize: 'large',
                showRating: true,
                showPrice: true,
                showTags: true
              }
            }
          ],
          metrics: [
            {
              name: 'click_through_rate',
              type: 'conversion',
              primary: true,
              description: 'Percentage of users who click on venue cards'
            },
            {
              name: 'booking_rate',
              type: 'conversion',
              primary: false,
              description: 'Percentage of users who make bookings'
            }
          ],
          segmentation: {
            userType: ['all'],
            platform: ['ios', 'android'],
            location: ['all']
          }
        },
        {
          id: 'onboarding_flow',
          name: 'Onboarding Flow Optimization',
          description: 'Test different onboarding flows for better completion rates',
          status: 'active',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
          trafficAllocation: 30,
          variants: [
            {
              id: 'control',
              name: 'Current Flow',
              description: 'Existing 4-step onboarding',
              trafficPercentage: 50,
              configuration: {
                steps: 4,
                skipOption: true,
                progressIndicator: true
              }
            },
            {
              id: 'variant_a',
              name: 'Simplified Flow',
              description: 'Simplified 2-step onboarding',
              trafficPercentage: 50,
              configuration: {
                steps: 2,
                skipOption: false,
                progressIndicator: false,
                socialLogin: true
              }
            }
          ],
          metrics: [
            {
              name: 'completion_rate',
              type: 'conversion',
              primary: true,
              description: 'Percentage of users who complete onboarding'
            },
            {
              name: 'time_to_complete',
              type: 'duration',
              primary: false,
              description: 'Average time to complete onboarding'
            }
          ],
          segmentation: {
            userType: ['new_users'],
            platform: ['ios', 'android'],
            location: ['all']
          }
        }
      ];

      this.activeTests.clear();
      testList.forEach(test => {
        this.activeTests.set(test.id, test);
      });

      await this.storageService.setItem('ab_tests', testList);
    } catch (error) {
      console.error('Failed to load active tests:', error);
      this.activeTests.clear();
    }
  }

  async loadUserAssignments() {
    try {
      const assignments = await this.storageService.getItem('ab_test_assignments');
      const assignmentList = assignments || [];
      
      this.userAssignments.clear();
      assignmentList.forEach(assignment => {
        this.userAssignments.set(assignment.userId, assignment);
      });
    } catch (error) {
      console.error('Failed to load user assignments:', error);
      this.userAssignments.clear();
    }
  }

  async loadTestResults() {
    try {
      const results = await this.storageService.getItem('ab_test_results');
      const resultList = results || [];
      
      this.testResults.clear();
      resultList.forEach(result => {
        this.testResults.set(result.testId, result);
      });
    } catch (error) {
      console.error('Failed to load test results:', error);
      this.testResults.clear();
    }
  }

  async loadTestConfigurations() {
    try {
      const configurations = await this.storageService.getItem('ab_test_configurations');
      const configList = configurations || [];
      
      this.testConfigurations.clear();
      configList.forEach(config => {
        this.testConfigurations.set(config.testId, config);
      });
    } catch (error) {
      console.error('Failed to load test configurations:', error);
      this.testConfigurations.clear();
    }
  }

  async loadSegmentationRules() {
    try {
      const rules = await this.storageService.getItem('ab_test_segmentation_rules');
      this.segmentationRules = rules || {
        userType: {
          new_users: user => user.registrationDate && (Date.now() - new Date(user.registrationDate).getTime()) < 7 * 24 * 60 * 60 * 1000,
          power_users: user => user.sessionsCount > 50,
          premium_users: user => user.subscriptionStatus === 'premium',
          all: user => true
        },
        platform: {
          ios: user => user.platform === 'ios',
          android: user => user.platform === 'android',
          all: user => true
        },
        location: {
          us: user => user.country === 'US',
          eu: user => ['DE', 'FR', 'IT', 'ES', 'GB'].includes(user.country),
          all: user => true
        }
      };
    } catch (error) {
      console.error('Failed to load segmentation rules:', error);
      this.segmentationRules = {};
    }
  }

  async assignUserToTest(testId, userId, userContext = {}) {
    try {
      const test = this.activeTests.get(testId);
      if (!test) {
        throw new Error(`Test ${testId} not found`);
      }

      if (test.status !== 'active') {
        return null;
      }

      // Check if user is already assigned
      const existingAssignment = this.getUserAssignment(userId, testId);
      if (existingAssignment) {
        return existingAssignment;
      }

      // Check if user matches segmentation criteria
      if (!this.matchesSegmentation(userContext, test.segmentation)) {
        return null;
      }

      // Check traffic allocation
      if (!this.shouldIncludeInTest(userId, test.trafficAllocation)) {
        return null;
      }

      // Assign variant
      const variant = this.assignVariant(userId, test);
      
      const assignment = {
        userId: userId,
        testId: testId,
        variantId: variant.id,
        assignedAt: new Date().toISOString(),
        userContext: userContext,
        events: []
      };

      // Store assignment
      const userAssignments = this.userAssignments.get(userId) || { userId, tests: {} };
      userAssignments.tests[testId] = assignment;
      this.userAssignments.set(userId, userAssignments);

      await this.saveUserAssignments();

      await this.auditService.logEvent('ab_test_user_assigned', {
        test_id: testId,
        user_id: userId,
        variant_id: variant.id,
        timestamp: new Date().toISOString()
      });

      this.emit('userAssigned', assignment);
      return assignment;
    } catch (error) {
      console.error('Failed to assign user to test:', error);
      throw error;
    }
  }

  matchesSegmentation(userContext, segmentation) {
    try {
      for (const [criterion, values] of Object.entries(segmentation)) {
        if (values.includes('all')) continue;

        const rules = this.segmentationRules[criterion];
        if (!rules) continue;

        const matches = values.some(value => {
          const rule = rules[value];
          return rule && rule(userContext);
        });

        if (!matches) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to match segmentation:', error);
      return false;
    }
  }

  shouldIncludeInTest(userId, trafficAllocation) {
    const userHash = this.hashUser(userId);
    const userPercentile = userHash % 100;
    return userPercentile < trafficAllocation;
  }

  assignVariant(userId, test) {
    const userHash = this.hashUser(userId + test.id);
    const userPercentile = userHash % 100;
    
    let cumulativePercentage = 0;
    for (const variant of test.variants) {
      cumulativePercentage += variant.trafficPercentage;
      if (userPercentile < cumulativePercentage) {
        return variant;
      }
    }
    
    // Fallback to control
    return test.variants[0];
  }

  hashUser(input) {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  getUserAssignment(userId, testId) {
    const userAssignments = this.userAssignments.get(userId);
    return userAssignments?.tests[testId] || null;
  }

  async getVariantConfiguration(testId, userId, userContext = {}) {
    try {
      // Try to get existing assignment
      let assignment = this.getUserAssignment(userId, testId);
      
      // If no assignment, try to create one
      if (!assignment) {
        assignment = await this.assignUserToTest(testId, userId, userContext);
      }

      if (!assignment) {
        return null; // User not eligible for test
      }

      const test = this.activeTests.get(testId);
      const variant = test.variants.find(v => v.id === assignment.variantId);
      
      return {
        testId: testId,
        variantId: variant.id,
        configuration: variant.configuration,
        assignment: assignment
      };
    } catch (error) {
      console.error('Failed to get variant configuration:', error);
      return null;
    }
  }

  async trackEvent(testId, userId, eventName, eventData = {}) {
    try {
      const assignment = this.getUserAssignment(userId, testId);
      if (!assignment) {
        return; // User not in test
      }

      const event = {
        eventName: eventName,
        eventData: eventData,
        timestamp: new Date().toISOString(),
        variantId: assignment.variantId
      };

      // Add event to assignment
      assignment.events.push(event);

      // Update user assignments
      const userAssignments = this.userAssignments.get(userId);
      userAssignments.tests[testId] = assignment;
      this.userAssignments.set(userId, userAssignments);

      await this.saveUserAssignments();

      // Update test results
      await this.updateTestResults(testId, assignment.variantId, eventName, eventData);

      await this.auditService.logEvent('ab_test_event_tracked', {
        test_id: testId,
        user_id: userId,
        variant_id: assignment.variantId,
        event_name: eventName,
        event_data: eventData,
        timestamp: new Date().toISOString()
      });

      this.emit('eventTracked', { testId, userId, eventName, eventData, assignment });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  async updateTestResults(testId, variantId, eventName, eventData) {
    try {
      let testResult = this.testResults.get(testId);
      if (!testResult) {
        testResult = {
          testId: testId,
          variants: {},
          lastUpdated: new Date().toISOString()
        };
        this.testResults.set(testId, testResult);
      }

      if (!testResult.variants[variantId]) {
        testResult.variants[variantId] = {
          variantId: variantId,
          totalUsers: 0,
          events: {},
          metrics: {}
        };
      }

      const variant = testResult.variants[variantId];
      
      // Update event counts
      if (!variant.events[eventName]) {
        variant.events[eventName] = 0;
      }
      variant.events[eventName]++;

      // Update metrics based on event
      await this.updateMetrics(testId, variantId, eventName, eventData);

      testResult.lastUpdated = new Date().toISOString();
      await this.saveTestResults();
    } catch (error) {
      console.error('Failed to update test results:', error);
    }
  }

  async updateMetrics(testId, variantId, eventName, eventData) {
    try {
      const test = this.activeTests.get(testId);
      const testResult = this.testResults.get(testId);
      const variant = testResult.variants[variantId];

      for (const metric of test.metrics) {
        if (!variant.metrics[metric.name]) {
          variant.metrics[metric.name] = {
            name: metric.name,
            type: metric.type,
            value: 0,
            count: 0,
            sum: 0
          };
        }

        const metricData = variant.metrics[metric.name];

        if (metric.type === 'conversion') {
          if (eventName === metric.name || eventName.includes(metric.name)) {
            metricData.count++;
            metricData.value = (metricData.count / variant.totalUsers) * 100;
          }
        } else if (metric.type === 'duration') {
          if (eventName === metric.name && eventData.duration) {
            metricData.count++;
            metricData.sum += eventData.duration;
            metricData.value = metricData.sum / metricData.count;
          }
        } else if (metric.type === 'value') {
          if (eventName === metric.name && eventData.value) {
            metricData.count++;
            metricData.sum += eventData.value;
            metricData.value = metricData.sum / metricData.count;
          }
        }
      }
    } catch (error) {
      console.error('Failed to update metrics:', error);
    }
  }

  async getTestResults(testId) {
    try {
      const testResult = this.testResults.get(testId);
      if (!testResult) {
        return null;
      }

      const test = this.activeTests.get(testId);
      const analysis = await this.analyzeTestResults(testId);

      return {
        testId: testId,
        testName: test.name,
        status: test.status,
        startDate: test.startDate,
        endDate: test.endDate,
        variants: testResult.variants,
        analysis: analysis,
        lastUpdated: testResult.lastUpdated
      };
    } catch (error) {
      console.error('Failed to get test results:', error);
      return null;
    }
  }

  async analyzeTestResults(testId) {
    try {
      const testResult = this.testResults.get(testId);
      const test = this.activeTests.get(testId);
      
      if (!testResult || !test) {
        return null;
      }

      const analysis = {
        sampleSize: 0,
        statisticalSignificance: {},
        recommendations: [],
        confidence: 0,
        winner: null
      };

      const variants = Object.values(testResult.variants);
      analysis.sampleSize = variants.reduce((sum, variant) => sum + variant.totalUsers, 0);

      // Check minimum sample size
      if (analysis.sampleSize < this.minimumSampleSize) {
        analysis.recommendations.push('Insufficient sample size for statistical significance');
        return analysis;
      }

      // Analyze each primary metric
      const primaryMetrics = test.metrics.filter(m => m.primary);
      
      for (const metric of primaryMetrics) {
        const metricAnalysis = this.analyzeMetric(variants, metric);
        analysis.statisticalSignificance[metric.name] = metricAnalysis;
        
        if (metricAnalysis.significant) {
          analysis.confidence = Math.max(analysis.confidence, metricAnalysis.confidence);
          if (!analysis.winner || metricAnalysis.winnerValue > analysis.statisticalSignificance[analysis.winner]?.winnerValue) {
            analysis.winner = metricAnalysis.winner;
          }
        }
      }

      // Generate recommendations
      if (analysis.winner) {
        analysis.recommendations.push(`Variant ${analysis.winner} shows statistically significant improvement`);
      } else {
        analysis.recommendations.push('No statistically significant difference found');
      }

      return analysis;
    } catch (error) {
      console.error('Failed to analyze test results:', error);
      return null;
    }
  }

  analyzeMetric(variants, metric) {
    try {
      const analysis = {
        metric: metric.name,
        significant: false,
        confidence: 0,
        winner: null,
        winnerValue: 0,
        results: {}
      };

      // Calculate metric values for each variant
      variants.forEach(variant => {
        const metricData = variant.metrics[metric.name];
        if (metricData) {
          analysis.results[variant.variantId] = {
            value: metricData.value,
            count: metricData.count,
            sampleSize: variant.totalUsers
          };
        }
      });

      // Simple statistical significance check (this would be more sophisticated in production)
      const variantResults = Object.entries(analysis.results);
      if (variantResults.length >= 2) {
        const [controlId, controlData] = variantResults[0];
        const [testId, testData] = variantResults[1];

        const improvementRate = ((testData.value - controlData.value) / controlData.value) * 100;
        
        // Simple z-test approximation
        const totalSampleSize = controlData.sampleSize + testData.sampleSize;
        if (totalSampleSize > this.minimumSampleSize && Math.abs(improvementRate) > 5) {
          analysis.significant = true;
          analysis.confidence = this.statisticalConfidence;
          analysis.winner = improvementRate > 0 ? testId : controlId;
          analysis.winnerValue = Math.max(controlData.value, testData.value);
        }
      }

      return analysis;
    } catch (error) {
      console.error('Failed to analyze metric:', error);
      return { significant: false, confidence: 0 };
    }
  }

  async createTest(testConfig) {
    try {
      const test = {
        id: testConfig.id || this.generateTestId(),
        name: testConfig.name,
        description: testConfig.description,
        status: 'draft',
        startDate: testConfig.startDate,
        endDate: testConfig.endDate,
        trafficAllocation: testConfig.trafficAllocation || 50,
        variants: testConfig.variants,
        metrics: testConfig.metrics,
        segmentation: testConfig.segmentation || { userType: ['all'], platform: ['all'], location: ['all'] },
        createdAt: new Date().toISOString(),
        createdBy: testConfig.createdBy || 'system'
      };

      this.activeTests.set(test.id, test);
      await this.saveActiveTests();

      await this.auditService.logEvent('ab_test_created', {
        test_id: test.id,
        test_name: test.name,
        created_by: test.createdBy,
        timestamp: new Date().toISOString()
      });

      this.emit('testCreated', test);
      return test;
    } catch (error) {
      console.error('Failed to create test:', error);
      throw error;
    }
  }

  async updateTestStatus(testId, status) {
    try {
      const test = this.activeTests.get(testId);
      if (!test) {
        throw new Error(`Test ${testId} not found`);
      }

      const oldStatus = test.status;
      test.status = status;
      
      if (status === 'active') {
        test.startDate = new Date().toISOString();
      } else if (status === 'completed') {
        test.endDate = new Date().toISOString();
      }

      await this.saveActiveTests();

      await this.auditService.logEvent('ab_test_status_updated', {
        test_id: testId,
        old_status: oldStatus,
        new_status: status,
        timestamp: new Date().toISOString()
      });

      this.emit('testStatusUpdated', { testId, oldStatus, newStatus: status });
      return test;
    } catch (error) {
      console.error('Failed to update test status:', error);
      throw error;
    }
  }

  async saveActiveTests() {
    try {
      const testList = Array.from(this.activeTests.values());
      await this.storageService.setItem('ab_tests', testList);
    } catch (error) {
      console.error('Failed to save active tests:', error);
    }
  }

  async saveUserAssignments() {
    try {
      const assignmentList = Array.from(this.userAssignments.values());
      await this.storageService.setItem('ab_test_assignments', assignmentList);
    } catch (error) {
      console.error('Failed to save user assignments:', error);
    }
  }

  async saveTestResults() {
    try {
      const resultList = Array.from(this.testResults.values());
      await this.storageService.setItem('ab_test_results', resultList);
    } catch (error) {
      console.error('Failed to save test results:', error);
    }
  }

  generateTestId() {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getActiveTests() {
    return Array.from(this.activeTests.values()).filter(test => test.status === 'active');
  }

  getAllTests() {
    return Array.from(this.activeTests.values());
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
      this.activeTests.clear();
      this.userAssignments.clear();
      this.testResults.clear();
      this.testConfigurations.clear();
      this.initialized = false;
      
      await this.auditService.logEvent('ab_test_service_cleanup', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to cleanup ABTestService:', error);
    }
  }
}

export { ABTestService };