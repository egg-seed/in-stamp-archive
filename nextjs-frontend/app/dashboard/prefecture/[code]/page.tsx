import { notFound } from "next/navigation";

import { PagePagination } from "@/components/page-pagination";
import {
  fetchPrefectureSpots,
  type PaginatedSpotsResponse,
} from "@/src/actions/fetch-prefecture-spots";
import { PrefectureFilters } from "@/src/components/prefectures/PrefectureFilters";
import { PrefectureListTabs } from "@/src/components/prefectures/PrefectureListTabs";
import { PrefectureMap } from "@/src/components/prefectures/PrefectureMap";
import {
  PREFECTURE_REGION_LABELS,
  getPrefectureByCode,
} from "@/src/data/prefectures";

interface PrefecturePageProps {
  params: Promise<{ code: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const SPOT_TYPE_LABELS: Record<string, string> = {
  shrine: "神社",
  temple: "寺院",
  museum: "博物館",
  other: "その他",
};

const DEFAULT_PAGE_SIZE = 12;

export default async function PrefecturePage({
  params,
  searchParams,
}: PrefecturePageProps) {
  const [{ code }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);

  const prefecture = getPrefectureByCode(code);

  if (!prefecture) {
    notFound();
  }

  const rawPage = Number(resolvedSearchParams.page ?? "1");
  const rawSize = Number(resolvedSearchParams.size ?? DEFAULT_PAGE_SIZE);
  const safePage = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const safeSize =
    Number.isFinite(rawSize) && rawSize > 0 ? Math.min(rawSize, 50) : DEFAULT_PAGE_SIZE;

  const spotType =
    typeof resolvedSearchParams.spotType === "string"
      ? resolvedSearchParams.spotType
      : Array.isArray(resolvedSearchParams.spotType)
        ? resolvedSearchParams.spotType[0]
        : "";
  const city =
    typeof resolvedSearchParams.city === "string"
      ? resolvedSearchParams.city
      : Array.isArray(resolvedSearchParams.city)
        ? resolvedSearchParams.city[0]
        : "";
  const keywordInput =
    typeof resolvedSearchParams.keyword === "string"
      ? resolvedSearchParams.keyword
      : Array.isArray(resolvedSearchParams.keyword)
        ? resolvedSearchParams.keyword[0]
        : "";

  const keywordParam = [city, keywordInput].filter(Boolean).join(" ").trim();

  const { data, error } = await fetchPrefectureSpots({
    prefecture: prefecture.name,
    page: safePage,
    size: safeSize,
    category: spotType || undefined,
    keyword: keywordParam || undefined,
  });

  const fallbackData: PaginatedSpotsResponse = {
    items: [],
    page: safePage,
    size: safeSize,
    total: 0,
  };

  const response = data ?? fallbackData;
  const spots = response.items;
  const totalItems = response.total ?? 0;
  const pageSize = response.size ?? safeSize;
  const currentPage = response.page ?? safePage;
  const totalPages = pageSize > 0 ? Math.ceil(totalItems / pageSize) : 0;

  const additionalQuery: Record<string, string | undefined> = {
    spotType: spotType || undefined,
    city: city || undefined,
    keyword: keywordInput || undefined,
  };

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-slate-500">
          {PREFECTURE_REGION_LABELS[prefecture.region]}
        </p>
        <h1 className="text-3xl font-bold text-slate-900">{prefecture.ja}</h1>
        <p className="text-sm text-slate-500">
          {prefecture.name} / {prefecture.kana}
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <PrefectureMap selectedCode={prefecture.code} />
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">都道府県一覧</h2>
          <PrefectureListTabs selectedCode={prefecture.code} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">フィルター</h2>
        <PrefectureFilters
          initialValues={{
            spotType,
            city,
            keyword: keywordInput,
          }}
        />
      </section>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              {prefecture.ja}のスポット一覧
            </h2>
            <p className="text-sm text-slate-500">
              条件に一致するスポット {totalItems} 件
            </p>
          </div>
        </div>

        {!spots.length ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            {error ? "現在スポット情報を読み込めません。時間をおいて再度お試しください。" : "条件に一致するスポットが見つかりませんでした。"}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {spots.map((spot) => {
              const spotTypeLabel = SPOT_TYPE_LABELS[spot.spot_type] ?? spot.spot_type;
              const hasLocation = spot.city || spot.address;

              return (
                <article
                  key={spot.id}
                  className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        {spotTypeLabel}
                      </p>
                      <h3 className="text-lg font-semibold text-slate-900">{spot.name}</h3>
                    </div>
                    {spot.description && (
                      <p className="text-sm text-slate-600">
                        {spot.description}
                      </p>
                    )}
                    {hasLocation && (
                      <div className="space-y-1 text-sm text-slate-600">
                        {spot.city && <p>{spot.city}</p>}
                        {spot.address && (
                          <p className="text-xs text-slate-500">{spot.address}</p>
                        )}
                      </div>
                    )}
                    {spot.website_url && (
                      <a
                        href={spot.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {spot.website_url}
                      </a>
                    )}
                  </div>
                  <div className="mt-4 text-xs text-slate-400">ID: {spot.slug}</div>
                </article>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <PagePagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            basePath={`/dashboard/prefecture/${prefecture.code}`}
            additionalQuery={additionalQuery}
          />
        )}
      </section>
    </div>
  );
}
