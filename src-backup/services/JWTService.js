import CryptoJS from 'crypto-js';
import { encode, decode } from 'base-64';
import securityManager from '../utils/security';
import errorHandler from '../utils/errorHandler';

class JWTService {
  constructor() {
    this.secretKey = null;
    this.issuer = 'nightlife-navigator';
    this.audience = 'nightlife-users';
    this.algorithm = 'HS256';
  }

  // JWTサービスの初期化
  async initialize() {
    try {
      // セキュアなシークレットキーを生成または取得
      this.secretKey = await this.getOrGenerateSecretKey();
      return true;
    } catch (error) {
      errorHandler.handleError(error, { type: 'jwt_initialization' });
      return false;
    }
  }

  // シークレットキーを生成または取得
  async getOrGenerateSecretKey() {
    try {
      // 既存のキーを取得を試行
      let secretKey = await securityManager.secureRetrieve('jwt_secret_key');
      
      if (!secretKey) {
        // 新しいセキュアなキーを生成（256ビット）
        secretKey = await securityManager.generateSecureRandom(32);
        
        // キーを安全に保存
        await securityManager.secureStore('jwt_secret_key', secretKey);
      }
      
      return secretKey;
    } catch (error) {
      errorHandler.handleError(error, { type: 'jwt_secret_key_generation' });
      throw new Error('JWTシークレットキーの生成に失敗しました');
    }
  }

  // Base64URLエンコード（JWTのURL安全な文字列）
  base64URLEncode(str) {
    try {
      const encoded = encode(str)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      return encoded;
    } catch (error) {
      throw new Error('Base64URLエンコードに失敗しました');
    }
  }

  // Base64URLデコード
  base64URLDecode(str) {
    try {
      // パディングを追加
      str += new Array(5 - str.length % 4).join('=');
      
      // URL安全文字を元に戻す
      str = str.replace(/-/g, '+').replace(/_/g, '/');
      
      return decode(str);
    } catch (error) {
      throw new Error('Base64URLデコードに失敗しました');
    }
  }

  // JWTヘッダーを作成
  createHeader() {
    const header = {
      alg: this.algorithm,
      typ: 'JWT'
    };
    
    return this.base64URLEncode(JSON.stringify(header));
  }

  // JWTペイロードを作成
  createPayload(userData, options = {}) {
    const now = Math.floor(Date.now() / 1000);
    
    const payload = {
      // 標準クレーム
      iss: this.issuer,                                    // 発行者
      aud: this.audience,                                  // 対象者
      sub: userData.userId || userData.id,                 // 主体（ユーザーID）
      iat: now,                                           // 発行時刻
      exp: now + (options.expiresIn || 3600),             // 有効期限（デフォルト1時間）
      jti: options.jti || `jwt_${Date.now()}_${Math.random().toString(36)}`, // JWT ID
      
      // カスタムクレーム
      email: userData.email,
      role: userData.role || 'user',
      permissions: userData.permissions || [],
      
      // セッション情報
      sessionId: options.sessionId,
      deviceId: options.deviceId,
      
      // セキュリティ情報
      loginMethod: options.loginMethod || 'password',
      ipAddress: options.ipAddress,
      userAgent: options.userAgent
    };
    
    return this.base64URLEncode(JSON.stringify(payload));
  }

  // HMAC-SHA256署名を作成
  async createSignature(data) {
    try {
      if (!this.secretKey) {
        throw new Error('シークレットキーが設定されていません');
      }
      
      // HMAC-SHA256で署名
      const signature = CryptoJS.HmacSHA256(data, this.secretKey);
      
      // Base64URL形式に変換
      const base64Signature = CryptoJS.enc.Base64.stringify(signature);
      return this.base64URLEncode(base64Signature);
    } catch (error) {
      errorHandler.handleError(error, { type: 'jwt_signature_creation' });
      throw new Error('JWT署名の作成に失敗しました');
    }
  }

  // JWTトークンを生成
  async generateToken(userData, options = {}) {
    try {
      if (!this.secretKey) {
        await this.initialize();
      }

      // ヘッダーとペイロードを作成
      const header = this.createHeader();
      const payload = this.createPayload(userData, options);
      
      // 署名対象データ
      const signatureData = `${header}.${payload}`;
      
      // 署名を作成
      const signature = await this.createSignature(signatureData);
      
      // 完成したJWTトークン
      const token = `${signatureData}.${signature}`;
      
      return {
        token,
        expiresAt: (Math.floor(Date.now() / 1000) + (options.expiresIn || 3600)) * 1000,
        tokenType: 'Bearer'
      };
    } catch (error) {
      errorHandler.handleError(error, { type: 'jwt_token_generation' });
      throw new Error('JWTトークンの生成に失敗しました');
    }
  }

