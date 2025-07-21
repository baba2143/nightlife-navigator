import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { Colors } from '../../design-system/colors-soft-pink';
import { useAuth } from '../../contexts/AuthContext';
import { ValidationUtils, BiometricAuth } from '../../utils/authUtils';
import { AUTH_PROVIDERS } from '../../config/auth';

/**
 * ログイン画面
 */
const LoginScreen = ({ navigation }) => {
  const { login, loginWithBiometric, isAuthenticating, error, clearError, biometricEnabled } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  // 初期化アニメーション
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // 生体認証の利用可能性をチェック
  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    const result = await BiometricAuth.isAvailable();
    setBiometricAvailable(result.isAvailable && biometricEnabled);
  };

  // フォーム入力の処理
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // エラーをクリア
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: null }));
    }
    
    if (error) {
      clearError();
    }
  }, [formErrors, error, clearError]);

  // フォームのバリデーション
  const validateForm = useCallback(() => {
    const errors = {};
    
    const emailValidation = ValidationUtils.validateEmail(formData.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.message;
    }
    
    if (!formData.password) {
      errors.password = 'パスワードを入力してください';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // ログイン処理
  const handleLogin = useCallback(async () => {
    if (!validateForm()) {
      return;
    }
    
    const result = await login(
      {
        email: formData.email,
        password: formData.password,
      },
      {
        rememberMe: formData.rememberMe,
      }
    );
    
    if (result.success) {
      // ログイン成功 - ナビゲーションはAuthContextで処理される
    } else {
      // エラーハンドリング
      Alert.alert('ログインエラー', result.error);
    }
  }, [formData, validateForm, login]);

  // 生体認証ログイン
  const handleBiometricLogin = useCallback(async () => {
    const result = await loginWithBiometric();
    
    if (!result.success) {
      Alert.alert('認証エラー', result.error);
    }
  }, [loginWithBiometric]);

  // ソーシャルログイン（将来実装）
  const handleSocialLogin = useCallback((provider) => {
    Alert.alert('準備中', `${provider}ログインは現在準備中です`);
  }, []);

  // パスワードリセット
  const handleForgotPassword = useCallback(() => {
    navigation.navigate('ForgotPassword');
  }, [navigation]);

  // 新規登録画面への遷移
  const handleSignUp = useCallback(() => {
    navigation.navigate('Register');
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ヘッダー */}
            <View style={styles.header}>
              <Text style={styles.title}>ようこそ</Text>
              <Text style={styles.subtitle}>
                アカウントにログインして、夜の街を楽しもう
              </Text>
            </View>

            {/* ログインフォーム */}
            <View style={styles.form}>
              {/* メールアドレス */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>メールアドレス</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    formErrors.email && styles.textInputError
                  ]}
                  placeholder="example@email.com"
                  placeholderTextColor={Colors.textSecondary}
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                />
                {formErrors.email && (
                  <Text style={styles.errorText}>{formErrors.email}</Text>
                )}
              </View>

              {/* パスワード */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>パスワード</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.textInput,
                      styles.passwordInput,
                      formErrors.password && styles.textInputError
                    ]}
                    placeholder="パスワードを入力"
                    placeholderTextColor={Colors.textSecondary}
                    value={formData.password}
                    onChangeText={(value) => handleInputChange('password', value)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="password"
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={styles.passwordToggleText}>
                      {showPassword ? '🙈' : '👁️'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {formErrors.password && (
                  <Text style={styles.errorText}>{formErrors.password}</Text>
                )}
              </View>

              {/* Remember Me & パスワードを忘れた */}
              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={styles.rememberMeContainer}
                  onPress={() => handleInputChange('rememberMe', !formData.rememberMe)}
                >
                  <View style={[
                    styles.checkbox,
                    formData.rememberMe && styles.checkboxChecked
                  ]}>
                    {formData.rememberMe && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                  <Text style={styles.rememberMeText}>ログイン状態を保持</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleForgotPassword}>
                  <Text style={styles.forgotPasswordText}>
                    パスワードを忘れた？
                  </Text>
                </TouchableOpacity>
              </View>

              {/* エラーメッセージ */}
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.globalErrorText}>{error}</Text>
                </View>
              )}

              {/* ログインボタン */}
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  isAuthenticating && styles.loginButtonDisabled
                ]}
                onPress={handleLogin}
                disabled={isAuthenticating}
              >
                <Text style={styles.loginButtonText}>
                  {isAuthenticating ? 'ログイン中...' : 'ログイン'}
                </Text>
              </TouchableOpacity>

              {/* 生体認証ボタン */}
              {biometricAvailable && (
                <TouchableOpacity
                  style={styles.biometricButton}
                  onPress={handleBiometricLogin}
                  disabled={isAuthenticating}
                >
                  <Text style={styles.biometricButtonText}>
                    👆 生体認証でログイン
                  </Text>
                </TouchableOpacity>
              )}

              {/* 区切り線 */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>または</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* ソーシャルログイン */}
              <View style={styles.socialLoginContainer}>
                {Object.values(AUTH_PROVIDERS)
                  .filter(provider => provider.enabled && provider.id !== 'email')
                  .map((provider) => (
                    <TouchableOpacity
                      key={provider.id}
                      style={styles.socialButton}
                      onPress={() => handleSocialLogin(provider.name)}
                      disabled={isAuthenticating}
                    >
                      <Text style={styles.socialButtonIcon}>{provider.icon}</Text>
                      <Text style={styles.socialButtonText}>
                        {provider.name}でログイン
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>
            </View>

            {/* フッター */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                アカウントをお持ちでない方は{' '}
              </Text>
              <TouchableOpacity onPress={handleSignUp}>
                <Text style={styles.signUpText}>新規登録</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    height: 52,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },
  textInputError: {
    borderColor: Colors.error,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  passwordToggle: {
    position: 'absolute',
    right: 16,
    top: 16,
    bottom: 16,
    justifyContent: 'center',
  },
  passwordToggleText: {
    fontSize: 20,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: Colors.lightGray,
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  rememberMeText: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
  errorContainer: {
    backgroundColor: Colors.errorLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  globalErrorText: {
    fontSize: 14,
    color: Colors.error,
    textAlign: 'center',
  },
  loginButton: {
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButtonDisabled: {
    backgroundColor: Colors.lightGray,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  biometricButton: {
    height: 52,
    backgroundColor: Colors.lightPink,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  biometricButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.lightGray,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  socialLoginContainer: {
    gap: 12,
  },
  socialButton: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 12,
    backgroundColor: Colors.white,
  },
  socialButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  signUpText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
});

export default LoginScreen;