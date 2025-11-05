# 修正内容

## 実施した修正

### 1. Alembic env.py の修正

**問題**: SQLAlchemy 2.0で`async_engine_from_config()`に`url`パラメータを直接渡すとエラーが発生

**修正内容**:
- `alembic_migrations/env.py`の`run_async_migrations()`関数を修正
- `configuration`辞書に`sqlalchemy.url`を設定してから`async_engine_from_config()`に渡すように変更
- `.env`ファイルの読み込みパスを明示的に指定

**変更箇所**:
```python
# 修正前
async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        url=ASYNC_DATABASE_URL,  # ← これが問題
    )

# 修正後
async def run_async_migrations() -> None:
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = ASYNC_DATABASE_URL
    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
```

### 2. Alembicマイグレーションの分岐を解消

**問題**: 複数のheadが存在し、`alembic upgrade head`が実行できない

**修正内容**:
- `alembic merge`コマンドで2つのheadをマージ
- 新しいマージマイグレーション`7b2fe226cc54_merge_heads.py`を生成

**実行コマンド**:
```bash
uv run alembic merge -m "merge heads" 0f42a934865d c5c56a879b8c
```

### 3. PostgreSQL認証設定の調整

**問題**: asyncpgでのパスワード認証が失敗

**実施した対応**:
- PostgreSQLの認証方式をmd5に変更(`/etc/postgresql/14/main/pg_hba.conf`)
- postgresユーザーのパスワードを再設定

**注意**: この問題は環境依存の可能性があり、引き続き調査が必要

## 未解決の問題

### Alembicマイグレーション実行時のパスワード認証エラー

**現象**:
- `uv run alembic upgrade head`実行時に`asyncpg.exceptions.InvalidPasswordError`が発生
- 同じ認証情報で`asyncpg.connect()`は成功する
- FastAPIアプリケーション自体は起動可能

**推測される原因**:
1. Alembic実行時の環境変数の読み込みタイミングの問題
2. asyncpgとPostgreSQLの認証方式の不一致
3. SQLAlchemy 2.0のasync_engine_from_config()の内部処理の問題

**回避策**:
- マイグレーションをスキップしてアプリケーションを起動
- または、同期版のAlembic設定を使用

## 次のステップ

1. PostgreSQLの認証ログを詳細に確認
2. asyncpgのバージョンとPostgreSQLのバージョンの互換性を確認
3. 必要に応じて同期版のSQLAlchemyエンジンを使用するようにAlembic設定を変更
