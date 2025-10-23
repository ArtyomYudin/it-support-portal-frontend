import { Injectable, OnDestroy } from '@angular/core';
import { interval, Subject, switchMap, takeUntil, tap, EMPTY } from 'rxjs'; // 👈 добавляем EMPTY
import { AuthenticationService } from '@service/auth.service';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable({ providedIn: 'root' })
export class TokenRefreshService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private jwtHelper = new JwtHelperService();

  constructor(private authService: AuthenticationService) {}

  startTokenRefreshTimer(): void {
    this.stopTokenRefreshTimer();

    interval(60_000)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => {
          const token = this.authService.currentUserValue?.token;
          if (!token) {
            // Нет токена — ничего не делаем
            return EMPTY;
          }

          const expirationDate = this.jwtHelper.getTokenExpirationDate(token);
          const now = new Date();
          const isExpired = this.jwtHelper.isTokenExpired(token);

          console.log(`[TokenRefresh] Токен истекает: ${expirationDate?.toISOString() || 'неизвестно'}`);
          console.log(`[TokenRefresh] Сейчас: ${now.toISOString()}, Истёк: ${isExpired}`);

          if (isExpired) {
            console.log('[TokenRefresh] Токен уже истёк. Обновляем немедленно.');
            return this.authService.refreshToken();
          }

          if (expirationDate) {
            const timeUntilExpiry = expirationDate.getTime() - now.getTime();
            const shouldRefresh = timeUntilExpiry < 2 * 60 * 1000; // за 2 минуты до истечения

            if (shouldRefresh) {
              console.log('[TokenRefresh] Токен скоро истечёт. Обновляем заранее.');
              return this.authService.refreshToken();
            }
          }

          // Ничего не делаем
          return EMPTY;
        })
      )
      .subscribe({
        next: (user) => {
          if (user) {
            console.log('[TokenRefresh] Токен успешно обновлён');
          }
        },
        error: (err) => {
          console.error('[TokenRefresh] Ошибка при обновлении токена:', err);
        }
      });
  }

  stopTokenRefreshTimer(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroy$ = new Subject<void>();
  }

  ngOnDestroy(): void {
    this.stopTokenRefreshTimer();
  }
}
