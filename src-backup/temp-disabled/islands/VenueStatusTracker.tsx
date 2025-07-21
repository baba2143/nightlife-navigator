import { useState, useEffect, useRef } from "preact/hooks";
import { apply } from "twind";

interface VenueStatus {
  venueId: number;
  venueName: string;
  isOpen: boolean;
  crowdLevel: 'low' | 'medium' | 'high' | 'full';
  waitTime: number; // 待ち時間（分）
  lastUpdated: number;
  staffCount: number;
  specialEvents: string[];
  todayStats: {
    totalVisitors: number;
    averageStayTime: number; // 分
    peakHour: string;
    rating: number;
  };
  liveUpdates: {
    checkins: number; // 過去1時間のチェックイン数
    reviews: number; // 過去1時間のレビュー数
    photos: number; // 過去1時間の写真投稿数
  };
}

interface VenueStatusTrackerProps {
  venueId?: number;
  showAllVenues?: boolean;
  userId?: number;
  refreshInterval?: number; // 更新間隔（ミリ秒）
}

export default function VenueStatusTracker({
  venueId,
  showAllVenues = false,
  userId,
  refreshInterval = 30000, // 30秒
}: VenueStatusTrackerProps) {
  const [venueStatuses, setVenueStatuses] = useState<Map<number, VenueStatus>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<number | null>(venueId || null);
  const [loading, setLoading] = useState(true);
  
  const websocket = useRef<WebSocket | null>(null);

  useEffect(() => {
    connectWebSocket();
    loadInitialData();
    
    return () => {
      if (websocket.current) {
        websocket.current.close();
      }
    };
  }, [venueId, showAllVenues]);

  const connectWebSocket = () => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/websocket`;
      
      websocket.current = new WebSocket(wsUrl);

      websocket.current.onopen = () => {
        console.log('WebSocket connected for venue status');
        setIsConnected(true);

        // ユーザーIDを設定
        if (userId) {
          websocket.current?.send(JSON.stringify({
            action: 'set_user_id',
            userId: userId,
            timestamp: Date.now(),
          }));
        }

        // 店舗のWebSocketルームに参加
        if (venueId) {
          joinVenueRoom(venueId);
        } else if (showAllVenues) {
          // 全店舗の更新を受信
          websocket.current?.send(JSON.stringify({
            action: 'join_room',
            room: 'venue_updates',
            timestamp: Date.now(),
          }));
        }
      };

      websocket.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      websocket.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // 再接続の試行
        setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };

      websocket.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  };

  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'venue_update':
        handleVenueUpdate(message.data, message.venueId);
        break;
      case 'venue_checkin':
        handleVenueCheckin(message.data, message.venueId);
        break;
      case 'venue_review':
        handleVenueReview(message.data, message.venueId);
        break;
      case 'venue_photo':
        handleVenuePhoto(message.data, message.venueId);
        break;
    }
  };

  const handleVenueUpdate = (data: any, venueId: number) => {
    setVenueStatuses(prev => {
      const updated = new Map(prev);
      const currentStatus = updated.get(venueId);
      
      if (currentStatus) {
        updated.set(venueId, {
          ...currentStatus,
          ...data,
          lastUpdated: Date.now(),
        });
      }
      
      return updated;
    });
  };

  const handleVenueCheckin = (data: any, venueId: number) => {
    setVenueStatuses(prev => {
      const updated = new Map(prev);
      const currentStatus = updated.get(venueId);
      
      if (currentStatus) {
        updated.set(venueId, {
          ...currentStatus,
          liveUpdates: {
            ...currentStatus.liveUpdates,
            checkins: currentStatus.liveUpdates.checkins + 1,
          },
          todayStats: {
            ...currentStatus.todayStats,
            totalVisitors: currentStatus.todayStats.totalVisitors + 1,
          },
          lastUpdated: Date.now(),
        });
      }
      
      return updated;
    });
  };

  const handleVenueReview = (data: any, venueId: number) => {
    setVenueStatuses(prev => {
      const updated = new Map(prev);
      const currentStatus = updated.get(venueId);
      
      if (currentStatus) {
        updated.set(venueId, {
          ...currentStatus,
          liveUpdates: {
            ...currentStatus.liveUpdates,
            reviews: currentStatus.liveUpdates.reviews + 1,
          },
          lastUpdated: Date.now(),
        });
      }
      
      return updated;
    });
  };

  const handleVenuePhoto = (data: any, venueId: number) => {
    setVenueStatuses(prev => {
      const updated = new Map(prev);
      const currentStatus = updated.get(venueId);
      
      if (currentStatus) {
        updated.set(venueId, {
          ...currentStatus,
          liveUpdates: {
            ...currentStatus.liveUpdates,
            photos: currentStatus.liveUpdates.photos + 1,
          },
          lastUpdated: Date.now(),
        });
      }
      
      return updated;
    });
  };

  const joinVenueRoom = (venueId: number) => {
    if (websocket.current?.readyState === WebSocket.OPEN) {
      websocket.current.send(JSON.stringify({
        action: 'join_room',
        room: `venue_${venueId}`,
        timestamp: Date.now(),
      }));
    }
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      const endpoint = showAllVenues 
        ? '/api/venues/status'
        : `/api/venues/status?venueId=${venueId}`;
        
      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (data.success) {
        const statusMap = new Map<number, VenueStatus>();
        
        if (Array.isArray(data.venues)) {
          data.venues.forEach((venue: VenueStatus) => {
            statusMap.set(venue.venueId, venue);
          });
        } else if (data.venue) {
          statusMap.set(data.venue.venueId, data.venue);
        }
        
        setVenueStatuses(statusMap);
      }
    } catch (error) {
      console.error('Failed to load venue status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCrowdLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'full': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCrowdLevelLabel = (level: string) => {
    switch (level) {
      case 'low': return '空いている';
      case 'medium': return '普通';
      case 'high': return '混雑';
      case 'full': return '満席';
      default: return '不明';
    }
  };

  const formatLastUpdated = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'たった今';
    if (minutes < 60) return `${minutes}分前`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}時間前`;
    
    const days = Math.floor(hours / 24);
    return `${days}日前`;
  };

  if (loading) {
    return (
      <div class="flex items-center justify-center p-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-primary"></div>
        <span class="ml-2 text-gray-600">読み込み中...</span>
      </div>
    );
  }

  const venues = Array.from(venueStatuses.values());

  if (venues.length === 0) {
    return (
      <div class="text-center p-8 text-gray-500">
        <div class="text-3xl mb-2">🏪</div>
        <p>店舗情報が見つかりません</p>
      </div>
    );
  }

  return (
    <div class="space-y-6">
      {/* 接続状態インジケーター */}
      <div class="flex items-center gap-2 text-sm">
        <div class={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span class={isConnected ? 'text-green-600' : 'text-red-600'}>
          {isConnected ? 'リアルタイム更新中' : '接続中...'}
        </span>
      </div>

      {/* 店舗一覧 */}
      {venues.map((venue) => (
        <div key={venue.venueId} class={apply`card-soft hover:shadow-pink transition-all duration-200`}>
          {/* ヘッダー */}
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <h3 class={apply`text-lg font-heading font-semibold text-pink-primary`}>
                {venue.venueName}
              </h3>
              
              <div class={`px-2 py-1 rounded-full text-xs font-medium ${
                venue.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {venue.isOpen ? '営業中' : '営業時間外'}
              </div>
            </div>
            
            <div class="text-xs text-gray-500">
              更新: {formatLastUpdated(venue.lastUpdated)}
            </div>
          </div>

          {/* 混雑状況 */}
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div class="text-center">
              <div class={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getCrowdLevelColor(venue.crowdLevel)}`}>
                {getCrowdLevelLabel(venue.crowdLevel)}
              </div>
              <div class="text-xs text-gray-500 mt-1">混雑度</div>
            </div>
            
            <div class="text-center">
              <div class={apply`text-lg font-semibold text-pink-primary`}>
                {venue.waitTime}分
              </div>
              <div class="text-xs text-gray-500">待ち時間</div>
            </div>
            
            <div class="text-center">
              <div class={apply`text-lg font-semibold text-pink-primary`}>
                {venue.staffCount}人
              </div>
              <div class="text-xs text-gray-500">スタッフ</div>
            </div>
            
            <div class="text-center">
              <div class={apply`text-lg font-semibold text-pink-primary`}>
                {venue.todayStats.rating.toFixed(1)}★
              </div>
              <div class="text-xs text-gray-500">今日の評価</div>
            </div>
          </div>

          {/* 今日の統計 */}
          <div class="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 class={apply`font-semibold text-text-primary mb-3`}>今日の統計</h4>
            
            <div class="grid grid-cols-3 gap-4 text-center">
              <div>
                <div class={apply`text-xl font-bold text-pink-primary`}>
                  {venue.todayStats.totalVisitors}
                </div>
                <div class="text-xs text-gray-500">来店者数</div>
              </div>
              
              <div>
                <div class={apply`text-xl font-bold text-pink-primary`}>
                  {venue.todayStats.averageStayTime}分
                </div>
                <div class="text-xs text-gray-500">平均滞在時間</div>
              </div>
              
              <div>
                <div class={apply`text-xl font-bold text-pink-primary`}>
                  {venue.todayStats.peakHour}
                </div>
                <div class="text-xs text-gray-500">ピーク時間</div>
              </div>
            </div>
          </div>

          {/* ライブ活動 */}
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-1">
                <span class="text-green-600">✓</span>
                <span>{venue.liveUpdates.checkins} チェックイン</span>
              </div>
              
              <div class="flex items-center gap-1">
                <span class="text-blue-600">⭐</span>
                <span>{venue.liveUpdates.reviews} レビュー</span>
              </div>
              
              <div class="flex items-center gap-1">
                <span class="text-purple-600">📷</span>
                <span>{venue.liveUpdates.photos} 写真</span>
              </div>
            </div>
            
            <span class="text-gray-500">過去1時間</span>
          </div>

          {/* 特別イベント */}
          {venue.specialEvents.length > 0 && (
            <div class="mt-4 pt-4 border-t border-gray-200">
              <h5 class={apply`font-semibold text-text-primary mb-2`}>特別イベント</h5>
              <div class="space-y-1">
                {venue.specialEvents.map((event, index) => (
                  <div key={index} class="flex items-center gap-2">
                    <span class="text-yellow-500">🎉</span>
                    <span class="text-sm">{event}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* アクションボタン */}
          <div class="mt-4 pt-4 border-t border-gray-200 flex gap-2">
            <a 
              href={`/venues/${venue.venueId}`}
              class={apply`btn-pink-outline flex-1 text-center`}
            >
              詳細を見る
            </a>
            
            <button 
              onClick={() => {
                // チェックイン機能
                if (websocket.current?.readyState === WebSocket.OPEN) {
                  websocket.current.send(JSON.stringify({
                    action: 'venue_checkin',
                    venueId: venue.venueId,
                    data: {
                      userId: userId,
                      timestamp: Date.now(),
                    },
                    timestamp: Date.now(),
                  }));
                }
              }}
              class={apply`btn-pink`}
              disabled={!venue.isOpen || !isConnected}
            >
              チェックイン
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}