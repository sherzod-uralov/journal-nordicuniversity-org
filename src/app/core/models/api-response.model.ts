export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  currentPage: number;
  totalPages: number;
}

export interface MultiSearchResponse<T> {
  data: T[];
  currentPage: number;
  allItems: number;
  filterItems: number;
  totalPages: number;
}

export interface ApiMessage {
  message: string;
}
