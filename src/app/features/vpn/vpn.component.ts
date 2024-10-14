import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { WebsocketService } from '@service/websocket.service';

import { ActiveSessionComponent } from './active-session/active-session.component';
import { UserActivityComponent } from './user-activity/user-activity.component';

@Component({
  selector: 'fe-vpn',
  standalone: true,
  imports: [ActiveSessionComponent, UserActivityComponent],
  templateUrl: './vpn.component.html',
  styleUrls: ['./vpn.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class VpnComponent implements OnInit {
  constructor(private wsService: WebsocketService) {}

  ngOnInit(): void {
    this.wsService.send('getVpnActiveSession', null);
    this.wsService.send('getEmployee', null);
    this.wsService.send('getVpnCompletedSession', { period: 720, employeeUpn: null });
  }
}
