import { apply } from "twind";
import NotificationSystem from "../islands/NotificationSystem.tsx";

interface HeaderProps {
  userId?: number;
  userName?: string;
  userAvatar?: string;
}

export default function Header({ userId, userName, userAvatar }: HeaderProps) {
  return (
    <header class="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between h-16">
          {/* ロゴ */}
          <div class="flex items-center">
            <a href="/" class="flex items-center gap-2">
              <div class="w-8 h-8 bg-pink-primary rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-lg">🌸</span>
              </div>
              <span class={apply`text-xl font-heading font-bold text-pink-primary`}>
                Nightlife Navigator
              </span>
            </a>
          </div>

          {/* ナビゲーション（デスクトップ） */}
          <nav class="hidden md:flex items-center space-x-8">
            <a 
              href="/search" 
              class={apply`text-text-primary hover:text-pink-primary font-medium transition-colors`}
            >
              🔍 検索
            </a>
            <a 
              href="/map" 
              class={apply`text-text-primary hover:text-pink-primary font-medium transition-colors`}
            >
              🗺️ マップ
            </a>
            <a 
              href="/favorites" 
              class={apply`text-text-primary hover:text-pink-primary font-medium transition-colors`}
            >
              ❤️ お気に入り
            </a>
            <a 
              href="/events" 
              class={apply`text-text-primary hover:text-pink-primary font-medium transition-colors`}
            >
              🎉 イベント
            </a>
          </nav>

          {/* ユーザーエリア */}
          <div class="flex items-center gap-4">
            {/* 通知システム */}
            <NotificationSystem 
              userId={userId}
              position="top-right"
              enableSound={true}
            />

            {/* チャットボタン */}
            <button
              onClick={() => {
                // ライブチャットを開く
                const chatEvent = new CustomEvent('openLiveChat', {
                  detail: { userId, userName, userAvatar }
                });
                window.dispatchEvent(chatEvent);
              }}
              class={apply`p-2 rounded-full hover:bg-pink-light transition-colors text-gray-600 hover:text-pink-primary`}
              title="チャット"
            >
              💬
            </button>

            {/* ユーザーメニュー */}
            {userId ? (
              <div class="relative group">
                <button class="flex items-center gap-2 p-2 rounded-lg hover:bg-pink-light transition-colors">
                  {userAvatar ? (
                    <img 
                      src={userAvatar} 
                      alt={userName}
                      class="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div class="w-8 h-8 bg-pink-light rounded-full flex items-center justify-center">
                      <span class={apply`text-pink-primary font-semibold`}>
                        {userName?.charAt(0) || 'U'}
                      </span>
                    </div>
                  )}
                  <span class="hidden md:block text-text-primary font-medium">
                    {userName || 'ユーザー'}
                  </span>
                  <span class="text-gray-400">▼</span>
                </button>

                {/* ドロップダウンメニュー */}
                <div class="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div class="py-2">
                    <a 
                      href="/profile" 
                      class="flex items-center gap-2 px-4 py-2 text-text-primary hover:bg-pink-light transition-colors"
                    >
                      👤 プロフィール
                    </a>
                    <a 
                      href="/settings" 
                      class="flex items-center gap-2 px-4 py-2 text-text-primary hover:bg-pink-light transition-colors"
                    >
                      ⚙️ 設定
                    </a>
                    <a 
                      href="/notifications" 
                      class="flex items-center gap-2 px-4 py-2 text-text-primary hover:bg-pink-light transition-colors"
                    >
                      🔔 通知設定
                    </a>
                    <div class="border-t border-gray-200 my-2"></div>
                    <a 
                      href="/help" 
                      class="flex items-center gap-2 px-4 py-2 text-text-primary hover:bg-pink-light transition-colors"
                    >
                      ❓ ヘルプ
                    </a>
                    <button 
                      onClick={() => {
                        // ログアウト処理
                        if (confirm('ログアウトしますか？')) {
                          window.location.href = '/logout';
                        }
                      }}
                      class="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                    >
                      🚪 ログアウト
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div class="flex items-center gap-2">
                <a 
                  href="/login" 
                  class={apply`btn-pink-outline`}
                >
                  ログイン
                </a>
                <a 
                  href="/signup" 
                  class={apply`btn-pink`}
                >
                  新規登録
                </a>
              </div>
            )}

            {/* モバイルメニューボタン */}
            <button
              onClick={() => {
                const mobileMenu = document.getElementById('mobile-menu');
                if (mobileMenu) {
                  mobileMenu.classList.toggle('hidden');
                }
              }}
              class="md:hidden p-2 rounded-lg hover:bg-pink-light transition-colors"
              title="メニュー"
            >
              <div class="w-6 h-6 flex flex-col justify-center items-center">
                <span class="block w-5 h-0.5 bg-text-primary mb-1"></span>
                <span class="block w-5 h-0.5 bg-text-primary mb-1"></span>
                <span class="block w-5 h-0.5 bg-text-primary"></span>
              </div>
            </button>
          </div>
        </div>

        {/* モバイルメニュー */}
        <div id="mobile-menu" class="hidden md:hidden border-t border-gray-200 py-4">
          <div class="space-y-2">
            <a 
              href="/search" 
              class="flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-pink-light rounded-lg transition-colors"
            >
              🔍 検索
            </a>
            <a 
              href="/map" 
              class="flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-pink-light rounded-lg transition-colors"
            >
              🗺️ マップ
            </a>
            <a 
              href="/favorites" 
              class="flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-pink-light rounded-lg transition-colors"
            >
              ❤️ お気に入り
            </a>
            <a 
              href="/events" 
              class="flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-pink-light rounded-lg transition-colors"
            >
              🎉 イベント
            </a>
            
            {!userId && (
              <div class="border-t border-gray-200 pt-4 mt-4 space-y-2">
                <a 
                  href="/login" 
                  class="block w-full text-center py-3 border border-pink-primary text-pink-primary rounded-lg hover:bg-pink-light transition-colors"
                >
                  ログイン
                </a>
                <a 
                  href="/signup" 
                  class="block w-full text-center py-3 bg-pink-primary text-white rounded-lg hover:bg-pink-primary-dark transition-colors"
                >
                  新規登録
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}