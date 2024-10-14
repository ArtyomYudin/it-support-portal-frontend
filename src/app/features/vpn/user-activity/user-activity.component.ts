import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { WebsocketService } from '@service/websocket.service';
import { Subject } from 'rxjs/internal/Subject';
import { Observable } from 'rxjs/internal/Observable';
import { distinctUntilChanged, takeUntil, tap } from 'rxjs/operators';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ClarityModule, ClrCommonStringsService } from '@clr/angular';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { russionLocale } from '@translation/russion';
import { IEmployee } from '@model/employee.model';
import { IVpnSession } from '@model/vpn-session.model';
import { Event } from '@service/websocket.service.event';
import { EmployeeNamePipe } from '@pipe/employeename.pipe';
import { ByteConvertPipe } from '@pipe/byteconvert.pipe';
import { ThumbnailPhotoPipe } from '@pipe/thumbnailphoto.pipe';

@Component({
  selector: 'fe-vpn-user-activity',
  standalone: true,
  imports: [
    ClarityModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    NgIf,
    NgFor,
    AsyncPipe,
    EmployeeNamePipe,
    ByteConvertPipe,
    ThumbnailPhotoPipe,
  ],
  templateUrl: './user-activity.component.html',
  styleUrls: ['./user-activity.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserActivityComponent implements OnInit, OnDestroy {
  public loadingEmployee = true;

  public loadingSession = true;

  public employeeListArray$: Observable<IEmployee>;

  public sessionListArray$: Observable<IVpnSession>;

  public sessionByUpnListArray$: Observable<IVpnSession>;

  public vpnFilter: FormGroup;

  private ngUnsubscribe$: Subject<any> = new Subject();

  public periods: any[] = [
    { name: '1 час', value: 1 },
    { name: '6 часов', value: 6 },
    { name: '1 день', value: 24 },
    { name: '1 неделя', value: 168 },
    { name: '2 недели', value: 336 },
    { name: '30 дней', value: 720 },
    { name: '90 дней', value: 2160 },
    { name: '180 дней', value: 4320 },
  ];

  public tabName: string;

  private reloadVpnSession: number;

  constructor(private wsService: WebsocketService, private commonStrings: ClrCommonStringsService, private formBuilder: FormBuilder) {
    commonStrings.localize(russionLocale);

    this.employeeListArray$ = this.wsService.on<IEmployee>(Event.EV_EMPLOYEE).pipe(
      distinctUntilChanged(),
      takeUntil(this.ngUnsubscribe$),
      tap(() => {
        this.loadingEmployee = false;
      }),
    );
    this.sessionListArray$ = this.wsService.on<IVpnSession>(Event.EV_VPN_COMPLETED_SESSION).pipe(
      distinctUntilChanged(),
      takeUntil(this.ngUnsubscribe$),
      tap(() => {
        this.loadingSession = false;
      }),
    );
    this.sessionByUpnListArray$ = this.wsService.on<IVpnSession>(Event.EV_VPN_COMPLETED_SESSION_BY_UPN).pipe(
      distinctUntilChanged(),
      takeUntil(this.ngUnsubscribe$),
      tap(() => {
        this.loadingSession = false;
      }),
    );
  }

  ngOnInit(): void {
    // this.wsService.send('getEmployee', null);
    // this.wsService.send('getVpnCompletedSession', 720);
    /*
    this.reloadVpnSession = window.setInterval(() => {
      this.loadingSession = true;
      this.wsService.send('getVpnCompletedSession', 720);
    }, 120000);
*/
    this.vpnFilter = this.formBuilder.group({
      vpnViewPeriod: [{ name: '6 часов', value: 6 }],
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe$.next(null);
    this.ngUnsubscribe$.complete();
    clearInterval(this.reloadVpnSession);
  }

  public displayFn(period: any) {
    if (period) {
      return period.name;
    }
  }

  public onDetailOpen(user: string): void {
    this.wsService.send('getVpnCompletedSession', { period: 720, employeeUpn: user });
  }

  public sessionRefresh() {
    this.loadingSession = true;
    this.wsService.send('getVpnCompletedSession', { period: 720, employeeUpn: null });
  }

  public onFilterPeriodChange(event: any) {
    if (event.isUserInput) {
      // console.log(event);
      // this.wsService.send('getAvayaCDR', event.source.value.value);
      // this.avayaCDRService.sendStatus(true);
      // event.source.close();
    }
  }

  public onTabChange(tab: string) {
    this.tabName = tab;
  }
}
