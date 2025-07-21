import React, { useMemo } from 'react';
import { Polyline, Marker } from 'react-native-maps';
import { Colors } from '../../design-system/colors-soft-pink';
import { decode } from '@mapbox/polyline';

/**
 * ルートオーバーレイコンポーネント
 * 地図上にルートを表示
 */
const RouteOverlay = ({
  route,
  strokeColor = Colors.primary,
  strokeWidth = 4,
  showWaypoints = true,
  showSteps = false,
  animated = true,
  onPress = () => {},
}) => {
  // ポリラインを座標配列にデコード
  const routeCoordinates = useMemo(() => {
    if (!route?.polyline) return [];
    
    try {
      return decode(route.polyline).map(([latitude, longitude]) => ({
        latitude,
        longitude,
      }));
    } catch (error) {
      console.error('ポリラインのデコードに失敗:', error);
      return [];
    }
  }, [route?.polyline]);

  // ステップごとの座標
  const stepCoordinates = useMemo(() => {
    if (!route?.steps || !showSteps) return [];
    
    return route.steps.map(step => {
      try {
        return decode(step.polyline).map(([latitude, longitude]) => ({
          latitude,
          longitude,
        }));
      } catch (error) {
        console.error('ステップポリラインのデコードに失敗:', error);
        return [];
      }
    }).filter(coords => coords.length > 0);
  }, [route?.steps, showSteps]);

  // 経由地のマーカー
  const waypointMarkers = useMemo(() => {
    if (!route?.steps || !showWaypoints) return [];
    
    return route.steps
      .filter((step, index) => index > 0 && index < route.steps.length - 1) // 最初と最後を除く
      .map((step, index) => ({
        id: `waypoint_${index}`,
        coordinate: {
          latitude: step.startLocation.lat,
          longitude: step.startLocation.lng,
        },
        instruction: step.instruction,
      }));
  }, [route?.steps, showWaypoints]);

  if (!route || routeCoordinates.length === 0) {
    return null;
  }

  return (
    <>
      {/* メインルートのポリライン */}
      <Polyline
        coordinates={routeCoordinates}
        strokeColor={strokeColor}
        strokeWidth={strokeWidth}
        onPress={() => onPress(route)}
        tappable={true}
        geodesic={true}
      />

      {/* ステップごとのポリライン（異なる色で表示） */}
      {showSteps && stepCoordinates.map((coords, index) => (
        <Polyline
          key={`step_${index}`}
          coordinates={coords}
          strokeColor={index % 2 === 0 ? Colors.secondary : Colors.tertiary}
          strokeWidth={2}
          lineDashPattern={[5, 5]}
          onPress={() => onPress(route, index)}
          tappable={true}
        />
      ))}

      {/* 経由地マーカー */}
      {waypointMarkers.map((waypoint) => (
        <Marker
          key={waypoint.id}
          coordinate={waypoint.coordinate}
          pinColor={Colors.accent}
          title="経由地"
          description={waypoint.instruction}
        />
      ))}
    </>
  );
};

export default React.memo(RouteOverlay);