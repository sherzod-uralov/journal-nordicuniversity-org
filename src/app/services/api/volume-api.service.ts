import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env';
import { Volume } from '@core/models/volume.model';

@Injectable({ providedIn: 'root' })
export class VolumeApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/volume`;

  getAll(): Observable<Volume[]> {
    return this.http.get<Volume[]>(this.baseUrl);
  }

  getById(id: number): Observable<Volume> {
    return this.http.get<Volume>(`${this.baseUrl}/${id}`);
  }
}
