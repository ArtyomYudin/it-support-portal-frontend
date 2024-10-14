import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { Subject } from 'rxjs/internal/Subject';
import { distinctUntilChanged, takeUntil, tap } from 'rxjs/operators';
import { ClarityModule } from '@clr/angular';
import { Chart, registerables } from 'chart.js';
import { NgFor, NgIf, AsyncPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DynamicScriptLoaderService } from '@service/dynamic.script.loader.service';
import { WebsocketService } from '@service/websocket.service';
import { Event } from '@service/websocket.service.event';

import { ProviderChartComponent } from './chart/provider/provider.component';
import { AvayaE1ChartComponent } from './chart/avaya-e1/avaya-e1.component';
import { HardwareChartComponent } from './chart/hardware/hardware.component';
import { AvayaE1DailyChartComponent } from './chart/avaya-e1-daily/avaya-e1-daily.component';

declare let streamCam: any;
declare let streamCamRoom1: any;
declare let streamCamRoom2: any;

Chart.register(...registerables);

@Component({
  selector: 'fe-home',
  standalone: true,
  imports: [
    ClarityModule,
    RouterModule,
    NgFor,
    NgIf,
    AsyncPipe,
    ProviderChartComponent,
    AvayaE1ChartComponent,
    HardwareChartComponent,
    AvayaE1DailyChartComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HomeComponent implements OnInit, OnDestroy {
  public dhcpLoading = true;

  public vpnLoading = true;

  public vpnActiveSessionCountArray$: Observable<any>;

  public dhcpInfoArray$: Observable<any>;

  private ngUnsubscribe$: Subject<any> = new Subject();

  private mainCamPlayer: any;

  private room1CamPlayer: any;

  private room2CamPlayer: any;

  constructor(private dynamicScriptLoader: DynamicScriptLoaderService, private wsService: WebsocketService) {
    this.vpnActiveSessionCountArray$ = this.wsService.on<any>(Event.EV_VPN_ACTIVE_SESSION_COUNT).pipe(
      distinctUntilChanged(),
      takeUntil(this.ngUnsubscribe$),
      tap(() => {
        this.vpnLoading = false;
      }),
    );
    this.dhcpInfoArray$ = this.wsService.on<any>(Event.EV_DHCP_INFO).pipe(
      distinctUntilChanged(),
      takeUntil(this.ngUnsubscribe$),
      tap(() => {
        this.dhcpLoading = false;
      }),
    );
  }

  public ngOnInit(): void {
    this.wsService.send('getDashboardEvent', null);
    this.loadScripts();
  }

  public ngOnDestroy(): void {
    this.ngUnsubscribe$.next(null);
    this.ngUnsubscribe$.complete();
    this.mainCamPlayer.destroy();
    this.room1CamPlayer.destroy();
    this.room2CamPlayer.destroy();
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
