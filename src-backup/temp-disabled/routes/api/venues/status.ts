import { Handlers } from "$fresh/server.ts";
import { WebSocketManager } from "../websocket.ts";

interface VenueStatus {
  venueId: number;
  venueName: string;
  isOpen: boolean;
  crowdLevel: 'low' | 'medium' | 'high' | 'full';
  waitTime: number;
  lastUpdated: number;
  staffCount: number;
  specialEvents: string[];
  todayStats: {
    totalVisitors: number;
    averageStayTime: number;
    peakHour: string;
    rating: number;
  };
  liveUpdates: {
    checkins: number;
    reviews: number;
    photos: number;
  };
}

// サンプル店舗データ（実際の実装ではデータベースから取得）
const sampleVenueStatuses: Record<number, VenueStatus> = {
  1: {
    venueId: 1,
    venueName: "GENTLE LOUNGE",
    isOpen: true,
    crowdLevel: 'medium',
    waitTime: 15,
    lastUpdated: Date.now(),
    staffCount: 8,
    specialEvents: ["ハッピーアワー（18:00-20:00）", "ライブ演奏（21:00-22:00）"],
    todayStats: {
      totalVisitors: 87,
      averageStayTime: 125,
      peakHour: "21:00",
      rating: 4.8,
    },
    liveUpdates: {
      checkins: 12,
      reviews: 3,
      photos: 8,
    },
  },
  2: {
    venueId: 2,
    venueName: "NEON BAR",
    isOpen: true,
    crowdLevel: 'high',
    waitTime: 25,
    lastUpdated: Date.now(),
    staffCount: 6,
    specialEvents: ["カクテルフェア開催中"],
    todayStats: {
      totalVisitors: 134,
      averageStayTime: 95,
      peakHour: "20:30",
      rating: 4.5,
    },
    liveUpdates: {
      checkins: 18,
      reviews: 5,
      photos: 12,
    },
  },
  3: {
    venueId: 3,
    venueName: "TOKYO DINING",
    isOpen: false,
    crowdLevel: 'low',
    waitTime: 0,
    lastUpdated: Date.now(),
    staffCount: 4,
    specialEvents: [],
    todayStats: {
      totalVisitors: 45,
      averageStayTime: 180,
      peakHour: "19:00",
      rating: 4.3,
    },
    liveUpdates: {
      checkins: 0,
      reviews: 1,
      photos: 2,
    },
  },
};

