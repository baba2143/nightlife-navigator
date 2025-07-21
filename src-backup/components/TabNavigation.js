import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, typography } from '../styles';

export default function TabNavigation({ 
  currentScreen, 
  userMode, 
  onTabPress, 
  favorites = [] 
}) {
  const isCustomerMode = userMode === 'customer';

  if (isCustomerMode) {
    return (
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, currentScreen === 'home' && styles.activeTab]}
          onPress={() => onTabPress('home')}
        >
          <Text style={[styles.tabText, currentScreen === 'home' && styles.activeTabText]}>
            🏠 ホーム
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, currentScreen === 'search' && styles.activeTab]}
          onPress={() => onTabPress('search')}
        >
          <Text style={[styles.tabText, currentScreen === 'search' && styles.activeTabText]}>
            🔍 検索
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, currentScreen === 'favorites' && styles.activeTab]}
          onPress={() => onTabPress('favorites')}
        >
          <Text style={[styles.tabText, currentScreen === 'favorites' && styles.activeTabText]}>
            ❤️ お気に入り
            {favorites.length > 0 && (
              <Text style={styles.badge}> {favorites.length}</Text>
            )}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, currentScreen === 'ownerDashboard' && styles.activeTab]}
          onPress={() => onTabPress('ownerDashboard')}
        >
          <Text style={[styles.tabText, currentScreen === 'ownerDashboard' && styles.activeTabText]}>
            🏪 オーナー
          </Text>
        </TouchableOpacity>
      </View>
    );
  } else {
    // オーナーモードのタブ
    return (
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, currentScreen === 'home' && styles.activeTab]}
          onPress={() => onTabPress('home')}
        >
          <Text style={[styles.tabText, currentScreen === 'home' && styles.activeTabText]}>
            🏠 ホーム
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, currentScreen === 'ownerDashboard' && styles.activeTab]}
          onPress={() => onTabPress('ownerDashboard')}
        >
          <Text style={[styles.tabText, currentScreen === 'ownerDashboard' && styles.activeTabText]}>
            🏪 ダッシュボード
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, currentScreen === 'ownerBars' && styles.activeTab]}
          onPress={() => onTabPress('ownerBars')}
        >
          <Text style={[styles.tabText, currentScreen === 'ownerBars' && styles.activeTabText]}>
            📊 店舗管理
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, currentScreen === 'ownerReviews' && styles.activeTab]}
          onPress={() => onTabPress('ownerReviews')}
        >
          <Text style={[styles.tabText, currentScreen === 'ownerReviews' && styles.activeTabText]}>
            💬 レビュー
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center'
  },
  activeTab: {
    backgroundColor: colors.surface,
    borderTopWidth: 2,
    borderTopColor: colors.secondary
  },
  tabText: {
    fontSize: 10,
    color: colors.textTertiary,
    fontWeight: typography.weights.semibold
  },
  activeTabText: {
    color: colors.secondary
  },
  badge: {
    backgroundColor: colors.secondary,
    color: colors.surface,
    fontSize: 10,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 8,
    overflow: 'hidden',
    fontWeight: typography.weights.bold
  }
}); 