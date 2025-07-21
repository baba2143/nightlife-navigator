FROM denoland/deno:1.44.4

# 作業ディレクトリの設定
WORKDIR /app

# ユーザーをdenoに変更（セキュリティ）
USER deno

# 依存関係ファイルをコピー
COPY --chown=deno:deno deno.json* deno.lock* ./

# 依存関係をキャッシュ
RUN deno cache --frozen=false main.ts || true

# アプリケーションコードをコピー
COPY --chown=deno:deno . .

# 権限設定
RUN deno cache --frozen=false main.ts

# データディレクトリの作成と権限設定
RUN mkdir -p /app/data && \
    mkdir -p /app/uploads && \
    chmod 755 /app/data /app/uploads

# 本番用の環境変数設定
ENV DENO_ENV=production
ENV PORT=8000

# ポート公開
EXPOSE 8000

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD deno eval "try { await fetch('http://localhost:8000/api/health'); Deno.exit(0); } catch { Deno.exit(1); }"

# アプリケーション実行
CMD ["deno", "run", "--allow-all", "main.ts"]