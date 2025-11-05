# Alembic マイグレーション修正内容

## 修正の概要

`alembic upgrade head`実行時に発生していた`asyncpg.exceptions.InvalidPasswordError`を修正しました。

## 問題の原因

1. **パスワードマスキング問題**: SQLAlchemyの`make_url()`で作成されたURLオブジェクトを文字列に変換すると、パスワードが`***`でマスクされてしまう
2. **マイグレーション分岐問題**: 同じリビジョンから2つのマイグレーションが分岐し、両方が`spots`テーブルを作成しようとしていた
3. **IPv6認証問題**: `localhost`がIPv6アドレス（::1）に解決されるが、PostgreSQLの認証設定がIPv6に対応していなかった

## 実施した修正

### 1. env.pyの修正

**ファイル**: `fastapi_backend/alembic_migrations/env.py`

#### 変更点1: URLのパスワードマスキング問題を解決

```python
# 修正前
def _derive_urls(database_url: str) -> tuple[str, str]:
    # ...
    return str(sync_url), str(async_url)

# 修正後
def _derive_urls(database_url: str) -> tuple[str, str]:
    # ...
    # Use render_as_string to preserve password in the URL string
    return sync_url.render_as_string(hide_password=False), async_url.render_as_string(hide_password=False)
```

#### 変更点2: 同期エンジンの使用

```python
# 修正前（非同期エンジンを使用）
async def run_async_migrations() -> None:
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = ASYNC_DATABASE_URL
    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

def run_migrations_online() -> None:
    if ASYNC_DRIVERNAME.startswith("sqlite+"):
        # 同期エンジン
    else:
        asyncio.run(run_async_migrations())  # 非同期エンジン

# 修正後（常に同期エンジンを使用）
def run_migrations_online() -> None:
    """Run migrations in 'online' mode using synchronous engine.
    
    This avoids asyncpg password authentication issues during migrations
    while still allowing the application to use async database connections.
    """
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = SYNC_DATABASE_URL
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        do_run_migrations(connection)

    connectable.dispose()
```

#### 変更点3: config.set_main_optionの削除

```python
# 修正前
SYNC_DATABASE_URL, ASYNC_DATABASE_URL = _get_required_database_urls()
config.set_main_option("sqlalchemy.url", SYNC_DATABASE_URL)  # これがパスワードをマスクする原因
ASYNC_DRIVERNAME = make_url(ASYNC_DATABASE_URL).drivername

# 修正後
SYNC_DATABASE_URL, ASYNC_DATABASE_URL = _get_required_database_urls()
# Don't set the URL in config here to avoid password masking issues
ASYNC_DRIVERNAME = make_url(ASYNC_DATABASE_URL).drivername
```

### 2. .envファイルの修正

**ファイル**: `fastapi_backend/.env`および`fastapi_backend/.env.example`

```env
# 修正前
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/mydatabase

# 修正後（localhostを127.0.0.1に変更）
DATABASE_URL=postgresql+asyncpg://postgres:password@127.0.0.1:5432/mydatabase
```

### 3. マイグレーションファイルの整理

- **削除**: `c5c56a879b8c_add_spot_model.py` - 古いspotsテーブル作成マイグレーション
- **削除**: `7b2fe226cc54_merge_heads.py` - 不要になったマージマイグレーション
- **保持**: `0f42a934865d_create_goshuin_tables.py` - 最新のspotsテーブル作成マイグレーション

### 4. 依存関係の追加

**ファイル**: `fastapi_backend/pyproject.toml`（uvによって自動更新）

```toml
dependencies = [
    # ...
    "psycopg2-binary>=2.9.11",  # 同期版PostgreSQLドライバ
]
```

## 動作確認

```bash
$ cd fastapi_backend
$ uv run alembic upgrade head
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade  -> 402d067a8b92, Added user table
INFO  [alembic.runtime.migration] Running upgrade 402d067a8b92 -> b389592974f8, Add item model
INFO  [alembic.runtime.migration] Running upgrade b389592974f8 -> 0f42a934865d, create goshuin tables
```

## 影響範囲

- **マイグレーション実行**: 同期エンジンを使用するため、パスワード認証エラーが解消
- **アプリケーション実行**: 変更なし（アプリケーションは引き続き非同期エンジンを使用）
- **本番環境**: 影響なし（同期/非同期の違いはマイグレーション実行時のみ）

## 注意事項

- アプリケーション自体は引き続き`postgresql+asyncpg`を使用して非同期データベース接続を行います
- マイグレーション実行時のみ、同期版の`postgresql`ドライバ（psycopg2）を使用します
- この変更により、マイグレーション実行時のパフォーマンスへの影響は軽微です
