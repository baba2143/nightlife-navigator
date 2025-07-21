import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { COUPON_ICONS, COUPON_COLORS } from '../constants/data';

export default function CouponCard({ 
  coupon, 
  onPress, 
  isUsed = false, 
  isExpired = false,
  showBarName = true 
}) {
  const isDisabled = isUsed || isExpired;
  
  const getStatusText = () => {
    if (isUsed) return '使用済み';
    if (isExpired) return '期限切れ';
    return '利用可能';
  };

  const getStatusColor = () => {
    if (isUsed) return '#999';
    if (isExpired) return '#FF6B6B';
    return '#4CAF50';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { borderColor: COUPON_COLORS[coupon.type] },
        isDisabled && styles.disabledContainer
      ]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {/* クーポンタイプアイコン */}
      <View style={[
        styles.iconContainer,
        { backgroundColor: COUPON_COLORS[coupon.type] }
      ]}>
        <Text style={styles.icon}>{COUPON_ICONS[coupon.type]}</Text>
      </View>

      {/* クーポン情報 */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{coupon.title}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor() }
          ]}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
        </View>

        <Text style={styles.description}>{coupon.description}</Text>

        {/* 割引情報 */}
        <View style={styles.discountContainer}>
          <Text style={[
            styles.discount,
            { color: COUPON_COLORS[coupon.type] }
          ]}>
            {coupon.discount}
          </Text>
          {coupon.discountAmount && (
            <Text style={styles.discountAmount}>
              (最大{coupon.discountAmount}円)
            </Text>
          )}
        </View>

        {/* 条件 */}
        <View style={styles.conditionsContainer}>
          {coupon.conditions.map((condition, index) => (
            <View key={index} style={styles.conditionTag}>
              <Text style={styles.conditionText}>{condition}</Text>
            </View>
          ))}
        </View>

        {/* 有効期限 */}
        <Text style={styles.validDate}>
          有効期限: {formatDate(coupon.validFrom)} - {formatDate(coupon.validTo)}
        </Text>

        {/* 利用状況 */}
        <View style={styles.usageInfo}>
          <Text style={styles.usageText}>
            利用状況: {coupon.usedCount}/{coupon.usageLimit}
          </Text>
          <View style={styles.usageBar}>
            <View 
              style={[
                styles.usageProgress,
                { 
                  width: `${(coupon.usedCount / coupon.usageLimit) * 100}%`,
                  backgroundColor: COUPON_COLORS[coupon.type]
                }
              ]} 
            />
          </View>
        </View>
      </View>

      {/* 使用済みオーバーレイ */}
      {isUsed && (
        <View style={styles.usedOverlay}>
          <Text style={styles.usedText}>使用済み</Text>
        </View>
      )}

      {/* 期限切れオーバーレイ */}
      {isExpired && (
        <View style={styles.expiredOverlay}>
          <Text style={styles.expiredText}>期限切れ</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderStyle: 'dashed',
    position: 'relative',
    overflow: 'hidden'
  },
  disabledContainer: {
    opacity: 0.6
  },
  iconContainer: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1
  },
  icon: {
    fontSize: 20
  },
  content: {
    marginTop: 5
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginRight: 10
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600'
  },
  description: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 10,
    lineHeight: 20
  },
  discountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  discount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8
  },
  discountAmount: {
    fontSize: 12,
    color: '#999'
  },
  conditionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10
  },
  conditionTag: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4
  },
  conditionText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600'
  },
  validDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 10
  },
  usageInfo: {
    marginBottom: 5
  },
  usageText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5
  },
  usageBar: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden'
  },
  usageProgress: {
    height: '100%',
    borderRadius: 2
  },
  usedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12
  },
  usedText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    transform: [{ rotate: '-15deg' }]
  },
  expiredOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12
  },
  expiredText: {
    color: '#FF6B6B',
    fontSize: 18,
    fontWeight: 'bold',
    transform: [{ rotate: '-15deg' }]
  }
}); 