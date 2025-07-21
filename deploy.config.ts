// Deno Deploy 設定ファイル
export default {
  // プロジェクト名
  project: "nightlife-navigator",
  
  // エントリーポイント
  entrypoint: "./main.ts",
  
  // 除外ファイル
  exclude: [
    "./.git/**",
    "./node_modules/**",
    "./.deno/**",
    "./coverage/**",
    "./.env*",
    "./docker-compose.yml",
    "./Dockerfile",
    "./nginx.conf",
    "./tests/**",
    "./*.md",
    "./.dockerignore"
  ],
  
  // 環境変数（本番環境で設定が必要）
  env: {
    DENO_ENV: "production",
    DATABASE_URL: "file:./data/nightlife_navigator.db",
    // これらは Deno Deploy のダッシュボードで設定
    // JWT_SECRET: "...",
    // GOOGLE_MAPS_API_KEY: "...",
  },
  
  // Deno Deploy の設定
  deployment: {
    // リージョン設定
    regions: ["asia-northeast1"], // 東京リージョン
    
    // 自動デプロイ設定
    github: {
      owner: "your-username",
      repo: "nightlife-navigator",
      branch: "main",
      productionBranch: "main"
    }
  }
};