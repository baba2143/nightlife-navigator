import {
  isStrongPassword,
  validateEmailFormat,
  sanitizeInput,
  generateSecureId,
  hashPassword,
  validatePasswordComplexity,
  generateSecureToken,
  isValidPhoneNumber,
  formatPhoneNumber,
  validateUserInput,
  createPasswordHash,
  verifyPasswordHash,
  generateOTP,
  validateOTP,
  createSecureHeaders,
  sanitizeFileName,
  isValidDateFormat,
  formatDate,
  generateDeviceId,
  validateDeviceId
} from '../authUtils';

// bcryptのモック
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
  genSalt: jest.fn()
}));

// crypto-jsのモック
jest.mock('crypto-js', () => ({
  SHA256: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('hashed_value')
  }),
  enc: {
    Hex: 'hex'
  }
}));

// expo-cryptoのモック
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn().mockReturnValue('uuid-12345-67890'),
  getRandomBytesAsync: jest.fn()
}));

import bcrypt from 'bcrypt';
import CryptoJS from 'crypto-js';
import * as Crypto from 'expo-crypto';

describe('authUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isStrongPassword', () => {
    it('強力なパスワードの場合、trueを返す', () => {
      const strongPasswords = [
        'StrongPass123!',
        'MySecure@Password1',
        'Complex#Pass2023',
        'Test$Password456'
      ];

      strongPasswords.forEach(password => {
        expect(isStrongPassword(password)).toBe(true);
      });
    });

    it('弱いパスワードの場合、falseを返す', () => {
      const weakPasswords = [
        'password',
        '123456',
        'PASSWORD',
        'Pass123',
        'password123',
        'PASSWORD123',
        'Aa1',
        ''
      ];

      weakPasswords.forEach(password => {
        expect(isStrongPassword(password)).toBe(false);
      });
    });
  });

  describe('validateEmailFormat', () => {
    it('有効なメールアドレスの場合、trueを返す', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.jp',
        'user+tag@example.org',
        'user123@test-domain.com',
        'a@b.co'
      ];

      validEmails.forEach(email => {
        expect(validateEmailFormat(email)).toBe(true);
      });
    });

    it('無効なメールアドレスの場合、falseを返す', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com',
        'user..name@example.com',
        'user name@example.com',
        '',
        'user@domain'
      ];

      invalidEmails.forEach(email => {
        expect(validateEmailFormat(email)).toBe(false);
      });
    });
  });

  describe('sanitizeInput', () => {
    it('HTMLタグを除去する', () => {
      const input = '<script>alert("xss")</script>Hello World';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello World');
    });

    it('特殊文字をエスケープする', () => {
      const input = 'Hello & <World>';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello &amp; World');
    });

    it('空文字列を適切に処理する', () => {
      const result = sanitizeInput('');
      expect(result).toBe('');
    });

    it('nullやundefinedを適切に処理する', () => {
      expect(sanitizeInput(null)).toBe('');
      expect(sanitizeInput(undefined)).toBe('');
    });
  });

  describe('generateSecureId', () => {
    it('指定された長さのIDを生成する', () => {
      const id = generateSecureId(32);
      expect(id).toHaveLength(32);
      expect(typeof id).toBe('string');
    });

    it('デフォルトの長さでIDを生成する', () => {
      const id = generateSecureId();
      expect(id).toHaveLength(16);
      expect(typeof id).toBe('string');
    });

    it('毎回異なるIDを生成する', () => {
      const id1 = generateSecureId();
      const id2 = generateSecureId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('hashPassword', () => {
    it('パスワードをハッシュ化する', async () => {
      const password = 'testPassword123';
      const hashedPassword = 'hashed_password_123';
      
      bcrypt.genSalt.mockResolvedValueOnce('salt');
      bcrypt.hash.mockResolvedValueOnce(hashedPassword);

      const result = await hashPassword(password);

      expect(result).toBe(hashedPassword);
      expect(bcrypt.genSalt).toHaveBeenCalledWith(12);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 'salt');
    });

    it('カスタムソルトラウンドでハッシュ化する', async () => {
      const password = 'testPassword123';
      const hashedPassword = 'hashed_password_123';
      const saltRounds = 10;
      
      bcrypt.genSalt.mockResolvedValueOnce('salt');
      bcrypt.hash.mockResolvedValueOnce(hashedPassword);

      const result = await hashPassword(password, saltRounds);

      expect(result).toBe(hashedPassword);
      expect(bcrypt.genSalt).toHaveBeenCalledWith(saltRounds);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 'salt');
    });
  });

  describe('validatePasswordComplexity', () => {
    it('複雑なパスワードの詳細な検証を行う', () => {
      const result = validatePasswordComplexity('StrongPass123!');
      
      expect(result).toEqual({
        isValid: true,
        score: expect.any(Number),
        feedback: expect.any(Array),
        requirements: {
          length: true,
          uppercase: true,
          lowercase: true,
          numbers: true,
          symbols: true
        }
      });
    });

    it('弱いパスワードの詳細な検証を行う', () => {
      const result = validatePasswordComplexity('weak');
      
      expect(result).toEqual({
        isValid: false,
        score: expect.any(Number),
        feedback: expect.any(Array),
        requirements: {
          length: false,
          uppercase: false,
          lowercase: true,
          numbers: false,
          symbols: false
        }
      });
    });
  });

  describe('generateSecureToken', () => {
    it('セキュアトークンを生成する', () => {
      const token = generateSecureToken();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('指定された長さのトークンを生成する', () => {
      const token = generateSecureToken(64);
      expect(token).toHaveLength(64);
    });
  });

  describe('isValidPhoneNumber', () => {
    it('有効な電話番号の場合、trueを返す', () => {
      const validNumbers = [
        '+1234567890',
        '+81-90-1234-5678',
        '+81 90 1234 5678',
        '090-1234-5678',
        '(090) 1234-5678'
      ];

      validNumbers.forEach(number => {
        expect(isValidPhoneNumber(number)).toBe(true);
      });
    });

    it('無効な電話番号の場合、falseを返す', () => {
      const invalidNumbers = [
        '123',
        'abc-def-ghij',
        '+',
        '090-123-456',
        '090123456789012345',
        ''
      ];

      invalidNumbers.forEach(number => {
        expect(isValidPhoneNumber(number)).toBe(false);
      });
    });
  });

  describe('formatPhoneNumber', () => {
    it('電話番号を適切にフォーマットする', () => {
      expect(formatPhoneNumber('09012345678')).toBe('090-1234-5678');
      expect(formatPhoneNumber('0312345678')).toBe('03-1234-5678');
      expect(formatPhoneNumber('+819012345678')).toBe('+81-90-1234-5678');
    });

    it('既にフォーマットされた電話番号をそのまま返す', () => {
      expect(formatPhoneNumber('090-1234-5678')).toBe('090-1234-5678');
    });

    it('無効な電話番号の場合、元の値を返す', () => {
      expect(formatPhoneNumber('invalid')).toBe('invalid');
      expect(formatPhoneNumber('')).toBe('');
    });
  });

  describe('validateUserInput', () => {
    it('ユーザー入力の総合的な検証を行う', () => {
      const userInput = {
        email: 'test@example.com',
        password: 'StrongPass123!',
        name: 'John Doe',
        phone: '090-1234-5678'
      };

      const result = validateUserInput(userInput);
      
      expect(result).toEqual({
        isValid: true,
        errors: [],
        warnings: []
      });
    });

    it('無効な入力の場合、エラーを返す', () => {
      const userInput = {
        email: 'invalid-email',
        password: 'weak',
        name: '',
        phone: 'invalid-phone'
      };

      const result = validateUserInput(userInput);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(expect.arrayContaining([
        expect.stringContaining('email'),
        expect.stringContaining('password'),
        expect.stringContaining('name'),
        expect.stringContaining('phone')
      ]));
    });
  });

  describe('createPasswordHash', () => {
    it('パスワードハッシュを作成する', async () => {
      const password = 'testPassword123';
      const hashedPassword = 'hashed_password_123';
      
      bcrypt.hash.mockResolvedValueOnce(hashedPassword);

      const result = await createPasswordHash(password);

      expect(result).toBe(hashedPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
    });
  });

  describe('verifyPasswordHash', () => {
    it('パスワードハッシュを検証する', async () => {
      const password = 'testPassword123';
      const hashedPassword = 'hashed_password_123';
      
      bcrypt.compare.mockResolvedValueOnce(true);

      const result = await verifyPasswordHash(password, hashedPassword);

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });

    it('間違ったパスワードの場合、falseを返す', async () => {
      const password = 'wrongPassword';
      const hashedPassword = 'hashed_password_123';
      
      bcrypt.compare.mockResolvedValueOnce(false);

      const result = await verifyPasswordHash(password, hashedPassword);

      expect(result).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });
  });

  describe('generateOTP', () => {
    it('OTPを生成する', () => {
      const otp = generateOTP();
      expect(otp).toHaveLength(6);
      expect(/^\d{6}$/.test(otp)).toBe(true);
    });

    it('指定された長さのOTPを生成する', () => {
      const otp = generateOTP(8);
      expect(otp).toHaveLength(8);
      expect(/^\d{8}$/.test(otp)).toBe(true);
    });
  });

  describe('validateOTP', () => {
    it('有効なOTPの場合、trueを返す', () => {
      expect(validateOTP('123456')).toBe(true);
      expect(validateOTP('000000')).toBe(true);
      expect(validateOTP('999999')).toBe(true);
    });

    it('無効なOTPの場合、falseを返す', () => {
      expect(validateOTP('12345')).toBe(false);
      expect(validateOTP('1234567')).toBe(false);
      expect(validateOTP('abcdef')).toBe(false);
      expect(validateOTP('')).toBe(false);
    });
  });

  describe('createSecureHeaders', () => {
    it('セキュアヘッダーを作成する', () => {
      const headers = createSecureHeaders();
      
      expect(headers).toEqual({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy': "default-src 'self'",
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      });
    });

    it('カスタムヘッダーを追加する', () => {
      const customHeaders = {
        'Custom-Header': 'value',
        'Another-Header': 'another-value'
      };

      const headers = createSecureHeaders(customHeaders);
      
      expect(headers).toEqual(expect.objectContaining({
        'X-Content-Type-Options': 'nosniff',
        'Custom-Header': 'value',
        'Another-Header': 'another-value'
      }));
    });
  });

  describe('sanitizeFileName', () => {
    it('ファイル名を適切にサニタイズする', () => {
      expect(sanitizeFileName('test file.txt')).toBe('test_file.txt');
      expect(sanitizeFileName('file/with\\path.txt')).toBe('file_with_path.txt');
      expect(sanitizeFileName('file<>:|*?.txt')).toBe('file______.txt');
    });

    it('空文字列を適切に処理する', () => {
      expect(sanitizeFileName('')).toBe('untitled');
    });

    it('nullやundefinedを適切に処理する', () => {
      expect(sanitizeFileName(null)).toBe('untitled');
      expect(sanitizeFileName(undefined)).toBe('untitled');
    });
  });

  describe('isValidDateFormat', () => {
    it('有効な日付形式の場合、trueを返す', () => {
      expect(isValidDateFormat('2024-01-01')).toBe(true);
      expect(isValidDateFormat('2024-12-31')).toBe(true);
      expect(isValidDateFormat('2000-02-29')).toBe(true);
    });

    it('無効な日付形式の場合、falseを返す', () => {
      expect(isValidDateFormat('2024-13-01')).toBe(false);
      expect(isValidDateFormat('2024-01-32')).toBe(false);
      expect(isValidDateFormat('2023-02-29')).toBe(false);
      expect(isValidDateFormat('invalid-date')).toBe(false);
      expect(isValidDateFormat('')).toBe(false);
    });
  });

  describe('formatDate', () => {
    it('日付を適切にフォーマットする', () => {
      const date = new Date('2024-01-01T10:30:00Z');
      expect(formatDate(date)).toBe('2024-01-01');
    });

    it('日付文字列を適切にフォーマットする', () => {
      expect(formatDate('2024-01-01')).toBe('2024-01-01');
    });

    it('無効な日付の場合、nullを返す', () => {
      expect(formatDate('invalid-date')).toBeNull();
      expect(formatDate(null)).toBeNull();
      expect(formatDate(undefined)).toBeNull();
    });
  });

  describe('generateDeviceId', () => {
    it('デバイスIDを生成する', () => {
      const deviceId = generateDeviceId();
      expect(typeof deviceId).toBe('string');
      expect(deviceId.length).toBeGreaterThan(0);
    });

    it('毎回異なるデバイスIDを生成する', () => {
      const deviceId1 = generateDeviceId();
      const deviceId2 = generateDeviceId();
      expect(deviceId1).not.toBe(deviceId2);
    });
  });

  describe('validateDeviceId', () => {
    it('有効なデバイスIDの場合、trueを返す', () => {
      const validDeviceIds = [
        'device_12345678901234567890123456789012',
        'device_abcdefghijklmnopqrstuvwxyz123456',
        'device_ABCDEFGHIJKLMNOPQRSTUVWXYZ123456'
      ];

      validDeviceIds.forEach(deviceId => {
        expect(validateDeviceId(deviceId)).toBe(true);
      });
    });

    it('無効なデバイスIDの場合、falseを返す', () => {
      const invalidDeviceIds = [
        'device_12345',
        'invalid_prefix_123456789012345678901234567890',
        'device_123456789012345678901234567890123456789',
        'device_123456789012345678901234567890!@#$',
        '',
        null,
        undefined
      ];

      invalidDeviceIds.forEach(deviceId => {
        expect(validateDeviceId(deviceId)).toBe(false);
      });
    });
  });
});