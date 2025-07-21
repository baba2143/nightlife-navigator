/**
 * 高度な入力サニタイゼーション機能
 */
class InputSanitizer {
  
  /**
   * XSS攻撃対策のためのサニタイゼーション
   * @param {string} input - サニタイズする文字列
   * @returns {string} サニタイズされた文字列
   */
  static sanitizeXSS(input) {
    if (typeof input !== 'string') {
      return '';
    }
    
    return input
      // HTMLタグを無効化
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi, '')
      .replace(/<meta\b[^>]*>/gi, '')
      .replace(/<link\b[^>]*>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      
      // 危険な属性を削除
      .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/\son\w+\s*=\s*[^"'\s>]+/gi, '')
      
      // JavaScriptプロトコルを削除
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/data:(?!image\/)/gi, '')
      
      // HTMLエンティティをエスケープ
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      
      // 制御文字を削除
      .replace(/[\x00-\x1f\x7f-\x9f]/g, '')
      
      // 余分な空白を削除
      .trim()
      .replace(/\s+/g, ' ');
  }

  /**
   * SQLインジェクション対策
   * @param {string} input - サニタイズする文字列
   * @returns {string} サニタイズされた文字列
   */
  static sanitizeSQL(input) {
    if (typeof input !== 'string') {
      return '';
    }
    
    return input
      // 危険なSQL文字を削除
      .replace(/['";\\]/g, '')
      .replace(/\b(ALTER|CREATE|DELETE|DROP|EXEC|EXECUTE|INSERT|MERGE|SELECT|UPDATE|UNION|USE)\b/gi, '')
      .replace(/\b(AND|OR|NOT|IN|EXISTS|BETWEEN|LIKE|IS|NULL)\b/gi, '')
      .replace(/\b(DECLARE|CAST|CONVERT|CHAR|VARCHAR|NCHAR|NVARCHAR)\b/gi, '')
      .replace(/\b(TABLE|DATABASE|SCHEMA|INDEX|VIEW|TRIGGER|PROCEDURE|FUNCTION)\b/gi, '')
      .replace(/\b(GRANT|REVOKE|COMMIT|ROLLBACK|SAVEPOINT|TRANSACTION)\b/gi, '')
      
      // SQLコメントを削除
      .replace(/--[^\n\r]*/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      
      // 連続する特殊文字を削除
      .replace(/['"`;\\]{2,}/g, '')
      
      // 空白を正規化
      .trim()
      .replace(/\s+/g, ' ');
  }

  /**
   * コマンドインジェクション対策
   * @param {string} input - サニタイズする文字列
   * @returns {string} サニタイズされた文字列
   */
  static sanitizeCommand(input) {
    if (typeof input !== 'string') {
      return '';
    }
    
    return input
      // 危険なコマンド文字を削除
      .replace(/[|&;$<>()`\\]/g, '')
      
      // 危険なコマンドを削除
      .replace(/\b(rm|del|format|fdisk|mkfs|dd|cat|chmod|chown|sudo|su|passwd|wget|curl|nc|netcat|telnet|ssh|ftp|tftp)\b/gi, '')
      
      // パスの区切り文字を削除
      .replace(/[\/\\]/g, '')
      
      // 環境変数を削除
      .replace(/\$\w+/g, '')
      .replace(/%\w+%/g, '')
      
      // 空白を正規化
      .trim()
      .replace(/\s+/g, ' ');
  }

  /**
   * パストラバーサル攻撃対策
   * @param {string} input - サニタイズする文字列
   * @returns {string} サニタイズされた文字列
   */
  static sanitizePath(input) {
    if (typeof input !== 'string') {
      return '';
    }
    
    return input
      // パストラバーサルパターンを削除
      .replace(/\.\.\//g, '')
      .replace(/\.\.\\/g, '')
      .replace(/\.\.%2F/gi, '')
      .replace(/\.\.%5C/gi, '')
      
      // 絶対パスを削除
      .replace(/^\/+/, '')
      .replace(/^[A-Za-z]:\\/, '')
      
      // 危険な文字を削除
      .replace(/[<>:"|?*\0]/g, '')
      
      // 空白を正規化
      .trim();
  }

  /**
   * LDAPインジェクション対策
   * @param {string} input - サニタイズする文字列
   * @returns {string} サニタイズされた文字列
   */
  static sanitizeLDAP(input) {
    if (typeof input !== 'string') {
      return '';
    }
    
    return input
      // LDAP特殊文字をエスケープ
      .replace(/\(/g, '\\28')
      .replace(/\)/g, '\\29')
      .replace(/\*/g, '\\2a')
      .replace(/\\/g, '\\5c')
      .replace(/\0/g, '\\00')
      .replace(/\//g, '\\2f')
      
      // 危険なLDAPフィルターを削除
      .replace(/\b(objectClass|cn|uid|mail|memberOf|distinguishedName)\b/gi, '')
      
      // 空白を正規化
      .trim()
      .replace(/\s+/g, ' ');
  }

  /**
   * NoSQLインジェクション対策
   * @param {any} input - サニタイズする値
   * @returns {any} サニタイズされた値
   */
  static sanitizeNoSQL(input) {
    if (typeof input === 'string') {
      return input
        .replace(/[${}]/g, '')
        .replace(/\b(where|function|eval|mapReduce|group)\b/gi, '')
        .trim();
    }
    
    if (typeof input === 'object' && input !== null) {
      // 危険なOperatorを削除
      const dangerousOperators = [
        '$where', '$function', '$eval', '$mapReduce', '$group',
        '$lookup', '$expr', '$jsonSchema', '$regex'
      ];
      
      const sanitized = {};
      for (const [key, value] of Object.entries(input)) {
        if (!dangerousOperators.includes(key)) {
          sanitized[key] = this.sanitizeNoSQL(value);
        }
      }
      return sanitized;
    }
    
    return input;
  }

  /**
   * XMLインジェクション対策
   * @param {string} input - サニタイズする文字列
   * @returns {string} サニタイズされた文字列
   */
  static sanitizeXML(input) {
    if (typeof input !== 'string') {
      return '';
    }
    
    return input
      // XML特殊文字をエスケープ
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
      
      // 危険なXMLパターンを削除
      .replace(/<!(\[CDATA\[[\s\S]*?\]\]|DOCTYPE[\s\S]*?>|ENTITY[\s\S]*?>)/gi, '')
      
      // 処理命令を削除
      .replace(/<\?[\s\S]*?\?>/gi, '')
      
      // 空白を正規化
      .trim()
      .replace(/\s+/g, ' ');
  }

  /**
   * 正規表現インジェクション対策
   * @param {string} input - サニタイズする文字列
   * @returns {string} サニタイズされた文字列
   */
  static sanitizeRegex(input) {
    if (typeof input !== 'string') {
      return '';
    }
    
    return input
      // 正規表現特殊文字をエスケープ
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      
      // 危険なパターンを削除
      .replace(/\(\?\=/g, '') // 先読み
      .replace(/\(\?\!/g, '') // 否定先読み
      .replace(/\(\?\<\=/g, '') // 後読み
      .replace(/\(\?\<\!/g, '') // 否定後読み
      
      // 空白を正規化
      .trim();
  }

  /**
   * CSVインジェクション対策
   * @param {string} input - サニタイズする文字列
   * @returns {string} サニタイズされた文字列
   */
  static sanitizeCSV(input) {
    if (typeof input !== 'string') {
      return '';
    }
    
    return input
      // 危険な先頭文字を削除
      .replace(/^[=+\-@]/, '')
      
      // 改行文字を削除
      .replace(/[\r\n]/g, '')
      
      // カンマとダブルクォートをエスケープ
      .replace(/"/g, '""')
      
      // 空白を正規化
      .trim();
  }

  /**
   * JSONインジェクション対策
   * @param {string} input - サニタイズする文字列
   * @returns {string} サニタイズされた文字列
   */
  static sanitizeJSON(input) {
    if (typeof input !== 'string') {
      return '';
    }
    
    return input
      // JSON特殊文字をエスケープ
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
      .replace(/\f/g, '\\f')
      .replace(/\b/g, '\\b')
      
      // 制御文字を削除
      .replace(/[\x00-\x1f\x7f-\x9f]/g, '')
      
      // 空白を正規化
      .trim();
  }

  /**
   * 複数の脅威に対する総合的なサニタイゼーション
   * @param {string} input - サニタイズする文字列
   * @param {Object} options - オプション設定
   * @returns {string} サニタイズされた文字列
   */
  static sanitizeAll(input, options = {}) {
    if (typeof input !== 'string') {
      return '';
    }
    
    let sanitized = input;
    
    // XSS対策
    if (options.xss !== false) {
      sanitized = this.sanitizeXSS(sanitized);
    }
    
    // SQLインジェクション対策
    if (options.sql !== false) {
      sanitized = this.sanitizeSQL(sanitized);
    }
    
    // コマンドインジェクション対策
    if (options.command !== false) {
      sanitized = this.sanitizeCommand(sanitized);
    }
    
    // パストラバーサル対策
    if (options.path !== false) {
      sanitized = this.sanitizePath(sanitized);
    }
    
    // 文字数制限
    if (options.maxLength && sanitized.length > options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength);
    }
    
    // 最終的な空白の正規化
    sanitized = sanitized.trim().replace(/\s+/g, ' ');
    
    return sanitized;
  }

  /**
   * オブジェクトの再帰的なサニタイゼーション
   * @param {any} obj - サニタイズするオブジェクト
   * @param {Object} options - オプション設定
   * @returns {any} サニタイズされたオブジェクト
   */
  static sanitizeObject(obj, options = {}) {
    if (typeof obj === 'string') {
      return this.sanitizeAll(obj, options);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item, options));
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = this.sanitizeAll(key, options);
        sanitized[sanitizedKey] = this.sanitizeObject(value, options);
      }
      return sanitized;
    }
    
    return obj;
  }

  /**
   * 危険な文字列パターンの検出
   * @param {string} input - チェックする文字列
   * @returns {Object} 検出結果
   */
  static detectThreats(input) {
    if (typeof input !== 'string') {
      return { threats: [], isClean: true };
    }
    
    const threats = [];
    
    // XSS攻撃パターン
    if (/<script|<iframe|<object|<embed|javascript:|vbscript:|on\w+=/i.test(input)) {
      threats.push('XSS');
    }
    
    // SQLインジェクションパターン
    if (/\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC)\b/i.test(input)) {
      threats.push('SQL_INJECTION');
    }
    
    // コマンドインジェクションパターン
    if (/[|&;$<>()`\\]|rm\s|del\s|format\s|sudo\s/i.test(input)) {
      threats.push('COMMAND_INJECTION');
    }
    
    // パストラバーサルパターン
    if (/\.\.\//i.test(input)) {
      threats.push('PATH_TRAVERSAL');
    }
    
    // LDAPインジェクションパターン
    if (/[()\\*\0]|objectClass|cn=/i.test(input)) {
      threats.push('LDAP_INJECTION');
    }
    
    // NoSQLインジェクションパターン
    if (/\$where|\$function|\$eval|\$mapReduce/i.test(input)) {
      threats.push('NOSQL_INJECTION');
    }
    
    return {
      threats,
      isClean: threats.length === 0
    };
  }
}

export default InputSanitizer;