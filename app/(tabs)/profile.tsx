import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Modal, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import NotificationCenter from '../../components/NotificationCenter';
import LoginScreen from '../../components/LoginScreen';
import RegisterScreen from '../../components/RegisterScreen';
import AuthService from '../../services/AuthService';

export default function ProfileScreen() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      await AuthService.initialize();
      const user = AuthService.getCurrentUser();
      setCurrentUser(user);
      
      // 認証状態の変更をリッスン
      AuthService.addEventListener('authStateChanged', handleAuthStateChanged);
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthStateChanged = ({ user, isAuthenticated }) => {
    setCurrentUser(user);
    if (isAuthenticated) {
      setShowAuth(false);
    }
  };

  const handleNotificationPress = () => {
    setShowNotifications(true);
  };

  const handleLoginPress = () => {
    setAuthMode('login');
    setShowAuth(true);
  };

  const handleRegisterPress = () => {
    setAuthMode('register');
    setShowAuth(true);
  };

  const handleLogout = () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: 'ログアウト',
          style: 'destructive',
          onPress: async () => {
            const result = await AuthService.logout();
            if (result.success) {
              setCurrentUser(null);
            }
          }
        },
      ]
    );
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setShowAuth(false);
  };

  const handleSwitchAuthMode = () => {
    setAuthMode(authMode === 'login' ? 'register' : 'login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>👤 プロフィール</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {currentUser ? (currentUser.displayName.charAt(0).toUpperCase()) : '👤'}
            </Text>
          </View>
          <Text style={styles.userName}>
            {currentUser ? currentUser.displayName : 'ゲストユーザー'}
          </Text>
          <Text style={styles.userEmail}>
            {currentUser ? currentUser.email : 'ログインしてプロフィールを設定'}
          </Text>
        </View>
        
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="person-outline" size={20} color="#666" />
            <Text style={styles.menuText}>プロフィール編集</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleNotificationPress}>
            <Ionicons name="notifications-outline" size={20} color="#666" />
            <Text style={styles.menuText}>通知設定</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="shield-outline" size={20} color="#666" />
            <Text style={styles.menuText}>プライバシー設定</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="help-circle-outline" size={20} color="#666" />
            <Text style={styles.menuText}>ヘルプ・サポート</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="information-circle-outline" size={20} color="#666" />
            <Text style={styles.menuText}>アプリについて</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>
        
        {!currentUser ? (
          <View style={styles.loginSection}>
            <TouchableOpacity style={styles.loginButton} onPress={handleLoginPress}>
              <Text style={styles.loginButtonText}>ログイン</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.signupButton} onPress={handleRegisterPress}>
              <Text style={styles.signupButtonText}>新規登録</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.loginSection}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>ログアウト</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      
      {/* 通知センターモーダル */}
      <Modal
        visible={showNotifications}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNotifications(false)}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowNotifications(false)}>
              <Ionicons name="close" size={24} color="#ea5a7b" />
            </TouchableOpacity>
          </View>
          <NotificationCenter />
        </SafeAreaView>
      </Modal>

      {/* 認証モーダル */}
      <Modal
        visible={showAuth}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAuth(false)}
      >
        {authMode === 'login' ? (
          <LoginScreen
            onSuccess={handleAuthSuccess}
            onSwitchToRegister={handleSwitchAuthMode}
            onClose={() => setShowAuth(false)}
          />
        ) : (
          <RegisterScreen
            onSuccess={handleAuthSuccess}
            onSwitchToLogin={handleSwitchAuthMode}
            onClose={() => setShowAuth(false)}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    padding: 20,
    backgroundColor: "#fef7f7",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ea5a7b",
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: "center",
    padding: 30,
    backgroundColor: "#fef7f7",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#ea5a7b",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    color: "#fff",
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
  },
  menuSection: {
    padding: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    marginLeft: 12,
  },
  loginSection: {
    padding: 16,
    paddingBottom: 30,
  },
  loginButton: {
    backgroundColor: "#ea5a7b",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  signupButton: {
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ea5a7b",
  },
  signupButtonText: {
    color: "#ea5a7b",
    fontSize: 16,
    fontWeight: "600",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  logoutButton: {
    backgroundColor: "#f44336",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});