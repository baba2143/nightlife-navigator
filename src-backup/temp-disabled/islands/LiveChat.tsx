import { useState, useEffect, useRef } from "preact/hooks";
import { apply } from "twind";

interface ChatMessage {
  id: string;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  message: string;
  timestamp: number;
  type: 'text' | 'image' | 'system';
  status: 'sending' | 'sent' | 'delivered' | 'failed';
}

interface ChatRoom {
  id: string;
  name: string;
  type: 'direct' | 'venue' | 'group';
  participants: number[];
  lastMessage?: ChatMessage;
  unreadCount: number;
}

interface LiveChatProps {
  currentUserId: number;
  currentUserName: string;
  currentUserAvatar?: string;
  roomId?: string;
  roomType?: 'direct' | 'venue' | 'group';
  targetUserId?: number;
  venueId?: number;
  minimized?: boolean;
  onClose?: () => void;
}

export default function LiveChat({
  currentUserId,
  currentUserName,
  currentUserAvatar,
  roomId,
  roomType = 'direct',
  targetUserId,
  venueId,
  minimized = false,
  onClose
}: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState<number[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<string | null>(roomId || null);
  const [showRoomList, setShowRoomList] = useState(!roomId);
  const [isMinimized, setIsMinimized] = useState(minimized);
  
  const websocket = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket接続の初期化
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (websocket.current) {
        websocket.current.close();
      }
    };
  }, [currentUserId]);

  // メッセージリストの自動スクロール
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // アクティブルームが変更された時の処理
  useEffect(() => {
    if (activeRoom) {
      joinRoom(activeRoom);
      loadChatHistory(activeRoom);
    }
  }, [activeRoom]);

  const connectWebSocket = () => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/websocket`;
      
      websocket.current = new WebSocket(wsUrl);

      websocket.current.onopen = () => {
        console.log('WebSocket connected for chat');
        setIsConnected(true);

        // ユーザーIDを設定
        websocket.current?.send(JSON.stringify({
          action: 'set_user_id',
          userId: currentUserId,
          timestamp: Date.now(),
        }));

        // 既存のルームに参加
        if (activeRoom) {
          joinRoom(activeRoom);
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
      case 'chat':
        handleIncomingMessage(message.data);
        break;
      case 'typing':
        handleTypingIndicator(message.data);
        break;
      case 'user_joined':
        handleUserJoined(message.data);
        break;
      case 'user_left':
        handleUserLeft(message.data);
        break;
      case 'system':
        console.log('Chat system message:', message.data);
        break;
    }
  };

  const handleIncomingMessage = (data: any) => {
    const chatMessage: ChatMessage = {
      id: crypto.randomUUID(),
      senderId: data.senderId,
      senderName: data.senderName || 'ユーザー',
      senderAvatar: data.senderAvatar,
      message: data.message,
      timestamp: data.timestamp || Date.now(),
      type: data.type || 'text',
      status: 'delivered',
    };

    setMessages(prev => [...prev, chatMessage]);
    
    // 未読カウントの更新
    if (data.senderId !== currentUserId) {
      updateRoomUnreadCount(activeRoom, 1);
    }
  };

  const handleTypingIndicator = (data: any) => {
    if (data.userId !== currentUserId) {
      if (data.isTyping) {
        setIsTyping(prev => [...prev.filter(id => id !== data.userId), data.userId]);
      } else {
        setIsTyping(prev => prev.filter(id => id !== data.userId));
      }
    }
  };

  const handleUserJoined = (data: any) => {
    addSystemMessage(`${data.userName}が参加しました`);
  };

  const handleUserLeft = (data: any) => {
    addSystemMessage(`${data.userName}が退出しました`);
  };

  const addSystemMessage = (message: string) => {
    const systemMessage: ChatMessage = {
      id: crypto.randomUUID(),
      senderId: 0,
      senderName: 'システム',
      message,
      timestamp: Date.now(),
      type: 'system',
      status: 'delivered',
    };

    setMessages(prev => [...prev, systemMessage]);
  };

  const joinRoom = (roomId: string) => {
    if (websocket.current?.readyState === WebSocket.OPEN) {
      websocket.current.send(JSON.stringify({
        action: 'join_room',
        room: roomId,
        timestamp: Date.now(),
      }));
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !activeRoom || !isConnected) return;

    const messageId = crypto.randomUUID();
    const chatMessage: ChatMessage = {
      id: messageId,
      senderId: currentUserId,
      senderName: currentUserName,
      senderAvatar: currentUserAvatar,
      message: newMessage.trim(),
      timestamp: Date.now(),
      type: 'text',
      status: 'sending',
    };

    // ローカルに追加
    setMessages(prev => [...prev, chatMessage]);

    // WebSocketで送信
    if (websocket.current?.readyState === WebSocket.OPEN) {
      websocket.current.send(JSON.stringify({
        action: 'send_message',
        room: activeRoom,
        data: {
          messageId,
          message: newMessage.trim(),
          senderName: currentUserName,
          senderAvatar: currentUserAvatar,
          type: 'text',
        },
        timestamp: Date.now(),
      }));

      // 送信状態を更新
      setTimeout(() => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, status: 'sent' }
              : msg
          )
        );
      }, 100);
    } else {
      // 送信失敗
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, status: 'failed' }
            : msg
        )
      );
    }

    setNewMessage('');
    stopTyping();
  };

  const startTyping = () => {
    if (websocket.current?.readyState === WebSocket.OPEN && activeRoom) {
      websocket.current.send(JSON.stringify({
        action: 'typing',
        room: activeRoom,
        data: {
          userId: currentUserId,
          userName: currentUserName,
          isTyping: true,
        },
        timestamp: Date.now(),
      }));
    }

    // タイピング停止のタイマー
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  };

  const stopTyping = () => {
    if (websocket.current?.readyState === WebSocket.OPEN && activeRoom) {
      websocket.current.send(JSON.stringify({
        action: 'typing',
        room: activeRoom,
        data: {
          userId: currentUserId,
          userName: currentUserName,
          isTyping: false,
        },
        timestamp: Date.now(),
      }));
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const loadChatHistory = async (roomId: string) => {
    try {
      const response = await fetch(`/api/chat/history?roomId=${roomId}&limit=50`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessages(data.messages || []);
        }
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const updateRoomUnreadCount = (roomId: string | null, increment: number) => {
    if (!roomId) return;
    
    setRooms(prev => 
      prev.map(room => 
        room.id === roomId 
          ? { ...room, unreadCount: room.unreadCount + increment }
          : room
      )
    );
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'sending': return '⏳';
      case 'sent': return '✓';
      case 'delivered': return '✓✓';
      case 'failed': return '❌';
      default: return '';
    }
  };

  if (isMinimized) {
    return (
      <div class="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          class={apply`bg-pink-primary text-white rounded-full p-3 shadow-lg hover:bg-pink-primary-dark transition-colors`}
        >
          <div class="flex items-center gap-2">
            💬
            {messages.filter(m => m.senderId !== currentUserId).length > 0 && (
              <span class="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                新着
              </span>
            )}
          </div>
        </button>
      </div>
    );
  }

  return (
    <div class="fixed bottom-4 right-4 w-80 h-96 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col z-50">
      {/* ヘッダー */}
      <div class="flex items-center justify-between p-4 border-b border-gray-200 bg-pink-light rounded-t-lg">
        <div class="flex items-center gap-2">
          <div class={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <h3 class={apply`font-semibold text-pink-primary`}>
            {showRoomList ? 'チャット' : 'ライブチャット'}
          </h3>
        </div>
        
        <div class="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(true)}
            class="text-gray-500 hover:text-gray-700"
            title="最小化"
          >
            ➖
          </button>
          {onClose && (
            <button
              onClick={onClose}
              class="text-gray-500 hover:text-gray-700"
              title="閉じる"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {showRoomList ? (
        /* ルーム一覧 */
        <div class="flex-1 overflow-y-auto">
          <div class="p-4">
            <button
              onClick={() => {
                const newRoomId = `chat_${currentUserId}_${Date.now()}`;
                setActiveRoom(newRoomId);
                setShowRoomList(false);
              }}
              class={apply`btn-pink w-full mb-4`}
            >
              新しいチャットを開始
            </button>
          </div>
          
          <div class="space-y-2">
            {rooms.map(room => (
              <button
                key={room.id}
                onClick={() => {
                  setActiveRoom(room.id);
                  setShowRoomList(false);
                  updateRoomUnreadCount(room.id, -room.unreadCount);
                }}
                class="w-full p-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100"
              >
                <div class="flex items-center justify-between">
                  <span class={apply`font-medium text-text-primary`}>
                    {room.name}
                  </span>
                  {room.unreadCount > 0 && (
                    <span class="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                      {room.unreadCount}
                    </span>
                  )}
                </div>
                {room.lastMessage && (
                  <p class={apply`text-sm text-text-secondary truncate mt-1`}>
                    {room.lastMessage.message}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* チャット画面 */
        <>
          {/* メッセージエリア */}
          <div class="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                class={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
              >
                <div class={`max-w-[70%] ${
                  message.type === 'system' 
                    ? 'text-center text-gray-500 text-sm' 
                    : message.senderId === currentUserId
                      ? 'bg-pink-primary text-white rounded-lg p-3'
                      : 'bg-gray-100 text-gray-800 rounded-lg p-3'
                }`}>
                  {message.type !== 'system' && message.senderId !== currentUserId && (
                    <div class="text-xs text-gray-500 mb-1">
                      {message.senderName}
                    </div>
                  )}
                  
                  <div class="break-words">
                    {message.message}
                  </div>
                  
                  {message.type !== 'system' && (
                    <div class={`text-xs mt-1 flex items-center justify-end gap-1 ${
                      message.senderId === currentUserId ? 'text-pink-100' : 'text-gray-400'
                    }`}>
                      <span>{formatTime(message.timestamp)}</span>
                      {message.senderId === currentUserId && (
                        <span>{getMessageStatusIcon(message.status)}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* タイピングインジケーター */}
            {isTyping.length > 0 && (
              <div class="flex justify-start">
                <div class="bg-gray-100 rounded-lg p-3 text-gray-500">
                  <div class="flex items-center gap-1">
                    <div class="flex space-x-1">
                      <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s" />
                      <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s" />
                    </div>
                    <span class="text-xs ml-2">入力中...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* メッセージ入力エリア */}
          <div class="border-t border-gray-200 p-4">
            <div class="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.currentTarget.value);
                  startTyping();
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="メッセージを入力..."
                class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-primary focus:border-transparent"
                disabled={!isConnected}
              />
              
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || !isConnected}
                class={apply`px-4 py-2 bg-pink-primary text-white rounded-lg hover:bg-pink-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors`}
              >
                送信
              </button>
            </div>
            
            {!isConnected && (
              <div class="text-center text-red-500 text-sm mt-2">
                接続中です...
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}