import { ChangeDetectionStrategy, Component } from '@angular/core';

import { AvayaCDRComponent } from './avaya-cdr/avaya-cdr.component';

@Component({
  selector: 'fe-avaya',
  standalone: true,
  imports: [AvayaCDRComponent],
  templateUrl: './avaya.component.html',
  styleUrls: ['./avaya.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AvayaComponent {
  // constructor() {}
  // ngOnInit(): void {}
}
