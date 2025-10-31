import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef, ElementRef,
  inject,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
  AfterViewInit
} from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import {distinctUntilChanged, map, share, startWith, tap} from 'rxjs/operators';
import { ClarityModule } from '@clr/angular';
import { Chart, registerables } from 'chart.js';
import {AsyncPipe, DatePipe} from '@angular/common';
import { RouterModule } from '@angular/router';
import { WebsocketService } from '@service/websocket.service';
import { Event } from '@service/websocket.service.event';
import { ProviderChartComponent } from '@feature/home/chart/provider/provider.component';
import { AvayaE1ChartComponent } from '@feature/home/chart/avaya-e1/avaya-e1.component';
import { HardwareChartComponent } from '@feature/home/chart/hardware/hardware.component';
import { DhcpChartComponent} from "@feature/home/chart/dhcp/dhcp.component";
// import { AvayaE1DailyChartComponent } from './chart/avaya-e1-daily/avaya-e1-daily.component';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
// import {EmployeeNamePipe} from "@pipe/employeename.pipe";
import {environment} from "../../../environments/environment";
import {Camera} from "@model/camera.model";
import {CameraPlayerService} from "@service/camera-player.service";

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
    DhcpChartComponent,
    // AvayaE1DailyChartComponent,
    DatePipe,
    // EmployeeNamePipe
  ],
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {

  public dhcpLoading = true;

  public vpnLoading = true;

  public vpnActiveSessionCountArray$: Observable<any>;

  public vpnSessionsByHost$: Observable<any>;

  public dhcpInfoArray$: Observable<any>;

  private isConnected: boolean;

  private destroyRef = inject(DestroyRef);

  @ViewChildren('cameraVideo') cameraVideos!: QueryList<ElementRef<HTMLVideoElement>>;

  cameras: Camera[] = environment.cameras;
  private cameraPlayers: Map<string, HTMLVideoElement> = new Map();
  private mpegPlayers: Map<string, any> = new Map();
  private loadingStates: Map<string, boolean> = new Map();
  private errorStates: Map<string, boolean> = new Map();

  constructor(
    private wsService: WebsocketService,
    private cameraPlayerService: CameraPlayerService
  ) {
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
    this.dhcpInfoArray$ = this.wsService.on<any>(Event.EV_DHCP_SCOPE).pipe(
      map(res => res?.results || []),
      distinctUntilChanged(),
      tap((res) => {
        console.log(res)
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
    // this.loadScripts();
  }

  ngAfterViewInit(): void {
    this.initAllCameras();
  }

  public ngOnDestroy(): void {
    // this.wsService.disconnect()
    this.cameraPlayers.forEach((video, port) => {
      video.pause();
      video.src = '';
    });
    this.mpegPlayers.forEach(player => player?.destroy());
    this.cameraPlayers.clear();
    this.mpegPlayers.clear();
    this.loadingStates.clear();
    this.errorStates.clear();
  }

  private initAllCameras(): void {
    const targetCameras = ['street_entrance', 'server_room'];
    const filteredCameras = this.cameras.filter(cam => targetCameras.includes(cam.id));

    filteredCameras.forEach((camera: { id: string; }) => {
      const videoRef = this.cameraVideos.find(
        ref => ref.nativeElement.dataset.id === String(camera.id)
      );

      if (!videoRef) {
        console.warn(`Video element for camera ${camera.id} not found`);
        return;
      }

      const video = videoRef.nativeElement;

      const player = this.cameraPlayerService.initializeCamera(
        camera,
        video,
        () => {
          this.loadingStates.set(camera.id, false);
          this.errorStates.set(camera.id, false);
        },
        (detail) => {
          this.loadingStates.set(camera.id, false);
          this.errorStates.set(camera.id, true);
        }
      );

      if (player) {
        this.mpegPlayers.set(camera.id, player);
        this.cameraPlayers.set(camera.id, video);
      }
    });
  }
}
