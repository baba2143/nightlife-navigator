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
import { ValidationUtils, PasswordStrengthChecker } from '../../utils/authUtils';
import { AUTH_PROVIDERS } from '../../config/auth';

/**
 * 新規登録画面
 */
const RegisterScreen = ({ navigation }) => {
  const { register, isRegistering, error, clearError } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    displayName: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    agreeToPrivacy: false,
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;

  // 初期化アニメーション
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // パスワード強度チェック
  useEffect(() => {
    if (formData.password) {
      const strength = PasswordStrengthChecker.calculateStrength(formData.password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(null);
    }
  }, [formData.password]);

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

  // ステップ1のバリデーション
  const validateStep1 = useCallback(() => {
    const errors = {};
    
    const emailValidation = ValidationUtils.validateEmail(formData.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.message;
    }
    
    const usernameValidation = ValidationUtils.validateUsername(formData.username);
    if (!usernameValidation.isValid) {
      errors.username = usernameValidation.message;
    }
    
    if (!formData.displayName) {
      errors.displayName = '表示名を入力してください';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // ステップ2のバリデーション
  const validateStep2 = useCallback(() => {
    const errors = {};
    
    const passwordValidation = ValidationUtils.validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.message;
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'パスワードが一致しません';
    }
    
    if (!formData.agreeToTerms) {
      errors.agreeToTerms = '利用規約に同意してください';
    }
    
    if (!formData.agreeToPrivacy) {
      errors.agreeToPrivacy = 'プライバシーポリシーに同意してください';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // 次のステップへ進む
  const handleNextStep = useCallback(() => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  }, [currentStep, validateStep1]);

  // 前のステップに戻る
  const handlePrevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  // 登録処理
  const handleRegister = useCallback(async () => {
    if (!validateStep2()) {
      return;
    }
    
    const result = await register({
      email: formData.email,
      username: formData.username,
      displayName: formData.displayName,
      password: formData.password,
    });
    
    if (result.success) {
      Alert.alert(
        '登録完了',
        'アカウントの作成が完了しました。メールアドレスの確認メールをお送りしました。',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('EmailVerification'),
          },
        ]
      );
    } else {
      Alert.alert('登録エラー', result.error);
    }
  }, [formData, validateStep2, register, navigation]);

  // ソーシャル登録（将来実装）
  const handleSocialRegister = useCallback((provider) => {
    Alert.alert('準備中', `${provider}での登録は現在準備中です`);
  }, []);

  // ログイン画面への遷移
  const handleSignIn = useCallback(() => {
    navigation.navigate('Login');
  }, [navigation]);

  // パスワード強度のカラー
  const getPasswordStrengthColor = (strength) => {
    switch (strength) {
      case 'weak':
        return Colors.error;
      case 'medium':
        return Colors.warning;
      case 'strong':
        return Colors.success;
      default:
        return Colors.lightGray;
    }
  };

  // パスワード強度のテキスト
  const getPasswordStrengthText = (strength) => {
    switch (strength) {
      case 'weak':
        return '弱い';
      case 'medium':
        return '普通';
      case 'strong':
        return '強い';
      default:
        return '';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* ヘッダー */}
          <View style={styles.header}>
            <Text style={styles.title}>アカウント作成</Text>
            <Text style={styles.subtitle}>
              新しいアカウントを作成して、夜の街を楽しもう
            </Text>
            
            {/* ステップインジケーター */}
            <View style={styles.stepIndicator}>
              {Array.from({ length: totalSteps }, (_, index) => (
                <View
                  key={index}
                  style={[
                    styles.stepDot,
                    index + 1 <= currentStep && styles.stepDotActive
                  ]}
                />
              ))}
            </View>
          </View>

          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ステップ1: 基本情報 */}
            {currentStep === 1 && (
              <View style={styles.form}>
                <Text style={styles.stepTitle}>基本情報を入力してください</Text>
                
                {/* メールアドレス */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>メールアドレス *</Text>
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

                {/* ユーザー名 */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>ユーザー名 *</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      formErrors.username && styles.textInputError
                    ]}
                    placeholder="username123"
                    placeholderTextColor={Colors.textSecondary}
                    value={formData.username}
                    onChangeText={(value) => handleInputChange('username', value)}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {formErrors.username && (
                    <Text style={styles.errorText}>{formErrors.username}</Text>
                  )}
                </View>

                {/* 表示名 */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>表示名 *</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      formErrors.displayName && styles.textInputError
                    ]}
                    placeholder="田中太郎"
                    placeholderTextColor={Colors.textSecondary}
                    value={formData.displayName}
                    onChangeText={(value) => handleInputChange('displayName', value)}
                    autoCorrect={false}
                  />
                  {formErrors.displayName && (
                    <Text style={styles.errorText}>{formErrors.displayName}</Text>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={handleNextStep}
                >
                  <Text style={styles.nextButtonText}>次へ</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ステップ2: パスワード設定 */}
            {currentStep === 2 && (
              <View style={styles.form}>
                <Text style={styles.stepTitle}>パスワードを設定してください</Text>
                
                {/* パスワード */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>パスワード *</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[
                        styles.textInput,
                        styles.passwordInput,
                        formErrors.password && styles.textInputError
                      ]}
                      placeholder="8文字以上のパスワード"
                      placeholderTextColor={Colors.textSecondary}
                      value={formData.password}
                      onChangeText={(value) => handleInputChange('password', value)}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
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
                  
                  {/* パスワード強度インジケーター */}
                  {passwordStrength && (
                    <View style={styles.passwordStrengthContainer}>
                      <View style={styles.passwordStrengthBar}>
                        <View
                          style={[
                            styles.passwordStrengthFill,
                            {
                              width: `${(passwordStrength.score / 6) * 100}%`,
                              backgroundColor: getPasswordStrengthColor(passwordStrength.strength),
                            },
                          ]}
                        />
                      </View>
                      <Text
                        style={[
                          styles.passwordStrengthText,
                          { color: getPasswordStrengthColor(passwordStrength.strength) },
                        ]}
                      >
                        {getPasswordStrengthText(passwordStrength.strength)}
                      </Text>
                    </View>
                  )}
                  
                  {formErrors.password && (
                    <Text style={styles.errorText}>{formErrors.password}</Text>
                  )}
                  
                  {passwordStrength && passwordStrength.feedback.length > 0 && (
                    <View style={styles.passwordFeedback}>
                      {passwordStrength.feedback.map((feedback, index) => (
                        <Text key={index} style={styles.passwordFeedbackText}>
                          • {feedback}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>

                {/* パスワード確認 */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>パスワード確認 *</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[
                        styles.textInput,
                        styles.passwordInput,
                        formErrors.confirmPassword && styles.textInputError
                      ]}
                      placeholder="パスワードを再入力"
                      placeholderTextColor={Colors.textSecondary}
                      value={formData.confirmPassword}
                      onChangeText={(value) => handleInputChange('confirmPassword', value)}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      style={styles.passwordToggle}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <Text style={styles.passwordToggleText}>
                        {showConfirmPassword ? '🙈' : '👁️'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {formErrors.confirmPassword && (
                    <Text style={styles.errorText}>{formErrors.confirmPassword}</Text>
                  )}
                </View>

                {/* 利用規約・プライバシーポリシー */}
                <View style={styles.agreementContainer}>
                  <TouchableOpacity
                    style={styles.agreementRow}
                    onPress={() => handleInputChange('agreeToTerms', !formData.agreeToTerms)}
                  >
                    <View style={[
                      styles.checkbox,
                      formData.agreeToTerms && styles.checkboxChecked,
                      formErrors.agreeToTerms && styles.checkboxError
                    ]}>
                      {formData.agreeToTerms && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                    <Text style={styles.agreementText}>
                      <Text style={styles.linkText}>利用規約</Text>に同意します
                    </Text>
                  </TouchableOpacity>
                  {formErrors.agreeToTerms && (
                    <Text style={styles.errorText}>{formErrors.agreeToTerms}</Text>
                  )}

                  <TouchableOpacity
                    style={styles.agreementRow}
                    onPress={() => handleInputChange('agreeToPrivacy', !formData.agreeToPrivacy)}
                  >
                    <View style={[
                      styles.checkbox,
                      formData.agreeToPrivacy && styles.checkboxChecked,
                      formErrors.agreeToPrivacy && styles.checkboxError
                    ]}>
                      {formData.agreeToPrivacy && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                    <Text style={styles.agreementText}>
                      <Text style={styles.linkText}>プライバシーポリシー</Text>に同意します
                    </Text>
                  </TouchableOpacity>
                  {formErrors.agreeToPrivacy && (
                    <Text style={styles.errorText}>{formErrors.agreeToPrivacy}</Text>
                  )}
                </View>

                {/* エラーメッセージ */}
                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.globalErrorText}>{error}</Text>
                  </View>
                )}

                {/* ボタン */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={handlePrevStep}
                  >
                    <Text style={styles.backButtonText}>戻る</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.registerButton,
                      isRegistering && styles.registerButtonDisabled
                    ]}
                    onPress={handleRegister}
                    disabled={isRegistering}
                  >
                    <Text style={styles.registerButtonText}>
                      {isRegistering ? '登録中...' : 'アカウント作成'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ソーシャル登録 */}
            {currentStep === 1 && (
              <>
                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>または</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.socialLoginContainer}>
                  {Object.values(AUTH_PROVIDERS)
                    .filter(provider => provider.enabled && provider.id !== 'email')
                    .map((provider) => (
                      <TouchableOpacity
                        key={provider.id}
                        style={styles.socialButton}
                        onPress={() => handleSocialRegister(provider.name)}
                        disabled={isRegistering}
                      >
                        <Text style={styles.socialButtonIcon}>{provider.icon}</Text>
                        <Text style={styles.socialButtonText}>
                          {provider.name}で登録
                        </Text>
                      </TouchableOpacity>
                    ))}
                </View>
              </>
            )}
          </ScrollView>

          {/* フッター */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              既にアカウントをお持ちの方は{' '}
            </Text>
            <TouchableOpacity onPress={handleSignIn}>
              <Text style={styles.signInText}>ログイン</Text>
            </TouchableOpacity>
          </View>
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
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.lightGray,
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  form: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 24,
    textAlign: 'center',
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
  passwordStrengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  passwordStrengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.lightGray,
    borderRadius: 2,
    marginRight: 8,
  },
  passwordStrengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  passwordStrengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  passwordFeedback: {
    marginTop: 8,
  },
  passwordFeedbackText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  agreementContainer: {
    marginBottom: 24,
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: Colors.lightGray,
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxError: {
    borderColor: Colors.error,
  },
  checkmark: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  agreementText: {
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
  },
  linkText: {
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
  nextButton: {
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  backButton: {
    flex: 1,
    height: 52,
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  registerButton: {
    flex: 2,
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButtonDisabled: {
    backgroundColor: Colors.lightGray,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
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
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  signInText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
});

export default RegisterScreen;