// JWT認証統合テストの実行スクリプト
const jwtAuthTest = require('./src/utils/jwtTest.js').default;

async function runJWTTests() {
  try {
    console.log('🔐 JWT認証統合テストを開始します...\n');
    
    // JWT統合レポートを生成
    const report = await jwtAuthTest.generateJWTIntegrationReport();
    
    console.log('\n📊 === JWT認証統合レポート ===');
    console.log(`統合スコア: ${report.integrationScore}/100`);
    console.log(`テスト成功率: ${report.testResults.successRate}%`);
    console.log(`実行したテスト数: ${report.testResults.totalTests}`);
    console.log(`成功: ${report.testResults.passedTests}, 失敗: ${report.testResults.failedTests}`);
    
    console.log('\n🔧 サービス状態:');
    console.log(`- JWT Service: ${report.services.jwtService.initialized ? '✅' : '❌'} 初期化済み`);
    console.log(`- API Service: ${report.services.apiService.baseURL ? '✅' : '❌'} 設定済み`);
    console.log(`- Auth Service: ${report.services.authService.initialized ? '✅' : '❌'} 初期化済み`);
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 推奨事項:');
      report.recommendations.forEach((rec, index) => {
        const icon = rec.includes('素晴らしい') ? '🎉' : rec.includes('失敗') ? '⚠️' : '💡';
        console.log(`${icon} ${index + 1}. ${rec}`);
      });
    }
    
    console.log('\n✅ JWT認証統合テスト完了');
    
    // テスト結果に応じた終了コード
    process.exit(report.testResults.failedTests > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('❌ JWT認証統合テストでエラーが発生しました:', error.message);
    process.exit(1);
  }
}

// テストを実行
runJWTTests();