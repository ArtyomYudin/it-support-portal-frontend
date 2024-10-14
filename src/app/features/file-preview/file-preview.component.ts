import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
// eslint-disable-next-line import/extensions
import { FILE_PREVIEW_DATA } from '@service/file-preview/file.preview.token';

@Component({
  selector: 'fe-file-preview',
  standalone: true,
  templateUrl: './file-preview.component.html',
  styleUrls: ['./file-preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilePreviewComponent {
  constructor(@Inject(FILE_PREVIEW_DATA) public data: any) {}

  // ngOnInit(): void {}
}
