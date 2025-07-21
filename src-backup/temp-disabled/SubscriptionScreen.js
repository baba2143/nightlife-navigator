import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import billingService from '../services/BillingService';
import { SUBSCRIPTION_PLANS, SUBSCRIPTION_STATUS } from '../constants/subscriptions';

export default function SubscriptionScreen({ navigation }) {
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    setLoading(true);
    try {
      await billingService.initialize();
      const subscription = billingService.getCurrentSubscription();
      setCurrentSubscription(subscription);
    } catch (error) {
      console.error('Failed to load subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
  };

  const handlePurchase = async () => {
    if (!selectedPlan) {
      Alert.alert('エラー', 'プランを選択してください');
      return;
    }

    setLoading(true);
    try {
      const result = await billingService.purchasePlan(selectedPlan.id);
      if (result) {
        setCurrentSubscription(result);
        Alert.alert(
          '購入完了',
          `${selectedPlan.name}の購入が完了しました！`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      }
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrial = async (plan) => {
    setLoading(true);
    try {
      const result = await billingService.startFreeTrial(plan.id);
      if (result) {
        setCurrentSubscription(result);
        Alert.alert(
          'トライアル開始',
          `${plan.name}の7日間無料トライアルを開始しました！`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      }
    } catch (error) {
      console.error('Trial start failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    Alert.alert(
      'サブスクリプションのキャンセル',
      '本当にサブスクリプションをキャンセルしますか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel'
        },
        {
          text: 'キャンセルする',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await billingService.cancelSubscription();
              if (result) {
                setCurrentSubscription(result);
              }
            } catch (error) {
              console.error('Cancel failed:', error);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const getCurrentPlanName = () => {
    if (!currentSubscription) return 'なし';
    const plan = Object.values(SUBSCRIPTION_PLANS).find(p => p.id === currentSubscription.planId);
    return plan ? plan.name : '不明';
  };

  const getCurrentPlanStatus = () => {
    if (!currentSubscription) return 'なし';
    
    switch (currentSubscription.status) {
      case SUBSCRIPTION_STATUS.ACTIVE:
        return 'アクティブ';
      case SUBSCRIPTION_STATUS.EXPIRED:
        return '期限切れ';
      case SUBSCRIPTION_STATUS.CANCELLED:
        return 'キャンセル済み';
      default:
        return '不明';
    }
  };

  const renderPlanCard = (plan, isSelected = false) => {
    const isCurrentPlan = currentSubscription?.planId === plan.id;
    const isCurrentPlanActive = isCurrentPlan && currentSubscription?.status === SUBSCRIPTION_STATUS.ACTIVE;

    return (
      <TouchableOpacity
        key={plan.id}
        style={[
          styles.planCard,
          isSelected && styles.selectedPlanCard,
          isCurrentPlanActive && styles.currentPlanCard
        ]}
        onPress={() => handlePlanSelect(plan)}
        disabled={isCurrentPlanActive}
      >
        {isCurrentPlanActive && (
          <View style={styles.currentPlanBadge}>
            <Text style={styles.currentPlanBadgeText}>現在のプラン</Text>
          </View>
        )}
        
        <View style={styles.planHeader}>
          <Text style={styles.planName}>{plan.name}</Text>
          <Text style={styles.planPrice}>¥{plan.price.toLocaleString()}/月</Text>
        </View>
        
        <Text style={styles.planDescription}>{plan.description}</Text>
        
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>含まれる機能:</Text>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {plan.limitations.length > 0 && (
          <View style={styles.limitationsContainer}>
            <Text style={styles.limitationsTitle}>制限事項:</Text>
            {plan.limitations.map((limitation, index) => (
              <View key={index} style={styles.limitationItem}>
                <Text style={styles.limitationIcon}>✗</Text>
                <Text style={styles.limitationText}>{limitation}</Text>
              </View>
            ))}
          </View>
        )}

        {isCurrentPlanActive ? (
          <View style={styles.currentPlanActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelSubscription}
            >
              <Text style={styles.cancelButtonText}>キャンセル</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.planActions}>
            {plan.id !== 'basic_plan' && (
              <TouchableOpacity
                style={styles.trialButton}
                onPress={() => handleStartTrial(plan)}
              >
                <Text style={styles.trialButtonText}>7日間無料トライアル</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.purchaseButton,
                isSelected && styles.selectedPurchaseButton
              ]}
              onPress={() => handlePlanSelect(plan)}
            >
              <Text style={styles.purchaseButtonText}>
                {isSelected ? '選択中' : '選択する'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>プラン選択</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* 現在のプラン情報 */}
        <View style={styles.currentPlanSection}>
          <Text style={styles.sectionTitle}>現在のプラン</Text>
          <View style={styles.currentPlanInfo}>
            <Text style={styles.currentPlanLabel}>プラン:</Text>
            <Text style={styles.currentPlanValue}>{getCurrentPlanName()}</Text>
          </View>
          <View style={styles.currentPlanInfo}>
            <Text style={styles.currentPlanLabel}>状態:</Text>
            <Text style={styles.currentPlanValue}>{getCurrentPlanStatus()}</Text>
          </View>
          {currentSubscription?.endDate && (
            <View style={styles.currentPlanInfo}>
              <Text style={styles.currentPlanLabel}>期限:</Text>
              <Text style={styles.currentPlanValue}>
                {new Date(currentSubscription.endDate).toLocaleDateString('ja-JP')}
              </Text>
            </View>
          )}
        </View>

        {/* プラン選択 */}
        <View style={styles.plansSection}>
          <Text style={styles.sectionTitle}>利用可能なプラン</Text>
          {Object.values(SUBSCRIPTION_PLANS).map(plan => 
            renderPlanCard(plan, selectedPlan?.id === plan.id)
          )}
        </View>

        {/* 購入ボタン */}
        {selectedPlan && selectedPlan.id !== currentSubscription?.planId && (
          <View style={styles.purchaseSection}>
            <TouchableOpacity
              style={styles.purchaseConfirmButton}
              onPress={handlePurchase}
            >
              <Text style={styles.purchaseConfirmButtonText}>
                {selectedPlan.name}を購入する
              </Text>
            </TouchableOpacity>
            <Text style={styles.purchaseNote}>
              ※ 購入後は自動更新されます。いつでもキャンセル可能です。
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a'
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16
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
  currentPlanSection: {
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
    marginBottom: 15
  },
  currentPlanInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  currentPlanLabel: {
    color: '#999',
    fontSize: 16
  },
  currentPlanValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  plansSection: {
    marginBottom: 20
  },
  planCard: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
    position: 'relative'
  },
  selectedPlanCard: {
    borderColor: '#D4AF37',
    borderWidth: 2
  },
  currentPlanCard: {
    borderColor: '#4CAF50',
    borderWidth: 2
  },
  currentPlanBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  currentPlanBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff'
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D4AF37'
  },
  planDescription: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 15
  },
  featuresContainer: {
    marginBottom: 15
  },
  featuresTitle: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5
  },
  featureIcon: {
    color: '#4CAF50',
    fontSize: 16,
    marginRight: 8
  },
  featureText: {
    color: '#fff',
    fontSize: 14
  },
  limitationsContainer: {
    marginBottom: 15
  },
  limitationsTitle: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10
  },
  limitationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5
  },
  limitationIcon: {
    color: '#FF6B6B',
    fontSize: 16,
    marginRight: 8
  },
  limitationText: {
    color: '#999',
    fontSize: 14
  },
  planActions: {
    flexDirection: 'row',
    gap: 10
  },
  trialButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  trialButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  purchaseButton: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444'
  },
  selectedPurchaseButton: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37'
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  currentPlanActions: {
    alignItems: 'center'
  },
  cancelButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  purchaseSection: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333'
  },
  purchaseConfirmButton: {
    backgroundColor: '#D4AF37',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10
  },
  purchaseConfirmButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold'
  },
  purchaseNote: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center'
  }
}); 