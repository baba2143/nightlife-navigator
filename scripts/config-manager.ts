#!/usr/bin/env -S deno run -A

import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";
import { Input, Secret, Confirm, Select } from "https://deno.land/x/cliffy@v1.0.0-rc.3/prompt/mod.ts";
import { colors } from "https://deno.land/x/cliffy@v1.0.0-rc.3/ansi/colors.ts";
import { getConfig, getConfigSummary } from "../utils/env.ts";

// 設定管理CLIツール
const configManager = new Command()
  .name("config-manager")
  .version("1.0.0")
  .description("Nightlife Navigator 設定管理ツール")
  .globalOption("-e, --env <file:string>", "環境ファイルのパス", {
    default: ".env",
  });

// 設定の表示
configManager
  .command("show")
  .description("現在の設定を表示")
  .option("-f, --format <format:string>", "出力形式 (json|table)", {
    default: "table",
  })
  .action(async (options) => {
    try {
      const config = getConfigSummary();
      
      if (options.format === "json") {
        console.log(JSON.stringify(config, null, 2));
      } else {
        console.log(colors.bold.blue("\n📋 現在の設定\n"));
        
        Object.entries(config).forEach(([key, value]) => {
          const displayValue = Array.isArray(value) ? value.join(", ") : value;
          console.log(`${colors.cyan(key.padEnd(25))}: ${colors.white(displayValue)}`);
        });
      }
    } catch (error) {
      console.error(colors.red("❌ 設定の表示に失敗しました:"), error.message);
      Deno.exit(1);
    }
  });

// 設定の検証
configManager
  .command("validate")
  .description("環境変数を検証")
  .action(async () => {
    console.log(colors.bold.blue("🔍 環境変数を検証中...\n"));
    
    try {
      // 環境変数の読み込みテスト
      const config = getConfig();
      console.log(colors.green("✅ 基本設定は正常です"));
      
      // 各設定項目の詳細チェック
      await validateDetailed();
      
    } catch (error) {
      console.error(colors.red("❌ 設定エラー:"), error.message);
      
      if (error.name === "EnvValidationError") {
        console.log(colors.yellow("\n💡 修正方法:"));
        console.log("1. .env ファイルを確認してください");
        console.log("2. 必須の環境変数が設定されているか確認してください");
        console.log("3. config-manager setup コマンドで対話式設定を試してください");
      }
      
      Deno.exit(1);
    }
  });

// 設定のセットアップ
configManager
  .command("setup")
  .description("対話式で設定をセットアップ")
  .option("-f, --force", "既存の .env ファイルを上書き")
  .action(async (options) => {
    console.log(colors.bold.blue("🛠️  Nightlife Navigator 設定セットアップ\n"));
    
    const envPath = ".env";
    
    // 既存ファイルの確認
    if (!options.force) {
      try {
        await Deno.stat(envPath);
        const overwrite = await Confirm.prompt("既存の .env ファイルが見つかりました。上書きしますか？");
        if (!overwrite) {
          console.log("セットアップをキャンセルしました。");
          return;
        }
      } catch {
        // ファイルが存在しない場合は続行
      }
    }
    
    // 環境の選択
    const environment = await Select.prompt({
      message: "環境を選択してください:",
      options: [
        { name: "開発環境", value: "development" },
        { name: "ステージング環境", value: "staging" },
        { name: "本番環境", value: "production" },
      ],
    });
    
    console.log(colors.blue(`\n🌍 ${environment} 環境の設定を開始します\n`));
    
    // 基本設定
    const port = await Input.prompt({
      message: "ポート番号:",
      default: "8000",
      validate: (value) => {
        const num = parseInt(value);
        return num > 0 && num <= 65535 ? true : "有効なポート番号を入力してください (1-65535)";
      },
    });
    
    const host = await Input.prompt({
      message: "ホスト名:",
      default: "localhost",
    });
    
    // JWT設定
    const jwtSecret = await Secret.prompt({
      message: "JWT秘密鍵 (32文字以上):",
      validate: (value) => {
        return value.length >= 32 ? true : "32文字以上で入力してください";
      },
    });
    
    const sessionSecret = await Secret.prompt({
      message: "セッション秘密鍵:",
      validate: (value) => {
        return value.length >= 16 ? true : "16文字以上で入力してください";
      },
    });
    
    // Google Maps API設定
    const useGoogleMaps = await Confirm.prompt("Google Maps APIを使用しますか？");
    let googleMapsApiKey = "";
    
    if (useGoogleMaps) {
      googleMapsApiKey = await Input.prompt({
        message: "Google Maps API キー:",
        validate: (value) => {
          return value.startsWith("AIza") ? true : "有効なGoogle Maps API キーを入力してください";
        },
      });
    }
    
    // データベース設定
    const databaseUrl = await Input.prompt({
      message: "データベースファイルパス:",
      default: "./data/nightlife_navigator.db",
    });
    
    // セキュリティ設定
    let cookieSecure = false;
    let corsOrigins = "http://localhost:8000";
    
    if (environment === "production") {
      cookieSecure = await Confirm.prompt("セキュアクッキーを有効にしますか？（HTTPS必須）");
      corsOrigins = await Input.prompt({
        message: "許可するオリジン（カンマ区切り）:",
        default: "https://your-domain.com",
      });
    }
    
    // .env ファイルの生成
    const envContent = generateEnvFile({
      environment,
      port,
      host,
      jwtSecret,
      sessionSecret,
      googleMapsApiKey,
      databaseUrl,
      cookieSecure,
      corsOrigins,
    });
    
    await Deno.writeTextFile(envPath, envContent);
    
    console.log(colors.green(`\n✅ ${envPath} ファイルが作成されました！`));
    console.log(colors.yellow("\n⚠️  重要な注意事項:"));
    console.log("1. .env ファイルは .gitignore に追加してください");
    console.log("2. 本番環境では強力な秘密鍵を使用してください");
    console.log("3. 設定を確認するには config-manager validate を実行してください");
  });

