import { Handlers } from "$fresh/server.ts";

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
  createdAt: number;
  lastActivity: number;
}

// サンプルチャットデータ（実際の実装ではデータベースに保存）
const sampleChatRooms: Record<string, ChatRoom> = {
  'chat_1_2': {
    id: 'chat_1_2',
    name: '田中太郎との会話',
    type: 'direct',
    participants: [1, 2],
    createdAt: Date.now() - 24 * 60 * 60 * 1000, // 1日前
    lastActivity: Date.now() - 30 * 60 * 1000, // 30分前
  },
  'venue_1': {
    id: 'venue_1',
    name: 'GENTLE LOUNGE チャット',
    type: 'venue',
    participants: [1, 2, 3, 4, 5],
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 1週間前
    lastActivity: Date.now() - 5 * 60 * 1000, // 5分前
  },
  'group_nightlife': {
    id: 'group_nightlife',
    name: 'ナイトライフ愛好会',
    type: 'group',
    participants: [1, 2, 3, 4, 5, 6, 7, 8],
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 1ヶ月前
    lastActivity: Date.now() - 2 * 60 * 60 * 1000, // 2時間前
  },
};

const sampleMessages: Record<string, ChatMessage[]> = {
  'chat_1_2': [
    {
      id: 'msg_1',
      senderId: 2,
      senderName: '佐藤花子',
      message: 'こんにちは！今度一緒にGENTLE LOUNGEに行きませんか？',
      timestamp: Date.now() - 2 * 60 * 60 * 1000,
      type: 'text',
      status: 'delivered',
    },
    {
      id: 'msg_2',
      senderId: 1,
      senderName: '田中太郎',
      message: 'いいですね！いつ頃を考えていますか？',
      timestamp: Date.now() - 1.5 * 60 * 60 * 1000,
      type: 'text',
      status: 'delivered',
    },
    {
      id: 'msg_3',
      senderId: 2,
      senderName: '佐藤花子',
      message: '今度の金曜日の夜はどうでしょう？20時頃から。',
      timestamp: Date.now() - 1 * 60 * 60 * 1000,
      type: 'text',
      status: 'delivered',
    },
    {
      id: 'msg_4',
      senderId: 1,
      senderName: '田中太郎',
      message: '完璧です！予約しておきますね。',
      timestamp: Date.now() - 30 * 60 * 1000,
      type: 'text',
      status: 'delivered',
    },
  ],
  'venue_1': [
    {
      id: 'venue_msg_1',
      senderId: 0,
      senderName: 'システム',
      message: 'GENTLE LOUNGE チャットルームへようこそ！',
      timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000,
      type: 'system',
      status: 'delivered',
    },
    {
      id: 'venue_msg_2',
      senderId: 3,
      senderName: '山田次郎',
      message: '今日は混雑していますか？',
      timestamp: Date.now() - 2 * 60 * 60 * 1000,
      type: 'text',
      status: 'delivered',
    },
    {
      id: 'venue_msg_3',
      senderId: 4,
      senderName: '店舗スタッフ',
      message: '現在は中程度の混雑です。待ち時間は約15分程度です。',
      timestamp: Date.now() - 1.5 * 60 * 60 * 1000,
      type: 'text',
      status: 'delivered',
    },
    {
      id: 'venue_msg_4',
      senderId: 5,
      senderName: '鈴木三郎',
      message: '今夜はライブ演奏があるんですね！楽しみです。',
      timestamp: Date.now() - 1 * 60 * 60 * 1000,
      type: 'text',
      status: 'delivered',
    },
    {
      id: 'venue_msg_5',
      senderId: 1,
      senderName: '田中太郎',
      message: 'いい雰囲気ですね。写真をシェアします！',
      timestamp: Date.now() - 5 * 60 * 1000,
      type: 'image',
      status: 'delivered',
    },
  ],
  'group_nightlife': [
    {
      id: 'group_msg_1',
      senderId: 0,
      senderName: 'システム',
      message: 'ナイトライフ愛好会グループが作成されました！',
      timestamp: Date.now() - 30 * 24 * 60 * 60 * 1000,
      type: 'system',
      status: 'delivered',
    },
    {
      id: 'group_msg_2',
      senderId: 6,
      senderName: '高橋四郎',
      message: '皆さん、今度の土曜日にバーホッピングしませんか？',
      timestamp: Date.now() - 24 * 60 * 60 * 1000,
      type: 'text',
      status: 'delivered',
    },
    {
      id: 'group_msg_3',
      senderId: 7,
      senderName: '伊藤五郎',
      message: '参加したいです！どのエリアを考えていますか？',
      timestamp: Date.now() - 20 * 60 * 60 * 1000,
      type: 'text',
      status: 'delivered',
    },
    {
      id: 'group_msg_4',
      senderId: 8,
      senderName: '渡辺六郎',
      message: '渋谷エリアはどうでしょう？新しいバーもたくさんありますし。',
      timestamp: Date.now() - 18 * 60 * 60 * 1000,
      type: 'text',
      status: 'delivered',
    },
    {
      id: 'group_msg_5',
      senderId: 1,
      senderName: '田中太郎',
      message: 'いいアイデアですね！ルートを計画してみます。',
      timestamp: Date.now() - 2 * 60 * 60 * 1000,
      type: 'text',
      status: 'delivered',
    },
  ],
};

