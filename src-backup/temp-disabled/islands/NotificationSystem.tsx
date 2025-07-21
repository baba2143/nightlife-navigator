import { useState, useEffect, useRef } from "preact/hooks";
import { apply } from "twind";

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'chat' | 'venue_update';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  avatarUrl?: string;
  venueId?: number;
  userId?: number;
}

interface NotificationSystemProps {
  userId?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxNotifications?: number;
  autoHideDelay?: number;
  enableSound?: boolean;
}

export default function NotificationSystem({
  userId,
  position = 'top-right',
  maxNotifications = 5,
  autoHideDelay = 5000,
  enableSound = true
}: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const websocket = useRef<WebSocket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // WebSocket接続の初期化
  useEffect(() => {
    connectWebSocket();
    
    // 通知音の準備
    if (enableSound) {
      audioRef.current = new Audio('/notification-sound.mp3');
      audioRef.current.volume = 0.5;
    }

    return () => {
      if (websocket.current) {
        websocket.current.close();
      }
    };
  }, [userId]);

  const connectWebSocket = () => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/websocket`;
      
      websocket.current = new WebSocket(wsUrl);

      websocket.current.onopen = () => {
        console.log('WebSocket connected for notifications');
        setIsConnected(true);

        // ユーザーIDを設定
        if (userId) {
          websocket.current?.send(JSON.stringify({
            action: 'set_user_id',
            userId: userId,
            timestamp: Date.now(),
          }));
        }

        // 通知ルームに参加
        websocket.current?.send(JSON.stringify({
          action: 'join_room',
          room: `user_${userId || 'guest'}`,
          timestamp: Date.now(),
        }));

        // グローバル通知ルームに参加
        websocket.current?.send(JSON.stringify({
          action: 'join_room',
          room: 'global_notifications',
          timestamp: Date.now(),
        }));
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
      case 'notification':
        addNotification(message.data);
        break;
      case 'chat':
        handleChatMessage(message.data);
        break;
      case 'venue_update':
        handleVenueUpdate(message.data, message.venueId);
        break;
      case 'system':
        // システムメッセージは通知として表示しない
        console.log('System message:', message.data);
        break;
    }
  };

  const addNotification = (data: any) => {
    const notification: Notification = {
      id: crypto.randomUUID(),
      type: data.type || 'info',
      title: data.title || '通知',
      message: data.message || '',
      timestamp: Date.now(),
      read: false,
      actionUrl: data.actionUrl,
      actionLabel: data.actionLabel,
      avatarUrl: data.avatarUrl,
      venueId: data.venueId,
      userId: data.userId,
    };

    setNotifications(prev => {
      const updated = [notification, ...prev].slice(0, maxNotifications);
      return updated;
    });

    setUnreadCount(prev => prev + 1);

    // 通知音を再生
    if (enableSound && audioRef.current) {
      audioRef.current.play().catch(console.error);
    }

    // 自動非表示
    if (autoHideDelay > 0) {
      setTimeout(() => {
        removeNotification(notification.id);
      }, autoHideDelay);
    }
  };

  const handleChatMessage = (data: any) => {
    // チャットメッセージを通知として表示
    if (data.senderId !== userId) {
      addNotification({
        type: 'chat',
        title: `${data.senderName || 'ユーザー'}からのメッセージ`,
        message: data.message,
        actionUrl: `/chat/${data.senderId}`,
        actionLabel: '返信する',
        avatarUrl: data.senderAvatar,
        userId: data.senderId,
      });
    }
  };

  const handleVenueUpdate = (data: any, venueId: number) => {
    addNotification({
      type: 'venue_update',
      title: '店舗情報が更新されました',
      message: data.message || `${data.venueName || '店舗'}の情報が更新されました`,
      actionUrl: `/venues/${venueId}`,
      actionLabel: '詳細を見る',
      venueId,
    });
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === id ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: string) => {
    const icons = {
      info: '💙',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      chat: '💬',
      venue_update: '🏪',
    };
    return icons[type as keyof typeof icons] || '📢';
  };

  const getNotificationColor = (type: string) => {
    const colors = {
      info: 'border-blue-200 bg-blue-50',
      success: 'border-green-200 bg-green-50',
      warning: 'border-yellow-200 bg-yellow-50',
      error: 'border-red-200 bg-red-50',
      chat: 'border-pink-200 bg-pink-50',
      venue_update: 'border-purple-200 bg-purple-50',
    };
    return colors[type as keyof typeof colors] || 'border-gray-200 bg-gray-50';
  };

  const getPositionClasses = () => {
    const positions = {
      'top-right': 'top-20 right-4',
      'top-left': 'top-20 left-4',
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4',
    };
    return positions[position];
  };

  return (
    <>
      {/* 通知ベル */}
      <div class="relative">
        <button
          onClick={() => setShowPanel(!showPanel)}
          class={apply`relative p-2 rounded-full hover:bg-pink-light transition-colors ${
            unreadCount > 0 ? 'text-pink-primary' : 'text-gray-600'
          }`}
          title="通知"
        >
          🔔
          
          {/* 未読数バッジ */}
          {unreadCount > 0 && (
            <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}

          {/* 接続状態インジケーター */}
          <span 
            class={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
            title={isConnected ? '接続中' : '未接続'}
          />
        </button>

        {/* 通知パネル */}
        {showPanel && (
          <div class="absolute top-full right-0 mt-2 w-80 max-h-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
            {/* ヘッダー */}
            <div class="px-4 py-3 border-b border-gray-200 bg-pink-light">
              <div class="flex items-center justify-between">
                <h3 class={apply`font-semibold text-pink-primary`}>
                  通知 {unreadCount > 0 && `(${unreadCount})`}
                </h3>
                <div class="flex gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      class="text-xs text-pink-primary hover:text-pink-primary-dark"
                    >
                      すべて既読
                    </button>
                  )}
                  <button
                    onClick={clearAllNotifications}
                    class="text-xs text-gray-500 hover:text-gray-700"
                  >
                    クリア
                  </button>
                </div>
              </div>
            </div>

            {/* 通知リスト */}
            <div class="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div class="p-8 text-center text-gray-500">
                  <div class="text-3xl mb-2">🔕</div>
                  <p>新しい通知はありません</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    class={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div class="flex items-start gap-3">
                      <div class="text-xl">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between mb-1">
                          <h4 class={apply`font-medium text-sm text-text-primary truncate`}>
                            {notification.title}
                          </h4>
                          <button
                            onClick={() => removeNotification(notification.id)}
                            class="text-gray-400 hover:text-gray-600 text-xs"
                          >
                            ×
                          </button>
                        </div>
                        
                        <p class={apply`text-sm text-text-secondary mb-2 line-clamp-2`}>
                          {notification.message}
                        </p>
                        
                        <div class="flex items-center justify-between">
                          <span class="text-xs text-gray-400">
                            {new Date(notification.timestamp).toLocaleTimeString('ja-JP', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          
                          <div class="flex gap-2">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                class="text-xs text-pink-primary hover:text-pink-primary-dark"
                              >
                                既読
                              </button>
                            )}
                            
                            {notification.actionUrl && (
                              <a
                                href={notification.actionUrl}
                                class="text-xs text-pink-primary hover:text-pink-primary-dark"
                                onClick={() => markAsRead(notification.id)}
                              >
                                {notification.actionLabel || '詳細'}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* フローティング通知 */}
      <div class={`fixed ${getPositionClasses()} space-y-2 z-50 pointer-events-none`}>
        {notifications.slice(0, 3).map((notification) => (
          <div
            key={notification.id}
            class={`${getNotificationColor(notification.type)} border rounded-lg p-4 shadow-lg max-w-sm pointer-events-auto transform transition-all duration-300 animate-slide-in`}
          >
            <div class="flex items-start gap-3">
              <div class="text-lg">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div class="flex-1 min-w-0">
                <h4 class={apply`font-medium text-sm text-text-primary mb-1`}>
                  {notification.title}
                </h4>
                
                <p class={apply`text-sm text-text-secondary mb-2 line-clamp-2`}>
                  {notification.message}
                </p>
                
                <div class="flex items-center justify-between">
                  {notification.actionUrl && (
                    <a
                      href={notification.actionUrl}
                      class="text-xs text-pink-primary hover:text-pink-primary-dark"
                      onClick={() => markAsRead(notification.id)}
                    >
                      {notification.actionLabel || '詳細'}
                    </a>
                  )}
                  
                  <button
                    onClick={() => removeNotification(notification.id)}
                    class="text-xs text-gray-500 hover:text-gray-700"
                  >
                    閉じる
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* アニメーション用CSS */}
      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        
        .line-clamp-2 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
      `}</style>
    </>
  );
}