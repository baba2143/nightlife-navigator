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

const LoginScreen = ({ onSuccess, onSwitchToRegister, onClose }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'メールアドレスを入力してください';
    } else if (!AuthService.validateEmail(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }

    if (!formData.password) {
      newErrors.password = 'パスワードを入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await AuthService.initialize();
      const result = await AuthService.login(formData.email, formData.password);

      if (result.success) {
        Alert.alert(
          'ログイン成功',
          'ログインしました！',
          [{ text: 'OK', onPress: () => onSuccess && onSuccess(result.user) }]
        );
      } else {
        Alert.alert('ログインエラー', result.error);
      }
    } catch (error) {
      Alert.alert('エラー', 'ログイン処理中にエラーが発生しました');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!formData.email.trim()) {
      Alert.alert('メールアドレス必須', 'パスワードリセットにはメールアドレスが必要です');
      return;
    }

    Alert.alert(
      'パスワードリセット',
      `${formData.email} にパスワードリセットメールを送信しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '送信', 
          onPress: async () => {
            const result = await AuthService.requestPasswordReset(formData.email);
            Alert.alert(
              result.success ? '送信完了' : 'エラー',
              result.success ? result.message : result.error
            );
          }
        },
      ]
    );
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
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
            <Text style={styles.title}>ログイン</Text>
            <View style={styles.placeholder} />
          </View>

          {/* ロゴエリア */}
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>🌙</Text>
            </View>
            <Text style={styles.appName}>Nightlife Navigator</Text>
            <Text style={styles.subtitle}>ログインしてサービスをご利用ください</Text>
          </View>

          {/* フォーム */}
          <View style={styles.form}>
            {/* メールアドレス */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>メールアドレス</Text>
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

            {/* パスワード */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>パスワード</Text>
              <View style={[
                styles.inputContainer,
                errors.password && styles.inputError
              ]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="パスワードを入力"
                  value={formData.password}
                  onChangeText={(value) => updateFormData('password', value)}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
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

            {/* パスワードを忘れた場合 */}
            <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
              <Text style={styles.forgotPasswordText}>パスワードを忘れた場合</Text>
            </TouchableOpacity>

            {/* ログインボタン */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.loginButtonText}>ログイン</Text>
              )}
            </TouchableOpacity>

            {/* または */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>または</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* ソーシャルログイン（モック） */}
            <TouchableOpacity style={styles.socialButton} disabled>
              <Ionicons name="logo-google" size={20} color={colors.textSecondary} />
              <Text style={styles.socialButtonText}>Googleでログイン</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialButton} disabled>
              <Ionicons name="logo-apple" size={20} color={colors.textSecondary} />
              <Text style={styles.socialButtonText}>Appleでログイン</Text>
            </TouchableOpacity>
          </View>

          {/* 新規登録リンク */}
          <View style={styles.registerSection}>
            <Text style={styles.registerText}>アカウントをお持ちでない場合</Text>
            <TouchableOpacity onPress={onSwitchToRegister}>
              <Text style={styles.registerLink}>新規登録</Text>
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
    paddingVertical: 40,
    backgroundColor: colors.white,
  },

  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  logoText: {
    fontSize: 40,
    color: colors.white,
  },

  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // フォーム
  form: {
    padding: 24,
    backgroundColor: colors.white,
    marginTop: 16,
  },

  inputGroup: {
    marginBottom: 20,
  },

  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    gap: 12,
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
    fontSize: 14,
    color: colors.error,
    marginTop: 4,
  },

  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },

  forgotPasswordText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },

  loginButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },

  loginButtonDisabled: {
    opacity: 0.7,
  },

  loginButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },

  // 区切り線
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },

  dividerText: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  // ソーシャルログイン
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    gap: 8,
    opacity: 0.5,
  },

  socialButtonText: {
    fontSize: 16,
    color: colors.textSecondary,
  },

  // 新規登録
  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 8,
  },

  registerText: {
    fontSize: 16,
    color: colors.textSecondary,
  },

  registerLink: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default LoginScreen;