import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { Colors } from '../../design-system/colors-soft-pink';
import routeService from '../../services/RouteService';

/**
 * ナビゲーションパネルコンポーネント
 * ターンバイターンナビゲーションを表示
 */
const NavigationPanel = ({
  route,
  onClose = () => {},
  onStartNavigation = () => {},
  onStopNavigation = () => {},
  expanded = false,
}) => {
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationProgress, setNavigationProgress] = useState(null);
  const [panelHeight] = useState(new Animated.Value(expanded ? 300 : 120));

  useEffect(() => {
    setIsNavigating(routeService.isNavigationActive());
  }, []);

  // ナビゲーション開始
  const handleStartNavigation = useCallback(async () => {
    try {
      await routeService.startNavigation(route, (progress) => {
        setNavigationProgress(progress);
      });
      
      setIsNavigating(true);
      onStartNavigation();
    } catch (error) {
      console.error('ナビゲーション開始エラー:', error);
      Alert.alert('エラー', 'ナビゲーションを開始できませんでした');
    }
  }, [route, onStartNavigation]);

  // ナビゲーション停止
  const handleStopNavigation = useCallback(async () => {
    try {
      await routeService.stopNavigation();
      setIsNavigating(false);
      setNavigationProgress(null);
      onStopNavigation();
    } catch (error) {
      console.error('ナビゲーション停止エラー:', error);
    }
  }, [onStopNavigation]);

  // パネルの展開/折りたたみ
  const togglePanel = useCallback(() => {
    const toValue = expanded ? 300 : 120;
    Animated.timing(panelHeight, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [expanded, panelHeight]);

  useEffect(() => {
    togglePanel();
  }, [expanded, togglePanel]);

  // 方向指示アイコンの取得
  const getManeuverIcon = useCallback((maneuver) => {
    switch (maneuver) {
      case 'turn-left':
        return '⬅️';
      case 'turn-right':
        return '➡️';
      case 'turn-slight-left':
        return '↖️';
      case 'turn-slight-right':
        return '↗️';
      case 'turn-sharp-left':
        return '↩️';
      case 'turn-sharp-right':
        return '↪️';
      case 'straight':
        return '⬆️';
      case 'ramp-left':
        return '🔄';
      case 'ramp-right':
        return '🔄';
      case 'merge':
        return '🔀';
      case 'roundabout-left':
        return '🔄';
      case 'roundabout-right':
        return '🔄';
      case 'uturn-left':
        return '↩️';
      case 'uturn-right':
        return '↪️';
      default:
        return '📍';
    }
  }, []);

  // 移動手段アイコンの取得
  const getTravelModeIcon = useCallback((mode) => {
    switch (mode) {
      case 'WALKING':
        return '🚶';
      case 'DRIVING':
        return '🚗';
      case 'BICYCLING':
        return '🚴';
      case 'TRANSIT':
        return '🚌';
      default:
        return '🚶';
    }
  }, []);

  if (!route) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { height: panelHeight }]}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <View style={styles.routeInfo}>
          <Text style={styles.routeTitle}>
            {route.startAddress || '現在地'} → {route.endAddress || '目的地'}
          </Text>
          <View style={styles.routeStats}>
            <Text style={styles.routeDistance}>
              📏 {route.distance.text}
            </Text>
            <Text style={styles.routeDuration}>
              ⏱️ {route.duration.text}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* ナビゲーション状態表示 */}
      {isNavigating && navigationProgress && (
        <View style={styles.navigationStatus}>
          <View style={styles.currentStep}>
            <Text style={styles.maneuverIcon}>
              {getManeuverIcon(navigationProgress.currentStep?.maneuver)}
            </Text>
            <View style={styles.stepInfo}>
              <Text style={styles.stepInstruction} numberOfLines={2}>
                {navigationProgress.currentStep?.instruction || '直進してください'}
              </Text>
              <Text style={styles.stepDistance}>
                {navigationProgress.currentStep?.distance?.text || ''}
              </Text>
            </View>
          </View>
          
          <View style={styles.remainingInfo}>
            <Text style={styles.remainingDistance}>
              残り {navigationProgress.remainingDistance.text}
            </Text>
            <Text style={styles.remainingDuration}>
              約 {navigationProgress.remainingDuration.text}
            </Text>
          </View>

          {/* 進行率バー */}
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${navigationProgress.progressPercentage}%` }
              ]}
            />
          </View>

          {/* オフルート警告 */}
          {navigationProgress.isOffRoute && (
            <View style={styles.offRouteWarning}>
              <Text style={styles.offRouteText}>
                ⚠️ ルートから外れています。ルートに戻ってください
              </Text>
            </View>
          )}
        </View>
      )}

      {/* ステップリスト */}
      <ScrollView style={styles.stepsList} showsVerticalScrollIndicator={false}>
        {route.steps.map((step, index) => (
          <View
            key={index}
            style={[
              styles.stepItem,
              isNavigating && navigationProgress?.stepIndex === index && styles.currentStepItem
            ]}
          >
            <View style={styles.stepIconContainer}>
              <Text style={styles.stepIcon}>
                {getManeuverIcon(step.maneuver)}
              </Text>
              <Text style={styles.travelModeIcon}>
                {getTravelModeIcon(step.travelMode)}
              </Text>
            </View>
            
            <View style={styles.stepContent}>
              <Text style={styles.stepText} numberOfLines={2}>
                {step.instruction}
              </Text>
              <View style={styles.stepMetrics}>
                <Text style={styles.stepMetricText}>
                  {step.distance.text}
                </Text>
                <Text style={styles.stepMetricText}>
                  {step.duration.text}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* コントロールボタン */}
      <View style={styles.controls}>
        {!isNavigating ? (
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartNavigation}
          >
            <Text style={styles.startButtonText}>ナビゲーション開始</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.stopButton}
            onPress={handleStopNavigation}
          >
            <Text style={styles.stopButtonText}>ナビゲーション停止</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  routeInfo: {
    flex: 1,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  routeStats: {
    flexDirection: 'row',
    gap: 16,
  },
  routeDistance: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  routeDuration: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  navigationStatus: {
    padding: 16,
    backgroundColor: Colors.lightPink,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  currentStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  maneuverIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  stepInfo: {
    flex: 1,
  },
  stepInstruction: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  stepDistance: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  remainingInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  remainingDistance: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  remainingDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: Colors.lightGray,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  offRouteWarning: {
    backgroundColor: Colors.warning,
    padding: 8,
    borderRadius: 8,
  },
  offRouteText: {
    fontSize: 12,
    color: Colors.white,
    textAlign: 'center',
  },
  stepsList: {
    flex: 1,
    padding: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  currentStepItem: {
    backgroundColor: Colors.lightPink,
    marginHorizontal: -16,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  stepIconContainer: {
    alignItems: 'center',
    marginRight: 12,
    minWidth: 40,
  },
  stepIcon: {
    fontSize: 20,
  },
  travelModeIcon: {
    fontSize: 12,
    marginTop: 2,
  },
  stepContent: {
    flex: 1,
  },
  stepText: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 4,
    lineHeight: 20,
  },
  stepMetrics: {
    flexDirection: 'row',
    gap: 12,
  },
  stepMetricText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  controls: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  startButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  stopButton: {
    backgroundColor: Colors.error,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  stopButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default React.memo(NavigationPanel);