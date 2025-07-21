import { PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { apply } from "twind";
import NightlifeNavigatorApp from "../islands/NightlifeNavigatorApp.tsx";

export default function Home(props: PageProps) {
  return (
    <>
      <Head>
        <title>Nightlife Navigator - ホーム</title>
        <meta name="description" content="やさしいピンクデザインのナイトライフ案内アプリ" />
      </Head>
      
      <main class="min-h-screen bg-white pt-16">
        {/* ヒーローセクション */}
        <section class="bg-gradient-to-br from-pink-light to-surface-soft py-16 px-4">
          <div class="container mx-auto text-center">
            <h1 class={apply`text-4xl md:text-6xl font-heading font-bold text-gradient-pink mb-6 animate-fade-in`}>
              NIGHTLIFE NAVIGATOR
            </h1>
            <p class={apply`text-lg md:text-xl text-text-secondary mb-8 max-w-2xl mx-auto animate-fade-in`} style="animation-delay: 0.2s">
              やさしいピンクデザインで案内する、東京の夜を彩る特別な場所
            </p>
            <div class={apply`flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in`} style="animation-delay: 0.4s">
              <a 
                href="#app" 
                class={apply`btn-pink inline-flex items-center gap-2 text-lg px-8 py-4`}
              >
                <span>🔍</span>
                アプリを開始
              </a>
              <a 
                href="#features" 
                class={apply`btn-pink-outline inline-flex items-center gap-2 text-lg px-8 py-4`}
              >
                <span>✨</span>
                機能を見る
              </a>
            </div>
          </div>
        </section>

        {/* 機能紹介セクション */}
        <section id="features" class="py-16 px-4 bg-white">
          <div class="container mx-auto">
            <h2 class={apply`text-3xl md:text-4xl font-heading font-bold text-center text-pink-primary mb-12`}>
              主な機能
            </h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* 店舗検索 */}
              <div class={apply`card-soft text-center hover:shadow-pink transition-all duration-300`}>
                <div class="text-4xl mb-4">🔍</div>
                <h3 class={apply`text-xl font-heading font-semibold text-pink-primary mb-3`}>
                  高度な店舗検索
                </h3>
                <p class={apply`text-text-secondary leading-relaxed`}>
                  カテゴリ、価格帯、距離、評価による詳細なフィルタリング機能で、
                  お好みの店舗を簡単に見つけることができます。
                </p>
              </div>

              {/* 地図統合 */}
              <div class={apply`card-soft text-center hover:shadow-pink transition-all duration-300`}>
                <div class="text-4xl mb-4">🗺️</div>
                <h3 class={apply`text-xl font-heading font-semibold text-pink-primary mb-3`}>
                  インタラクティブ地図
                </h3>
                <p class={apply`text-text-secondary leading-relaxed`}>
                  店舗の位置を地図上で確認し、ルート案内や周辺情報を
                  直感的に操作できます。
                </p>
              </div>

              {/* レビューシステム */}
              <div class={apply`card-soft text-center hover:shadow-pink transition-all duration-300`}>
                <div class="text-4xl mb-4">⭐</div>
                <h3 class={apply`text-xl font-heading font-semibold text-pink-primary mb-3`}>
                  詳細レビューシステム
                </h3>
                <p class={apply`text-text-secondary leading-relaxed`}>
                  雰囲気、サービス、ドリンクなど複数の観点から
                  店舗を評価・レビューできます。
                </p>
              </div>

              {/* ユーザープロフィール */}
              <div class={apply`card-soft text-center hover:shadow-pink transition-all duration-300`}>
                <div class="text-4xl mb-4">👤</div>
                <h3 class={apply`text-xl font-heading font-semibold text-pink-primary mb-3`}>
                  パーソナライズド体験
                </h3>
                <p class={apply`text-text-secondary leading-relaxed`}>
                  訪問履歴、お気に入り、バッジ獲得など
                  あなただけの体験を記録します。
                </p>
              </div>

              {/* お気に入り */}
              <div class={apply`card-soft text-center hover:shadow-pink transition-all duration-300`}>
                <div class="text-4xl mb-4">❤️</div>
                <h3 class={apply`text-xl font-heading font-semibold text-pink-primary mb-3`}>
                  お気に入り管理
                </h3>
                <p class={apply`text-text-secondary leading-relaxed`}>
                  気に入った店舗をコレクションし、
                  統計情報や傾向分析を確認できます。
                </p>
              </div>

              {/* 通知システム */}
              <div class={apply`card-soft text-center hover:shadow-pink transition-all duration-300`}>
                <div class="text-4xl mb-4">🔔</div>
                <h3 class={apply`text-xl font-heading font-semibold text-pink-primary mb-3`}>
                  スマート通知
                </h3>
                <p class={apply`text-text-secondary leading-relaxed`}>
                  新着店舗、イベント、プロモーション情報を
                  タイムリーにお届けします。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* デザインシステム紹介 */}
        <section class="py-16 px-4 bg-pink-light">
          <div class="container mx-auto">
            <h2 class={apply`text-3xl md:text-4xl font-heading font-bold text-center text-pink-primary mb-12`}>
              やさしいピンクデザインシステム
            </h2>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 class={apply`text-2xl font-heading font-semibold text-pink-primary mb-6`}>
                  デザインコンセプト
                </h3>
                <ul class="space-y-4">
                  <li class="flex items-start gap-3">
                    <span class="text-pink-primary font-semibold">💖</span>
                    <div>
                      <strong class="text-pink-primary">やさしさ</strong>
                      <p class={apply`text-text-secondary`}>柔らかく親しみやすいピンクアクセント</p>
                    </div>
                  </li>
                  <li class="flex items-start gap-3">
                    <span class="text-pink-primary font-semibold">✨</span>
                    <div>
                      <strong class="text-pink-primary">清潔感</strong>
                      <p class={apply`text-text-secondary`}>白地ベースで清潔感のあるデザイン</p>
                    </div>
                  </li>
                  <li class="flex items-start gap-3">
                    <span class="text-pink-primary font-semibold">🎯</span>
                    <div>
                      <strong class="text-pink-primary">統一感</strong>
                      <p class={apply`text-text-secondary`}>全要素を角丸で統一したコンシステントなデザイン</p>
                    </div>
                  </li>
                  <li class="flex items-start gap-3">
                    <span class="text-pink-primary font-semibold">📱</span>
                    <div>
                      <strong class="text-pink-primary">アクセシビリティ</strong>
                      <p class={apply`text-text-secondary`}>全てのユーザーに配慮したユニバーサルデザイン</p>
                    </div>
                  </li>
                </ul>
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div class={apply`card-soft border-l-4 border-pink-primary`}>
                  <div class="w-8 h-8 bg-pink-primary rounded-full mb-3"></div>
                  <h4 class={apply`font-semibold text-pink-primary mb-2`}>Primary</h4>
                  <p class={apply`text-sm text-text-secondary`}>#ea5a7b</p>
                </div>
                <div class={apply`card-soft border-l-4 border-pink-secondary`}>
                  <div class="w-8 h-8 bg-pink-secondary rounded-full mb-3"></div>
                  <h4 class={apply`font-semibold text-pink-primary mb-2`}>Secondary</h4>
                  <p class={apply`text-sm text-text-secondary`}>#f43f5e</p>
                </div>
                <div class={apply`card-soft border-l-4 border-pink-accent`}>
                  <div class="w-8 h-8 bg-pink-accent rounded-full mb-3"></div>
                  <h4 class={apply`font-semibold text-pink-primary mb-2`}>Accent</h4>
                  <p class={apply`text-sm text-text-secondary`}>#ec4899</p>
                </div>
                <div class={apply`card-soft border-l-4 border-pink-light`}>
                  <div class="w-8 h-8 bg-pink-light border border-pink-primary rounded-full mb-3"></div>
                  <h4 class={apply`font-semibold text-pink-primary mb-2`}>Light</h4>
                  <p class={apply`text-sm text-text-secondary`}>#fef7f7</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* アプリケーション */}
        <section id="app" class="py-16 px-4 bg-white">
          <div class="container mx-auto">
            <h2 class={apply`text-3xl md:text-4xl font-heading font-bold text-center text-pink-primary mb-12`}>
              アプリケーションを体験
            </h2>
            
            <div class="max-w-6xl mx-auto">
              <NightlifeNavigatorApp />
            </div>
          </div>
        </section>

        {/* フッター */}
        <footer class="bg-gray-50 py-12 px-4 border-t border-border-light">
          <div class="container mx-auto text-center">
            <h3 class={apply`text-2xl font-heading font-bold text-pink-primary mb-4`}>
              Nightlife Navigator
            </h3>
            <p class={apply`text-text-secondary mb-6 max-w-2xl mx-auto`}>
              やさしいピンクデザインシステムで構築された、
              現代的でアクセシブルなナイトライフ案内アプリケーション
            </p>
            <div class="flex justify-center gap-6 text-sm text-text-tertiary">
              <span>© 2024 Nightlife Navigator</span>
              <span>•</span>
              <span>Design System v2.0</span>
              <span>•</span>
              <span>Fresh + Deno</span>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}