import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { JwtHelperService } from '@auth0/angular-jwt';
import { jwtDecode } from 'jwt-decode';
import { AuthUser } from '@model/auth-user.model';
import { environment } from 'src/environments/environment';
import { WebsocketService } from '@service/websocket.service';
import {SessionService} from "@service/session.service";

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  public currentUser$: Observable<AuthUser>;
  private currentUserSubject$: BehaviorSubject<AuthUser | null>;

  constructor(private http: HttpClient, private wsService: WebsocketService, private sessionService: SessionService ) {
    const savedUser = localStorage.getItem('IT-Support-Portal');
    this.currentUserSubject$ = new BehaviorSubject<AuthUser | null>(
      savedUser ? JSON.parse(savedUser) : null
    );
    this.currentUser$ = this.currentUserSubject$.asObservable();
  }

  public get currentUserValue(): AuthUser | null {
    return this.currentUserSubject$.value;
  }

  public login(userPrincipalName: string, password: string): any {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
    };

    return this.http
      .post<any>(
        `${environment.apiUrl}/${environment.jwtLogin}`,
        { username: userPrincipalName, password: password },
        httpOptions
      )
      .pipe(
        map(async response => {
          if (response.access) {
            const currentUser: AuthUser = jwtDecode(response.access);
            currentUser.token = response.access;
            currentUser.refreshToken = response.refresh;

            localStorage.setItem('IT-Support-Portal', JSON.stringify(currentUser));
            this.currentUserSubject$.next(currentUser);
            // вызываем merge истоии чата после логина
            try {
              await this.sessionService.mergeAfterLogin(currentUser.token);
              console.log('История чата перенесена в персональную сессию');
            } catch (e) {
              console.warn('Ошибка при merge истории чата', e);
            }
             // Инициализируем WebSocket после логина
            this.wsService.init(response.access);
            return currentUser;
          }
          return null;
        })
      );
  }

  refreshToken() {
    const refreshToken = this.currentUserValue?.refreshToken;
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http
      .post<any>(`${environment.apiUrl}/${environment.jwtRefresh}`, { refresh: refreshToken })
      .pipe(
        map(response => {
          if (response.access) {
            const currentUser: AuthUser = jwtDecode(response.access);
            currentUser.token = response.access;
            currentUser.refreshToken = response.refresh;

            localStorage.setItem('IT-Support-Portal', JSON.stringify(currentUser));
            this.currentUserSubject$.next(currentUser);
            return currentUser;
          }
          return null;
        })
      );
  }

  public logout(): void {
    localStorage.removeItem('IT-Support-Portal');
    this.currentUserSubject$.next(null);
  }
}
