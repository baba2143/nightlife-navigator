import { Head } from "$fresh/runtime.ts";
import { apply } from "twind";

export default function Error404Page() {
  return (
    <>
      <Head>
        <title>ページが見つかりません - Nightlife Navigator</title>
        <meta name="description" content="お探しのページは見つかりませんでした" />
      </Head>
      
      <main class="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center px-4">
        <div class="max-w-md w-full text-center">
          {/* 404 アニメーション */}
          <div class="mb-8">
            <div class="relative">
              <div class="text-8xl font-bold text-pink-200 mb-4 animate-pulse">
                404
              </div>
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-6xl animate-bounce">🌸</div>
              </div>
            </div>
          </div>

          {/* エラーメッセージ */}
          <div class={apply`card-soft mb-8`}>
            <h1 class={apply`text-2xl font-heading font-bold text-pink-primary mb-4`}>
              ページが見つかりません
            </h1>
            
            <p class={apply`text-text-secondary mb-6 leading-relaxed`}>
              申し訳ございません。お探しのページは存在しないか、
              移動または削除された可能性があります。
            </p>

            {/* 提案アクション */}
            <div class="space-y-4">
              <div class="grid grid-cols-1 gap-3">
                <a 
                  href="/"
                  class={apply`btn-pink w-full`}
                >
                  🏠 ホームに戻る
                </a>
                
                <a 
                  href="/search"
                  class={apply`btn-pink-outline w-full`}
                >
                  🔍 店舗を検索
                </a>
                
                <button
                  onClick={() => window.history.back()}
                  class={apply`btn-pink-outline w-full`}
                >
                  ← 前のページに戻る
                </button>
              </div>
            </div>
          </div>

          {/* 人気コンテンツ */}
          <div class={apply`card-soft`}>
            <h2 class={apply`text-lg font-heading font-semibold text-pink-primary mb-4`}>
              人気のコンテンツ
            </h2>
            
            <div class="space-y-3">
              <a 
                href="/venues/1"
                class="block p-3 rounded-lg hover:bg-pink-light transition-colors text-left"
              >
                <div class="flex items-center gap-3">
                  <span class="text-2xl">🛋️</span>
                  <div>
                    <div class={apply`font-medium text-text-primary`}>GENTLE LOUNGE</div>
                    <div class={apply`text-sm text-text-secondary`}>やさしいピンクのラウンジ</div>
                  </div>
                </div>
              </a>
              
              <a 
                href="/venues/2"
                class="block p-3 rounded-lg hover:bg-pink-light transition-colors text-left"
              >
                <div class="flex items-center gap-3">
                  <span class="text-2xl">🍸</span>
                  <div>
                    <div class={apply`font-medium text-text-primary`}>NEON BAR</div>
                    <div class={apply`text-sm text-text-secondary`}>ネオンライトが美しいバー</div>
                  </div>
                </div>
              </a>
              
              <a 
                href="/map"
                class="block p-3 rounded-lg hover:bg-pink-light transition-colors text-left"
              >
                <div class="flex items-center gap-3">
                  <span class="text-2xl">🗺️</span>
                  <div>
                    <div class={apply`font-medium text-text-primary`}>地図で探す</div>
                    <div class={apply`text-sm text-text-secondary`}>近くの店舗を地図で確認</div>
                  </div>
                </div>
              </a>
            </div>
          </div>

          {/* ヘルプ情報 */}
          <div class="mt-8 text-center">
            <p class={apply`text-sm text-text-secondary mb-4`}>
              それでも問題が解決しない場合は、お気軽にお問い合わせください。
            </p>
            
            <div class="flex justify-center gap-4">
              <a 
                href="/help"
                class="text-pink-primary hover:text-pink-primary-dark text-sm"
              >
                ❓ ヘルプ
              </a>
              <a 
                href="/contact"
                class="text-pink-primary hover:text-pink-primary-dark text-sm"
              >
                📧 お問い合わせ
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* JavaScript for enhanced UX */}
      <script dangerouslySetInnerHTML={{
        __html: `
          // URL記録とログ送信（analytics）
          if (typeof gtag !== 'undefined') {
            gtag('event', 'page_not_found', {
              'page_location': window.location.href,
              'page_referrer': document.referrer
            });
          }

          // 検索候補の提供
          const currentPath = window.location.pathname;
          const searchTerms = currentPath.split('/').filter(Boolean);
          
          if (searchTerms.length > 0) {
            // 最後のパスセグメントを検索クエリとして使用
            const searchTerm = searchTerms[searchTerms.length - 1];
            
            // 数字以外の文字が含まれている場合のみ検索提案を表示
            if (isNaN(Number(searchTerm)) && searchTerm.length > 2) {
              setTimeout(() => {
                const suggestion = document.createElement('div');
                suggestion.className = 'mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg';
                suggestion.innerHTML = \`
                  <p class="text-sm text-blue-700 mb-2">
                    もしかして「\${decodeURIComponent(searchTerm)}」を検索していましたか？
                  </p>
                  <a href="/search?q=\${encodeURIComponent(searchTerm)}" 
                     class="text-blue-600 hover:text-blue-800 underline text-sm">
                    「\${decodeURIComponent(searchTerm)}」で検索する
                  </a>
                \`;
                
                const cardSoft = document.querySelector('.card-soft');
                if (cardSoft) {
                  cardSoft.appendChild(suggestion);
                }
              }, 1000);
            }
          }

          // 戻るボタンの処理
          document.addEventListener('DOMContentLoaded', function() {
            // 戻る履歴がない場合はホームに送る
            if (window.history.length <= 1) {
              const backButton = document.querySelector('[onclick="window.history.back()"]');
              if (backButton) {
                backButton.onclick = function() {
                  window.location.href = '/';
                  return false;
                };
                backButton.innerHTML = '🏠 ホームに戻る';
              }
            }
          });
        `
      }} />

      {/* CSS animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
          
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          
          .animate-shake:hover {
            animation: shake 0.5s ease-in-out;
          }
        `
      }} />
    </>
  );
}