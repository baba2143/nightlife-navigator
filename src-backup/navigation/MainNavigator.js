import React from 'react';
import { View, StyleSheet } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import BarDetailScreen from '../screens/BarDetailScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import OwnerDashboardScreen from '../screens/OwnerDashboardScreen';
import MapScreen from '../screens/MapScreen';
import CouponsScreen from '../screens/CouponsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import AdminLoginScreen from '../screens/AdminLoginScreen';
import AdminBillingScreen from '../screens/AdminBillingScreen';
import BarApprovalScreen from '../screens/BarApprovalScreen';
import UserManagementScreen from '../screens/UserManagementScreen';
import TabNavigation from '../components/TabNavigation';
import { useApp, useUserMode, useFavorites, useBars } from '../context/AppContext';

export default function MainNavigator() {
  const { state, actions } = useApp();
  const { userMode, setUserMode } = useUserMode();
  const { favorites, toggleFavorite } = useFavorites();
  const { bars } = useBars();
  
  const { currentScreen, selectedBar } = state;

  const handleBarPress = (bar) => {
    actions.setSelectedBar(bar);
    actions.setCurrentScreen('barDetail');
  };

  const handleBack = () => {
    if (currentScreen === 'barDetail') {
      actions.setCurrentScreen('home');
      actions.setSelectedBar(null);
    } else if (currentScreen === 'map') {
      actions.setCurrentScreen('home');
    } else if (currentScreen === 'coupons') {
      actions.setCurrentScreen('home');
    } else if (currentScreen === 'notifications') {
      actions.setCurrentScreen('home');
    } else if (currentScreen === 'subscription') {
      actions.setCurrentScreen('home');
    } else if (currentScreen === 'adminDashboard') {
      actions.setCurrentScreen('home');
    } else if (currentScreen === 'barApproval') {
      actions.setCurrentScreen('adminDashboard');
    } else if (currentScreen === 'userManagement') {
      actions.setCurrentScreen('adminDashboard');
    } else if (currentScreen === 'billingManagement') {
      actions.setCurrentScreen('adminDashboard');
    } else if (currentScreen === 'adminLogin') {
      actions.setCurrentScreen('home');
    } else {
      actions.setCurrentScreen('home');
    }
  };

  const handleTabPress = (tab) => {
    actions.setCurrentScreen(tab);
  };

  const handleModeSwitch = () => {
    setUserMode(userMode === 'user' ? 'owner' : 'user');
  };

  const handleNavigateToMap = () => {
    actions.setCurrentScreen('map');
  };

  const handleNavigateToFavorites = () => {
    actions.setCurrentScreen('favorites');
  };

  const handleNavigateToSearch = () => {
    actions.setCurrentScreen('search');
  };

  const handleNavigateToCoupons = () => {
    actions.setCurrentScreen('coupons');
  };

  const handleNavigateToNotifications = () => {
    actions.setCurrentScreen('notifications');
  };

  const handleNavigateToSubscription = () => {
    actions.setCurrentScreen('subscription');
  };

  const handleNavigateToAdminDashboard = () => {
    actions.setCurrentScreen('adminDashboard');
  };

  const handleNavigateToBarApproval = () => {
    actions.setCurrentScreen('barApproval');
  };

  const handleNavigateToUserManagement = () => {
    actions.setCurrentScreen('userManagement');
  };

  const handleNavigateToAdminLogin = () => {
    actions.setCurrentScreen('adminLogin');
  };

  const handleNavigateToBillingManagement = () => {
    actions.setCurrentScreen('billingManagement');
  };

  const handleNavigateToBars = () => {
    // オーナー用の店舗管理画面（今後実装）
    console.log('Navigate to bars management');
  };

  const handleNavigateToReviews = () => {
    // オーナー用のレビュー管理画面（今後実装）
    console.log('Navigate to reviews management');
  };

  const handleUseCoupon = async (coupon) => {
    // クーポン利用処理
    actions.useCoupon(coupon.id, 'user1');
    console.log('Coupon used:', coupon);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return (
          <HomeScreen
            bars={bars}
            favorites={favorites}
            onBarPress={handleBarPress}
            onModeSwitch={handleModeSwitch}
            userMode={userMode}
            onNavigateToMap={handleNavigateToMap}
            onNavigateToFavorites={handleNavigateToFavorites}
            onNavigateToSearch={handleNavigateToSearch}
            onNavigateToCoupons={handleNavigateToCoupons}
            onNavigateToNotifications={handleNavigateToNotifications}
            onNavigateToSubscription={handleNavigateToSubscription}
            onNavigateToAdminLogin={handleNavigateToAdminLogin}
            onToggleFavorite={toggleFavorite}
          />
        );
      case 'search':
        return (
          <SearchScreen
            bars={bars}
            favorites={favorites}
            onBarPress={handleBarPress}
            onBack={handleBack}
            onToggleFavorite={toggleFavorite}
          />
        );
      case 'barDetail':
        return (
          <BarDetailScreen
            bar={selectedBar}
            onBack={handleBack}
            onToggleFavorite={toggleFavorite}
            isFavorite={favorites.includes(selectedBar?.id)}
          />
        );
      case 'favorites':
        return (
          <FavoritesScreen
            bars={bars.filter(bar => favorites.includes(bar.id))}
            onBarPress={handleBarPress}
            onBack={handleBack}
            onToggleFavorite={toggleFavorite}
            favorites={favorites}
          />
        );
      case 'map':
        return (
          <MapScreen
            bars={bars}
            onBarPress={handleBarPress}
            onBack={handleBack}
          />
        );
      case 'coupons':
        return (
          <CouponsScreen
            onBack={handleBack}
            onUseCoupon={handleUseCoupon}
          />
        );
      case 'notifications':
        return (
          <NotificationsScreen
            navigation={{ navigate: (screen) => setCurrentScreen(screen) }}
          />
        );
              case 'subscription':
          return (
            <SubscriptionScreen
              navigation={{ goBack: handleBack }}
            />
          );
        case 'adminDashboard':
          return (
            <AdminDashboardScreen
              onBack={handleBack}
              onNavigateToBarApproval={handleNavigateToBarApproval}
              onNavigateToUserManagement={handleNavigateToUserManagement}
              onNavigateToBillingManagement={handleNavigateToBillingManagement}
            />
          );
        case 'barApproval':
          return (
            <BarApprovalScreen
              onBack={handleBack}
            />
          );
        case 'userManagement':
          return (
            <UserManagementScreen
              onBack={handleBack}
            />
          );
        case 'adminLogin':
          return (
            <AdminLoginScreen
              onBack={handleBack}
              onLoginSuccess={(admin) => {
                actions.setCurrentScreen('adminDashboard');
              }}
            />
          );
        case 'billingManagement':
          return (
            <AdminBillingScreen
              onBack={handleBack}
            />
          );
      case 'ownerDashboard':
        return (
          <OwnerDashboardScreen
            onBack={handleModeSwitch}
            onNavigateToBars={handleNavigateToBars}
            onNavigateToReviews={handleNavigateToReviews}
          />
        );
      default:
        return (
          <HomeScreen
            bars={bars}
            favorites={favorites}
            onBarPress={handleBarPress}
            onModeSwitch={handleModeSwitch}
            userMode={userMode}
            onNavigateToMap={handleNavigateToMap}
            onNavigateToFavorites={handleNavigateToFavorites}
            onNavigateToSearch={handleNavigateToSearch}
            onNavigateToCoupons={handleNavigateToCoupons}
            onNavigateToNotifications={handleNavigateToNotifications}
            onNavigateToSubscription={handleNavigateToSubscription}
            onNavigateToAdminLogin={handleNavigateToAdminLogin}
            onToggleFavorite={toggleFavorite}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      {renderScreen()}
      {userMode === 'user' && currentScreen !== 'map' && currentScreen !== 'barDetail' && currentScreen !== 'coupons' && currentScreen !== 'notifications' && currentScreen !== 'subscription' && currentScreen !== 'adminDashboard' && currentScreen !== 'adminLogin' && currentScreen !== 'billingManagement' && currentScreen !== 'barApproval' && currentScreen !== 'userManagement' && (
        <TabNavigation
          currentTab={currentScreen}
          onTabPress={handleTabPress}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a'
  }
}); 