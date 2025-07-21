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
  Image,
  Animated,
} from 'react-native';
import { Colors } from '../../design-system/colors-soft-pink';
import { useAuth } from '../../contexts/AuthContext';
import { ValidationUtils } from '../../utils/authUtils';
import { ImagePicker } from 'expo-image-picker';

/**
 * プロフィール編集画面
 */
const ProfileEditScreen = ({ navigation, route }) => {
  const { user, updateUser } = useAuth();
  const { field = null } = route.params || {};
  
  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    bio: '',
    phone: '',
    location: '',
    website: '',
    avatar: null,
  });
  
  const [formErrors, setFormErrors] = useState({});
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

  // ユーザーデータの初期化
  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        username: user.username || '',
        bio: user.bio || '',
        phone: user.phone || '',
        location: user.location || '',
        website: user.website || '',
        avatar: user.avatar || null,
      });
    }
  }, [user]);

  // フォーム入力の処理
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // エラーをクリア
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [formErrors]);

  // 特定フィールドのバリデーション
  const validateField = useCallback((fieldName, value) => {
    switch (fieldName) {
      case 'displayName':
        return value.trim() ? null : '表示名を入力してください';
      
      case 'username':
        const usernameValidation = ValidationUtils.validateUsername(value);
        return usernameValidation.isValid ? null : usernameValidation.message;
      
      case 'bio':
        return value.length <= 500 ? null : 'プロフィールは500文字以内で入力してください';
      
      case 'phone':
        if (!value) return null;
        const phoneValidation = ValidationUtils.validatePhone(value);
        return phoneValidation.isValid ? null : phoneValidation.message;
      
      case 'website':
        if (!value) return null;
        const urlValidation = ValidationUtils.validateURL(value);
        return urlValidation.isValid ? null : urlValidation.message;
      
      default:
        return null;
    }
  }, []);

  // フォームのバリデーション
  const validateForm = useCallback(() => {
    const errors = {};
    
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) {
        errors[key] = error;
      }
    });
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, validateField]);

  // 画像の選択
  const handleImagePicker = useCallback(async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('権限が必要です', '写真ライブラリへのアクセス権限が必要です');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData(prev => ({
          ...prev,
          avatar: result.assets[0].uri,
        }));
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('エラー', '画像の選択に失敗しました');
    }
  }, []);

  // カメラで撮影
  const handleCamera = useCallback(async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('権限が必要です', 'カメラへのアクセス権限が必要です');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData(prev => ({
          ...prev,
          avatar: result.assets[0].uri,
        }));
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('エラー', '写真の撮影に失敗しました');
    }
  }, []);

  // プロフィール画像の選択肢
  const showImagePickerOptions = useCallback(() => {
    Alert.alert(
      'プロフィール画像を選択',
      '画像を選択する方法を選んでください',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '写真ライブラリ', onPress: handleImagePicker },
        { text: 'カメラで撮影', onPress: handleCamera },
        ...(formData.avatar ? [{ text: '画像を削除', onPress: () => setFormData(prev => ({ ...prev, avatar: null })) }] : []),
      ]
    );
  }, [handleImagePicker, handleCamera, formData.avatar]);

  // 保存処理
  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsUpdating(true);
    
    try {
      const result = await updateUser(formData);
      
      if (result.success) {
        Alert.alert('成功', 'プロフィールを更新しました', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('エラー', result.error || 'プロフィールの更新に失敗しました');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('エラー', 'プロフィールの更新に失敗しました');
    } finally {
      setIsUpdating(false);
    }
  }, [formData, validateForm, updateUser, navigation]);

  // 戻るボタン
  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // フィールド設定
  const getFieldConfig = useCallback((fieldName) => {
    const configs = {
      displayName: { label: '表示名', required: true, placeholder: '表示名を入力' },
      username: { label: 'ユーザー名', required: true, placeholder: 'username123' },
      bio: { label: 'プロフィール', required: false, placeholder: '自己紹介を入力してください', multiline: true },
      phone: { label: '電話番号', required: false, placeholder: '090-1234-5678', keyboardType: 'phone-pad' },
      location: { label: '場所', required: false, placeholder: '東京都渋谷区' },
      website: { label: 'ウェブサイト', required: false, placeholder: 'https://example.com', keyboardType: 'url' },
    };
    return configs[fieldName] || {};
  }, []);

  const renderField = useCallback((fieldName) => {
    const config = getFieldConfig(fieldName);
    const error = formErrors[fieldName];
    
    return (
      <View key={fieldName} style={styles.inputContainer}>
        <Text style={styles.inputLabel}>
          {config.label}
          {config.required && <Text style={styles.required}> *</Text>}
        </Text>
        <TextInput
          style={[
            styles.textInput,
            config.multiline && styles.textInputMultiline,
            error && styles.textInputError
          ]}
          placeholder={config.placeholder}
          placeholderTextColor={Colors.textSecondary}
          value={formData[fieldName]}
          onChangeText={(value) => handleInputChange(fieldName, value)}
          keyboardType={config.keyboardType || 'default'}
          autoCapitalize={fieldName === 'website' ? 'none' : 'sentences'}
          multiline={config.multiline}
          numberOfLines={config.multiline ? 4 : 1}
        />
        {fieldName === 'bio' && (
          <Text style={styles.characterCount}>
            {formData[fieldName].length}/500
          </Text>
        )}
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
      </View>
    );
  }, [formData, formErrors, getFieldConfig, handleInputChange]);

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
            <Text style={styles.title}>プロフィール編集</Text>
            <TouchableOpacity
              style={[styles.saveButton, isUpdating && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isUpdating}
            >
              <Text style={styles.saveButtonText}>
                {isUpdating ? '保存中...' : '保存'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* プロフィール画像 */}
            <View style={styles.avatarContainer}>
              <TouchableOpacity
                style={styles.avatarWrapper}
                onPress={showImagePickerOptions}
              >
                {formData.avatar ? (
                  <Image source={{ uri: formData.avatar }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarPlaceholderText}>
                      {formData.displayName.charAt(0).toUpperCase() || '?'}
                    </Text>
                  </View>
                )}
                <View style={styles.editAvatarOverlay}>
                  <Text style={styles.editAvatarText}>📷</Text>
                </View>
              </TouchableOpacity>
              <Text style={styles.changePhotoText}>写真を変更</Text>
            </View>

            {/* フォーム */}
            <View style={styles.form}>
              {field ? (
                // 特定フィールドの編集
                renderField(field)
              ) : (
                // 全フィールドの編集
                <>
                  {renderField('displayName')}
                  {renderField('username')}
                  {renderField('bio')}
                  {renderField('phone')}
                  {renderField('location')}
                  {renderField('website')}
                </>
              )}
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
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.primary,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.lightGray,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.lightGray,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.white,
  },
  editAvatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  editAvatarText: {
    fontSize: 18,
  },
  changePhotoText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
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
  required: {
    color: Colors.error,
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
  textInputMultiline: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  textInputError: {
    borderColor: Colors.error,
  },
  characterCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
});

export default ProfileEditScreen;