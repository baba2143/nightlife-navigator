import bcrypt from 'bcrypt';

/**
 * セキュアなパスワード生成ユーティリティ
 */
class PasswordGenerator {
  static saltRounds = 12;

  /**
   * 強力なランダムパスワードを生成
   * @param {number} length - パスワードの長さ（デフォルト: 12）
   * @returns {string} 生成されたパスワード
   */
  static generateSecurePassword(length = 12) {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = lowercase + uppercase + numbers + symbols;
    
    let password = '';
    
    // 各文字種から最低1文字を保証
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // 残りの文字をランダムに生成
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // パスワードをシャッフル
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * パスワードをハッシュ化
   * @param {string} password - ハッシュ化するパスワード
   * @returns {Promise<string>} ハッシュ化されたパスワード
   */
  static async hashPassword(password) {
    try {
      return await bcrypt.hash(password, this.saltRounds);
    } catch (error) {
      console.error('パスワードハッシュ化エラー:', error);
      throw new Error('パスワードの暗号化に失敗しました');
    }
  }

  /**
   * パスワードを検証
   * @param {string} password - 検証するパスワード
   * @param {string} hashedPassword - ハッシュ化されたパスワード
   * @returns {Promise<boolean>} 検証結果
   */
  static async verifyPassword(password, hashedPassword) {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      console.error('パスワード検証エラー:', error);
      return false;
    }
  }

  /**
   * パスワード強度を検証
   * @param {string} password - 検証するパスワード
   * @returns {Object} 検証結果とスコア
   */
  static validatePasswordStrength(password) {
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password),
      noCommonPatterns: !this.hasCommonPatterns(password)
    };

    const score = Object.values(checks).filter(Boolean).length;
    const strength = this.getPasswordStrengthLevel(score);

    return {
      isValid: score >= 5, // 6つ中5つ以上で有効
      score,
      maxScore: 6,
      strength,
      checks,
      suggestions: this.getPasswordSuggestions(checks)
    };
  }

  /**
   * 一般的なパスワードパターンをチェック
   * @param {string} password - チェックするパスワード
   * @returns {boolean} 一般的なパターンが含まれているか
   */
  static hasCommonPatterns(password) {
    const commonPatterns = [
      /123456/,
      /password/i,
      /admin/i,
      /qwerty/i,
      /abc123/i,
      /111111/,
      /000000/,
      /letmein/i
    ];

    return commonPatterns.some(pattern => pattern.test(password));
  }

  /**
   * パスワード強度レベルを取得
   * @param {number} score - スコア
   * @returns {string} 強度レベル
   */
  static getPasswordStrengthLevel(score) {
    if (score >= 6) return '非常に強い';
    if (score >= 5) return '強い';
    if (score >= 4) return '普通';
    if (score >= 3) return '弱い';
    return '非常に弱い';
  }

  /**
   * パスワード改善提案を取得
   * @param {Object} checks - チェック結果
   * @returns {Array} 改善提案
   */
  static getPasswordSuggestions(checks) {
    const suggestions = [];

    if (!checks.length) {
      suggestions.push('8文字以上にしてください');
    }
    if (!checks.lowercase) {
      suggestions.push('小文字を含めてください');
    }
    if (!checks.uppercase) {
      suggestions.push('大文字を含めてください');
    }
    if (!checks.numbers) {
      suggestions.push('数字を含めてください');
    }
    if (!checks.symbols) {
      suggestions.push('記号を含めてください');
    }
    if (!checks.noCommonPatterns) {
      suggestions.push('一般的なパスワードパターンは避けてください');
    }

    return suggestions;
  }

  /**
   * デモ用の既存パスワードをハッシュ化されたものに変換
   * 本番環境では使用しないこと
   */
  static async generateHashedDemoPasswords() {
    const demoPasswords = {
      'SecureAdmin2024!': await this.hashPassword('SecureAdmin2024!'),
      'ModSecure2024!': await this.hashPassword('ModSecure2024!'),
      'Support2024!': await this.hashPassword('Support2024!')
    };

    console.log('デモ用ハッシュ化パスワード:');
    Object.entries(demoPasswords).forEach(([plain, hashed]) => {
      console.log(`${plain}: ${hashed}`);
    });

    return demoPasswords;
  }
}

export default PasswordGenerator;