"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Spot } from "@/lib/spots";

// Dynamic import for SpotMap to avoid SSR issues
const SpotMap = dynamic(() => import("@/components/maps/spot-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
      <p className="text-gray-500">地図を読み込み中...</p>
    </div>
  ),
});

interface PrefectureContentProps {
  prefecture: string;
  spots: Spot[];
  uniqueCities: string[];
  filters: {
    category?: string;
    city?: string;
    search?: string;
  };
}

export function PrefectureContent({
  prefecture,
  spots,
  uniqueCities,
  filters,
}: PrefectureContentProps) {
  const [selectedSpotId, setSelectedSpotId] = useState<string | undefined>();

  const spotTypeCount = {
    shrine: spots.filter((s) => s.spot_type === "shrine").length,
    temple: spots.filter((s) => s.spot_type === "temple").length,
    museum: spots.filter((s) => s.spot_type === "museum").length,
    other: spots.filter((s) => s.spot_type === "other").length,
  };

  return (
    <div className="container mx-auto max-w-6xl space-y-8 px-4 py-8">
      {/* Prefecture Header */}
      <header className="space-y-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/prefectures">
            <Button variant="outline" size="sm">
              ← 都道府県一覧に戻る
            </Button>
          </Link>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{prefecture}</h1>
          <p className="text-muted-foreground">
            {prefecture}で登録されたスポットと御朱印記録
          </p>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                スポット数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{spots.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                市区町村数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueCities.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                神社
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{spotTypeCount.shrine}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                寺院
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{spotTypeCount.temple}</div>
            </CardContent>
          </Card>
        </div>
      </header>

      {/* Filters */}
      {(uniqueCities.length > 0 || filters.category || filters.search) && (
        <Card>
          <CardHeader>
            <CardTitle>フィルター</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {filters.category && (
                <Link href={`/dashboard/prefectures/${encodeURIComponent(prefecture)}`}>
                  <Button variant="outline" size="sm">
                    カテゴリ: {filters.category} ✕
                  </Button>
                </Link>
              )}
              {filters.city && (
                <Link
                  href={`/dashboard/prefectures/${encodeURIComponent(prefecture)}${filters.category ? `?category=${filters.category}` : ""}`}
                >
                  <Button variant="outline" size="sm">
                    市区町村: {filters.city} ✕
                  </Button>
                </Link>
              )}
              {filters.search && (
                <Link href={`/dashboard/prefectures/${encodeURIComponent(prefecture)}`}>
                  <Button variant="outline" size="sm">
                    検索: {filters.search} ✕
                  </Button>
                </Link>
              )}
              {(filters.category || filters.city || filters.search) && (
                <Link href={`/dashboard/prefectures/${encodeURIComponent(prefecture)}`}>
                  <Button variant="ghost" size="sm">
                    すべてクリア
                  </Button>
                </Link>
              )}
            </div>

            {uniqueCities.length > 0 && !filters.city && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">市区町村で絞り込み:</h3>
                <div className="flex flex-wrap gap-2">
                  {uniqueCities.map((city) => (
                    <Link
                      key={city}
                      href={`/dashboard/prefectures/${encodeURIComponent(prefecture)}?city=${encodeURIComponent(city)}${filters.category ? `&category=${filters.category}` : ""}`}
                    >
                      <Button variant="outline" size="sm">
                        {city}
                      </Button>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* List/Map Toggle */}
      {spots.length > 0 ? (
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2">
            <TabsTrigger value="list">リスト表示</TabsTrigger>
            <TabsTrigger value="map">地図表示</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {spots.map((spot) => (
                <Link
                  key={spot.id}
                  href={`/dashboard/spots/${spot.id}`}
                  className="group overflow-hidden rounded-xl border bg-background shadow-sm transition-all hover:border-primary hover:shadow-md"
                  onClick={() => setSelectedSpotId(spot.id)}
                >
                  <article className="flex h-full flex-col p-4">
                    <header className="mb-3">
                      <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                        {spot.name}
                      </h3>
                      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs uppercase tracking-wide">
                          {spot.spot_type === "shrine" && "神社"}
                          {spot.spot_type === "temple" && "寺院"}
                          {spot.spot_type === "museum" && "博物館"}
                          {spot.spot_type === "other" && "その他"}
                        </span>
                        {spot.city && <span>• {spot.city}</span>}
                      </div>
                    </header>

                    {spot.description && (
                      <p className="mb-3 text-sm text-muted-foreground line-clamp-3">
                        {spot.description}
                      </p>
                    )}

                    {spot.address && (
                      <div className="mt-auto pt-3 border-t text-xs text-muted-foreground">
                        📍 {spot.address}
                      </div>
                    )}
                  </article>
                </Link>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="map" className="mt-6">
            <SpotMap
              spots={spots}
              selectedSpotId={selectedSpotId}
              onSpotClick={(spot) => setSelectedSpotId(spot.id)}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-semibold mb-2">スポットが見つかりません</h3>
            <p className="text-sm text-muted-foreground mb-4">
              この都道府県にはまだスポットが登録されていません。
            </p>
            <Link href="/dashboard/spots/new">
              <Button>スポットを追加</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
