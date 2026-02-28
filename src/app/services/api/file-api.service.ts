import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env';
import { FileUpload } from '@core/models/file-upload.model';

@Injectable({ providedIn: 'root' })
export class FileApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/file`;

  upload(file: File): Observable<FileUpload> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ link: FileUpload }>(`${this.baseUrl}/uploadFile`, formData).pipe(
      map(res => res.link)
    );
  }

  getFileUrl(filePath: string): string {
    return `${environment.apiUrl}/${filePath}`;
  }
}
