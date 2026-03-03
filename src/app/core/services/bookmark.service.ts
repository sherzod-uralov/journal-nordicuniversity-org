import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Article } from '@core/models/article.model';

const STORAGE_KEY = 'journal_bookmarks';

@Injectable({ providedIn: 'root' })
export class BookmarkService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  getBookmarks(): Article[] {
    if (!this.isBrowser) return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
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
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
    } catch { /* quota exceeded */ }
  }
}
