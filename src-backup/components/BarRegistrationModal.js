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
import { GENRES, PRICE_RANGES, FEATURES, DRESS_CODES } from '../constants/data';

export default function BarRegistrationModal({ 
  visible, 
  onClose, 
  onSubmit, 
  editingBar = null 
}) {
  const [barForm, setBarForm] = useState({
    name: '',
    genre: '',
    description: '',
    address: '',
    phone: '',
    openTime: '',
    priceRange: '¥¥',
    features: [],
    latitude: '',
    longitude: '',
    drinkMenu: '',
    website: '',
    email: '',
    capacity: '',
    dressCode: '',
    music: '',
    atmosphere: ''
  });

  // 編集モードの場合、既存データを設定
  useEffect(() => {
    if (editingBar) {
      setBarForm({
        name: editingBar.name || '',
        genre: editingBar.genre || '',
        description: editingBar.description || '',
        address: editingBar.address || '',
        phone: editingBar.phone || '',
        openTime: editingBar.openTime || '',
        priceRange: editingBar.priceRange || '¥¥',
        features: editingBar.features || [],
        latitude: editingBar.latitude?.toString() || '',
        longitude: editingBar.longitude?.toString() || '',
        drinkMenu: editingBar.drinkMenu || '',
        website: editingBar.website || '',
        email: editingBar.email || '',
        capacity: editingBar.capacity?.toString() || '',
        dressCode: editingBar.dressCode || '',
        music: editingBar.music || '',
        atmosphere: editingBar.atmosphere || ''
      });
    } else {
      // 新規登録の場合、フォームをリセット
      setBarForm({
        name: '',
        genre: '',
        description: '',
        address: '',
        phone: '',
        openTime: '',
        priceRange: '¥¥',
        features: [],
        latitude: '',
        longitude: '',
        drinkMenu: '',
        website: '',
        email: '',
        capacity: '',
        dressCode: '',
        music: '',
        atmosphere: ''
      });
    }
  }, [editingBar, visible]);

  const handleSubmit = () => {
    if (!barForm.name || !barForm.address || !barForm.phone) {
      Alert.alert('エラー', '必須項目を入力してください');
      return;
    }

    const newBar = {
      id: editingBar ? editingBar.id : Date.now(),
      ...barForm,
      ownerId: 'owner1', // 今後は認証から取得
      status: editingBar ? editingBar.status : 'pending',
      rating: editingBar ? editingBar.rating : 0,
      reviewCount: editingBar ? editingBar.reviewCount : 0,
      isOpenNow: false,
      distance: 0,
      latitude: parseFloat(barForm.latitude) || 35.6762,
      longitude: parseFloat(barForm.longitude) || 139.6503,
      createdAt: editingBar ? editingBar.createdAt : new Date().toISOString()
    };

    onSubmit(newBar);
    onClose();
  };

  const toggleFeature = (feature) => {
    const features = barForm.features.includes(feature)
      ? barForm.features.filter(f => f !== feature)
      : [...barForm.features, feature];
    setBarForm({ ...barForm, features });
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
              {editingBar ? '店舗情報編集' : '新規店舗登録'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>店舗名 *</Text>
              <TextInput
                style={styles.input}
                placeholder="店舗名を入力"
                placeholderTextColor="#888"
                value={barForm.name}
                onChangeText={(name) => setBarForm({...barForm, name})}
                maxLength={50}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>ジャンル *</Text>
              <View style={styles.genreButtons}>
                {GENRES.map(genre => (
                  <TouchableOpacity
                    key={genre.id}
                    style={[
                      styles.genreButton,
                      barForm.genre === genre.name && styles.genreButtonActive
                    ]}
                    onPress={() => setBarForm({
                      ...barForm,
                      genre: barForm.genre === genre.name ? '' : genre.name
                    })}
                  >
                    <Text style={[
                      styles.genreButtonText,
                      barForm.genre === genre.name && styles.genreButtonTextActive
                    ]}>
                      {genre.icon} {genre.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>店舗の説明</Text>
              <TextInput
                style={styles.textArea}
                placeholder="お店の雰囲気や特徴を説明してください..."
                placeholderTextColor="#888"
                value={barForm.description}
                onChangeText={(description) => setBarForm({...barForm, description})}
                multiline
                numberOfLines={3}
                maxLength={500}
              />
              <Text style={styles.characterCount}>
                {barForm.description.length}/500文字
              </Text>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>住所 *</Text>
              <TextInput
                style={styles.input}
                placeholder="〒000-0000 都道府県市区町村..."
                placeholderTextColor="#888"
                value={barForm.address}
                onChangeText={(address) => setBarForm({...barForm, address})}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>電話番号 *</Text>
              <TextInput
                style={styles.input}
                placeholder="03-1234-5678"
                placeholderTextColor="#888"
                value={barForm.phone}
                onChangeText={(phone) => setBarForm({...barForm, phone})}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>営業時間</Text>
              <TextInput
                style={styles.input}
                placeholder="20:00-05:00"
                placeholderTextColor="#888"
                value={barForm.openTime}
                onChangeText={(openTime) => setBarForm({...barForm, openTime})}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>価格帯</Text>
              <View style={styles.priceButtons}>
                {PRICE_RANGES.map(price => (
                  <TouchableOpacity
                    key={price}
                    style={[
                      styles.priceButton,
                      barForm.priceRange === price && styles.priceButtonActive
                    ]}
                    onPress={() => setBarForm({...barForm, priceRange: price})}
                  >
                    <Text style={[
                      styles.priceButtonText,
                      barForm.priceRange === price && styles.priceButtonTextActive
                    ]}>
                      {price}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>設備・サービス</Text>
              <View style={styles.featuresContainer}>
                {FEATURES.map(feature => (
                  <TouchableOpacity
                    key={feature}
                    style={[
                      styles.featureButton,
                      barForm.features.includes(feature) && styles.featureButtonActive
                    ]}
                    onPress={() => toggleFeature(feature)}
                  >
                    <Text style={[
                      styles.featureButtonText,
                      barForm.features.includes(feature) && styles.featureButtonTextActive
                    ]}>
                      {feature}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>ドリンクメニュー</Text>
              <TextInput
                style={styles.textArea}
                placeholder="ビール、ウイスキー、カクテル、ソフトドリンクなど..."
                placeholderTextColor="#888"
                value={barForm.drinkMenu}
                onChangeText={(drinkMenu) => setBarForm({...barForm, drinkMenu})}
                multiline
                numberOfLines={2}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>ドレスコード</Text>
              <View style={styles.dressCodeButtons}>
                {DRESS_CODES.map(dress => (
                  <TouchableOpacity
                    key={dress}
                    style={[
                      styles.dressCodeButton,
                      barForm.dressCode === dress && styles.dressCodeButtonActive
                    ]}
                    onPress={() => setBarForm({...barForm, dressCode: dress})}
                  >
                    <Text style={[
                      styles.dressCodeButtonText,
                      barForm.dressCode === dress && styles.dressCodeButtonTextActive
                    ]}>
                      {dress}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>音楽</Text>
              <TextInput
                style={styles.input}
                placeholder="カラオケ、J-POP、クラシックなど..."
                placeholderTextColor="#888"
                value={barForm.music}
                onChangeText={(music) => setBarForm({...barForm, music})}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>雰囲気</Text>
              <TextInput
                style={styles.input}
                placeholder="アットホーム、ラグジュアリー、カジュアルなど..."
                placeholderTextColor="#888"
                value={barForm.atmosphere}
                onChangeText={(atmosphere) => setBarForm({...barForm, atmosphere})}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>定員</Text>
              <TextInput
                style={styles.input}
                placeholder="25"
                placeholderTextColor="#888"
                value={barForm.capacity}
                onChangeText={(capacity) => setBarForm({...barForm, capacity})}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>ウェブサイト</Text>
              <TextInput
                style={styles.input}
                placeholder="https://example.com"
                placeholderTextColor="#888"
                value={barForm.website}
                onChangeText={(website) => setBarForm({...barForm, website})}
                keyboardType="url"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>メールアドレス</Text>
              <TextInput
                style={styles.input}
                placeholder="info@example.com"
                placeholderTextColor="#888"
                value={barForm.email}
                onChangeText={(email) => setBarForm({...barForm, email})}
                keyboardType="email-address"
              />
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
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>
                {editingBar ? '更新' : '登録申請'}
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
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 5
  },
  genreButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  genreButton: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#444',
    minWidth: 120,
    alignItems: 'center'
  },
  genreButtonActive: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37'
  },
  genreButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600'
  },
  genreButtonTextActive: {
    color: '#000'
  },
  priceButtons: {
    flexDirection: 'row',
    gap: 8
  },
  priceButton: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444'
  },
  priceButtonActive: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37'
  },
  priceButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600'
  },
  priceButtonTextActive: {
    color: '#000'
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  featureButton: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#444'
  },
  featureButtonActive: {
    backgroundColor: '#4a5568',
    borderColor: '#4a5568'
  },
  featureButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600'
  },
  featureButtonTextActive: {
    color: '#D4AF37'
  },
  dressCodeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  dressCodeButton: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#444'
  },
  dressCodeButtonActive: {
    backgroundColor: '#6c5ce7',
    borderColor: '#6c5ce7'
  },
  dressCodeButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600'
  },
  dressCodeButtonTextActive: {
    color: '#fff'
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
    backgroundColor: '#D4AF37',
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