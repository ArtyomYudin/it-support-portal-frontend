import { Injectable } from '@angular/core';
import mpegts from 'mpegts.js';
import {environment} from "../../../environments/environment";

export interface Camera {
  id: string;
  // другие поля, если нужны
}

@Injectable({
  providedIn: 'root'
})
export class CameraPlayerService {

  initializeCamera(
    camera: Camera,
    videoElement: HTMLVideoElement,
    onConnected?: () => void,
    onError?: (detail: any) => void
  ): mpegts.Player | null {
    if (!mpegts.isSupported()) {
      console.error(`[${camera.id}] mpegts.js не поддерживается браузером`);
      onError?.({ message: 'mpegts not supported' });
      return null;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const url = `${protocol}://${environment.vssHost}/${environment.vssSocketPath}/${camera.id}`;

    const player = mpegts.createPlayer({
      isLive: true,
      url,
      type: 'mpegts'
    });

    videoElement.muted = true;
    videoElement.playsInline = true;

    player.attachMediaElement(videoElement);
    player.load();

    player.on('connected', () => {
      console.log(`[${camera.id}] Connected`);
      onConnected?.();
    });

    player.on('error', (type: any, detail: any) => {
      console.error(`[${camera.id}] Player error:`, detail);
      onError?.(detail);
    });

    player.on('statistics_info', (stat: any) => {
      // опционально
    });

    return player;
  }
}
