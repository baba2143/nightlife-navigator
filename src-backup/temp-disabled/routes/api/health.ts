import { Handlers } from "$fresh/server.ts";
import { getDatabase, initDatabase } from "../../utils/database.ts";

interface HealthStatus {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  services: {
    database: {
      status: "healthy" | "unhealthy";
      responseTime?: number;
      error?: string;
    };
    memory: {
      used: number;
      available: number;
      percentage: number;
    };
    uptime: number;
  };
  version: string;
  environment: string;
}

export const handler: Handlers = {
  async GET(_req) {
    const startTime = performance.now();
    
    const healthStatus: HealthStatus = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: { status: "healthy" },
        memory: {
          used: 0,
          available: 0,
          percentage: 0,
        },
        uptime: performance.now(),
      },
      version: "1.0.0",
      environment: Deno.env.get("DENO_ENV") || "development",
    };

    // データベース接続チェック
    try {
      const dbStartTime = performance.now();
      await initDatabase();
      const db = getDatabase();
      
      // 簡単なクエリでDB接続を確認
      db.prepare("SELECT 1").get();
      
      const dbEndTime = performance.now();
      healthStatus.services.database = {
        status: "healthy",
        responseTime: Math.round(dbEndTime - dbStartTime),
      };
    } catch (error) {
      healthStatus.services.database = {
        status: "unhealthy",
        error: error.message,
      };
      healthStatus.status = "unhealthy";
    }

    // メモリ使用量チェック
    try {
      const memInfo = Deno.memoryUsage();
      const totalMemory = memInfo.heapTotal;
      const usedMemory = memInfo.heapUsed;
      const memoryPercentage = Math.round((usedMemory / totalMemory) * 100);

      healthStatus.services.memory = {
        used: Math.round(usedMemory / 1024 / 1024), // MB
        available: Math.round(totalMemory / 1024 / 1024), // MB
        percentage: memoryPercentage,
      };

      // メモリ使用量が90%を超えた場合は警告
      if (memoryPercentage > 90) {
        healthStatus.status = "degraded";
      }
    } catch (error) {
      console.error("Memory check failed:", error);
    }

    // レスポンスステータスを決定
    const httpStatus = healthStatus.status === "healthy" ? 200 : 
                      healthStatus.status === "degraded" ? 200 : 503;

    return new Response(JSON.stringify(healthStatus, null, 2), {
      status: httpStatus,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  },
};