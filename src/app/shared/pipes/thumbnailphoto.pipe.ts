import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'thumbnailPhoto',
  standalone: true,
})
export class ThumbnailPhotoPipe implements PipeTransform {
  constructor(protected sanitizer: DomSanitizer) {}

  public transform(value: string): any {
    if (value) {
      const base64URL = `data:image/png;base64,${value}`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(base64URL);
    }
    return 'assets/images/avatar-male.jpg';
  }
}
