import { Handlers } from "$fresh/server.ts";
import { clearAuthCookies, getUserFromRequest } from "../../../utils/auth.ts";

export const handler: Handlers = {
  async POST(req) {
    try {
      // 現在のユーザーを取得（ログ用）
      const user = await getUserFromRequest(req);
      
      if (user) {
        console.log(`User logged out: ${user.email} (ID: ${user.id})`);
      }

      // 認証Cookieをクリア
      const clearCookies = clearAuthCookies();

      return new Response(JSON.stringify({
        success: true,
        message: "ログアウトしました"
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": clearCookies,
        },
      });

    } catch (error) {
      console.error("Logout error:", error);
      
      // エラーが発生してもCookieはクリアする
      const clearCookies = clearAuthCookies();
      
      return new Response(JSON.stringify({
        success: true, // ログアウトは常に成功として扱う
        message: "ログアウトしました"
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": clearCookies,
        },
      });
    }
  },

  async GET(req) {
    // GETリクエストでもログアウトを許可（リダイレクト用）
    try {
      const user = await getUserFromRequest(req);
      
      if (user) {
        console.log(`User logged out via GET: ${user.email} (ID: ${user.id})`);
      }

      const clearCookies = clearAuthCookies();

      // ログアウト後はホームページにリダイレクト
      return new Response(null, {
        status: 302,
        headers: {
          "Location": "/",
          "Set-Cookie": clearCookies,
        },
      });

    } catch (error) {
      console.error("Logout error:", error);
      
      const clearCookies = clearAuthCookies();
      
      return new Response(null, {
        status: 302,
        headers: {
          "Location": "/",
          "Set-Cookie": clearCookies,
        },
      });
    }
  },
};