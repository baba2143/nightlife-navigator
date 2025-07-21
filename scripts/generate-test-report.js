#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * テストレポート生成スクリプト
 * 各種テストの実行と包括的なレポートを生成
 */

console.log('🧪 NightLife Navigator - 包括的テストレポート生成開始\n');

const reportDir = path.join(__dirname, '..', 'test-reports');
const coverageDir = path.join(__dirname, '..', 'coverage');

// レポートディレクトリの作成
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

const results = {
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'test',
  testSuites: {},
  coverage: {},
  summary: {}
};

// テストスイート実行関数
async function runTestSuite(name, command, description) {
  console.log(`📋 ${description}を実行中...`);
  
  try {
    const startTime = Date.now();
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    const endTime = Date.now();
    
    results.testSuites[name] = {
      description,
      status: 'success',
      duration: endTime - startTime,
      output: output.slice(-1000), // 出力の最後1000文字を保存
      timestamp: new Date().toISOString()
    };
    
    console.log(`✅ ${description} - 成功 (${endTime - startTime}ms)\n`);
    
  } catch (error) {
    results.testSuites[name] = {
      description,
      status: 'failed',
      error: error.message,
      output: error.stdout ? error.stdout.slice(-1000) : '',
      timestamp: new Date().toISOString()
    };
    
    console.log(`❌ ${description} - 失敗: ${error.message}\n`);
  }
}

// メイン実行関数
async function generateReport() {
  try {
    // 1. ユニットテスト
    await runTestSuite(
      'unit_components',
      'npm run test:components -- --silent',
      'コンポーネントユニットテスト'
    );
    
    await runTestSuite(
      'unit_services',
      'npm run test:services -- --silent',
      'サービスユニットテスト'
    );
    
    await runTestSuite(
      'unit_utils',
      'npm run test:utils -- --silent',
      'ユーティリティユニットテスト'
    );
    
    // 2. 統合テスト
    await runTestSuite(
      'integration_tests',
      'npm run test:integration -- --silent',
      '統合テスト'
    );
    
    // 3. エンドツーエンドテスト
    await runTestSuite(
      'e2e_tests',
      'npm run test:e2e -- --silent',
      'エンドツーエンドテスト'
    );
    
    // 4. カバレッジレポート生成
    console.log('📊 カバレッジレポートを生成中...');
    try {
      execSync('npm run test:coverage -- --silent', { stdio: 'pipe' });
      
      // カバレッジ結果の読み込み
      const coverageSummaryPath = path.join(coverageDir, 'coverage-summary.json');
      if (fs.existsSync(coverageSummaryPath)) {
        results.coverage = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'));
        console.log('✅ カバレッジレポート生成完了\n');
      }
    } catch (error) {
      console.log(`❌ カバレッジレポート生成失敗: ${error.message}\n`);
    }
    
    // 5. セキュリティテスト
    await runTestSuite(
      'security_tests',
      'npm run test:security',
      'セキュリティテスト'
    );
    
    // 6. JWTテスト
    await runTestSuite(
      'jwt_tests',
      'npm run test:jwt',
      'JWTテスト'
    );
    
    // サマリー生成
    generateSummary();
    
    // レポートファイル生成
    await generateReportFiles();
    
    console.log('🎉 テストレポート生成完了!');
    console.log(`📄 詳細レポート: ${path.join(reportDir, 'test-report.html')}`);
    console.log(`📊 カバレッジレポート: ${path.join(coverageDir, 'lcov-report', 'index.html')}`);
    
  } catch (error) {
    console.error('❌ レポート生成中にエラーが発生しました:', error);
    process.exit(1);
  }
}

