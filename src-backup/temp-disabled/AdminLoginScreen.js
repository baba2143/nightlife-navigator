import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import adminAuthService from '../services/AdminAuthService';

export default function AdminLoginScreen({ onLoginSuccess, onBack }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('エラー', 'ユーザー名とパスワードを入力してください');
      return;
    }

    setLoading(true);
    try {
      const result = await adminAuthService.login(username.trim(), password);
      
      if (result.success) {
        Alert.alert(
          'ログイン成功',
          `${result.admin.name}としてログインしました`,
          [
            {
              text: 'OK',
              onPress: () => onLoginSuccess && onLoginSuccess(result.admin)
            }
          ]
        );
      } else {
        Alert.alert('ログインエラー', result.error);
      }
    } catch (error) {
      Alert.alert('エラー', 'ログイン処理中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (demoAccount) => {
    setUsername(demoAccount.username);
    setPassword(demoAccount.password);
  };

  const demoAccounts = [
    {
      username: 'admin',
      password: 'admin123',
      role: 'スーパー管理者',
      description: '全機能にアクセス可能'
    },
    {
      username: 'moderator',
      password: 'mod123',
      role: 'コンテンツ管理者',
      description: 'コンテンツ管理機能にアクセス可能'
    },
    {
      username: 'support',
      password: 'sup123',
      role: 'サポート担当',
      description: '基本的な管理機能にアクセス可能'
    }
  ];

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>管理者ログイン</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* ログインフォーム */}
        <View style={styles.loginSection}>
          <Text style={styles.sectionTitle}>🔐 管理者認証</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>ユーザー名</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="管理者ユーザー名を入力"
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>パスワード</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={setPassword}
                placeholder="パスワードを入力"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.showPasswordButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.showPasswordText}>
                  {showPassword ? '🙈' : '👁️'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.loginButtonText}>ログイン</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* デモアカウント */}
        <View style={styles.demoSection}>
          <Text style={styles.sectionTitle}>🧪 デモアカウント</Text>
          <Text style={styles.demoDescription}>
            テスト用のアカウントです。タップして自動入力できます。
          </Text>
          
          {demoAccounts.map((account, index) => (
            <TouchableOpacity
              key={index}
              style={styles.demoAccountButton}
              onPress={() => handleDemoLogin(account)}
            >
              <View style={styles.demoAccountInfo}>
                <Text style={styles.demoAccountRole}>{account.role}</Text>
                <Text style={styles.demoAccountUsername}>
                  {account.username} / {account.password}
                </Text>
                <Text style={styles.demoAccountDescription}>
                  {account.description}
                </Text>
              </View>
              <Text style={styles.demoAccountArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* セキュリティ情報 */}
        <View style={styles.securitySection}>
          <Text style={styles.sectionTitle}>🔒 セキュリティ情報</Text>
          <View style={styles.securityInfo}>
            <Text style={styles.securityText}>• セッションは8時間で自動ログアウト</Text>
            <Text style={styles.securityText}>• 権限に応じて機能が制限されます</Text>
            <Text style={styles.securityText}>• 全ての操作はログに記録されます</Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  backButton: {
    color: '#D4AF37',
    fontSize: 16
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4AF37'
  },
  placeholder: {
    width: 50
  },
  content: {
    flex: 1,
    padding: 20
  },
  loginSection: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 20
  },
  inputContainer: {
    marginBottom: 20
  },
  inputLabel: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
    fontWeight: '600'
  },
  input: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 8,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444'
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  passwordInput: {
    flex: 1,
    marginRight: 10
  },
  showPasswordButton: {
    padding: 10
  },
  showPasswordText: {
    fontSize: 20
  },
  loginButton: {
    backgroundColor: '#D4AF37',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10
  },
  disabledButton: {
    opacity: 0.6
  },
  loginButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold'
  },
  demoSection: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333'
  },
  demoDescription: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 15,
    lineHeight: 20
  },
  demoAccountButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#444'
  },
  demoAccountInfo: {
    flex: 1
  },
  demoAccountRole: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 4
  },
  demoAccountUsername: {
    fontSize: 12,
    color: '#fff',
    marginBottom: 4
  },
  demoAccountDescription: {
    fontSize: 11,
    color: '#999'
  },
  demoAccountArrow: {
    fontSize: 18,
    color: '#D4AF37',
    fontWeight: 'bold'
  },
  securitySection: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333'
  },
  securityInfo: {
    marginTop: 10
  },
  securityText: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 5,
    lineHeight: 16
  }
}); 