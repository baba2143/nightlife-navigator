// セキュリティテストの実行スクリプト
const securityTest = require('./src/utils/securityTest.js').default;

async function runSecurityTests() {
  try {
    console.log('🔒 セキュリティテストを開始します...\n');
    
    // セキュリティレポートを生成
    const report = await securityTest.generateSecurityReport();
    
    console.log('\n📊 === セキュリティレポート ===');
    console.log(`総合セキュリティスコア: ${report.overallSecurityScore}/100`);
    console.log(`テスト成功率: ${report.testResults.successRate}%`);
    console.log(`実行したテスト数: ${report.testResults.totalTests}`);
    console.log(`成功: ${report.testResults.passedTests}, 失敗: ${report.testResults.failedTests}`);
    
    if (report.recommendations.length > 0) {
      console.log('\n⚠️ 推奨事項:');
      report.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }
    
    console.log('\n✅ セキュリティテスト完了');
    
  } catch (error) {
    console.error('❌ セキュリティテストでエラーが発生しました:', error.message);
    process.exit(1);
  }
}

// テストを実行
runSecurityTests();