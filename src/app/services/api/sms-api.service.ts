import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env';

export interface CheckNumberResponse {
  verifyID: string;
}

export interface VerifyNumberResponse {
  matched: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class SmsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/sms`;

  checkNumber(phone_number: string): Observable<CheckNumberResponse> {
    return this.http.post<CheckNumberResponse>(`${this.baseUrl}/check-number`, { phone_number });
  }

  verifyNumber(id: string, code: number): Observable<VerifyNumberResponse> {
    return this.http.post<VerifyNumberResponse>(`${this.baseUrl}/verify-number`, { id, code });
  }
}
