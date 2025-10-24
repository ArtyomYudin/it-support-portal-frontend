import {Component, OnDestroy, OnInit, AfterViewInit, ViewChildren, QueryList, ElementRef} from '@angular/core';

// import { DynamicScriptLoaderService } from '@service/dynamic.script.loader.service';
import { Camera } from "@model/camera.model";
import { environment } from "../../../../environments/environment";
import {CameraPlayerService} from "@service/camera-player.service";

@Component({
    selector: 'fe-pacs-guest',
    imports: [],
    templateUrl: './guest.component.html',
    styleUrls: ['./guest.component.scss']
})
export class GuestComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChildren('cameraVideo') cameraVideos!: QueryList<ElementRef<HTMLVideoElement>>;

  cameras: Camera[] = environment.cameras;
  private cameraPlayers: Map<string, HTMLVideoElement> = new Map();
  private mpegPlayers: Map<string, any> = new Map();
  private loadingStates: Map<string, boolean> = new Map();
  private errorStates: Map<string, boolean> = new Map();

  constructor(private cameraPlayerService: CameraPlayerService) {}

  public ngOnInit(): void {
    // this.loadScripts();
  }

  ngAfterViewInit(): void {
    this.initAllCameras();
  }

  public ngOnDestroy(): void {
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
    const targetCameras = ['street_entrance', 'black_entrance_street'];
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
