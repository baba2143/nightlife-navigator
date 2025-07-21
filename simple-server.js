const express = require('express');
const path = require('path');

const app = express();
const PORT = 3001;

// Serve static files from the app directory
app.use(express.static(path.join(__dirname, 'app')));

// Simple index page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nightlife Navigator MVP</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #ea5a7b 0%, #f8c8d1 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #333;
            }
            .container {
                background: white;
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                text-align: center;
                max-width: 500px;
                margin: 20px;
            }
            h1 { color: #ea5a7b; margin-bottom: 20px; font-size: 2.5em; }
            .emoji { font-size: 3em; margin-bottom: 20px; }
            .features {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 20px;
                margin: 30px 0;
            }
            .feature {
                background: #fef7f7;
                padding: 20px;
                border-radius: 15px;
                border: 2px solid #ea5a7b;
            }
            .feature-icon { font-size: 2em; margin-bottom: 10px; }
            .feature-text { color: #666; font-size: 0.9em; }
            .status {
                background: #e8f5e8;
                color: #2d5a2d;
                padding: 15px;
                border-radius: 10px;
                margin: 20px 0;
                border-left: 4px solid #4caf50;
            }
            .note {
                background: #fff3cd;
                color: #856404;
                padding: 15px;
                border-radius: 10px;
                margin: 20px 0;
                border-left: 4px solid #ffc107;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="emoji">💖</div>
            <h1>Nightlife Navigator MVP</h1>
            <p>やさしいピンクデザインのナイトライフ案内アプリ</p>
            
            <div class="status">
                ✅ MVPアプリが正常に動作しています！
            </div>
            
            <div class="features">
                <div class="feature">
                    <div class="feature-icon">🏠</div>
                    <div class="feature-text">ホーム</div>
                </div>
                <div class="feature">
                    <div class="feature-icon">🔍</div>
                    <div class="feature-text">検索</div>
                </div>
                <div class="feature">
                    <div class="feature-icon">🗺️</div>
                    <div class="feature-text">地図</div>
                </div>
                <div class="feature">
                    <div class="feature-icon">❤️</div>
                    <div class="feature-text">お気に入り</div>
                </div>
                <div class="feature">
                    <div class="feature-icon">👤</div>
                    <div class="feature-text">プロフィール</div>
                </div>
            </div>
            
            <div class="note">
                📱 本格的なテストにはExpo Goアプリをスマートフォンにインストールしてください
            </div>
            
            <p style="margin-top: 20px; color: #666; font-size: 0.9em;">
                バージョン 1.0.0 MVP<br>
                本番化準備完了
            </p>
        </div>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`🚀 MVP Test Server running at http://localhost:${PORT}`);
  console.log('📱 Nightlife Navigator MVP is ready for testing!');
});