import { MiddlewareHandlerContext } from "$fresh/server.ts";
import { errorHandlerMiddleware } from "../utils/error-handler.ts";
import { securityMiddleware, detectSuspiciousRequest, logSecurityEvent } from "../utils/security.ts";

// セキュリティミドルウェアとエラーハンドラーの統合
export const handler = [
  // 1. セキュリティミドルウェア（最優先）
  securityMiddleware(),
  
  // 2. 疑わしいリクエストの検出
  async (req: Request, ctx: MiddlewareHandlerContext) => {
    const suspiciousEvent = detectSuspiciousRequest(req);
    if (suspiciousEvent) {
      logSecurityEvent(suspiciousEvent);
      
      // 重要な攻撃の場合は即座にブロック
      if (["sql_injection_attempt", "xss_attempt"].includes(suspiciousEvent.type)) {
        return new Response(JSON.stringify({
          error: "Forbidden",
          message: "不正なリクエストが検出されました",
        }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
    
    return await ctx.next();
  },
  
  // 3. エラーハンドラー（最後）
  errorHandlerMiddleware({
    enableLogging: true,
    enableReporting: true,
    logToConsole: true,
    redirectToErrorPage: true,
  }),
];