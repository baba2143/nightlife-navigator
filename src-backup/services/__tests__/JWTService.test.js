import { jest } from '@jest/globals';
import jwtService from '../JWTService';
import securityManager from '../../utils/security';

// セキュリティマネージャーのモック
jest.mock('../../utils/security', () => ({
  secureStore: jest.fn(),
  secureRetrieve: jest.fn(),
  generateSecureRandom: jest.fn(),
}));

describe('JWTService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jwtService.secretKey = null;
    
    // デフォルトのモック実装
    securityManager.generateSecureRandom.mockResolvedValue('mock-random-key-12345678901234567890123456789012');
    securityManager.secureStore.mockResolvedValue(true);
    securityManager.secureRetrieve.mockResolvedValue(null);
  });

  describe('初期化', () => {
    it('正常に初期化される', async () => {
      const result = await jwtService.initialize();
      
      expect(result).toBe(true);
      expect(securityManager.generateSecureRandom).toHaveBeenCalledWith(32);
      expect(securityManager.secureStore).toHaveBeenCalledWith(
        'jwt_secret_key',
        expect.any(String)
      );
    });

    it('既存のシークレットキーがある場合は再利用される', async () => {
      const existingKey = 'existing-key-12345678901234567890123456789012';
      securityManager.secureRetrieve.mockResolvedValue(existingKey);
      
      await jwtService.initialize();
      
      expect(jwtService.secretKey).toBe(existingKey);
      expect(securityManager.generateSecureRandom).not.toHaveBeenCalled();
    });

    it('エラーが発生した場合はfalseを返す', async () => {
      securityManager.generateSecureRandom.mockRejectedValue(new Error('Test error'));
      
      const result = await jwtService.initialize();
      
      expect(result).toBe(false);
    });
  });

  describe('Base64URL エンコード/デコード', () => {
    it('正しくBase64URLエンコードされる', () => {
      const input = 'test string';
      const result = jwtService.base64URLEncode(input);
      
      // Base64URL形式（+, /, = を置換）
      expect(result).not.toContain('+');
      expect(result).not.toContain('/');
      expect(result).not.toContain('=');
    });

    it('正しくBase64URLデコードされる', () => {
      const original = 'test string';
      const encoded = jwtService.base64URLEncode(original);
      const decoded = jwtService.base64URLDecode(encoded);
      
      expect(decoded).toBe(original);
    });

    it('パディングが正しく処理される', () => {
      const testCases = ['a', 'ab', 'abc', 'abcd'];
      
      testCases.forEach(input => {
        const encoded = jwtService.base64URLEncode(input);
        const decoded = jwtService.base64URLDecode(encoded);
        expect(decoded).toBe(input);
      });
    });
  });

  describe('JWTヘッダーとペイロード作成', () => {
    it('正しいヘッダーが作成される', () => {
      const header = jwtService.createHeader();
      const decoded = JSON.parse(jwtService.base64URLDecode(header));
      
      expect(decoded.alg).toBe('HS256');
      expect(decoded.typ).toBe('JWT');
    });

    it('正しいペイロードが作成される', () => {
      const userData = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'user'
      };
      
      const options = {
        expiresIn: 3600,
        sessionId: 'session123'
      };
      
      const payload = jwtService.createPayload(userData, options);
      const decoded = JSON.parse(jwtService.base64URLDecode(payload));
      
      expect(decoded.sub).toBe('user123');
      expect(decoded.email).toBe('test@example.com');
      expect(decoded.role).toBe('user');
      expect(decoded.sessionId).toBe('session123');
      expect(decoded.iss).toBe('nightlife-navigator');
      expect(decoded.aud).toBe('nightlife-users');
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });
  });

  describe('トークン生成', () => {
    beforeEach(async () => {
      await jwtService.initialize();
    });

    it('有効なJWTトークンが生成される', async () => {
      const userData = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'user'
      };
      
      const result = await jwtService.generateToken(userData);
      
      expect(result.token).toBeDefined();
      expect(result.expiresAt).toBeGreaterThan(Date.now());
      expect(result.tokenType).toBe('Bearer');
      
      // JWT形式の確認
      const parts = result.token.split('.');
      expect(parts).toHaveLength(3);
    });

    it('カスタムオプションが正しく適用される', async () => {
      const userData = {
        userId: 'user123',
        email: 'test@example.com'
      };
      
      const options = {
        expiresIn: 7200,
        sessionId: 'custom-session',
        deviceId: 'device123'
      };
      
      const result = await jwtService.generateToken(userData, options);
      const decoded = jwtService.decodeToken(result.token);
      
      expect(decoded.payload.sessionId).toBe('custom-session');
      expect(decoded.payload.deviceId).toBe('device123');
    });

    it('リフレッシュトークンが生成される', async () => {
      const userData = {
        userId: 'user123',
        email: 'test@example.com'
      };
      
      const result = await jwtService.generateRefreshToken(userData);
      const decoded = jwtService.decodeToken(result.token);
      
      expect(decoded.payload.jti).toContain('refresh_');
      expect(result.token).toBeDefined();
    });

    it('トークンペアが生成される', async () => {
      const userData = {
        userId: 'user123',
        email: 'test@example.com'
      };
      
      const result = await jwtService.generateTokenPair(userData);
      
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.sessionId).toBeDefined();
      expect(result.tokenType).toBe('Bearer');
      
      // 両方のトークンが有効なJWT形式
      expect(result.accessToken.split('.')).toHaveLength(3);
      expect(result.refreshToken.split('.')).toHaveLength(3);
    });
  });

  describe('トークン検証', () => {
    let validToken;
    
    beforeEach(async () => {
      await jwtService.initialize();
      const userData = { userId: 'user123', email: 'test@example.com' };
      const result = await jwtService.generateToken(userData);
      validToken = result.token;
    });

    it('有効なトークンが正しく検証される', async () => {
      const result = await jwtService.verifyToken(validToken);
      
      expect(result.valid).toBe(true);
      expect(result.payload.sub).toBe('user123');
      expect(result.payload.email).toBe('test@example.com');
    });

    it('無効な形式のトークンは拒否される', async () => {
      const invalidTokens = [
        '',
        'invalid',
        'invalid.token',
        'invalid.token.format.extra',
        null,
        undefined
      ];
      
      for (const token of invalidTokens) {
        const result = await jwtService.verifyToken(token);
        expect(result.valid).toBe(false);
      }
    });

    it('改ざんされたトークンは拒否される', async () => {
      const parts = validToken.split('.');
      const tamperedToken = `${parts[0]}.${parts[1]}.invalid-signature`;
      
      const result = await jwtService.verifyToken(tamperedToken);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('署名が無効');
    });

    it('期限切れトークンは拒否される', async () => {
      const userData = { userId: 'user123', email: 'test@example.com' };
      const expiredTokenResult = await jwtService.generateToken(userData, { expiresIn: -1 });
      
      const result = await jwtService.verifyToken(expiredTokenResult.token);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('有効期限');
    });

    it('Bearer プレフィックス付きトークンも正しく処理される', async () => {
      const bearerToken = `Bearer ${validToken}`;
      
      const result = await jwtService.verifyToken(bearerToken);
      
      expect(result.valid).toBe(true);
    });
  });

  describe('トークンデコード', () => {
    let validToken;
    
    beforeEach(async () => {
      await jwtService.initialize();
      const userData = { userId: 'user123', email: 'test@example.com' };
      const result = await jwtService.generateToken(userData);
      validToken = result.token;
    });

    it('トークンが正しくデコードされる', () => {
      const decoded = jwtService.decodeToken(validToken);
      
      expect(decoded.header.alg).toBe('HS256');
      expect(decoded.header.typ).toBe('JWT');
      expect(decoded.payload.sub).toBe('user123');
      expect(decoded.payload.email).toBe('test@example.com');
    });

    it('無効なトークンはnullを返す', () => {
      const result = jwtService.decodeToken('invalid.token.format');
      
      expect(result).toBeNull();
    });

    it('Bearer プレフィックスが正しく処理される', () => {
      const bearerToken = `Bearer ${validToken}`;
      const decoded = jwtService.decodeToken(bearerToken);
      
      expect(decoded.payload.sub).toBe('user123');
    });
  });

  describe('トークン有効期限チェック', () => {
    beforeEach(async () => {
      await jwtService.initialize();
    });

    it('有効なトークンはfalseを返す', async () => {
      const userData = { userId: 'user123' };
      const result = await jwtService.generateToken(userData, { expiresIn: 3600 });
      
      expect(jwtService.isTokenExpired(result.token)).toBe(false);
    });

    it('期限切れトークンはtrueを返す', async () => {
      const userData = { userId: 'user123' };
      const result = await jwtService.generateToken(userData, { expiresIn: -1 });
      
      expect(jwtService.isTokenExpired(result.token)).toBe(true);
    });

    it('無効なトークンはtrueを返す', () => {
      expect(jwtService.isTokenExpired('invalid')).toBe(true);
    });

    it('残り時間が正しく計算される', async () => {
      const userData = { userId: 'user123' };
      const expiresIn = 3600; // 1時間
      const result = await jwtService.generateToken(userData, { expiresIn });
      
      const timeLeft = jwtService.getTokenTimeToExpiry(result.token);
      
      expect(timeLeft).toBeGreaterThan(3590); // 多少の誤差を考慮
      expect(timeLeft).toBeLessThanOrEqual(3600);
    });
  });

  describe('トークンリフレッシュ', () => {
    beforeEach(async () => {
      await jwtService.initialize();
    });

    it('リフレッシュトークンで新しいアクセストークンが生成される', async () => {
      const userData = { userId: 'user123', email: 'test@example.com' };
      const refreshTokenResult = await jwtService.generateRefreshToken(userData);
      
      const newAccessToken = await jwtService.refreshAccessToken(refreshTokenResult.token);
      
      expect(newAccessToken.accessToken).toBeDefined();
      expect(newAccessToken.expiresAt).toBeGreaterThan(Date.now());
      expect(newAccessToken.tokenType).toBe('Bearer');
      
      // 新しいトークンが有効であることを確認
      const verification = await jwtService.verifyToken(newAccessToken.accessToken);
      expect(verification.valid).toBe(true);
      expect(verification.payload.sub).toBe('user123');
    });

    it('無効なリフレッシュトークンは拒否される', async () => {
      await expect(
        jwtService.refreshAccessToken('invalid.refresh.token')
      ).rejects.toThrow();
    });

    it('アクセストークンをリフレッシュトークンとして使用するとエラー', async () => {
      const userData = { userId: 'user123' };
      const accessTokenResult = await jwtService.generateToken(userData);
      
      await expect(
        jwtService.refreshAccessToken(accessTokenResult.token)
      ).rejects.toThrow('無効なリフレッシュトークン');
    });
  });

  describe('トークン無効化', () => {
    beforeEach(async () => {
      await jwtService.initialize();
      securityManager.secureStore.mockResolvedValue(true);
      securityManager.secureRetrieve.mockResolvedValue(null);
    });

    it('トークンが正常に無効化される', async () => {
      const userData = { userId: 'user123' };
      const result = await jwtService.generateToken(userData);
      
      const invalidated = await jwtService.invalidateToken(result.token);
      
      expect(invalidated).toBe(true);
      expect(securityManager.secureStore).toHaveBeenCalledWith(
        expect.stringMatching(/^blacklist_/),
        expect.objectContaining({
          jti: expect.any(String),
          invalidatedAt: expect.any(Number)
        })
      );
    });

    it('ブラックリストに含まれるトークンはtrueを返す', async () => {
      const userData = { userId: 'user123' };
      const result = await jwtService.generateToken(userData);
      
      // ブラックリストエントリが存在することをモック
      securityManager.secureRetrieve.mockResolvedValue({
        jti: 'test-jti',
        invalidatedAt: Date.now()
      });
      
      const isBlacklisted = await jwtService.isTokenBlacklisted(result.token);
      
      expect(isBlacklisted).toBe(true);
    });

    it('包括的な検証でブラックリストがチェックされる', async () => {
      const userData = { userId: 'user123' };
      const result = await jwtService.generateToken(userData);
      
      // 最初は有効
      let validation = await jwtService.validateToken(result.token);
      expect(validation.valid).toBe(true);
      
      // ブラックリストに追加
      securityManager.secureRetrieve.mockResolvedValue({
        jti: 'test-jti',
        invalidatedAt: Date.now()
      });
      
      // 無効化後は無効
      validation = await jwtService.validateToken(result.token);
      expect(validation.valid).toBe(false);
    });
  });

  describe('JWT情報取得', () => {
    beforeEach(async () => {
      await jwtService.initialize();
    });

    it('JWT情報が正しく取得される', async () => {
      const userData = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'admin',
        permissions: ['read', 'write']
      };
      
      const result = await jwtService.generateToken(userData, {
        sessionId: 'session123',
        loginMethod: 'password'
      });
      
      const info = jwtService.getJWTInfo(result.token);
      
      expect(info.userId).toBe('user123');
      expect(info.email).toBe('test@example.com');
      expect(info.role).toBe('admin');
      expect(info.permissions).toEqual(['read', 'write']);
      expect(info.sessionId).toBe('session123');
      expect(info.loginMethod).toBe('password');
      expect(info.issuedAt).toBeDefined();
      expect(info.expiresAt).toBeDefined();
      expect(info.timeToExpiry).toBeGreaterThan(0);
      expect(info.isExpired).toBe(false);
    });

    it('無効なトークンはnullを返す', () => {
      const info = jwtService.getJWTInfo('invalid.token');
      
      expect(info).toBeNull();
    });
  });

  describe('エラーハンドリング', () => {
    it('シークレットキーがない状態でトークン生成するとエラー', async () => {
      jwtService.secretKey = null;
      
      await expect(
        jwtService.generateToken({ userId: 'test' })
      ).rejects.toThrow();
    });

    it('シークレットキーがない状態でトークン検証するとエラー', async () => {
      jwtService.secretKey = null;
      
      const result = await jwtService.verifyToken('any.token.here');
      
      expect(result.valid).toBe(false);
    });
  });
});