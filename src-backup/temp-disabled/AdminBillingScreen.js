import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator
} from 'react-native';
import adminBillingService from '../services/AdminBillingService';
import adminAuthService from '../services/AdminAuthService';
import { SUBSCRIPTION_PLANS, SUBSCRIPTION_STATUS } from '../constants/subscriptions';

export default function AdminBillingScreen({ onBack }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [subscriptions, setSubscriptions] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [grantHistory, setGrantHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [grantForm, setGrantForm] = useState({
    userId: '',
    planId: 'premium_plan',
    duration: '30',
    reason: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const adminGranted = adminBillingService.getAdminGrantedSubscriptions();
      const stats = adminBillingService.getBillingStatistics();
      const history = adminBillingService.getGrantHistory();

      setSubscriptions(adminGranted);
      setStatistics(stats);
      setGrantHistory(history);
    } catch (error) {
      console.error('データ読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGrantPlan = async () => {
    if (!grantForm.userId.trim() || !grantForm.planId || !grantForm.duration) {
      Alert.alert('エラー', '全ての必須項目を入力してください');
      return;
    }

    const validation = adminBillingService.validateGrantRequest(
      grantForm.planId,
      grantForm.userId,
      parseInt(grantForm.duration)
    );

    if (!validation.isValid) {
      Alert.alert('エラー', validation.errors.join('\n'));
      return;
    }

    setLoading(true);
    try {
      const currentAdmin = adminAuthService.getCurrentAdmin();
      const result = await adminBillingService.grantPlanByAdmin(
        grantForm.planId,
        grantForm.userId,
        currentAdmin.id,
        parseInt(grantForm.duration),
        grantForm.reason
      );

      if (result.success) {
        Alert.alert('成功', 'プランを付与しました');
        setShowGrantModal(false);
        setGrantForm({
          userId: '',
          planId: 'premium_plan',
          duration: '30',
          reason: ''
        });
        loadData();
      } else {
        Alert.alert('エラー', result.error);
      }
    } catch (error) {
      Alert.alert('エラー', 'プラン付与中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokePlan = async () => {
    if (!selectedSubscription) return;

    Alert.alert(
      'プラン取り消し',
      `${selectedSubscription.userId}のプランを取り消しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '取り消し',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const currentAdmin = adminAuthService.getCurrentAdmin();
              const result = await adminBillingService.revokePlanByAdmin(
                selectedSubscription.userId,
                currentAdmin.id,
                '管理者による取り消し'
              );

              if (result.success) {
                Alert.alert('成功', 'プランを取り消しました');
                setShowActionModal(false);
                loadData();
              } else {
                Alert.alert('エラー', result.error);
              }
            } catch (error) {
              Alert.alert('エラー', 'プラン取り消し中にエラーが発生しました');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleExtendPlan = async () => {
    if (!selectedSubscription) return;

    Alert.prompt(
      'プラン延長',
      '延長する日数を入力してください',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '延長',
          onPress: async (days) => {
            const additionalDays = parseInt(days);
            if (isNaN(additionalDays) || additionalDays < 1) {
              Alert.alert('エラー', '有効な日数を入力してください');
              return;
            }

            setLoading(true);
            try {
              const currentAdmin = adminAuthService.getCurrentAdmin();
              const result = await adminBillingService.extendPlanByAdmin(
                selectedSubscription.userId,
                currentAdmin.id,
                additionalDays,
                '管理者による延長'
              );

              if (result.success) {
                Alert.alert('成功', `${additionalDays}日延長しました`);
                setShowActionModal(false);
                loadData();
              } else {
                Alert.alert('エラー', result.error);
              }
            } catch (error) {
              Alert.alert('エラー', 'プラン延長中にエラーが発生しました');
            } finally {
              setLoading(false);
            }
          }
        }
      ],
      'plain-text',
      '30'
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case SUBSCRIPTION_STATUS.ACTIVE:
        return '#4CAF50';
      case SUBSCRIPTION_STATUS.EXPIRED:
        return '#FF9800';
      case SUBSCRIPTION_STATUS.CANCELLED:
        return '#F44336';
      default:
        return '#999';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case SUBSCRIPTION_STATUS.ACTIVE:
        return 'アクティブ';
      case SUBSCRIPTION_STATUS.EXPIRED:
        return '期限切れ';
      case SUBSCRIPTION_STATUS.CANCELLED:
        return 'キャンセル';
      default:
        return '不明';
    }
  };

  const renderOverview = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>📊 課金統計</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{statistics.totalGranted || 0}</Text>
          <Text style={styles.statLabel}>総付与数</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{statistics.activeGrants || 0}</Text>
          <Text style={styles.statLabel}>アクティブ</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{statistics.expiredGrants || 0}</Text>
          <Text style={styles.statLabel}>期限切れ</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{statistics.cancelledGrants || 0}</Text>
          <Text style={styles.statLabel}>キャンセル</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>📈 プラン分布</Text>
      <View style={styles.planDistribution}>
        {Object.entries(statistics.planDistribution || {}).map(([planName, count]) => (
          <View key={planName} style={styles.planItem}>
            <Text style={styles.planName}>{planName}</Text>
            <Text style={styles.planCount}>{count}件</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.grantButton}
        onPress={() => setShowGrantModal(true)}
      >
        <Text style={styles.grantButtonText}>🎁 プランを付与</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSubscriptions = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>📋 付与プラン一覧</Text>
      
      {subscriptions.length === 0 ? (
        <Text style={styles.emptyText}>付与されたプランはありません</Text>
      ) : (
        subscriptions.map((subscription) => (
          <TouchableOpacity
            key={subscription.id}
            style={styles.subscriptionCard}
            onPress={() => {
              setSelectedSubscription(subscription);
              setShowActionModal(true);
            }}
          >
            <View style={styles.subscriptionHeader}>
              <Text style={styles.userId}>{subscription.userId}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(subscription.status) }]}>
                <Text style={styles.statusText}>{getStatusText(subscription.status)}</Text>
              </View>
            </View>
            
            <Text style={styles.planName}>{subscription.plan?.name || 'Unknown'}</Text>
            
            <View style={styles.subscriptionDetails}>
              <Text style={styles.detailText}>
                開始: {new Date(subscription.startDate).toLocaleDateString('ja-JP')}
              </Text>
              <Text style={styles.detailText}>
                終了: {new Date(subscription.endDate).toLocaleDateString('ja-JP')}
              </Text>
            </View>
            
            {subscription.reason && (
              <Text style={styles.reasonText}>理由: {subscription.reason}</Text>
            )}
            
            <Text style={styles.grantedByText}>
              付与者: {subscription.grantedBy} ({new Date(subscription.grantedAt).toLocaleDateString('ja-JP')})
            </Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  const renderHistory = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>📜 付与履歴</Text>
      
      {grantHistory.length === 0 ? (
        <Text style={styles.emptyText}>付与履歴はありません</Text>
      ) : (
        grantHistory.map((history) => (
          <View key={history.id} style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyUserId}>{history.userId}</Text>
              <Text style={styles.historyDate}>
                {new Date(history.grantedAt).toLocaleDateString('ja-JP')}
              </Text>
            </View>
            
            <Text style={styles.historyPlan}>{history.planName}</Text>
            <Text style={styles.historyDuration}>{history.duration}日間</Text>
            
            {history.reason && (
              <Text style={styles.historyReason}>理由: {history.reason}</Text>
            )}
            
            <Text style={styles.historyAdmin}>管理者: {history.adminId}</Text>
          </View>
        ))
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>課金管理</Text>
        <View style={styles.placeholder} />
      </View>

      {/* タブナビゲーション */}
      <View style={styles.tabNavigation}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            概要
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'subscriptions' && styles.activeTab]}
          onPress={() => setActiveTab('subscriptions')}
        >
          <Text style={[styles.tabText, activeTab === 'subscriptions' && styles.activeTabText]}>
            プラン一覧
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            履歴
          </Text>
        </TouchableOpacity>
      </View>

      {/* コンテンツ */}
      <ScrollView style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#D4AF37" style={styles.loading} />
        ) : (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'subscriptions' && renderSubscriptions()}
            {activeTab === 'history' && renderHistory()}
          </>
        )}
      </ScrollView>

      {/* プラン付与モーダル */}
      <Modal
        visible={showGrantModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🎁 プラン付与</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>ユーザーID *</Text>
              <TextInput
                style={styles.input}
                value={grantForm.userId}
                onChangeText={(text) => setGrantForm({...grantForm, userId: text})}
                placeholder="ユーザーIDを入力"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>プラン *</Text>
              <View style={styles.planSelector}>
                {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
                  <TouchableOpacity
                    key={plan.id}
                    style={[
                      styles.planOption,
                      grantForm.planId === plan.id && styles.selectedPlan
                    ]}
                    onPress={() => setGrantForm({...grantForm, planId: plan.id})}
                  >
                    <Text style={[
                      styles.planOptionText,
                      grantForm.planId === plan.id && styles.selectedPlanText
                    ]}>
                      {plan.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>期間（日数） *</Text>
              <TextInput
                style={styles.input}
                value={grantForm.duration}
                onChangeText={(text) => setGrantForm({...grantForm, duration: text})}
                placeholder="30"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>理由</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={grantForm.reason}
                onChangeText={(text) => setGrantForm({...grantForm, reason: text})}
                placeholder="付与理由を入力（任意）"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowGrantModal(false)}
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, loading && styles.disabledButton]}
                onPress={handleGrantPlan}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.confirmButtonText}>付与</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* アクション選択モーダル */}
      <Modal
        visible={showActionModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>アクション選択</Text>
            
            {selectedSubscription && (
              <View style={styles.selectedSubscriptionInfo}>
                <Text style={styles.selectedUserId}>{selectedSubscription.userId}</Text>
                <Text style={styles.selectedPlan}>{selectedSubscription.plan?.name}</Text>
                <Text style={styles.selectedStatus}>
                  状態: {getStatusText(selectedSubscription.status)}
                </Text>
              </View>
            )}

            <View style={styles.actionButtons}>
              {selectedSubscription?.status === SUBSCRIPTION_STATUS.ACTIVE && (
                <>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleExtendPlan}
                  >
                    <Text style={styles.actionButtonText}>⏰ 延長</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.dangerButton]}
                    onPress={handleRevokePlan}
                  >
                    <Text style={styles.actionButtonText}>❌ 取り消し</Text>
                  </TouchableOpacity>
                </>
              )}
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowActionModal(false)}
              >
                <Text style={styles.cancelButtonText}>閉じる</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  tab: {
    flex: 1,
    padding: 15,
    alignItems: 'center'
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#D4AF37'
  },
  tabText: {
    color: '#999',
    fontSize: 14
  },
  activeTabText: {
    color: '#D4AF37',
    fontWeight: 'bold'
  },
  content: {
    flex: 1,
    padding: 20
  },
  tabContent: {
    flex: 1
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 20
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30
  },
  statCard: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
    width: '48%',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333'
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 5
  },
  statLabel: {
    fontSize: 12,
    color: '#999'
  },
  planDistribution: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#333'
  },
  planItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  planName: {
    fontSize: 14,
    color: '#fff'
  },
  planCount: {
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: 'bold'
  },
  grantButton: {
    backgroundColor: '#D4AF37',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  grantButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold'
  },
  subscriptionCard: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333'
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  userId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff'
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold'
  },
  subscriptionDetails: {
    marginBottom: 10
  },
  detailText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2
  },
  reasonText: {
    fontSize: 12,
    color: '#D4AF37',
    marginBottom: 5
  },
  grantedByText: {
    fontSize: 11,
    color: '#666'
  },
  historyCard: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333'
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  historyUserId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff'
  },
  historyDate: {
    fontSize: 12,
    color: '#999'
  },
  historyPlan: {
    fontSize: 14,
    color: '#D4AF37',
    marginBottom: 5
  },
  historyDuration: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5
  },
  historyReason: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 5
  },
  historyAdmin: {
    fontSize: 11,
    color: '#666'
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginTop: 50
  },
  loading: {
    marginTop: 50
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 20,
    textAlign: 'center'
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
  textArea: {
    height: 80,
    textAlignVertical: 'top'
  },
  planSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  planOption: {
    backgroundColor: '#2a2a2a',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444'
  },
  selectedPlan: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37'
  },
  planOptionText: {
    color: '#fff',
    fontSize: 14
  },
  selectedPlanText: {
    color: '#000',
    fontWeight: 'bold'
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#444',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#D4AF37',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  confirmButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold'
  },
  disabledButton: {
    opacity: 0.6
  },
  selectedSubscriptionInfo: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20
  },
  selectedUserId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5
  },
  selectedPlan: {
    fontSize: 14,
    color: '#D4AF37',
    marginBottom: 5
  },
  selectedStatus: {
    fontSize: 12,
    color: '#999'
  },
  actionButtons: {
    gap: 15
  },
  actionButton: {
    backgroundColor: '#D4AF37',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  dangerButton: {
    backgroundColor: '#F44336'
  },
  actionButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold'
  }
}); 