export const handler: Handlers = {
  async GET(req) {
    try {
      const url = new URL(req.url);
      const roomId = url.searchParams.get('roomId');
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      if (!roomId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'ルームIDが指定されていません'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // ルーム情報の取得
      const room = sampleChatRooms[roomId];
      if (!room) {
        return new Response(JSON.stringify({
          success: false,
          error: 'チャットルームが見つかりません'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // メッセージ履歴の取得
      const allMessages = sampleMessages[roomId] || [];
      const messages = allMessages
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(offset, offset + limit);

      return new Response(JSON.stringify({
        success: true,
        room,
        messages,
        total: allMessages.length,
        hasMore: offset + limit < allMessages.length,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error('Chat history API error:', error);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'チャット履歴の取得中にエラーが発生しました'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },

  async POST(req) {
    try {
      const body = await req.json();
      const { roomId, message, senderId, senderName, type = 'text' } = body;

      if (!roomId || !message || !senderId || !senderName) {
        return new Response(JSON.stringify({
          success: false,
          error: '必要なパラメータが不足しています'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // ルームの存在確認
      const room = sampleChatRooms[roomId];
      if (!room) {
        return new Response(JSON.stringify({
          success: false,
          error: 'チャットルームが見つかりません'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 新しいメッセージを作成
      const newMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        senderId,
        senderName,
        message,
        timestamp: Date.now(),
        type,
        status: 'delivered',
      };

      // メッセージを保存
      if (!sampleMessages[roomId]) {
        sampleMessages[roomId] = [];
      }
      sampleMessages[roomId].push(newMessage);

      // ルームの最終活動時間を更新
      room.lastActivity = Date.now();

      return new Response(JSON.stringify({
        success: true,
        message: newMessage,
        room,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error('Chat message save error:', error);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'メッセージの保存中にエラーが発生しました'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },

  async PUT(req) {
    try {
      const body = await req.json();
      const { action, roomId, userId, data } = body;

      if (!action || !roomId) {
        return new Response(JSON.stringify({
          success: false,
          error: '必要なパラメータが不足しています'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const room = sampleChatRooms[roomId];
      if (!room) {
        return new Response(JSON.stringify({
          success: false,
          error: 'チャットルームが見つかりません'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      let result = {};

      switch (action) {
        case 'join':
          // ルームに参加
          if (userId && !room.participants.includes(userId)) {
            room.participants.push(userId);
            
            // システムメッセージを追加
            const joinMessage: ChatMessage = {
              id: `join_${Date.now()}`,
              senderId: 0,
              senderName: 'システム',
              message: `${data.userName || 'ユーザー'}が参加しました`,
              timestamp: Date.now(),
              type: 'system',
              status: 'delivered',
            };
            
            if (!sampleMessages[roomId]) {
              sampleMessages[roomId] = [];
            }
            sampleMessages[roomId].push(joinMessage);
            
            result = { message: 'ルームに参加しました', joinMessage };
          }
          break;

        case 'leave':
          // ルームから退出
          if (userId) {
            room.participants = room.participants.filter(id => id !== userId);
            
            // システムメッセージを追加
            const leaveMessage: ChatMessage = {
              id: `leave_${Date.now()}`,
              senderId: 0,
              senderName: 'システム',
              message: `${data.userName || 'ユーザー'}が退出しました`,
              timestamp: Date.now(),
              type: 'system',
              status: 'delivered',
            };
            
            if (!sampleMessages[roomId]) {
              sampleMessages[roomId] = [];
            }
            sampleMessages[roomId].push(leaveMessage);
            
            result = { message: 'ルームから退出しました', leaveMessage };
          }
          break;

        case 'mark_read':
          // メッセージを既読にする（実際の実装では個別の既読状態を管理）
          result = { message: 'メッセージを既読にしました' };
          break;

        case 'delete_message':
          // メッセージを削除
          if (data.messageId) {
            const messages = sampleMessages[roomId] || [];
            const messageIndex = messages.findIndex(msg => msg.id === data.messageId);
            
            if (messageIndex !== -1) {
              messages.splice(messageIndex, 1);
              result = { message: 'メッセージが削除されました' };
            } else {
              return new Response(JSON.stringify({
                success: false,
                error: 'メッセージが見つかりません'
              }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
              });
            }
          }
          break;

        default:
          return new Response(JSON.stringify({
            success: false,
            error: '未対応のアクションです'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
      }

      room.lastActivity = Date.now();

      return new Response(JSON.stringify({
        success: true,
        room,
        ...result,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error('Chat room action error:', error);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'アクションの実行中にエラーが発生しました'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },

  async DELETE(req) {
    try {
      const url = new URL(req.url);
      const roomId = url.searchParams.get('roomId');

      if (!roomId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'ルームIDが指定されていません'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // ルームとメッセージを削除
      delete sampleChatRooms[roomId];
      delete sampleMessages[roomId];

      return new Response(JSON.stringify({
        success: true,
        message: 'チャットルームが削除されました'
      }), {
        headers: { 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error('Chat room delete error:', error);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'チャットルームの削除中にエラーが発生しました'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};