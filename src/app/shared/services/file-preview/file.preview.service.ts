import { EventEmitter, Injectable, Injector } from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { FilePreviewComponent } from '@feature/file-preview/file-preview.component';
import { FILE_PREVIEW_DATA } from '@service/file-preview/file.preview.token';

@Injectable({
  providedIn: 'root',
})
export class FilePreviewService {
  constructor(private overlay: Overlay) {}

  overlayStatus: EventEmitter<boolean> = new EventEmitter();

  overlayConfig = {
    hasBackdrop: true,
    backdropClass: 'dark-backdrop',
    // panelClass: ',
    scrollStrategy: this.overlay.scrollStrategies.block(),
    positionStrategy: this.overlay.position().global().centerHorizontally().centerVertically(),
  };

  open(files: string) {
    const injector = Injector.create({
      providers: [{ provide: FILE_PREVIEW_DATA, useValue: files }],
    });

    const overlayRef = this.overlay.create(this.overlayConfig);

    const filePreviewPortal = new ComponentPortal(FilePreviewComponent, null, injector);

    // Attach ComponentPortal to PortalHost
    this.overlayStatus.emit(true);
    overlayRef.attach(filePreviewPortal);
    overlayRef.backdropClick().subscribe(() => overlayRef.dispose());
    overlayRef.keydownEvents().subscribe(e => {
      if (e.key === 'Escape') {
        overlayRef.dispose();
        this.overlayStatus.emit(false);
      }
    });
  }
}
