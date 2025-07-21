module.exports = {
  // テスト環境の設定
  testEnvironment: 'jsdom',
  
  // テストファイルのパターン
  testMatch: [
    '**/__tests__/**/*.(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)'
  ],
  
  // テスト対象外のファイル
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/build/',
    '<rootDir>/.expo/',
    '<rootDir>/src-backup/',
    '<rootDir>/src/__tests__/setup.js',
    '<rootDir>/src/__tests__/mocks.js'
  ],
  
  // ファイル変換の設定
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'
  },
  
  // ファイル変換対象外
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|@react-navigation|react-navigation|@unimodules|unimodules|sentry-expo|native-base|react-clone-referenced-element|@react-native-community|react-native-svg|react-native-screens|react-native-reanimated|react-native-gesture-handler|react-native-vector-icons|react-native-safe-area-context|@react-native-async-storage|crypto-js)/)'
  ],
  
  // セットアップファイル
  setupFilesAfterEnv: [
    '<rootDir>/src/__tests__/setup.js'
  ],
  
  // モジュールの名前解決
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  
  // カバレッジの設定
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}',
    '!src/**/index.{js,jsx,ts,tsx}',
    '!src/constants/**',
    '!src/config/**',
    '!src/utils/jwtTest.js',
    '!src/utils/securityTest.js',
    '!src/components/ui/Animation.js',
    '!src/components/ui/AnimatedComponents.js',
    '!src/components/ui/Layout.js',
    '!src/components/ui/ThemeSelector.js',
    '!src/components/ui/Button.js',
    '!src/components/ui/Card.js',
    '!src/components/ui/Form.js',
    '!src/components/ui/Icon.js',
    '!src/components/ui/Input.js',
    '!src/components/ui/Modal.js',
    '!src/components/ui/Navigation.js',
    '!src/components/ui/SearchBar.js',
    '!src/components/ui/Text.js',
    '!src/components/ui/AccessibilityUtils.js',
    '!src/components/ui/Badge.js'
  ],
  
  // カバレッジレポートの形式
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary',
    'cobertura'
  ],
  
  // カバレッジの閾値
  coverageThreshold: {
    global: {
      branches: 20,
      functions: 20,
      lines: 20,
      statements: 20
    },
    // 個別ファイルの閾値
    './src/services/*.js': {
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 30
    },
    './src/utils/*.js': {
      branches: 25,
      functions: 25,
      lines: 25,
      statements: 25
    }
  },
  
  // モックの設定
  setupFiles: [
    '<rootDir>/src/__tests__/mocks.js'
  ],
  
  // テストタイムアウト
  testTimeout: 10000,
  
  // 詳細な出力
  verbose: true,
  
  // ウォッチモードでの設定
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.expo/',
    '<rootDir>/dist/'
  ],
  
  // Expo特有の設定
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json'
  ],
  
  // グローバル変数の設定
  globals: {
    '__DEV__': true
  }
};