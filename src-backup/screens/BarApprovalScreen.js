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
import { useBars } from '../context/AppContext';
import { BAR_APPROVAL_STATUS } from '../constants/admin';

export default function BarApprovalScreen({ onBack }) {
  const { bars, updateBar } = useBars();
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const pendingBars = bars.filter(bar => bar.status === BAR_APPROVAL_STATUS.PENDING);
  const approvedBars = bars.filter(bar => bar.status === BAR_APPROVAL_STATUS.APPROVED);
  const rejectedBars = bars.filter(bar => bar.status === BAR_APPROVAL_STATUS.REJECTED);

  const getFilteredBars = () => {
    let filtered = [];
    switch (selectedStatus) {
      case 'pending':
        filtered = pendingBars;
        break;
      case 'approved':
        filtered = approvedBars;
        break;
      case 'rejected':
        filtered = rejectedBars;
        break;
      default:
        filtered = bars;
    }

    if (searchQuery) {
      filtered = filtered.filter(bar =>
        bar.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bar.genre.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const handleApprove = (bar) => {
    Alert.alert(
      '店舗承認',
      `${bar.name}を承認しますか？`,
      [
        {
          text: 'キャンセル',
          style: 'cancel'
        },
        {
          text: '承認',
          onPress: () => {
            updateBar(bar.id, { ...bar, status: BAR_APPROVAL_STATUS.APPROVED });
            Alert.alert('承認完了', `${bar.name}を承認しました`);
          }
        }
      ]
    );
  };

  const handleReject = (bar) => {
    Alert.prompt(
      '店舗却下',
      `${bar.name}を却下します。理由を入力してください：`,
      [
        {
          text: 'キャンセル',
          style: 'cancel'
        },
        {
          text: '却下',
          onPress: (reason) => {
            updateBar(bar.id, { 
              ...bar, 
              status: BAR_APPROVAL_STATUS.REJECTED,
              rejectionReason: reason || '審査基準を満たしていません'
            });
            Alert.alert('却下完了', `${bar.name}を却下しました`);
          }
        }
      ],
      'plain-text'
    );
  };

  const handleSuspend = (bar) => {
    Alert.alert(
      '店舗停止',
      `${bar.name}を停止しますか？`,
      [
        {
          text: 'キャンセル',
          style: 'cancel'
        },
        {
          text: '停止',
          style: 'destructive',
          onPress: () => {
            updateBar(bar.id, { ...bar, status: BAR_APPROVAL_STATUS.SUSPENDED });
            Alert.alert('停止完了', `${bar.name}を停止しました`);
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case BAR_APPROVAL_STATUS.APPROVED:
        return '#4CAF50';
      case BAR_APPROVAL_STATUS.REJECTED:
        return '#FF6B6B';
      case BAR_APPROVAL_STATUS.SUSPENDED:
        return '#FF9800';
      default:
        return '#2196F3';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case BAR_APPROVAL_STATUS.APPROVED:
        return '承認済み';
      case BAR_APPROVAL_STATUS.REJECTED:
        return '却下';
      case BAR_APPROVAL_STATUS.SUSPENDED:
        return '停止中';
      default:
        return '審査待ち';
    }
  };

  const renderBarCard = (bar) => (
    <View key={bar.id} style={styles.barCard}>
      <View style={styles.barHeader}>
        <Text style={styles.barName}>{bar.name}</Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(bar.status) }
        ]}>
          <Text style={styles.statusText}>{getStatusText(bar.status)}</Text>
        </View>
      </View>
      
      <Text style={styles.barGenre}>{bar.genre}</Text>
      <Text style={styles.barAddress}>{bar.address}</Text>
      
      <View style={styles.barDetails}>
        <Text style={styles.barDetail}>価格帯: {bar.priceRange}</Text>
        <Text style={styles.barDetail}>営業時間: {bar.hours}</Text>
      </View>

      {bar.rejectionReason && (
        <View style={styles.rejectionReason}>
          <Text style={styles.rejectionLabel}>却下理由:</Text>
          <Text style={styles.rejectionText}>{bar.rejectionReason}</Text>
        </View>
      )}

      <View style={styles.barActions}>
        <Text style={styles.barDate}>
          登録日: {new Date(bar.createdAt).toLocaleDateString('ja-JP')}
        </Text>
        
        <View style={styles.actionButtons}>
          {bar.status === BAR_APPROVAL_STATUS.PENDING && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => handleApprove(bar)}
              >
                <Text style={styles.actionButtonText}>承認</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleReject(bar)}
              >
                <Text style={styles.actionButtonText}>却下</Text>
              </TouchableOpacity>
            </>
          )}
          
          {bar.status === BAR_APPROVAL_STATUS.APPROVED && (
            <TouchableOpacity
              style={[styles.actionButton, styles.suspendButton]}
              onPress={() => handleSuspend(bar)}
            >
              <Text style={styles.actionButtonText}>停止</Text>
            </TouchableOpacity>
          )}
          
          {bar.status === BAR_APPROVAL_STATUS.SUSPENDED && (
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleApprove(bar)}
            >
              <Text style={styles.actionButtonText}>復活</Text>
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
        <Text style={styles.headerTitle}>店舗審査</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* 統計サマリー */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{pendingBars.length}</Text>
            <Text style={styles.statLabel}>審査待ち</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{approvedBars.length}</Text>
            <Text style={styles.statLabel}>承認済み</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{rejectedBars.length}</Text>
            <Text style={styles.statLabel}>却下</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{bars.filter(b => b.status === BAR_APPROVAL_STATUS.SUSPENDED).length}</Text>
            <Text style={styles.statLabel}>停止中</Text>
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
                selectedStatus === 'pending' && styles.activeFilterButton
              ]}
              onPress={() => setSelectedStatus('pending')}
            >
              <Text style={[
                styles.filterButtonText,
                selectedStatus === 'pending' && styles.activeFilterButtonText
              ]}>審査待ち</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedStatus === 'approved' && styles.activeFilterButton
              ]}
              onPress={() => setSelectedStatus('approved')}
            >
              <Text style={[
                styles.filterButtonText,
                selectedStatus === 'approved' && styles.activeFilterButtonText
              ]}>承認済み</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedStatus === 'rejected' && styles.activeFilterButton
              ]}
              onPress={() => setSelectedStatus('rejected')}
            >
              <Text style={[
                styles.filterButtonText,
                selectedStatus === 'rejected' && styles.activeFilterButtonText
              ]}>却下</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="店舗名・ジャンルで検索..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* 店舗一覧 */}
        <ScrollView style={styles.barsList}>
          {getFilteredBars().map(renderBarCard)}
          
          {getFilteredBars().length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🏪</Text>
              <Text style={styles.emptyText}>
                {selectedStatus === 'all' ? '店舗がありません' :
                 selectedStatus === 'pending' ? '審査待ちの店舗がありません' :
                 selectedStatus === 'approved' ? '承認済みの店舗がありません' :
                 '却下された店舗がありません'}
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
  barsList: {
    flex: 1
  },
  barCard: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333'
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  barName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1
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
  barGenre: {
    fontSize: 14,
    color: '#D4AF37',
    marginBottom: 5
  },
  barAddress: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 10
  },
  barDetails: {
    marginBottom: 10
  },
  barDetail: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2
  },
  rejectionReason: {
    backgroundColor: '#2a2a2a',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10
  },
  rejectionLabel: {
    fontSize: 12,
    color: '#FF6B6B',
    fontWeight: '600',
    marginBottom: 5
  },
  rejectionText: {
    fontSize: 12,
    color: '#ccc'
  },
  barActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  barDate: {
    fontSize: 12,
    color: '#777'
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10
  },
  actionButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center'
  },
  approveButton: {
    backgroundColor: '#4CAF50'
  },
  rejectButton: {
    backgroundColor: '#FF6B6B'
  },
  suspendButton: {
    backgroundColor: '#FF9800'
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