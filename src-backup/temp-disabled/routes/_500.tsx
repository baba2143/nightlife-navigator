import { Head } from "$fresh/runtime.ts";
import { apply } from "twind";

interface ErrorPageProps {
  error?: Error;
  errorId?: string;
}

export default function Error500Page({ error, errorId }: ErrorPageProps) {
  // エラーIDの生成（実際のエラー追跡システムでの使用を想定）
  const id = errorId || `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return (
    <>
      <Head>
        <title>サーバーエラー - Nightlife Navigator</title>
        <meta name="description" content="サーバーで問題が発生しました" />
      </Head>
      
      <main class="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center px-4">
        <div class="max-w-md w-full text-center">
          {/* エラーアニメーション */}
          <div class="mb-8">
            <div class="relative">
              <div class="text-8xl font-bold text-red-200 mb-4 animate-pulse">
                500
              </div>
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-6xl animate-spin">⚠️</div>
              </div>
            </div>
          </div>

          {/* エラーメッセージ */}
          <div class={apply`card-soft mb-8`}>
            <h1 class={apply`text-2xl font-heading font-bold text-red-600 mb-4`}>
              サーバーエラーが発生しました
            </h1>
            
            <p class={apply`text-text-secondary mb-6 leading-relaxed`}>
              申し訳ございません。サーバーで予期しない問題が発生しました。
              技術チームに自動的に報告され、迅速に対応いたします。
            </p>

            {/* エラーID */}
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6">
              <p class="text-xs text-gray-600 mb-1">エラーID（お問い合わせ時にお知らせください）</p>
              <code class="text-sm font-mono text-gray-800 break-all">{id}</code>
            </div>

            {/* 提案アクション */}
            <div class="space-y-4">
              <div class="grid grid-cols-1 gap-3">
                <button
                  onClick={() => window.location.reload()}
                  class={apply`btn-pink w-full`}
                >
                  🔄 ページを再読み込み
                </button>
                
                <a 
                  href="/"
                  class={apply`btn-pink-outline w-full`}
                >
                  🏠 ホームに戻る
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

          {/* 問題が続く場合の対処法 */}
          <div class={apply`card-soft mb-8`}>
            <h2 class={apply`text-lg font-heading font-semibold text-text-primary mb-4`}>
              問題が続く場合
            </h2>
            
            <div class="space-y-3 text-sm text-text-secondary text-left">
              <div class="flex items-start gap-3">
                <span class="text-pink-primary">1.</span>
                <div>
                  <strong>ブラウザを更新</strong>してください。多くの場合、一時的な問題で解決します。
                </div>
              </div>
              
              <div class="flex items-start gap-3">
                <span class="text-pink-primary">2.</span>
                <div>
                  <strong>しばらく時間をおく</strong>（5-10分）してから再度アクセスしてください。
                </div>
              </div>
              
              <div class="flex items-start gap-3">
                <span class="text-pink-primary">3.</span>
                <div>
                  <strong>別のブラウザ</strong>で試してみてください。
                </div>
              </div>
              
              <div class="flex items-start gap-3">
                <span class="text-pink-primary">4.</span>
                <div>
                  問題が解決しない場合は、上記の<strong>エラーIDと共にお問い合わせ</strong>ください。
                </div>
              </div>
            </div>
          </div>

          {/* 代替コンテンツ */}
          <div class={apply`card-soft`}>
            <h2 class={apply`text-lg font-heading font-semibold text-pink-primary mb-4`}>
              代替手段
            </h2>
            
            <div class="space-y-3">
              <a 
                href="/search"
                class="block p-3 rounded-lg hover:bg-pink-light transition-colors text-left"
              >
                <div class="flex items-center gap-3">
                  <span class="text-2xl">🔍</span>
                  <div>
                    <div class={apply`font-medium text-text-primary`}>店舗検索</div>
                    <div class={apply`text-sm text-text-secondary`}>別の方法で店舗を探す</div>
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
                    <div class={apply`font-medium text-text-primary`}>地図表示</div>
                    <div class={apply`text-sm text-text-secondary`}>地図から店舗を探す</div>
                  </div>
                </div>
              </a>
            </div>
          </div>

          {/* サポート情報 */}
          <div class="mt-8 text-center">
            <p class={apply`text-sm text-text-secondary mb-4`}>
              緊急のお困りごとやご質問がございましたら、
            </p>
            
            <div class="flex justify-center gap-4">
              <a 
                href="/help"
                class="text-pink-primary hover:text-pink-primary-dark text-sm"
              >
                ❓ ヘルプセンター
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

      {/* JavaScript for error reporting and UX */}
      <script dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('DOMContentLoaded', function() {
            // エラー情報の記録
            const errorData = {
              errorId: '${id}',
              timestamp: new Date().toISOString(),
              userAgent: navigator.userAgent,
              url: window.location.href,
              referrer: document.referrer,
              ${error ? `errorMessage: ${JSON.stringify(error.message)},` : ''}
              ${error ? `errorStack: ${JSON.stringify(error.stack)},` : ''}
            };

            // Analytics への送信（実装されている場合）
            if (typeof gtag !== 'undefined') {
              gtag('event', 'exception', {
                'description': 'Server Error 500',
                'fatal': true,
                'custom_parameter_1': '${id}'
              });
            }

            // エラーログAPIへの送信（実装されている場合）
            try {
              fetch('/api/errors/report', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(errorData),
              }).catch(err => {
                console.warn('Error reporting failed:', err);
              });
            } catch (reportError) {
              console.warn('Error reporting failed:', reportError);
            }

            // 戻るボタンの処理
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

            // エラーIDのコピー機能
            const errorIdElement = document.querySelector('code');
            if (errorIdElement) {
              errorIdElement.style.cursor = 'pointer';
              errorIdElement.title = 'クリックしてコピー';
              
              errorIdElement.addEventListener('click', function() {
                navigator.clipboard.writeText('${id}').then(function() {
                  const originalText = errorIdElement.textContent;
                  errorIdElement.textContent = 'コピーしました!';
                  errorIdElement.style.color = 'green';
                  
                  setTimeout(function() {
                    errorIdElement.textContent = originalText;
                    errorIdElement.style.color = '';
                  }, 2000);
                }).catch(function(err) {
                  console.warn('Copy failed:', err);
                });
              });
            }

            // 自動リトライ機能（オプション）
            let retryCount = 0;
            const maxRetries = 3;
            
            window.autoRetry = function() {
              if (retryCount < maxRetries) {
                retryCount++;
                setTimeout(() => {
                  window.location.reload();
                }, 5000);
                
                // ユーザーに通知
                const notification = document.createElement('div');
                notification.className = 'fixed top-4 right-4 bg-blue-100 border border-blue-300 text-blue-700 px-4 py-2 rounded-lg shadow-lg z-50';
                notification.innerHTML = \`
                  <p class="text-sm">
                    5秒後に自動的に再読み込みします... (\${retryCount}/\${maxRetries})
                  </p>
                  <button onclick="this.parentElement.remove()" class="text-blue-600 hover:text-blue-800 text-xs underline ml-2">
                    キャンセル
                  </button>
                \`;
                document.body.appendChild(notification);
                
                setTimeout(() => {
                  if (notification.parentElement) {
                    notification.remove();
                  }
                }, 5000);
              }
            };

            // 初回エラー時に自動リトライを提案（5秒後）
            setTimeout(() => {
              if (retryCount === 0) {
                const autoRetryOffer = document.createElement('div');
                autoRetryOffer.className = 'mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg';
                autoRetryOffer.innerHTML = \`
                  <p class="text-sm text-yellow-700 mb-2">
                    自動的に問題の解決を試みますか？
                  </p>
                  <button onclick="autoRetry()" class="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700">
                    自動リトライを開始
                  </button>
                \`;
                
                const cardSoft = document.querySelector('.card-soft');
                if (cardSoft) {
                  cardSoft.appendChild(autoRetryOffer);
                }
              }
            }, 5000);
          });
        `
      }} />

      {/* CSS for animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          .animate-spin {
            animation: spin 2s linear infinite;
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          
          .animate-pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
        `
      }} />
    </>
  );
}