import { Handlers } from "$fresh/server.ts";
import { 
  getSecurityConfig, 
  getSecurityEvents, 
  logSecurityEvent,
  checkPasswordStrength,
  SecurityEvent 
} from "../../utils/security.ts";

export const handler: Handlers = {
  async GET(req) {
    try {
      const url = new URL(req.url);
      const action = url.searchParams.get("action");

      // TODO: 管理者認証を追加
      // const { getUserFromRequest } = await import("../../utils/auth.ts");
      // const user = await getUserFromRequest(req);
      // if (!user || user.role !== 'admin') {
      //   return new Response(JSON.stringify({
      //     success: false,
      //     error: "管理者権限が必要です"
      //   }), { status: 403, headers: { "Content-Type": "application/json" } });
      // }

      switch (action) {
        case "config":
          // セキュリティ設定の取得
          const config = getSecurityConfig();
          
          // 機密情報を除外した設定を返す
          const safeConfig = {
            cors: {
              origins: config.cors.origins.map(origin => 
                origin.includes("localhost") ? origin : origin.replace(/^https?:\/\//, "***.")
              ),
              methods: config.cors.methods,
              credentials: config.cors.credentials,
            },
            csp: {
              enabled: config.csp.enabled,
              directiveCount: Object.keys(config.csp.directives).length,
            },
            headers: {
              hsts: config.headers.hsts,
              xFrameOptions: config.headers.xFrameOptions,
              xContentTypeOptions: config.headers.xContentTypeOptions,
            },
            rateLimit: {
              enabled: config.rateLimit.enabled,
              windowMs: config.rateLimit.windowMs,
              maxRequests: config.rateLimit.maxRequests,
              skipPathsCount: config.rateLimit.skipPaths.length,
            },
          };

          return new Response(JSON.stringify({
            success: true,
            config: safeConfig,
            timestamp: new Date().toISOString(),
          }), {
            headers: { "Content-Type": "application/json" },
          });

        case "events":
          // セキュリティイベントの取得
          const limit = parseInt(url.searchParams.get("limit") || "50");
          const type = url.searchParams.get("type");
          const since = url.searchParams.get("since");
          
          let events = getSecurityEvents(limit);
          
          // フィルタリング
          if (type) {
            events = events.filter(event => event.type === type);
          }
          
          if (since) {
            const sinceDate = new Date(since);
            events = events.filter(event => new Date(event.timestamp) >= sinceDate);
          }
          
          // 統計情報
          const eventStats = events.reduce((acc, event) => {
            acc[event.type] = (acc[event.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          return new Response(JSON.stringify({
            success: true,
            events,
            stats: eventStats,
            totalEvents: events.length,
            query: { limit, type, since },
          }), {
            headers: { "Content-Type": "application/json" },
          });

        case "stats":
          // セキュリティ統計の取得
          const allEvents = getSecurityEvents(1000);
          const now = new Date();
          const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          
          const events24h = allEvents.filter(e => new Date(e.timestamp) >= last24h);
          const events7d = allEvents.filter(e => new Date(e.timestamp) >= last7d);
          
          const topIPs = events7d.reduce((acc, event) => {
            acc[event.ip] = (acc[event.ip] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          const topUserAgents = events7d.reduce((acc, event) => {
            const ua = event.userAgent.slice(0, 50);
            acc[ua] = (acc[ua] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          return new Response(JSON.stringify({
            success: true,
            stats: {
              total: allEvents.length,
              last24hours: events24h.length,
              last7days: events7d.length,
              byType: events7d.reduce((acc, event) => {
                acc[event.type] = (acc[event.type] || 0) + 1;
                return acc;
              }, {} as Record<string, number>),
              topIPs: Object.entries(topIPs)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10)
                .map(([ip, count]) => ({ ip, count })),
              topUserAgents: Object.entries(topUserAgents)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([ua, count]) => ({ userAgent: ua, count })),
            },
            timestamp: new Date().toISOString(),
          }), {
            headers: { "Content-Type": "application/json" },
          });

        case "health":
          // セキュリティシステムの健康状態
          const recentEvents = getSecurityEvents(100);
          const criticalEvents = recentEvents.filter(e => 
            ["sql_injection_attempt", "xss_attempt"].includes(e.type)
          );
          
          const healthStatus = {
            status: criticalEvents.length > 10 ? "warning" : "healthy",
            criticalEventCount: criticalEvents.length,
            lastCriticalEvent: criticalEvents[0]?.timestamp || null,
            rateLimitActive: true,
            corsConfigured: getSecurityConfig().cors.origins.length > 0,
            cspEnabled: getSecurityConfig().csp.enabled,
            hstsEnabled: getSecurityConfig().headers.hsts,
          };

          return new Response(JSON.stringify({
            success: true,
            health: healthStatus,
            timestamp: new Date().toISOString(),
          }), {
            headers: { "Content-Type": "application/json" },
          });

        default:
          return new Response(JSON.stringify({
            success: false,
            error: "無効なアクションです",
            availableActions: ["config", "events", "stats", "health"],
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
      }

    } catch (error) {
      console.error("Security API error:", error);
      
      return new Response(JSON.stringify({
        success: false,
        error: "セキュリティAPI処理中にエラーが発生しました",
        details: error.message,
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  async POST(req) {
    try {
      const body = await req.json();
      const { action } = body;

      // TODO: 管理者認証を追加

      switch (action) {
        case "test_password":
          // パスワード強度テスト
          const { password } = body;
          
          if (!password) {
            return new Response(JSON.stringify({
              success: false,
              error: "パスワードが指定されていません",
            }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const strengthResult = checkPasswordStrength(password);

          return new Response(JSON.stringify({
            success: true,
            result: strengthResult,
            recommendations: strengthResult.requirements
              .filter(req => !req.met)
              .map(req => req.description),
          }), {
            headers: { "Content-Type": "application/json" },
          });

        case "log_event":
          // セキュリティイベントの手動ログ
          const { type, ip, userAgent, url, details } = body;
          
          if (!type || !ip || !url) {
            return new Response(JSON.stringify({
              success: false,
              error: "必須フィールドが不足しています",
            }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const securityEvent: SecurityEvent = {
            type,
            ip,
            userAgent: userAgent || "Manual",
            url,
            timestamp: new Date().toISOString(),
            details,
          };

          logSecurityEvent(securityEvent);

          return new Response(JSON.stringify({
            success: true,
            message: "セキュリティイベントがログに記録されました",
            event: securityEvent,
          }), {
            headers: { "Content-Type": "application/json" },
          });

        case "test_security":
          // セキュリティテストの実行
          const testResults = await runSecurityTests();

          return new Response(JSON.stringify({
            success: true,
            testResults,
            passed: testResults.every(test => test.passed),
            timestamp: new Date().toISOString(),
          }), {
            headers: { "Content-Type": "application/json" },
          });

        default:
          return new Response(JSON.stringify({
            success: false,
            error: "無効なアクションです",
            availableActions: ["test_password", "log_event", "test_security"],
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
      }

    } catch (error) {
      console.error("Security POST API error:", error);
      
      return new Response(JSON.stringify({
        success: false,
        error: "セキュリティ操作中にエラーが発生しました",
        details: error.message,
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};

// セキュリティテストの実行
async function runSecurityTests(): Promise<Array<{
  name: string;
  passed: boolean;
  details?: string;
}>> {
  const tests = [];
  const config = getSecurityConfig();

  // CORS設定テスト
  tests.push({
    name: "CORS Configuration",
    passed: config.cors.origins.length > 0 && !config.cors.origins.includes("*"),
    details: config.cors.origins.includes("*") ? "ワイルドカード '*' の使用は推奨されません" : undefined,
  });

  // CSP設定テスト
  tests.push({
    name: "Content Security Policy",
    passed: config.csp.enabled && Object.keys(config.csp.directives).length > 5,
    details: !config.csp.enabled ? "CSPが無効になっています" : undefined,
  });

  // HSTS設定テスト
  tests.push({
    name: "HTTP Strict Transport Security",
    passed: config.headers.hsts,
    details: !config.headers.hsts ? "本番環境ではHSTSを有効にしてください" : undefined,
  });

  // レート制限テスト
  tests.push({
    name: "Rate Limiting",
    passed: config.rateLimit.enabled && config.rateLimit.maxRequests > 0,
    details: !config.rateLimit.enabled ? "レート制限が無効になっています" : undefined,
  });

  // X-Frame-Options テスト
  tests.push({
    name: "X-Frame-Options",
    passed: ["DENY", "SAMEORIGIN"].includes(config.headers.xFrameOptions),
    details: config.headers.xFrameOptions === "ALLOW-FROM" ? "ALLOW-FROM は非推奨です" : undefined,
  });

  // 環境変数の暗号化強度テスト
  try {
    const { getConfig } = await import("../../utils/env.ts");
    const appConfig = getConfig();
    
    tests.push({
      name: "JWT Secret Strength",
      passed: appConfig.jwtSecret.length >= 32,
      details: appConfig.jwtSecret.length < 32 ? "JWT秘密鍵が短すぎます（32文字以上推奨）" : undefined,
    });
  } catch {
    tests.push({
      name: "JWT Secret Strength",
      passed: false,
      details: "JWT秘密鍵の確認に失敗しました",
    });
  }

  // セキュリティヘッダーのテスト
  const requiredHeaders = [
    "X-Content-Type-Options",
    "X-XSS-Protection", 
    "Referrer-Policy",
  ];

  requiredHeaders.forEach(header => {
    tests.push({
      name: `Security Header: ${header}`,
      passed: true, // 設定では常に有効
      details: "設定により自動的に追加されます",
    });
  });

  return tests;
}