// サマリー生成
function generateSummary() {
  const suites = Object.values(results.testSuites);
  const totalSuites = suites.length;
  const passedSuites = suites.filter(suite => suite.status === 'success').length;
  const failedSuites = suites.filter(suite => suite.status === 'failed').length;
  
  results.summary = {
    totalSuites,
    passedSuites,
    failedSuites,
    successRate: totalSuites > 0 ? ((passedSuites / totalSuites) * 100).toFixed(2) : 0,
    overallStatus: failedSuites === 0 ? 'success' : 'failed'
  };
  
  console.log('📈 テスト実行サマリー:');
  console.log(`   総スイート数: ${totalSuites}`);
  console.log(`   成功: ${passedSuites}`);
  console.log(`   失敗: ${failedSuites}`);
  console.log(`   成功率: ${results.summary.successRate}%`);
  console.log(`   総合結果: ${results.summary.overallStatus === 'success' ? '✅ 成功' : '❌ 失敗'}\n`);
}

// レポートファイル生成
async function generateReportFiles() {
  // JSON レポート
  const jsonReportPath = path.join(reportDir, 'test-report.json');
  fs.writeFileSync(jsonReportPath, JSON.stringify(results, null, 2));
  
  // HTML レポート
  const htmlReport = generateHTMLReport();
  const htmlReportPath = path.join(reportDir, 'test-report.html');
  fs.writeFileSync(htmlReportPath, htmlReport);
  
  // Markdown レポート
  const markdownReport = generateMarkdownReport();
  const markdownReportPath = path.join(reportDir, 'test-report.md');
  fs.writeFileSync(markdownReportPath, markdownReport);
  
  console.log('📄 レポートファイル生成完了:');
  console.log(`   JSON: ${jsonReportPath}`);
  console.log(`   HTML: ${htmlReportPath}`);
  console.log(`   Markdown: ${markdownReportPath}\n`);
}

