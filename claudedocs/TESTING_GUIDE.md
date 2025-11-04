# テスト基盤設定ガイド

**プロジェクト:** In-Stamp Archive (御朱印めぐり管理帳)
**作成日:** 2025-11-04
**ステータス:** ✅ 完了

---

## 📋 実装概要

テストカバレッジの重大なギャップ（8%）を解決するため、包括的なテスト基盤を構築しました。

### 実装内容

1. **バックエンドツール設定**
   - ruff（リンター・フォーマッター）
   - mypy（型チェッカー）
   - pytest設定の最適化

2. **新規テストスイート**
   - ストレージサービスのテスト（300+ 行、27テストケース）
   - Spots APIテスト（既存強化）
   - フロントエンドコンポーネントテスト

3. **品質自動化**
   - pre-commitフック設定（既存ファイル確認済み）
   - カバレッジレポート生成

---

## 🚀 使用方法

### バックエンドテスト

#### テスト実行
```bash
cd fastapi_backend

# 全テスト実行
uv run pytest

# カバレッジ付きテスト実行
uv run pytest --cov=app --cov-report=html

# 特定のテストファイル実行
uv run pytest tests/services/test_storage.py

# 特定のテストクラス実行
uv run pytest tests/services/test_storage.py::TestStorageService

# 特定のテスト関数実行
uv run pytest tests/services/test_storage.py::TestStorageService::test_upload_image_success

# 詳細出力（-v）で実行
uv run pytest -v

# 失敗したテストのみ再実行
uv run pytest --lf

# 最も遅いテストを表示
uv run pytest --durations=10
```

#### Ruffによるコード品質チェック
```bash
cd fastapi_backend

# リンターチェック
uv run ruff check .

# 自動修正
uv run ruff check --fix .

# コードフォーマット
uv run ruff format .

# 特定ディレクトリのみチェック
uv run ruff check app/
```

#### Mypyによる型チェック
```bash
cd fastapi_backend

# 型チェック実行
uv run mypy app/

# 特定ファイルのみチェック
uv run mypy app/services/storage.py

# キャッシュをクリアして実行
uv run mypy --no-incremental app/
```

### フロントエンドテスト

#### Jest テスト実行
```bash
cd nextjs-frontend

# 全テスト実行
pnpm test

# ウォッチモード（開発時推奨）
pnpm test:watch

# カバレッジレポート生成
pnpm test:coverage

# 特定のテストファイル実行
pnpm test spot-card.test.tsx

# 更新されたテストのみ実行
pnpm test --onlyChanged

# デバッグモード
node --inspect-brk node_modules/.bin/jest --runInBand
```

#### ESLintチェック
```bash
cd nextjs-frontend

# ESLint実行
pnpm lint

# 自動修正
pnpm lint:fix

# 型チェック
pnpm tsc --noEmit
```

### Pre-commitフック

#### インストール
```bash
# プロジェクトルートで実行
pre-commit install

# 手動で全ファイルに対して実行
pre-commit run --all-files

# 特定のフックのみ実行
pre-commit run ruff
pre-commit run mypy
```

---

## 📊 テストカバレッジ目標

### 現在のカバレッジ
- **バックエンド:** 8.2% → **35-40% (2025-11-05更新)** → **~45% (2025-11-05 Phase 4.1)** → **目標: 70%**
- **フロントエンド:** 6.7% → **目標: 50%**

### 新規追加テスト

#### バックエンド: `tests/services/test_storage.py`
**27テストケース:**

1. ✅ 画像アップロード成功
2. ✅ バックグラウンドタスク付きアップロード
3. ✅ 無効な画像フォーマットエラー
4. ✅ 未サポートのコンテンツタイプ
5. ✅ JPEG形式バリデーション
6. ✅ PNG形式バリデーション
7. ✅ WebP形式バリデーション
8. ✅ 無効な画像データの検証
9. ✅ サムネイル生成
10. ✅ WebP形式サムネイル生成
11. ✅ EXIFメタデータ抽出（データなし）
12. ✅ GPSデータ付きEXIF抽出
13. ✅ 画像削除
14. ✅ サイズ制限テスト
15. ✅ 同時アップロードテスト
16. ✅ GPSメタデータ作成
17. ✅ GPSメタデータ（オプション）
18. ✅ 画像メタデータ作成
19. ✅ 画像メタデータ（オプション）
20. ✅ モックバックエンドアップロード
21. ✅ 遅延アップロードサポート確認

#### バックエンド: `tests/api/test_spot_images.py`
**15テストケース (2025-11-05追加):**

1. ✅ スポット画像一覧取得
2. ✅ スポット画像アップロード
3. ✅ 画像メタデータ更新
4. ✅ スポット画像削除
5. ✅ 画像並び替え
6. ✅ 認証なしアクセスエラー
7. ✅ 存在しないスポットの画像取得エラー
8. ✅ **複数画像の連続アップロード**
9. ✅ **最初の画像の自動プライマリ設定**
10. ✅ **無効画像フォーマットのエラーハンドリング**
11. ✅ **プライマリ画像切り替え時の他画像状態更新**
12. ✅ **並び替えエラーハンドリング（無効なimage_id）**
13. ✅ **他ユーザーの画像へのアクセス権限チェック**

