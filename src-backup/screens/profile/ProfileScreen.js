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
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../../design-system/colors-soft-pink';
import { useAuth } from '../../contexts/AuthContext';
import { ValidationUtils } from '../../utils/authUtils';
import { ImagePicker } from 'expo-image-picker';

/**
 * プロフィール管理画面
 */
const ProfileScreen = ({ navigation }) => {
  const { user, updateUser, logout, isLoading } = useAuth();
  
  const [profileData, setProfileData] = useState({
    displayName: '',
    email: '',
    username: '',
    bio: '',
    avatar: null,
    phone: '',
    location: '',
    website: '',
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  // 初期化アニメーション
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // ユーザーデータの初期化
  useEffect(() => {
    if (user) {
      setProfileData({
        displayName: user.displayName || '',
        email: user.email || '',
        username: user.username || '',
        bio: user.bio || '',
        avatar: user.avatar || null,
        phone: user.phone || '',
        location: user.location || '',
        website: user.website || '',
      });
    }
  }, [user]);

  // フォーム入力の処理
  const handleInputChange = useCallback((field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    
    // エラーをクリア
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [formErrors]);

  // フォームのバリデーション
  const validateForm = useCallback(() => {
    const errors = {};
    
    if (!profileData.displayName.trim()) {
      errors.displayName = '表示名を入力してください';
    }
    
    const emailValidation = ValidationUtils.validateEmail(profileData.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.message;
    }
    
    const usernameValidation = ValidationUtils.validateUsername(profileData.username);
    if (!usernameValidation.isValid) {
      errors.username = usernameValidation.message;
    }
    
    if (profileData.bio.length > 500) {
      errors.bio = 'プロフィールは500文字以内で入力してください';
    }
    
    if (profileData.phone && !ValidationUtils.validatePhone(profileData.phone).isValid) {
      errors.phone = '有効な電話番号を入力してください';
    }
    
    if (profileData.website && !ValidationUtils.validateURL(profileData.website).isValid) {
      errors.website = '有効なURLを入力してください';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [profileData]);

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
        setProfileData(prev => ({
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
        setProfileData(prev => ({
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
      ]
    );
  }, [handleImagePicker, handleCamera]);

  // プロフィール更新
  const handleUpdateProfile = useCallback(async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsUpdating(true);
    
    try {
      const result = await updateUser(profileData);
      
      if (result.success) {
        setIsEditing(false);
        Alert.alert('成功', 'プロフィールを更新しました');
      } else {
        Alert.alert('エラー', result.error || 'プロフィールの更新に失敗しました');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('エラー', 'プロフィールの更新に失敗しました');
    } finally {
      setIsUpdating(false);
    }
  }, [profileData, validateForm, updateUser]);

  // 編集モードの切り替え
  const toggleEdit = useCallback(() => {
    setIsEditing(!isEditing);
    setFormErrors({});
  }, [isEditing]);

  // 編集のキャンセル
  const cancelEdit = useCallback(() => {
    if (user) {
      setProfileData({
        displayName: user.displayName || '',
        email: user.email || '',
        username: user.username || '',
        bio: user.bio || '',
        avatar: user.avatar || null,
        phone: user.phone || '',
        location: user.location || '',
        website: user.website || '',
      });
    }
    setIsEditing(false);
    setFormErrors({});
  }, [user]);

  // ログアウト
  const handleLogout = useCallback(() => {
    Alert.alert(
      'ログアウト',
      'ログアウトしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: 'ログアウト', style: 'destructive', onPress: logout },
      ]
    );
  }, [logout]);

  // 設定画面への遷移
  const navigateToSettings = useCallback(() => {
    navigation.navigate('Settings');
  }, [navigation]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* ヘッダー */}
          <View style={styles.header}>
            <Text style={styles.title}>プロフィール</Text>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={navigateToSettings}
            >
              <Text style={styles.settingsButtonText}>⚙️</Text>
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
                onPress={isEditing ? showImagePickerOptions : null}
                disabled={!isEditing}
              >
                {profileData.avatar ? (
                  <Image source={{ uri: profileData.avatar }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarPlaceholderText}>
                      {profileData.displayName.charAt(0).toUpperCase() || '?'}
                    </Text>
                  </View>
                )}
                {isEditing && (
                  <View style={styles.editAvatarOverlay}>
                    <Text style={styles.editAvatarText}>📷</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              {/* ユーザー情報 */}
              <View style={styles.userInfo}>
                <Text style={styles.displayName}>{profileData.displayName}</Text>
                <Text style={styles.username}>@{profileData.username}</Text>
              </View>
              
              {/* 編集ボタン */}
              <TouchableOpacity
                style={[styles.editButton, isEditing && styles.editButtonActive]}
                onPress={toggleEdit}
              >
                <Text style={[styles.editButtonText, isEditing && styles.editButtonTextActive]}>
                  {isEditing ? 'キャンセル' : '編集'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* フォーム */}
            <View style={styles.form}>
              {/* 表示名 */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>表示名 *</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    formErrors.displayName && styles.textInputError,
                    !isEditing && styles.textInputReadonly
                  ]}
                  placeholder="表示名を入力"
                  placeholderTextColor={Colors.textSecondary}
                  value={profileData.displayName}
                  onChangeText={(value) => handleInputChange('displayName', value)}
                  editable={isEditing}
                />
                {formErrors.displayName && (
                  <Text style={styles.errorText}>{formErrors.displayName}</Text>
                )}
              </View>

              {/* メールアドレス */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>メールアドレス *</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    formErrors.email && styles.textInputError,
                    !isEditing && styles.textInputReadonly
                  ]}
                  placeholder="example@email.com"
                  placeholderTextColor={Colors.textSecondary}
                  value={profileData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={isEditing}
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
                    formErrors.username && styles.textInputError,
                    !isEditing && styles.textInputReadonly
                  ]}
                  placeholder="username123"
                  placeholderTextColor={Colors.textSecondary}
                  value={profileData.username}
                  onChangeText={(value) => handleInputChange('username', value)}
                  autoCapitalize="none"
                  editable={isEditing}
                />
                {formErrors.username && (
                  <Text style={styles.errorText}>{formErrors.username}</Text>
                )}
              </View>

              {/* プロフィール */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>プロフィール</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    styles.textInputMultiline,
                    formErrors.bio && styles.textInputError,
                    !isEditing && styles.textInputReadonly
                  ]}
                  placeholder="自己紹介を入力してください"
                  placeholderTextColor={Colors.textSecondary}
                  value={profileData.bio}
                  onChangeText={(value) => handleInputChange('bio', value)}
                  multiline
                  numberOfLines={4}
                  editable={isEditing}
                />
                <Text style={styles.characterCount}>
                  {profileData.bio.length}/500
                </Text>
                {formErrors.bio && (
                  <Text style={styles.errorText}>{formErrors.bio}</Text>
                )}
              </View>

              {/* 電話番号 */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>電話番号</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    formErrors.phone && styles.textInputError,
                    !isEditing && styles.textInputReadonly
                  ]}
                  placeholder="090-1234-5678"
                  placeholderTextColor={Colors.textSecondary}
                  value={profileData.phone}
                  onChangeText={(value) => handleInputChange('phone', value)}
                  keyboardType="phone-pad"
                  editable={isEditing}
                />
                {formErrors.phone && (
                  <Text style={styles.errorText}>{formErrors.phone}</Text>
                )}
              </View>

              {/* 場所 */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>場所</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    !isEditing && styles.textInputReadonly
                  ]}
                  placeholder="東京都渋谷区"
                  placeholderTextColor={Colors.textSecondary}
                  value={profileData.location}
                  onChangeText={(value) => handleInputChange('location', value)}
                  editable={isEditing}
                />
              </View>

              {/* ウェブサイト */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>ウェブサイト</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    formErrors.website && styles.textInputError,
                    !isEditing && styles.textInputReadonly
                  ]}
                  placeholder="https://example.com"
                  placeholderTextColor={Colors.textSecondary}
                  value={profileData.website}
                  onChangeText={(value) => handleInputChange('website', value)}
                  keyboardType="url"
                  autoCapitalize="none"
                  editable={isEditing}
                />
                {formErrors.website && (
                  <Text style={styles.errorText}>{formErrors.website}</Text>
                )}
              </View>

              {/* 更新ボタン */}
              {isEditing && (
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={cancelEdit}
                  >
                    <Text style={styles.cancelButtonText}>キャンセル</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.updateButton,
                      isUpdating && styles.updateButtonDisabled
                    ]}
                    onPress={handleUpdateProfile}
                    disabled={isUpdating}
                  >
                    <Text style={styles.updateButtonText}>
                      {isUpdating ? '更新中...' : '更新'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>

          {/* フッター */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonText}>ログアウト</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButtonText: {
    fontSize: 20,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.lightGray,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.white,
  },
  editAvatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  editAvatarText: {
    fontSize: 16,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  displayName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  editButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
  },
  editButtonActive: {
    backgroundColor: Colors.error,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  editButtonTextActive: {
    color: Colors.white,
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
  textInputMultiline: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  textInputReadonly: {
    backgroundColor: Colors.backgroundSecondary,
    color: Colors.textSecondary,
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
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    height: 52,
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  updateButton: {
    flex: 2,
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
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  logoutButton: {
    height: 52,
    backgroundColor: Colors.error,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});

export default ProfileScreen;