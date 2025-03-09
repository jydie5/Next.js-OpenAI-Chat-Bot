# チャットボットアプリケーション要件定義

## 1. データベース要件（SQLite）

### テーブル設計

#### usersテーブル
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    is_root BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### sessionsテーブル
```sql
CREATE TABLE sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### messagesテーブル
```sql
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    role TEXT NOT NULL, -- 'user' or 'assistant'
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);
```

### 初期データ
- 管理者アカウント
  - ユーザー名: admin
  - パスワード: 12345678
  - is_root: true

## 2. 認証システム要件

### 認証フロー
1. ログイン画面の実装（/login）
   - ユーザー名とパスワードの入力フォーム
   - バリデーション機能
   - エラーメッセージの表示

2. 認証状態の管理
   - セッションベースの認証
   - 未認証ユーザーのリダイレクト
   - ログアウト機能

## 3. UI/UX要件

### サイドバー
1. チャット履歴表示
   - 各セッションのタイトル（最初のメッセージの一部を表示）
   - 作成日時
   - クリックで該当セッションに遷移

2. 操作ボタン
   - New Chatボタン（新規チャットセッション作成）
   - ログアウトボタン

### メインエリア
1. チャット画面
   - メッセージ履歴表示
   - 入力フォーム

2. 管理者用タブ/リンク
   - rootユーザーの場合のみ表示
   - 管理画面への遷移ボタン

## 4. 管理画面要件

### ユーザー管理
1. ユーザー一覧
   - ユーザー名
   - 作成日時
   - root権限の有無
   - 操作ボタン（編集・削除）

2. ユーザーCRUD機能
   - 新規ユーザー作成
   - ユーザー情報編集
   - ユーザー削除
   - root権限の付与/剥奪

### セッション管理
1. セッション一覧（最新100件）
   - セッションID
   - ユーザー名
   - セッションタイトル
   - 作成日時
   - メッセージ数

## 5. システム構成

### 技術スタック追加
1. データベース
   - SQLite
   - Prisma ORM

2. 認証
   - NextAuth.js
   - bcrypt（パスワードハッシュ化）

3. UI
   - Tailwind CSS（既存）
   - HeadlessUI（モーダル、ドロップダウン等）

## 6. セキュリティ要件
1. パスワードのハッシュ化保存
2. CSRF対策
3. Rate Limiting
4. 入力値のサニタイズ
5. 適切なアクセス制御

## 7. エラーハンドリング
1. バリデーションエラー
2. 認証エラー
3. データベースエラー
4. API通信エラー

## 8. 画面遷移図
```mermaid
graph TD
    A[ログイン画面] --> B{認証}
    B -->|成功| C[チャット画面]
    B -->|失敗| A
    C --> D[新規チャット]
    C --> E[過去のチャット]
    C -->|rootユーザーのみ| F[管理画面]
    F --> G[ユーザー管理]
    F --> H[セッション管理]