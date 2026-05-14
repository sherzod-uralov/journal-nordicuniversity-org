import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { environment } from '@env';

const apiUrl = environment.apiUrl;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (!token || !req.url.startsWith(apiUrl)) {
    return next(req);
  }

  const authReq = req.clone({
    headers: req.headers.set('Authorization', token),
  });
  return next(authReq);
};
