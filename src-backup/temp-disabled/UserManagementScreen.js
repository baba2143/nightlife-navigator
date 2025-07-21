import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput
} from 'react-native';
import { USER_STATUS } from '../constants/admin';

export default function UserManagementScreen({ onBack }) {
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // デモ用ユーザーデータ
  const [users] = useState([
    {
      id: '1',
      name: '田中太郎',
      email: 'tanaka@example.com',
      status: USER_STATUS.ACTIVE,
      joinDate: '2024-01-15',
      lastLogin: '2024-03-20',
      reviewCount: 12,
      favoriteCount: 8
    },
    {
      id: '2',
      name: '佐藤花子',
      email: 'sato@example.com',
      status: USER_STATUS.ACTIVE,
      joinDate: '2024-02-01',
      lastLogin: '2024-03-19',
      reviewCount: 5,
      favoriteCount: 15
    },
    {
      id: '3',
      name: '山田次郎',
      email: 'yamada@example.com',
      status: USER_STATUS.SUSPENDED,
      joinDate: '2024-01-20',
      lastLogin: '2024-03-10',
      reviewCount: 3,
      favoriteCount: 2,
      suspensionReason: '不適切なレビュー投稿'
    },
    {
      id: '4',
      name: '鈴木美咲',
      email: 'suzuki@example.com',
      status: USER_STATUS.BANNED,
      joinDate: '2024-01-10',
      lastLogin: '2024-03-05',
      reviewCount: 8,
      favoriteCount: 5,
      banReason: 'スパム行為'
    }
  ]);

  const activeUsers = users.filter(user => user.status === USER_STATUS.ACTIVE);
  const suspendedUsers = users.filter(user => user.status === USER_STATUS.SUSPENDED);
  const bannedUsers = users.filter(user => user.status === USER_STATUS.BANNED);

  const getFilteredUsers = () => {
    let filtered = [];
    switch (selectedStatus) {
      case 'active':
        filtered = activeUsers;
        break;
      case 'suspended':
        filtered = suspendedUsers;
        break;
      case 'banned':
        filtered = bannedUsers;
        break;
      default:
        filtered = users;
    }

    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const handleSuspendUser = (user) => {
    Alert.prompt(
      'ユーザー停止',
      `${user.name}を停止します。理由を入力してください：`,
      [
        {
          text: 'キャンセル',
          style: 'cancel'
        },
        {
          text: '停止',
          style: 'destructive',
          onPress: (reason) => {
            // 実際のアプリではユーザー状態を更新
            Alert.alert('停止完了', `${user.name}を停止しました`);
          }
        }
      ],
      'plain-text'
    );
  };

  const handleUnsuspendUser = (user) => {
    Alert.alert(
      'ユーザー復活',
      `${user.name}の停止を解除しますか？`,
      [
        {
          text: 'キャンセル',
          style: 'cancel'
        },
        {
          text: '復活',
          onPress: () => {
            Alert.alert('復活完了', `${user.name}の停止を解除しました`);
          }
        }
      ]
    );
  };

  const handleBanUser = (user) => {
    Alert.prompt(
      'ユーザーBAN',
      `${user.name}をBANします。理由を入力してください：`,
      [
        {
          text: 'キャンセル',
          style: 'cancel'
        },
        {
          text: 'BAN',
          style: 'destructive',
          onPress: (reason) => {
            Alert.alert('BAN完了', `${user.name}をBANしました`);
          }
        }
      ],
      'plain-text'
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case USER_STATUS.ACTIVE:
        return '#4CAF50';
      case USER_STATUS.SUSPENDED:
        return '#FF9800';
      case USER_STATUS.BANNED:
        return '#FF6B6B';
      default:
        return '#999';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case USER_STATUS.ACTIVE:
        return 'アクティブ';
      case USER_STATUS.SUSPENDED:
        return '停止中';
      case USER_STATUS.BANNED:
        return 'BAN';
      default:
        return '不明';
    }
  };

  const renderUserCard = (user) => (
    <View key={user.id} style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(user.status) }
        ]}>
          <Text style={styles.statusText}>{getStatusText(user.status)}</Text>
        </View>
      </View>
      
      <View style={styles.userStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>レビュー数</Text>
          <Text style={styles.statValue}>{user.reviewCount}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>お気に入り数</Text>
          <Text style={styles.statValue}>{user.favoriteCount}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>最終ログイン</Text>
          <Text style={styles.statValue}>{new Date(user.lastLogin).toLocaleDateString('ja-JP')}</Text>
        </View>
      </View>

      {(user.suspensionReason || user.banReason) && (
        <View style={styles.reasonContainer}>
          <Text style={styles.reasonLabel}>
            {user.suspensionReason ? '停止理由:' : 'BAN理由:'}
          </Text>
          <Text style={styles.reasonText}>
            {user.suspensionReason || user.banReason}
          </Text>
        </View>
      )}

      <View style={styles.userActions}>
        <Text style={styles.joinDate}>
          登録日: {new Date(user.joinDate).toLocaleDateString('ja-JP')}
        </Text>
        
        <View style={styles.actionButtons}>
          {user.status === USER_STATUS.ACTIVE && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.suspendButton]}
                onPress={() => handleSuspendUser(user)}
              >
                <Text style={styles.actionButtonText}>停止</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.banButton]}
                onPress={() => handleBanUser(user)}
              >
                <Text style={styles.actionButtonText}>BAN</Text>
              </TouchableOpacity>
            </>
          )}
          
          {user.status === USER_STATUS.SUSPENDED && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.unsuspendButton]}
                onPress={() => handleUnsuspendUser(user)}
              >
                <Text style={styles.actionButtonText}>復活</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.banButton]}
                onPress={() => handleBanUser(user)}
              >
                <Text style={styles.actionButtonText}>BAN</Text>
              </TouchableOpacity>
            </>
          )}
          
          {user.status === USER_STATUS.BANNED && (
            <TouchableOpacity
              style={[styles.actionButton, styles.unsuspendButton]}
              onPress={() => handleUnsuspendUser(user)}
            >
              <Text style={styles.actionButtonText}>BAN解除</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ユーザー管理</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* 統計サマリー */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{activeUsers.length}</Text>
            <Text style={styles.statLabel}>アクティブ</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{suspendedUsers.length}</Text>
            <Text style={styles.statLabel}>停止中</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{bannedUsers.length}</Text>
            <Text style={styles.statLabel}>BAN</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{users.length}</Text>
            <Text style={styles.statLabel}>総数</Text>
          </View>
        </View>

        {/* フィルター */}
        <View style={styles.filterSection}>
          <View style={styles.statusFilter}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedStatus === 'all' && styles.activeFilterButton
              ]}
              onPress={() => setSelectedStatus('all')}
            >
              <Text style={[
                styles.filterButtonText,
                selectedStatus === 'all' && styles.activeFilterButtonText
              ]}>すべて</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedStatus === 'active' && styles.activeFilterButton
              ]}
              onPress={() => setSelectedStatus('active')}
            >
              <Text style={[
                styles.filterButtonText,
                selectedStatus === 'active' && styles.activeFilterButtonText
              ]}>アクティブ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedStatus === 'suspended' && styles.activeFilterButton
              ]}
              onPress={() => setSelectedStatus('suspended')}
            >
              <Text style={[
                styles.filterButtonText,
                selectedStatus === 'suspended' && styles.activeFilterButtonText
              ]}>停止中</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedStatus === 'banned' && styles.activeFilterButton
              ]}
              onPress={() => setSelectedStatus('banned')}
            >
              <Text style={[
                styles.filterButtonText,
                selectedStatus === 'banned' && styles.activeFilterButtonText
              ]}>BAN</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="ユーザー名・メールで検索..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* ユーザー一覧 */}
        <ScrollView style={styles.usersList}>
          {getFilteredUsers().map(renderUserCard)}
          
          {getFilteredUsers().length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>
                {selectedStatus === 'all' ? 'ユーザーがありません' :
                 selectedStatus === 'active' ? 'アクティブユーザーがありません' :
                 selectedStatus === 'suspended' ? '停止中のユーザーがありません' :
                 'BANされたユーザーがありません'}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
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
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333'
  },
  statItem: {
    alignItems: 'center'
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D4AF37'
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 5
  },
  filterSection: {
    marginBottom: 20
  },
  statusFilter: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 5,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333'
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  activeFilterButton: {
    backgroundColor: '#D4AF37'
  },
  filterButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600'
  },
  activeFilterButtonText: {
    color: '#000'
  },
  searchInput: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 12,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333'
  },
  usersList: {
    flex: 1
  },
  userCard: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333'
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15
  },
  userInfo: {
    flex: 1
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5
  },
  userEmail: {
    fontSize: 12,
    color: '#999'
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff'
  },
  userStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15
  },
  statItem: {
    alignItems: 'center'
  },
  statLabel: {
    fontSize: 10,
    color: '#999',
    marginBottom: 2
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff'
  },
  reasonContainer: {
    backgroundColor: '#2a2a2a',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15
  },
  reasonLabel: {
    fontSize: 12,
    color: '#FF6B6B',
    fontWeight: '600',
    marginBottom: 5
  },
  reasonText: {
    fontSize: 12,
    color: '#ccc'
  },
  userActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  joinDate: {
    fontSize: 12,
    color: '#777'
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center'
  },
  suspendButton: {
    backgroundColor: '#FF9800'
  },
  unsuspendButton: {
    backgroundColor: '#4CAF50'
  },
  banButton: {
    backgroundColor: '#FF6B6B'
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  emptyState: {
    alignItems: 'center',
    padding: 40
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 10
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center'
  }
}); 