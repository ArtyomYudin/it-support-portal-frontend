import { AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ClrIconModule } from "@clr/angular";
import { environment } from "../../../environments/environment";
import mpegts from 'mpegts.js';

@Component({
  selector: 'fe-vss',
  imports: [ClrIconModule],
  templateUrl: './vss.component.html',
  styleUrls: ['./vss.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VssComponent implements OnInit, AfterViewInit, OnDestroy {

  cameras = Array.from({ length: 1 }, (_, i) => i + 9999); // [9999, 10000, ...]
  cameraPlayers: Map<number, HTMLVideoElement> = new Map();
  mpegPlayers: Map<number, any> = new Map();
  loadingStates: Map<number, boolean> = new Map();
  errorStates: Map<number, boolean> = new Map();

  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initAllCameras();
  }

  ngOnDestroy(): void {
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

  get cameraRows(): number[][] {
    const chunkSize = 6;
    const rows: number[][] = [];
    for (let i = 0; i < this.cameras.length; i += chunkSize) {
      rows.push(this.cameras.slice(i, i + chunkSize));
    }
    return rows;
  }

  private initAllCameras(): void {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = '127.0.0.1' //environment.apiHost || window.location.hostname;

    this.cameras.forEach(port => {
      const videoId = `camera-${port}`;
      const video = document.getElementById(videoId) as HTMLVideoElement;
      if (!video) {
        console.warn(`Video element with ID ${videoId} not found`);
        return;
      }

      console.log(`Initializing camera ${port}, video element:`, video);

      video.muted = true;
      video.playsInline = true;

      if (mpegts.isSupported()) {
        this.loadingStates.set(port, true);
        this.errorStates.set(port, false);

        const player = mpegts.createPlayer({
          isLive: true,
          url: `${protocol}://${host}:${port}/ws`,
          type: 'mpegts',
          // reconnectInterval: 5000, // нет в mpegts.js, убираем
          // liveBufferLatencyChasing: true,
         //  enableStashBuffer: false,
         //  stashInitialSize: 128,
        });

        player.attachMediaElement(video);
        player.load();

        // Заменяем Events.CONNECTED на 'connected'
        player.on('connected', () => {
          console.log(`[${port}] Connected`);
          this.loadingStates.set(port, false);
          this.errorStates.set(port, false);
        });

        player.on('error', (type: any, detail: any) => {
          console.error(`[${port}] Player error:`, detail);
          this.loadingStates.set(port, false);
          this.errorStates.set(port, true);
        });

        player.on('statistics_info', (stat: any) => {
          // можно логировать задержки, fps и т.д.
        });

        this.mpegPlayers.set(port, player);
        this.cameraPlayers.set(port, video);
      } else {
        console.error(`[${port}] mpegts.js не поддерживается браузером`);
        this.errorStates.set(port, true);
      }
    });
  }

  public startCamera(port: number): void {
    const video = this.cameraPlayers.get(port);
    if (video) {
      video.play().catch(err => {
        console.warn(`Камера ${port} не запустилась:`, err);
      });
    }
  }

  isCameraLoading(port: number): boolean {
    return this.loadingStates.get(port) || false;
  }

  isCameraError(port: number): boolean {
    return this.errorStates.get(port) || false;
  }
}
