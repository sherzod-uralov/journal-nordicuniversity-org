import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env';
import { SubCategory } from '@core/models/category.model';

@Injectable({ providedIn: 'root' })
export class SubcategoryApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/subcategory`;

  getAll(): Observable<SubCategory[]> {
    return this.http.get<SubCategory[]>(this.baseUrl);
  }

  getById(id: number): Observable<SubCategory> {
    return this.http.get<SubCategory>(`${this.baseUrl}/${id}`);
  }

  getByCategory(categoryId: number): Observable<SubCategory[]> {
    return this.http.get<SubCategory[]>(`${this.baseUrl}/category/${categoryId}`);
  }
}