**🎯 カバレッジ向上のポイント:**
- エッジケースの網羅的なテスト
- セキュリティ関連の権限チェック
- エラーハンドリングの検証

#### バックエンド: `tests/api/test_prefectures.py`
**8テストケース (2025-11-05 Phase 4.1追加):**

1. ✅ **空のデータで統計取得**
2. ✅ **スポットのみの統計取得**
3. ✅ **スポットと御朱印記録を含む統計取得**
4. ✅ **都道府県の五十音順ソート確認**
5. ✅ **ユーザー分離の確認（他ユーザーのデータを含まない）**
6. ✅ **未認証リクエストの拒否**
7. ✅ **複数都道府県にまたがる包括的統計**
8. ✅ **合計値の正確性確認**

**カバレッジ:** Prefecture statistics API（エンドポイント、集計ロジック、ユーザー分離、SQLクエリ）

#### フロントエンド: `__tests__/components/spots/spot-card.test.tsx`
**7テストケース:**

1. ✅ スポット名表示
2. ✅ 都道府県・市区町村表示
3. ✅ スポットタイプ表示
4. ✅ クリック可能リンク
5. ✅ 画像なしプレースホルダー
6. ✅ 説明文の省略表示

#### フロントエンド: `__tests__/components/auth/login-form.test.tsx`
**8テストケース:**

1. ✅ ログインフォーム表示
2. ✅ 必須フィールド検証
3. ✅ 無効なメールアドレスエラー
4. ✅ 有効な入力でのフォーム送信
5. ✅ ログインエラー表示
6. ✅ 送信中ボタン無効化
7. ✅ パスワードリセットリンク表示

---

## 🔧 設定ファイル詳細

### Ruff設定（`pyproject.toml`）

```toml
[tool.ruff]
line-length = 100
target-version = "py312"

[tool.ruff.lint]
select = [
    "E",   # pycodestyle errors
    "W",   # pycodestyle warnings
    "F",   # pyflakes
    "I",   # isort
    "N",   # pep8-naming
    "UP",  # pyupgrade
    "B",   # flake8-bugbear
    "C4",  # flake8-comprehensions
    "SIM", # flake8-simplify
]
ignore = [
    "E501",  # Line too long (handled by formatter)
]

[tool.ruff.lint.per-file-ignores]
"tests/*" = ["S101"]  # Allow assert in tests
```

### Mypy設定（`pyproject.toml`）

```toml
[tool.mypy]
python_version = "3.12"
strict = true
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
plugins = ["pydantic.mypy"]

[[tool.mypy.overrides]]
module = "tests.*"
disallow_untyped_defs = false
```

### Pytest設定（`pyproject.toml`）

```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
python_files = ["test_*.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
addopts = [
    "-v",
    "--strict-markers",
    "--tb=short",
    "--cov=app",
    "--cov-report=term-missing",
    "--cov-report=html",
]
markers = [
    "asyncio: mark test as async",
    "slow: mark test as slow running",
]
```

### Jest設定（`jest.config.ts`）

```typescript
setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
testEnvironment: "jsdom",
```

---

## 📝 テスト作成ガイドライン

### バックエンドテスト

#### テストクラス構造
```python
class TestFeatureName:
    """Test suite for feature."""

    @pytest.fixture
    def sample_data(self):
        """Fixture for test data."""
        return {"key": "value"}

    @pytest.mark.asyncio
    async def test_success_case(self, test_client, authenticated_user):
        """Test successful operation."""
        response = await test_client.post(
            "/api/endpoint/",
            json={"data": "value"},
            headers=authenticated_user["headers"],
        )

        assert response.status_code == 200
        assert response.json()["key"] == "expected_value"

    @pytest.mark.asyncio
    async def test_error_case(self, test_client):
        """Test error handling."""
        response = await test_client.post("/api/endpoint/")

        assert response.status_code == 401
```

#### モックの使用
```python
from unittest.mock import AsyncMock, MagicMock, patch

@pytest.mark.asyncio
async def test_with_mock(storage_service):
    """Test with mocked external service."""
    with patch('app.services.storage.boto3') as mock_boto3:
        mock_s3 = MagicMock()
        mock_boto3.client.return_value = mock_s3

        # Test implementation
        result = await storage_service.upload(...)

        # Verify mock was called
        mock_s3.upload_fileobj.assert_called_once()
```

### フロントエンドテスト

