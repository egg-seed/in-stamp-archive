# 御朱印めぐり管理帳 仕様書

## 1. システム概要
全国の寺社・城郭でいただいた御朱印を管理する Web アプリケーション。各スポット（寺・神社・城）情報と御朱印記録を登録・閲覧できる。

### 技術スタック
- **バックエンド**: FastAPI (Python) + SQLAlchemy (非同期) + PostgreSQL
- **フロントエンド**: Next.js 15 + React 19 + TypeScript + Tailwind CSS + shadcn/ui
- **認証**: fastapi-users (JWT トークンベース認証)
- **バリデーション**: Pydantic (バックエンド) + Zod (フロントエンド)
- **API 通信**: OpenAPI スキーマから自動生成される型付きクライアント
- **デプロイ**: Vercel (バックエンド・フロントエンド共に対応)

## 2. 利用者像と操作範囲
- **マルチユーザー対応**: 各ユーザーは個別のアカウントで自身の御朱印記録を管理
- **認証システム**: 既存の fastapi-users を活用（メールアドレス登録、パスワードリセット機能付き）
- **データ分離**: ユーザーごとにデータを完全分離し、他ユーザーのデータへのアクセスを禁止
- **設定画面**: プロフィール管理、表示設定（テーマ・ソート条件）、データエクスポート

## 3. 機能要件

### 3.1 認証・セッション管理（実装済み）
- **ユーザー登録**: メールアドレス・パスワードによる新規登録
- **ログイン/ログアウト**: JWT トークンベースの認証
- **パスワードリセット**: メール送信機能を利用したパスワード回復
- **セッション管理**: HTTP-only Cookie によるトークン管理

### 3.2 都道府県ナビゲーション
- **トップ画面**: 47 都道府県のインデックス（地図とリストの二段構成）
  - **地図ナビ**: React ベースの SVG 日本地図コンポーネント、各都道府県クリックでスポット一覧へ遷移
  - **リストナビ**: shadcn/ui の Tabs コンポーネントで五十音順表示
- **都道府県詳細ページ**:
  - カテゴリ別フィルタ（寺・神社・城郭）- shadcn/ui の Select コンポーネント
  - 市区町村・キーワード検索 - React Hook Form + Zod バリデーション
  - 地図/リストビュー切り替え - Leaflet または Google Maps API
  - ページネーション対応（FastAPI の fastapi-pagination 活用）

### 3.3 寺社・城郭管理
- **CRUD 操作**: 登録・閲覧・編集・削除（全てユーザー認証必須）
- **登録フォーム**:
  - 名称、カテゴリ（enum: 寺/神社/城）、都道府県、市区町村、住所
  - 緯度・経度（Google Maps Geocoding API で自動取得オプション）
  - 説明（マークダウン対応）、公式サイト URL
  - **スポット写真**（複数アップロード可能）:
    - 外観、境内、建物などの写真
    - 代表画像の設定（一覧表示用サムネイル）
    - 各写真にキャプション追加可能
    - ドラッグ&ドロップで表示順変更
- **一覧表示**:
  - 代表画像のサムネイル、所在地、登録写真数、登録御朱印数、最終更新日
  - ソート機能（作成日、更新日、名前）
  - 無限スクロール or ページネーション（Next.js Server Components 活用）
- **詳細ページ**:
  - ヒーロー画像（代表画像をフル表示）
  - 地図表示（Leaflet）、基本情報、歴史メモ
  - スポット写真ギャラリー（ライトボックス表示）
  - 関連御朱印のアルバムグリッド
  - 参拝履歴タイムライン

### 3.4 御朱印記録管理
- **スポットとの紐付け**: 各御朱印レコードは特定スポットに関連付け
- **登録項目**:
  - 参拝日（必須、DatePicker コンポーネント）
  - タイトル、メモ（マークダウン対応）
  - 画像（複数アップロード可能）
- **画像アップロード**:
  - FastAPI の `UploadFile` + AWS S3 / Vercel Blob Storage
  - 保存パス: `uploads/goshuin/{user_id}/{spot_id}/{record_id}/`
  - サムネイル自動生成（Pillow ライブラリ使用）
  - EXIF データ抽出で参拝日を自動提案
- **編集・削除**: 本人のみ操作可能（認証ユーザーチェック）

### 3.5 アルバム & スライドショー
- **UI コンポーネント**:
  - shadcn/ui ベースのカスタムライトボックスコンポーネント
  - サムネイルグリッド（TailwindCSS Grid レイアウト）
