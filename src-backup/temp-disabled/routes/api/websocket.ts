import { Handlers } from "$fresh/server.ts";
import { verifyToken, type AuthTokenPayload } from "../../utils/auth.ts";

interface WebSocketMessage {
  type: 'notification' | 'chat' | 'venue_update' | 'user_status' | 'system';
  data: any;
  timestamp: number;
  userId?: number;
  venueId?: number;
  room?: string;
}

interface ConnectedClient {
  socket: WebSocket;
  userId?: number;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  rooms: Set<string>;
  lastActivity: number;
  authenticated: boolean;
}

// グローバルな接続管理
const clients = new Map<string, ConnectedClient>();
const rooms = new Map<string, Set<string>>();

// ユーティリティ関数
function generateClientId(): string {
  return crypto.randomUUID();
}

function joinRoom(clientId: string, roomName: string) {
  const client = clients.get(clientId);
  if (!client) return;

  client.rooms.add(roomName);
  
  if (!rooms.has(roomName)) {
    rooms.set(roomName, new Set());
  }
  rooms.get(roomName)!.add(clientId);
  
  console.log(`Client ${clientId} joined room: ${roomName}`);
}

function leaveRoom(clientId: string, roomName: string) {
  const client = clients.get(clientId);
  if (client) {
    client.rooms.delete(roomName);
  }
  
  const room = rooms.get(roomName);
  if (room) {
    room.delete(clientId);
    if (room.size === 0) {
      rooms.delete(roomName);
    }
  }
  
  console.log(`Client ${clientId} left room: ${roomName}`);
}

function broadcastToRoom(roomName: string, message: WebSocketMessage, excludeClientId?: string) {
  const room = rooms.get(roomName);
  if (!room) return;

  const messageStr = JSON.stringify(message);
  
  room.forEach(clientId => {
    if (clientId === excludeClientId) return;
    
    const client = clients.get(clientId);
    if (client && client.socket.readyState === WebSocket.OPEN) {
      try {
        client.socket.send(messageStr);
      } catch (error) {
        console.error(`Failed to send message to client ${clientId}:`, error);
        // 送信失敗時は接続を削除
        removeClient(clientId);
      }
    }
  });
}

function broadcastToAll(message: WebSocketMessage, excludeClientId?: string) {
  const messageStr = JSON.stringify(message);
  
  clients.forEach((client, clientId) => {
    if (clientId === excludeClientId) return;
    
    if (client.socket.readyState === WebSocket.OPEN) {
      try {
        client.socket.send(messageStr);
      } catch (error) {
        console.error(`Failed to send message to client ${clientId}:`, error);
        removeClient(clientId);
      }
    }
  });
}

function sendToClient(clientId: string, message: WebSocketMessage) {
  const client = clients.get(clientId);
  if (!client || client.socket.readyState !== WebSocket.OPEN) {
    return false;
  }

  try {
    client.socket.send(JSON.stringify(message));
    return true;
  } catch (error) {
    console.error(`Failed to send message to client ${clientId}:`, error);
    removeClient(clientId);
    return false;
  }
}

function removeClient(clientId: string) {
  const client = clients.get(clientId);
  if (!client) return;

  // すべてのルームから削除
  client.rooms.forEach(roomName => {
    leaveRoom(clientId, roomName);
  });

  // クライアント削除
  clients.delete(clientId);
  
  console.log(`Removed client: ${clientId}`);
}

// 定期的な接続チェック
setInterval(() => {
  const now = Date.now();
  const timeout = 5 * 60 * 1000; // 5分

  clients.forEach((client, clientId) => {
    if (now - client.lastActivity > timeout) {
      console.log(`Client ${clientId} timed out`);
      removeClient(clientId);
    }
  });
}, 60 * 1000); // 1分ごとにチェック

