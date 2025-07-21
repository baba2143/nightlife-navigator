import { type PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";

export default function App({ Component, state }: PageProps) {
  return (
    <html lang="ja">
      <Head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="Nightlife Navigator - やさしいピンクデザインのナイトライフ案内アプリ" />
        <meta name="theme-color" content="#ea5a7b" />
        <title>Nightlife Navigator</title>
        
        {/* やさしいピンクデザイン用フォント */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Orbitron:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        
        {/* アイコン */}
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* メタタグ */}
        <meta property="og:title" content="Nightlife Navigator" />
        <meta property="og:description" content="やさしいピンクデザインのナイトライフ案内アプリ" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        
        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        
        {/* 基本スタイル */}
        <style dangerouslySetInnerHTML={{
          __html: `
            * {
              box-sizing: border-box;
            }
            
            body {
              margin: 0;
              padding: 0;
              font-family: 'Inter', system-ui, sans-serif;
              background-color: #ffffff;
              color: #1a1a1a;
              line-height: 1.6;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
            
            h1, h2, h3, h4, h5, h6 {
              font-family: 'Orbitron', system-ui, sans-serif;
              font-weight: 600;
              line-height: 1.3;
              margin: 0 0 1rem 0;
            }
            
            p {
              margin: 0 0 1rem 0;
            }
            
            a {
              color: #ea5a7b;
              text-decoration: none;
              transition: color 0.2s ease;
            }
            
            a:hover {
              color: #d63c5e;
            }
            
            button {
              cursor: pointer;
              border: none;
              outline: none;
              transition: all 0.2s ease;
            }
            
            button:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }
            
            input, textarea, select {
              font-family: inherit;
              font-size: inherit;
              outline: none;
              transition: all 0.2s ease;
            }
            
            input:focus, textarea:focus, select:focus {
              border-color: #ea5a7b;
            }
            
            .container {
              max-width: 1200px;
              margin: 0 auto;
              padding: 0 1rem;
            }
            
            .sr-only {
              position: absolute;
              width: 1px;
              height: 1px;
              padding: 0;
              margin: -1px;
              overflow: hidden;
              clip: rect(0, 0, 0, 0);
              white-space: nowrap;
              border: 0;
            }
            
            /* スクロールバー */
            ::-webkit-scrollbar {
              width: 8px;
              height: 8px;
            }
            
            ::-webkit-scrollbar-track {
              background: #f8f8f8;
            }
            
            ::-webkit-scrollbar-thumb {
              background: #ea5a7b;
              border-radius: 4px;
            }
            
            ::-webkit-scrollbar-thumb:hover {
              background: #d63c5e;
            }
            
            /* アニメーション */
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            
            @keyframes slideIn {
              from {
                transform: translateX(-100%);
              }
              to {
                transform: translateX(0);
              }
            }
            
            @keyframes pulse {
              0%, 100% {
                transform: scale(1);
              }
              50% {
                transform: scale(1.05);
              }
            }
            
            .animate-fade-in {
              animation: fadeIn 0.5s ease-out;
            }
            
            .animate-slide-in {
              animation: slideIn 0.3s ease-out;
            }
            
            .animate-pulse {
              animation: pulse 2s infinite;
            }
            
            /* レスポンシブ */
            @media (max-width: 768px) {
              .container {
                padding: 0 0.5rem;
              }
            }
          `
        }} />
      </Head>
      
      <body class="min-h-screen bg-white">
        <div id="app" class="min-h-screen">
          <Component />
        </div>
        
        {/* ナビゲーションメニュー */}
        <nav id="main-nav" class="fixed top-0 left-0 w-full bg-white shadow-lg z-50 border-b border-border-light">
          <div class="container mx-auto px-4">
            <div class="flex items-center justify-between h-16">
              <a href="/" class="flex items-center gap-2">
                <span class="text-2xl">💖</span>
                <span class="text-lg font-heading font-bold text-pink-primary">Nightlife Navigator</span>
              </a>
              
              <div class="hidden md:flex items-center gap-6">
                <a href="/search" class="text-text-secondary hover:text-pink-primary transition-colors">🔍 検索</a>
                <a href="/map" class="text-text-secondary hover:text-pink-primary transition-colors">🗺️ 地図</a>
                <a href="/favorites" class="text-text-secondary hover:text-pink-primary transition-colors">❤️ お気に入り</a>
                <a href="/notifications" class="text-text-secondary hover:text-pink-primary transition-colors">🔔 通知</a>
                <a href="/profile" class="text-text-secondary hover:text-pink-primary transition-colors">👤 プロフィール</a>
              </div>
              
              <button id="mobile-menu-btn" class="md:hidden">
                <span class="text-2xl">☰</span>
              </button>
            </div>
          </div>
          
          {/* モバイルメニュー */}
          <div id="mobile-menu" class="md:hidden hidden bg-white border-t border-border-light">
            <div class="container mx-auto px-4 py-4">
              <div class="flex flex-col gap-4">
                <a href="/search" class="flex items-center gap-2 text-text-secondary hover:text-pink-primary transition-colors">🔍 検索</a>
                <a href="/map" class="flex items-center gap-2 text-text-secondary hover:text-pink-primary transition-colors">🗺️ 地図</a>
                <a href="/favorites" class="flex items-center gap-2 text-text-secondary hover:text-pink-primary transition-colors">❤️ お気に入り</a>
                <a href="/notifications" class="flex items-center gap-2 text-text-secondary hover:text-pink-primary transition-colors">🔔 通知</a>
                <a href="/profile" class="flex items-center gap-2 text-text-secondary hover:text-pink-primary transition-colors">👤 プロフィール</a>
              </div>
            </div>
          </div>
        </nav>

        {/* Service Worker */}
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                  .then(registration => {
                    console.log('SW registered: ', registration);
                  })
                  .catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                  });
              });
            }
            
            // モバイルメニュートグル
            document.addEventListener('DOMContentLoaded', () => {
              const menuBtn = document.getElementById('mobile-menu-btn');
              const mobileMenu = document.getElementById('mobile-menu');
              
              if (menuBtn && mobileMenu) {
                menuBtn.addEventListener('click', () => {
                  mobileMenu.classList.toggle('hidden');
                });
              }
            });
          `
        }} />
      </body>
    </html>
  );
}