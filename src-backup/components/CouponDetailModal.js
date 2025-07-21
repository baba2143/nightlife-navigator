import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert
} from 'react-native';
import { COUPON_ICONS, COUPON_COLORS } from '../constants/data';

export default function CouponDetailModal({ 
  visible, 
  onClose, 
  coupon, 
  bar,
  onUseCoupon,
  isUsed = false,
  isExpired = false
}) {
  const [isLoading, setIsLoading] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}年${(date.getMonth() + 1)}月${date.getDate()}日`;
  };

  const handleUseCoupon = async () => {
    if (isUsed || isExpired) {
      Alert.alert('エラー', 'このクーポンは利用できません');
      return;
    }

    Alert.alert(
      'クーポン利用確認',
      `${coupon.title}を使用しますか？\n\n利用後は取り消しできません。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '利用する', 
          onPress: async () => {
            setIsLoading(true);
            try {
              if (onUseCoupon) {
                await onUseCoupon(coupon);
              }
              Alert.alert('完了', 'クーポンを利用しました！');
              onClose();
            } catch (error) {
              Alert.alert('エラー', 'クーポンの利用に失敗しました');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

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

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* ヘッダー */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerIcon}>{COUPON_ICONS[coupon?.type]}</Text>
              <Text style={styles.modalTitle}>クーポン詳細</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {coupon && (
              <>
                {/* クーポンタイトル */}
                <View style={styles.couponHeader}>
                  <Text style={styles.couponTitle}>{coupon.title}</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor() }
                  ]}>
                    <Text style={styles.statusText}>{getStatusText()}</Text>
                  </View>
                </View>

                {/* 店舗情報 */}
                {bar && (
                  <View style={styles.barInfo}>
                    <Text style={styles.barName}>{bar.name}</Text>
                    <Text style={styles.barGenre}>{bar.genre}</Text>
                    <Text style={styles.barAddress}>{bar.address}</Text>
                  </View>
                )}

                {/* クーポン説明 */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>詳細</Text>
                  <Text style={styles.description}>{coupon.description}</Text>
                </View>

                {/* 割引情報 */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>割引内容</Text>
                  <View style={styles.discountInfo}>
                    <Text style={[
                      styles.discount,
                      { color: COUPON_COLORS[coupon.type] }
                    ]}>
                      {coupon.discount}
                    </Text>
                    {coupon.discountAmount && (
                      <Text style={styles.discountAmount}>
                        最大{coupon.discountAmount}円割引
                      </Text>
                    )}
                  </View>
                </View>

                {/* 利用条件 */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>利用条件</Text>
                  <View style={styles.conditionsContainer}>
                    {coupon.conditions.map((condition, index) => (
                      <View key={index} style={styles.conditionItem}>
                        <Text style={styles.conditionBullet}>•</Text>
                        <Text style={styles.conditionText}>{condition}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* 有効期限 */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>有効期限</Text>
                  <Text style={styles.validDate}>
                    {formatDate(coupon.validFrom)} 〜 {formatDate(coupon.validTo)}
                  </Text>
                </View>

                {/* 利用状況 */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>利用状況</Text>
                  <Text style={styles.usageText}>
                    {coupon.usedCount} / {coupon.usageLimit} 人利用済み
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

                {/* 注意事項 */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>注意事項</Text>
                  <View style={styles.noticeContainer}>
                    <Text style={styles.noticeText}>• クーポン利用時は店舗スタッフに提示してください</Text>
                    <Text style={styles.noticeText}>• 他のクーポンとの併用はできません</Text>
                    <Text style={styles.noticeText}>• 利用後は取り消しできません</Text>
                    <Text style={styles.noticeText}>• 店舗の営業時間内でのみ利用可能です</Text>
                  </View>
                </View>
              </>
            )}
          </ScrollView>

          {/* フッター */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>閉じる</Text>
            </TouchableOpacity>
            
            {!isUsed && !isExpired && (
              <TouchableOpacity
                style={[
                  styles.useButton,
                  { backgroundColor: COUPON_COLORS[coupon?.type] },
                  isLoading && styles.disabledButton
                ]}
                onPress={handleUseCoupon}
                disabled={isLoading}
              >
                <Text style={styles.useButtonText}>
                  {isLoading ? '処理中...' : 'クーポンを使用'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#333'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerIcon: {
    fontSize: 24,
    marginRight: 10
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4AF37'
  },
  modalClose: {
    fontSize: 20,
    color: '#999'
  },
  modalBody: {
    padding: 20
  },
  couponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20
  },
  couponTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginRight: 10
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600'
  },
  barInfo: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#444'
  },
  barName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 5
  },
  barGenre: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 5
  },
  barAddress: {
    fontSize: 12,
    color: '#999'
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D4AF37',
    marginBottom: 10
  },
  description: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20
  },
  discountInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  discount: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 10
  },
  discountAmount: {
    fontSize: 14,
    color: '#999'
  },
  conditionsContainer: {
    marginLeft: 10
  },
  conditionItem: {
    flexDirection: 'row',
    marginBottom: 8
  },
  conditionBullet: {
    fontSize: 14,
    color: '#D4AF37',
    marginRight: 8,
    fontWeight: 'bold'
  },
  conditionText: {
    fontSize: 14,
    color: '#ccc',
    flex: 1
  },
  validDate: {
    fontSize: 14,
    color: '#ccc'
  },
  usageText: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8
  },
  usageBar: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden'
  },
  usageProgress: {
    height: '100%',
    borderRadius: 3
  },
  noticeContainer: {
    marginLeft: 10
  },
  noticeText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
    lineHeight: 16
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
    gap: 10
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444'
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '600'
  },
  useButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center'
  },
  useButtonText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600'
  },
  disabledButton: {
    opacity: 0.6
  }
}); 