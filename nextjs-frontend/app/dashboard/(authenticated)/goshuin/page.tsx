import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function GoshuinPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">御朱印記録</h1>
        <p className="text-muted-foreground">
          参拝日、メモ、画像などの御朱印記録を管理し、タイムラインやアルバム表示で振り返ることができます。
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>記録フォーム</CardTitle>
          <CardDescription>
            DatePicker による参拝日入力、Markdown 対応メモ、複数画像アップロード、EXIF からの参拝日自動提案に対応します。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>・スポットとの紐付けと参拝日必須入力</p>
          <p>・画像のサムネイル生成とドラッグ＆ドロップ並び替え</p>
          <p>・Zod バリデーションによる入力チェック</p>
        </CardContent>
      </Card>

      <Tabs defaultValue="album" className="space-y-4">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="album">アルバムビュー</TabsTrigger>
          <TabsTrigger value="timeline">タイムライン</TabsTrigger>
        </TabsList>
        <TabsContent value="album">
          <Card>
            <CardHeader>
              <CardTitle>ギャラリー</CardTitle>
              <CardDescription>
                shadcn/ui ベースのライトボックスコンポーネントを使った御朱印アルバムを表示します。
              </CardDescription>
            </CardHeader>
            <CardContent className="h-64 rounded-lg border border-dashed text-sm text-muted-foreground">
              アルバムグリッドの実装領域（スライドショー対応）
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>参拝タイムライン</CardTitle>
              <CardDescription>
                参拝日順に記録を並べ、年別フィルタやキーワード検索に対応します。
              </CardDescription>
            </CardHeader>
            <CardContent className="h-64 rounded-lg border border-dashed text-sm text-muted-foreground">
              タイムライン UI の実装領域
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
