import { PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { apply } from "twind";
import ImageUploader from "../islands/ImageUploader.tsx";
import ImageGallery from "../islands/ImageGallery.tsx";

export default function VenueManagerPage(props: PageProps) {
  const venueId = parseInt(props.url.searchParams.get("venueId") || "1");

  return (
    <>
      <Head>
        <title>店舗画像管理 - Nightlife Navigator</title>
        <meta name="description" content="店舗の画像を管理" />
      </Head>
      
      <main class="min-h-screen bg-white pt-16">
        <div class="container mx-auto py-8 px-4">
          <div class="max-w-4xl mx-auto">
            {/* ヘッダー */}
            <div class="mb-8">
              <h1 class={apply`text-3xl font-heading font-bold text-pink-primary mb-4`}>
                店舗画像管理
              </h1>
              <nav class="flex items-center gap-2 text-sm text-text-secondary">
                <a href="/" class="hover:text-pink-primary">ホーム</a>
                <span>/</span>
                <a href={`/venues/${venueId}`} class="hover:text-pink-primary">店舗詳細</a>
                <span>/</span>
                <span>画像管理</span>
              </nav>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 画像アップロードセクション */}
              <div class="lg:col-span-1">
                <div class={apply`card-soft`}>
                  <h2 class={apply`text-xl font-heading font-semibold text-pink-primary mb-6`}>
                    新しい画像をアップロード
                  </h2>
                  
                  <ImageUploader
                    maxFiles={10}
                    maxFileSize={10 * 1024 * 1024} // 10MB
                    acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
                    category="venue"
                    venueId={venueId}
                    uploadEndpoint="/api/upload/images"
                    onUploadComplete={(urls) => {
                      console.log('Uploaded images:', urls);
                      // ギャラリーを更新
                      window.location.reload();
                    }}
                    onUploadError={(error) => {
                      alert(`アップロードエラー: ${error}`);
                    }}
                  />
                </div>

                {/* アップロードガイド */}
                <div class={apply`card-soft mt-6`}>
                  <h3 class={apply`text-lg font-heading font-semibold text-pink-primary mb-4`}>
                    アップロードガイド
                  </h3>
                  
                  <div class="space-y-3 text-sm">
                    <div class="flex items-start gap-3">
                      <span class="text-pink-primary">📷</span>
                      <div>
                        <div class="font-medium text-text-primary">高品質な画像</div>
                        <div class="text-text-secondary">1920×1080px以上を推奨</div>
                      </div>
                    </div>
                    
                    <div class="flex items-start gap-3">
                      <span class="text-pink-primary">✨</span>
                      <div>
                        <div class="font-medium text-text-primary">店舗の魅力を表現</div>
                        <div class="text-text-secondary">雰囲気・料理・内装など</div>
                      </div>
                    </div>
                    
                    <div class="flex items-start gap-3">
                      <span class="text-pink-primary">🎯</span>
                      <div>
                        <div class="font-medium text-text-primary">適切な明るさ</div>
                        <div class="text-text-secondary">暗すぎず明るすぎず</div>
                      </div>
                    </div>
                    
                    <div class="flex items-start gap-3">
                      <span class="text-pink-primary">📝</span>
                      <div>
                        <div class="font-medium text-text-primary">分かりやすいファイル名</div>
                        <div class="text-text-secondary">内容が分かる名前を付ける</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 画像ギャラリーセクション */}
              <div class="lg:col-span-2">
                <div class={apply`card-soft`}>
                  <div class="flex justify-between items-center mb-6">
                    <h2 class={apply`text-xl font-heading font-semibold text-pink-primary`}>
                      店舗画像ギャラリー
                    </h2>
                    
                    <div class="flex gap-2">
                      <button class={apply`btn-pink-outline text-sm px-3 py-2`}>
                        🔄 更新
                      </button>
                      <button class={apply`btn-pink-outline text-sm px-3 py-2`}>
                        📊 統計
                      </button>
                    </div>
                  </div>
                  
                  <ImageGallery
                    category="venue"
                    venueId={venueId}
                    layout="grid"
                    size="medium"
                    showUploadButton={false}
                    onImageSelect={(image) => {
                      console.log('Selected image:', image);
                    }}
                    onImageDelete={(imageId) => {
                      console.log('Deleted image:', imageId);
                      // 必要に応じて追加の処理
                    }}
                  />
                </div>

                {/* 画像統計 */}
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div class={apply`card-soft text-center`}>
                    <div class="text-2xl mb-2">📷</div>
                    <div class={apply`text-lg font-semibold text-pink-primary`}>12</div>
                    <div class={apply`text-sm text-text-secondary`}>総画像数</div>
                  </div>
                  
                  <div class={apply`card-soft text-center`}>
                    <div class="text-2xl mb-2">👁️</div>
                    <div class={apply`text-lg font-semibold text-pink-primary`}>1,234</div>
                    <div class={apply`text-sm text-text-secondary`}>総閲覧数</div>
                  </div>
                  
                  <div class={apply`card-soft text-center`}>
                    <div class="text-2xl mb-2">⭐</div>
                    <div class={apply`text-lg font-semibold text-pink-primary`}>4.8</div>
                    <div class={apply`text-sm text-text-secondary`}>画像評価</div>
                  </div>
                  
                  <div class={apply`card-soft text-center`}>
                    <div class="text-2xl mb-2">📈</div>
                    <div class={apply`text-lg font-semibold text-pink-primary`}>+15%</div>
                    <div class={apply`text-sm text-text-secondary`}>先月比</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 画像管理のベストプラクティス */}
            <div class={apply`card-soft mt-8`}>
              <h3 class={apply`text-xl font-heading font-semibold text-pink-primary mb-6`}>
                効果的な画像管理のコツ
              </h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 class={apply`font-semibold text-text-primary mb-3`}>📸 撮影のポイント</h4>
                  <ul class="space-y-2 text-sm text-text-secondary">
                    <li>• 自然光を活用した明るい撮影</li>
                    <li>• 様々な角度から店舗を撮影</li>
                    <li>• 料理や飲み物の美味しそうな瞬間</li>
                    <li>• お客様が楽しんでいる様子（許可を得て）</li>
                    <li>• 店舗の特徴的な装飾やデザイン</li>
                  </ul>
                </div>
                
                <div>
                  <h4 class={apply`font-semibold text-text-primary mb-3`}>🎯 効果的な構成</h4>
                  <ul class="space-y-2 text-sm text-text-secondary">
                    <li>• メイン画像は店舗の顔となる1枚</li>
                    <li>• 内装・外観のバランス良い配置</li>
                    <li>• 料理・ドリンクの魅力的な写真</li>
                    <li>• 時間帯による雰囲気の変化</li>
                    <li>• 定期的な画像の更新と追加</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}