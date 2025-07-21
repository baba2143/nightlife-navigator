import { Handlers } from "$fresh/server.ts";
import { initDatabase, getDatabase } from "../../../utils/database.ts";

interface ErrorReport {
  errorId: string;
  timestamp: string;
  userAgent: string;
  url: string;
  referrer?: string;
  errorMessage?: string;
  errorStack?: string;
  userId?: number;
  sessionId?: string;
  additionalData?: Record<string, any>;
}

export const handler: Handlers = {
  async POST(req) {
    try {
      // データベース初期化
      await initDatabase();
      const db = getDatabase();

      const body = await req.json() as ErrorReport;
      const {
        errorId,
        timestamp,
        userAgent,
        url,
        referrer,
        errorMessage,
        errorStack,
        userId,
        sessionId,
        additionalData,
      } = body;

      // 必須フィールドの検証
      if (!errorId || !timestamp || !userAgent || !url) {
        return new Response(JSON.stringify({
          success: false,
          error: "必須フィールドが不足しています",
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // エラーレポートをデータベースに保存
      const insertStmt = db.prepare(`
        INSERT INTO error_logs (
          error_id, timestamp, user_agent, url, referrer, 
          error_message, error_stack, user_id, session_id, 
          additional_data, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `);

      insertStmt.run(
        errorId,
        timestamp,
        userAgent,
        url,
        referrer || null,
        errorMessage || null,
        errorStack || null,
        userId || null,
        sessionId || null,
        additionalData ? JSON.stringify(additionalData) : null
      );

      // エラー統計の更新
      const today = new Date().toISOString().split('T')[0];
      const updateStatsStmt = db.prepare(`
        INSERT OR REPLACE INTO error_statistics (
          date, error_count, updated_at
        ) VALUES (
          ?, 
          COALESCE((SELECT error_count FROM error_statistics WHERE date = ?), 0) + 1,
          datetime('now')
        )
      `);
      
      updateStatsStmt.run(today, today);

      // 重要なエラーの場合は通知フラグを設定
      const isCritical = errorMessage?.toLowerCase().includes('database') ||
                        errorMessage?.toLowerCase().includes('auth') ||
                        url.includes('/api/');

      if (isCritical) {
        // 重要なエラーログに記録
        console.error(`Critical Error Reported: ${errorId}`, {
          url,
          errorMessage,
          timestamp,
        });

        // TODO: 実際の本番環境では、Slack通知やメール送信などを実装
        // await sendCriticalErrorNotification(body);
      }

      return new Response(JSON.stringify({
        success: true,
        message: "エラーレポートが記録されました",
        reportId: errorId,
        isCritical,
      }), {
        headers: { "Content-Type": "application/json" },
      });

    } catch (error) {
      console.error("Error reporting failed:", error);
      
      return new Response(JSON.stringify({
        success: false,
        error: "エラーレポートの記録に失敗しました",
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  async GET(req) {
    try {
      // 管理者専用：エラーログの閲覧機能
      const url = new URL(req.url);
      const action = url.searchParams.get("action");
      const limit = parseInt(url.searchParams.get("limit") || "50");
      const offset = parseInt(url.searchParams.get("offset") || "0");
      const severity = url.searchParams.get("severity");
      const dateFrom = url.searchParams.get("dateFrom");
      const dateTo = url.searchParams.get("dateTo");

      await initDatabase();
      const db = getDatabase();

      // TODO: 管理者認証を追加
      // const { getUserFromRequest } = await import("../../../utils/auth.ts");
      // const user = await getUserFromRequest(req);
      // if (!user || user.role !== 'admin') {
      //   return new Response(JSON.stringify({
      //     success: false,
      //     error: "管理者権限が必要です"
      //   }), { status: 403, headers: { "Content-Type": "application/json" } });
      // }

      if (action === "stats") {
        // エラー統計の取得
        const stats = db.prepare(`
          SELECT 
            date,
            error_count,
            updated_at
          FROM error_statistics 
          ORDER BY date DESC 
          LIMIT 30
        `).all();

        const recentErrors = db.prepare(`
          SELECT 
            COUNT(*) as total_errors,
            COUNT(DISTINCT url) as affected_pages,
            COUNT(DISTINCT user_agent) as unique_browsers
          FROM error_logs 
          WHERE datetime(timestamp) >= datetime('now', '-24 hours')
        `).get();

        const topErrors = db.prepare(`
          SELECT 
            error_message,
            COUNT(*) as count,
            url,
            MAX(timestamp) as last_occurrence
          FROM error_logs 
          WHERE error_message IS NOT NULL
            AND datetime(timestamp) >= datetime('now', '-7 days')
          GROUP BY error_message, url
          ORDER BY count DESC
          LIMIT 10
        `).all();

        return new Response(JSON.stringify({
          success: true,
          stats: {
            daily: stats,
            recent: recentErrors,
            topErrors,
          },
        }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      // エラーログの取得
      let query = `
        SELECT 
          error_id, timestamp, user_agent, url, referrer,
          error_message, error_stack, user_id, session_id,
          additional_data, created_at
        FROM error_logs
      `;

      const conditions: string[] = [];
      const params: any[] = [];

      if (dateFrom) {
        conditions.push("date(timestamp) >= ?");
        params.push(dateFrom);
      }

      if (dateTo) {
        conditions.push("date(timestamp) <= ?");
        params.push(dateTo);
      }

      if (severity === "critical") {
        conditions.push(`(
          error_message LIKE '%database%' OR 
          error_message LIKE '%auth%' OR 
          url LIKE '%/api/%'
        )`);
      }

      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?";
      params.push(limit, offset);

      const errors = db.prepare(query).all(...params);

      // 総数の取得
      let countQuery = "SELECT COUNT(*) as total FROM error_logs";
      if (conditions.length > 0) {
        countQuery += " WHERE " + conditions.join(" AND ");
      }
      
      const totalResult = db.prepare(countQuery).get(...params.slice(0, -2)) as any;
      const total = totalResult.total;

      return new Response(JSON.stringify({
        success: true,
        errors: errors.map(err => ({
          ...err,
          additionalData: err.additional_data ? JSON.parse(err.additional_data) : null,
        })),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      }), {
        headers: { "Content-Type": "application/json" },
      });

    } catch (error) {
      console.error("Error log retrieval failed:", error);
      
      return new Response(JSON.stringify({
        success: false,
        error: "エラーログの取得に失敗しました",
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  async DELETE(req) {
    try {
      // 管理者専用：古いエラーログの削除
      const url = new URL(req.url);
      const days = parseInt(url.searchParams.get("days") || "30");

      await initDatabase();
      const db = getDatabase();

      // TODO: 管理者認証を追加

      const deletedCount = db.prepare(`
        DELETE FROM error_logs 
        WHERE datetime(timestamp) < datetime('now', '-' || ? || ' days')
      `).run(days);

      // 統計テーブルからも古いデータを削除
      db.prepare(`
        DELETE FROM error_statistics 
        WHERE date < date('now', '-' || ? || ' days')
      `).run(days);

      return new Response(JSON.stringify({
        success: true,
        message: `${days}日以前のエラーログを削除しました`,
        deletedCount: deletedCount.changes,
      }), {
        headers: { "Content-Type": "application/json" },
      });

    } catch (error) {
      console.error("Error log cleanup failed:", error);
      
      return new Response(JSON.stringify({
        success: false,
        error: "エラーログの削除に失敗しました",
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};