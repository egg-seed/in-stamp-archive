import Link from "next/link";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import JapanMap from "@/components/maps/japan-map";
import { authenticatedFetch } from "@/lib/auth-fetch";
import {
  PrefectureStatsResponse,
  groupPrefecturesByHiragana,
  HIRAGANA_GROUPS,
  type HiraganaGroup,
} from "@/lib/prefectures";
import { logger } from "@/lib/logger";

export default async function PrefecturesPage() {
  let stats: PrefectureStatsResponse | null = null;

  try {
    stats = (await authenticatedFetch(
      "/api/prefectures/stats"
    )) as PrefectureStatsResponse;
  } catch (error) {
    logger.error("Failed to load prefecture statistics", error);
  }

  if (!stats) {
    return (
      <div className="container mx-auto max-w-6xl space-y-8 px-4 py-8">
        <h1 className="text-3xl font-bold">都道府県別統計</h1>
        <p className="text-muted-foreground">統計データの読み込みに失敗しました。</p>
      </div>
    );
  }

  const groupedPrefectures = groupPrefecturesByHiragana(stats.by_prefecture);

  // Calculate most visited prefecture
  const mostVisited = stats.by_prefecture.reduce(
    (max, current) => {
      const currentTotal = current.spot_count + current.goshuin_count;
      const maxTotal = max.spot_count + max.goshuin_count;
      return currentTotal > maxTotal ? current : max;
    },
    stats.by_prefecture[0] || { prefecture: "なし", spot_count: 0, goshuin_count: 0 }
  );

  return (
    <div className="container mx-auto max-w-7xl space-y-8 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">都道府県別統計</h1>
        <p className="text-muted-foreground">
          訪問したスポットと御朱印を都道府県別に確認できます。
        </p>
      </header>

      {/* Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              訪問都道府県数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total_prefectures}</div>
            <p className="text-xs text-muted-foreground mt-1">/ 47都道府県</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              総スポット数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total_spots}</div>
            <p className="text-xs text-muted-foreground mt-1">登録済みスポット</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              最多訪問都道府県
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mostVisited.prefecture}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {mostVisited.spot_count + mostVisited.goshuin_count} 件の記録
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Japan Map */}
      <Card>
        <CardHeader>
          <CardTitle>日本地図</CardTitle>
          <p className="text-sm text-muted-foreground">
            都道府県をクリックして詳細を表示
          </p>
        </CardHeader>
        <CardContent>
          <JapanMap
            prefectures={stats.by_prefecture}
            onPrefectureClick={(prefecture) => {
              // Navigate to prefecture detail page (will be implemented)
              window.location.href = `/dashboard/prefectures/${encodeURIComponent(prefecture)}`;
            }}
          />
        </CardContent>
      </Card>

      {/* Prefecture Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>都道府県一覧</CardTitle>
          <p className="text-sm text-muted-foreground">
            五十音順で都道府県を確認
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="あ" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              {Object.keys(HIRAGANA_GROUPS).map((group) => (
                <TabsTrigger key={group} value={group}>
                  {group}行
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(groupedPrefectures).map(([group, prefectures]) => (
              <TabsContent key={group} value={group} className="mt-4">
                {prefectures.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {prefectures.map((prefecture) => (
                      <Link
                        key={prefecture.prefecture}
                        href={`/dashboard/prefectures/${encodeURIComponent(prefecture.prefecture)}`}
                        className="block rounded-lg border bg-card p-4 hover:border-primary hover:shadow-sm transition-all"
                      >
                        <h3 className="font-semibold text-lg mb-2">
                          {prefecture.prefecture}
                        </h3>
                        <dl className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex justify-between">
                            <dt>スポット:</dt>
                            <dd className="font-medium text-foreground">
                              {prefecture.spot_count}
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt>御朱印:</dt>
                            <dd className="font-medium text-foreground">
                              {prefecture.goshuin_count}
                            </dd>
                          </div>
                        </dl>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    この行の都道府県にはまだデータがありません
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
