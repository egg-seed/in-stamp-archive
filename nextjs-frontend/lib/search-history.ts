/**
 * Search history and saved searches management
 */

export interface SearchFilters {
  keyword?: string;
  prefectures?: string[];
  categories?: string[];
  city?: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  createdAt: string;
}

export interface SearchHistoryEntry {
  id: string;
  filters: SearchFilters;
  timestamp: string;
}

const SEARCH_HISTORY_KEY = "in_stamp_search_history";
const SAVED_SEARCHES_KEY = "in_stamp_saved_searches";
const MAX_HISTORY_ENTRIES = 10;

/**
 * Get search history from localStorage
 */
export function getSearchHistory(): SearchHistoryEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to load search history:", error);
    return [];
  }
}

/**
 * Add a search to history
 */
export function addToSearchHistory(filters: SearchFilters): void {
  if (typeof window === "undefined") return;

  // Don't add empty searches
  if (!filters.keyword && !filters.prefectures?.length && !filters.categories?.length && !filters.city) {
    return;
  }

  try {
    const history = getSearchHistory();
    const newEntry: SearchHistoryEntry = {
      id: Date.now().toString(),
      filters,
      timestamp: new Date().toISOString(),
    };

    // Add to beginning and limit to MAX_HISTORY_ENTRIES
    const updatedHistory = [newEntry, ...history].slice(0, MAX_HISTORY_ENTRIES);

    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error("Failed to save search history:", error);
  }
}

/**
 * Clear all search history
 */
export function clearSearchHistory(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (error) {
    console.error("Failed to clear search history:", error);
  }
}

/**
 * Get saved searches from localStorage
 */
export function getSavedSearches(): SavedSearch[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(SAVED_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to load saved searches:", error);
    return [];
  }
}

/**
 * Save a search with a name
 */
export function saveSearch(name: string, filters: SearchFilters): SavedSearch {
  if (typeof window === "undefined") {
    throw new Error("Cannot save search on server side");
  }

  const saved = getSavedSearches();
  const newSearch: SavedSearch = {
    id: Date.now().toString(),
    name,
    filters,
    createdAt: new Date().toISOString(),
  };

  const updatedSaved = [...saved, newSearch];
  localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(updatedSaved));

  return newSearch;
}

/**
 * Delete a saved search
 */
export function deleteSavedSearch(id: string): void {
  if (typeof window === "undefined") return;

  try {
    const saved = getSavedSearches();
    const updated = saved.filter((s) => s.id !== id);
    localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to delete saved search:", error);
  }
}

/**
 * Format search filters for display
 */
export function formatSearchFilters(filters: SearchFilters): string {
  const parts: string[] = [];

  if (filters.keyword) {
    parts.push(`キーワード: ${filters.keyword}`);
  }
  if (filters.prefectures?.length) {
    parts.push(`都道府県: ${filters.prefectures.join(", ")}`);
  }
  if (filters.categories?.length) {
    parts.push(`カテゴリ: ${filters.categories.join(", ")}`);
  }
  if (filters.city) {
    parts.push(`市区町村: ${filters.city}`);
  }

  return parts.join(" | ") || "すべて";
}
