import { Handlers } from "$fresh/server.ts";
import { 
  generateToken, 
  generateRefreshToken, 
  createAuthCookies,
  validateEmail,
  type User 
} from "../../../utils/auth.ts";
import { authenticateUser } from "../../../utils/user-service.ts";
import { initDatabase } from "../../../utils/database.ts";

export const handler: Handlers = {
  async POST(req) {
    try {
      // データベース初期化
      await initDatabase();

      const body = await req.json();
      const { email, password, rememberMe = false } = body;

      // 入力検証
      if (!email || !password) {
        return new Response(JSON.stringify({
          success: false,
          error: "メールアドレスとパスワードは必須です"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (!validateEmail(email)) {
        return new Response(JSON.stringify({
          success: false,
          error: "有効なメールアドレスを入力してください"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // ユーザー認証
      const user = await authenticateUser(email, password);
      
      if (!user) {
        return new Response(JSON.stringify({
          success: false,
          error: "メールアドレスまたはパスワードが正しくありません"
        }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      // トークン生成
      const token = await generateToken(user);
      const refreshToken = await generateRefreshToken(user);

      // レスポンス用のユーザー情報（パスワードハッシュを除外）
      const userResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        bio: user.bio,
        role: user.role,
        createdAt: user.createdAt,
      };

      // Cookieを設定
      const cookies = createAuthCookies(token, refreshToken);

      return new Response(JSON.stringify({
        success: true,
        message: "ログインに成功しました",
        user: userResponse,
        token, // クライアント側でも使用可能
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": cookies[0], // メインのauth-token
          "Set-Cookie": cookies[1], // refresh-token
        },
      });

    } catch (error) {
      console.error("Login error:", error);
      
      return new Response(JSON.stringify({
        success: false,
        error: "ログイン処理中にエラーが発生しました"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  async GET(req) {
    // ログイン状態確認用のエンドポイント
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (action === "check") {
      try {
        // データベース初期化
        await initDatabase();
        
        const { getUserFromRequest } = await import("../../../utils/auth.ts");
        const user = await getUserFromRequest(req);

        if (user) {
          const userResponse = {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            bio: user.bio,
            role: user.role,
          };

          return new Response(JSON.stringify({
            success: true,
            authenticated: true,
            user: userResponse,
          }), {
            headers: { "Content-Type": "application/json" },
          });
        } else {
          return new Response(JSON.stringify({
            success: true,
            authenticated: false,
          }), {
            headers: { "Content-Type": "application/json" },
          });
        }
      } catch (error) {
        console.error("Auth check error:", error);
        return new Response(JSON.stringify({
          success: false,
          error: "認証確認中にエラーが発生しました"
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({
      success: false,
      error: "無効なリクエストです"
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  },
};