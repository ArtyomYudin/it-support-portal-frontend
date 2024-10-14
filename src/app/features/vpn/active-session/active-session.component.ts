import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs/internal/Subject';
import { WebsocketService } from '@service/websocket.service';
import { distinctUntilChanged, takeUntil, tap } from 'rxjs/operators';
import { Observable } from 'rxjs/internal/Observable';
import { ClarityModule } from '@clr/angular';
import { DatePipe, AsyncPipe } from '@angular/common';
import { IVpnActiveSession } from '@model/vpn-active-session.model';
import { Event } from '@service/websocket.service.event';

@Component({
  selector: 'fe-vpn-active-session',
  standalone: true,
  imports: [ClarityModule, DatePipe, AsyncPipe],
  templateUrl: './active-session.component.html',
  styleUrls: ['./active-session.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActiveSessionComponent implements OnInit, OnDestroy {
  public loading = true;

  public eventVpnActiveSessionArray$: Observable<IVpnActiveSession>;

  private ngUnsubscribe$: Subject<any> = new Subject();

  private reloadVpnActiveSession: number;

  constructor(private wsService: WebsocketService) {
    this.eventVpnActiveSessionArray$ = this.wsService.on<IVpnActiveSession>(Event.EV_VPN_ACTIVE_SESSION).pipe(
      distinctUntilChanged(),
      takeUntil(this.ngUnsubscribe$),
      tap(() => {
        this.loading = false;
      }),
    );
  }

  ngOnInit(): void {
    this.reloadVpnActiveSession = window.setInterval(() => {
      this.loading = true;
      this.wsService.send('getVpnActiveSession', null);
    }, 60000);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe$.next(null);
    this.ngUnsubscribe$.complete();
    clearInterval(this.reloadVpnActiveSession);
  }
}
