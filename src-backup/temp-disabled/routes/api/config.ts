import { Handlers } from "$fresh/server.ts";
import { getConfigSummary, reloadConfig } from "../../utils/env.ts";

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
        case "summary":
          // 設定情報の安全な表示
          const configSummary = getConfigSummary();
          
          return new Response(JSON.stringify({
            success: true,
            config: configSummary,
            timestamp: new Date().toISOString(),
          }), {
            headers: { "Content-Type": "application/json" },
          });

        case "reload":
          // 設定の再読み込み
          try {
            const newConfig = reloadConfig();
            
            return new Response(JSON.stringify({
              success: true,
              message: "設定が正常に再読み込みされました",
              config: getConfigSummary(),
              timestamp: new Date().toISOString(),
            }), {
              headers: { "Content-Type": "application/json" },
            });
          } catch (error) {
            return new Response(JSON.stringify({
              success: false,
              error: "設定の再読み込みに失敗しました",
              details: error.message,
            }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

        case "validate":
          // 環境変数の検証
          const validationResults = await validateEnvironment();
          
          return new Response(JSON.stringify({
            success: true,
            validation: validationResults,
            timestamp: new Date().toISOString(),
          }), {
            headers: { "Content-Type": "application/json" },
          });

        default:
          return new Response(JSON.stringify({
            success: false,
            error: "無効なアクションです",
            availableActions: ["summary", "reload", "validate"],
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
      }

    } catch (error) {
      console.error("Config API error:", error);
      
      return new Response(JSON.stringify({
        success: false,
        error: "設定API処理中にエラーが発生しました",
        details: error.message,
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};

// 環境変数の検証
async function validateEnvironment() {
  const results = {
    missingRequired: [] as string[],
    weakSecrets: [] as string[],
    invalidValues: [] as string[],
    warnings: [] as string[],
    recommendations: [] as string[],
  };

  // 必須環境変数のチェック
  const requiredVars = [
    "JWT_SECRET",
    "SESSION_SECRET",
  ];

  for (const varName of requiredVars) {
    const value = Deno.env.get(varName);
    if (!value) {
      results.missingRequired.push(varName);
    }
  }

  // JWT秘密鍵の強度チェック
  const jwtSecret = Deno.env.get("JWT_SECRET");
  if (jwtSecret) {
    if (jwtSecret.length < 32) {
      results.weakSecrets.push("JWT_SECRET: 32文字以上である必要があります");
    }
    
    const weakPatterns = [
      "your-super-secret",
      "change-this",
      "secret",
      "password",
      "123456",
      "default",
    ];
    
    if (weakPatterns.some(pattern => jwtSecret.toLowerCase().includes(pattern))) {
      results.weakSecrets.push("JWT_SECRET: デフォルト値または弱い秘密鍵のようです");
    }
  }

  // Google Maps API キーのチェック
  const googleMapsApiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
  if (googleMapsApiKey) {
    if (!googleMapsApiKey.startsWith("AIza") || googleMapsApiKey.length < 30) {
      results.invalidValues.push("GOOGLE_MAPS_API_KEY: 無効な形式です");
    }
  } else {
    results.warnings.push("GOOGLE_MAPS_API_KEY: 設定されていません（地図機能が制限されます）");
  }

  // データベースファイルの存在チェック
  const databaseUrl = Deno.env.get("DATABASE_URL") || "./data/nightlife_navigator.db";
  try {
    const dbPath = databaseUrl.replace("file:", "");
    await Deno.stat(dbPath);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      results.warnings.push(`DATABASE_URL: ファイルが存在しません (${databaseUrl})`);
    }
  }

  // アップロードディレクトリのチェック
  const uploadPath = Deno.env.get("UPLOAD_PATH") || "./uploads";
  try {
    const stat = await Deno.stat(uploadPath);
    if (!stat.isDirectory) {
      results.invalidValues.push("UPLOAD_PATH: ディレクトリではありません");
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      results.warnings.push("UPLOAD_PATH: ディレクトリが存在しません");
      results.recommendations.push(`mkdir -p ${uploadPath} でディレクトリを作成してください`);
    }
  }

  // 本番環境での設定チェック
  const environment = Deno.env.get("DENO_ENV");
  if (environment === "production") {
    const cookieSecure = Deno.env.get("COOKIE_SECURE");
    if (cookieSecure !== "true") {
      results.warnings.push("COOKIE_SECURE: 本番環境では true に設定することを推奨します");
    }

    const corsOrigins = Deno.env.get("CORS_ORIGINS");
    if (corsOrigins?.includes("*")) {
      results.invalidValues.push("CORS_ORIGINS: 本番環境では '*' を使用できません");
    }

    const logLevel = Deno.env.get("LOG_LEVEL");
    if (logLevel === "debug") {
      results.warnings.push("LOG_LEVEL: 本番環境では debug より高いレベルを推奨します");
    }
  }

  // パフォーマンス関連の推奨事項
  const maxFileSize = parseInt(Deno.env.get("MAX_FILE_SIZE") || "10485760");
  if (maxFileSize > 50 * 1024 * 1024) {
    results.warnings.push("MAX_FILE_SIZE: ファイルサイズ上限が大きすぎる可能性があります");
  }

  return results;
}