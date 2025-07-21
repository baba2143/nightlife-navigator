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

export default function SignupPage() {
  return (
    <>
      <Head>
        <title>新規登録 - Nightlife Navigator</title>
        <meta name="description" content="Nightlife Navigatorに新規登録して夜遊びを楽しみましょう" />
      </Head>
      
      <main class="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-8 px-4">
        <div class="max-w-md mx-auto">
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
              新しいアカウントを作成してください
            </p>
          </div>

          {/* サインアップフォーム */}
          <div class={apply`card-soft`}>
            <form id="signupForm" class="space-y-6">
              {/* エラーメッセージ */}
              <div id="errorMessage" class="hidden bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              </div>

              {/* 成功メッセージ */}
              <div id="successMessage" class="hidden bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              </div>

              {/* 名前 */}
              <div>
                <label for="name" class={apply`block text-sm font-medium text-text-primary mb-2`}>
                  お名前 <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  autocomplete="name"
                  maxlength="50"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-primary focus:border-transparent transition-colors"
                  placeholder="山田太郎"
                />
                <div class="mt-1 text-xs text-gray-500">2文字以上50文字以下</div>
              </div>

              {/* メールアドレス */}
              <div>
                <label for="email" class={apply`block text-sm font-medium text-text-primary mb-2`}>
                  メールアドレス <span class="text-red-500">*</span>
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
                <div id="emailValidation" class="mt-1 text-xs"></div>
              </div>

              {/* パスワード */}
              <div>
                <label for="password" class={apply`block text-sm font-medium text-text-primary mb-2`}>
                  パスワード <span class="text-red-500">*</span>
                </label>
                <div class="relative">
                  <input
                    type="password"
                    id="password"
                    name="password"
                    required
                    autocomplete="new-password"
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
                
                {/* パスワード要件 */}
                <div class="mt-2 space-y-1">
                  <div class="text-xs text-gray-600 mb-1">パスワードの要件:</div>
                  <div id="passwordRequirements" class="text-xs space-y-1">
                    <div id="req-length" class="flex items-center text-gray-500">
                      <span class="mr-2">⚫</span>8文字以上
                    </div>
                    <div id="req-upper" class="flex items-center text-gray-500">
                      <span class="mr-2">⚫</span>大文字を含む
                    </div>
                    <div id="req-lower" class="flex items-center text-gray-500">
                      <span class="mr-2">⚫</span>小文字を含む
                    </div>
                    <div id="req-number" class="flex items-center text-gray-500">
                      <span class="mr-2">⚫</span>数字を含む
                    </div>
                    <div id="req-special" class="flex items-center text-gray-500">
                      <span class="mr-2">⚫</span>特殊文字を含む
                    </div>
                  </div>
                </div>
              </div>

              {/* パスワード確認 */}
              <div>
                <label for="confirmPassword" class={apply`block text-sm font-medium text-text-primary mb-2`}>
                  パスワード確認 <span class="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  required
                  autocomplete="new-password"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-primary focus:border-transparent transition-colors"
                  placeholder="パスワードを再入力"
                />
                <div id="passwordMatch" class="mt-1 text-xs"></div>
              </div>

              {/* 自己紹介（オプション） */}
              <div>
                <label for="bio" class={apply`block text-sm font-medium text-text-primary mb-2`}>
                  自己紹介 <span class="text-gray-400">(オプション)</span>
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows="3"
                  maxlength="200"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-primary focus:border-transparent transition-colors resize-none"
                  placeholder="あなたの夜遊びスタイルや興味について教えてください..."
                ></textarea>
                <div class="mt-1 text-xs text-gray-500">最大200文字</div>
              </div>

              {/* 利用規約 */}
              <div class="flex items-start">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  name="agreeTerms"
                  required
                  class="w-4 h-4 text-pink-primary bg-gray-100 border-gray-300 rounded focus:ring-pink-primary focus:ring-2 mt-1"
                />
                <label for="agreeTerms" class="ml-3 text-sm text-text-secondary">
                  <a href="/terms" class="text-pink-primary hover:text-pink-primary-dark" target="_blank">利用規約</a>
                  および
                  <a href="/privacy" class="text-pink-primary hover:text-pink-primary-dark" target="_blank">プライバシーポリシー</a>
                  に同意します <span class="text-red-500">*</span>
                </label>
              </div>

              {/* 登録ボタン */}
              <button
                type="submit"
                id="signupButton"
                class={apply`w-full btn-pink py-3 text-lg font-semibold`}
                disabled
              >
                <span id="signupButtonText">アカウントを作成</span>
                <div id="signupButtonLoading" class="hidden flex items-center justify-center">
                  <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  作成中...
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

            {/* ソーシャル登録 */}
            <div class="space-y-3">
              <button class="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <span class="mr-2">🔍</span>
                Googleで登録
              </button>
              
              <button class="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <span class="mr-2">📱</span>
                LINEで登録
              </button>
            </div>

            {/* ログインリンク */}
            <div class="mt-6 text-center">
              <p class={apply`text-text-secondary`}>
                既にアカウントをお持ちの方は{" "}
                <a href="/login" class={apply`text-pink-primary hover:text-pink-primary-dark font-medium`}>
                  こちらからログイン
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* JavaScript */}
      <script dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('DOMContentLoaded', function() {
            const form = document.getElementById('signupForm');
            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            const confirmPasswordInput = document.getElementById('confirmPassword');
            const bioInput = document.getElementById('bio');
            const agreeTermsInput = document.getElementById('agreeTerms');
            const signupButton = document.getElementById('signupButton');
            const signupButtonText = document.getElementById('signupButtonText');
            const signupButtonLoading = document.getElementById('signupButtonLoading');
            const errorMessage = document.getElementById('errorMessage');
            const successMessage = document.getElementById('successMessage');
            const togglePassword = document.getElementById('togglePassword');
            const emailValidation = document.getElementById('emailValidation');
            const passwordMatch = document.getElementById('passwordMatch');

            // パスワード要件の要素
            const requirements = {
              length: document.getElementById('req-length'),
              upper: document.getElementById('req-upper'),
              lower: document.getElementById('req-lower'),
              number: document.getElementById('req-number'),
              special: document.getElementById('req-special'),
            };

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

            // パスワード要件チェック
            function checkPasswordRequirements(password) {
              const checks = {
                length: password.length >= 8,
                upper: /[A-Z]/.test(password),
                lower: /[a-z]/.test(password),
                number: /[0-9]/.test(password),
                special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
              };

              Object.keys(checks).forEach(key => {
                const element = requirements[key];
                const passed = checks[key];
                
                if (passed) {
                  element.className = 'flex items-center text-green-600';
                  element.querySelector('span').textContent = '✅';
                } else {
                  element.className = 'flex items-center text-gray-500';
                  element.querySelector('span').textContent = '⚫';
                }
              });

              return Object.values(checks).every(Boolean);
            }

            // メール重複チェック
            let emailCheckTimeout;
            async function checkEmailAvailability(email) {
              if (!email || !email.includes('@')) return;

              try {
                const response = await fetch(\`/api/auth/signup?action=check-email&email=\${encodeURIComponent(email)}\`);
                const result = await response.json();
                
                if (result.success) {
                  if (result.available) {
                    emailValidation.textContent = '✅ このメールアドレスは利用可能です';
                    emailValidation.className = 'mt-1 text-xs text-green-600';
                  } else {
                    emailValidation.textContent = '❌ このメールアドレスは既に使用されています';
                    emailValidation.className = 'mt-1 text-xs text-red-600';
                  }
                }
              } catch (error) {
                console.error('Email check error:', error);
              }
            }

            // パスワード一致チェック
            function checkPasswordMatch() {
              const password = passwordInput.value;
              const confirmPassword = confirmPasswordInput.value;
              
              if (!confirmPassword) {
                passwordMatch.textContent = '';
                return false;
              }
              
              if (password === confirmPassword) {
                passwordMatch.textContent = '✅ パスワードが一致しています';
                passwordMatch.className = 'mt-1 text-xs text-green-600';
                return true;
              } else {
                passwordMatch.textContent = '❌ パスワードが一致しません';
                passwordMatch.className = 'mt-1 text-xs text-red-600';
                return false;
              }
            }

            // フォーム検証
            function validateForm() {
              const name = nameInput.value.trim();
              const email = emailInput.value.trim();
              const password = passwordInput.value;
              const confirmPassword = confirmPasswordInput.value;
              const agreeTerms = agreeTermsInput.checked;
              
              const isNameValid = name.length >= 2 && name.length <= 50;
              const isEmailValid = email.includes('@');
              const isPasswordValid = checkPasswordRequirements(password);
              const isPasswordMatched = password === confirmPassword && confirmPassword.length > 0;
              const isTermsAgreed = agreeTerms;
              
              const isValid = isNameValid && isEmailValid && isPasswordValid && isPasswordMatched && isTermsAgreed;
              
              signupButton.disabled = !isValid;
              if (isValid) {
                signupButton.classList.remove('opacity-50', 'cursor-not-allowed');
              } else {
                signupButton.classList.add('opacity-50', 'cursor-not-allowed');
              }
              
              return isValid;
            }

            // イベントリスナー
            passwordInput.addEventListener('input', function() {
              checkPasswordRequirements(this.value);
              checkPasswordMatch();
              validateForm();
            });

            confirmPasswordInput.addEventListener('input', function() {
              checkPasswordMatch();
              validateForm();
            });

            emailInput.addEventListener('input', function() {
              clearTimeout(emailCheckTimeout);
              emailCheckTimeout = setTimeout(() => {
                checkEmailAvailability(this.value);
              }, 500);
              validateForm();
            });

            [nameInput, agreeTermsInput].forEach(input => {
              input.addEventListener('input', validateForm);
              input.addEventListener('change', validateForm);
            });

            // エラーメッセージ表示
            function showError(message, details = []) {
              if (details.length > 0) {
                errorMessage.innerHTML = message + '<ul class="mt-2 ml-4 list-disc">' + 
                  details.map(detail => '<li>' + detail + '</li>').join('') + '</ul>';
              } else {
                errorMessage.textContent = message;
              }
              errorMessage.classList.remove('hidden');
              successMessage.classList.add('hidden');
            }

            // 成功メッセージ表示
            function showSuccess(message) {
              successMessage.textContent = message;
              successMessage.classList.remove('hidden');
              errorMessage.classList.add('hidden');
            }

            // ローディング状態切り替え
            function setLoading(loading) {
              if (loading) {
                signupButton.disabled = true;
                signupButtonText.classList.add('hidden');
                signupButtonLoading.classList.remove('hidden');
              } else {
                signupButtonText.classList.remove('hidden');
                signupButtonLoading.classList.add('hidden');
                validateForm(); // ボタンの状態を再検証
              }
            }

            // フォーム送信
            form.addEventListener('submit', async function(e) {
              e.preventDefault();
              
              if (!validateForm()) {
                showError('入力内容を確認してください');
                return;
              }
              
              setLoading(true);

              const formData = new FormData(form);
              const data = {
                name: formData.get('name').trim(),
                email: formData.get('email').trim(),
                password: formData.get('password'),
                bio: formData.get('bio').trim(),
              };

              try {
                const response = await fetch('/api/auth/signup', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(data),
                });

                const result = await response.json();

                if (result.success) {
                  showSuccess(result.message || 'アカウントが作成されました');
                  
                  // 少し遅らせてリダイレクト
                  setTimeout(() => {
                    window.location.href = '/';
                  }, 1500);
                } else {
                  showError(result.error || 'アカウント作成に失敗しました', result.details);
                }
              } catch (error) {
                console.error('Signup error:', error);
                showError('ネットワークエラーが発生しました');
              } finally {
                setLoading(false);
              }
            });

            // 初期検証
            validateForm();
          });
        `
      }} />
    </>
  );
}