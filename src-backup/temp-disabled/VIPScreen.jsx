import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Image,
  Dimensions,
  Alert,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../components/common/ThemeProvider';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

import { VIPBenefitsService } from '../services/VIPBenefitsService';

const { width } = Dimensions.get('window');

const VIPScreen = ({ navigation }) => {
  const { colors, spacing, typography, borderRadius } = useTheme();
  
  // State
  const [vipStatus, setVipStatus] = useState(null);
  const [availableBenefits, setAvailableBenefits] = useState([]);
  const [redeemHistory, setRedeemHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState(null);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Services
  const [vipService, setVipService] = useState(null);

  // Initialize service
  useEffect(() => {
    const initService = async () => {
      try {
        const service = await VIPBenefitsService.getInstance();
        setVipService(service);
      } catch (error) {
        console.error('Failed to initialize VIP service:', error);
      }
    };

    initService();
  }, []);

  // Load VIP data
  const loadVIPData = useCallback(async () => {
    if (!vipService) return;

    try {
      setLoading(true);

      const userId = 'user_123'; // Mock user ID

      // Load VIP status
      const status = await vipService.getUserVIPStatus(userId);
      setVipStatus(status);

      // Load available benefits
      const benefits = await vipService.getAvailableBenefits(userId);
      setAvailableBenefits(benefits);

      // Load redeem history
      const history = await vipService.getRedeemHistory(userId, { limit: 10 });
      setRedeemHistory(history);

    } catch (error) {
      console.error('Failed to load VIP data:', error);
    } finally {
      setLoading(false);
    }
  }, [vipService]);

  useFocusEffect(
    useCallback(() => {
      loadVIPData();
    }, [loadVIPData])
  );

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadVIPData();
    setRefreshing(false);
  }, [loadVIPData]);

  // Handle benefit redemption
  const handleRedeemBenefit = async () => {
    if (!selectedBenefit || !vipService || !vipStatus) return;

    try {
      const userId = 'user_123';
      
      // Check if user has enough points
      if (vipStatus.member.pointsBalance < selectedBenefit.pointsCost) {
        Alert.alert('Insufficient Points', 'You don\'t have enough points to redeem this benefit.');
        return;
      }

      await vipService.redeemBenefit(userId, selectedBenefit.id);

      // Update local state
      setVipStatus(prev => ({
        ...prev,
        member: {
          ...prev.member,
          pointsBalance: prev.member.pointsBalance - selectedBenefit.pointsCost
        }
      }));

      // Add to redeem history
      setRedeemHistory(prev => [{
        id: Date.now().toString(),
        benefit: selectedBenefit,
        redeemedAt: new Date().toISOString(),
        status: 'redeemed'
      }, ...prev]);

      setShowRedeemModal(false);
      setSelectedBenefit(null);

      Alert.alert('Success', 'Benefit redeemed successfully!');

    } catch (error) {
      console.error('Failed to redeem benefit:', error);
      Alert.alert('Error', 'Failed to redeem benefit. Please try again.');
    }
  };

  // Handle tier upgrade
  const handleUpgrade = () => {
    setShowUpgradeModal(true);
  };

  // Get tier colors
  const getTierColor = (tierName) => {
    const tierColors = {
      bronze: '#CD7F32',
      silver: '#C0C0C0',
      gold: '#FFD700',
      platinum: '#E5E4E2',
      diamond: '#B9F2FF',
    };
    return tierColors[tierName?.toLowerCase()] || colors.primary;
  };

  // Get tier gradient
  const getTierGradient = (tierName) => {
    const tierGradients = {
      bronze: ['#CD7F32', '#B87333'],
      silver: ['#C0C0C0', '#A8A8A8'],
      gold: ['#FFD700', '#FFA500'],
      platinum: ['#E5E4E2', '#D3D3D3'],
      diamond: ['#B9F2FF', '#87CEEB'],
    };
    return tierGradients[tierName?.toLowerCase()] || [colors.primary, colors.secondary];
  };

  // Render VIP status card
  const renderVIPStatusCard = () => {
    if (!vipStatus) return null;

    const tier = vipStatus.tier;
    const member = vipStatus.member;
    const tierColor = getTierColor(tier.name);
    const gradient = getTierGradient(tier.name);

    return (
      <Card style={styles.statusCard}>
        <LinearGradient
          colors={gradient}
          style={styles.statusGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.statusHeader}>
            <View style={styles.tierInfo}>
              <Ionicons name="star" size={24} color="#FFFFFF" />
              <Text style={[styles.tierName, { color: '#FFFFFF' }]}>
                {tier.name} Member
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={handleUpgrade}
            >
              <Ionicons name="arrow-up" size={16} color="#FFFFFF" />
              <Text style={[styles.upgradeText, { color: '#FFFFFF' }]}>
                Upgrade
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.pointsSection}>
            <Text style={[styles.pointsLabel, { color: 'rgba(255,255,255,0.8)' }]}>
              Available Points
            </Text>
            <Text style={[styles.pointsValue, { color: '#FFFFFF' }]}>
              {member.pointsBalance.toLocaleString()}
            </Text>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressInfo}>
              <Text style={[styles.progressLabel, { color: 'rgba(255,255,255,0.8)' }]}>
                Progress to {tier.nextTier || 'Max Tier'}
              </Text>
              <Text style={[styles.progressText, { color: '#FFFFFF' }]}>
                {member.currentPeriodSpending} / {tier.requiredSpending}
              </Text>
            </View>
            
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${Math.min((member.currentPeriodSpending / tier.requiredSpending) * 100, 100)}%`,
                    backgroundColor: '#FFFFFF'
                  }
                ]}
              />
            </View>
          </View>
        </LinearGradient>
      </Card>
    );
  };

  // Render benefits section
  const renderBenefitsSection = () => (
    <Card style={styles.benefitsCard}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Available Benefits
      </Text>
      
      <FlatList
        data={availableBenefits}
        renderItem={({ item: benefit }) => (
          <TouchableOpacity
            style={[styles.benefitItem, { borderBottomColor: colors.border }]}
            onPress={() => {
              setSelectedBenefit(benefit);
              setShowRedeemModal(true);
            }}
          >
            <View style={styles.benefitIcon}>
              <Ionicons 
                name={benefit.icon || 'gift'} 
                size={24} 
                color={colors.primary} 
              />
            </View>
            
            <View style={styles.benefitInfo}>
              <Text style={[styles.benefitTitle, { color: colors.text }]}>
                {benefit.title}
              </Text>
              <Text style={[styles.benefitDescription, { color: colors.textSecondary }]}>
                {benefit.description}
              </Text>
              <View style={styles.benefitDetails}>
                <Text style={[styles.benefitPoints, { color: colors.primary }]}>
                  {benefit.pointsCost} points
                </Text>
                {benefit.expiresAt && (
                  <Text style={[styles.benefitExpiry, { color: colors.warning }]}>
                    Expires {new Date(benefit.expiresAt).toLocaleDateString()}
                  </Text>
                )}
              </View>
            </View>
            
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyBenefits}>
            <Ionicons name="gift-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No benefits available
            </Text>
          </View>
        )}
      />
    </Card>
  );

  // Render perks section
  const renderPerksSection = () => {
    if (!vipStatus?.tier?.perks || vipStatus.tier.perks.length === 0) return null;

    return (
      <Card style={styles.perksCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Your Tier Perks
        </Text>
        
        <View style={styles.perksList}>
          {vipStatus.tier.perks.map((perk, index) => (
            <View key={index} style={styles.perkItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={[styles.perkText, { color: colors.text }]}>
                {perk}
              </Text>
            </View>
          ))}
        </View>
      </Card>
    );
  };

  // Render history section
  const renderHistorySection = () => (
    <Card style={styles.historyCard}>
      <View style={styles.historyHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Recent Activity
        </Text>
        <TouchableOpacity
          onPress={() => {
            // Navigate to full history
            Alert.alert('History', 'Full history coming soon!');
          }}
        >
          <Text style={[styles.viewAllText, { color: colors.primary }]}>
            View All
          </Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={redeemHistory.slice(0, 5)}
        renderItem={({ item: redemption }) => (
          <View style={[styles.historyItem, { borderBottomColor: colors.border }]}>
            <View style={styles.historyIcon}>
              <Ionicons 
                name={redemption.benefit.icon || 'gift'} 
                size={20} 
                color={colors.textSecondary} 
              />
            </View>
            
            <View style={styles.historyInfo}>
              <Text style={[styles.historyTitle, { color: colors.text }]}>
                {redemption.benefit.title}
              </Text>
              <Text style={[styles.historyDate, { color: colors.textSecondary }]}>
                {new Date(redemption.redeemedAt).toLocaleDateString()}
              </Text>
            </View>
            
            <Text style={[styles.historyPoints, { color: colors.error }]}>
              -{redemption.benefit.pointsCost}
            </Text>
          </View>
        )}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyHistory}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No recent activity
            </Text>
          </View>
        )}
      />
    </Card>
  );

  // Render redeem modal
  const renderRedeemModal = () => (
    <Modal
      visible={showRedeemModal}
      transparent
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.redeemModal, { backgroundColor: colors.card }]}>
          {selectedBenefit && (
            <>
              <View style={styles.modalIcon}>
                <Ionicons 
                  name={selectedBenefit.icon || 'gift'} 
                  size={48} 
                  color={colors.primary} 
                />
              </View>
              
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {selectedBenefit.title}
              </Text>
              
              <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                {selectedBenefit.description}
              </Text>
              
              <View style={styles.modalPoints}>
                <Text style={[styles.modalPointsText, { color: colors.primary }]}>
                  {selectedBenefit.pointsCost} points required
                </Text>
                <Text style={[styles.modalBalance, { color: colors.textSecondary }]}>
                  You have {vipStatus?.member?.pointsBalance || 0} points
                </Text>
              </View>
              
              <View style={styles.modalActions}>
                <Button
                  title="Cancel"
                  variant="outline"
                  style={styles.modalButton}
                  onPress={() => {
                    setShowRedeemModal(false);
                    setSelectedBenefit(null);
                  }}
                />
                <Button
                  title="Redeem"
                  style={styles.modalButton}
                  onPress={handleRedeemBenefit}
                  disabled={!vipStatus || vipStatus.member.pointsBalance < selectedBenefit.pointsCost}
                />
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  // Render upgrade modal
  const renderUpgradeModal = () => (
    <Modal
      visible={showUpgradeModal}
      transparent
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.upgradeModalContent, { backgroundColor: colors.card }]}>
          <Text style={[styles.upgradeModalTitle, { color: colors.text }]}>
            Upgrade Your Tier
          </Text>
          
          <Text style={[styles.upgradeModalDescription, { color: colors.textSecondary }]}>
            Spend more to unlock better benefits and exclusive perks!
          </Text>
          
          <View style={styles.tierList}>
            {['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'].map((tier, index) => (
              <View key={tier} style={styles.tierOptionItem}>
                <View style={[styles.tierIndicator, { backgroundColor: getTierColor(tier) }]} />
                <Text style={[styles.tierOptionName, { color: colors.text }]}>
                  {tier}
                </Text>
                {vipStatus?.tier?.name.toLowerCase() === tier.toLowerCase() && (
                  <Text style={[styles.currentTierLabel, { color: colors.primary }]}>
                    Current
                  </Text>
                )}
              </View>
            ))}
          </View>
          
          <Button
            title="Close"
            variant="outline"
            onPress={() => setShowUpgradeModal(false)}
            style={styles.upgradeCloseButton}
          />
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading VIP status...
        </Text>
      </View>
    );
  }

  if (!vipStatus) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons name="star-outline" size={64} color={colors.textSecondary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          Join VIP Program
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Start earning points and unlock exclusive benefits
        </Text>
        <Button
          title="Learn More"
          style={styles.joinButton}
          onPress={() => {
            Alert.alert('VIP Program', 'VIP program signup coming soon!');
          }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderVIPStatusCard()}
        {renderPerksSection()}
        {renderBenefitsSection()}
        {renderHistorySection()}
        
        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {renderRedeemModal()}
      {renderUpgradeModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  scrollView: {
    flex: 1,
  },
  statusCard: {
    margin: 16,
    padding: 0,
    overflow: 'hidden',
  },
  statusGradient: {
    padding: 20,
    borderRadius: 12,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  tierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tierName: {
    fontSize: 20,
    fontWeight: '700',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  upgradeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pointsSection: {
    marginBottom: 20,
  },
  pointsLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  progressSection: {
    gap: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 14,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  benefitsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  perksCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  historyCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitInfo: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  benefitDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  benefitPoints: {
    fontSize: 14,
    fontWeight: '600',
  },
  benefitExpiry: {
    fontSize: 12,
  },
  perksList: {
    gap: 12,
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  perkText: {
    fontSize: 14,
    flex: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  historyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 12,
  },
  historyPoints: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyBenefits: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  joinButton: {
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  redeemModal: {
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalPoints: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalPointsText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  modalBalance: {
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
  },
  upgradeModalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    maxHeight: '80%',
    width: '100%',
    position: 'absolute',
    bottom: 0,
  },
  upgradeModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  upgradeModalDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  tierList: {
    gap: 16,
    marginBottom: 24,
  },
  tierOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tierIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  tierOptionName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  currentTierLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  upgradeCloseButton: {
    width: '100%',
  },
  bottomSpacing: {
    height: 32,
  },
});

export default VIPScreen;