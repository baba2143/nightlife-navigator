import { Database } from "https://deno.land/x/sqlite3@0.11.1/mod.ts";

// データベースファイルの場所
const DB_PATH = "./data/nightlife_navigator.db";

// データベースインスタンス
let db: Database | null = null;

// データベース初期化
export async function initDatabase(): Promise<Database> {
  if (db) return db;

  try {
    // データディレクトリを作成
    try {
      await Deno.mkdir("./data", { recursive: true });
    } catch (error) {
      // ディレクトリが既に存在する場合は無視
      if (!(error instanceof Deno.errors.AlreadyExists)) {
        throw error;
      }
    }

    // データベースを開く
    db = new Database(DB_PATH);
    console.log("Database connected:", DB_PATH);

    // テーブル作成
    await createTables();
    
    // サンプルデータの挿入
    await insertSampleData();

    return db;
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
}

// テーブル作成
async function createTables(): Promise<void> {
  if (!db) throw new Error("Database not initialized");

  // ユーザーテーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      hashed_password TEXT NOT NULL,
      avatar TEXT,
      bio TEXT,
      role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'venue_owner')),
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 店舗テーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS venues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      address TEXT NOT NULL,
      phone TEXT,
      website TEXT,
      description TEXT,
      price_range TEXT CHECK (price_range IN ('budget', 'moderate', 'expensive', 'luxury')),
      latitude REAL,
      longitude REAL,
      hours TEXT,
      is_open BOOLEAN DEFAULT TRUE,
      rating REAL DEFAULT 0.0,
      review_count INTEGER DEFAULT 0,
      owner_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users (id)
    )
  `);

  // 店舗タグテーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS venue_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venue_id INTEGER NOT NULL,
      tag TEXT NOT NULL,
      FOREIGN KEY (venue_id) REFERENCES venues (id) ON DELETE CASCADE,
      UNIQUE(venue_id, tag)
    )
  `);

  // レビューテーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venue_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      title TEXT,
      content TEXT,
      helpful_votes INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (venue_id) REFERENCES venues (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(venue_id, user_id)
    )
  `);

  // お気に入りテーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      venue_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (venue_id) REFERENCES venues (id) ON DELETE CASCADE,
      UNIQUE(user_id, venue_id)
    )
  `);

  // 画像テーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      original_name TEXT,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      mime_type TEXT,
      category TEXT NOT NULL CHECK (category IN ('venue', 'profile', 'review')),
      venue_id INTEGER,
      user_id INTEGER,
      review_id INTEGER,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (venue_id) REFERENCES venues (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (review_id) REFERENCES reviews (id) ON DELETE CASCADE
    )
  `);

  // チェックインテーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      venue_id INTEGER NOT NULL,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (venue_id) REFERENCES venues (id) ON DELETE CASCADE
    )
  `);

  // チャットルームテーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('direct', 'venue', 'group')),
      venue_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (venue_id) REFERENCES venues (id) ON DELETE CASCADE
    )
  `);

  // チャット参加者テーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_read_at DATETIME,
      FOREIGN KEY (room_id) REFERENCES chat_rooms (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(room_id, user_id)
    )
  `);

  // チャットメッセージテーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system')),
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES chat_rooms (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // エラーログテーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS error_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      error_id TEXT UNIQUE NOT NULL,
      timestamp TEXT NOT NULL,
      user_agent TEXT NOT NULL,
      url TEXT NOT NULL,
      referrer TEXT,
      error_message TEXT,
      error_stack TEXT,
      user_id INTEGER,
      session_id TEXT,
      additional_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
    )
  `);

  // エラー統計テーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS error_statistics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE NOT NULL,
      error_count INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 通知テーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      data TEXT, -- JSON形式で追加データを保存
      is_read BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // インデックス作成
  createIndexes();

  console.log("Database tables created successfully");
}

// インデックス作成
function createIndexes(): void {
  if (!db) return;

  try {
    // パフォーマンス向上のためのインデックス
    db.exec(`CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_venues_category ON venues (category)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_venues_location ON venues (latitude, longitude)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_reviews_venue ON reviews (venue_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews (user_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites (user_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_favorites_venue ON favorites (venue_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_images_venue ON images (venue_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_images_user ON images (user_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_checkins_venue ON checkins (venue_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_checkins_user ON checkins (user_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages (room_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications (user_id, is_read)`);

    console.log("Database indexes created successfully");
  } catch (error) {
    console.error("Error creating indexes:", error);
  }
}

// サンプルデータの挿入
async function insertSampleData(): Promise<void> {
  if (!db) return;

  try {
    // ユーザーの存在チェック
    const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
    
    if (userCount.count === 0) {
      // サンプルユーザーを挿入
      const insertUser = db.prepare(`
        INSERT INTO users (email, name, hashed_password, bio, role)
        VALUES (?, ?, ?, ?, ?)
      `);

      insertUser.run(
        "tanaka@example.com",
        "田中太郎",
        "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f", // SecurePass123!
        "ナイトライフ愛好家。美味しいお酒と音楽を求めて東京の夜を探索中。",
        "user"
      );

      insertUser.run(
        "sato@example.com",
        "佐藤花子",
        "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f", // SecurePass123!
        "美食探求者。隠れた名店を見つけるのが趣味です。",
        "user"
      );

      insertUser.run(
        "admin@nightlife-navigator.com",
        "管理者",
        "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f", // SecurePass123!
        "Nightlife Navigator管理者",
        "admin"
      );

      console.log("Sample users inserted");
    }

    // 店舗の存在チェック
    const venueCount = db.prepare("SELECT COUNT(*) as count FROM venues").get() as { count: number };
    
    if (venueCount.count === 0) {
      // サンプル店舗を挿入
      const insertVenue = db.prepare(`
        INSERT INTO venues (name, category, address, phone, website, description, price_range, latitude, longitude, hours)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const venueId1 = insertVenue.run(
        "GENTLE LOUNGE",
        "lounge",
        "東京都渋谷区渋谷1-2-3",
        "03-1234-5678",
        "https://gentle-lounge.com",
        "やさしいピンクの温かみのあるデザインで、心地よい雰囲気を演出。最高品質のカクテルと音楽で、特別な夜をお過ごしください。",
        "expensive",
        35.6598,
        139.7006,
        "18:00-02:00"
      ).lastInsertRowId;

      const venueId2 = insertVenue.run(
        "NEON BAR",
        "bar",
        "東京都新宿区新宿2-3-4",
        "03-2345-6789",
        "https://neon-bar.com",
        "ネオンライトが美しい大人のバー。カクテルの種類が豊富で、熟練のバーテンダーが最高の一杯をお作りします。",
        "moderate",
        35.6896,
        139.6917,
        "17:00-01:00"
      ).lastInsertRowId;

      const venueId3 = insertVenue.run(
        "TOKYO DINING",
        "restaurant",
        "東京都港区六本木3-4-5",
        "03-3456-7890",
        "https://tokyo-dining.com",
        "高級感あふれるダイニングレストラン。シェフが厳選した食材を使用した創作料理をお楽しみください。",
        "luxury",
        35.6627,
        139.7371,
        "18:00-23:00"
      ).lastInsertRowId;

      // 店舗タグを挿入
      const insertTag = db.prepare("INSERT INTO venue_tags (venue_id, tag) VALUES (?, ?)");
      
      insertTag.run(venueId1, "ラウンジ");
      insertTag.run(venueId1, "やさしい");
      insertTag.run(venueId1, "ピンク");
      insertTag.run(venueId1, "カクテル");

      insertTag.run(venueId2, "バー");
      insertTag.run(venueId2, "ネオン");
      insertTag.run(venueId2, "カクテル");
      insertTag.run(venueId2, "大人");

      insertTag.run(venueId3, "レストラン");
      insertTag.run(venueId3, "高級");
      insertTag.run(venueId3, "ディナー");
      insertTag.run(venueId3, "創作料理");

      console.log("Sample venues and tags inserted");
    }

  } catch (error) {
    console.error("Error inserting sample data:", error);
  }
}

// データベースを取得
export function getDatabase(): Database {
  if (!db) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return db;
}

// データベースを閉じる
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    console.log("Database connection closed");
  }
}

// トランザクション実行
export function transaction<T>(callback: (db: Database) => T): T {
  const database = getDatabase();
  database.exec("BEGIN TRANSACTION");
  
  try {
    const result = callback(database);
    database.exec("COMMIT");
    return result;
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

// ヘルスチェック
export function healthCheck(): { status: string; message: string } {
  try {
    if (!db) {
      return { status: "error", message: "Database not initialized" };
    }
    
    // 簡単なクエリを実行
    const result = db.prepare("SELECT 1 as test").get() as { test: number };
    
    if (result.test === 1) {
      return { status: "ok", message: "Database is healthy" };
    } else {
      return { status: "error", message: "Database query failed" };
    }
  } catch (error) {
    return { 
      status: "error", 
      message: `Database health check failed: ${error.message}` 
    };
  }
}