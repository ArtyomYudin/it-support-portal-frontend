import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { JwtHelperService } from '@auth0/angular-jwt';
import { jwtDecode } from 'jwt-decode';
import { AuthUser } from '@model/auth-user.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  public currentUser$: Observable<AuthUser>;

  private currentUserSubject$: BehaviorSubject<AuthUser>;

  //constructor(private http: HttpClient, private jwtHelper: JwtHelperService)
  constructor(private http: HttpClient, private jwtHelper: JwtHelperService) {
    this.currentUserSubject$ = new BehaviorSubject<AuthUser>(JSON.parse(localStorage.getItem('IT-Support-Portal')));
    // this.currentUserSubject$ = new BehaviorSubject<AuthUser>(JSON.parse(localStorage.getItem('currentUser')));
    this.currentUser$ = this.currentUserSubject$.asObservable();
  }

  // public get currentUserValue(): AuthUser {
  //   return this.currentUserSubject.value;
  // }

  public get currentUserValue(): AuthUser {
        return this.currentUserSubject$.value;
  }


  public login(userPrincipalName: string, password: string): any {
    const httpOptions = {
      headers: new HttpHeaders({
        //'Content-Type': 'text/plain',
        'Content-Type': 'application/json',
      }),
    };

    return this.http
      .post<any>(`${environment.apiUrl}/${environment.jwtLogin}`, { 'username':userPrincipalName, 'password':password }, httpOptions)
      /*
      .pipe(
        map(authUser => {
          if (authUser && authUser.token) {
            // store user details and jwt token in local storage to keep user logged in between page refreshes
            localStorage.setItem('IT-Support-Portal', JSON.stringify(authUser));
            this.currentUserSubject$.next(authUser);
          }
          return authUser;
        }),
        catchError(err => {
          console.log('Handling error locally and rethrowing it...', err);
          return throwError(err);
        }),
      );
      */
      .pipe(
          map(response => {
              // login successful if there's a jwt token in the response
              let currentUser: AuthUser;
              if (response.access) {
                  // store user details and jwt token in local storage to keep user logged in between page refreshes
                  //currentUser = jwtDecode(response.access)
                  currentUser = jwtDecode(response.access)
                  currentUser.token = response.access
                  currentUser.refreshToken = response.refresh
                  localStorage.setItem('IT-Support-Portal', JSON.stringify(currentUser));
                  this.currentUserSubject$.next(currentUser);
              }
              console.log(currentUser)
              return currentUser;
          }),
      )
  }

  refreshToken() {
        console.log('this.currentUserValue.refreshToken')
        console.log(this.currentUserValue.refreshToken)
        const refreshToken = this.currentUserValue.refreshToken
        return this.http.post<any>(`${environment.apiUrl}/${environment.jwtLogin}`, { 'refresh': refreshToken })
            .pipe(
                map(response => {
                    // login successful if there's a jwt token in the response
                    console.log('refresh')
                    console.log(response)
                    let currentUser: AuthUser;
                    if (response.access) {
                        // store user details and jwt token in local storage to keep user logged in between page refreshes
                        //currentUser = jwtDecode(response.access)
                        currentUser = jwtDecode(response.access)
                        currentUser.token = response.access
                        currentUser.refreshToken = response.refresh
                        localStorage.setItem('IT-Support-Portal', JSON.stringify(currentUser));
                        this.currentUserSubject$.next(currentUser);
                    }
                    return currentUser;
                }),
            )
            // .subscribe( data => console.log('data'), error => console.warn(error))
  }

  public logout(): void {
    // remove user from local storage to log user out
    //localStorage.removeItem('IT-Support-Portal');
    localStorage.removeItem('currentUser');
    this.currentUserSubject$.next(null);
  }


  public isAuthenticated(): boolean {
    if (localStorage.getItem('IT-Support-Portal')) {
      const { token } = JSON.parse(localStorage.getItem('IT-Support-Portal'));
      // console.log(this.jwtHelper);
      return !this.jwtHelper.isTokenExpired(token);
    }
    return false;
  }
}
