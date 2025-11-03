import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SpotsPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">スポット管理</h1>
        <p className="text-muted-foreground">
          寺・神社・城郭などのスポットを登録・編集し、写真や詳細情報を整理します。
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>登録フォーム</CardTitle>
          <CardDescription>
            Google Maps Geocoding API による位置情報取得、Markdown 対応の説明欄、写真アップロードに対応したフォームを実装予定です。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>・名称、カテゴリ、所在地、緯度経度、説明、公式サイト URL</p>
          <p>・写真のドラッグ＆ドロップ並び替え、代表画像設定、キャプション管理</p>
          <p>・複数画像のアップロードとプレビュー表示</p>
        </CardContent>
      </Card>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="list">一覧ビュー</TabsTrigger>
          <TabsTrigger value="map">マップビュー</TabsTrigger>
        </TabsList>
        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>スポット一覧</CardTitle>
              <CardDescription>
                サムネイル、所在地、登録写真数、御朱印数、最終更新日などの指標を表示し、ソートやページネーションに対応します。
              </CardDescription>
            </CardHeader>
            <CardContent className="h-64 rounded-lg border border-dashed text-sm text-muted-foreground">
              スポットテーブルの実装領域（サーバーコンポーネントでデータ取得予定）
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="map">
          <Card>
            <CardHeader>
              <CardTitle>地図連携</CardTitle>
              <CardDescription>
                Leaflet を使ったマーカー表示やクラスタリング、リストとの連動ハイライトを提供します。
              </CardDescription>
            </CardHeader>
            <CardContent className="h-64 rounded-lg border border-dashed text-sm text-muted-foreground">
              地図ビジュアライゼーションの実装領域
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
