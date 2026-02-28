import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env';
import { AboutAll, Director, Faq, Info, Member } from '@core/models/about.model';

@Injectable({ providedIn: 'root' })
export class AboutApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/about`;

  getAll(): Observable<AboutAll> {
    return this.http.get<AboutAll>(this.baseUrl);
  }

  getDirectors(): Observable<Director[]> {
    return this.http.get<Director[]>(`${this.baseUrl}/director`);
  }

  getFaqs(): Observable<Faq[]> {
    return this.http.get<Faq[]>(`${this.baseUrl}/faq`);
  }

  getInfo(): Observable<Info> {
    return this.http.get<Info>(`${this.baseUrl}/info`);
  }

  getMembers(): Observable<Member[]> {
    return this.http.get<Member[]>(`${this.baseUrl}/member`);
  }
}
