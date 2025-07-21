#!/usr/bin/env -S deno run -A

import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";
import { Table } from "https://deno.land/x/cliffy@v1.0.0-rc.3/table/mod.ts";
import { Input, Confirm, Select } from "https://deno.land/x/cliffy@v1.0.0-rc.3/prompt/mod.ts";
import { colors } from "https://deno.land/x/cliffy@v1.0.0-rc.3/ansi/colors.ts";
import { DatabaseBackup, defaultBackup, BackupMetadata } from "../utils/backup.ts";

// バックアップ管理CLIツール
const backupManager = new Command()
  .name("backup-manager")
  .version("1.0.0")
  .description("Nightlife Navigator バックアップ管理ツール");

// バックアップの作成
backupManager
  .command("create")
  .description("新しいバックアップを作成")
  .option("-t, --type <type:string>", "バックアップタイプ (full|schema)", {
    default: "full",
  })
  .option("-d, --description <description:string>", "バックアップの説明")
  .action(async (options) => {
    try {
      console.log(colors.bold.blue(`\n🚀 ${options.type === 'schema' ? 'スキーマ' : 'フル'}バックアップを作成中...\n`));
      
      const startTime = Date.now();
      
      let result;
      if (options.type === "schema") {
        result = await defaultBackup.createSchemaBackup(options.description);
      } else {
        result = await defaultBackup.createFullBackup(options.description);
      }
      
      if (result.success && result.metadata) {
        const duration = Date.now() - startTime;
        
        console.log(colors.green("✅ バックアップが正常に作成されました！\n"));
        
        const table = new Table()
          .header(["項目", "値"])
          .body([
            ["バックアップID", result.metadata.id],
            ["ファイル名", result.metadata.filename],
            ["作成日時", new Date(result.metadata.createdAt).toLocaleString('ja-JP')],
            ["サイズ", formatSize(result.metadata.size)],
            ["テーブル数", result.metadata.tables.length.toString()],
            ["レコード数", result.metadata.recordCount.toString()],
            ["圧縮", result.metadata.compressed ? "有効" : "無効"],
            ["処理時間", `${Math.round(duration)}ms`],
          ]);
        
        table.render();
        
        if (options.description) {
          console.log(colors.cyan(`\n説明: ${options.description}`));
        }
        
      } else {
        console.error(colors.red("❌ バックアップの作成に失敗しました:"), result.error);
        Deno.exit(1);
      }
      
    } catch (error) {
      console.error(colors.red("❌ エラー:"), error.message);
      Deno.exit(1);
    }
  });

