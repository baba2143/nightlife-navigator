import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  Switch
} from 'react-native';
import { COUPON_TYPES, COUPON_ICONS, COUPON_COLORS } from '../constants/data';

export default function CouponManagementModal({ 
  visible, 
  onClose, 
  onSubmit, 
  editingCoupon = null,
  barId 
}) {
  const [couponForm, setCouponForm] = useState({
    title: '',
    description: '',
    type: COUPON_TYPES.STORE_COUPON,
    discount: '',
    discountAmount: '',
    conditions: [],
    validFrom: '',
    validTo: '',
    usageLimit: '',
    isActive: true,
    sendNotification: true
  });

  const [newCondition, setNewCondition] = useState('');

  // 編集モードの場合、既存データを設定
  useEffect(() => {
    if (editingCoupon) {
      setCouponForm({
        title: editingCoupon.title || '',
        description: editingCoupon.description || '',
        type: editingCoupon.type || COUPON_TYPES.STORE_COUPON,
        discount: editingCoupon.discount || '',
        discountAmount: editingCoupon.discountAmount?.toString() || '',
        conditions: editingCoupon.conditions || [],
        validFrom: editingCoupon.validFrom || '',
        validTo: editingCoupon.validTo || '',
        usageLimit: editingCoupon.usageLimit?.toString() || '',
        isActive: editingCoupon.isActive !== false,
        sendNotification: true
      });
    } else {
      // 新規登録の場合、フォームをリセット
      setCouponForm({
        title: '',
        description: '',
        type: COUPON_TYPES.STORE_COUPON,
        discount: '',
        discountAmount: '',
        conditions: [],
        validFrom: '',
        validTo: '',
        usageLimit: '',
        isActive: true,
        sendNotification: true
      });
    }
  }, [editingCoupon, visible]);

  const handleSubmit = () => {
    if (!couponForm.title || !couponForm.description || !couponForm.discount) {
      Alert.alert('エラー', '必須項目を入力してください');
      return;
    }

    const newCoupon = {
      id: editingCoupon ? editingCoupon.id : `coupon_${Date.now()}`,
      barId: barId,
      ...couponForm,
      discountAmount: couponForm.discountAmount ? parseInt(couponForm.discountAmount) : null,
      usageLimit: parseInt(couponForm.usageLimit) || 100,
      usedCount: editingCoupon ? editingCoupon.usedCount : 0,
      createdAt: editingCoupon ? editingCoupon.createdAt : new Date().toISOString()
    };

    onSubmit(newCoupon);
    onClose();
  };

  const addCondition = () => {
    if (newCondition.trim()) {
      setCouponForm({
        ...couponForm,
        conditions: [...couponForm.conditions, newCondition.trim()]
      });
      setNewCondition('');
    }
  };

  const removeCondition = (index) => {
    const updatedConditions = couponForm.conditions.filter((_, i) => i !== index);
    setCouponForm({ ...couponForm, conditions: updatedConditions });
  };

  const getTypeName = (type) => {
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
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingCoupon ? 'クーポン編集' : '新規クーポン登録'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>クーポンタイプ *</Text>
              <View style={styles.typeButtons}>
                {Object.values(COUPON_TYPES).map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      couponForm.type === type && styles.typeButtonActive
                    ]}
                    onPress={() => setCouponForm({...couponForm, type})}
                  >
                    <Text style={styles.typeIcon}>{COUPON_ICONS[type]}</Text>
                    <Text style={[
                      styles.typeButtonText,
                      couponForm.type === type && styles.typeButtonTextActive
                    ]}>
                      {getTypeName(type)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>クーポンタイトル *</Text>
              <TextInput
                style={styles.input}
                placeholder="例: ドリンク1杯サービス"
                placeholderTextColor="#888"
                value={couponForm.title}
                onChangeText={(title) => setCouponForm({...couponForm, title})}
                maxLength={50}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>詳細説明 *</Text>
              <TextInput
                style={styles.textArea}
                placeholder="クーポンの詳細を説明してください..."
                placeholderTextColor="#888"
                value={couponForm.description}
                onChangeText={(description) => setCouponForm({...couponForm, description})}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>割引内容 *</Text>
              <TextInput
                style={styles.input}
                placeholder="例: 100%OFF, 20%OFF, 500円割引"
                placeholderTextColor="#888"
                value={couponForm.discount}
                onChangeText={(discount) => setCouponForm({...couponForm, discount})}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>最大割引額（円）</Text>
              <TextInput
                style={styles.input}
                placeholder="例: 800"
                placeholderTextColor="#888"
                value={couponForm.discountAmount}
                onChangeText={(discountAmount) => setCouponForm({...couponForm, discountAmount})}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>利用条件</Text>
              <View style={styles.conditionsContainer}>
                {couponForm.conditions.map((condition, index) => (
                  <View key={index} style={styles.conditionItem}>
                    <Text style={styles.conditionText}>{condition}</Text>
                    <TouchableOpacity
                      onPress={() => removeCondition(index)}
                      style={styles.removeConditionButton}
                    >
                      <Text style={styles.removeConditionText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              <View style={styles.addConditionContainer}>
                <TextInput
                  style={styles.addConditionInput}
                  placeholder="新しい条件を追加"
                  placeholderTextColor="#888"
                  value={newCondition}
                  onChangeText={setNewCondition}
                />
                <TouchableOpacity
                  onPress={addCondition}
                  style={styles.addConditionButton}
                >
                  <Text style={styles.addConditionButtonText}>追加</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>有効期間 *</Text>
              <View style={styles.dateContainer}>
                <View style={styles.dateInput}>
                  <Text style={styles.dateLabel}>開始日</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#888"
                    value={couponForm.validFrom}
                    onChangeText={(validFrom) => setCouponForm({...couponForm, validFrom})}
                  />
                </View>
                <View style={styles.dateInput}>
                  <Text style={styles.dateLabel}>終了日</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#888"
                    value={couponForm.validTo}
                    onChangeText={(validTo) => setCouponForm({...couponForm, validTo})}
                  />
                </View>
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>利用制限数</Text>
              <TextInput
                style={styles.input}
                placeholder="例: 100"
                placeholderTextColor="#888"
                value={couponForm.usageLimit}
                onChangeText={(usageLimit) => setCouponForm({...couponForm, usageLimit})}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formSection}>
              <View style={styles.switchContainer}>
                <Text style={styles.formLabel}>クーポンを有効にする</Text>
                <Switch
                  value={couponForm.isActive}
                  onValueChange={(isActive) => setCouponForm({...couponForm, isActive})}
                  trackColor={{ false: '#444', true: COUPON_COLORS[couponForm.type] }}
                  thumbColor={couponForm.isActive ? '#fff' : '#999'}
                />
              </View>
            </View>

            <View style={styles.formSection}>
              <View style={styles.switchContainer}>
                <Text style={styles.formLabel}>お気に入りユーザーに通知を送信</Text>
                <Switch
                  value={couponForm.sendNotification}
                  onValueChange={(sendNotification) => setCouponForm({...couponForm, sendNotification})}
                  trackColor={{ false: '#444', true: '#4CAF50' }}
                  thumbColor={couponForm.sendNotification ? '#fff' : '#999'}
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: COUPON_COLORS[couponForm.type] }
              ]}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>
                {editingCoupon ? '更新' : '登録'}
              </Text>
            </TouchableOpacity>
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
  formSection: {
    marginBottom: 20
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D4AF37',
    marginBottom: 10
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  typeButton: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#444',
    alignItems: 'center',
    minWidth: 100
  },
  typeButtonActive: {
    borderColor: '#D4AF37'
  },
  typeIcon: {
    fontSize: 16,
    marginBottom: 4
  },
  typeButtonText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600'
  },
  typeButtonTextActive: {
    color: '#D4AF37'
  },
  input: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#fff',
    backgroundColor: '#2a2a2a'
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#fff',
    backgroundColor: '#2a2a2a',
    textAlignVertical: 'top',
    minHeight: 80
  },
  conditionsContainer: {
    marginBottom: 10
  },
  conditionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 10,
    borderRadius: 8,
    marginBottom: 5
  },
  conditionText: {
    fontSize: 14,
    color: '#fff',
    flex: 1
  },
  removeConditionButton: {
    padding: 5
  },
  removeConditionText: {
    color: '#FF6B6B',
    fontSize: 16
  },
  addConditionContainer: {
    flexDirection: 'row',
    gap: 10
  },
  addConditionInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#fff',
    backgroundColor: '#2a2a2a'
  },
  addConditionButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center'
  },
  addConditionButtonText: {
    color: '#fff',
    fontWeight: '600'
  },
  dateContainer: {
    flexDirection: 'row',
    gap: 10
  },
  dateInput: {
    flex: 1
  },
  dateLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 5
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
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
  submitButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center'
  },
  submitButtonText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600'
  }
}); 