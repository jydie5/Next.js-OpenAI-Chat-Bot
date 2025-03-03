# Next.js OpenAI Chat Bot

Next.jsとOpenAI APIを使用したシンプルなチャットボットアプリケーションです。

## 機能

- OpenAI GPT-4oを利用したチャット機能
- リアルタイムストリーミングレスポンス
- Markdownのサポート

## 技術スタック

- Next.js 14
- TypeScript
- Tailwind CSS
- OpenAI API

## セットアップ方法

1. リポジトリをクローン:
   ```bash
   git clone https://github.com/jydie5/github-claude-nextjs.git
   cd github-claude-nextjs
   ```

2. 依存関係のインストール:
   ```bash
   npm install
   ```

3. 環境変数の設定:
   `.env.local.example` ファイルを `.env.local` にコピーして、OpenAI APIキーを設定します。

4. 開発サーバーの起動:
   ```bash
   npm run dev
   ```

5. ブラウザで http://localhost:3000 を開きます。