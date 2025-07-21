// Mock setup for React Native testing
import 'react-native-gesture-handler/jestSetup';

/* eslint-env jest */

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Expo Location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({
      coords: {
        latitude: 35.6762,
        longitude: 139.6503,
        accuracy: 5,
      },
    })
  ),
  reverseGeocodeAsync: jest.fn(() =>
    Promise.resolve([{
      city: 'Tokyo',
      country: 'Japan',
      district: 'Shibuya',
      name: 'Shibuya',
      postalCode: '150-0002',
      region: 'Tokyo',
      street: 'Shibuya',
    }])
  ),
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      dispatch: jest.fn(),
    }),
  };
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};