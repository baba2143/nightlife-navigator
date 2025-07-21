/**
 * Circuit Breaker Service
 * Implements circuit breaker pattern for error handling and system resilience
 */

import LoggingService from './LoggingService';
import LocalStorageService from './LocalStorageService';
import MonitoringManager from './MonitoringManager';

class CircuitBreakerService {
  constructor() {
    this.initialized = false;
    this.circuits = new Map();
    this.defaultConfig = {
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 minute
      monitoringPeriod: 10000, // 10 seconds
      expectedErrors: ['NetworkError', 'TimeoutError'],
      volumeThreshold: 10, // Minimum calls before circuit can trip
      healthCheckInterval: 30000, // 30 seconds
    };
    
    // Circuit states
    this.states = {
      CLOSED: 'closed',
      OPEN: 'open',
      HALF_OPEN: 'half_open',
    };
    
    // Statistics
    this.stats = {
      totalCircuits: 0,
      trippedCircuits: 0,
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      circuitTrips: 0,
      circuitResets: 0,
    };
    
    // Event listeners
    this.listeners = new Set();
  }

  /**
   * Initialize circuit breaker service
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Load circuit states
      await this.loadCircuitStates();
      
      // Setup health check monitoring
      this.setupHealthCheckMonitoring();
      
      this.initialized = true;
      
      LoggingService.info('[CircuitBreakerService] Initialized', {
        circuits: this.circuits.size,
        healthCheckInterval: this.defaultConfig.healthCheckInterval,
      });

    } catch (error) {
      LoggingService.error('[CircuitBreakerService] Failed to initialize', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Create or get circuit breaker
   */
  getCircuit(name, config = {}) {
    if (!this.circuits.has(name)) {
      const circuitConfig = { ...this.defaultConfig, ...config };
      const circuit = {
        name,
        state: this.states.CLOSED,
        config: circuitConfig,
        metrics: {
          failures: 0,
          successes: 0,
          totalCalls: 0,
          lastFailureTime: null,
          lastSuccessTime: null,
          lastStateChange: Date.now(),
          callHistory: [],
        },
        nextAttempt: 0,
        healthCheckTimer: null,
      };
      
      this.circuits.set(name, circuit);
      this.stats.totalCircuits++;
      
      LoggingService.debug('[CircuitBreakerService] Circuit created', {
        name,
        config: circuitConfig,
      });
    }
    
    return this.circuits.get(name);
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute(circuitName, fn, config = {}) {
    const circuit = this.getCircuit(circuitName, config);
    
    try {
      // Check if circuit allows execution
      if (!this.canExecute(circuit)) {
        const error = new Error(`Circuit breaker ${circuitName} is OPEN`);
        error.circuitState = circuit.state;
        throw error;
      }
      
      // Record call attempt
      this.recordCallAttempt(circuit);
      
      // Execute function
      const startTime = Date.now();
      const result = await fn();
      const duration = Date.now() - startTime;
      
      // Record success
      this.recordSuccess(circuit, duration);
      
      LoggingService.debug('[CircuitBreakerService] Call succeeded', {
        circuit: circuitName,
        duration,
        state: circuit.state,
      });
      
      return result;

    } catch (error) {
      // Record failure
      this.recordFailure(circuit, error);
      
      LoggingService.warn('[CircuitBreakerService] Call failed', {
        circuit: circuitName,
        error: error.message,
        state: circuit.state,
      });
      
      throw error;
    }
  }

  /**
   * Check if circuit allows execution
   */
  canExecute(circuit) {
    const now = Date.now();
    
    switch (circuit.state) {
      case this.states.CLOSED:
        return true;
        
      case this.states.OPEN:
        if (now >= circuit.nextAttempt) {
          this.changeState(circuit, this.states.HALF_OPEN);
          return true;
        }
        return false;
        
      case this.states.HALF_OPEN:
        return true;
        
      default:
        return false;
    }
  }

  /**
   * Record call attempt
   */
  recordCallAttempt(circuit) {
    circuit.metrics.totalCalls++;
    this.stats.totalCalls++;
    
    // Maintain call history for monitoring period
    const now = Date.now();
    circuit.metrics.callHistory.push({
      timestamp: now,
      type: 'attempt',
    });
    
    this.cleanupOldHistory(circuit);
  }

  /**
   * Record successful call
   */
  recordSuccess(circuit, duration = 0) {
    const now = Date.now();
    
    circuit.metrics.successes++;
    circuit.metrics.lastSuccessTime = now;
    this.stats.successfulCalls++;
    
    // Add success to history
    circuit.metrics.callHistory.push({
      timestamp: now,
      type: 'success',
      duration,
    });
    
    // Reset circuit if it was half-open
    if (circuit.state === this.states.HALF_OPEN) {
      this.resetCircuit(circuit);
    }
    
    // Notify listeners
    this.notifyListeners('call_success', {
      circuit: circuit.name,
      state: circuit.state,
      metrics: circuit.metrics,
    });
  }

  /**
   * Record failed call
   */
  recordFailure(circuit, error) {
    const now = Date.now();
    
    circuit.metrics.failures++;
    circuit.metrics.lastFailureTime = now;
    this.stats.failedCalls++;
    
    // Add failure to history
    circuit.metrics.callHistory.push({
      timestamp: now,
      type: 'failure',
      error: error.message,
    });
    
    // Check if circuit should trip
    this.checkCircuitHealth(circuit);
    
    // Notify listeners
    this.notifyListeners('call_failure', {
      circuit: circuit.name,
      state: circuit.state,
      error: error.message,
      metrics: circuit.metrics,
    });
  }

  /**
   * Check circuit health and trip if necessary
   */
  checkCircuitHealth(circuit) {
    const recentHistory = this.getRecentHistory(circuit);
    const totalCalls = recentHistory.length;
    
    // Don't trip if volume threshold not met
    if (totalCalls < circuit.config.volumeThreshold) {
      return;
    }
    
    const failures = recentHistory.filter(call => call.type === 'failure').length;
    const failureRate = failures / totalCalls;
    const threshold = circuit.config.failureThreshold / 100; // Convert to percentage
    
    // Trip circuit if failure rate exceeds threshold
    if (failureRate >= threshold && circuit.state !== this.states.OPEN) {
      this.tripCircuit(circuit);
    }
  }

  /**
   * Trip circuit breaker
   */
  tripCircuit(circuit) {
    this.changeState(circuit, this.states.OPEN);
    circuit.nextAttempt = Date.now() + circuit.config.recoveryTimeout;
    
    this.stats.circuitTrips++;
    this.stats.trippedCircuits++;
    
    LoggingService.warn('[CircuitBreakerService] Circuit tripped', {
      circuit: circuit.name,
      failures: circuit.metrics.failures,
      totalCalls: circuit.metrics.totalCalls,
      nextAttempt: new Date(circuit.nextAttempt).toISOString(),
    });
    
    // Track analytics
    MonitoringManager.trackEvent?.('circuit_breaker_tripped', {
      circuit: circuit.name,
      failures: circuit.metrics.failures,
      totalCalls: circuit.metrics.totalCalls,
    });
    
    // Start health check monitoring
    this.startHealthCheck(circuit);
    
    // Notify listeners
    this.notifyListeners('circuit_tripped', {
      circuit: circuit.name,
      metrics: circuit.metrics,
      nextAttempt: circuit.nextAttempt,
    });
  }

  /**
   * Reset circuit breaker
   */
  resetCircuit(circuit) {
    this.changeState(circuit, this.states.CLOSED);
    circuit.metrics.failures = 0;
    circuit.nextAttempt = 0;
    
    this.stats.circuitResets++;
    if (this.stats.trippedCircuits > 0) {
      this.stats.trippedCircuits--;
    }
    
    LoggingService.info('[CircuitBreakerService] Circuit reset', {
      circuit: circuit.name,
      successes: circuit.metrics.successes,
    });
    
    // Stop health check monitoring
    this.stopHealthCheck(circuit);
    
    // Notify listeners
    this.notifyListeners('circuit_reset', {
      circuit: circuit.name,
      metrics: circuit.metrics,
    });
  }

  /**
   * Change circuit state
   */
  changeState(circuit, newState) {
    const oldState = circuit.state;
    circuit.state = newState;
    circuit.metrics.lastStateChange = Date.now();
    
    LoggingService.debug('[CircuitBreakerService] State changed', {
      circuit: circuit.name,
      from: oldState,
      to: newState,
    });
    
    // Save state persistence
    this.saveCircuitState(circuit);
    
    // Notify listeners
    this.notifyListeners('state_change', {
      circuit: circuit.name,
      from: oldState,
      to: newState,
      timestamp: circuit.metrics.lastStateChange,
    });
  }

  /**
   * Get recent call history
   */
  getRecentHistory(circuit) {
    const cutoffTime = Date.now() - circuit.config.monitoringPeriod;
    return circuit.metrics.callHistory.filter(call => call.timestamp >= cutoffTime);
  }

  /**
   * Cleanup old history entries
   */
  cleanupOldHistory(circuit) {
    const cutoffTime = Date.now() - circuit.config.monitoringPeriod;
    circuit.metrics.callHistory = circuit.metrics.callHistory.filter(
      call => call.timestamp >= cutoffTime
    );
  }

  /**
   * Start health check monitoring
   */
  startHealthCheck(circuit) {
    if (circuit.healthCheckTimer) {
      clearInterval(circuit.healthCheckTimer);
    }
    
    circuit.healthCheckTimer = setInterval(async () => {
      try {
        await this.performHealthCheck(circuit);
      } catch (error) {
        LoggingService.error('[CircuitBreakerService] Health check failed', {
          circuit: circuit.name,
          error: error.message,
        });
      }
    }, circuit.config.healthCheckInterval);
  }

  /**
   * Stop health check monitoring
   */
  stopHealthCheck(circuit) {
    if (circuit.healthCheckTimer) {
      clearInterval(circuit.healthCheckTimer);
      circuit.healthCheckTimer = null;
    }
  }

  /**
   * Perform health check
   */
  async performHealthCheck(circuit) {
    if (circuit.state !== this.states.OPEN) {
      return;
    }
    
    const now = Date.now();
    if (now >= circuit.nextAttempt) {
      LoggingService.debug('[CircuitBreakerService] Health check - moving to half-open', {
        circuit: circuit.name,
      });
      
      this.changeState(circuit, this.states.HALF_OPEN);
    }
  }

  /**
   * Setup health check monitoring for all circuits
   */
  setupHealthCheckMonitoring() {
    setInterval(() => {
      for (const circuit of this.circuits.values()) {
        this.cleanupOldHistory(circuit);
        
        // Perform periodic health assessment
        if (circuit.state === this.states.OPEN) {
          this.performHealthCheck(circuit);
        }
      }
    }, this.defaultConfig.healthCheckInterval);
  }

  /**
   * Force reset circuit
   */
  forceReset(circuitName) {
    const circuit = this.circuits.get(circuitName);
    if (!circuit) {
      throw new Error(`Circuit ${circuitName} not found`);
    }
    
    this.resetCircuit(circuit);
    
    LoggingService.info('[CircuitBreakerService] Circuit force reset', {
      circuit: circuitName,
    });
  }

  /**
   * Force trip circuit
   */
  forceTrip(circuitName) {
    const circuit = this.circuits.get(circuitName);
    if (!circuit) {
      throw new Error(`Circuit ${circuitName} not found`);
    }
    
    this.tripCircuit(circuit);
    
    LoggingService.info('[CircuitBreakerService] Circuit force tripped', {
      circuit: circuitName,
    });
  }

  /**
   * Get circuit status
   */
  getCircuitStatus(circuitName) {
    const circuit = this.circuits.get(circuitName);
    if (!circuit) {
      return null;
    }
    
    const recentHistory = this.getRecentHistory(circuit);
    const recentFailures = recentHistory.filter(call => call.type === 'failure').length;
    const recentSuccesses = recentHistory.filter(call => call.type === 'success').length;
    const failureRate = recentHistory.length > 0 ? recentFailures / recentHistory.length : 0;
    
    return {
      name: circuit.name,
      state: circuit.state,
      config: circuit.config,
      metrics: {
        ...circuit.metrics,
        recentCalls: recentHistory.length,
        recentFailures,
        recentSuccesses,
        failureRate: Math.round(failureRate * 100),
      },
      nextAttempt: circuit.nextAttempt,
      canExecute: this.canExecute(circuit),
    };
  }

  /**
   * Get all circuit statuses
   */
  getAllCircuitStatuses() {
    const statuses = [];
    for (const circuitName of this.circuits.keys()) {
      statuses.push(this.getCircuitStatus(circuitName));
    }
    return statuses.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Save circuit state for persistence
   */
  async saveCircuitState(circuit) {
    try {
      const stateData = {
        name: circuit.name,
        state: circuit.state,
        metrics: circuit.metrics,
        nextAttempt: circuit.nextAttempt,
        lastSaved: Date.now(),
      };
      
      await LocalStorageService.setItem(`circuit_state_${circuit.name}`, stateData);

    } catch (error) {
      LoggingService.warn('[CircuitBreakerService] Failed to save circuit state', {
        circuit: circuit.name,
        error: error.message,
      });
    }
  }

  /**
   * Load circuit states from persistence
   */
  async loadCircuitStates() {
    try {
      const keys = await LocalStorageService.getAllKeys();
      const circuitKeys = keys.filter(key => key.startsWith('circuit_state_'));
      
      for (const key of circuitKeys) {
        try {
          const stateData = await LocalStorageService.getItem(key);
          if (stateData) {
            const circuit = this.getCircuit(stateData.name);
            circuit.state = stateData.state;
            circuit.metrics = { ...circuit.metrics, ...stateData.metrics };
            circuit.nextAttempt = stateData.nextAttempt || 0;
            
            // Start health check if circuit is open
            if (circuit.state === this.states.OPEN) {
              this.startHealthCheck(circuit);
            }
          }
        } catch (error) {
          LoggingService.warn('[CircuitBreakerService] Failed to load circuit state', {
            key,
            error: error.message,
          });
        }
      }
      
      LoggingService.debug('[CircuitBreakerService] Circuit states loaded', {
        circuits: this.circuits.size,
      });

    } catch (error) {
      LoggingService.error('[CircuitBreakerService] Failed to load circuit states', {
        error: error.message,
      });
    }
  }

  /**
   * Get service statistics
   */
  getStatistics() {
    const openCircuits = Array.from(this.circuits.values()).filter(
      circuit => circuit.state === this.states.OPEN
    ).length;
    
    const halfOpenCircuits = Array.from(this.circuits.values()).filter(
      circuit => circuit.state === this.states.HALF_OPEN
    ).length;
    
    return {
      ...this.stats,
      openCircuits,
      halfOpenCircuits,
      activeCircuits: this.circuits.size,
      initialized: this.initialized,
    };
  }

  /**
   * Add event listener
   */
  addListener(listener) {
    this.listeners.add(listener);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify event listeners
   */
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        LoggingService.error('[CircuitBreakerService] Listener error', {
          error: error.message,
          event,
        });
      }
    });
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Stop all health check timers
    for (const circuit of this.circuits.values()) {
      this.stopHealthCheck(circuit);
    }
    
    this.circuits.clear();
    this.listeners.clear();
    this.initialized = false;
  }
}

// Create singleton instance
const circuitBreakerService = new CircuitBreakerService();

export default circuitBreakerService;