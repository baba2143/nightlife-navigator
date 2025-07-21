import { defaultBackup } from "./backup.ts";
import { getConfig } from "./env.ts";

// スケジューラーのタイプ
export type ScheduleType = "interval" | "cron" | "manual";

// スケジュール設定
export interface ScheduleConfig {
  type: ScheduleType;
  interval?: number; // ミリ秒
  cronExpression?: string;
  enabled: boolean;
  backupType: "full" | "schema";
  description?: string;
}

// バックアップスケジューラークラス
export class BackupScheduler {
  private timers: Map<string, number> = new Map();
  private config: ScheduleConfig;
  private running = false;

  constructor(config?: Partial<ScheduleConfig>) {
    const appConfig = getConfig();
    
    this.config = {
      type: "interval",
      interval: appConfig.backupInterval * 60 * 60 * 1000, // 時間をミリ秒に変換
      enabled: true,
      backupType: "full",
      description: "Automatic scheduled backup",
      ...config,
    };
  }

  // スケジューラーの開始
  start(): void {
    if (this.running) {
      console.log("⚠️  Backup scheduler is already running");
      return;
    }

    if (!this.config.enabled) {
      console.log("📋 Backup scheduler is disabled");
      return;
    }

    this.running = true;
    console.log("🚀 Starting backup scheduler...");

    if (this.config.type === "interval" && this.config.interval) {
      this.startIntervalSchedule();
    } else if (this.config.type === "cron" && this.config.cronExpression) {
      this.startCronSchedule();
    }

    console.log(`✅ Backup scheduler started (${this.config.type})`);
  }

  // スケジューラーの停止
  stop(): void {
    if (!this.running) {
      console.log("📋 Backup scheduler is not running");
      return;
    }

    this.running = false;

    // 全てのタイマーを停止
    for (const [name, timerId] of this.timers) {
      clearInterval(timerId);
      console.log(`🛑 Stopped timer: ${name}`);
    }
    
    this.timers.clear();
    console.log("🛑 Backup scheduler stopped");
  }

  // インターバルスケジュールの開始
  private startIntervalSchedule(): void {
    if (!this.config.interval) return;

    const timerId = setInterval(async () => {
      await this.executeBackup();
    }, this.config.interval);

    this.timers.set("interval", timerId);

    const hours = this.config.interval / (1000 * 60 * 60);
    console.log(`⏰ Scheduled backup every ${hours} hours`);

    // 初回実行は1分後
    setTimeout(async () => {
      await this.executeBackup();
    }, 60 * 1000);
  }

  // Cronスケジュールの開始（簡易実装）
  private startCronSchedule(): void {
    if (!this.config.cronExpression) return;

    // 簡易的なCron実装（分単位でチェック）
    const timerId = setInterval(async () => {
      if (this.shouldRunCron()) {
        await this.executeBackup();
      }
    }, 60 * 1000); // 1分ごとにチェック

    this.timers.set("cron", timerId);
    console.log(`⏰ Scheduled backup with cron: ${this.config.cronExpression}`);
  }

  // Cron実行判定（簡易実装）
  private shouldRunCron(): boolean {
    if (!this.config.cronExpression) return false;

    const now = new Date();
    const [minute, hour, day, month, dayOfWeek] = this.config.cronExpression.split(' ');

    // 簡易的なチェック（完全なCron実装ではありません）
    if (minute !== '*' && parseInt(minute) !== now.getMinutes()) return false;
    if (hour !== '*' && parseInt(hour) !== now.getHours()) return false;
    if (day !== '*' && parseInt(day) !== now.getDate()) return false;
    if (month !== '*' && parseInt(month) !== (now.getMonth() + 1)) return false;
    if (dayOfWeek !== '*' && parseInt(dayOfWeek) !== now.getDay()) return false;

    return true;
  }

  // バックアップの実行
  private async executeBackup(): Promise<void> {
    try {
      console.log(`🔄 Executing scheduled ${this.config.backupType} backup...`);

      let result;
      if (this.config.backupType === "schema") {
        result = await defaultBackup.createSchemaBackup(this.config.description);
      } else {
        result = await defaultBackup.createFullBackup(this.config.description);
      }

      if (result.success && result.metadata) {
        console.log(`✅ Scheduled backup completed: ${result.metadata.filename}`);
        
        // クリーンアップも実行
        const cleanupResult = await defaultBackup.cleanupOldBackups();
        if (cleanupResult.deletedCount > 0) {
          console.log(`🧹 Cleanup: ${cleanupResult.deletedCount} old backups removed`);
        }
      } else {
        console.error(`❌ Scheduled backup failed: ${result.error}`);
      }

    } catch (error) {
      console.error("❌ Scheduled backup error:", error);
    }
  }

  // 設定の更新
  updateConfig(newConfig: Partial<ScheduleConfig>): void {
    const wasRunning = this.running;
    
    if (wasRunning) {
      this.stop();
    }

    this.config = { ...this.config, ...newConfig };

    if (wasRunning && this.config.enabled) {
      this.start();
    }

    console.log("⚙️  Backup scheduler configuration updated");
  }

  // 現在の設定を取得
  getConfig(): ScheduleConfig {
    return { ...this.config };
  }

  // スケジューラーの状態を取得
  getStatus(): {
    running: boolean;
    config: ScheduleConfig;
    nextBackup?: string;
    activeTimers: string[];
  } {
    let nextBackup: string | undefined;

    if (this.running && this.config.type === "interval" && this.config.interval) {
      const nextTime = new Date(Date.now() + this.config.interval);
      nextBackup = nextTime.toISOString();
    }

    return {
      running: this.running,
      config: this.config,
      nextBackup,
      activeTimers: Array.from(this.timers.keys()),
    };
  }

  // 手動バックアップの実行
  async executeManualBackup(type: "full" | "schema" = "full", description?: string): Promise<void> {
    console.log(`🔄 Executing manual ${type} backup...`);
    
    try {
      let result;
      if (type === "schema") {
        result = await defaultBackup.createSchemaBackup(description || "Manual backup");
      } else {
        result = await defaultBackup.createFullBackup(description || "Manual backup");
      }

      if (result.success && result.metadata) {
        console.log(`✅ Manual backup completed: ${result.metadata.filename}`);
      } else {
        console.error(`❌ Manual backup failed: ${result.error}`);
      }

    } catch (error) {
      console.error("❌ Manual backup error:", error);
    }
  }
}

// デフォルトのスケジューラーインスタンス
export const defaultScheduler = new BackupScheduler();

// アプリケーション開始時にスケジューラーを初期化
export function initializeBackupScheduler(): void {
  const config = getConfig();
  
  // 本番環境でのみ自動バックアップを有効にする
  if (config.environment === "production") {
    defaultScheduler.updateConfig({
      enabled: true,
      type: "interval",
      interval: config.backupInterval * 60 * 60 * 1000,
      backupType: "full",
      description: "Automatic production backup",
    });
    
    defaultScheduler.start();
  } else {
    console.log("🔧 Automatic backup disabled in development environment");
  }
}

// グレースフルシャットダウン
export function shutdownBackupScheduler(): void {
  defaultScheduler.stop();
}