export const handler: Handlers = {
  async GET(req) {
    try {
      const url = new URL(req.url);
      const venueId = url.searchParams.get('venueId');

      // 特定の店舗の状況を取得
      if (venueId) {
        const id = parseInt(venueId);
        const venue = sampleVenueStatuses[id];
        
        if (!venue) {
          return new Response(JSON.stringify({
            success: false,
            error: '店舗が見つかりません'
          }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({
          success: true,
          venue,
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 全店舗の状況を取得
      const venues = Object.values(sampleVenueStatuses);
      
      return new Response(JSON.stringify({
        success: true,
        venues,
        total: venues.length,
        lastUpdated: Date.now(),
      }), {
        headers: { 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error('Venue status API error:', error);
      
      return new Response(JSON.stringify({
        success: false,
        error: '店舗状況の取得中にエラーが発生しました'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },

  async POST(req) {
    try {
      const body = await req.json();
      const { venueId, updates } = body;

      if (!venueId) {
        return new Response(JSON.stringify({
          success: false,
          error: '店舗IDが指定されていません'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 店舗状況の更新
      const currentStatus = sampleVenueStatuses[venueId];
      if (!currentStatus) {
        return new Response(JSON.stringify({
          success: false,
          error: '店舗が見つかりません'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 更新データを適用
      const updatedStatus = {
        ...currentStatus,
        ...updates,
        lastUpdated: Date.now(),
      };

      sampleVenueStatuses[venueId] = updatedStatus;

      // WebSocketで更新を通知
      WebSocketManager.sendVenueUpdate(venueId, {
        ...updates,
        venueName: updatedStatus.venueName,
        message: `${updatedStatus.venueName}の情報が更新されました`,
      });

      return new Response(JSON.stringify({
        success: true,
        venue: updatedStatus,
        message: '店舗情報が更新されました'
      }), {
        headers: { 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error('Venue status update error:', error);
      
      return new Response(JSON.stringify({
        success: false,
        error: '店舗情報の更新中にエラーが発生しました'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },

  async PUT(req) {
    try {
      const body = await req.json();
      const { venueId, action, data } = body;

      if (!venueId || !action) {
        return new Response(JSON.stringify({
          success: false,
          error: '必要なパラメータが不足しています'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const venue = sampleVenueStatuses[venueId];
      if (!venue) {
        return new Response(JSON.stringify({
          success: false,
          error: '店舗が見つかりません'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      let updateMessage = '';
      let notificationData = {};

      switch (action) {
        case 'checkin':
          // チェックイン処理
          venue.liveUpdates.checkins += 1;
          venue.todayStats.totalVisitors += 1;
          updateMessage = 'チェックインが記録されました';
          
          // リアルタイム更新を送信
          WebSocketManager.sendVenueUpdate(venueId, {
            type: 'checkin',
            venueName: venue.venueName,
            message: `${venue.venueName}に新しいチェックインがありました`,
            liveUpdates: venue.liveUpdates,
            todayStats: venue.todayStats,
          });
          break;

        case 'review':
          // レビュー投稿処理
          venue.liveUpdates.reviews += 1;
          if (data.rating) {
            // 評価の再計算（簡易版）
            const currentRating = venue.todayStats.rating;
            const newRating = (currentRating + data.rating) / 2;
            venue.todayStats.rating = Math.round(newRating * 10) / 10;
          }
          updateMessage = 'レビューが投稿されました';
          
          WebSocketManager.sendVenueUpdate(venueId, {
            type: 'review',
            venueName: venue.venueName,
            message: `${venue.venueName}に新しいレビューが投稿されました`,
            liveUpdates: venue.liveUpdates,
            todayStats: venue.todayStats,
          });
          break;

        case 'photo':
          // 写真投稿処理
          venue.liveUpdates.photos += 1;
          updateMessage = '写真が投稿されました';
          
          WebSocketManager.sendVenueUpdate(venueId, {
            type: 'photo',
            venueName: venue.venueName,
            message: `${venue.venueName}に新しい写真が投稿されました`,
            liveUpdates: venue.liveUpdates,
          });
          break;

        case 'update_crowd':
          // 混雑状況更新
          if (data.crowdLevel) {
            venue.crowdLevel = data.crowdLevel;
          }
          if (data.waitTime !== undefined) {
            venue.waitTime = data.waitTime;
          }
          updateMessage = '混雑状況が更新されました';
          
          WebSocketManager.sendVenueUpdate(venueId, {
            type: 'crowd_update',
            venueName: venue.venueName,
            message: `${venue.venueName}の混雑状況が更新されました`,
            crowdLevel: venue.crowdLevel,
            waitTime: venue.waitTime,
          });
          break;

        case 'toggle_open':
          // 営業状況の切り替え
          venue.isOpen = !venue.isOpen;
          updateMessage = venue.isOpen ? '営業を開始しました' : '営業を終了しました';
          
          WebSocketManager.sendVenueUpdate(venueId, {
            type: 'open_status',
            venueName: venue.venueName,
            message: `${venue.venueName}が${venue.isOpen ? '営業を開始' : '営業を終了'}しました`,
            isOpen: venue.isOpen,
          });
          break;

        case 'add_event':
          // イベント追加
          if (data.event) {
            venue.specialEvents.push(data.event);
            updateMessage = 'イベントが追加されました';
            
            WebSocketManager.sendVenueUpdate(venueId, {
              type: 'event_added',
              venueName: venue.venueName,
              message: `${venue.venueName}で新しいイベントが開始されました: ${data.event}`,
              specialEvents: venue.specialEvents,
            });
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

      venue.lastUpdated = Date.now();

      return new Response(JSON.stringify({
        success: true,
        venue,
        message: updateMessage
      }), {
        headers: { 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error('Venue action error:', error);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'アクションの実行中にエラーが発生しました'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};