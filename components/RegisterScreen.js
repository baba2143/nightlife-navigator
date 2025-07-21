import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AuthService from '../services/AuthService';

// カラーテーマ
const colors = {
  primary: '#ea5a7b',
  white: '#ffffff',
  background: '#fafafa',
  backgroundLight: '#fef7f7',
  text: '#333333',
  textSecondary: '#666666',
  border: '#e0e0e0',
  error: '#f44336',
  success: '#4caf50',
};

const RegisterScreen = ({ onSuccess, onSwitchToLogin, onClose }) => {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = '表示名を入力してください';
    } else if (formData.displayName.trim().length < 2) {
      newErrors.displayName = '表示名は2文字以上で入力してください';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'メールアドレスを入力してください';
    } else if (!AuthService.validateEmail(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }

    if (!formData.password) {
      newErrors.password = 'パスワードを入力してください';
    } else {
      const passwordValidation = AuthService.validatePassword(formData.password);
      if (!passwordValidation.valid) {
        newErrors.password = passwordValidation.message;
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'パスワード確認を入力してください';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'パスワードが一致しません';
    }

    if (formData.phoneNumber && !/^[0-9\-\+\(\)\s]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = '有効な電話番号を入力してください';
    }

    if (!agreedToTerms) {
      newErrors.terms = '利用規約に同意する必要があります';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await AuthService.initialize();
      const result = await AuthService.register({
        displayName: formData.displayName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phoneNumber: formData.phoneNumber.trim() || null,
      });

      if (result.success) {
        Alert.alert(
          '登録完了',
          'アカウントが作成されました！',
          [{ text: 'OK', onPress: () => onSuccess && onSuccess(result.user) }]
        );
      } else {
        Alert.alert('登録エラー', result.error);
      }
    } catch (error) {
      Alert.alert('エラー', 'アカウント作成中にエラーが発生しました');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleTermsAgreement = () => {
    setAgreedToTerms(!agreedToTerms);
    if (errors.terms) {
      setErrors(prev => ({ ...prev, terms: null }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ヘッダー */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.title}>新規登録</Text>
            <View style={styles.placeholder} />
          </View>

          {/* ロゴエリア */}
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>🌙</Text>
            </View>
            <Text style={styles.appName}>Nightlife Navigator</Text>
            <Text style={styles.subtitle}>アカウントを作成してサービスを利用</Text>
          </View>

          {/* フォーム */}
          <View style={styles.form}>
            {/* 表示名 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>表示名 *</Text>
              <View style={[
                styles.inputContainer,
                errors.displayName && styles.inputError
              ]}>
                <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="山田太郎"
                  value={formData.displayName}
                  onChangeText={(value) => updateFormData('displayName', value)}
                  autoCapitalize="words"
                />
              </View>
              {errors.displayName && (
                <Text style={styles.errorText}>{errors.displayName}</Text>
              )}
            </View>

            {/* メールアドレス */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>メールアドレス *</Text>
              <View style={[
                styles.inputContainer,
                errors.email && styles.inputError
              ]}>
                <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="your@example.com"
                  value={formData.email}
                  onChangeText={(value) => updateFormData('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            {/* 電話番号 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>電話番号（任意）</Text>
              <View style={[
                styles.inputContainer,
                errors.phoneNumber && styles.inputError
              ]}>
                <Ionicons name="call-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="090-1234-5678"
                  value={formData.phoneNumber}
                  onChangeText={(value) => updateFormData('phoneNumber', value)}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                />
              </View>
              {errors.phoneNumber && (
                <Text style={styles.errorText}>{errors.phoneNumber}</Text>
              )}
            </View>

            {/* パスワード */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>パスワード *</Text>
              <View style={[
                styles.inputContainer,
                errors.password && styles.inputError
              ]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="8文字以上（大文字・小文字・数字を含む）"
                  value={formData.password}
                  onChangeText={(value) => updateFormData('password', value)}
                  secureTextEntry={!showPassword}
                  autoComplete="new-password"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.passwordToggle}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            {/* パスワード確認 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>パスワード確認 *</Text>
              <View style={[
                styles.inputContainer,
                errors.confirmPassword && styles.inputError
              ]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="上記と同じパスワードを入力"
                  value={formData.confirmPassword}
                  onChangeText={(value) => updateFormData('confirmPassword', value)}
                  secureTextEntry={!showConfirmPassword}
                  autoComplete="new-password"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.passwordToggle}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>

            {/* 利用規約同意 */}
            <TouchableOpacity style={styles.termsContainer} onPress={handleTermsAgreement}>
              <View style={[
                styles.checkbox,
                agreedToTerms && styles.checkboxChecked
              ]}>
                {agreedToTerms && (
                  <Ionicons name="checkmark" size={16} color={colors.white} />
                )}
              </View>
              <View style={styles.termsTextContainer}>
                <Text style={styles.termsText}>
                  <Text style={styles.termsLink}>利用規約</Text>
                  および
                  <Text style={styles.termsLink}>プライバシーポリシー</Text>
                  に同意します
                </Text>
              </View>
            </TouchableOpacity>
            {errors.terms && (
              <Text style={styles.errorText}>{errors.terms}</Text>
            )}

            {/* 登録ボタン */}
            <TouchableOpacity
              style={[styles.registerButton, loading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.registerButtonText}>アカウントを作成</Text>
              )}
            </TouchableOpacity>

            {/* パスワード要件 */}
            <View style={styles.passwordRequirements}>
              <Text style={styles.requirementsTitle}>パスワード要件:</Text>
              <Text style={styles.requirementItem}>• 8文字以上</Text>
              <Text style={styles.requirementItem}>• 大文字・小文字を含む</Text>
              <Text style={styles.requirementItem}>• 数字を含む</Text>
            </View>
          </View>

          {/* ログインリンク */}
          <View style={styles.loginSection}>
            <Text style={styles.loginText}>既にアカウントをお持ちの場合</Text>
            <TouchableOpacity onPress={onSwitchToLogin}>
              <Text style={styles.loginLink}>ログイン</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  // ヘッダー
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
  },

  closeButton: {
    padding: 8,
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },

  placeholder: {
    width: 40,
  },

  // ロゴエリア
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: colors.white,
  },

  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  logoText: {
    fontSize: 30,
    color: colors.white,
  },

  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // フォーム
  form: {
    padding: 20,
    backgroundColor: colors.white,
    marginTop: 16,
  },

  inputGroup: {
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.white,
    gap: 10,
  },

  inputError: {
    borderColor: colors.error,
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },

  passwordToggle: {
    padding: 4,
  },

  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },

  // 利用規約
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 12,
  },

  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },

  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  termsTextContainer: {
    flex: 1,
  },

  termsText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  termsLink: {
    color: colors.primary,
    fontWeight: '500',
  },

  registerButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },

  registerButtonDisabled: {
    opacity: 0.7,
  },

  registerButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },

  // パスワード要件
  passwordRequirements: {
    padding: 16,
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    marginBottom: 20,
  },

  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },

  requirementItem: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },

  // ログイン
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 8,
  },

  loginText: {
    fontSize: 16,
    color: colors.textSecondary,
  },

  loginLink: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default RegisterScreen;