import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert
} from 'react-native';

export default function ReviewModal({ 
  visible, 
  onClose, 
  onSubmit, 
  bar 
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [drinkPrice, setDrinkPrice] = useState('');
  const [occasion, setOccasion] = useState('');
  const [withWhom, setWithWhom] = useState('');

  const handleSubmit = () => {
    if (!comment.trim()) {
      Alert.alert('エラー', 'レビューコメントを入力してください');
      return;
    }

    const review = {
      id: Date.now().toString(),
      barId: bar.id,
      rating,
      comment: comment.trim(),
      visitDate: visitDate || new Date().toISOString().split('T')[0],
      drinkPrice,
      occasion,
      withWhom,
      createdAt: new Date().toISOString()
    };

    onSubmit(review);
    
    // フォームをリセット
    setRating(5);
    setComment('');
    setVisitDate('');
    setDrinkPrice('');
    setOccasion('');
    setWithWhom('');
    
    onClose();
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
          >
            <Text style={[styles.star, star <= rating && styles.starActive]}>
              {star <= rating ? '⭐' : '☆'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
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
            <Text style={styles.modalTitle}>レビュー投稿</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {bar && (
              <View style={styles.barInfo}>
                <Text style={styles.barName}>{bar.name}</Text>
                <Text style={styles.barGenre}>{bar.genre}</Text>
              </View>
            )}

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>評価 *</Text>
              {renderStars()}
              <Text style={styles.ratingText}>{rating}点</Text>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>レビューコメント *</Text>
              <TextInput
                style={styles.commentInput}
                placeholder="お店の雰囲気やサービスについて書いてください..."
                placeholderTextColor="#888"
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={4}
                maxLength={500}
              />
              <Text style={styles.characterCount}>
                {comment.length}/500文字
              </Text>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>訪問日</Text>
              <TextInput
                style={styles.input}
                placeholder="2024-01-15"
                placeholderTextColor="#888"
                value={visitDate}
                onChangeText={setVisitDate}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>お酒代</Text>
              <TextInput
                style={styles.input}
                placeholder="3500"
                placeholderTextColor="#888"
                value={drinkPrice}
                onChangeText={setDrinkPrice}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>来店目的</Text>
              <View style={styles.occasionButtons}>
                {['友人との飲み', 'デート', '接待', '一人飲み', '観光', 'その他'].map(occ => (
                  <TouchableOpacity
                    key={occ}
                    style={[
                      styles.occasionButton,
                      occasion === occ && styles.occasionButtonActive
                    ]}
                    onPress={() => setOccasion(occ)}
                  >
                    <Text style={[
                      styles.occasionButtonText,
                      occasion === occ && styles.occasionButtonTextActive
                    ]}>
                      {occ}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>誰と来店</Text>
              <View style={styles.withWhomButtons}>
                {['一人', '友人', '恋人', '家族', '同僚', 'その他'].map(whom => (
                  <TouchableOpacity
                    key={whom}
                    style={[
                      styles.withWhomButton,
                      withWhom === whom && styles.withWhomButtonActive
                    ]}
                    onPress={() => setWithWhom(whom)}
                  >
                    <Text style={[
                      styles.withWhomButtonText,
                      withWhom === whom && styles.withWhomButtonTextActive
                    ]}>
                      {whom}
                    </Text>
                  </TouchableOpacity>
                ))}
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
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>投稿する</Text>
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
    color: '#fff',
    marginBottom: 5
  },
  barGenre: {
    fontSize: 14,
    color: '#D4AF37'
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
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10
  },
  starButton: {
    padding: 5
  },
  star: {
    fontSize: 30,
    color: '#444'
  },
  starActive: {
    color: '#D4AF37'
  },
  ratingText: {
    fontSize: 16,
    color: '#D4AF37',
    textAlign: 'center',
    fontWeight: '600'
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#fff',
    backgroundColor: '#2a2a2a',
    textAlignVertical: 'top',
    minHeight: 100
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 5
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
  occasionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  occasionButton: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#444'
  },
  occasionButtonActive: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37'
  },
  occasionButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600'
  },
  occasionButtonTextActive: {
    color: '#000'
  },
  withWhomButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  withWhomButton: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#444'
  },
  withWhomButtonActive: {
    backgroundColor: '#4a5568',
    borderColor: '#4a5568'
  },
  withWhomButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600'
  },
  withWhomButtonTextActive: {
    color: '#D4AF37'
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