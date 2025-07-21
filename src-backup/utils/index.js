import { Platform } from 'react-native';

// 日付・時間関連のユーティリティ
export const formatDate = (date, format = 'short') => {
  const d = new Date(date);
  
  switch (format) {
    case 'short':
      return d.toLocaleDateString('ja-JP');
    case 'long':
      return d.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    case 'time':
      return d.toLocaleString('ja-JP');
    default:
      return d.toLocaleDateString('ja-JP');
  }
};

export const isExpired = (date) => {
  return new Date(date) < new Date();
};

export const getDaysUntil = (date) => {
  const target = new Date(date);
  const now = new Date();
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const formatDuration = (days) => {
  if (days < 1) return '今日まで';
  if (days === 1) return '明日まで';
  if (days < 7) return `${days}日後まで`;
  if (days < 30) return `${Math.floor(days / 7)}週間後まで`;
  return `${Math.floor(days / 30)}ヶ月後まで`;
};

// 文字列関連のユーティリティ
export const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const capitalizeFirst = (text) => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const formatPhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{4})(\d{4})$/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  return phone;
};

// 数値関連のユーティリティ
export const formatPrice = (price, currency = 'JPY') => {
  if (currency === 'JPY') {
    return `¥${price.toLocaleString()}`;
  }
  return `${currency} ${price.toLocaleString()}`;
};

export const formatPercentage = (value) => {
  return `${value}%`;
};

export const calculateDiscount = (originalPrice, discountValue, discountType) => {
  if (discountType === 'percentage') {
    return originalPrice * (discountValue / 100);
  }
  return discountValue;
};

// 配列・オブジェクト関連のユーティリティ
export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = key(item);
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {});
};

export const sortBy = (array, key, direction = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

export const filterBy = (array, filters) => {
  return array.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      if (value === undefined || value === null) return true;
      return item[key] === value;
    });
  });
};

export const uniqueBy = (array, key) => {
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
};

// 検証関連のユーティリティ
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  const phoneRegex = /^[\d\-\+\(\)\s]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

export const validateRequired = (value) => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
};

export const validateMinLength = (value, minLength) => {
  return value.length >= minLength;
};

export const validateMaxLength = (value, maxLength) => {
  return value.length <= maxLength;
};

// ストレージ関連のユーティリティ
export const storage = {
  async get(key) {
    try {
      // 実際のアプリではAsyncStorageを使用
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },

  async set(key, value) {
    try {
      // 実際のアプリではAsyncStorageを使用
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Storage set error:', error);
    }
  },

  async remove(key) {
    try {
      // 実際のアプリではAsyncStorageを使用
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Storage remove error:', error);
    }
  },

  async clear() {
    try {
      // 実際のアプリではAsyncStorageを使用
      localStorage.clear();
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  }
};

// エラーハンドリング関連のユーティリティ
export const handleError = (error, context = 'Unknown') => {
  console.error(`Error in ${context}:`, error);
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (error?.error) {
    return error.error;
  }
  
  return '予期しないエラーが発生しました';
};

export const createError = (message, code) => {
  const error = new Error(message);
  error.code = code;
  return error;
};

// デバウンス・スロットル関連のユーティリティ
export const debounce = (func, wait) => {
  let timeout;
  
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  
  return (...args) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// パフォーマンス関連のユーティリティ
export const measurePerformance = (name, fn) => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  console.log(`${name} took ${end - start}ms`);
  return result;
};

// 環境関連のユーティリティ
export const isDevelopment = () => {
  return global.__DEV__ || process?.env?.NODE_ENV === 'development';
};

export const isProduction = () => {
  return !isDevelopment();
};

// デバイス関連のユーティリティ
export const isIOS = () => {
  return Platform?.OS === 'ios';
};

export const isAndroid = () => {
  return Platform?.OS === 'android';
};

// 色関連のユーティリティ
export const hexToRgba = (hex, alpha = 1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const getContrastColor = (hexColor) => {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#FFFFFF';
};

// ランダム関連のユーティリティ
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const randomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const randomChoice = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

// 条件分岐関連のユーティリティ
export const classNames = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

export const conditional = (condition, trueValue, falseValue) => {
  return condition ? trueValue : falseValue;
};

// 非同期関連のユーティリティ
export const delay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const retry = async (fn, maxAttempts = 3, delayMs = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await delay(delayMs * attempt);
      }
    }
  }
  
  throw lastError;
};

// 型ガード関連のユーティリティ
export const isString = (value) => {
  return typeof value === 'string';
};

export const isNumber = (value) => {
  return typeof value === 'number' && !isNaN(value);
};

export const isBoolean = (value) => {
  return typeof value === 'boolean';
};

export const isArray = (value) => {
  return Array.isArray(value);
};

export const isObject = (value) => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const isFunction = (value) => {
  return typeof value === 'function';
}; 