// HTML レポート生成
function generateHTMLReport() {
  const coverageData = results.coverage.total || {};
  
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NightLife Navigator - テストレポート</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: #ecf0f1; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .success { color: #27ae60; }
        .failed { color: #e74c3c; }
        .warning { color: #f39c12; }
        .test-suite { background: #f8f9fa; margin: 10px 0; padding: 15px; border-radius: 8px; border-left: 4px solid #3498db; }
        .test-suite.success { border-left-color: #27ae60; }
        .test-suite.failed { border-left-color: #e74c3c; }
        .coverage-bar { background: #ecf0f1; height: 20px; border-radius: 10px; overflow: hidden; margin: 10px 0; }
        .coverage-fill { height: 100%; background: linear-gradient(90deg, #e74c3c 0%, #f39c12 50%, #27ae60 100%); transition: width 0.3s ease; }
        .timestamp { color: #7f8c8d; font-size: 0.9em; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #34495e; color: white; }
        .status-badge { padding: 4px 8px; border-radius: 4px; color: white; font-size: 0.8em; }
        .status-success { background: #27ae60; }
        .status-failed { background: #e74c3c; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 NightLife Navigator テストレポート</h1>
        <p class="timestamp">生成日時: ${results.timestamp}</p>
        
        <h2>📈 実行サマリー</h2>
        <div class="summary">
            <div class="metric">
                <div class="metric-value ${results.summary.overallStatus === 'success' ? 'success' : 'failed'}">
                    ${results.summary.successRate}%
                </div>
                <div>成功率</div>
            </div>
            <div class="metric">
                <div class="metric-value">${results.summary.totalSuites}</div>
                <div>総スイート数</div>
            </div>
            <div class="metric">
                <div class="metric-value success">${results.summary.passedSuites}</div>
                <div>成功</div>
            </div>
            <div class="metric">
                <div class="metric-value ${results.summary.failedSuites > 0 ? 'failed' : ''}">${results.summary.failedSuites}</div>
                <div>失敗</div>
            </div>
        </div>

        <h2>📊 コードカバレッジ</h2>
        <div class="summary">
            <div class="metric">
                <div class="metric-value ${(coverageData.statements?.pct || 0) >= 70 ? 'success' : 'warning'}">
                    ${(coverageData.statements?.pct || 0).toFixed(1)}%
                </div>
                <div>文（Statements）</div>
            </div>
            <div class="metric">
                <div class="metric-value ${(coverageData.branches?.pct || 0) >= 70 ? 'success' : 'warning'}">
                    ${(coverageData.branches?.pct || 0).toFixed(1)}%
                </div>
                <div>分岐（Branches）</div>
            </div>
            <div class="metric">
                <div class="metric-value ${(coverageData.functions?.pct || 0) >= 70 ? 'success' : 'warning'}">
                    ${(coverageData.functions?.pct || 0).toFixed(1)}%
                </div>
                <div>関数（Functions）</div>
            </div>
            <div class="metric">
                <div class="metric-value ${(coverageData.lines?.pct || 0) >= 70 ? 'success' : 'warning'}">
                    ${(coverageData.lines?.pct || 0).toFixed(1)}%
                </div>
                <div>行（Lines）</div>
            </div>
        </div>

        <h2>🧪 テストスイート詳細</h2>
        <table>
            <thead>
                <tr>
                    <th>テストスイート</th>
                    <th>ステータス</th>
                    <th>実行時間</th>
                    <th>説明</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(results.testSuites).map(([name, suite]) => `
                    <tr>
                        <td><strong>${name}</strong></td>
                        <td><span class="status-badge status-${suite.status}">${suite.status}</span></td>
                        <td>${suite.duration ? suite.duration + 'ms' : 'N/A'}</td>
                        <td>${suite.description}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <h2>📋 詳細結果</h2>
        ${Object.entries(results.testSuites).map(([name, suite]) => `
            <div class="test-suite ${suite.status}">
                <h3>${suite.description} (${name})</h3>
                <p><strong>ステータス:</strong> ${suite.status}</p>
                ${suite.duration ? `<p><strong>実行時間:</strong> ${suite.duration}ms</p>` : ''}
                ${suite.error ? `<p><strong>エラー:</strong> ${suite.error}</p>` : ''}
                <p class="timestamp">実行時刻: ${suite.timestamp}</p>
            </div>
        `).join('')}
    </div>
</body>
</html>`;
}

// Markdown レポート生成
function generateMarkdownReport() {
  return `# 🧪 NightLife Navigator テストレポート

**生成日時:** ${results.timestamp}

## 📈 実行サマリー

| 項目 | 値 |
|------|-----|
| 総スイート数 | ${results.summary.totalSuites} |
| 成功 | ${results.summary.passedSuites} |
| 失敗 | ${results.summary.failedSuites} |
| 成功率 | ${results.summary.successRate}% |
| 総合結果 | ${results.summary.overallStatus === 'success' ? '✅ 成功' : '❌ 失敗'} |

## 📊 コードカバレッジ

| メトリック | カバレッジ |
|------------|------------|
| 文（Statements） | ${((results.coverage.total?.statements?.pct || 0)).toFixed(1)}% |
| 分岐（Branches） | ${((results.coverage.total?.branches?.pct || 0)).toFixed(1)}% |
| 関数（Functions） | ${((results.coverage.total?.functions?.pct || 0)).toFixed(1)}% |
| 行（Lines） | ${((results.coverage.total?.lines?.pct || 0)).toFixed(1)}% |

## 🧪 テストスイート詳細

${Object.entries(results.testSuites).map(([name, suite]) => `
### ${suite.description}

- **ステータス:** ${suite.status === 'success' ? '✅ 成功' : '❌ 失敗'}
- **実行時間:** ${suite.duration ? suite.duration + 'ms' : 'N/A'}
${suite.error ? `- **エラー:** ${suite.error}` : ''}
- **実行時刻:** ${suite.timestamp}
`).join('\n')}

---
*このレポートは自動生成されました*
`;
}

// スクリプト実行
if (require.main === module) {
  generateReport().catch(console.error);
}

module.exports = { generateReport };