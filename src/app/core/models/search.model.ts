export interface SearchHistoryEntry {
  query: string;
  timestamp: number;
  resultCount?: number;
}

export type SuggestionType = 'article' | 'author' | 'category' | 'history' | 'trending';

export interface SearchSuggestion {
  type: SuggestionType;
  id: string;
  label: string;
  subtitle?: string;
  route?: string;
}

export interface AdvancedFilterState {
  searchInTitle: boolean;
  searchInAbstract: boolean;
  searchInKeywords: boolean;
  searchInAuthors: boolean;
  authorName: string;
  yearFrom: number | null;
  yearTo: number | null;
}
