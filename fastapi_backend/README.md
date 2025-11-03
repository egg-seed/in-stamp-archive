# FastAPI Backend

## ローカル開発環境のセットアップ

1. `uv` がインストールされていない場合は、[公式ドキュメント](https://github.com/astral-sh/uv) を参考に導入してください。
2. 依存関係をインストールします。

   ```bash
   uv pip install --system -r requirements.txt
   ```

   プロキシ制限のある環境ではネットワーク経路の確認が必要です。インストールが失敗した場合は、社内レジストリの利用や事前に取得したホイールファイルを `--find-links` オプションで指定してください。

3. テストを実行します。

   ```bash
   pytest tests
   ```

   FastAPI や SQLAlchemy などの依存関係が揃っていれば、バックエンド API の統合テストが実行されます。

## トラブルシューティング

- `ModuleNotFoundError` が発生する場合は、上記の依存関係インストールが完了していない可能性があります。ネットワーク越しに PyPI へアクセスできない場合は、オフライン環境向けに社内ミラーやキャッシュを利用してください。
- Postgres を利用した統合テストを実行する場合は、`docker-compose.yml` の `db_test` サービスを起動することで同梱の設定を利用できます。
