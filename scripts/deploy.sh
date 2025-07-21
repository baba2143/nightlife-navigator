#!/bin/bash

# Nightlife Navigator デプロイスクリプト
set -e

echo "🚀 Nightlife Navigator デプロイスクリプト"

# 環境変数のチェック
check_env() {
    echo "📋 環境変数をチェック中..."
    
    required_vars=("JWT_SECRET" "GOOGLE_MAPS_API_KEY")
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            echo "❌ 環境変数 $var が設定されていません"
            exit 1
        fi
    done
    
    echo "✅ 環境変数チェック完了"
}

# コードの品質チェック
quality_check() {
    echo "🔍 コード品質をチェック中..."
    
    # フォーマットチェック
    deno fmt --check || (echo "❌ コードフォーマットエラー" && exit 1)
    
    # リントチェック
    deno lint || (echo "❌ リントエラー" && exit 1)
    
    # 型チェック
    deno check **/*.ts **/*.tsx || (echo "❌ 型エラー" && exit 1)
    
    echo "✅ コード品質チェック完了"
}

# テスト実行
run_tests() {
    echo "🧪 テストを実行中..."
    
    deno test -A --coverage=coverage || (echo "❌ テスト失敗" && exit 1)
    
    echo "✅ テスト完了"
}

# ビルド
build_app() {
    echo "🏗️ アプリケーションをビルド中..."
    
    deno task build || (echo "❌ ビルド失敗" && exit 1)
    
    echo "✅ ビルド完了"
}

# Deno Deploy へのデプロイ
deploy_deno() {
    echo "🌐 Deno Deploy にデプロイ中..."
    
    # deployctl を使用してデプロイ
    deno run -A --unstable https://deno.land/x/deploy/deployctl.ts deploy \
        --project=nightlife-navigator \
        --entrypoint=./main.ts \
        --exclude=.git,node_modules,.env*,tests,coverage,docker-compose.yml,Dockerfile,nginx.conf \
        || (echo "❌ Deno Deploy デプロイ失敗" && exit 1)
    
    echo "✅ Deno Deploy デプロイ完了"
}

# Docker デプロイ
deploy_docker() {
    echo "🐳 Docker イメージをビルド・デプロイ中..."
    
    # Docker イメージのビルド
    docker build -t nightlife-navigator:latest . || (echo "❌ Docker ビルド失敗" && exit 1)
    
    # タグ付け（本番用）
    docker tag nightlife-navigator:latest nightlife-navigator:$(date +%Y%m%d-%H%M%S)
    
    echo "✅ Docker イメージビルド完了"
    
    # Docker Compose でデプロイ（ローカル/VPS用）
    if [ "$1" = "local" ]; then
        echo "🏠 ローカル環境でDocker Composeを起動中..."
        docker-compose up -d || (echo "❌ Docker Compose 起動失敗" && exit 1)
        echo "✅ ローカルデプロイ完了"
    fi
}

# SSL証明書の設定
setup_ssl() {
    echo "🔒 SSL証明書を設定中..."
    
    # Let's Encrypt を使用してSSL証明書を取得
    if [ ! -d "./ssl" ]; then
        mkdir -p ./ssl
    fi
    
    # 本番環境では実際のドメインを使用
    DOMAIN=${DOMAIN:-"localhost"}
    
    if [ "$DOMAIN" != "localhost" ]; then
        # 本番環境でのcertbot使用例
        echo "本番環境では以下のコマンドでSSL証明書を取得してください:"
        echo "certbot certonly --standalone -d $DOMAIN"
        echo "証明書ファイルを ./ssl/ ディレクトリにコピーしてください"
    else
        # 開発用の自己署名証明書
        openssl req -x509 -newkey rsa:4096 -keyout ./ssl/key.pem -out ./ssl/cert.pem -days 365 -nodes -subj "/C=JP/ST=Tokyo/L=Tokyo/O=NightlifeNavigator/CN=localhost"
        echo "✅ 開発用SSL証明書を生成しました"
    fi
}

# ヘルスチェック
health_check() {
    echo "🏥 ヘルスチェックを実行中..."
    
    # アプリケーションが起動するまで待機
    echo "アプリケーションの起動を待機中..."
    for i in {1..30}; do
        if curl -f http://localhost:8000/api/health > /dev/null 2>&1; then
            echo "✅ アプリケーションが正常に起動しました"
            curl -s http://localhost:8000/api/health | jq .
            return 0
        fi
        echo "待機中... ($i/30)"
        sleep 2
    done
    
    echo "❌ ヘルスチェック失敗 - アプリケーションが応答しません"
    exit 1
}

# メイン処理
main() {
    echo "開始時刻: $(date)"
    
    # デプロイタイプの選択
    DEPLOY_TYPE=${1:-"deno"}
    
    case $DEPLOY_TYPE in
        "deno")
            echo "📦 Deno Deploy へのデプロイを開始します"
            check_env
            quality_check
            run_tests
            build_app
            deploy_deno
            ;;
        "docker")
            echo "🐳 Docker デプロイを開始します"
            check_env
            quality_check
            run_tests
            setup_ssl
            deploy_docker
            ;;
        "docker-local")
            echo "🏠 ローカル Docker デプロイを開始します"
            quality_check
            run_tests
            setup_ssl
            deploy_docker "local"
            sleep 5
            health_check
            ;;
        "all")
            echo "🌟 全てのデプロイを実行します"
            check_env
            quality_check
            run_tests
            build_app
            setup_ssl
            deploy_deno
            deploy_docker
            ;;
        *)
            echo "使用方法: $0 [deno|docker|docker-local|all]"
            echo "  deno         - Deno Deploy へデプロイ"
            echo "  docker       - Docker イメージをビルド"
            echo "  docker-local - ローカルでDocker Composeを起動"
            echo "  all          - 全てのデプロイタイプを実行"
            exit 1
            ;;
    esac
    
    echo "✨ デプロイ完了! $(date)"
}

# スクリプトの実行
main "$@"