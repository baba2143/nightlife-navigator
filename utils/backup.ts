import { getDatabase, initDatabase } from "./database.ts";
import { getConfig } from "./env.ts";
import { ensureDir } from "https://deno.land/std@0.216.0/fs/mod.ts";
import { join } from "https://deno.land/std@0.216.0/path/mod.ts";

// バックアップの種類
export type BackupType = "full" | "incremental" | "schema";

// バックアップメタデータ
export interface BackupMetadata {
  id: string;
  type: BackupType;
  filename: string;
  createdAt: string;
  size: number;
  checksum: string;
  description?: string;
  tables: string[];
  recordCount: number;
  compressed: boolean;
}

// バックアップ結果
export interface BackupResult {
  success: boolean;
  metadata?: BackupMetadata;
  error?: string;
  duration: number;
}

// リストア結果
export interface RestoreResult {
  success: boolean;
  restoredTables: string[];
  restoredRecords: number;
  error?: string;
  duration: number;
}

// バックアップ設定
export interface BackupConfig {
  backupDir: string;
  maxBackups: number;
  retentionDays: number;
  compression: boolean;
  encryption: boolean;
  excludeTables: string[];
}

// チェックサムの計算
async function calculateChecksum(data: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// データの圧縮
async function compressData(data: Uint8Array): Promise<Uint8Array> {
  const stream = new CompressionStream("gzip");
  const writer = stream.writable.getWriter();
  const reader = stream.readable.getReader();
  
  const chunks: Uint8Array[] = [];
  
  // 圧縮データの読み取り
  const readPromise = (async () => {
    let done = false;
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        chunks.push(value);
      }
    }
  })();
  
  // データの書き込み
  await writer.write(data);
  await writer.close();
  
  await readPromise;
  
  // 圧縮されたデータを結合
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  
  return result;
}

// データの解凍
async function decompressData(compressedData: Uint8Array): Promise<Uint8Array> {
  const stream = new DecompressionStream("gzip");
  const writer = stream.writable.getWriter();
  const reader = stream.readable.getReader();
  
  const chunks: Uint8Array[] = [];
  
  // 解凍データの読み取り
  const readPromise = (async () => {
    let done = false;
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        chunks.push(value);
      }
    }
  })();
  
  // データの書き込み
  await writer.write(compressedData);
  await writer.close();
  
  await readPromise;
  
  // 解凍されたデータを結合
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  
  return result;
}

// バックアップクラス
export class DatabaseBackup {
  private config: BackupConfig;
  
  constructor(config?: Partial<BackupConfig>) {
    const appConfig = getConfig();
    
    this.config = {
      backupDir: "./backups",
      maxBackups: 30,
      retentionDays: appConfig.backupRetentionDays,
      compression: true,
      encryption: false,
      excludeTables: ["error_logs"], // 大きくなりがちなテーブルを除外
      ...config,
    };
  }
  
  // フルバックアップの作成
  async createFullBackup(description?: string): Promise<BackupResult> {
    const startTime = performance.now();
    
    try {
      await initDatabase();
      const db = getDatabase();
      
      // バックアップディレクトリの作成
      await ensureDir(this.config.backupDir);
      
      // バックアップIDの生成
      const backupId = `full_${Date.now()}`;
      const timestamp = new Date().toISOString();
      
      // データベースのスキーマとデータを取得
      const dumpData = await this.dumpDatabase(db, "full");
      
      // データの圧縮
      let finalData = new TextEncoder().encode(dumpData.sql);
      if (this.config.compression) {
        finalData = await compressData(finalData);
      }
      
      // チェックサムの計算
      const checksum = await calculateChecksum(finalData);
      
      // ファイル名の生成
      const extension = this.config.compression ? ".sql.gz" : ".sql";
      const filename = `${backupId}${extension}`;
      const filepath = join(this.config.backupDir, filename);
      
      // ファイルの保存
      await Deno.writeFile(filepath, finalData);
      
      // メタデータの作成
      const metadata: BackupMetadata = {
        id: backupId,
        type: "full",
        filename,
        createdAt: timestamp,
        size: finalData.length,
        checksum,
        description,
        tables: dumpData.tables,
        recordCount: dumpData.recordCount,
        compressed: this.config.compression,
      };
      
      // メタデータの保存
      await this.saveMetadata(metadata);
      
      const duration = performance.now() - startTime;
      
      console.log(`✅ Full backup created: ${filename} (${this.formatSize(finalData.length)}, ${Math.round(duration)}ms)`);
      
      return {
        success: true,
        metadata,
        duration,
      };
      
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error("❌ Backup failed:", error);
      
      return {
        success: false,
        error: error.message,
        duration,
      };
    }
  }
  