// バックアップ一覧の表示
backupManager
  .command("list")
  .description("バックアップ一覧を表示")
  .option("-l, --limit <limit:number>", "表示するバックアップ数", {
    default: 10,
  })
  .option("-f, --format <format:string>", "出力形式 (table|json)", {
    default: "table",
  })
  .action(async (options) => {
    try {
      const backups = await defaultBackup.listBackups();
      
      if (backups.length === 0) {
        console.log(colors.yellow("📝 バックアップが見つかりませんでした"));
        return;
      }
      
      const displayBackups = backups.slice(0, options.limit);
      
      if (options.format === "json") {
        console.log(JSON.stringify(displayBackups, null, 2));
        return;
      }
      
      console.log(colors.bold.blue(`\n📋 バックアップ一覧 (${backups.length}件中${displayBackups.length}件を表示)\n`));
      
      const table = new Table()
        .header([
          "ID", "タイプ", "作成日時", "サイズ", 
          "テーブル数", "レコード数", "説明"
        ]);
      
      for (const backup of displayBackups) {
        const createdAt = new Date(backup.createdAt).toLocaleString('ja-JP', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
        
        table.push([
          backup.id.split('_')[1]?.slice(-8) || backup.id.slice(-8),
          backup.type === 'schema' ? '📋 Schema' : '💾 Full',
          createdAt,
          formatSize(backup.size),
          backup.tables.length.toString(),
          backup.recordCount.toString(),
          backup.description?.slice(0, 20) || "-",
        ]);
      }
      
      table.render();
      
      const totalSize = backups.reduce((sum, b) => sum + b.size, 0);
      console.log(colors.cyan(`\n合計サイズ: ${formatSize(totalSize)}`));
      
    } catch (error) {
      console.error(colors.red("❌ エラー:"), error.message);
      Deno.exit(1);
    }
  });

// バックアップからの復元
backupManager
  .command("restore")
  .description("バックアップから復元")
  .arguments("<backup-id:string>")
  .option("-f, --force", "確認なしで復元")
  .action(async (options, backupId) => {
    try {
      const backups = await defaultBackup.listBackups();
      const backup = backups.find(b => 
        b.id === backupId || 
        b.id.includes(backupId) ||
        b.filename.includes(backupId)
      );
      
      if (!backup) {
        console.error(colors.red("❌ 指定されたバックアップが見つかりません:"), backupId);
        
        if (backups.length > 0) {
          console.log(colors.yellow("\n利用可能なバックアップ:"));
          backups.slice(0, 5).forEach(b => {
            const shortId = b.id.split('_')[1]?.slice(-8) || b.id.slice(-8);
            console.log(`  ${shortId} - ${b.filename}`);
          });
        }
        
        Deno.exit(1);
      }
      
      // 復元の確認
      if (!options.force) {
        console.log(colors.yellow("⚠️  データベースの復元について\n"));
        
        const table = new Table()
          .header(["項目", "値"])
          .body([
            ["バックアップID", backup.id],
            ["ファイル名", backup.filename],
            ["作成日時", new Date(backup.createdAt).toLocaleString('ja-JP')],
            ["タイプ", backup.type],
            ["テーブル数", backup.tables.length.toString()],
            ["レコード数", backup.recordCount.toString()],
          ]);
        
        table.render();
        
        console.log(colors.red("\n⚠️  警告: この操作は現在のデータベースを完全に置き換えます。"));
        console.log(colors.red("既存のデータは失われる可能性があります。\n"));
        
        const confirmed = await Confirm.prompt("復元を実行しますか？");
        if (!confirmed) {
          console.log("復元をキャンセルしました。");
          return;
        }
      }
      
      console.log(colors.bold.blue("\n🔄 データベースを復元中...\n"));
      
      const result = await defaultBackup.restoreFromBackup(backup.id);
      
      if (result.success) {
        console.log(colors.green("✅ データベースが正常に復元されました！\n"));
        
        const table = new Table()
          .header(["項目", "値"])
          .body([
            ["復元テーブル数", result.restoredTables.length.toString()],
            ["復元レコード数", result.restoredRecords.toString()],
            ["処理時間", `${Math.round(result.duration)}ms`],
          ]);
        
        table.render();
        
        console.log(colors.cyan("\n復元されたテーブル:"));
        result.restoredTables.forEach(table => {
          console.log(`  • ${table}`);
        });
        
      } else {
        console.error(colors.red("❌ データベースの復元に失敗しました:"), result.error);
        Deno.exit(1);
      }
      
    } catch (error) {
      console.error(colors.red("❌ エラー:"), error.message);
      Deno.exit(1);
    }
  });

// バックアップの削除
backupManager
  .command("delete")
  .description("バックアップを削除")
  .arguments("<backup-id:string>")
  .option("-f, --force", "確認なしで削除")
  .action(async (options, backupId) => {
    try {
      const backups = await defaultBackup.listBackups();
      const backup = backups.find(b => 
        b.id === backupId || 
        b.id.includes(backupId) ||
        b.filename.includes(backupId)
      );
      
      if (!backup) {
        console.error(colors.red("❌ 指定されたバックアップが見つかりません:"), backupId);
        Deno.exit(1);
      }
      
      if (!options.force) {
        console.log(colors.yellow(`\n🗑️  バックアップ削除の確認\n`));
        console.log(`ファイル名: ${backup.filename}`);
        console.log(`作成日時: ${new Date(backup.createdAt).toLocaleString('ja-JP')}`);
        console.log(`サイズ: ${formatSize(backup.size)}\n`);
        
        const confirmed = await Confirm.prompt("このバックアップを削除しますか？");
        if (!confirmed) {
          console.log("削除をキャンセルしました。");
          return;
        }
      }
      
      // バックアップファイルの削除
      const backupPath = `./backups/${backup.filename}`;
      const metadataPath = `./backups/${backup.id}.meta.json`;
      
      await Deno.remove(backupPath);
      await Deno.remove(metadataPath);
      
      console.log(colors.green(`✅ バックアップが削除されました: ${backup.filename}`));
      
    } catch (error) {
      console.error(colors.red("❌ エラー:"), error.message);
      Deno.exit(1);
    }
  });

// クリーンアップ
backupManager
  .command("cleanup")
  .description("古いバックアップをクリーンアップ")
  .option("-d, --dry-run", "実際には削除せず、削除対象を表示")
  .action(async (options) => {
    try {
      if (options.dryRun) {
        console.log(colors.blue("🔍 クリーンアップ対象の確認（dry-run モード）\n"));
        
        // 削除対象のバックアップを表示
        const backups = await defaultBackup.listBackups();
        const config = { retentionDays: 30, maxBackups: 30 }; // デフォルト値
        
        const now = new Date();
        const cutoffDate = new Date(now.getTime() - config.retentionDays * 24 * 60 * 60 * 1000);
        
        const oldBackups = backups.filter(backup => new Date(backup.createdAt) < cutoffDate);
        const excessBackups = backups.length > config.maxBackups ? 
          backups.slice(config.maxBackups) : [];
        
        const toDelete = [...oldBackups, ...excessBackups];
        
        if (toDelete.length === 0) {
          console.log(colors.green("✅ クリーンアップ対象のバックアップはありません"));
          return;
        }
        
        console.log(colors.yellow(`削除対象: ${toDelete.length}件のバックアップ\n`));
        
        const table = new Table()
          .header(["ファイル名", "作成日時", "サイズ", "理由"]);
        
        toDelete.forEach(backup => {
          const reason = new Date(backup.createdAt) < cutoffDate ? "期限切れ" : "上限超過";
          table.push([
            backup.filename,
            new Date(backup.createdAt).toLocaleString('ja-JP'),
            formatSize(backup.size),
            reason,
          ]);
        });
        
        table.render();
        
        const totalSize = toDelete.reduce((sum, b) => sum + b.size, 0);
        console.log(colors.cyan(`\n削除予定容量: ${formatSize(totalSize)}`));
        
      } else {
        console.log(colors.blue("🧹 古いバックアップをクリーンアップ中...\n"));
        
        const result = await defaultBackup.cleanupOldBackups();
        
        if (result.deletedCount > 0) {
          console.log(colors.green("✅ クリーンアップが完了しました！\n"));
          console.log(`削除されたバックアップ: ${result.deletedCount}件`);
          console.log(`解放された容量: ${formatSize(result.freedSpace)}`);
        } else {
          console.log(colors.yellow("📝 クリーンアップ対象のバックアップはありませんでした"));
        }
      }
      
    } catch (error) {
      console.error(colors.red("❌ エラー:"), error.message);
      Deno.exit(1);
    }
  });

// ステータス表示
backupManager
  .command("status")
  .description("バックアップシステムの状態を表示")
  .action(async () => {
    try {
      console.log(colors.bold.blue("📊 バックアップシステムの状態\n"));
      
      const backups = await defaultBackup.listBackups();
      const totalSize = backups.reduce((sum, b) => sum + b.size, 0);
      
      // 基本統計
      const basicTable = new Table()
        .header(["項目", "値"])
        .body([
          ["総バックアップ数", backups.length.toString()],
          ["総サイズ", formatSize(totalSize)],
          ["最新バックアップ", backups[0]?.createdAt ? 
            new Date(backups[0].createdAt).toLocaleString('ja-JP') : "なし"],
          ["最古バックアップ", backups[backups.length - 1]?.createdAt ? 
            new Date(backups[backups.length - 1].createdAt).toLocaleString('ja-JP') : "なし"],
          ["平均ファイルサイズ", backups.length > 0 ? 
            formatSize(Math.round(totalSize / backups.length)) : "0B"],
        ]);
      
      basicTable.render();
      
      // タイプ別統計
      if (backups.length > 0) {
        const byType = backups.reduce((acc, backup) => {
          acc[backup.type] = (acc[backup.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        console.log(colors.cyan("\nタイプ別統計:"));
        Object.entries(byType).forEach(([type, count]) => {
          const typeLabel = type === 'schema' ? 'スキーマ' : 'フル';
          console.log(`  ${typeLabel}: ${count}件`);
        });
      }
      
      // バックアップディレクトリの状態
      try {
        const backupDirStat = await Deno.stat("./backups");
        console.log(colors.cyan(`\nバックアップディレクトリ: ./backups`));
        console.log(`作成日時: ${backupDirStat.birthtime?.toLocaleString('ja-JP') || '不明'}`);
      } catch {
        console.log(colors.yellow("\n⚠️  バックアップディレクトリが見つかりません"));
      }
      
    } catch (error) {
      console.error(colors.red("❌ エラー:"), error.message);
      Deno.exit(1);
    }
  });

// 自動バックアップの設定
backupManager
  .command("auto")
  .description("自動バックアップの設定")
  .action(async () => {
    console.log(colors.bold.blue("⚙️  自動バックアップ設定\n"));
    
    const backupType = await Select.prompt({
      message: "バックアップタイプを選択:",
      options: [
        { name: "フルバックアップ", value: "full" },
        { name: "スキーマのみ", value: "schema" },
      ],
    });
    
    const interval = await Select.prompt({
      message: "バックアップ間隔を選択:",
      options: [
        { name: "毎時", value: "hourly" },
        { name: "毎日", value: "daily" },
        { name: "毎週", value: "weekly" },
      ],
    });
    
    const description = await Input.prompt({
      message: "説明（オプション）:",
    });
    
    // Cronジョブ設定の生成
    let cronExpression = "";
    switch (interval) {
      case "hourly":
        cronExpression = "0 * * * *";
        break;
      case "daily":
        cronExpression = "0 2 * * *"; // 毎日午前2時
        break;
      case "weekly":
        cronExpression = "0 2 * * 0"; // 毎週日曜日午前2時
        break;
    }
    
    console.log(colors.green("\n✅ 自動バックアップ設定が完了しました！\n"));
    console.log(colors.cyan("設定内容:"));
    console.log(`  タイプ: ${backupType === 'schema' ? 'スキーマ' : 'フル'}バックアップ`);
    console.log(`  間隔: ${interval === 'hourly' ? '毎時' : interval === 'daily' ? '毎日' : '毎週'}`);
    console.log(`  Cron式: ${cronExpression}`);
    if (description) console.log(`  説明: ${description}`);
    
    console.log(colors.yellow("\n📝 Cronジョブの設定例:"));
    console.log(`${cronExpression} cd ${Deno.cwd()} && deno run -A scripts/backup-manager.ts create --type ${backupType}`);
  });

// ファイルサイズのフォーマット
function formatSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)}${units[unitIndex]}`;
}

// CLI実行
if (import.meta.main) {
  try {
    await backupManager.parse(Deno.args);
  } catch (error) {
    console.error(colors.red("❌ エラー:"), error.message);
    Deno.exit(1);
  }
}