- **機能**:
  - クリックでフルスクリーン表示
  - 左右ナビゲーション、キーボード操作（矢印キー、Esc）
  - スワイプ操作対応（React タッチイベント）
  - 各画像に参拝日・メモ・撮影情報表示
  - 自動再生オプション

### 3.6 地図連携
- **マッピングライブラリ**: Leaflet (react-leaflet)
- **機能**:
  - 都道府県別スポット表示（カテゴリ別アイコン）
  - マーカークラスタリング（大量スポット対応）
  - リストとマップの同期（クリック時にマーカーハイライト）
  - 現在地取得機能（Geolocation API）
  - 周辺スポットのハイライト表示

### 3.7 検索・フィルタリング
- **フィルタ条件**:
  - 都道府県（複数選択可）
  - カテゴリ（寺/神社/城）
  - 参拝年（年範囲指定）
  - キーワード（スポット名・メモの全文検索）
  - タグ（将来実装）
- **ソート機能**:
  - 参拝日（降順/昇順）
  - 作成日、更新日
  - 参拝回数順
- **実装**: PostgreSQL の全文検索 + SQLAlchemy フィルタクエリ

### 3.8 データエクスポート
- **エクスポート形式**:
  - JSON（完全バックアップ）
  - CSV（スポット一覧、御朱印一覧）
  - PDF（印刷用アルバム）- React-PDF 使用
- **インポート機能**: JSON からのデータ復元
- **画像の扱い**: エクスポート時に Base64 エンコードまたは ZIP アーカイブ

## 4. 非機能要件

### 4.1 セキュリティ
- **認証**: JWT トークン（HTTP-only Cookie）
- **CORS 設定**: フロントエンドドメインのみ許可
- **SQLインジェクション対策**: SQLAlchemy の ORM 使用
- **XSS 対策**: React の自動エスケープ + CSP ヘッダー
- **HTTPS**: 本番環境では必須（Vercel デフォルト対応）

### 4.2 パフォーマンス
- **画像最適化**:
  - Next.js Image コンポーネント（自動最適化）
  - サムネイル生成（WebP 形式）
  - 遅延読み込み（Intersection Observer）
- **データベース**:
  - インデックス作成（user_id, prefecture, category）
  - ページネーション（LIMIT/OFFSET）
  - 接続プール管理（serverless 環境では NullPool）
- **キャッシング**:
  - Next.js のデータキャッシング機能
  - CDN 活用（Vercel Edge Network）

### 4.3 可用性
- **エラーハンドリング**: 全 API エンドポイントで統一的なエラーレスポンス
- **データバックアップ**: PostgreSQL の定期バックアップ（ホスティング側で実施）
- **ログ記録**: FastAPI のロギング機能 + Vercel ログ統合

### 4.4 アクセシビリティ
- **WCAG 2.1 AA 準拠**:
  - shadcn/ui コンポーネント（Radix UI ベース、a11y 対応済み）
  - キーボードナビゲーション完全対応
  - スクリーンリーダー対応（ARIA 属性）
  - カラーコントラスト比確保
- **レスポンシブデザイン**: モバイルファースト（Tailwind CSS）

### 4.5 多言語対応（将来実装）
- Next.js の i18n 機能活用
- 日本語（デフォルト）、英語対応

## 5. データベース設計

### 5.1 既存テーブル
```sql
-- ユーザーテーブル（fastapi-users が管理）
users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  hashed_password VARCHAR NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_superuser BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE
)
```

### 5.2 新規テーブル

```sql
-- スポットテーブル
spots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('temple', 'shrine', 'castle')),
  prefecture VARCHAR(50) NOT NULL,
  city VARCHAR(100),
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  description TEXT,
  official_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_prefecture (user_id, prefecture),
  INDEX idx_category (category)
)

-- 御朱印レコードテーブル
goshuin_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  spot_id UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  visited_on DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_visited (user_id, visited_on DESC),
  INDEX idx_spot (spot_id)
)

-- スポット画像テーブル
spot_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  spot_id UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  exif_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_spot (spot_id, sort_order),
  INDEX idx_primary (spot_id, is_primary)
)

-- 御朱印画像テーブル
goshuin_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  record_id UUID NOT NULL REFERENCES goshuin_records(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  exif_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_record (record_id, sort_order)
)
```

## 6. API 設計

### 6.1 認証関連（既存）
- `POST /auth/register` - 新規登録
- `POST /auth/jwt/login` - ログイン
- `POST /auth/jwt/logout` - ログアウト
- `POST /auth/forgot-password` - パスワードリセット
- `POST /auth/reset-password` - パスワード再設定

