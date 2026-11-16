import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Article } from '@core/models/article.model';
import { safeStorage } from '@core/utils/safe-storage.util';

const STORAGE_KEY = 'journal_bookmarks';

@Injectable({ providedIn: 'root' })
export class BookmarkService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  getBookmarks(): Article[] {
    if (!this.isBrowser) return [];
    const bookmarks = safeStorage.getJson<Article[]>(STORAGE_KEY, []);
    return Array.isArray(bookmarks) ? bookmarks : [];
  }

  addBookmark(article: Article): Article[] {
    const bookmarks = this.getBookmarks();
    if (bookmarks.some(b => b.id === article.id)) return bookmarks;
    const updated = [article, ...bookmarks];
    this.save(updated);
    return updated;
  }

  removeBookmark(id: string): Article[] {
    const updated = this.getBookmarks().filter(b => b.id !== id);
    this.save(updated);
    return updated;
  }

  toggleBookmark(article: Article): Article[] {
    return this.isBookmarked(article.id)
      ? this.removeBookmark(article.id)
      : this.addBookmark(article);
  }

  isBookmarked(id: string): boolean {
    return this.getBookmarks().some(b => b.id === id);
  }

  getCount(): number {
    return this.getBookmarks().length;
  }

  clear(): Article[] {
    this.save([]);
    return [];
  }

  private save(bookmarks: Article[]): void {
    if (!this.isBrowser) return;
    safeStorage.setJson(STORAGE_KEY, bookmarks);
  }
}
