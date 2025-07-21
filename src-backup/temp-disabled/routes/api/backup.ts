import { Handlers } from "$fresh/server.ts";
import { DatabaseBackup, defaultBackup, BackupMetadata } from "../../utils/backup.ts";

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
        case "list":
          // バックアップ一覧の取得
          const backups = await defaultBackup.listBackups();
          
          return new Response(JSON.stringify({
            success: true,
            backups,
            totalBackups: backups.length,
            totalSize: backups.reduce((sum, backup) => sum + backup.size, 0),
            oldestBackup: backups.length > 0 ? backups[backups.length - 1].createdAt : null,
            newestBackup: backups.length > 0 ? backups[0].createdAt : null,
          }), {
            headers: { "Content-Type": "application/json" },
          });

        case "status":
          // バックアップシステムの状態
          const backupList = await defaultBackup.listBackups();
          const lastBackup = backupList[0];
          
          // バックアップディレクトリの容量確認
          let directorySize = 0;
          try {
            for await (const entry of Deno.readDir("./backups")) {
              if (entry.isFile) {
                const stat = await Deno.stat(`./backups/${entry.name}`);
                directorySize += stat.size;
              }
            }
          } catch {
            // ディレクトリが存在しない場合は0
          }
          
          return new Response(JSON.stringify({
            success: true,
            status: {
              totalBackups: backupList.length,
              lastBackupDate: lastBackup?.createdAt || null,
              lastBackupType: lastBackup?.type || null,
              totalSize: directorySize,
              averageBackupSize: backupList.length > 0 ? Math.round(directorySize / backupList.length) : 0,
              systemHealth: "healthy", // TODO: より詳細な健康チェック
            },
          }), {
            headers: { "Content-Type": "application/json" },
          });

        case "download":
          // バックアップファイルのダウンロード
          const backupId = url.searchParams.get("id");
          if (!backupId) {
            return new Response(JSON.stringify({
              success: false,
              error: "バックアップIDが必要です",
            }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const allBackups = await defaultBackup.listBackups();
          const targetBackup = allBackups.find(b => b.id === backupId);
          
          if (!targetBackup) {
            return new Response(JSON.stringify({
              success: false,
              error: "指定されたバックアップが見つかりません",
            }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }

          try {
            const backupPath = `./backups/${targetBackup.filename}`;
            const fileData = await Deno.readFile(backupPath);
            
            return new Response(fileData, {
              headers: {
                "Content-Type": "application/octet-stream",
                "Content-Disposition": `attachment; filename="${targetBackup.filename}"`,
                "Content-Length": fileData.length.toString(),
              },
            });
          } catch (error) {
            return new Response(JSON.stringify({
              success: false,
              error: "バックアップファイルの読み込みに失敗しました",
            }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

        default:
          return new Response(JSON.stringify({
            success: false,
            error: "無効なアクションです",
            availableActions: ["list", "status", "download"],
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
      }

    } catch (error) {
      console.error("Backup API error:", error);
      
      return new Response(JSON.stringify({
        success: false,
        error: "バックアップAPI処理中にエラーが発生しました",
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
      const { action, type = "full", description, backupId } = body;

      // TODO: 管理者認証を追加

      switch (action) {
        case "create":
          // 新しいバックアップの作成
          console.log(`🚀 Creating ${type} backup...`);
          
          let result;
          if (type === "full") {
            result = await defaultBackup.createFullBackup(description);
          } else if (type === "schema") {
            result = await defaultBackup.createSchemaBackup(description);
          } else {
            return new Response(JSON.stringify({
              success: false,
              error: "無効なバックアップタイプです",
              validTypes: ["full", "schema"],
            }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          if (result.success) {
            return new Response(JSON.stringify({
              success: true,
              message: "バックアップが正常に作成されました",
              backup: result.metadata,
              duration: result.duration,
            }), {
              status: 201,
              headers: { "Content-Type": "application/json" },
            });
          } else {
            return new Response(JSON.stringify({
              success: false,
              error: "バックアップの作成に失敗しました",
              details: result.error,
            }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

        case "restore":
          // バックアップからの復元
          if (!backupId) {
            return new Response(JSON.stringify({
              success: false,
              error: "バックアップIDが必要です",
            }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          console.log(`🔄 Restoring from backup: ${backupId}`);
          
          const restoreResult = await defaultBackup.restoreFromBackup(backupId);

          if (restoreResult.success) {
            return new Response(JSON.stringify({
              success: true,
              message: "データベースが正常に復元されました",
              restoredTables: restoreResult.restoredTables,
              restoredRecords: restoreResult.restoredRecords,
              duration: restoreResult.duration,
            }), {
              headers: { "Content-Type": "application/json" },
            });
          } else {
            return new Response(JSON.stringify({
              success: false,
              error: "データベースの復元に失敗しました",
              details: restoreResult.error,
            }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

        case "cleanup":
          // 古いバックアップのクリーンアップ
          console.log("🧹 Cleaning up old backups...");
          
          const cleanupResult = await defaultBackup.cleanupOldBackups();

          return new Response(JSON.stringify({
            success: true,
            message: "古いバックアップのクリーンアップが完了しました",
            deletedCount: cleanupResult.deletedCount,
            freedSpace: cleanupResult.freedSpace,
          }), {
            headers: { "Content-Type": "application/json" },
          });

        default:
          return new Response(JSON.stringify({
            success: false,
            error: "無効なアクションです",
            availableActions: ["create", "restore", "cleanup"],
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
      }

    } catch (error) {
      console.error("Backup POST API error:", error);
      
      return new Response(JSON.stringify({
        success: false,
        error: "バックアップ操作中にエラーが発生しました",
        details: error.message,
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  async DELETE(req) {
    try {
      const url = new URL(req.url);
      const backupId = url.searchParams.get("id");

      if (!backupId) {
        return new Response(JSON.stringify({
          success: false,
          error: "バックアップIDが必要です",
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // TODO: 管理者認証を追加

      // バックアップの存在確認
      const backups = await defaultBackup.listBackups();
      const targetBackup = backups.find(b => b.id === backupId);

      if (!targetBackup) {
        return new Response(JSON.stringify({
          success: false,
          error: "指定されたバックアップが見つかりません",
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // バックアップファイルとメタデータの削除
      try {
        const backupPath = `./backups/${targetBackup.filename}`;
        const metadataPath = `./backups/${targetBackup.id}.meta.json`;

        await Deno.remove(backupPath);
        await Deno.remove(metadataPath);

        console.log(`🗑️  Deleted backup: ${targetBackup.filename}`);

        return new Response(JSON.stringify({
          success: true,
          message: "バックアップが正常に削除されました",
          deletedBackup: {
            id: targetBackup.id,
            filename: targetBackup.filename,
            size: targetBackup.size,
          },
        }), {
          headers: { "Content-Type": "application/json" },
        });

      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: "バックアップファイルの削除に失敗しました",
          details: error.message,
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

    } catch (error) {
      console.error("Backup DELETE API error:", error);
      
      return new Response(JSON.stringify({
        success: false,
        error: "バックアップ削除処理中にエラーが発生しました",
        details: error.message,
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};