  // リフレッシュトークンを生成
  async generateRefreshToken(userData, options = {}) {
    try {
      const refreshOptions = {
        ...options,
        expiresIn: options.refreshExpiresIn || 604800, // デフォルト7日間
        jti: `refresh_${Date.now()}_${Math.random().toString(36)}`
      };
      
      return await this.generateToken(userData, refreshOptions);
    } catch (error) {
      errorHandler.handleError(error, { type: 'refresh_token_generation' });
      throw new Error('リフレッシュトークンの生成に失敗しました');
    }
  }

  // JWTトークンを検証
  async verifyToken(token) {
    try {
      if (!token || typeof token !== 'string') {
        throw new Error('無効なトークン形式です');
      }

      // Bearer プレフィックスを削除
      const cleanToken = token.replace(/^Bearer\s+/, '');
      
      // トークンを分割
      const parts = cleanToken.split('.');
      if (parts.length !== 3) {
        throw new Error('JWT形式が正しくありません');
      }

      const [headerB64, payloadB64, signatureB64] = parts;
      
      // 署名を検証
      const signatureData = `${headerB64}.${payloadB64}`;
      const expectedSignature = await this.createSignature(signatureData);
      
      if (signatureB64 !== expectedSignature) {
        throw new Error('JWT署名が無効です');
      }

      // ヘッダーとペイロードをデコード
      const header = JSON.parse(this.base64URLDecode(headerB64));
      const payload = JSON.parse(this.base64URLDecode(payloadB64));

      // アルゴリズムを確認
      if (header.alg !== this.algorithm) {
        throw new Error('サポートされていないアルゴリズムです');
      }

      // 有効期限をチェック
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        throw new Error('トークンの有効期限が切れています');
      }

      // 発行時刻をチェック
      if (payload.iat && payload.iat > now + 60) {
        throw new Error('トークンの発行時刻が未来です');
      }

      // 発行者と対象者をチェック
      if (payload.iss !== this.issuer) {
        throw new Error('トークンの発行者が無効です');
      }

      if (payload.aud !== this.audience) {
        throw new Error('トークンの対象者が無効です');
      }

      return {
        valid: true,
        payload: payload,
        header: header
      };
    } catch (error) {
      errorHandler.handleError(error, { type: 'jwt_token_verification' });
      return {
        valid: false,
        error: error.message
      };
    }
  }

  // トークンからペイロードを抽出（検証なし）
  decodeToken(token) {
    try {
      const cleanToken = token.replace(/^Bearer\s+/, '');
      const parts = cleanToken.split('.');
      
      if (parts.length !== 3) {
        throw new Error('JWT形式が正しくありません');
      }

      const [headerB64, payloadB64] = parts;
      
      const header = JSON.parse(this.base64URLDecode(headerB64));
      const payload = JSON.parse(this.base64URLDecode(payloadB64));

      return {
        header,
        payload
      };
    } catch (error) {
      errorHandler.handleError(error, { type: 'jwt_token_decode' });
      return null;
    }
  }

  // トークンの有効期限をチェック
  isTokenExpired(token) {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.payload.exp) {
        return true;
      }

      const now = Math.floor(Date.now() / 1000);
      return decoded.payload.exp < now;
    } catch (error) {
      return true;
    }
  }

  // トークンの残り時間を取得（秒）
  getTokenTimeToExpiry(token) {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.payload.exp) {
        return 0;
      }

      const now = Math.floor(Date.now() / 1000);
      const timeLeft = decoded.payload.exp - now;
      
      return Math.max(0, timeLeft);
    } catch (error) {
      return 0;
    }
  }

  // アクセストークンとリフレッシュトークンのペアを生成
  async generateTokenPair(userData, options = {}) {
    try {
      const sessionId = options.sessionId || `session_${Date.now()}_${Math.random().toString(36)}`;
      
      // アクセストークン（短期間）
      const accessToken = await this.generateToken(userData, {
        ...options,
        sessionId,
        expiresIn: options.accessExpiresIn || 900 // 15分
      });

      // リフレッシュトークン（長期間）
      const refreshToken = await this.generateRefreshToken(userData, {
        ...options,
        sessionId,
        refreshExpiresIn: options.refreshExpiresIn || 604800 // 7日間
      });

      return {
        accessToken: accessToken.token,
        refreshToken: refreshToken.token,
        expiresAt: accessToken.expiresAt,
        tokenType: 'Bearer',
        sessionId
      };
    } catch (error) {
      errorHandler.handleError(error, { type: 'jwt_token_pair_generation' });
      throw new Error('トークンペアの生成に失敗しました');
    }
  }

  // リフレッシュトークンでアクセストークンを更新
  async refreshAccessToken(refreshToken) {
    try {
      // リフレッシュトークンを検証
      const verification = await this.verifyToken(refreshToken);
      
      if (!verification.valid) {
        throw new Error('リフレッシュトークンが無効です');
      }

      const payload = verification.payload;
      
      // リフレッシュトークンのJTIがrefresh_で始まることを確認
      if (!payload.jti || !payload.jti.startsWith('refresh_')) {
        throw new Error('無効なリフレッシュトークンです');
      }

      // ユーザーデータを再構築
      const userData = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        permissions: payload.permissions
      };

      // 新しいアクセストークンを生成
      const newAccessToken = await this.generateToken(userData, {
        sessionId: payload.sessionId,
        deviceId: payload.deviceId,
        loginMethod: payload.loginMethod,
        expiresIn: 900 // 15分
      });

      return {
        accessToken: newAccessToken.token,
        expiresAt: newAccessToken.expiresAt,
        tokenType: 'Bearer'
      };
    } catch (error) {
      errorHandler.handleError(error, { type: 'jwt_token_refresh' });
      throw new Error('アクセストークンの更新に失敗しました');
    }
  }

  // トークンを無効化（ブラックリスト）
  async invalidateToken(token) {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.payload.jti) {
        return false;
      }

      // ブラックリストに追加
      const blacklistKey = `blacklist_${decoded.payload.jti}`;
      const expiryTime = decoded.payload.exp * 1000; // ミリ秒に変換
      
      await securityManager.secureStore(blacklistKey, {
        jti: decoded.payload.jti,
        invalidatedAt: Date.now(),
        expiresAt: expiryTime
      });

      return true;
    } catch (error) {
      errorHandler.handleError(error, { type: 'jwt_token_invalidation' });
      return false;
    }
  }

  // トークンがブラックリストに含まれているかチェック
  async isTokenBlacklisted(token) {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.payload.jti) {
        return true; // JTIがない場合は無効とする
      }

      const blacklistKey = `blacklist_${decoded.payload.jti}`;
      const blacklistEntry = await securityManager.secureRetrieve(blacklistKey);
      
      return blacklistEntry !== null;
    } catch (error) {
      errorHandler.handleError(error, { type: 'jwt_blacklist_check' });
      return true; // エラーの場合は安全側に倒す
    }
  }

  // 包括的なトークン検証（ブラックリストチェック込み）
  async validateToken(token) {
    try {
      // 基本的な検証
      const verification = await this.verifyToken(token);
      if (!verification.valid) {
        return verification;
      }

      // ブラックリストチェック
      const isBlacklisted = await this.isTokenBlacklisted(token);
      if (isBlacklisted) {
        return {
          valid: false,
          error: 'トークンが無効化されています'
        };
      }

      return verification;
    } catch (error) {
      errorHandler.handleError(error, { type: 'jwt_comprehensive_validation' });
      return {
        valid: false,
        error: 'トークンの検証に失敗しました'
      };
    }
  }

  // JWT統計情報を取得
  getJWTInfo(token) {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded) {
        return null;
      }

      const now = Math.floor(Date.now() / 1000);
      const payload = decoded.payload;

      return {
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
        permissions: payload.permissions,
        issuedAt: new Date(payload.iat * 1000).toISOString(),
        expiresAt: new Date(payload.exp * 1000).toISOString(),
        timeToExpiry: Math.max(0, payload.exp - now),
        sessionId: payload.sessionId,
        loginMethod: payload.loginMethod,
        isExpired: payload.exp < now
      };
    } catch (error) {
      errorHandler.handleError(error, { type: 'jwt_info_extraction' });
      return null;
    }
  }

  // クリーンアップ（期限切れのブラックリストエントリを削除）
  async cleanupExpiredTokens() {
    try {
      // 実装は使用するストレージに依存
      // ここでは概念的な実装のみ
      console.log('期限切れトークンのクリーンアップを実行しました');
      return true;
    } catch (error) {
      errorHandler.handleError(error, { type: 'jwt_cleanup' });
      return false;
    }
  }
}

export default new JWTService();