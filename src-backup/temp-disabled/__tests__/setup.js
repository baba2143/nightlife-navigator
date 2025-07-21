// テスト環境のセットアップファイル
import 'react-native-gesture-handler/jestSetup';

// React Native Testing Library の拡張マッチャーをインポート
import '@testing-library/react-native/extend-expect';

// React Native の警告を抑制
// import { LogBox } from 'react-native';
// LogBox.ignoreAllLogs(true);

// Console の警告とエラーを抑制（テスト中のノイズを減らす）
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Expo modules のモック
jest.mock('expo-constants', () => ({
  default: {
    appOwnership: 'standalone',
    expoVersion: '49.0.0',
    manifest: {},
    platform: {
      ios: {
        buildNumber: '1',
        platform: 'ios',
      },
    },
  },
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn(() => Promise.resolve(new Uint8Array(32))),
  digestStringAsync: jest.fn(() => Promise.resolve('mockedHash')),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA256',
  },
}));

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  supportedAuthenticationTypesAsync: jest.fn(() => Promise.resolve([1, 2])),
  authenticateAsync: jest.fn(() => Promise.resolve({ success: true })),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('notification-id')),
}));

// React Navigation のモック
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
    reset: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
    name: 'TestScreen',
  }),
  useFocusEffect: jest.fn(),
  NavigationContainer: ({ children }) => children,
}));

// AsyncStorage のモック
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  multiSet: jest.fn(() => Promise.resolve()),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiRemove: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
}));

// Reanimated のモック
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  
  // useSharedValue のモック
  Reanimated.default.call = () => {};
  
  return Reanimated;
});

// Gesture Handler のモック
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View;
  
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    FlatList: View,
    gestureHandlerRootHOC: jest.fn((component) => component),
    Directions: {},
  };
});

// Crypto-JS のモック
jest.mock('crypto-js', () => ({
  AES: {
    encrypt: jest.fn(() => ({ toString: () => 'encrypted' })),
    decrypt: jest.fn(() => ({ toString: () => 'decrypted' })),
  },
  enc: {
    Utf8: {
      parse: jest.fn(),
      stringify: jest.fn(),
    },
    Base64: {
      stringify: jest.fn(() => 'base64string'),
      parse: jest.fn(),
    },
  },
  HmacSHA256: jest.fn(() => 'hash'),
  SHA256: jest.fn(() => ({ toString: () => 'hash' })),
}));

// Fetch のモック
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    headers: {
      get: jest.fn(() => 'application/json'),
    },
  })
);

// Date のモック（テストの一貫性のため）
const mockDate = new Date('2024-01-01T00:00:00Z');
global.Date = class extends Date {
  constructor(...args) {
    if (args.length === 0) {
      return mockDate;
    }
    return new Date(...args);
  }
  
  static now() {
    return mockDate.getTime();
  }
};

// Math.random のモック（予測可能なテストのため）
const mockMath = Object.create(global.Math);
mockMath.random = () => 0.5;
global.Math = mockMath;

// setTimeout/setInterval のモック
jest.useFakeTimers();

// React Native のモック
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
    prompt: jest.fn(),
  },
  Platform: {
    OS: 'ios',
    select: jest.fn((options) => options.ios),
    Version: '15.0',
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812 })),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
  PixelRatio: {
    get: jest.fn(() => 2),
    getFontScale: jest.fn(() => 1),
  },
  AppState: {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    currentState: 'active',
  },
  LogBox: {
    ignoreAllLogs: jest.fn(),
  },
  View: jest.fn(({ children }) => children),
  Text: jest.fn(({ children }) => children),
  TouchableOpacity: jest.fn(({ children }) => children),
  ScrollView: jest.fn(({ children }) => children),
  TextInput: jest.fn(),
  Image: jest.fn(),
  StyleSheet: {
    create: jest.fn((styles) => styles),
    flatten: jest.fn(),
  },
  SafeAreaView: jest.fn(({ children }) => children),
  Button: jest.fn(),
  Switch: jest.fn(),
  FlatList: jest.fn(),
  SectionList: jest.fn(),
  KeyboardAvoidingView: jest.fn(({ children }) => children),
  Modal: jest.fn(({ children }) => children),
}));

// ユーティリティ関数のモック
global.mockComponent = (name) => {
  return (props) => {
    const React = require('react');
    const { View, Text } = require('react-native');
    
    return React.createElement(
      View,
      { testID: `mock-${name}`, ...props },
      React.createElement(Text, null, `Mock ${name}`)
    );
  };
};

// テスト後のクリーンアップ
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
});

beforeEach(() => {
  jest.clearAllMocks();
});

// グローバルなテストデータ
global.testData = {
  user: {
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'テストユーザー',
    role: 'user',
  },
  bar: {
    id: 'test-bar-123',
    name: 'テストバー',
    genre: 'スナック／パブ',
    rating: 4.5,
    reviewCount: 10,
  },
  coupon: {
    id: 'test-coupon-123',
    title: 'テストクーポン',
    discount: '50%OFF',
    type: 'store_coupon',
    isActive: true,
  },
};