import { defineConfig } from "$fresh/server.ts";
import { asset, Head } from "$fresh/runtime.ts";
import twindPlugin from "$fresh/plugins/twind.ts";
import twindConfig from "./twind.config.ts";
import { errorHandlerMiddleware, setupGlobalErrorHandling } from "./utils/error-handler.ts";

// グローバルエラーハンドリングの設定
setupGlobalErrorHandling({
  enableLogging: true,
  enableReporting: true,
  logToConsole: true,
});

export default defineConfig({
  plugins: [twindPlugin(twindConfig)],
  static: {
    "/": "./static/",
  },
  build: {
    target: ["chrome99", "firefox99", "safari15"],
  },
  server: {
    port: 8000,
    hostname: "localhost",
  },
});