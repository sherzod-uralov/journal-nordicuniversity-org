import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env';
import { Volume } from '@core/models/volume.model';
import { SlimTransferService } from './slim-transfer.service';

/** The API nests every article of the volume (≈70KB each) — no volume view renders them. */
type VolumeResponse = Volume & { Articles?: unknown[] };

function toVolumeSummary(volume: VolumeResponse): Volume {
  if (!volume) return volume;
  const { Articles, ...summary } = volume;
  return {
    ...summary,
    articleCount: summary.articleCount ?? (Array.isArray(Articles) ? Articles.length : 0),
  };
}

@Injectable({ providedIn: 'root' })
export class VolumeApiService {
  private readonly http = inject(HttpClient);
  private readonly slimTransfer = inject(SlimTransferService);
  private readonly baseUrl = `${environment.apiUrl}/volume`;

  getAll(): Observable<Volume[]> {
    return this.slimTransfer.get(
      'volumes',
      () => this.http.get<VolumeResponse[]>(this.baseUrl, { transferCache: false }),
      (volumes) => Array.isArray(volumes) ? volumes.map(toVolumeSummary) : volumes,
    );
  }

  getById(id: number): Observable<Volume> {
    return this.slimTransfer.get<Volume>(
      `volume:${id}`,
      () => this.http.get<VolumeResponse>(`${this.baseUrl}/${encodeURIComponent(id)}`, { transferCache: false }),
      toVolumeSummary,
    );
  }
}
