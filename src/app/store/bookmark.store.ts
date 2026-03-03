import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { BookmarkService } from '@core/services/bookmark.service';
import { Article } from '@core/models/article.model';

interface BookmarkState {
  bookmarks: Article[];
}

const initialState: BookmarkState = {
  bookmarks: [],
};

export const BookmarkStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ bookmarks }) => ({
    bookmarkIds: computed(() => new Set(bookmarks().map(a => a.id))),
    count: computed(() => bookmarks().length),
  })),
  withMethods((store, bookmarkService = inject(BookmarkService)) => ({
    load(): void {
      patchState(store, { bookmarks: bookmarkService.getBookmarks() });
    },
    toggle(article: Article): void {
      const updated = bookmarkService.toggleBookmark(article);
      patchState(store, { bookmarks: updated });
    },
    remove(id: string): void {
      const updated = bookmarkService.removeBookmark(id);
      patchState(store, { bookmarks: updated });
    },
    clear(): void {
      const updated = bookmarkService.clear();
      patchState(store, { bookmarks: updated });
    },
    isBookmarked(id: string): boolean {
      return store.bookmarkIds().has(id);
    },
  })),
);
