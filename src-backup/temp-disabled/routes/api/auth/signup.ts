import { Handlers } from "$fresh/server.ts";
import { 
  generateToken, 
  generateRefreshToken, 
  createAuthCookies,
  validateEmail,
  validatePassword,
  type User 
} from "../../../utils/auth.ts";
import { createUser, isEmailAvailable } from "../../../utils/user-service.ts";
import { initDatabase } from "../../../utils/database.ts";

export const handler: Handlers = {
  async POST(req) {
    try {
      // データベース初期化
      await initDatabase();

      const body = await req.json();
      const { email, password, name, bio = "" } = body;

      // 入力検証
      if (!email || !password || !name) {
        return new Response(JSON.stringify({
          success: false,
          error: "メールアドレス、パスワード、名前は必須です"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // メールアドレス検証
      if (!validateEmail(email)) {
        return new Response(JSON.stringify({
          success: false,
          error: "有効なメールアドレスを入力してください"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // パスワード強度検証
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return new Response(JSON.stringify({
          success: false,
          error: "パスワードが要件を満たしていません",
          details: passwordValidation.errors
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 名前の長さチェック
      if (name.length < 2 || name.length > 50) {
        return new Response(JSON.stringify({
          success: false,
          error: "名前は2文字以上50文字以下で入力してください"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // ユーザー作成
      try {
        const newUser = await createUser({
          email,
          password,
          name,
          bio,
        });

      // トークン生成
      const token = await generateToken(newUser);
      const refreshToken = await generateRefreshToken(newUser);

        // レスポンス用のユーザー情報（パスワードハッシュを除外）
        const userResponse = {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          bio: newUser.bio,
          role: newUser.role,
          createdAt: newUser.createdAt,
        };

        // Cookieを設定
        const cookies = createAuthCookies(token, refreshToken);

        return new Response(JSON.stringify({
          success: true,
          message: "アカウントが正常に作成されました",
          user: userResponse,
          token,
        }), {
          status: 201,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": cookies[0],
            "Set-Cookie": cookies[1],
          },
        });

      } catch (createError) {
        // ユーザー作成エラー（重複メールアドレスなど）
        return new Response(JSON.stringify({
          success: false,
          error: createError.message || "アカウント作成に失敗しました"
        }), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        });
      }

    } catch (error) {
      console.error("Signup error:", error);
      
      return new Response(JSON.stringify({
        success: false,
        error: "アカウント作成中にエラーが発生しました"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  async GET(req) {
    // アカウント作成の要件を返すエンドポイント
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (action === "requirements") {
      return new Response(JSON.stringify({
        success: true,
        requirements: {
          password: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumber: true,
            requireSpecialChar: true,
          },
          name: {
            minLength: 2,
            maxLength: 50,
          },
          email: {
            format: "有効なメールアドレス形式",
          },
        },
        passwordCriteria: [
          "8文字以上",
          "大文字を含む",
          "小文字を含む", 
          "数字を含む",
          "特殊文字を含む (!@#$%^&*(),.?\":{}|<>)",
        ],
      }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (action === "check-email") {
      try {
        // データベース初期化
        await initDatabase();

        const email = url.searchParams.get("email");
        
        if (!email) {
          return new Response(JSON.stringify({
            success: false,
            error: "メールアドレスが指定されていません"
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (!validateEmail(email)) {
          return new Response(JSON.stringify({
            success: false,
            available: false,
            error: "有効なメールアドレス形式ではありません"
          }), {
            headers: { "Content-Type": "application/json" },
          });
        }

        const available = isEmailAvailable(email);
        
        return new Response(JSON.stringify({
          success: true,
          available,
          message: available ? "このメールアドレスは利用可能です" : "このメールアドレスは既に使用されています"
        }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Email check error:", error);
        return new Response(JSON.stringify({
          success: false,
          error: "メールアドレスチェック中にエラーが発生しました"
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