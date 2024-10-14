import './polyfills';
/*
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}
platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .then(ref => {
    const win = window as any;
    // Ensure Angular destroys itself on hot reloads.
    if (win.ngRef) {
      win.ngRef.destroy();
    }
    win.ngRef = ref;

    // Otherwise, log the boot error
  })
  .catch(err => console.error(err));
*/

import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { importProvidersFrom, LOCALE_ID } from '@angular/core';
import { HttpClientModule,  HTTP_INTERCEPTORS } from '@angular/common/http';
import { PreloadAllModules, RouteReuseStrategy, RouterModule } from '@angular/router';
import { CustomReuseStrategy } from '@core/custom-reuse-strategy';
import { routes } from '@core/app-routing.module';
import { registerLocaleData } from '@angular/common';
import { JwtInterceptor } from '@service/jwt.interceptor';
import localeRu from '@angular/common/locales/ru';
//import { JwtModule } from '@auth0/angular-jwt';
import { AppComponent } from './app/app.component';

registerLocaleData(localeRu, 'ru');

export function jwtTokenGetter(): string {
  //return localStorage.getItem('IT-Support-Portal') ? JSON.parse(localStorage.getItem('IT-Support-Portal')).token : null;
  return localStorage.getItem('CurrentUser') ? JSON.parse(localStorage.getItem('CurrentUser')).token : null;
}

bootstrapApplication(AppComponent, {
  providers: [
    { provide: LOCALE_ID, useValue: 'ru' },
    { provide: RouteReuseStrategy, useClass: CustomReuseStrategy },
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    provideAnimations(),
    importProvidersFrom(HttpClientModule),
    //importProvidersFrom(JwtModule),
    //importProvidersFrom(
    //  JwtModule.forRoot({
    //    config: {
    //      tokenGetter: jwtTokenGetter,
    //    },
     // }),
    //),
    importProvidersFrom(RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })),
  ],
})
  .then(ref => {
    const win = window as any;
    // Ensure Angular destroys itself on hot reloads.
    if (win.ngRef) {
      win.ngRef.destroy();
    }
    win.ngRef = ref;

    // Otherwise, log the boot error
  })
  .catch(err => console.error(err));
