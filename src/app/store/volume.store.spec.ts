import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject } from 'rxjs';
import { Volume } from '@core/models/volume.model';
import { VolumeApiService } from '@services/api/volume-api.service';
import { VolumeStore } from './volume.store';

const volume = (id: number) => ({ id, title: `Vol ${id}` }) as Volume;

describe('VolumeStore.loadById', () => {
  let requests: Record<number, Subject<Volume>>;
  let store: InstanceType<typeof VolumeStore>;

  beforeEach(() => {
    requests = {};
    const getById = vi.fn((id: number) => (requests[id] = new Subject<Volume>()));
    TestBed.configureTestingModule({
      providers: [{ provide: VolumeApiService, useValue: { getById } }],
    });
    store = TestBed.inject(VolumeStore);
  });

  it('clears the previous volume and sets loading when another id is requested', () => {
    store.loadById(1);
    expect(store.loading()).toBe(true);
    requests[1].next(volume(1));
    expect(store.selectedVolume()?.id).toBe(1);
    expect(store.loading()).toBe(false);

    store.loadById(2);
    expect(store.selectedVolume()).toBeNull();
    expect(store.loading()).toBe(true);
    requests[2].next(volume(2));
    expect(store.selectedVolume()?.id).toBe(2);
  });

  it('keeps the current volume visible while refreshing the same id', () => {
    store.loadById(1);
    requests[1].next(volume(1));
    store.loadById(1);
    expect(store.selectedVolume()?.id).toBe(1);
  });

  it('on error: selected null, error set, notFound for 404', () => {
    store.loadById(1);
    requests[1].next(volume(1));

    store.loadById(99);
    requests[99].error(new HttpErrorResponse({ status: 404, statusText: 'Not Found', url: '/x' }));
    expect(store.selectedVolume()).toBeNull();
    expect(store.error()).toBeTruthy();
    expect(store.notFound()).toBe(true);
    expect(store.loading()).toBe(false);
  });

  it('on a non-404 error notFound stays false; an empty body counts as not found', () => {
    store.loadById(1);
    requests[1].error(new HttpErrorResponse({ status: 503 }));
    expect(store.selectedVolume()).toBeNull();
    expect(store.error()).toBeTruthy();
    expect(store.notFound()).toBe(false);

    store.loadById(2);
    requests[2].next(null as unknown as Volume);
    expect(store.notFound()).toBe(true);
    expect(store.error()).toBeNull();
  });
});
