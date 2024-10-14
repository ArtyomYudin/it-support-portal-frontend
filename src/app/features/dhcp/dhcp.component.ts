import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { WebsocketService } from '@service/websocket.service';
import { ClarityModule, ClrCommonStringsService } from '@clr/angular';
import { Observable } from 'rxjs/internal/Observable';
import { AsyncPipe } from '@angular/common';
import { distinctUntilChanged, takeUntil, tap } from 'rxjs/operators';
import { Subject } from 'rxjs/internal/Subject';
import { russionLocale } from '@translation/russion';
import { IDHCPLease } from '@model/dhcp-lease.model';
import { Event } from '@service/websocket.service.event';

@Component({
  selector: 'fe-dhcp',
  standalone: true,
  templateUrl: './dhcp.component.html',
  styleUrls: ['./dhcp.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ClarityModule, AsyncPipe],
})
export default class DhcpComponent implements OnInit, OnDestroy {
  public loading = true;

  public dhcpLeaseArray$: Observable<IDHCPLease>;

  private ngUnsubscribe$: Subject<any> = new Subject();

  constructor(private wsService: WebsocketService, private commonStrings: ClrCommonStringsService) {
    commonStrings.localize(russionLocale);
    this.dhcpLeaseArray$ = this.wsService.on<IDHCPLease>(Event.EV_DHCP_LEASE).pipe(
      distinctUntilChanged(),
      takeUntil(this.ngUnsubscribe$),
      tap(() => {
        this.loading = false;
      }),
    );
  }

  ngOnInit(): void {
    this.wsService.send('getDHCPLease');
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe$.next(null);
    this.ngUnsubscribe$.complete();
  }

  public dhcpLeaseRefresh() {
    this.loading = true;
    this.wsService.send('getDHCPLease');
  }
}
