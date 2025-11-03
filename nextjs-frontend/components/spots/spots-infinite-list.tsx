"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { PaginatedResponse, Spot } from "@/lib/spots";
import SpotCard from "./spot-card";

interface SpotsInfiniteListProps {
  initialData: PaginatedResponse<Spot>;
  pageSize: number;
  initialFilters: {
    keyword: string;
    prefecture: string;
    spotType: string;
  };
}

export default function SpotsInfiniteList({
  initialData,
  pageSize,
  initialFilters,
}: SpotsInfiniteListProps) {
  const [items, setItems] = useState(initialData.items);
  const [page, setPage] = useState(initialData.page);
  const [total, setTotal] = useState(initialData.total);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const filtersRef = useRef(initialFilters);

  const hasMore = items.length < total;

  useEffect(() => {
    filtersRef.current = initialFilters;
    setItems(initialData.items);
    setPage(initialData.page);
    setTotal(initialData.total);
    setError(null);
  }, [initialData, initialFilters]);

  const loadMore = useMemo(() => {
    return async () => {
      if (loading || !hasMore) {
        return;
      }

      setLoading(true);
      setError(null);

      const nextPage = page + 1;
      const params = new URLSearchParams();
      params.set("page", String(nextPage));
      params.set("size", String(pageSize));

      const { keyword, prefecture, spotType } = filtersRef.current;
      if (keyword) {
        params.set("keyword", keyword);
      }
      if (prefecture) {
        params.set("prefecture", prefecture);
      }
      if (spotType) {
        params.set("spotType", spotType);
      }

      try {
        const response = await fetch(`/api/spots?${params.toString()}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const data = (await response.json()) as PaginatedResponse<Spot>;
        setItems((prev) => [...prev, ...data.items]);
        setPage(data.page);
        setTotal(data.total);
      } catch (exception) {
        const message =
          exception instanceof Error
            ? exception.message
            : "Unable to load additional spots";
        setError(message);
      } finally {
        setLoading(false);
      }
    };
  }, [hasMore, loading, page, pageSize]);

  useEffect(() => {
    const observerTarget = sentinelRef.current;
    if (!observerTarget) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(observerTarget);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((spot) => (
          <SpotCard key={spot.id} spot={spot} />
        ))}
      </div>
      {error ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-destructive">
          {error}
        </div>
      ) : null}
      <div ref={sentinelRef} className="h-12 w-full">
        {loading ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Loading more spots...
          </div>
        ) : null}
      </div>
      {!hasMore && !loading ? (
        <p className="text-center text-sm text-muted-foreground">
          You&apos;ve reached the end of the list.
        </p>
      ) : null}
    </div>
  );
}
