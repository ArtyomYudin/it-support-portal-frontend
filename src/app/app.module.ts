/*
import { NgModule, CUSTOM_ELEMENTS_SCHEMA, LOCALE_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { JwtModule } from '@auth0/angular-jwt';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { registerLocaleData } from '@angular/common';
import localeRu from '@angular/common/locales/ru';
import { AppRoutingModule } from '@core/app-routing.module';
import { UiModule } from '@core/ui/ui.module';
import { AppComponent } from '@app/app.component';
import { RouteReuseStrategy } from '@angular/router';
import { CustomReuseStrategy } from '@core/custom-reuse-strategy';

registerLocaleData(localeRu, 'ru');

export function jwtTokenGetter(): string {
  return localStorage.getItem('IT-Support-Portal') ? JSON.parse(localStorage.getItem('IT-Support-Portal')).token : null;
  // if (localStorage.getItem('ngMonitoring')) {
  //  return JSON.parse(localStorage.getItem('ngMonitoring')).token;
  // }
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    JwtModule,
    JwtModule.forRoot({
      config: {
        tokenGetter: jwtTokenGetter,
        // whitelistedDomains: ['localhost:3001', 'localhost:4200'],
        //  blacklistedRoutes: ['http://localhost:3000/api/auth'],
      },
    }),
    AppRoutingModule,
    UiModule,
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'ru' },
    { provide: RouteReuseStrategy, useClass: CustomReuseStrategy },
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
*/
