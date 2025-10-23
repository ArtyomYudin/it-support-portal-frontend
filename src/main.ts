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
import {APP_INITIALIZER, importProvidersFrom, inject, LOCALE_ID} from '@angular/core';
import {HTTP_INTERCEPTORS, HttpClientModule, provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import { PreloadAllModules, RouteReuseStrategy, RouterModule } from '@angular/router';
import { CustomReuseStrategy } from '@core/custom-reuse-strategy';
import { routes } from '@core/app-routing.module';
import { registerLocaleData } from '@angular/common';
import { MarkdownModule } from 'ngx-markdown';
import { JwtInterceptor } from '@service/jwt.interceptor';
import localeRu from '@angular/common/locales/ru';
// import { JwtModule } from '@auth0/angular-jwt';
import { AppComponent } from '@app/app.component';
import { websocketInitializer } from '@service/websocket.service'

// Импортируем Clarity
import { ClarityModule } from '@clr/angular';
import {TokenRefreshService} from "@service/token-refresh.service";

registerLocaleData(localeRu, 'ru');

// export function jwtTokenGetter(): string {
//   return localStorage.getItem('IT-Support-Portal') ? JSON.parse(localStorage.getItem('IT-Support-Portal')).token : null;
//   // return localStorage.getItem('CurrentUser') ? JSON.parse(localStorage.getItem('CurrentUser')).token : null;
// }

// Фабрика инициализации сервиса проверки токена
function startTokenRefresh() {
  const tokenRefreshService = inject(TokenRefreshService);
  return () => tokenRefreshService.startTokenRefreshTimer();
}


bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withInterceptorsFromDi()), // <- здесь подключаем HTTP с DI интерцепторами
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: LOCALE_ID, useValue: 'ru' },
    { provide: RouteReuseStrategy, useClass: CustomReuseStrategy },
    provideAnimations(),
    {
      provide: APP_INITIALIZER,
      useFactory: websocketInitializer,
      multi: true, // ← важно! позволяет регистрировать несколько инициализаторов
    },
    // --- Инициализация автообновления токена ---
    {
      provide: APP_INITIALIZER,
      useFactory: startTokenRefresh,
      multi: true,
    },
    // provideHttpClient(withInterceptorsFromDi()),
    // importProvidersFrom(HttpClientModule),
    // importProvidersFrom(JwtModule),
    // importProvidersFrom(
    //  JwtModule.forRoot({
    //    config: {
    //      tokenGetter: jwtTokenGetter,
    //    },
    //  }),
    // ),
    // provideHighlightOptions({
    //   fullLibraryLoader: () => import('highlight.js')
    // }),
    importProvidersFrom(MarkdownModule.forRoot({})),
    importProvidersFrom(RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })),
    // Подключаем ClarityModule
    // importProvidersFrom(
    //   ClarityModule.forRoot()
    // ),
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
