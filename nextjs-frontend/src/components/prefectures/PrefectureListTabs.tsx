"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  PREFECTURE_REGION_LABELS,
  PREFECTURE_REGIONS,
  type PrefectureMetadata,
  type PrefectureRegion,
  getPrefectureByCode,
  getPrefecturesByRegion,
} from "@/src/data/prefectures";

export type PrefectureListTabsProps = {
  selectedCode?: string;
  hrefBase?: string;
  onSelect?: (prefecture: PrefectureMetadata) => void;
  className?: string;
};

export function PrefectureListTabs({
  selectedCode,
  hrefBase = "/dashboard/prefecture",
  onSelect,
  className,
}: PrefectureListTabsProps) {
  const router = useRouter();
  const prefecturesByRegion = useMemo(() => getPrefecturesByRegion(), []);
  const selectedPrefecture = selectedCode
    ? getPrefectureByCode(selectedCode)
    : undefined;

  const [activeRegion, setActiveRegion] = useState<PrefectureRegion>(
    selectedPrefecture?.region ?? PREFECTURE_REGIONS[0],
  );

  useEffect(() => {
    if (selectedPrefecture) {
      setActiveRegion(selectedPrefecture.region);
    }
  }, [selectedPrefecture]);

  const handleSelect = (prefecture: PrefectureMetadata) => {
    onSelect?.(prefecture);
    if (hrefBase) {
      router.push(`${hrefBase}/${prefecture.code}`);
    }
  };

  return (
    <Tabs
      value={activeRegion}
      onValueChange={(value) => setActiveRegion(value as PrefectureRegion)}
      className={className}
    >
      <TabsList className="flex-wrap justify-start gap-2 bg-transparent p-0">
        {PREFECTURE_REGIONS.map((region) => (
          <TabsTrigger
            key={region}
            value={region}
            className={cn(
              "rounded-full border border-transparent px-4 py-2 text-sm capitalize data-[state=active]:border-blue-500 data-[state=active]:bg-blue-50",
            )}
          >
            {PREFECTURE_REGION_LABELS[region as PrefectureRegion]}
          </TabsTrigger>
        ))}
      </TabsList>

      {PREFECTURE_REGIONS.map((region) => (
        <TabsContent key={region} value={region} className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {prefecturesByRegion[region as PrefectureRegion]?.map((prefecture) => {
              const isSelected = prefecture.code === selectedCode;

              return (
                <button
                  key={prefecture.code}
                  type="button"
                  onClick={() => handleSelect(prefecture)}
                  className={cn(
                    "flex flex-col rounded-lg border px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                    isSelected
                      ? "border-blue-500 bg-blue-50 text-blue-800"
                      : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50",
                  )}
                  aria-pressed={isSelected}
                >
                  <span className="text-sm font-semibold">{prefecture.ja}</span>
                  <span className="text-xs text-slate-500">{prefecture.name}</span>
                  <span className="mt-1 text-xs text-slate-400">{prefecture.kana}</span>
                </button>
              );
            })}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
