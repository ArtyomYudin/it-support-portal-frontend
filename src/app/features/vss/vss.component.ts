import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ElementRef,
  QueryList, ViewChildren
} from '@angular/core';
import {ClrModal, ClrIconModule, ClrModalModule} from "@clr/angular";
import { environment } from "../../../environments/environment";
import mpegts from 'mpegts.js';
import { Camera } from "@model/camera.model";
import {CameraPlayerService} from "@service/camera-player.service";

@Component({
  selector: 'fe-vss',
  imports: [ClrIconModule, ClrModalModule],
  templateUrl: './vss.component.html',
  styleUrls: ['./vss.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VssComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChildren('cameraVideo') cameraVideos!: QueryList<ElementRef<HTMLVideoElement>>;
  @ViewChild('cameraModal', {static: true}) modal: ClrModal | undefined;
  @ViewChild('modalVideo', { static: false }) modalVideoRef: ElementRef<HTMLVideoElement> | undefined;


  cameras: Camera[] = environment.cameras;
  private cameraPlayers: Map<string, HTMLVideoElement> = new Map();
  private mpegPlayers: Map<string, any> = new Map();
  private loadingStates: Map<string, boolean> = new Map();
  private errorStates: Map<string, boolean> = new Map();

  public cameraModalOpened: boolean = false;
  public cameraId: string;
  public cameraName: string;

  constructor(private cameraPlayerService: CameraPlayerService) {}

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

  get cameraRows(): Camera[][] {
    const chunkSize = 6;
    const rows: Camera[][] = [];
    for (let i = 0; i < this.cameras.length; i += chunkSize) {
      rows.push(this.cameras.slice(i, i + chunkSize));
    }
    return rows;
  }

  private initAllCameras(): void {
    this.cameras.forEach(camera => {
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
    // const host = '127.0.0.1';
    const url = `${protocol}://${environment.vssHost}/${environment.vssSocketPath}/${id}`;

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
