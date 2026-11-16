import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { Article } from '@core/models/article.model';
import { Author } from '@core/models/author.model';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';
import { AuthorApiService } from '@services/api/author-api.service';
import { AuthStore } from './auth.store';
import { CabinetStore } from './cabinet.store';

const articles = [
  { id: '1', status: 'ACCEPT' },
  { id: '2', status: 'REVIEW' },
] as unknown as Article[];
const profile = { id: 'author-1', full_name: 'Alice' } as unknown as Author;

describe('AuthStore / CabinetStore private data', () => {
  let myArticles: Record<string, Subject<Article[]>>;
  let authService: { logout: ReturnType<typeof vi.fn>; setToken: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };
  let cabinet: InstanceType<typeof CabinetStore>;

  beforeEach(() => {
    myArticles = {};
    authService = { logout: vi.fn(), setToken: vi.fn() };
    router = { navigate: vi.fn(() => Promise.resolve(true)) };
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthorApiService,
          useValue: {
            getMyArticles: vi.fn((id: string) => (myArticles[id] = new Subject<Article[]>())),
            getProfile: vi.fn(() => of(profile)),
            login: vi.fn(() => of({ login_data: { token: 'jwt', ExistAuthor: profile } })),
          },
        },
        { provide: AuthService, useValue: authService },
        { provide: ToastService, useValue: { error: vi.fn(), success: vi.fn() } },
        { provide: Router, useValue: router },
      ],
    });
    cabinet = TestBed.inject(CabinetStore);
  });

  function loadCabinet(authorId = 'author-1'): void {
    cabinet.loadMyArticles(authorId);
    myArticles[authorId].next(articles);
  }

  it('CabinetStore.reset() clears the articles, author id, loading and error', () => {
    loadCabinet();
    expect(cabinet.myArticles().length).toBe(2);
    expect(cabinet.acceptedArticles()).toBe(1);

    cabinet.reset();
    expect(cabinet.myArticles()).toEqual([]);
    expect(cabinet.authorId()).toBeNull();
    expect(cabinet.loading()).toBe(false);
    expect(cabinet.error()).toBeNull();
    expect(cabinet.totalArticles()).toBe(0);
  });

  it('CabinetStore drops the previous user’s list when another author is loaded', () => {
    loadCabinet('author-1');
    cabinet.loadMyArticles('author-2');
    expect(cabinet.myArticles()).toEqual([]);
    expect(cabinet.loading()).toBe(true);
    expect(cabinet.authorId()).toBe('author-2');
  });

  it('AuthStore.logout() clears token, profile and cabinet data and navigates once', () => {
    const auth = TestBed.inject(AuthStore);
    auth.loadProfile();
    expect(auth.profile()).toEqual(profile);
    loadCabinet();

    auth.logout('/auth/login');

    expect(authService.logout).toHaveBeenCalledTimes(1);
    expect(auth.profile()).toBeNull();
    expect(auth.loading()).toBe(false);
    expect(cabinet.myArticles()).toEqual([]);
    expect(cabinet.authorId()).toBeNull();
    expect(router.navigate).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('AuthStore.logout() redirects to "/" by default', () => {
    TestBed.inject(AuthStore).logout();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('login clears a previous user’s cabinet data', () => {
    loadCabinet('previous-user');
    TestBed.inject(AuthStore).login({ phone_number: '+998901234567', password: 'secret1' });
    expect(cabinet.myArticles()).toEqual([]);
    expect(cabinet.authorId()).toBeNull();
    expect(authService.setToken).toHaveBeenCalledWith('jwt');
  });
});
