import { MiddlewareHandlerContext } from "$fresh/server.ts";
import { initDatabase, getDatabase } from "./database.ts";

// グローバルエラーハンドラーのタイプ
export interface ErrorHandlerOptions {
  enableLogging?: boolean;
  enableReporting?: boolean;
  logToConsole?: boolean;
  redirectToErrorPage?: boolean;
}

// エラー詳細情報
export interface ErrorDetails {
  errorId: string;
  timestamp: string;
  url: string;
  method: string;
  userAgent: string;
  referer?: string;
  userId?: number;
  sessionId?: string;
  error: Error;
  statusCode: number;
}

// エラーIDの生成
export function generateErrorId(): string {
  return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// エラーログの記録
export async function logError(details: ErrorDetails): Promise<void> {
  try {
    await initDatabase();
    const db = getDatabase();

    const insertStmt = db.prepare(`
      INSERT INTO error_logs (
        error_id, timestamp, user_agent, url, referrer,
        error_message, error_stack, user_id, session_id,
        additional_data, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    const additionalData = {
      method: details.method,
      statusCode: details.statusCode,
      errorName: details.error.name,
    };

    insertStmt.run(
      details.errorId,
      details.timestamp,
      details.userAgent,
      details.url,
      details.referer || null,
      details.error.message,
      details.error.stack || null,
      details.userId || null,
      details.sessionId || null,
      JSON.stringify(additionalData)
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

  } catch (logError) {
    console.error("Failed to log error to database:", logError);
  }
}

// エラーレスポンスの生成
export function createErrorResponse(
  details: ErrorDetails,
  options: ErrorHandlerOptions = {}
): Response {
  const { enableReporting = true, redirectToErrorPage = true } = options;

  // コンソールログ
  if (options.logToConsole !== false) {
    console.error(`[${details.errorId}] ${details.error.name}: ${details.error.message}`);
    console.error(`URL: ${details.url}`);
    console.error(`Stack: ${details.error.stack}`);
  }

  // 500エラーページにリダイレクト
  if (redirectToErrorPage && details.statusCode >= 500) {
    const errorPageUrl = new URL("/_500", new URL(details.url).origin);
    errorPageUrl.searchParams.set("errorId", details.errorId);
    
    return new Response(null, {
      status: 302,
      headers: {
        "Location": errorPageUrl.toString(),
      },
    });
  }

  // JSON APIレスポンス
  if (details.url.includes("/api/")) {
    return new Response(JSON.stringify({
      success: false,
      error: details.statusCode >= 500 
        ? "サーバー内部エラーが発生しました"
        : details.error.message,
      errorId: details.errorId,
      timestamp: details.timestamp,
    }), {
      status: details.statusCode,
      headers: { "Content-Type": "application/json" },
    });
  }

  // HTMLエラーページ
  const errorHtml = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>エラーが発生しました - Nightlife Navigator</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(to br, #fdf2f8, #f3e8ff);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0;
          padding: 20px;
        }
        .error-container {
          max-width: 500px;
          text-align: center;
          background: white;
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }
        .error-code { 
          font-size: 4rem; 
          font-weight: bold; 
          color: #ec4899; 
          margin-bottom: 20px;
        }
        .error-message { 
          color: #374151; 
          margin-bottom: 30px; 
          line-height: 1.6;
        }
        .error-id { 
          font-family: monospace; 
          font-size: 0.875rem; 
          background: #f3f4f6; 
          padding: 10px; 
          border-radius: 8px; 
          margin: 20px 0;
          color: #6b7280;
        }
        .btn {
          display: inline-block;
          background: #ec4899;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          margin: 0 10px;
          transition: background-color 0.2s;
        }
        .btn:hover { background: #db2777; }
        .btn-outline {
          background: transparent;
          border: 2px solid #ec4899;
          color: #ec4899;
        }
        .btn-outline:hover {
          background: #ec4899;
          color: white;
        }
      </style>
    </head>
    <body>
      <div class="error-container">
        <div class="error-code">${details.statusCode}</div>
        <h1>エラーが発生しました</h1>
        <p class="error-message">
          ${details.statusCode >= 500 
            ? "サーバーで問題が発生しました。技術チームに自動的に報告されました。" 
            : details.error.message}
        </p>
        <div class="error-id">
          エラーID: ${details.errorId}
        </div>
        <div style="margin-top: 30px;">
          <a href="/" class="btn">ホームに戻る</a>
          <a href="javascript:history.back()" class="btn btn-outline">戻る</a>
        </div>
      </div>
      <script>
        // エラーレポート送信
        if (typeof fetch !== 'undefined') {
          fetch('/api/errors/report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              errorId: '${details.errorId}',
              timestamp: '${details.timestamp}',
              userAgent: navigator.userAgent,
              url: '${details.url}',
              referrer: document.referrer,
              errorMessage: '${details.error.message.replace(/'/g, "\\'")}',
            })
          }).catch(console.warn);
        }
      </script>
    </body>
    </html>
  `;

  return new Response(errorHtml, {
    status: details.statusCode,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

// Fresh ミドルウェア用のエラーハンドラー
export function errorHandlerMiddleware(options: ErrorHandlerOptions = {}) {
  return async (req: Request, ctx: MiddlewareHandlerContext) => {
    try {
      const response = await ctx.next();
      
      // 404エラーの場合はカスタム404ページにリダイレクト
      if (response.status === 404 && !req.url.includes("/api/") && !req.url.includes("/_404")) {
        return new Response(null, {
          status: 302,
          headers: { "Location": "/_404" },
        });
      }
      
      return response;
    } catch (error) {
      const details: ErrorDetails = {
        errorId: generateErrorId(),
        timestamp: new Date().toISOString(),
        url: req.url,
        method: req.method,
        userAgent: req.headers.get("User-Agent") || "unknown",
        referer: req.headers.get("Referer") || undefined,
        error: error instanceof Error ? error : new Error(String(error)),
        statusCode: 500,
      };

      // TODO: ユーザー情報の取得
      // try {
      //   const { getUserFromRequest } = await import("./auth.ts");
      //   const user = await getUserFromRequest(req);
      //   if (user) {
      //     details.userId = user.id;
      //   }
      // } catch {}

      // エラーログ記録
      if (options.enableLogging !== false) {
        await logError(details);
      }

      // エラーレスポンス生成
      return createErrorResponse(details, options);
    }
  };
}

// 未処理エラーの捕捉（Deno環境用）
export function setupGlobalErrorHandling(options: ErrorHandlerOptions = {}) {
  // 未処理の Promise rejection
  globalThis.addEventListener("unhandledrejection", (event) => {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    
    const details: ErrorDetails = {
      errorId: generateErrorId(),
      timestamp: new Date().toISOString(),
      url: "unknown",
      method: "unknown",
      userAgent: "unknown",
      error,
      statusCode: 500,
    };

    console.error(`[${details.errorId}] Unhandled Promise Rejection:`, error);
    
    if (options.enableLogging !== false) {
      logError(details).catch(console.error);
    }
    
    event.preventDefault();
  });

  // 未処理のエラー
  globalThis.addEventListener("error", (event) => {
    const error = event.error instanceof Error ? event.error : new Error(String(event.error));
    
    const details: ErrorDetails = {
      errorId: generateErrorId(),
      timestamp: new Date().toISOString(),
      url: event.filename || "unknown",
      method: "unknown",
      userAgent: "unknown",
      error,
      statusCode: 500,
    };

    console.error(`[${details.errorId}] Unhandled Error:`, error);
    
    if (options.enableLogging !== false) {
      logError(details).catch(console.error);
    }
  });
}