export const handler: Handlers = {
  GET(req) {
    const url = new URL(req.url);
    
    // WebSocket接続のアップグレード
    if (req.headers.get("upgrade") !== "websocket") {
      return new Response("WebSocket connection required", { status: 400 });
    }

    const { socket, response } = Deno.upgradeWebSocket(req);
    const clientId = generateClientId();

    // 接続時の処理
    socket.onopen = () => {
      console.log(`WebSocket connected: ${clientId}`);
      
      const client: ConnectedClient = {
        socket,
        rooms: new Set(),
        lastActivity: Date.now(),
        authenticated: false,
      };
      
      clients.set(clientId, client);

      // 接続確認メッセージ
      const welcomeMessage: WebSocketMessage = {
        type: 'system',
        data: {
          message: 'WebSocket接続が確立されました',
          clientId,
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
      };
      
      sendToClient(clientId, welcomeMessage);
    };

    // メッセージ受信時の処理
    socket.onmessage = (event) => {
      const client = clients.get(clientId);
      if (!client) return;

      client.lastActivity = Date.now();

      try {
        const message = JSON.parse(event.data) as WebSocketMessage & {
          action?: string;
          room?: string;
          targetUserId?: number;
        };

        console.log(`Received message from ${clientId}:`, message);

        switch (message.action) {
          case 'authenticate':
            // 認証処理
            if (message.token) {
              try {
                const payload = await verifyToken(message.token);
                if (payload) {
                  client.userId = payload.userId;
                  client.userEmail = payload.email;
                  client.userName = payload.name;
                  client.userRole = payload.role;
                  client.authenticated = true;
                  
                  console.log(`Client ${clientId} authenticated as user ${payload.userId} (${payload.email})`);
                  
                  const authSuccess: WebSocketMessage = {
                    type: 'system',
                    data: {
                      message: '認証に成功しました',
                      authenticated: true,
                      user: {
                        id: payload.userId,
                        email: payload.email,
                        name: payload.name,
                        role: payload.role,
                      },
                    },
                    timestamp: Date.now(),
                  };
                  sendToClient(clientId, authSuccess);
                } else {
                  const authFailed: WebSocketMessage = {
                    type: 'system',
                    data: {
                      message: '認証に失敗しました',
                      authenticated: false,
                      error: 'Invalid token',
                    },
                    timestamp: Date.now(),
                  };
                  sendToClient(clientId, authFailed);
                }
              } catch (error) {
                console.error('WebSocket authentication error:', error);
                const authError: WebSocketMessage = {
                  type: 'system',
                  data: {
                    message: '認証エラーが発生しました',
                    authenticated: false,
                    error: error.message,
                  },
                  timestamp: Date.now(),
                };
                sendToClient(clientId, authError);
              }
            }
            break;

          case 'join_room':
            if (message.room) {
              // 認証が必要なルームかチェック
              const requiresAuth = !message.room.startsWith('public_');
              
              if (requiresAuth && !client.authenticated) {
                const authRequired: WebSocketMessage = {
                  type: 'system',
                  data: {
                    message: 'このルームに参加するには認証が必要です',
                    error: 'Authentication required',
                  },
                  timestamp: Date.now(),
                };
                sendToClient(clientId, authRequired);
                break;
              }
              
              joinRoom(clientId, message.room);
              
              // ルーム参加通知
              const joinNotification: WebSocketMessage = {
                type: 'system',
                data: {
                  message: `ルーム「${message.room}」に参加しました`,
                  room: message.room,
                },
                timestamp: Date.now(),
              };
              sendToClient(clientId, joinNotification);
            }
            break;

          case 'leave_room':
            if (message.room) {
              leaveRoom(clientId, message.room);
              
              // ルーム退出通知
              const leaveNotification: WebSocketMessage = {
                type: 'system',
                data: {
                  message: `ルーム「${message.room}」から退出しました`,
                  room: message.room,
                },
                timestamp: Date.now(),
              };
              sendToClient(clientId, leaveNotification);
            }
            break;

          case 'set_user_id':
            // 後方互換性のため残すが、authenticateアクションの使用を推奨
            if (message.userId) {
              client.userId = message.userId;
              console.log(`Client ${clientId} set userId: ${message.userId} (legacy method)`);
            }
            break;

          case 'send_message':
            // チャットメッセージの処理
            if (!client.authenticated) {
              const authRequired: WebSocketMessage = {
                type: 'system',
                data: {
                  message: 'メッセージを送信するには認証が必要です',
                  error: 'Authentication required',
                },
                timestamp: Date.now(),
              };
              sendToClient(clientId, authRequired);
              break;
            }
            
            if (message.room) {
              const chatMessage: WebSocketMessage = {
                type: 'chat',
                data: {
                  ...message.data,
                  senderId: client.userId,
                  senderName: client.userName || 'ユーザー',
                  senderEmail: client.userEmail,
                  senderClientId: clientId,
                },
                timestamp: Date.now(),
                userId: client.userId,
              };
              
              broadcastToRoom(message.room, chatMessage, clientId);
            }
            break;

          case 'send_notification':
            // 通知の処理
            if (message.targetUserId) {
              // 特定ユーザーへの通知
              const targetClient = Array.from(clients.entries())
                .find(([_, client]) => client.userId === message.targetUserId);
              
              if (targetClient) {
                const notification: WebSocketMessage = {
                  type: 'notification',
                  data: message.data,
                  timestamp: Date.now(),
                  userId: message.targetUserId,
                };
                
                sendToClient(targetClient[0], notification);
              }
            } else if (message.room) {
              // ルーム内への通知
              const notification: WebSocketMessage = {
                type: 'notification',
                data: message.data,
                timestamp: Date.now(),
              };
              
              broadcastToRoom(message.room, notification, clientId);
            } else {
              // 全体通知
              const notification: WebSocketMessage = {
                type: 'notification',
                data: message.data,
                timestamp: Date.now(),
              };
              
              broadcastToAll(notification, clientId);
            }
            break;

          case 'venue_update':
            // 店舗情報更新の処理
            if (message.venueId) {
              const venueRoom = `venue_${message.venueId}`;
              const updateMessage: WebSocketMessage = {
                type: 'venue_update',
                data: message.data,
                timestamp: Date.now(),
                venueId: message.venueId,
              };
              
              broadcastToRoom(venueRoom, updateMessage, clientId);
            }
            break;

          case 'ping':
            // ハートビート
            const pongMessage: WebSocketMessage = {
              type: 'system',
              data: { message: 'pong' },
              timestamp: Date.now(),
            };
            sendToClient(clientId, pongMessage);
            break;

          default:
            console.log(`Unknown action: ${message.action}`);
        }
      } catch (error) {
        console.error(`Error processing message from ${clientId}:`, error);
        
        const errorMessage: WebSocketMessage = {
          type: 'system',
          data: {
            error: 'メッセージの処理中にエラーが発生しました',
            details: error.message,
          },
          timestamp: Date.now(),
        };
        
        sendToClient(clientId, errorMessage);
      }
    };

    // 接続終了時の処理
    socket.onclose = () => {
      console.log(`WebSocket disconnected: ${clientId}`);
      removeClient(clientId);
    };

    // エラー処理
    socket.onerror = (error) => {
      console.error(`WebSocket error for ${clientId}:`, error);
      removeClient(clientId);
    };

    return response;
  },
};

// 外部からのメッセージ送信API用のエクスポート関数
export const WebSocketManager = {
  // 特定ユーザーに通知を送信
  sendNotificationToUser(userId: number, notification: any) {
    const targetClient = Array.from(clients.entries())
      .find(([_, client]) => client.userId === userId);
    
    if (targetClient) {
      const message: WebSocketMessage = {
        type: 'notification',
        data: notification,
        timestamp: Date.now(),
        userId,
      };
      
      return sendToClient(targetClient[0], message);
    }
    
    return false;
  },

  // ルームに通知を送信
  sendNotificationToRoom(roomName: string, notification: any) {
    const message: WebSocketMessage = {
      type: 'notification',
      data: notification,
      timestamp: Date.now(),
      room: roomName,
    };
    
    broadcastToRoom(roomName, message);
  },

  // 店舗更新情報を送信
  sendVenueUpdate(venueId: number, updateData: any) {
    const venueRoom = `venue_${venueId}`;
    const message: WebSocketMessage = {
      type: 'venue_update',
      data: updateData,
      timestamp: Date.now(),
      venueId,
    };
    
    broadcastToRoom(venueRoom, message);
  },

  // 全体通知を送信
  sendGlobalNotification(notification: any) {
    const message: WebSocketMessage = {
      type: 'notification',
      data: notification,
      timestamp: Date.now(),
    };
    
    broadcastToAll(message);
  },

  // 接続統計情報を取得
  getStats() {
    return {
      totalClients: clients.size,
      totalRooms: rooms.size,
      roomDetails: Array.from(rooms.entries()).map(([name, clientIds]) => ({
        name,
        clientCount: clientIds.size,
      })),
    };
  },
};