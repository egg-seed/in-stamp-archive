import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function PrefecturesPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">都道府県ナビ</h1>
        <p className="text-muted-foreground">
          47都道府県の地図とリストから巡礼スポットを探索できます。カテゴリや市区町村、キーワード検索による絞り込みに対応します。
        </p>
      </header>

      <Tabs defaultValue="map" className="space-y-4">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="map">地図ビュー</TabsTrigger>
          <TabsTrigger value="list">リストビュー</TabsTrigger>
        </TabsList>
        <TabsContent value="map">
          <Card>
            <CardHeader>
              <CardTitle>インタラクティブマップ</CardTitle>
              <CardDescription>
                React ベースの日本地図コンポーネントを表示し、都道府県をクリックすることでスポット一覧に遷移します。
              </CardDescription>
            </CardHeader>
            <CardContent className="h-64 rounded-lg border border-dashed text-sm text-muted-foreground">
              地図コンポーネントの実装領域（Leaflet 連携予定）
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>五十音順リスト</CardTitle>
              <CardDescription>
                shadcn/ui の Tabs と Select コンポーネントを活用して、カテゴリや検索条件によるフィルタリングを提供します。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>・カテゴリ（寺／神社／城郭）のセレクトボックス</p>
              <p>・市区町村・キーワード検索フォーム（React Hook Form + Zod）</p>
              <p>・ページネーションまたは無限スクロールに対応</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
