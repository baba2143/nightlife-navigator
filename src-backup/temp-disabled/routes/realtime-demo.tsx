import { PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { apply } from "twind";
import Header from "../components/Header.tsx";
import NotificationSystem from "../islands/NotificationSystem.tsx";
import LiveChat from "../islands/LiveChat.tsx";
import VenueStatusTracker from "../islands/VenueStatusTracker.tsx";

export default function RealtimeDemoPage(props: PageProps) {
  const currentUser = {
    id: 1,
    name: "田中太郎",
    avatar: "/user-avatar.jpg"
  };

  return (
    <>
      <Head>
        <title>リアルタイム機能デモ - Nightlife Navigator</title>
        <meta name="description" content="WebSocketを使用したリアルタイム機能のデモページ" />
      </Head>
      
      <Header 
        userId={currentUser.id}
        userName={currentUser.name}
        userAvatar={currentUser.avatar}
      />
      
      <main class="min-h-screen bg-white pt-16">
        <div class="container mx-auto py-8 px-4">
          <div class="max-w-6xl mx-auto">
            {/* ヘッダー */}
            <div class="mb-8">
              <h1 class={apply`text-3xl font-heading font-bold text-pink-primary mb-4`}>
                🚀 リアルタイム機能デモ
              </h1>
              <p class={apply`text-text-secondary mb-6`}>
                WebSocketを使用したリアルタイム通知、チャット、店舗状況更新のデモンストレーションです。
              </p>
              
              {/* 接続状態表示 */}
              <div class="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span class="text-blue-700 font-medium">WebSocket接続中</span>
                </div>
                <span class="text-blue-600">リアルタイム更新が有効です</span>
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 左カラム: 通知とチャット */}
              <div class="space-y-8">
                {/* 通知システムデモ */}
                <div class={apply`card-soft`}>
                  <h2 class={apply`text-xl font-heading font-semibold text-pink-primary mb-4`}>
                    📢 リアルタイム通知システム
                  </h2>
                  
                  <p class={apply`text-text-secondary mb-4`}>
                    右上のベルアイコンをクリックして通知パネルを確認できます。
                  </p>

                  <div class="space-y-3">
                    <button
                      onClick={() => {
                        // テスト通知を送信
                        const testNotification = {
                          type: 'info',
                          title: 'テスト通知',
                          message: 'これはテスト通知です。リアルタイムで表示されます。',
                          timestamp: Date.now(),
                        };
                        
                        window.dispatchEvent(new CustomEvent('testNotification', {
                          detail: testNotification
                        }));
                      }}
                      class={apply`btn-pink-outline w-full`}
                    >
                      📢 テスト通知を送信
                    </button>

                    <button
                      onClick={() => {
                        const successNotification = {
                          type: 'success',
                          title: '操作完了',
                          message: '処理が正常に完了しました。',
                          timestamp: Date.now(),
                        };
                        
                        window.dispatchEvent(new CustomEvent('testNotification', {
                          detail: successNotification
                        }));
                      }}
                      class={apply`btn-pink-outline w-full`}
                    >
                      ✅ 成功通知を送信
                    </button>

                    <button
                      onClick={() => {
                        const chatNotification = {
                          type: 'chat',
                          title: '新着メッセージ',
                          message: '佐藤花子からメッセージが届きました。',
                          actionUrl: '/chat/2',
                          actionLabel: '返信する',
                          timestamp: Date.now(),
                        };
                        
                        window.dispatchEvent(new CustomEvent('testNotification', {
                          detail: chatNotification
                        }));
                      }}
                      class={apply`btn-pink-outline w-full`}
                    >
                      💬 チャット通知を送信
                    </button>
                  </div>
                </div>

                {/* チャット機能デモ */}
                <div class={apply`card-soft`}>
                  <h2 class={apply`text-xl font-heading font-semibold text-pink-primary mb-4`}>
                    💬 ライブチャット機能
                  </h2>
                  
                  <p class={apply`text-text-secondary mb-4`}>
                    リアルタイムチャット機能をテストできます。複数のタブで開いて動作を確認してください。
                  </p>

                  <div class="space-y-3">
                    <button
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('openLiveChat', {
                          detail: {
                            userId: currentUser.id,
                            userName: currentUser.name,
                            userAvatar: currentUser.avatar,
                            roomId: 'demo_room',
                            roomType: 'group'
                          }
                        }));
                      }}
                      class={apply`btn-pink w-full`}
                    >
                      💬 デモチャットを開く
                    </button>

                    <div class="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      <strong>テスト方法:</strong>
                      <ol class="list-decimal list-inside mt-2 space-y-1">
                        <li>上のボタンでチャットを開く</li>
                        <li>メッセージを入力して送信</li>
                        <li>別のタブでも同じページを開いてリアルタイム同期を確認</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              {/* 右カラム: 店舗状況 */}
              <div class="space-y-8">
                {/* 店舗状況リアルタイム更新 */}
                <div class={apply`card-soft`}>
                  <h2 class={apply`text-xl font-heading font-semibold text-pink-primary mb-4`}>
                    🏪 リアルタイム店舗状況
                  </h2>
                  
                  <p class={apply`text-text-secondary mb-4`}>
                    店舗の営業状況、混雑度、待ち時間などがリアルタイムで更新されます。
                  </p>

                  {/* テスト更新ボタン */}
                  <div class="grid grid-cols-2 gap-2 mb-4">
                    <button
                      onClick={async () => {
                        try {
                          await fetch('/api/venues/status', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              venueId: 1,
                              action: 'update_crowd',
                              data: {
                                crowdLevel: 'high',
                                waitTime: 30
                              }
                            })
                          });
                        } catch (error) {
                          console.error('Failed to update venue status:', error);
                        }
                      }}
                      class={apply`btn-pink-outline text-xs py-2`}
                    >
                      混雑度更新
                    </button>

                    <button
                      onClick={async () => {
                        try {
                          await fetch('/api/venues/status', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              venueId: 1,
                              action: 'checkin',
                              data: { userId: currentUser.id }
                            })
                          });
                        } catch (error) {
                          console.error('Failed to checkin:', error);
                        }
                      }}
                      class={apply`btn-pink-outline text-xs py-2`}
                    >
                      チェックイン
                    </button>

                    <button
                      onClick={async () => {
                        try {
                          await fetch('/api/venues/status', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              venueId: 1,
                              action: 'add_event',
                              data: { 
                                event: `特別イベント ${new Date().getHours()}:${new Date().getMinutes()}開始`
                              }
                            })
                          });
                        } catch (error) {
                          console.error('Failed to add event:', error);
                        }
                      }}
                      class={apply`btn-pink-outline text-xs py-2`}
                    >
                      イベント追加
                    </button>

                    <button
                      onClick={async () => {
                        try {
                          await fetch('/api/venues/status', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              venueId: 1,
                              action: 'toggle_open'
                            })
                          });
                        } catch (error) {
                          console.error('Failed to toggle venue status:', error);
                        }
                      }}
                      class={apply`btn-pink-outline text-xs py-2`}
                    >
                      営業切替
                    </button>
                  </div>
                </div>

                {/* API情報 */}
                <div class={apply`card-soft`}>
                  <h3 class={apply`text-lg font-heading font-semibold text-pink-primary mb-4`}>
                    🔧 API エンドポイント
                  </h3>
                  
                  <div class="space-y-3 text-sm">
                    <div class="bg-gray-50 p-3 rounded">
                      <strong>WebSocket:</strong>
                      <code class="block mt-1 text-xs bg-gray-100 p-2 rounded">
                        ws://localhost:8000/api/websocket
                      </code>
                    </div>

                    <div class="bg-gray-50 p-3 rounded">
                      <strong>店舗状況:</strong>
                      <code class="block mt-1 text-xs bg-gray-100 p-2 rounded">
                        GET/POST/PUT /api/venues/status
                      </code>
                    </div>

                    <div class="bg-gray-50 p-3 rounded">
                      <strong>チャット履歴:</strong>
                      <code class="block mt-1 text-xs bg-gray-100 p-2 rounded">
                        GET/POST/PUT /api/chat/history
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 店舗状況トラッカー */}
            <div class="mt-8">
              <h2 class={apply`text-2xl font-heading font-semibold text-pink-primary mb-6`}>
                📊 リアルタイム店舗状況
              </h2>
              
              <VenueStatusTracker
                showAllVenues={true}
                userId={currentUser.id}
                refreshInterval={30000}
              />
            </div>

            {/* 技術情報 */}
            <div class={apply`card-soft mt-8`}>
              <h3 class={apply`text-xl font-heading font-semibold text-pink-primary mb-4`}>
                ⚡ 実装された機能
              </h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <h4 class={apply`font-semibold text-text-primary mb-2`}>
                    📡 WebSocket通信
                  </h4>
                  <ul class="text-sm text-text-secondary space-y-1">
                    <li>• リアルタイム双方向通信</li>
                    <li>• 自動再接続機能</li>
                    <li>• ルーム管理機能</li>
                    <li>• ハートビート機能</li>
                  </ul>
                </div>

                <div>
                  <h4 class={apply`font-semibold text-text-primary mb-2`}>
                    🔔 通知システム
                  </h4>
                  <ul class="text-sm text-text-secondary space-y-1">
                    <li>• フローティング通知</li>
                    <li>• 通知パネル</li>
                    <li>• 未読カウント</li>
                    <li>• 通知音サポート</li>
                  </ul>
                </div>

                <div>
                  <h4 class={apply`font-semibold text-text-primary mb-2`}>
                    💬 ライブチャット
                  </h4>
                  <ul class="text-sm text-text-secondary space-y-1">
                    <li>• リアルタイムメッセージング</li>
                    <li>• タイピングインジケーター</li>
                    <li>• メッセージ履歴</li>
                    <li>• マルチルーム対応</li>
                  </ul>
                </div>

                <div>
                  <h4 class={apply`font-semibold text-text-primary mb-2`}>
                    🏪 店舗状況更新
                  </h4>
                  <ul class="text-sm text-text-secondary space-y-1">
                    <li>• リアルタイム混雑状況</li>
                    <li>• 待ち時間情報</li>
                    <li>• チェックイン機能</li>
                    <li>• イベント通知</li>
                  </ul>
                </div>

                <div>
                  <h4 class={apply`font-semibold text-text-primary mb-2`}>
                    🔧 接続管理
                  </h4>
                  <ul class="text-sm text-text-secondary space-y-1">
                    <li>• クライアント管理</li>
                    <li>• 接続状態監視</li>
                    <li>• エラーハンドリング</li>
                    <li>• 統計情報</li>
                  </ul>
                </div>

                <div>
                  <h4 class={apply`font-semibold text-text-primary mb-2`}>
                    🎨 UI/UX
                  </h4>
                  <ul class="text-sm text-text-secondary space-y-1">
                    <li>• やさしいピンクデザイン</li>
                    <li>• レスポンシブ対応</li>
                    <li>• アニメーション効果</li>
                    <li>• アクセシビリティ配慮</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ライブチャットを表示するためのイベントリスナー */}
      <script dangerouslySetInnerHTML={{
        __html: `
          let liveChatInstance = null;
          
          window.addEventListener('openLiveChat', (event) => {
            if (!liveChatInstance) {
              // LiveChatコンポーネントを動的に表示
              const chatContainer = document.createElement('div');
              chatContainer.id = 'live-chat-container';
              document.body.appendChild(chatContainer);
              
              // ここで実際にはPreactコンポーネントをマウントする
              console.log('Opening live chat with:', event.detail);
            }
          });
          
          window.addEventListener('testNotification', (event) => {
            // 通知システムにテスト通知を送信
            console.log('Test notification:', event.detail);
          });
        `
      }} />
    </>
  );
}