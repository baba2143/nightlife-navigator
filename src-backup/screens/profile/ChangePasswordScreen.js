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

/**
 * パスワード変更画面
 */
const ChangePasswordScreen = ({ navigation }) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  // 初期化アニメーション
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // パスワード強度チェック
  useEffect(() => {
    if (formData.newPassword) {
      const strength = PasswordStrengthChecker.calculateStrength(formData.newPassword);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(null);
    }
  }, [formData.newPassword]);

  // フォーム入力の処理
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // エラーをクリア
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [formErrors]);

  // パスワード表示の切り替え
  const togglePasswordVisibility = useCallback((field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  }, []);

  // フォームのバリデーション
  const validateForm = useCallback(() => {
    const errors = {};
    
    // 現在のパスワード
    if (!formData.currentPassword) {
      errors.currentPassword = '現在のパスワードを入力してください';
    }
    
    // 新しいパスワード
    const passwordValidation = ValidationUtils.validatePassword(formData.newPassword);
    if (!passwordValidation.isValid) {
      errors.newPassword = passwordValidation.message;
    }
    
    // パスワード確認
    if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = 'パスワードが一致しません';
    }
    
    // 新しいパスワードが現在のパスワードと同じでないかチェック
    if (formData.currentPassword && formData.newPassword && 
        formData.currentPassword === formData.newPassword) {
      errors.newPassword = '現在のパスワードと異なるパスワードを入力してください';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // パスワード変更処理
  const handleChangePassword = useCallback(async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsUpdating(true);
    
    try {
      // パスワード変更API呼び出し（モック）
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 成功時の処理
      Alert.alert(
        '成功',
        'パスワードが正常に変更されました',
        [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]
      );
      
    } catch (error) {
      console.error('Password change error:', error);
      Alert.alert('エラー', 'パスワードの変更に失敗しました');
    } finally {
      setIsUpdating(false);
    }
  }, [formData, validateForm, navigation]);

  // 戻るボタン
  const handleBack = useCallback(() => {
    navigation.goBack();
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
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>パスワード変更</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* 説明 */}
            <View style={styles.descriptionContainer}>
              <Text style={styles.description}>
                セキュリティのため、現在のパスワードを入力してから新しいパスワードを設定してください
              </Text>
            </View>

            {/* フォーム */}
            <View style={styles.form}>
              {/* 現在のパスワード */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>現在のパスワード *</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.textInput,
                      styles.passwordInput,
                      formErrors.currentPassword && styles.textInputError
                    ]}
                    placeholder="現在のパスワードを入力"
                    placeholderTextColor={Colors.textSecondary}
                    value={formData.currentPassword}
                    onChangeText={(value) => handleInputChange('currentPassword', value)}
                    secureTextEntry={!showPasswords.current}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => togglePasswordVisibility('current')}
                  >
                    <Text style={styles.passwordToggleText}>
                      {showPasswords.current ? '🙈' : '👁️'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {formErrors.currentPassword && (
                  <Text style={styles.errorText}>{formErrors.currentPassword}</Text>
                )}
              </View>

              {/* 新しいパスワード */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>新しいパスワード *</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.textInput,
                      styles.passwordInput,
                      formErrors.newPassword && styles.textInputError
                    ]}
                    placeholder="新しいパスワードを入力"
                    placeholderTextColor={Colors.textSecondary}
                    value={formData.newPassword}
                    onChangeText={(value) => handleInputChange('newPassword', value)}
                    secureTextEntry={!showPasswords.new}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => togglePasswordVisibility('new')}
                  >
                    <Text style={styles.passwordToggleText}>
                      {showPasswords.new ? '🙈' : '👁️'}
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
                
                {formErrors.newPassword && (
                  <Text style={styles.errorText}>{formErrors.newPassword}</Text>
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
                <Text style={styles.inputLabel}>新しいパスワード（確認）*</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.textInput,
                      styles.passwordInput,
                      formErrors.confirmPassword && styles.textInputError
                    ]}
                    placeholder="新しいパスワードを再入力"
                    placeholderTextColor={Colors.textSecondary}
                    value={formData.confirmPassword}
                    onChangeText={(value) => handleInputChange('confirmPassword', value)}
                    secureTextEntry={!showPasswords.confirm}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => togglePasswordVisibility('confirm')}
                  >
                    <Text style={styles.passwordToggleText}>
                      {showPasswords.confirm ? '🙈' : '👁️'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {formErrors.confirmPassword && (
                  <Text style={styles.errorText}>{formErrors.confirmPassword}</Text>
                )}
              </View>

              {/* セキュリティ情報 */}
              <View style={styles.securityInfoContainer}>
                <Text style={styles.securityInfoTitle}>パスワードの要件:</Text>
                <Text style={styles.securityInfoText}>• 8文字以上</Text>
                <Text style={styles.securityInfoText}>• 大文字と小文字を含む</Text>
                <Text style={styles.securityInfoText}>• 数字を含む</Text>
                <Text style={styles.securityInfoText}>• 特殊文字を含む</Text>
              </View>

              {/* 更新ボタン */}
              <TouchableOpacity
                style={[
                  styles.updateButton,
                  isUpdating && styles.updateButtonDisabled
                ]}
                onPress={handleChangePassword}
                disabled={isUpdating}
              >
                <Text style={styles.updateButtonText}>
                  {isUpdating ? 'パスワード変更中...' : 'パスワードを変更'}
                </Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  descriptionContainer: {
    marginBottom: 32,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  passwordContainer: {
    position: 'relative',
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
  passwordInput: {
    paddingRight: 50,
  },
  textInputError: {
    borderColor: Colors.error,
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
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
  securityInfoContainer: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  securityInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  securityInfoText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  updateButton: {
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  updateButtonDisabled: {
    backgroundColor: Colors.lightGray,
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});

export default ChangePasswordScreen;