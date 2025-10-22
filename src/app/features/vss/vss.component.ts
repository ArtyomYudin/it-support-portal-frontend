import {AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild, ElementRef} from '@angular/core';
import {ClrModal, ClrIconModule, ClrModalModule} from "@clr/angular";
import { environment } from "../../../environments/environment";
import mpegts from 'mpegts.js';
import {Camera} from "@model/camera.model";

@Component({
  selector: 'fe-vss',
  imports: [ClrIconModule, ClrModalModule],
  templateUrl: './vss.component.html',
  styleUrls: ['./vss.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VssComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('cameraModal', {static: true}) modal: ClrModal | undefined;
  @ViewChild('modalVideo', { static: false }) modalVideoRef: ElementRef<HTMLVideoElement> | undefined;


  cameras: Camera[] = environment.cameras;
  cameraPlayers: Map<string, HTMLVideoElement> = new Map();
  mpegPlayers: Map<string, any> = new Map();
  loadingStates: Map<string, boolean> = new Map();
  errorStates: Map<string, boolean> = new Map();

  public cameraModalOpened: boolean = false;
  public cameraId: string;
  public cameraName: string;

  constructor() {
  }

  ngOnInit(): void {
  }

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

  get cameraRows(): Camera[][] {
    const chunkSize = 6;
    const rows: Camera[][] = [];
    for (let i = 0; i < this.cameras.length; i += chunkSize) {
      rows.push(this.cameras.slice(i, i + chunkSize));
    }
    return rows;
  }

  private initAllCameras(): void {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = '127.0.0.1' //environment.apiHost || window.location.hostname;

    this.cameras.forEach(camera => {
      const videoId = `camera-${camera.id}`;
      const video = document.getElementById(videoId) as HTMLVideoElement;
      if (!video) {
        console.warn(`Video element with ID ${videoId} not found`);
        return;
      }

      console.log(`Initializing camera ${camera.id}, video element:`, video);

      video.muted = true;
      video.playsInline = true;

      if (mpegts.isSupported()) {
        this.loadingStates.set(camera.id, true);
        this.errorStates.set(camera.id, false);

        const player = mpegts.createPlayer({
          isLive: true,
          // url: `${protocol}://${host}:8080/ws/${port}`,
          url: `${protocol}://${host}:8080/ws/${camera.id}`,
          // url: `${protocol}://${host}:${port}/ws`,
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
          console.log(`[${camera.id}] Connected`);
          this.loadingStates.set(camera.id, false);
          this.errorStates.set(camera.id, false);
        });

        player.on('error', (type: any, detail: any) => {
          console.error(`[${camera.id}] Player error:`, detail);
          this.loadingStates.set(camera.id, false);
          this.errorStates.set(camera.id, true);
        });

        player.on('statistics_info', (stat: any) => {
          // можно логировать задержки, fps и т.д.
        });

        this.mpegPlayers.set(camera.id, player);
        this.cameraPlayers.set(camera.id, video);
      } else {
        console.error(`[${camera.id}] mpegts.js не поддерживается браузером`);
        this.errorStates.set(camera.id, true);
      }
    });
  }

  public startCamera(id: string): void {
    const video = this.cameraPlayers.get(id);
    if (video) {
      video.play().catch(err => {
        console.warn(`Камера ${id} не запустилась:`, err);
      });
    }
  }

  isCameraLoading(id: string): boolean {
    return this.loadingStates.get(id) || false;
  }

  isCameraError(id: string): boolean {
    return this.errorStates.get(id) || false;
  }

  public openCamera(id: string, name: string): void {
    this.cameraId = id;
    this.cameraName = name;

    if (!this.modalVideoRef) return;
    const modalVideo = this.modalVideoRef.nativeElement;
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = '127.0.0.1';
    const url = `${protocol}://${host}:8080/ws/${id}`;

    // уничтожаем старый, если был
    const oldPlayer = this.mpegPlayers.get(`modal-${id}`);
    oldPlayer?.destroy();

    const modalPlayer = mpegts.createPlayer({
      isLive: true,
      url,
      type: 'mpegts'
    });
    modalPlayer.attachMediaElement(modalVideo);
    modalPlayer.load();
    modalVideo.play().catch(() => {});

    this.mpegPlayers.set(`modal-${id}`, modalPlayer);
    this.modal?.open();
  }

  onModalClose(opened: boolean): void {
    if (!opened) {
      const modalPlayer = this.mpegPlayers.get(`modal-${this.cameraId}`);
      modalPlayer?.destroy();
      this.mpegPlayers.delete(`modal-${this.cameraId}`);
    }
  }
}
