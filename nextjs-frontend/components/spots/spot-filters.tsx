"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SPOT_TYPE_LABELS, SpotType } from "@/lib/spots";

interface SpotFiltersProps {
  keyword: string;
  prefecture: string;
  spotType: string;
  pageSize: number;
}

const SPOT_TYPE_OPTIONS: SpotType[] = ["shrine", "temple", "museum", "other"];

export default function SpotFilters({
  keyword,
  prefecture,
  spotType,
  pageSize,
}: SpotFiltersProps) {
  const [formState, setFormState] = useState({ keyword, prefecture, spotType });
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setFormState({ keyword, prefecture, spotType });
  }, [keyword, prefecture, spotType]);

  function applyFilters() {
    const search = new URLSearchParams();
    search.set("page", "1");
    search.set("size", String(pageSize));

    if (formState.keyword.trim()) {
      search.set("keyword", formState.keyword.trim());
    }
    if (formState.prefecture.trim()) {
      search.set("prefecture", formState.prefecture.trim());
    }
    if (formState.spotType) {
      search.set("spotType", formState.spotType);
    }

    const queryString = search.toString();
    startTransition(() => {
      router.push(queryString ? `${pathname}?${queryString}` : pathname);
    });
  }

  function resetFilters() {
    setFormState({ keyword: "", prefecture: "", spotType: "" });
    const search = new URLSearchParams();
    search.set("page", "1");
    search.set("size", String(pageSize));
    startTransition(() => {
      router.push(`${pathname}?${search.toString()}`);
    });
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        applyFilters();
      }}
      className="grid gap-4 rounded-xl border bg-background p-4 shadow-sm md:grid-cols-[2fr_1fr_1fr_auto]"
    >
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="keyword">
          Keyword
        </label>
        <Input
          id="keyword"
          name="keyword"
          placeholder="Search by name, address, or description"
          value={formState.keyword}
          onChange={(event) =>
            setFormState((prev) => ({ ...prev, keyword: event.target.value }))
          }
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="prefecture">
          Prefecture
        </label>
        <Input
          id="prefecture"
          name="prefecture"
          placeholder="e.g. Tokyo"
          value={formState.prefecture}
          onChange={(event) =>
            setFormState((prev) => ({ ...prev, prefecture: event.target.value }))
          }
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="spotType">
          Spot type
        </label>
        <Select
          value={formState.spotType}
          onValueChange={(value) =>
            setFormState((prev) => ({ ...prev, spotType: value }))
          }
        >
          <SelectTrigger id="spotType" className="w-full">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All types</SelectItem>
            {SPOT_TYPE_OPTIONS.map((value) => (
              <SelectItem key={value} value={value}>
                {SPOT_TYPE_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col justify-end gap-2 sm:flex-row sm:items-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Applying..." : "Apply"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={resetFilters}
        >
          Reset
        </Button>
      </div>
    </form>
  );
}