  // スキーマのみのバックアップ
  async createSchemaBackup(description?: string): Promise<BackupResult> {
    const startTime = performance.now();
    
    try {
      await initDatabase();
      const db = getDatabase();
      
      await ensureDir(this.config.backupDir);
      
      const backupId = `schema_${Date.now()}`;
      const timestamp = new Date().toISOString();
      
      // スキーマのみを取得
      const dumpData = await this.dumpDatabase(db, "schema");
      
      let finalData = new TextEncoder().encode(dumpData.sql);
      if (this.config.compression) {
        finalData = await compressData(finalData);
      }
      
      const checksum = await calculateChecksum(finalData);
      const extension = this.config.compression ? ".schema.sql.gz" : ".schema.sql";
      const filename = `${backupId}${extension}`;
      const filepath = join(this.config.backupDir, filename);
      
      await Deno.writeFile(filepath, finalData);
      
      const metadata: BackupMetadata = {
        id: backupId,
        type: "schema",
        filename,
        createdAt: timestamp,
        size: finalData.length,
        checksum,
        description,
        tables: dumpData.tables,
        recordCount: 0,
        compressed: this.config.compression,
      };
      
      await this.saveMetadata(metadata);
      
      const duration = performance.now() - startTime;
      
      console.log(`✅ Schema backup created: ${filename} (${Math.round(duration)}ms)`);
      
      return {
        success: true,
        metadata,
        duration,
      };
      
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error("❌ Schema backup failed:", error);
      
      return {
        success: false,
        error: error.message,
        duration,
      };
    }
  }
  
