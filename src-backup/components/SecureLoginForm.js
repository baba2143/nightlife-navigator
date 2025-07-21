import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import InputValidator from '../utils/inputValidator';
import InputSanitizer from '../utils/inputSanitizer';
import securityLogger from '../utils/securityLogger';
import RateLimitMiddleware from '../middleware/RateLimitMiddleware';

/**
 * セキュアなログインフォームコンポーネント
 */
const SecureLoginForm = ({ onLogin, isLoading = false }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [lastAttemptTime, setLastAttemptTime] = useState(null);

  // リアルタイム入力検証
  const validateField = (name, value) => {
    let validation;
    
    switch (name) {
      case 'username':
        validation = InputValidator.validateUsername(value);
        break;
      case 'password':
        // パスワードは基本的な長さチェックのみ（詳細検証はサーバー側で実行）
        validation = {
          isValid: value.length >= 8,
          errors: value.length < 8 ? ['パスワードは8文字以上である必要があります'] : []
        };
        break;
      default:
        validation = { isValid: true, errors: [] };
    }
    
    setErrors(prev => ({
      ...prev,
      [name]: validation.errors
    }));
    
    return validation.isValid;
  };

  // 入力値の変更処理
  const handleInputChange = (name, value) => {
    // 脅威検出
    const threatDetection = InputSanitizer.detectThreats(value);
    if (!threatDetection.isClean) {
      securityLogger.logSecurityViolation('unknown_user', 'MALICIOUS_INPUT_ATTEMPT', {
        field: name,
        threats: threatDetection.threats,
        inputLength: value.length
      });
      
      Alert.alert(
        'セキュリティ警告',
        '不正な入力が検出されました。正しい形式で入力してください。'
      );
      return;
    }
    
    // 入力値をサニタイズ
    const sanitizedValue = InputSanitizer.sanitizeAll(value, {
      maxLength: name === 'username' ? 50 : 128,
      sql: true,
      xss: true,
      command: true
    });
    
    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));
    
    // リアルタイム検証
    validateField(name, sanitizedValue);
  };

  // フォーム送信処理
  const handleSubmit = async () => {
    // レート制限チェック
    const now = Date.now();
    if (lastAttemptTime && now - lastAttemptTime < 3000) { // 3秒間隔
      Alert.alert(
        'レート制限',
        'ログイン試行が頻繁すぎます。少し待ってから再試行してください。'
      );
      return;
    }
    
    // 過度なログイン試行チェック
    if (attemptCount >= 5) {
      Alert.alert(
        'ログイン制限',
        'ログイン試行回数が上限に達しました。しばらく待ってから再試行してください。'
      );
      return;
    }
    
    // 最終検証
    const validationRules = {
      username: { type: 'username', required: true },
      password: { required: true, minLength: 8 }
    };
    
    const validation = InputValidator.validateForm(formData, validationRules);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    
    // 脅威の最終チェック
    const usernameThreats = InputSanitizer.detectThreats(formData.username);
    const passwordThreats = InputSanitizer.detectThreats(formData.password);
    
    if (!usernameThreats.isClean || !passwordThreats.isClean) {
      securityLogger.logSecurityViolation(validation.sanitized.username, 'MALICIOUS_LOGIN_ATTEMPT', {
        usernameThreats: usernameThreats.threats,
        passwordThreats: passwordThreats.threats
      });
      
      Alert.alert(
        'セキュリティエラー',
        '不正な入力が検出されました。'
      );
      return;
    }
    
    setLastAttemptTime(now);
    setAttemptCount(prev => prev + 1);
    
    try {
      // レート制限付きでログイン実行
      const result = await RateLimitMiddleware.checkAndExecute(
        'login',
        'client-device', // デバイス識別子
        () => onLogin(validation.sanitized.username, formData.password)
      );
      
      if (result.success) {
        // ログイン成功時はカウンターをリセット
        setAttemptCount(0);
        setFormData({ username: '', password: '' });
        setErrors({});
      } else {
        // ログイン失敗時はエラーを表示
        Alert.alert('ログインエラー', result.error || 'ログインに失敗しました');
      }
    } catch (error) {
      console.error('ログインエラー:', error);
      
      // レート制限エラーの特別処理
      if (error.rateLimitInfo) {
        Alert.alert(
          'レート制限',
          error.message,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('システムエラー', 'システムエラーが発生しました');
      }
    }
  };

  // 試行回数リセット（5分後）
  useEffect(() => {
    let resetTimer;
    if (attemptCount > 0) {
      resetTimer = setTimeout(() => {
        setAttemptCount(0);
      }, 5 * 60 * 1000); // 5分
    }
    return () => {
      if (resetTimer) {
        clearTimeout(resetTimer);
      }
    };
  }, [attemptCount]);

  // パスワード強度インジケーター
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 'none', color: '#ccc', text: '' };
    
    const validation = InputValidator.validatePassword(password);
    const score = validation.errors.length;
    
    if (score <= 2) return { strength: 'strong', color: '#4CAF50', text: '強い' };
    if (score <= 4) return { strength: 'medium', color: '#FF9800', text: '普通' };
    return { strength: 'weak', color: '#F44336', text: '弱い' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>セキュアログイン</Text>
      
      {/* ユーザー名入力 */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>ユーザー名</Text>
        <TextInput
          style={[styles.input, errors.username && styles.inputError]}
          value={formData.username}
          onChangeText={(value) => handleInputChange('username', value)}
          placeholder="ユーザー名を入力"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="username"
          maxLength={50}
        />
        {errors.username && (
          <Text style={styles.errorText}>{errors.username[0]}</Text>
        )}
      </View>

      {/* パスワード入力 */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>パスワード</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
            value={formData.password}
            onChangeText={(value) => handleInputChange('password', value)}
            placeholder="パスワードを入力"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            maxLength={128}
          />
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.toggleButtonText}>
              {showPassword ? '隠す' : '表示'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* パスワード強度インジケーター */}
        {formData.password.length > 0 && (
          <View style={styles.strengthContainer}>
            <View style={[styles.strengthBar, { backgroundColor: passwordStrength.color }]} />
            <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
              {passwordStrength.text}
            </Text>
          </View>
        )}
        
        {errors.password && (
          <Text style={styles.errorText}>{errors.password[0]}</Text>
        )}
      </View>

      {/* 試行回数表示 */}
      {attemptCount > 0 && (
        <View style={styles.attemptContainer}>
          <Text style={styles.attemptText}>
            ログイン試行回数: {attemptCount}/5
          </Text>
        </View>
      )}

      {/* ログインボタン */}
      <TouchableOpacity
        style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading || attemptCount >= 5}
      >
        <Text style={styles.loginButtonText}>
          {isLoading ? 'ログイン中...' : 'ログイン'}
        </Text>
      </TouchableOpacity>

      {/* セキュリティ注意事項 */}
      <View style={styles.securityNotice}>
        <Text style={styles.securityNoticeText}>
          セキュリティのため、不正なログイン試行は記録されます。
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#F44336',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    marginRight: 10,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
  },
  toggleButtonText: {
    fontSize: 14,
    color: '#666',
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  strengthBar: {
    height: 4,
    width: 60,
    borderRadius: 2,
    marginRight: 8,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
  },
  attemptContainer: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#fff3cd',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  attemptText: {
    color: '#856404',
    fontSize: 14,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonDisabled: {
    backgroundColor: '#ccc',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  securityNotice: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bbdefb',
  },
  securityNoticeText: {
    color: '#1976d2',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default SecureLoginForm;