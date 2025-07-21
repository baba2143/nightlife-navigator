import { PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { apply } from "twind";
import { getUserFromRequest } from "../utils/auth.ts";

export async function handler(req: Request, ctx: any) {
  // 既にログインしている場合はホームページにリダイレクト
  const user = await getUserFromRequest(req);
  if (user) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/" },
    });
  }

  return ctx.render();
}

export default function LoginPage() {
  return (
    <>
      <Head>
        <title>ログイン - Nightlife Navigator</title>
        <meta name="description" content="Nightlife Navigatorにログインして夜遊びを楽しみましょう" />
      </Head>
      
      <main class="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center px-4">
        <div class="max-w-md w-full">
          {/* ロゴ */}
          <div class="text-center mb-8">
            <div class="flex justify-center mb-4">
              <div class="w-16 h-16 bg-pink-primary rounded-xl flex items-center justify-center">
                <span class="text-white font-bold text-2xl">🌸</span>
              </div>
            </div>
            <h1 class={apply`text-2xl font-heading font-bold text-pink-primary mb-2`}>
              Nightlife Navigator
            </h1>
            <p class={apply`text-text-secondary`}>
              アカウントにログインしてください
            </p>
          </div>

          {/* ログインフォーム */}
          <div class={apply`card-soft`}>
            <form id="loginForm" class="space-y-6">
              {/* エラーメッセージ */}
              <div id="errorMessage" class="hidden bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              </div>

              {/* 成功メッセージ */}
              <div id="successMessage" class="hidden bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              </div>

              {/* メールアドレス */}
              <div>
                <label for="email" class={apply`block text-sm font-medium text-text-primary mb-2`}>
                  メールアドレス
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  autocomplete="email"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-primary focus:border-transparent transition-colors"
                  placeholder="your@example.com"
                />
              </div>

              {/* パスワード */}
              <div>
                <label for="password" class={apply`block text-sm font-medium text-text-primary mb-2`}>
                  パスワード
                </label>
                <div class="relative">
                  <input
                    type="password"
                    id="password"
                    name="password"
                    required
                    autocomplete="current-password"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-primary focus:border-transparent transition-colors pr-12"
                    placeholder="パスワードを入力"
                  />
                  <button
                    type="button"
                    id="togglePassword"
                    class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    👁️
                  </button>
                </div>
              </div>

              {/* オプション */}
              <div class="flex items-center justify-between">
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    name="rememberMe"
                    class="w-4 h-4 text-pink-primary bg-gray-100 border-gray-300 rounded focus:ring-pink-primary focus:ring-2"
                  />
                  <span class="ml-2 text-sm text-text-secondary">ログイン状態を保持</span>
                </label>
                
                <a href="/forgot-password" class={apply`text-sm text-pink-primary hover:text-pink-primary-dark`}>
                  パスワードを忘れた方
                </a>
              </div>

              {/* ログインボタン */}
              <button
                type="submit"
                id="loginButton"
                class={apply`w-full btn-pink py-3 text-lg font-semibold`}
              >
                <span id="loginButtonText">ログイン</span>
                <div id="loginButtonLoading" class="hidden flex items-center justify-center">
                  <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  ログイン中...
                </div>
              </button>
            </form>

            {/* 区切り線 */}
            <div class="mt-8 mb-6">
              <div class="relative">
                <div class="absolute inset-0 flex items-center">
                  <div class="w-full border-t border-gray-300"></div>
                </div>
                <div class="relative flex justify-center text-sm">
                  <span class="px-2 bg-white text-gray-500">または</span>
                </div>
              </div>
            </div>

            {/* ソーシャルログイン */}
            <div class="space-y-3">
              <button class="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <span class="mr-2">🔍</span>
                Googleでログイン
              </button>
              
              <button class="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <span class="mr-2">📱</span>
                LINEでログイン
              </button>
            </div>

            {/* サインアップリンク */}
            <div class="mt-6 text-center">
              <p class={apply`text-text-secondary`}>
                アカウントをお持ちでない方は{" "}
                <a href="/signup" class={apply`text-pink-primary hover:text-pink-primary-dark font-medium`}>
                  こちらから新規登録
                </a>
              </p>
            </div>
          </div>

          {/* デモアカウント情報 */}
          <div class={apply`card-soft mt-6 bg-blue-50 border-blue-200`}>
            <h3 class={apply`font-semibold text-blue-800 mb-2`}>デモアカウント</h3>
            <div class="text-sm text-blue-700 space-y-1">
              <p><strong>メール:</strong> tanaka@example.com</p>
              <p><strong>パスワード:</strong> SecurePass123!</p>
              <button
                type="button"
                id="fillDemoData"
                class="mt-2 text-blue-600 hover:text-blue-800 underline text-xs"
              >
                デモデータを入力
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* JavaScript */}
      <script dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('DOMContentLoaded', function() {
            const form = document.getElementById('loginForm');
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            const loginButton = document.getElementById('loginButton');
            const loginButtonText = document.getElementById('loginButtonText');
            const loginButtonLoading = document.getElementById('loginButtonLoading');
            const errorMessage = document.getElementById('errorMessage');
            const successMessage = document.getElementById('successMessage');
            const togglePassword = document.getElementById('togglePassword');
            const fillDemoData = document.getElementById('fillDemoData');

            // パスワード表示切り替え
            togglePassword.addEventListener('click', function() {
              const type = passwordInput.getAttribute('type');
              if (type === 'password') {
                passwordInput.setAttribute('type', 'text');
                togglePassword.textContent = '🙈';
              } else {
                passwordInput.setAttribute('type', 'password');
                togglePassword.textContent = '👁️';
              }
            });

            // デモデータ入力
            fillDemoData.addEventListener('click', function() {
              emailInput.value = 'tanaka@example.com';
              passwordInput.value = 'SecurePass123!';
            });

            // エラーメッセージ表示
            function showError(message) {
              errorMessage.textContent = message;
              errorMessage.classList.remove('hidden');
              successMessage.classList.add('hidden');
            }

            // 成功メッセージ表示
            function showSuccess(message) {
              successMessage.textContent = message;
              successMessage.classList.remove('hidden');
              errorMessage.classList.add('hidden');
            }

            // メッセージ非表示
            function hideMessages() {
              errorMessage.classList.add('hidden');
              successMessage.classList.add('hidden');
            }

            // ローディング状態切り替え
            function setLoading(loading) {
              if (loading) {
                loginButton.disabled = true;
                loginButtonText.classList.add('hidden');
                loginButtonLoading.classList.remove('hidden');
              } else {
                loginButton.disabled = false;
                loginButtonText.classList.remove('hidden');
                loginButtonLoading.classList.add('hidden');
              }
            }

            // フォーム送信
            form.addEventListener('submit', async function(e) {
              e.preventDefault();
              
              hideMessages();
              setLoading(true);

              const formData = new FormData(form);
              const data = {
                email: formData.get('email'),
                password: formData.get('password'),
                rememberMe: formData.get('rememberMe') === 'on'
              };

              try {
                const response = await fetch('/api/auth/login', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(data),
                });

                const result = await response.json();

                if (result.success) {
                  showSuccess(result.message || 'ログインに成功しました');
                  
                  // 少し遅らせてリダイレクト
                  setTimeout(() => {
                    const urlParams = new URLSearchParams(window.location.search);
                    const redirectTo = urlParams.get('redirect') || '/';
                    window.location.href = redirectTo;
                  }, 1000);
                } else {
                  showError(result.error || 'ログインに失敗しました');
                }
              } catch (error) {
                console.error('Login error:', error);
                showError('ネットワークエラーが発生しました');
              } finally {
                setLoading(false);
              }
            });

            // 入力時にエラーメッセージを非表示
            [emailInput, passwordInput].forEach(input => {
              input.addEventListener('input', hideMessages);
            });
          });
        `
      }} />
    </>
  );
}