// .env ファイルの生成
function generateEnvFile(config: {
  environment: string;
  port: string;
  host: string;
  jwtSecret: string;
  sessionSecret: string;
  googleMapsApiKey: string;
  databaseUrl: string;
  cookieSecure: boolean;
  corsOrigins: string;
}): string {
  return `# Nightlife Navigator 設定ファイル
# 生成日時: ${new Date().toISOString()}

# 環境設定
DENO_ENV=${config.environment}

# サーバー設定
PORT=${config.port}
HOST=${config.host}

# データベース設定
DATABASE_URL=${config.databaseUrl}

# JWT 認証設定
JWT_SECRET=${config.jwtSecret}
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d

# セッション設定
SESSION_SECRET=${config.sessionSecret}

${config.googleMapsApiKey ? `# Google Maps API
GOOGLE_MAPS_API_KEY=${config.googleMapsApiKey}` : "# Google Maps API (未設定)\n# GOOGLE_MAPS_API_KEY=your-api-key"}

# セキュリティ設定
COOKIE_SECURE=${config.cookieSecure}
COOKIE_SAME_SITE=lax
CORS_ORIGINS=${config.corsOrigins}

# ファイルアップロード設定
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_EXTENSIONS=jpg,jpeg,png,gif,webp

# レート制限設定
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# ログ設定
LOG_LEVEL=info

# バックアップ設定
BACKUP_INTERVAL=24
BACKUP_RETENTION_DAYS=30
`;
}

// 詳細検証
async function validateDetailed(): Promise<void> {
  const checks = [
    { name: "データベースファイル", check: checkDatabaseFile },
    { name: "アップロードディレクトリ", check: checkUploadDirectory },
    { name: "ポート可用性", check: checkPortAvailability },
  ];
  
  for (const { name, check } of checks) {
    try {
      await check();
      console.log(colors.green(`✅ ${name}: OK`));
    } catch (error) {
      console.log(colors.yellow(`⚠️  ${name}: ${error.message}`));
    }
  }
}

async function checkDatabaseFile(): Promise<void> {
  const config = getConfig();
  const dbPath = config.databaseUrl.replace("file:", "");
  
  try {
    await Deno.stat(dbPath);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw new Error("データベースファイルが見つかりません");
    }
    throw error;
  }
}

async function checkUploadDirectory(): Promise<void> {
  const config = getConfig();
  
  try {
    const stat = await Deno.stat(config.uploadPath);
    if (!stat.isDirectory) {
      throw new Error("アップロードパスがディレクトリではありません");
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw new Error("アップロードディレクトリが見つかりません");
    }
    throw error;
  }
}

async function checkPortAvailability(): Promise<void> {
  const config = getConfig();
  
  try {
    const listener = Deno.listen({ port: config.port });
    listener.close();
  } catch (error) {
    if (error instanceof Deno.errors.AddrInUse) {
      throw new Error(`ポート ${config.port} は既に使用されています`);
    }
    throw error;
  }
}

// CLI実行
if (import.meta.main) {
  try {
    await configManager.parse(Deno.args);
  } catch (error) {
    console.error(colors.red("❌ エラー:"), error.message);
    Deno.exit(1);
  }
}