### 6.2 スポット管理（新規実装）
- `GET /api/spots` - スポット一覧取得（ページネーション、フィルタ対応）
- `POST /api/spots` - スポット新規作成
- `GET /api/spots/{spot_id}` - スポット詳細取得
- `PATCH /api/spots/{spot_id}` - スポット更新
- `DELETE /api/spots/{spot_id}` - スポット削除
- `GET /api/prefectures/stats` - 都道府県別統計

### 6.3 御朱印記録管理（新規実装）
- `GET /api/spots/{spot_id}/goshuin` - 御朱印一覧取得
- `POST /api/spots/{spot_id}/goshuin` - 御朱印新規作成
- `GET /api/goshuin/{record_id}` - 御朱印詳細取得
- `PATCH /api/goshuin/{record_id}` - 御朱印更新
- `DELETE /api/goshuin/{record_id}` - 御朱印削除

### 6.4 スポット画像管理（新規実装）
- `GET /api/spots/{spot_id}/images` - スポット画像一覧取得
- `POST /api/spots/{spot_id}/images` - スポット画像アップロード
- `PATCH /api/spots/{spot_id}/images/{image_id}` - 画像メタデータ更新（キャプション、代表画像設定）
- `DELETE /api/spots/{spot_id}/images/{image_id}` - スポット画像削除
- `PATCH /api/spots/{spot_id}/images/reorder` - スポット画像並び替え

### 6.5 御朱印画像管理（新規実装）
- `POST /api/goshuin/{record_id}/images` - 御朱印画像アップロード
- `DELETE /api/goshuin/{record_id}/images/{image_id}` - 御朱印画像削除
- `PATCH /api/goshuin/{record_id}/images/reorder` - 御朱印画像並び替え

### 6.6 エクスポート（新規実装）
- `GET /api/export/json` - JSON エクスポート
- `GET /api/export/csv` - CSV エクスポート
- `POST /api/import/json` - JSON インポート

## 7. 画面設計

### 7.1 認証関連（既存）
1. **ログインページ** (`/login`)
2. **新規登録ページ** (`/register`)
3. **パスワードリセットページ** (`/password-recovery`)

### 7.2 メイン画面（新規実装）
4. **ダッシュボード** (`/dashboard`)
   - 都道府県マップ + リストナビゲーション
   - 最近の参拝記録
   - 統計情報（総スポット数、総参拝回数）
5. **都道府県詳細** (`/dashboard/prefecture/[code]`)
   - カテゴリ別タブ（寺/神社/城）
   - 地図ビュー/リストビュー切り替え
   - フィルタ・検索フォーム
6. **スポット詳細** (`/dashboard/spots/[id]`)
   - 基本情報、地図
   - 御朱印アルバム
   - 参拝履歴タイムライン
7. **スポット登録/編集** (`/dashboard/spots/new`, `/dashboard/spots/[id]/edit`)
   - React Hook Form + Zod バリデーション
   - 住所から緯度経度自動取得
8. **御朱印登録/編集** (`/dashboard/goshuin/new`, `/dashboard/goshuin/[id]/edit`)
   - 画像ドラッグ&ドロップアップロード
   - プレビュー表示
   - EXIF データ表示
9. **設定ページ** (`/dashboard/settings`)
   - プロフィール編集
   - テーマ切り替え（Light/Dark mode）
   - データエクスポート/インポート

## 8. 開発・デプロイ

### 8.1 開発環境
- **ローカル開発**: Docker Compose
  - PostgreSQL コンテナ
  - FastAPI バックエンド (ホットリロード)
  - Next.js フロントエンド (ホットリロード)
- **依存関係管理**:
  - Python: uv (pyproject.toml)
  - Node.js: pnpm (package.json)

### 8.2 CI/CD
- **GitHub Actions**:
  - Pre-commit hooks (lint, format, type check)
  - テスト実行 (pytest, Jest)
  - カバレッジレポート
- **デプロイ**: Vercel
  - バックエンド: `/api` ルート (Serverless Functions)
  - フロントエンド: Static Generation + Server Components

### 8.3 データベースマイグレーション
- **Alembic** (FastAPI 側で管理)
- 初回マイグレーション: `alembic revision --autogenerate -m "Add goshuin tables"`
- 適用: `alembic upgrade head`

## 9. 今後の拡張候補
- **参拝ルート作成**: 複数スポットを巡る経路プランニング機能
- **御朱印 OCR**: 画像から寺社名・日付を自動抽出（Google Vision API）
- **SNS 共有**: 御朱印アルバムを SNS にシェア
- **モバイルアプリ**: React Native / Flutter での実装
- **オフライン対応**: PWA + Service Worker
- **コミュニティ機能**: 他ユーザーとの御朱印交換（オプトイン）
