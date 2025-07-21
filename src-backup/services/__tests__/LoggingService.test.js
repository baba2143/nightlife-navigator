/**
 * LoggingService Tests
 */

import { jest } from '@jest/globals';

// Mock AsyncStorage
const mockAsyncStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiRemove: jest.fn(),
};

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    Version: '14.0',
  },
}));

// Mock ConfigService
const mockConfigService = {
  getConfig: jest.fn(() => ({
    environment: 'test',
    isDevelopment: true,
    isProduction: false,
    logging: {
      level: 'debug',
      enableConsole: true,
      enablePersistence: true,
    },
  })),
  getApiConfig: jest.fn(() => ({
    baseURL: 'http://localhost:8000',
    version: 'v1',
  })),
};

jest.mock('../ConfigService', () => mockConfigService);

// Mock fetch
global.fetch = jest.fn();

// Import after mocking
import LoggingService from '../LoggingService';

describe('LoggingService', () => {
  beforeEach(() => {
    // Reset service state
    LoggingService.logLevel = 2; // INFO
    LoggingService.loggers.clear();
    LoggingService.logBuffer = [];
    LoggingService.initialized = false;
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    LoggingService.cleanup();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await LoggingService.initialize();
      
      expect(LoggingService.initialized).toBe(true);
      expect(LoggingService.loggers.size).toBeGreaterThan(0);
    });

    it('should not reinitialize if already initialized', async () => {
      LoggingService.initialized = true;
      const setupLoggersSpy = jest.spyOn(LoggingService, 'setupLoggers');
      
      await LoggingService.initialize();
      
      expect(setupLoggersSpy).not.toHaveBeenCalled();
    });

    it('should setup loggers based on configuration', async () => {
      await LoggingService.initialize();
      
      expect(LoggingService.loggers.has('console')).toBe(true);
      expect(LoggingService.loggers.has('storage')).toBe(true);
    });

    it('should set log level from configuration', async () => {
      mockConfigService.getConfig.mockReturnValue({
        environment: 'test',
        logging: { level: 'warn' },
      });
      
      await LoggingService.initialize();
      
      expect(LoggingService.getCurrentLogLevel()).toBe('WARN');
    });
  });

  describe('log levels', () => {
    beforeEach(async () => {
      await LoggingService.initialize();
    });

    it('should respect log level filtering', () => {
      LoggingService.setLogLevel('warn');
      
      expect(LoggingService.shouldLog(1)).toBe(false); // DEBUG
      expect(LoggingService.shouldLog(2)).toBe(false); // INFO
      expect(LoggingService.shouldLog(3)).toBe(true);  // WARN
      expect(LoggingService.shouldLog(4)).toBe(true);  // ERROR
    });

    it('should handle invalid log levels', () => {
      const consoleSpy = jest.spyOn(console, 'warn');
      
      LoggingService.setLogLevel('invalid');
      
      expect(LoggingService.getCurrentLogLevel()).toBe('INFO');
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('logging methods', () => {
    beforeEach(async () => {
      await LoggingService.initialize();
      LoggingService.setLogLevel('trace'); // Allow all logs
    });

    it('should log trace messages', () => {
      LoggingService.trace('Test trace message', { key: 'value' });
      
      expect(console.debug).toHaveBeenCalled();
    });

    it('should log debug messages', () => {
      LoggingService.debug('Test debug message', { key: 'value' });
      
      expect(console.debug).toHaveBeenCalled();
    });

    it('should log info messages', () => {
      LoggingService.info('Test info message', { key: 'value' });
      
      expect(console.info).toHaveBeenCalled();
    });

    it('should log warning messages', () => {
      LoggingService.warn('Test warning message', { key: 'value' });
      
      expect(console.warn).toHaveBeenCalled();
    });

    it('should log error messages', () => {
      LoggingService.error('Test error message', { key: 'value' });
      
      expect(console.error).toHaveBeenCalled();
    });

    it('should log fatal messages', () => {
      LoggingService.fatal('Test fatal message', { key: 'value' });
      
      expect(console.error).toHaveBeenCalled();
    });

    it('should not log below current level', () => {
      LoggingService.setLogLevel('error');
      
      LoggingService.info('Test info message');
      LoggingService.warn('Test warning message');
      
      expect(console.info).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  describe('specialized logging', () => {
    beforeEach(async () => {
      await LoggingService.initialize();
    });

    it('should log API calls', () => {
      const infoSpy = jest.spyOn(LoggingService, 'info');
      
      LoggingService.logApiCall('GET', '/api/test', {}, { data: 'response' }, 150);
      
      expect(infoSpy).toHaveBeenCalledWith(
        'API Call: GET /api/test',
        expect.objectContaining({
          method: 'GET',
          url: '/api/test',
          duration: 150,
        }),
        expect.objectContaining({ category: 'api' })
      );
    });

    it('should log API errors', () => {
      const errorSpy = jest.spyOn(LoggingService, 'error');
      const error = new Error('Network error');
      
      LoggingService.logApiCall('POST', '/api/test', {}, null, 5000, error);
      
      expect(errorSpy).toHaveBeenCalledWith(
        'API Error: POST /api/test',
        expect.objectContaining({
          method: 'POST',
          url: '/api/test',
          duration: 5000,
          error: 'Network error',
        }),
        expect.objectContaining({ category: 'api' })
      );
    });

    it('should log user actions', () => {
      const infoSpy = jest.spyOn(LoggingService, 'info');
      
      LoggingService.logUserAction('button_click', 'home_screen', { buttonId: 'submit' });
      
      expect(infoSpy).toHaveBeenCalledWith(
        'User Action: button_click',
        expect.objectContaining({
          action: 'button_click',
          screen: 'home_screen',
          buttonId: 'submit',
        }),
        expect.objectContaining({ category: 'user_action' })
      );
    });

    it('should log navigation events', () => {
      const infoSpy = jest.spyOn(LoggingService, 'info');
      
      LoggingService.logNavigation('home', 'profile', { userId: '123' });
      
      expect(infoSpy).toHaveBeenCalledWith(
        'Navigation: home -> profile',
        expect.objectContaining({
          from: 'home',
          to: 'profile',
          params: { userId: '123' },
        }),
        expect.objectContaining({ category: 'navigation' })
      );
    });

    it('should log performance metrics', () => {
      const infoSpy = jest.spyOn(LoggingService, 'info');
      
      LoggingService.logPerformance('render_time', 50, 'ms', { component: 'Header' });
      
      expect(infoSpy).toHaveBeenCalledWith(
        'Performance: render_time',
        expect.objectContaining({
          metric: 'render_time',
          value: 50,
          unit: 'ms',
          component: 'Header',
        }),
        expect.objectContaining({ category: 'performance' })
      );
    });
  });

  describe('performance timing', () => {
    beforeEach(async () => {
      await LoggingService.initialize();
    });

    it('should track timing operations', () => {
      LoggingService.startTiming('test_operation');
      
      expect(LoggingService.performanceMarks.has('test_operation')).toBe(true);
    });

    it('should end timing and calculate duration', () => {
      const logPerformanceSpy = jest.spyOn(LoggingService, 'logPerformance');
      
      LoggingService.startTiming('test_operation');
      
      // Mock passage of time
      const originalNow = Date.now;
      Date.now = jest.fn()
        .mockReturnValueOnce(1000) // start time
        .mockReturnValueOnce(1150); // end time
      
      const duration = LoggingService.endTiming('test_operation');
      
      expect(duration).toBe(150);
      expect(logPerformanceSpy).toHaveBeenCalledWith(
        'test_operation',
        150,
        'ms',
        {}
      );
      
      Date.now = originalNow;
    });

    it('should return null for non-existent timers', () => {
      const duration = LoggingService.endTiming('non_existent');
      
      expect(duration).toBeNull();
    });
  });

  describe('user context', () => {
    beforeEach(async () => {
      await LoggingService.initialize();
    });

    it('should set user context', () => {
      LoggingService.setUser('user123', { name: 'John Doe', email: 'john@example.com' });
      
      expect(LoggingService.userId).toBe('user123');
      expect(LoggingService.metadata.user).toEqual({
        id: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
      });
    });

    it('should include user context in logs', () => {
      LoggingService.setUser('user123');
      
      const logSpy = jest.spyOn(LoggingService, 'log');
      LoggingService.info('Test message');
      
      expect(logSpy).toHaveBeenCalledWith(
        2, // INFO level
        'Test message',
        {},
        expect.objectContaining({
          userId: 'user123',
        })
      );
    });
  });

  describe('metadata and context', () => {
    beforeEach(async () => {
      await LoggingService.initialize();
    });

    it('should set metadata', () => {
      LoggingService.setMetadata('feature', 'dark_mode');
      
      expect(LoggingService.metadata.feature).toBe('dark_mode');
    });

    it('should include metadata in logs', () => {
      LoggingService.setMetadata('version', '1.2.3');
      
      const logSpy = jest.spyOn(LoggingService, 'log');
      LoggingService.info('Test message');
      
      expect(logSpy).toHaveBeenCalledWith(
        2, // INFO level
        'Test message',
        {},
        expect.objectContaining({
          version: '1.2.3',
        })
      );
    });
  });

  describe('remote logging', () => {
    beforeEach(async () => {
      mockConfigService.getConfig.mockReturnValue({
        environment: 'production',
        isProduction: true,
        logging: { level: 'info' },
      });
      
      await LoggingService.initialize();
    });

    it('should add logs to buffer for remote sending', () => {
      LoggingService.error('Test error');
      
      expect(LoggingService.logBuffer.length).toBeGreaterThan(0);
    });

    it('should flush logs to server', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      });
      
      LoggingService.logBuffer = [
        { level: 'ERROR', message: 'Test error', timestamp: new Date().toISOString() },
      ];
      
      await LoggingService.flushRemoteLogs();
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/logs',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle remote logging failures gracefully', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));
      
      LoggingService.logBuffer = [
        { level: 'ERROR', message: 'Test error', timestamp: new Date().toISOString() },
      ];
      
      await LoggingService.flushRemoteLogs();
      
      // Should not throw, buffer should still contain logs
      expect(LoggingService.logBuffer.length).toBeGreaterThan(0);
    });
  });

  describe('log persistence', () => {
    beforeEach(async () => {
      await LoggingService.initialize();
    });

    it('should persist error logs locally', async () => {
      await LoggingService.persistLogEntry({
        level: 'ERROR',
        message: 'Test error',
        timestamp: new Date().toISOString(),
      });
      
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should load persisted logs on initialization', async () => {
      const persistedLogs = [
        ['log_123', JSON.stringify({ level: 'ERROR', message: 'Test error' })],
      ];
      
      mockAsyncStorage.getAllKeys.mockResolvedValue(['log_123']);
      mockAsyncStorage.multiGet.mockResolvedValue(persistedLogs);
      
      await LoggingService.loadPersistedLogs();
      
      expect(LoggingService.logBuffer.length).toBeGreaterThan(0);
      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith(['log_123']);
    });

    it('should cleanup old logs', async () => {
      const oldLogKeys = Array.from({ length: 150 }, (_, i) => `log_${i}`);
      
      mockAsyncStorage.getAllKeys.mockResolvedValue(oldLogKeys);
      
      await LoggingService.cleanupOldLogs();
      
      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith(
        oldLogKeys.slice(0, 50) // Should remove first 50 logs
      );
    });
  });

  describe('logger management', () => {
    beforeEach(async () => {
      await LoggingService.initialize();
    });

    it('should add custom loggers', () => {
      const customLogger = {
        log: jest.fn(),
      };
      
      LoggingService.addLogger('custom', customLogger);
      
      expect(LoggingService.loggers.has('custom')).toBe(true);
    });

    it('should remove loggers', () => {
      LoggingService.removeLogger('console');
      
      expect(LoggingService.loggers.has('console')).toBe(false);
    });

    it('should handle logger errors gracefully', () => {
      const faultyLogger = {
        log: jest.fn(() => {
          throw new Error('Logger error');
        }),
      };
      
      LoggingService.addLogger('faulty', faultyLogger);
      
      expect(() => {
        LoggingService.info('Test message');
      }).not.toThrow();
    });
  });

  describe('statistics and export', () => {
    beforeEach(async () => {
      await LoggingService.initialize();
    });

    it('should provide log statistics', () => {
      LoggingService.logBuffer = [{ test: 'log' }];
      LoggingService.performanceMeasures = [{ test: 'measure' }];
      
      const stats = LoggingService.getLogStatistics();
      
      expect(stats).toEqual({
        sessionId: LoggingService.sessionId,
        currentLogLevel: 'INFO',
        bufferedLogs: 1,
        performanceMeasures: 1,
        activeLoggers: expect.any(Array),
      });
    });

    it('should export logs for debugging', async () => {
      LoggingService.logBuffer = [{ test: 'log' }];
      LoggingService.performanceMeasures = [{ test: 'measure' }];
      
      mockAsyncStorage.getAllKeys.mockResolvedValue(['log_123']);
      mockAsyncStorage.multiGet.mockResolvedValue([
        ['log_123', JSON.stringify({ test: 'persisted' })],
      ]);
      
      const exported = await LoggingService.exportLogs();
      
      expect(exported).toEqual({
        statistics: expect.any(Object),
        bufferedLogs: [{ test: 'log' }],
        persistedLogs: [{ test: 'persisted' }],
        performanceLogs: [{ test: 'measure' }],
        metadata: LoggingService.metadata,
        exportedAt: expect.any(String),
      });
    });

    it('should clear all logs', async () => {
      LoggingService.logBuffer = [{ test: 'log' }];
      LoggingService.performanceMeasures = [{ test: 'measure' }];
      
      mockAsyncStorage.getAllKeys.mockResolvedValue(['log_123']);
      
      await LoggingService.clearLogs();
      
      expect(LoggingService.logBuffer).toEqual([]);
      expect(LoggingService.performanceMeasures).toEqual([]);
      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith(['log_123']);
    });
  });

  describe('cleanup', () => {
    beforeEach(async () => {
      await LoggingService.initialize();
    });

    it('should cleanup resources properly', () => {
      LoggingService.logBuffer = [{ test: 'log' }];
      
      LoggingService.cleanup();
      
      expect(LoggingService.loggers.size).toBe(0);
      expect(LoggingService.logBuffer).toEqual([]);
      expect(LoggingService.initialized).toBe(false);
    });
  });
});