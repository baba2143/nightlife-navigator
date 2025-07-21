// グローバルモックの設定ファイル

// Expo Font のモック
jest.mock('expo-font', () => ({
  loadAsync: jest.fn(() => Promise.resolve()),
  isLoaded: jest.fn(() => true),
  processFontFamily: jest.fn((font) => font),
}));

// Expo Image のモック
jest.mock('expo-image', () => ({
  Image: require('react-native').Image,
}));

// Expo Vector Icons のモック
jest.mock('@expo/vector-icons', () => {
  const { Text } = require('react-native');
  
  return {
    Ionicons: (props) => Text({ ...props, children: props.name }),
    MaterialIcons: (props) => Text({ ...props, children: props.name }),
    FontAwesome: (props) => Text({ ...props, children: props.name }),
    AntDesign: (props) => Text({ ...props, children: props.name }),
    Feather: (props) => Text({ ...props, children: props.name }),
  };
});

// React Native Vector Icons のモック (optional)
// jest.mock('react-native-vector-icons/Ionicons', () => {
//   const { Text } = require('react-native');
//   return (props) => Text({ ...props, children: props.name });
// });

// React Native WebView のモック
jest.mock('react-native-webview', () => {
  const { View } = require('react-native');
  return {
    WebView: View,
  };
});

// Expo Linking のモック
jest.mock('expo-linking', () => ({
  openURL: jest.fn(() => Promise.resolve()),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
  getInitialURL: jest.fn(() => Promise.resolve(null)),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  createURL: jest.fn((path) => `exp://localhost:19000${path}`),
}));

// Expo Camera のモック
jest.mock('expo-camera', () => ({
  Camera: require('react-native').View,
  requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getCameraPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
}));

// Expo Location のモック
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(() => Promise.resolve({
    coords: {
      latitude: 35.6762,
      longitude: 139.6503,
      accuracy: 10,
    },
  })),
  watchPositionAsync: jest.fn(() => Promise.resolve({
    remove: jest.fn(),
  })),
}));

// Expo System UI のモック
jest.mock('expo-system-ui', () => ({
  setBackgroundColorAsync: jest.fn(() => Promise.resolve()),
}));

// Expo Status Bar のモック
jest.mock('expo-status-bar', () => ({
  StatusBar: require('react-native').View,
  setStatusBarStyle: jest.fn(),
  setStatusBarBackgroundColor: jest.fn(),
}));

// React Native Safe Area Context のモック
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: View,
    useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 375, height: 812 }),
  };
});

// React Native Screens のモック
jest.mock('react-native-screens', () => {
  const { View } = require('react-native');
  
  return {
    enableScreens: jest.fn(),
    Screen: View,
    ScreenContainer: View,
    NativeScreen: View,
    NativeScreenContainer: View,
  };
});

// Base64 のモック
jest.mock('base-64', () => ({
  encode: jest.fn((str) => Buffer.from(str).toString('base64')),
  decode: jest.fn((str) => Buffer.from(str, 'base64').toString()),
}));

// Buffer のモック
global.Buffer = global.Buffer || require('buffer').Buffer;

// AbortController のモック
global.AbortController = global.AbortController || class AbortController {
  constructor() {
    this.signal = { aborted: false };
  }
  
  abort() {
    this.signal.aborted = true;
  }
};

// FormData のモック
global.FormData = global.FormData || class FormData {
  constructor() {
    this.data = new Map();
  }
  
  append(key, value) {
    this.data.set(key, value);
  }
  
  get(key) {
    return this.data.get(key);
  }
  
  has(key) {
    return this.data.has(key);
  }
};

// URLSearchParams のモック
global.URLSearchParams = global.URLSearchParams || class URLSearchParams {
  constructor(params = {}) {
    this.params = new Map();
    if (typeof params === 'string') {
      // 簡単な実装
      params.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        if (key) this.params.set(key, value || '');
      });
    } else if (typeof params === 'object') {
      Object.entries(params).forEach(([key, value]) => {
        this.params.set(key, String(value));
      });
    }
  }
  
  toString() {
    const pairs = [];
    for (const [key, value] of this.params) {
      pairs.push(`${key}=${value}`);
    }
    return pairs.join('&');
  }
};

// Web APIs のモック
global.URL = global.URL || class URL {
  constructor(url, base) {
    this.href = url;
    this.protocol = 'https:';
    this.host = 'localhost';
    this.pathname = '/';
    this.search = '';
    this.hash = '';
  }
  
  toString() {
    return this.href;
  }
};

// IntersectionObserver のモック
global.IntersectionObserver = global.IntersectionObserver || class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// ResizeObserver のモック
global.ResizeObserver = global.ResizeObserver || class ResizeObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// matchMedia のモック
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Error のスタックトレースを改善
Error.stackTraceLimit = 100;