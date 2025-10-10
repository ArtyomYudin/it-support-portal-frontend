import {ChangeDetectionStrategy, Component, DestroyRef, inject, OnDestroy, OnInit} from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { Subject } from 'rxjs/internal/Subject';
import {distinctUntilChanged, map, share, takeUntil, tap} from 'rxjs/operators';
import { ClarityModule } from '@clr/angular';
import { Chart, registerables } from 'chart.js';
import {AsyncPipe, DatePipe} from '@angular/common';
import { RouterModule } from '@angular/router';
import { DynamicScriptLoaderService } from '@service/dynamic.script.loader.service';
import { WebsocketService } from '@service/websocket.service';
import { Event } from '@service/websocket.service.event';

import { ProviderChartComponent } from './chart/provider/provider.component';
import { AvayaE1ChartComponent } from './chart/avaya-e1/avaya-e1.component';
import { HardwareChartComponent } from './chart/hardware/hardware.component';
import { AvayaE1DailyChartComponent } from './chart/avaya-e1-daily/avaya-e1-daily.component';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {EmployeeNamePipe} from "@pipe/employeename.pipe";
import {environment} from "../../../environments/environment";

declare let streamCam: any;
declare let streamCamRoom1: any;
declare let streamCamRoom2: any;

Chart.register(...registerables);

@Component({
    selector: 'fe-home',
  imports: [
    ClarityModule,
    RouterModule,
    AsyncPipe,
    ProviderChartComponent,
    AvayaE1ChartComponent,
    HardwareChartComponent,
    AvayaE1DailyChartComponent,
    DatePipe,
    EmployeeNamePipe
  ],
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class HomeComponent implements OnInit, OnDestroy {

  public dhcpLoading = true;

  public vpnLoading = true;

  public vpnActiveSessionCountArray$: Observable<any>;

  public vpnSessionsByHost$: Observable<any>;

  public dhcpInfoArray$: Observable<any>;

  private mainCamPlayer: any;

  private room1CamPlayer: any;

  private room2CamPlayer: any;

  private isConnected: boolean;

  private destroyRef = inject(DestroyRef);

  constructor(private dynamicScriptLoader: DynamicScriptLoaderService, private wsService: WebsocketService) {
    this.vpnActiveSessionCountArray$ = this.wsService.on<any>(Event.EV_VPN_ACTIVE_SESSION_COUNT).pipe(
      distinctUntilChanged(),
      tap(() => {
        this.vpnLoading = false;
      }),
      takeUntilDestroyed(this.destroyRef)
    );
    // Создаем новый Observable, который преобразует объект в массив пар [host, sessions]
    this.vpnSessionsByHost$ = this.vpnActiveSessionCountArray$.pipe(
      map(results => {
        if (!results.results || typeof results.results !== 'object') return [];
        return Object.entries(results.results).map(([host, sessions]) => ({
          host,
          sessions
        }));
      })
    );
    // this.vpnSessionsByHost$.subscribe(data => {
    //   console.log('vpnSessionsByHost$ emits:', data);
    //   console.log('Type:', Array.isArray(data) ? '✅ Массив' : '❌ НЕ массив!');
    // });
    this.dhcpInfoArray$ = this.wsService.on<any>(Event.EV_DHCP_INFO).pipe(
      distinctUntilChanged(),
      tap(() => {
        this.dhcpLoading = false;
      }),
      takeUntilDestroyed(this.destroyRef)
    );
  }

  public ngOnInit(): void {
    this.wsService.status.pipe(
      share(),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(isConnected => {
      console.log("Send getDashboardEvent");
      this.wsService.send('getDashboardEvent', null);
    });
    this.loadScripts();
  }

  public ngOnDestroy(): void {
    this.mainCamPlayer.destroy();
    this.room1CamPlayer.destroy();
    this.room2CamPlayer.destroy();
    // this.wsService.disconnect()
  }

  private loadScripts() {
    this.dynamicScriptLoader
      .load('jsmpeg', 'videocanvas')
      .then(() => {
        // Script Loaded Successfully
        this.mainCamPlayer = streamCam();
        this.room1CamPlayer = streamCamRoom1();
        this.room2CamPlayer = streamCamRoom2();
      })
      .catch(error => console.log(error));
  }
}