  // データベースのダンプ
  private async dumpDatabase(db: any, type: BackupType): Promise<{
    sql: string;
    tables: string[];
    recordCount: number;
  }> {
    const sqlStatements: string[] = [];
    const tables: string[] = [];
    let totalRecordCount = 0;
    
    // SQLiteのマスターテーブルからテーブル一覧を取得
    const tableQuery = `
      SELECT name, sql FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `;
    
    const allTables = db.prepare(tableQuery).all() as Array<{name: string, sql: string}>;
    
    for (const table of allTables) {
      if (this.config.excludeTables.includes(table.name)) {
        continue;
      }
      
      tables.push(table.name);
      
      // テーブル作成文を追加
      sqlStatements.push(`-- Table: ${table.name}`);
      sqlStatements.push(`DROP TABLE IF EXISTS ${table.name};`);
      sqlStatements.push(`${table.sql};`);
      sqlStatements.push("");
      
      // データのダンプ（スキーマのみの場合はスキップ）
      if (type !== "schema") {
        const records = db.prepare(`SELECT * FROM ${table.name}`).all();
        totalRecordCount += records.length;
        
        if (records.length > 0) {
          // カラム名を取得
          const columns = Object.keys(records[0]);
          const columnNames = columns.join(", ");
          
          sqlStatements.push(`-- Data for table: ${table.name}`);
          
          // バッチでINSERT文を生成（パフォーマンス向上）
          const batchSize = 100;
          for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize);
            const values = batch.map(record => {
              const valueList = columns.map(col => {
                const value = record[col];
                if (value === null) return "NULL";
                if (typeof value === "string") return `'${value.replace(/'/g, "''")}'`;
                return String(value);
              }).join(", ");
              return `(${valueList})`;
            }).join(",\n  ");
            
            sqlStatements.push(`INSERT INTO ${table.name} (${columnNames}) VALUES`);
            sqlStatements.push(`  ${values};`);
          }
          sqlStatements.push("");
        }
      }
    }
    
    // インデックスの追加
    const indexQuery = `
      SELECT sql FROM sqlite_master 
      WHERE type='index' AND name NOT LIKE 'sqlite_%' AND sql IS NOT NULL
      ORDER BY name
    `;
    
    const indexes = db.prepare(indexQuery).all() as Array<{sql: string}>;
    
    if (indexes.length > 0) {
      sqlStatements.push("-- Indexes");
      for (const index of indexes) {
        sqlStatements.push(`${index.sql};`);
      }
      sqlStatements.push("");
    }
    
    // ヘッダーコメントを追加
    const header = [
      `-- Nightlife Navigator Database Backup`,
      `-- Type: ${type}`,
      `-- Created: ${new Date().toISOString()}`,
      `-- Tables: ${tables.length}`,
      `-- Records: ${totalRecordCount}`,
      `-- Generated by Nightlife Navigator Backup System`,
      "",
      "PRAGMA foreign_keys=OFF;",
      "BEGIN TRANSACTION;",
      "",
    ];
    
    const footer = [
      "",
      "COMMIT;",
      "PRAGMA foreign_keys=ON;",
    ];
    
    const fullSql = [...header, ...sqlStatements, ...footer].join("\n");
    
    return {
      sql: fullSql,
      tables,
      recordCount: totalRecordCount,
    };
  }
  
  // メタデータの保存
  private async saveMetadata(metadata: BackupMetadata): Promise<void> {
    const metadataFile = join(this.config.backupDir, `${metadata.id}.meta.json`);
    await Deno.writeTextFile(metadataFile, JSON.stringify(metadata, null, 2));
  }
  
  // バックアップ一覧の取得
  async listBackups(): Promise<BackupMetadata[]> {
    try {
      const backups: BackupMetadata[] = [];
      
      for await (const entry of Deno.readDir(this.config.backupDir)) {
        if (entry.name.endsWith(".meta.json")) {
          try {
            const metadataPath = join(this.config.backupDir, entry.name);
            const metadataContent = await Deno.readTextFile(metadataPath);
            const metadata: BackupMetadata = JSON.parse(metadataContent);
            backups.push(metadata);
          } catch (error) {
            console.warn(`Failed to read metadata file: ${entry.name}`, error);
          }
        }
      }
      
      // 作成日時でソート（新しい順）
      return backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return [];
      }
      throw error;
    }
  }
  
  // バックアップからの復元
  async restoreFromBackup(backupId: string): Promise<RestoreResult> {
    const startTime = performance.now();
    
    try {
      const backups = await this.listBackups();
      const backup = backups.find(b => b.id === backupId);
      
      if (!backup) {
        throw new Error(`Backup not found: ${backupId}`);
      }
      
      const backupPath = join(this.config.backupDir, backup.filename);
      
      // バックアップファイルの読み込み
      let sqlData = await Deno.readFile(backupPath);
      
      // 圧縮されている場合は解凍
      if (backup.compressed) {
        sqlData = await decompressData(sqlData);
      }
      
      const sqlContent = new TextDecoder().decode(sqlData);
      
      // チェックサムの検証
      const currentChecksum = await calculateChecksum(
        backup.compressed ? await compressData(new TextEncoder().encode(sqlContent)) : sqlData
      );
      
      if (currentChecksum !== backup.checksum) {
        throw new Error("Backup file checksum mismatch - file may be corrupted");
      }
      
      // データベースの復元
      await initDatabase();
      const db = getDatabase();
      
      // トランザクション内で復元を実行
      db.exec("BEGIN TRANSACTION;");
      
      try {
        // SQLを実行
        db.exec(sqlContent);
        db.exec("COMMIT;");
        
        const duration = performance.now() - startTime;
        
        console.log(`✅ Database restored from backup: ${backup.filename} (${Math.round(duration)}ms)`);
        
        return {
          success: true,
          restoredTables: backup.tables,
          restoredRecords: backup.recordCount,
          duration,
        };
        
      } catch (sqlError) {
        db.exec("ROLLBACK;");
        throw sqlError;
      }
      
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error("❌ Restore failed:", error);
      
      return {
        success: false,
        restoredTables: [],
        restoredRecords: 0,
        error: error.message,
        duration,
      };
    }
  }
  
  // 古いバックアップの削除
  async cleanupOldBackups(): Promise<{
    deletedCount: number;
    freedSpace: number;
  }> {
    try {
      const backups = await this.listBackups();
      const now = new Date();
      const cutoffDate = new Date(now.getTime() - this.config.retentionDays * 24 * 60 * 60 * 1000);
      
      let deletedCount = 0;
      let freedSpace = 0;
      
      // 保持期間を過ぎたバックアップを削除
      for (const backup of backups) {
        const backupDate = new Date(backup.createdAt);
        if (backupDate < cutoffDate) {
          try {
            // バックアップファイルの削除
            const backupPath = join(this.config.backupDir, backup.filename);
            await Deno.remove(backupPath);
            freedSpace += backup.size;
            
            // メタデータファイルの削除
            const metadataPath = join(this.config.backupDir, `${backup.id}.meta.json`);
            await Deno.remove(metadataPath);
            
            deletedCount++;
            console.log(`🗑️  Deleted old backup: ${backup.filename}`);
            
          } catch (error) {
            console.warn(`Failed to delete backup: ${backup.filename}`, error);
          }
        }
      }
      
      // 最大バックアップ数の制限
      const remainingBackups = backups.filter(b => new Date(b.createdAt) >= cutoffDate);
      if (remainingBackups.length > this.config.maxBackups) {
        const excessBackups = remainingBackups
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          .slice(0, remainingBackups.length - this.config.maxBackups);
        
        for (const backup of excessBackups) {
          try {
            const backupPath = join(this.config.backupDir, backup.filename);
            await Deno.remove(backupPath);
            freedSpace += backup.size;
            
            const metadataPath = join(this.config.backupDir, `${backup.id}.meta.json`);
            await Deno.remove(metadataPath);
            
            deletedCount++;
            console.log(`🗑️  Deleted excess backup: ${backup.filename}`);
            
          } catch (error) {
            console.warn(`Failed to delete backup: ${backup.filename}`, error);
          }
        }
      }
      
      if (deletedCount > 0) {
        console.log(`✅ Cleanup completed: ${deletedCount} backups deleted, ${this.formatSize(freedSpace)} freed`);
      }
      
      return { deletedCount, freedSpace };
      
    } catch (error) {
      console.error("❌ Cleanup failed:", error);
      return { deletedCount: 0, freedSpace: 0 };
    }
  }
  
  // ファイルサイズのフォーマット
  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)}${units[unitIndex]}`;
  }
}

// デフォルトのバックアップインスタンス
export const defaultBackup = new DatabaseBackup();