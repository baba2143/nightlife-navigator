import { getDatabase } from "./database.ts";
import { hashPassword, verifyPassword, type User } from "./auth.ts";

export interface CreateUserData {
  email: string;
  name: string;
  password: string;
  bio?: string;
  role?: 'user' | 'admin' | 'venue_owner';
}

export interface UpdateUserData {
  name?: string;
  bio?: string;
  avatar?: string;
}

export interface UserStats {
  visitedVenues: number;
  totalReviews: number;
  averageRating: number;
  helpfulVotes: number;
  favoriteVenues: number;
  totalCheckins: number;
}

// ユーザー作成
export async function createUser(userData: CreateUserData): Promise<User> {
  const db = getDatabase();
  
  // メールアドレスの重複チェック
  const existingUser = db.prepare(
    "SELECT id FROM users WHERE email = ?"
  ).get(userData.email);
  
  if (existingUser) {
    throw new Error("このメールアドレスは既に登録されています");
  }
  
  // パスワードハッシュ化
  const hashedPassword = await hashPassword(userData.password);
  
  // ユーザー挿入
  const insertResult = db.prepare(`
    INSERT INTO users (email, name, hashed_password, bio, role)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    userData.email.toLowerCase(),
    userData.name.trim(),
    hashedPassword,
    userData.bio?.trim() || "",
    userData.role || "user"
  );
  
  const userId = insertResult.lastInsertRowId as number;
  
  // 作成されたユーザーを取得
  const user = getUserById(userId);
  if (!user) {
    throw new Error("ユーザーの作成に失敗しました");
  }
  
  console.log(`User created: ${user.email} (ID: ${user.id})`);
  return user;
}

// ID でユーザー取得
export function getUserById(id: number): User | null {
  const db = getDatabase();
  
  const row = db.prepare(`
    SELECT id, email, name, hashed_password, avatar, bio, role, is_active, created_at, updated_at
    FROM users
    WHERE id = ? AND is_active = TRUE
  `).get(id) as any;
  
  if (!row) return null;
  
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    hashedPassword: row.hashed_password,
    avatar: row.avatar,
    bio: row.bio,
    role: row.role,
    isActive: row.is_active,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// メールアドレスでユーザー取得
export function getUserByEmail(email: string): User | null {
  const db = getDatabase();
  
  const row = db.prepare(`
    SELECT id, email, name, hashed_password, avatar, bio, role, is_active, created_at, updated_at
    FROM users
    WHERE email = ? AND is_active = TRUE
  `).get(email.toLowerCase()) as any;
  
  if (!row) return null;
  
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    hashedPassword: row.hashed_password,
    avatar: row.avatar,
    bio: row.bio,
    role: row.role,
    isActive: row.is_active,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// ユーザー認証
export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const user = getUserByEmail(email);
  if (!user) return null;
  
  const isPasswordValid = await verifyPassword(password, user.hashedPassword);
  if (!isPasswordValid) return null;
  
  return user;
}

// ユーザー更新
export function updateUser(id: number, updateData: UpdateUserData): User | null {
  const db = getDatabase();
  
  const setParts: string[] = [];
  const values: any[] = [];
  
  if (updateData.name !== undefined) {
    setParts.push("name = ?");
    values.push(updateData.name.trim());
  }
  
  if (updateData.bio !== undefined) {
    setParts.push("bio = ?");
    values.push(updateData.bio.trim());
  }
  
  if (updateData.avatar !== undefined) {
    setParts.push("avatar = ?");
    values.push(updateData.avatar);
  }
  
  if (setParts.length === 0) {
    // 更新するデータがない場合は現在のユーザーを返す
    return getUserById(id);
  }
  
  setParts.push("updated_at = CURRENT_TIMESTAMP");
  values.push(id);
  
  const sql = `UPDATE users SET ${setParts.join(", ")} WHERE id = ?`;
  
  const result = db.prepare(sql).run(...values);
  
  if (result.changes === 0) {
    return null; // ユーザーが見つからない
  }
  
  return getUserById(id);
}

// ユーザー削除（論理削除）
export function deleteUser(id: number): boolean {
  const db = getDatabase();
  
  const result = db.prepare(`
    UPDATE users SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(id);
  
  return result.changes > 0;
}

// ユーザー統計取得
export function getUserStats(userId: number): UserStats {
  const db = getDatabase();
  
  // 訪問店舗数（チェックイン数）
  const visitedVenues = db.prepare(`
    SELECT COUNT(DISTINCT venue_id) as count
    FROM checkins
    WHERE user_id = ?
  `).get(userId) as { count: number };
  
  // レビュー数と平均評価
  const reviewStats = db.prepare(`
    SELECT COUNT(*) as count, AVG(rating) as avg_rating
    FROM reviews
    WHERE user_id = ?
  `).get(userId) as { count: number; avg_rating: number };
  
  // 有用投票数
  const helpfulVotes = db.prepare(`
    SELECT SUM(helpful_votes) as total
    FROM reviews
    WHERE user_id = ?
  `).get(userId) as { total: number };
  
  // お気に入り店舗数
  const favoriteVenues = db.prepare(`
    SELECT COUNT(*) as count
    FROM favorites
    WHERE user_id = ?
  `).get(userId) as { count: number };
  
  // 総チェックイン数
  const totalCheckins = db.prepare(`
    SELECT COUNT(*) as count
    FROM checkins
    WHERE user_id = ?
  `).get(userId) as { count: number };
  
  return {
    visitedVenues: visitedVenues.count,
    totalReviews: reviewStats.count,
    averageRating: Math.round((reviewStats.avg_rating || 0) * 10) / 10,
    helpfulVotes: helpfulVotes.total || 0,
    favoriteVenues: favoriteVenues.count,
    totalCheckins: totalCheckins.count,
  };
}

// ユーザー一覧取得（管理者用）
export function getUsers(
  limit: number = 50,
  offset: number = 0,
  search?: string
): { users: User[]; total: number } {
  const db = getDatabase();
  
  let whereClause = "WHERE is_active = TRUE";
  const params: any[] = [];
  
  if (search) {
    whereClause += " AND (name LIKE ? OR email LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  
  // 総数を取得
  const totalResult = db.prepare(`
    SELECT COUNT(*) as count FROM users ${whereClause}
  `).get(...params) as { count: number };
  
  // ユーザー一覧を取得
  params.push(limit, offset);
  const rows = db.prepare(`
    SELECT id, email, name, avatar, bio, role, created_at, updated_at
    FROM users
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params) as any[];
  
  const users: User[] = rows.map(row => ({
    id: row.id,
    email: row.email,
    name: row.name,
    hashedPassword: "", // セキュリティ上パスワードハッシュは含めない
    avatar: row.avatar,
    bio: row.bio,
    role: row.role,
    isActive: true,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }));
  
  return {
    users,
    total: totalResult.count,
  };
}

// パスワード更新
export async function updatePassword(id: number, newPassword: string): Promise<boolean> {
  const db = getDatabase();
  
  const hashedPassword = await hashPassword(newPassword);
  
  const result = db.prepare(`
    UPDATE users SET hashed_password = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(hashedPassword, id);
  
  return result.changes > 0;
}

// メールアドレス利用可能性チェック
export function isEmailAvailable(email: string, excludeUserId?: number): boolean {
  const db = getDatabase();
  
  let sql = "SELECT id FROM users WHERE email = ?";
  const params: any[] = [email.toLowerCase()];
  
  if (excludeUserId) {
    sql += " AND id != ?";
    params.push(excludeUserId);
  }
  
  const result = db.prepare(sql).get(...params);
  return result === undefined;
}

// ユーザーの最近のアクティビティ取得
export function getUserRecentActivity(userId: number, limit: number = 10): any[] {
  const db = getDatabase();
  
  // 最近のチェックイン、レビュー、お気に入りを統合して取得
  const activities = db.prepare(`
    SELECT 
      'checkin' as type,
      v.name as venue_name,
      c.comment as description,
      c.created_at
    FROM checkins c
    JOIN venues v ON c.venue_id = v.id
    WHERE c.user_id = ?
    
    UNION ALL
    
    SELECT 
      'review' as type,
      v.name as venue_name,
      r.title as description,
      r.created_at
    FROM reviews r
    JOIN venues v ON r.venue_id = v.id
    WHERE r.user_id = ?
    
    UNION ALL
    
    SELECT 
      'favorite' as type,
      v.name as venue_name,
      'お気に入りに追加' as description,
      f.created_at
    FROM favorites f
    JOIN venues v ON f.venue_id = v.id
    WHERE f.user_id = ?
    
    ORDER BY created_at DESC
    LIMIT ?
  `).all(userId, userId, userId, limit);
  
  return activities;
}