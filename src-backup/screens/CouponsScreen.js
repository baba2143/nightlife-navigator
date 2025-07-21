import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import CouponCard from '../components/CouponCard';
import CouponDetailModal from '../components/CouponDetailModal';
import { COUPONS, COUPON_TYPES, COUPON_ICONS, BARS, USER_COUPONS } from '../constants/data';

export default function CouponsScreen({ onBack, onUseCoupon }) {
  const [selectedType, setSelectedType] = useState('');
  const [filteredCoupons, setFilteredCoupons] = useState(COUPONS);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [userCoupons, setUserCoupons] = useState(USER_COUPONS);

  useEffect(() => {
    applyFilters();
  }, [selectedType]);

  const applyFilters = () => {
    let filtered = COUPONS;

    if (selectedType) {
      filtered = filtered.filter(coupon => coupon.type === selectedType);
    }

    setFilteredCoupons(filtered);
  };

  const clearFilters = () => {
    setSelectedType('');
  };

  const handleCouponPress = (coupon) => {
    setSelectedCoupon(coupon);
    setShowDetailModal(true);
  };

  const handleUseCoupon = async (coupon) => {
    try {
      // ユーザーのクーポン利用履歴に追加
      const newUserCoupon = {
        id: `user_coupon_${Date.now()}`,
        couponId: coupon.id,
        userId: 'user1',
        barId: coupon.barId,
        usedAt: new Date().toISOString(),
        isUsed: true
      };

      setUserCoupons([...userCoupons, newUserCoupon]);

      // クーポンの利用回数を更新
      const updatedCoupons = COUPONS.map(c => 
        c.id === coupon.id ? { ...c, usedCount: c.usedCount + 1 } : c
      );

      if (onUseCoupon) {
        await onUseCoupon(coupon);
      }

      setShowDetailModal(false);
    } catch (error) {
      Alert.alert('エラー', 'クーポンの利用に失敗しました');
    }
  };

  const isCouponUsed = (couponId) => {
    return userCoupons.some(uc => uc.couponId === couponId && uc.isUsed);
  };

  const isCouponExpired = (coupon) => {
    const now = new Date();
    const validTo = new Date(coupon.validTo);
    return now > validTo;
  };

  const getBarInfo = (barId) => {
    return BARS.find(bar => bar.id === barId);
  };

  const getCouponTypeName = (type) => {
    const typeNames = {
      [COUPON_TYPES.STORE_COUPON]: '店舗クーポン',
      [COUPON_TYPES.RAINY_DAY]: '雨の日クーポン',
      [COUPON_TYPES.TIME_SALE]: 'タイムセール',
      [COUPON_TYPES.FIRST_TIME]: '初回割引',
      [COUPON_TYPES.BIRTHDAY]: '誕生日特典',
      [COUPON_TYPES.REPEATER]: 'リピーター特典'
    };
    return typeNames[type] || type;
  };

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>クーポン・特典</Text>
        <View style={styles.headerRight} />
      </View>

      {/* フィルター */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedType === '' && styles.filterChipActive
            ]}
            onPress={() => setSelectedType('')}
          >
            <Text style={[
              styles.filterChipText,
              selectedType === '' && styles.filterChipTextActive
            ]}>
              すべて
            </Text>
          </TouchableOpacity>
          
          {Object.values(COUPON_TYPES).map(type => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterChip,
                selectedType === type && styles.filterChipActive
              ]}
              onPress={() => setSelectedType(type)}
            >
              <Text style={[
                styles.filterChipText,
                selectedType === type && styles.filterChipTextActive
              ]}>
                {COUPON_ICONS[type]} {getCouponTypeName(type)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {selectedType && (
          <TouchableOpacity onPress={clearFilters} style={styles.clearFiltersButton}>
            <Text style={styles.clearFiltersText}>フィルターをクリア</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* クーポン一覧 */}
      <ScrollView style={styles.content}>
        {filteredCoupons.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🎫</Text>
            <Text style={styles.emptyStateTitle}>クーポンが見つかりません</Text>
            <Text style={styles.emptyStateText}>
              選択した条件に該当するクーポンがありません
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultsText}>
              {filteredCoupons.length}件のクーポンが見つかりました
            </Text>
            
            {filteredCoupons.map(coupon => {
              const bar = getBarInfo(coupon.barId);
              const isUsed = isCouponUsed(coupon.id);
              const isExpired = isCouponExpired(coupon);

              return (
                <View key={coupon.id} style={styles.couponContainer}>
                  {bar && (
                    <View style={styles.barInfo}>
                      <Text style={styles.barName}>{bar.name}</Text>
                      <Text style={styles.barGenre}>{bar.genre}</Text>
                    </View>
                  )}
                  
                  <CouponCard
                    coupon={coupon}
                    onPress={() => handleCouponPress(coupon)}
                    isUsed={isUsed}
                    isExpired={isExpired}
                  />
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* クーポン詳細モーダル */}
      <CouponDetailModal
        visible={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        coupon={selectedCoupon}
        bar={selectedCoupon ? getBarInfo(selectedCoupon.barId) : null}
        onUseCoupon={handleUseCoupon}
        isUsed={selectedCoupon ? isCouponUsed(selectedCoupon.id) : false}
        isExpired={selectedCoupon ? isCouponExpired(selectedCoupon) : false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a'
  },
  header: {
    backgroundColor: '#1a1a1a',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  backButton: {
    padding: 5
  },
  backButtonText: {
    fontSize: 20,
    color: '#D4AF37',
    fontWeight: 'bold'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4AF37'
  },
  headerRight: {
    width: 30
  },
  filterContainer: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  filterChip: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#444'
  },
  filterChipActive: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37'
  },
  filterChipText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600'
  },
  filterChipTextActive: {
    color: '#000'
  },
  clearFiltersButton: {
    alignSelf: 'center',
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#444'
  },
  clearFiltersText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600'
  },
  content: {
    flex: 1,
    padding: 20
  },
  resultsText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
    textAlign: 'center'
  },
  couponContainer: {
    marginBottom: 20
  },
  barInfo: {
    backgroundColor: '#2a2a2a',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#444'
  },
  barName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D4AF37'
  },
  barGenre: {
    fontSize: 12,
    color: '#999'
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyStateIcon: {
    fontSize: 60,
    marginBottom: 20
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 10
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center'
  }
}); 