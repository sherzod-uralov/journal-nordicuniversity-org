import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '@env';
import { Article } from '@core/models/article.model';
import { Volume } from '@core/models/volume.model';
import { ArticleApiService, toArticleSummary } from './article-api.service';
import { VolumeApiService } from './volume-api.service';

const fullArticle = {
  id: 'a1',
  slug: 'my-article',
  title: 'Title',
  keywords: 'k1, k2',
  references: 'very long references',
  description: '<p>very long body</p>',
  certificates: [{ id: 'c1' }],
  transaction: { id: 't1', payment_url: 'https://pay' },
  plagiarist_file: { id: 'f1' },
  review_file: { id: 'f2' },
  file: { id: 'f3' },
  volume: { id: 7, title: 'Vol 7', description: 'long', Articles: [{}, {}] },
  author: { id: 'u1', full_name: 'Alice', phone_number: '+998901234567', birthday: '1990-01-01' },
} as unknown as Article;

describe('API slimming', () => {
  describe('toArticleSummary', () => {
    it('strips heavy / private fields and keeps card fields', () => {
      const summary = toArticleSummary(fullArticle) as unknown as Record<string, unknown>;
      for (const key of ['references', 'description', 'certificates', 'transaction', 'plagiarist_file', 'review_file', 'file']) {
        expect(summary).not.toHaveProperty(key);
      }
      expect(summary['id']).toBe('a1');
      expect(summary['slug']).toBe('my-article');
      expect(summary['title']).toBe('Title');
      expect(summary['volume']).toEqual({ id: 7, title: 'Vol 7' });
    });

    it('does not expose author personal data', () => {
      const author = toArticleSummary(fullArticle).author as unknown as Record<string, unknown>;
      expect(author['full_name']).toBe('Alice');
      expect(author).not.toHaveProperty('phone_number');
      expect(author).not.toHaveProperty('birthday');
    });

    it('does not mutate the input and tolerates null / missing volume', () => {
      const copy = structuredClone(fullArticle);
      toArticleSummary(fullArticle);
      expect(fullArticle).toEqual(copy);
      expect(toArticleSummary(null as unknown as Article)).toBeNull();
      expect(toArticleSummary({ id: 'x', volume: null } as unknown as Article).volume).toBeNull();
    });
  });

  describe('HTTP', () => {
    let http: HttpTestingController;

    beforeEach(() => {
      TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
      http = TestBed.inject(HttpTestingController);
    });
    afterEach(() => http.verify());

    it('ArticleApiService.getBySlug URL-encodes the slug', () => {
      TestBed.inject(ArticleApiService).getBySlug('a/b?c#d e').subscribe();
      const req = http.expectOne(`${environment.apiUrl}/article/user/slug/a%2Fb%3Fc%23d%20e`);
      expect(req.request.method).toBe('GET');
      req.flush(fullArticle);
    });

    it('ArticleApiService.getByVolume returns summaries', () => {
      let result: Article[] = [];
      TestBed.inject(ArticleApiService).getByVolume(7).subscribe((r) => (result = r));
      http.expectOne(`${environment.apiUrl}/article/user/volume/7`).flush([fullArticle]);
      expect(result.length).toBe(1);
      expect(result[0]).not.toHaveProperty('references');
      expect(result[0]).not.toHaveProperty('description');
    });

    it('VolumeApiService.getById drops the nested Articles and derives articleCount', () => {
      let result: Volume | undefined;
      TestBed.inject(VolumeApiService).getById(7).subscribe((v) => (result = v));
      http.expectOne(`${environment.apiUrl}/volume/7`).flush({ id: 7, title: 'Vol 7', Articles: [{}, {}, {}] });
      expect(result).not.toHaveProperty('Articles');
      expect(result?.articleCount).toBe(3);
    });

    it('VolumeApiService.getAll slims every volume and keeps an explicit articleCount', () => {
      let result: Volume[] = [];
      TestBed.inject(VolumeApiService).getAll().subscribe((v) => (result = v));
      http.expectOne(`${environment.apiUrl}/volume`).flush([
        { id: 1, Articles: [{}, {}] },
        { id: 2, articleCount: 5, Articles: [{}] },
        { id: 3 },
      ]);
      expect(result.map((v) => v.articleCount)).toEqual([2, 5, 0]);
      expect(result.every((v) => !('Articles' in v))).toBe(true);
    });
  });
});
