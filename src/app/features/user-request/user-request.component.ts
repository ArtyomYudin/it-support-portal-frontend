import { ChangeDetectionStrategy, Component } from '@angular/core';

import { RequestListComponent } from '@feature/user-request/request-list/request-list.component';

@Component({
  selector: 'fe-user-request',
  standalone: true,
  imports: [RequestListComponent],
  templateUrl: './user-request.component.html',
  styleUrls: ['./user-request.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class UserRequestComponent {
  // constructor() {}
  // ngOnInit(): void {}
}