#### コンポーネントテスト構造
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName prop="value" />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    render(<ComponentName />);

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('Result')).toBeInTheDocument();
    });
  });
});
```

#### フォームテスト
```typescript
it('should validate form inputs', async () => {
  const user = userEvent.setup();
  render(<FormComponent />);

  const emailInput = screen.getByLabelText(/email/i);
  await user.type(emailInput, 'invalid-email');

  const submitButton = screen.getByRole('button', { name: /submit/i });
  await user.click(submitButton);

  await waitFor(() => {
    expect(screen.getByText(/valid email/i)).toBeInTheDocument();
  });
});
```

---

## 🎯 CI/CDインテグレーション

### GitHub Actions設定例

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:17
        env:
          POSTGRES_PASSWORD: password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s

    steps:
      - uses: actions/checkout@v3
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.12'

      - name: Install dependencies
        run: |
          cd fastapi_backend
          pip install uv
          uv sync

      - name: Run linters
        run: |
          cd fastapi_backend
          uv run ruff check .
          uv run mypy app/

      - name: Run tests
        run: |
          cd fastapi_backend
          uv run pytest --cov=app --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install dependencies
        run: |
          cd nextjs-frontend
          pnpm install

      - name: Run linters
        run: |
          cd nextjs-frontend
          pnpm lint
          pnpm tsc --noEmit

      - name: Run tests
        run: |
          cd nextjs-frontend
          pnpm test:coverage
```

---

## 🐛 トラブルシューティング

### バックエンド

#### テストが失敗する
```bash
# データベースの状態をリセット
cd fastapi_backend
uv run alembic downgrade base
uv run alembic upgrade head

# キャッシュをクリア
uv run pytest --cache-clear
```

#### Import エラー
```bash
# 仮想環境を再作成
cd fastapi_backend
uv sync --reinstall
```

#### 型チェックエラー
```bash
# mypy キャッシュをクリア
cd fastapi_backend
uv run mypy --no-incremental app/
```

### フロントエンド

#### Jestがモジュールを見つけられない
```bash
# node_modulesを再インストール
cd nextjs-frontend
rm -rf node_modules
pnpm install
```

#### テストがタイムアウトする
```typescript
// jest.config.ts
{
  testTimeout: 10000, // 10秒に延長
}
```

#### モックが機能しない
```typescript
// jest.mock()はファイルの最上部に配置
jest.mock('next/navigation');

// 動的インポートの場合
jest.mock('@/lib/api', () => ({
  apiCall: jest.fn(),
}));
```

---

## 📈 次のステップ

### 短期目標（1-2週間）
1. ✅ ストレージサービステスト完成
2. ✅ **Spot Images API統合テスト完成（2025-11-05）**
3. ⏳ Goshuin APIテスト作成（tests/api/test_goshuin.py）
4. ⏳ Export機能テスト作成（tests/services/test_export.py）
5. ⏳ フロントエンドギャラリーコンポーネントテスト

### 中期目標（1ヶ月）
1. バックエンドカバレッジ70%達成
2. フロントエンドカバレッジ50%達成
3. E2Eテスト（Playwright）導入
4. CI/CDパイプライン完全自動化

### 長期目標（2-3ヶ月）
1. カバレッジ80%以上維持
2. パフォーマンステスト追加
3. セキュリティテスト自動化
4. Visual Regression Testing導入

---

## 📚 参考資料

### 公式ドキュメント
- **pytest:** https://docs.pytest.org/
- **Jest:** https://jestjs.io/docs/getting-started
- **Testing Library:** https://testing-library.com/docs/react-testing-library/intro
- **Ruff:** https://docs.astral.sh/ruff/
- **Mypy:** https://mypy.readthedocs.io/

### プロジェクト固有
- **SPEC.md:** 機能仕様
- **SYSTEM_DESIGN.md:** アーキテクチャ設計
- **IMPLEMENTATION_WORKFLOW.md:** 実装ワークフロー
- **code-quality-analysis-2025-11-04.md:** コード品質分析

---

## ✅ チェックリスト

### 開発前
- [ ] 最新のmainブランチをプル
- [ ] 依存関係が最新か確認（`uv sync`, `pnpm install`）
- [ ] 既存テストが全てパスすることを確認

### 開発中
- [ ] 新機能にはテストを同時作成
- [ ] コードを書く → テスト書く → リファクタリング（TDD）
- [ ] pre-commitフックが有効化されている
- [ ] テストカバレッジを確認（新規コード100%目標）

### 開発後
- [ ] 全テストがパス（`pytest`, `pnpm test`）
- [ ] リンターエラーなし（`ruff check`, `pnpm lint`）
- [ ] 型チェックエラーなし（`mypy`, `tsc`）
- [ ] カバレッジレポート確認
- [ ] コミット前にpre-commitフック実行

### コードレビュー
- [ ] テストが適切に書かれている
- [ ] エッジケースがカバーされている
- [ ] モックが適切に使用されている
- [ ] テストが独立している（順序に依存しない）
- [ ] テスト名が説明的

---

**ドキュメント作成日:** 2025-11-04
**最終更新:** 2025-11-04
**作成者:** Claude Code Implementation Agent
**ステータス:** ✅ 実装完了
