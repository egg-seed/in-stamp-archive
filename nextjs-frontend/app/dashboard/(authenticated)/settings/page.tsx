import { ThemeToggle } from "@/components/theme-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">設定</h1>
        <p className="text-muted-foreground">
          プロフィール情報やテーマ、データエクスポート設定を管理できます。
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>プロフィール</CardTitle>
          <CardDescription>
            メールアドレスや表示名などの基本情報を更新します。（API 接続は今後実装）
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="display-name">表示名</Label>
            <Input id="display-name" placeholder="例：御朱印太郎" disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input id="email" type="email" placeholder="example@example.com" disabled />
          </div>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          フォーム送信処理はバックエンド API 連携後に有効化されます。
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>テーマ</CardTitle>
          <CardDescription>
            shadcn/ui の ThemeToggle を利用してライト／ダークモードを切り替えられます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>データ管理</CardTitle>
          <CardDescription>
            JSON・CSV・PDF 形式でのエクスポートやインポートの実装方針をまとめています。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>・JSON：完全バックアップの出力と復元に対応</p>
          <p>・CSV：スポット一覧および御朱印一覧を出力</p>
          <p>・PDF：印刷向けアルバムを React-PDF で生成</p>
        </CardContent>
      </Card>
    </div>
  );
}
