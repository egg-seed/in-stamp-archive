"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { History, Save, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select";
import { SPOT_TYPE_LABELS, type SpotType } from "@/lib/spots";
import {
  addToSearchHistory,
  clearSearchHistory,
  deleteSavedSearch,
  formatSearchFilters,
  getSavedSearches,
  getSearchHistory,
  saveSearch,
  type SavedSearch,
  type SearchFilters,
  type SearchHistoryEntry,
} from "@/lib/search-history";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

interface AdvancedSearchProps {
  keyword: string;
  prefectures: string[];
  categories: string[];
  city: string;
  pageSize: number;
  availablePrefectures?: string[];
}

const SPOT_TYPE_OPTIONS: MultiSelectOption[] = [
  { value: "shrine", label: SPOT_TYPE_LABELS.shrine },
  { value: "temple", label: SPOT_TYPE_LABELS.temple },
  { value: "museum", label: SPOT_TYPE_LABELS.museum },
  { value: "other", label: SPOT_TYPE_LABELS.other },
];

export default function AdvancedSearch({
  keyword,
  prefectures,
  categories,
  city,
  pageSize,
  availablePrefectures = [],
}: AdvancedSearchProps) {
  const [formState, setFormState] = useState<SearchFilters>({
    keyword,
    prefectures,
    categories,
    city,
  });
  const [isPending, startTransition] = useTransition();
  const [searchHistory, setSearchHistory] = useState<SearchHistoryEntry[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  // Load search history and saved searches
  useEffect(() => {
    setSearchHistory(getSearchHistory());
    setSavedSearches(getSavedSearches());
  }, []);

  useEffect(() => {
    setFormState({ keyword, prefectures, categories, city });
  }, [keyword, prefectures, categories, city]);

  // Prefecture options from available prefectures
  const prefectureOptions: MultiSelectOption[] = availablePrefectures.map((p) => ({
    value: p,
    label: p,
  }));

  function applyFilters(filters: SearchFilters = formState) {
    const search = new URLSearchParams();
    search.set("page", "1");
    search.set("size", String(pageSize));

    if (filters.keyword?.trim()) {
      search.set("keyword", filters.keyword.trim());
    }
    if (filters.prefectures && filters.prefectures.length > 0) {
      // For now, API supports single prefecture, so take first one
      // TODO: Update API to support multiple prefectures
      search.set("prefecture", filters.prefectures[0]);
    }
    if (filters.categories && filters.categories.length > 0) {
      // For now, API supports single category, so take first one
      // TODO: Update API to support multiple categories
      search.set("spotType", filters.categories[0]);
    }
    if (filters.city?.trim()) {
      search.set("city", filters.city.trim());
    }

    const queryString = search.toString();

    // Add to search history
    addToSearchHistory(filters);
    setSearchHistory(getSearchHistory());

    startTransition(() => {
      router.push(queryString ? `${pathname}?${queryString}` : pathname);
    });
  }

  function resetFilters() {
    const emptyFilters: SearchFilters = {
      keyword: "",
      prefectures: [],
      categories: [],
      city: "",
    };
    setFormState(emptyFilters);
    applyFilters(emptyFilters);
  }

  function loadSearch(filters: SearchFilters) {
    setFormState(filters);
    applyFilters(filters);
  }

  function handleSaveSearch() {
    if (!searchName.trim()) return;

    saveSearch(searchName.trim(), formState);
    setSavedSearches(getSavedSearches());
    setSearchName("");
    setSaveDialogOpen(false);
  }

  function handleDeleteSavedSearch(id: string) {
    deleteSavedSearch(id);
    setSavedSearches(getSavedSearches());
  }

  function handleClearHistory() {
    clearSearchHistory();
    setSearchHistory([]);
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          applyFilters();
        }}
        className="grid gap-4 rounded-xl border bg-background p-4 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="keyword">キーワード</Label>
            <Input
              id="keyword"
              name="keyword"
              placeholder="名前、住所、説明で検索"
              value={formState.keyword || ""}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, keyword: event.target.value }))
              }
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="city">市区町村</Label>
            <Input
              id="city"
              name="city"
              placeholder="例: 渋谷区"
              value={formState.city || ""}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, city: event.target.value }))
              }
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>都道府県</Label>
            <MultiSelect
              options={prefectureOptions}
              selected={formState.prefectures || []}
              onChange={(selected) =>
                setFormState((prev) => ({ ...prev, prefectures: selected }))
              }
              placeholder="都道府県を選択"
              emptyMessage="都道府県が見つかりません"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>カテゴリ</Label>
            <MultiSelect
              options={SPOT_TYPE_OPTIONS}
              selected={formState.categories || []}
              onChange={(selected) =>
                setFormState((prev) => ({ ...prev, categories: selected }))
              }
              placeholder="カテゴリを選択"
              emptyMessage="カテゴリが見つかりません"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "検索中..." : "検索"}
          </Button>
          <Button type="button" variant="outline" disabled={isPending} onClick={resetFilters}>
            リセット
          </Button>

          <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                <Save className="mr-2 h-4 w-4" />
                検索を保存
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>検索を保存</DialogTitle>
                <DialogDescription>
                  この検索条件に名前を付けて保存します
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="search-name">検索名</Label>
                  <Input
                    id="search-name"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    placeholder="例: 東京の神社"
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  保存する条件: {formatSearchFilters(formState)}
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSaveDialogOpen(false)}
                >
                  キャンセル
                </Button>
                <Button onClick={handleSaveSearch} disabled={!searchName.trim()}>
                  保存
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {searchHistory.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" disabled={isPending}>
                  <History className="mr-2 h-4 w-4" />
                  履歴
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium leading-none">検索履歴</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearHistory}
                      className="h-auto p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {searchHistory.map((entry) => (
                      <button
                        key={entry.id}
                        onClick={() => loadSearch(entry.filters)}
                        className="w-full rounded border p-2 text-left text-sm hover:bg-accent"
                      >
                        {formatSearchFilters(entry.filters)}
                      </button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}

          {savedSearches.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" disabled={isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  保存済み
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h4 className="font-medium leading-none">保存済みの検索</h4>
                  <div className="space-y-2">
                    {savedSearches.map((saved) => (
                      <div
                        key={saved.id}
                        className="flex items-start gap-2 rounded border p-2"
                      >
                        <button
                          onClick={() => loadSearch(saved.filters)}
                          className="flex-1 text-left"
                        >
                          <div className="font-medium">{saved.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatSearchFilters(saved.filters)}
                          </div>
                        </button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSavedSearch(saved.id)}
                          className="h-auto p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </form>

      {/* Active Filters Display */}
      {(formState.keyword ||
        (formState.prefectures && formState.prefectures.length > 0) ||
        (formState.categories && formState.categories.length > 0) ||
        formState.city) && (
        <div className="rounded-lg border bg-muted/50 p-3">
          <div className="mb-2 text-sm font-medium">アクティブなフィルター:</div>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            {formatSearchFilters(formState)}
          </div>
        </div>
      )}
    </div>
  );
}
