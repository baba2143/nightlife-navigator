/**
 * 入力検証とサニタイゼーションのユーティリティ
 */
class InputValidator {
  
  /**
   * 文字列をサニタイズ
   * @param {string} input - サニタイズする文字列
   * @returns {string} サニタイズされた文字列
   */
  static sanitizeString(input) {
    if (typeof input !== 'string') {
      return '';
    }
    
    return input
      .trim()
      .replace(/[<>]/g, '') // HTMLタグの除去
      .replace(/javascript:/gi, '') // JavaScriptプロトコルの除去
      .replace(/on\w+=/gi, '') // イベントハンドラーの除去
      .replace(/data:/gi, '') // データURLの除去
      .replace(/vbscript:/gi, '') // VBScriptの除去
      .replace(/\0/g, ''); // Nullバイトの除去
  }

  /**
   * HTMLエスケープ
   * @param {string} input - エスケープする文字列
   * @returns {string} エスケープされた文字列
   */
  static escapeHtml(input) {
    if (typeof input !== 'string') {
      return '';
    }
    
    const htmlEscapes = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };
    
    return input.replace(/[&<>"'\/]/g, match => htmlEscapes[match]);
  }

  /**
   * SQLインジェクション対策
   * @param {string} input - チェックする文字列
   * @returns {string} サニタイズされた文字列
   */
  static sanitizeSql(input) {
    if (typeof input !== 'string') {
      return '';
    }
    
    return input
      .replace(/['";\\]/g, '') // 危険な文字の除去
      .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b/gi, '') // SQL命令の除去
      .replace(/--/g, '') // SQLコメントの除去
      .replace(/\/\*[\s\S]*?\*\//g, ''); // マルチラインコメントの除去
  }

  /**
   * ユーザー名の検証
   * @param {string} username - ユーザー名
   * @returns {Object} 検証結果
   */
  static validateUsername(username) {
    const errors = [];
    
    if (!username || typeof username !== 'string') {
      errors.push('ユーザー名は必須です');
      return { isValid: false, errors, sanitized: '' };
    }
    
    const sanitized = this.sanitizeString(username);
    
    if (sanitized.length < 3) {
      errors.push('ユーザー名は3文字以上である必要があります');
    }
    
    if (sanitized.length > 50) {
      errors.push('ユーザー名は50文字以下である必要があります');
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
      errors.push('ユーザー名には英数字、アンダースコア、ハイフンのみ使用できます');
    }
    
    // 予約語チェック
    const reservedWords = ['admin', 'root', 'system', 'null', 'undefined', 'api', 'www'];
    if (reservedWords.includes(sanitized.toLowerCase())) {
      errors.push('このユーザー名は使用できません');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    };
  }

  /**
   * パスワードの検証
   * @param {string} password - パスワード
   * @returns {Object} 検証結果
   */
  static validatePassword(password) {
    const errors = [];
    
    if (!password || typeof password !== 'string') {
      errors.push('パスワードは必須です');
      return { isValid: false, errors };
    }
    
    if (password.length < 8) {
      errors.push('パスワードは8文字以上である必要があります');
    }
    
    if (password.length > 128) {
      errors.push('パスワードは128文字以下である必要があります');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('パスワードには小文字を含める必要があります');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('パスワードには大文字を含める必要があります');
    }
    
    if (!/\d/.test(password)) {
      errors.push('パスワードには数字を含める必要があります');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
      errors.push('パスワードには記号を含める必要があります');
    }
    
    // 一般的な弱いパスワードをチェック
    const weakPasswords = [
      'password', 'password123', '12345678', 'qwerty123',
      'admin123', 'letmein', 'welcome', 'password!',
      'Password1', 'Password123'
    ];
    
    if (weakPasswords.some(weak => password.toLowerCase().includes(weak.toLowerCase()))) {
      errors.push('一般的すぎるパスワードは使用できません');
    }
    
    // 連続した文字や繰り返しパターンをチェック
    if (/(.)\1{2,}/.test(password)) {
      errors.push('同じ文字を3回以上連続して使用することはできません');
    }
    
    if (/012|123|234|345|456|567|678|789|abc|bcd|cde|def/i.test(password)) {
      errors.push('連続した文字や数字の使用は避けてください');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * メールアドレスの検証
   * @param {string} email - メールアドレス
   * @returns {Object} 検証結果
   */
  static validateEmail(email) {
    const errors = [];
    
    if (!email || typeof email !== 'string') {
      errors.push('メールアドレスは必須です');
      return { isValid: false, errors, sanitized: '' };
    }
    
    const sanitized = this.sanitizeString(email).toLowerCase();
    
    if (sanitized.length > 254) {
      errors.push('メールアドレスは254文字以下である必要があります');
    }
    
    // 基本的なメールアドレスの形式チェック
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(sanitized)) {
      errors.push('有効なメールアドレスを入力してください');
    }
    
    // 危険なドメインをチェック
    const dangerousDomains = ['tempmail.org', '10minutemail.com', 'guerrillamail.com'];
    const domain = sanitized.split('@')[1];
    if (domain && dangerousDomains.includes(domain)) {
      errors.push('このメールドメインは使用できません');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    };
  }

  /**
   * 名前の検証
   * @param {string} name - 名前
   * @returns {Object} 検証結果
   */
  static validateName(name) {
    const errors = [];
    
    if (!name || typeof name !== 'string') {
      errors.push('名前は必須です');
      return { isValid: false, errors, sanitized: '' };
    }
    
    const sanitized = this.sanitizeString(name);
    
    if (sanitized.length < 1) {
      errors.push('名前を入力してください');
    }
    
    if (sanitized.length > 100) {
      errors.push('名前は100文字以下である必要があります');
    }
    
    // 名前に使用できない文字をチェック
    if (/[<>{}[\]\\\/\|"']/.test(sanitized)) {
      errors.push('名前に使用できない文字が含まれています');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    };
  }

  /**
   * 電話番号の検証
   * @param {string} phone - 電話番号
   * @returns {Object} 検証結果
   */
  static validatePhone(phone) {
    const errors = [];
    
    if (!phone || typeof phone !== 'string') {
      errors.push('電話番号は必須です');
      return { isValid: false, errors, sanitized: '' };
    }
    
    // 数字とハイフンのみを残す
    const sanitized = phone.replace(/[^\d-]/g, '');
    
    if (sanitized.length < 10) {
      errors.push('電話番号は10桁以上である必要があります');
    }
    
    if (sanitized.length > 15) {
      errors.push('電話番号は15桁以下である必要があります');
    }
    
    // 日本の電話番号形式をチェック
    const phoneRegex = /^(\d{3}-\d{4}-\d{4}|\d{4}-\d{4}-\d{4}|\d{10,11})$/;
    if (!phoneRegex.test(sanitized)) {
      errors.push('有効な電話番号を入力してください');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    };
  }

  /**
   * URLの検証
   * @param {string} url - URL
   * @returns {Object} 検証結果
   */
  static validateUrl(url) {
    const errors = [];
    
    if (!url || typeof url !== 'string') {
      errors.push('URLは必須です');
      return { isValid: false, errors, sanitized: '' };
    }
    
    const sanitized = this.sanitizeString(url);
    
    try {
      const urlObj = new URL(sanitized);
      
      // HTTPSのみ許可
      if (urlObj.protocol !== 'https:') {
        errors.push('HTTPSのURLのみ許可されています');
      }
      
      // 危険なドメインをチェック
      const dangerousDomains = ['bit.ly', 'tinyurl.com', 'goo.gl'];
      if (dangerousDomains.includes(urlObj.hostname)) {
        errors.push('短縮URLは使用できません');
      }
      
      // ローカルホストやプライベートIPをチェック
      if (urlObj.hostname === 'localhost' || 
          urlObj.hostname.startsWith('127.') ||
          urlObj.hostname.startsWith('192.168.') ||
          urlObj.hostname.startsWith('10.') ||
          urlObj.hostname.startsWith('172.')) {
        errors.push('ローカルアドレスは使用できません');
      }
      
    } catch (e) {
      errors.push('有効なURLを入力してください');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    };
  }

  /**
   * JSONの検証
   * @param {string} jsonString - JSON文字列
   * @returns {Object} 検証結果
   */
  static validateJson(jsonString) {
    const errors = [];
    
    if (!jsonString || typeof jsonString !== 'string') {
      errors.push('JSONデータは必須です');
      return { isValid: false, errors, parsed: null };
    }
    
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      errors.push('有効なJSON形式である必要があります');
      return { isValid: false, errors, parsed: null };
    }
    
    // 危険なキーをチェック
    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
    const checkDangerousKeys = (obj) => {
      if (typeof obj !== 'object' || obj === null) return false;
      
      for (const key of Object.keys(obj)) {
        if (dangerousKeys.includes(key)) {
          return true;
        }
        if (typeof obj[key] === 'object' && checkDangerousKeys(obj[key])) {
          return true;
        }
      }
      return false;
    };
    
    if (checkDangerousKeys(parsed)) {
      errors.push('危険なプロパティが含まれています');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      parsed
    };
  }

  /**
   * ファイル名の検証
   * @param {string} filename - ファイル名
   * @returns {Object} 検証結果
   */
  static validateFilename(filename) {
    const errors = [];
    
    if (!filename || typeof filename !== 'string') {
      errors.push('ファイル名は必須です');
      return { isValid: false, errors, sanitized: '' };
    }
    
    const sanitized = this.sanitizeString(filename);
    
    if (sanitized.length > 255) {
      errors.push('ファイル名は255文字以下である必要があります');
    }
    
    // 危険な文字をチェック
    if (/[<>:"/\\|?*\0]/.test(sanitized)) {
      errors.push('ファイル名に使用できない文字が含まれています');
    }
    
    // 予約語をチェック
    const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
    if (reservedNames.includes(sanitized.toUpperCase())) {
      errors.push('予約されたファイル名は使用できません');
    }
    
    // 拡張子をチェック
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.txt'];
    const extension = sanitized.toLowerCase().substring(sanitized.lastIndexOf('.'));
    if (!allowedExtensions.includes(extension)) {
      errors.push('許可されていないファイル形式です');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    };
  }

  /**
   * 一般的な入力検証
   * @param {Object} data - 検証するデータ
   * @param {Object} rules - 検証ルール
   * @returns {Object} 検証結果
   */
  static validateForm(data, rules) {
    const errors = {};
    const sanitized = {};
    
    for (const [field, rule] of Object.entries(rules)) {
      const value = data[field];
      
      // 必須チェック
      if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        errors[field] = [`${field}は必須です`];
        continue;
      }
      
      // 値が存在しない場合はスキップ
      if (!value && !rule.required) {
        continue;
      }
      
      // 型別検証
      switch (rule.type) {
        case 'username':
          const usernameResult = this.validateUsername(value);
          if (!usernameResult.isValid) {
            errors[field] = usernameResult.errors;
          }
          sanitized[field] = usernameResult.sanitized;
          break;
          
        case 'password':
          const passwordResult = this.validatePassword(value);
          if (!passwordResult.isValid) {
            errors[field] = passwordResult.errors;
          }
          break;
          
        case 'email':
          const emailResult = this.validateEmail(value);
          if (!emailResult.isValid) {
            errors[field] = emailResult.errors;
          }
          sanitized[field] = emailResult.sanitized;
          break;
          
        case 'name':
          const nameResult = this.validateName(value);
          if (!nameResult.isValid) {
            errors[field] = nameResult.errors;
          }
          sanitized[field] = nameResult.sanitized;
          break;
          
        case 'phone':
          const phoneResult = this.validatePhone(value);
          if (!phoneResult.isValid) {
            errors[field] = phoneResult.errors;
          }
          sanitized[field] = phoneResult.sanitized;
          break;
          
        case 'url':
          const urlResult = this.validateUrl(value);
          if (!urlResult.isValid) {
            errors[field] = urlResult.errors;
          }
          sanitized[field] = urlResult.sanitized;
          break;
          
        case 'string':
          sanitized[field] = this.sanitizeString(value);
          break;
          
        default:
          sanitized[field] = value;
      }
      
      // 長さチェック
      if (rule.minLength && value.length < rule.minLength) {
        errors[field] = errors[field] || [];
        errors[field].push(`${field}は${rule.minLength}文字以上である必要があります`);
      }
      
      if (rule.maxLength && value.length > rule.maxLength) {
        errors[field] = errors[field] || [];
        errors[field].push(`${field}は${rule.maxLength}文字以下である必要があります`);
      }
      
      // カスタム検証
      if (rule.custom && typeof rule.custom === 'function') {
        const customResult = rule.custom(value);
        if (!customResult.isValid) {
          errors[field] = errors[field] || [];
          errors[field].push(...customResult.errors);
        }
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized
    };
  }
}

export default InputValidator;