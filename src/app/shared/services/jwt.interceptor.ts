import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, pipe, throwError, BehaviorSubject } from 'rxjs';
import { AuthenticationService } from '@service/auth.service';
import { environment } from 'src/environments/environment';
import { catchError, switchMap, filter, take } from 'rxjs/operators'

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  constructor(private authenticationService: AuthenticationService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const currentUser = this.authenticationService.currentUserValue;
    const token = currentUser?.token || null;
    const isLoggedIn = !!token;
    const isApiUrl = request.url.startsWith(environment.apiUrl);

    if (
      isLoggedIn &&
      isApiUrl &&
      request.url !== `${environment.apiUrl}/${environment.jwtRefresh}` &&
      request.url !== `${environment.apiUrl}/${environment.jwtLogin}`
    ) {
      request = this.addToken(request, token!);
    }

    return next.handle(request).pipe(
      catchError(error => {
        if (
          error instanceof HttpErrorResponse &&
          (error.status === 401 || error.status === 403) &&
          request.url === `${environment.apiUrl}/${environment.jwtRefresh}`
        ) {
          this.authenticationService.logout();
          return throwError(() => error);
        } else if (error instanceof HttpErrorResponse && error.status === 403) {
          return this.handle403Error(request, next);
        } else {
          return throwError(() => error);
        }
      })
    );
  }

  private handle403Error(request: HttpRequest<any>, next: HttpHandler) {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authenticationService.refreshToken().pipe(
        switchMap((user: any) => {
          this.isRefreshing = false;
          const newToken = user?.token;
          this.refreshTokenSubject.next(newToken);
          return next.handle(this.addToken(request, newToken));
        })
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
