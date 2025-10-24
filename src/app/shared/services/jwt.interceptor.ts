import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { AuthenticationService } from '@service/auth.service';
import { environment } from 'src/environments/environment';
import { catchError, switchMap, filter, take, finalize } from 'rxjs/operators';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);
  private jwtHelper = new JwtHelperService();

  constructor(private authenticationService: AuthenticationService) {
    // console.log('JwtInterceptor создан');
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // console.log('JwtInterceptor: запрос к', request.url);

    const currentUser = this.authenticationService.currentUserValue;
    const token = currentUser?.token || null;
    const isLoggedIn = !!token;
    const isApiUrl = request.url.startsWith('/api') || request.url.startsWith(environment.apiUrl);
    const isRefreshUrl = request.url.includes(environment.jwtRefresh);
    const isLoginUrl = request.url.includes(environment.jwtLogin);

    // console.log('Текущий токен:', token);

    if (isLoggedIn && isApiUrl && !isRefreshUrl && !isLoginUrl) {
      if (this.jwtHelper.isTokenExpired(token)) {
        // console.log('Токен истёк. Будет выполнен refresh...');
        return this.handle403Error(request, next);
      } else {
        // console.log('Токен действителен. Отправляем запрос.');
        request = this.addToken(request, token);
      }
    }

    return next.handle(request).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse) {
          if (error.status === 401) {
            console.warn('401: токен недействителен, logout');
            this.authenticationService.logout();
            return throwError(() => error);
          }

          if (error.status === 403 && !isRefreshUrl) {
            console.warn('403: токен истёк, выполняем refresh');
            return this.handle403Error(request, next);
          }
        }

        return throwError(() => error);
      })
    );
  }

  private handle403Error(request: HttpRequest<any>, next: HttpHandler) {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authenticationService.refreshToken().pipe(
        switchMap((user: any) => {
          const newToken = user?.token;
          this.refreshTokenSubject.next(newToken);
          return next.handle(this.addToken(request, newToken));
        }),
        finalize(() => (this.isRefreshing = false))
      );
    } else {
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(jwt => next.handle(this.addToken(request, jwt!)))
      );
    }
  }

  private addToken(request: HttpRequest<any>, token: string) {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
}
