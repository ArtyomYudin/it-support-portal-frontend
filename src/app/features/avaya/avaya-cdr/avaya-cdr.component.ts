import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs/internal/Subject';
import { Observable } from 'rxjs/internal/Observable';
import { distinctUntilChanged, takeUntil, tap } from 'rxjs/operators';
import { ClarityModule, ClrCommonStringsService } from '@clr/angular';
import { DatePipe, AsyncPipe } from '@angular/common';
import { WebsocketService } from '@service/websocket.service';
import { AvayaCDRService } from '@service/avaya.cdr.service';
import { IAvayaCDR } from '@model/avaya-cdr.model';
import { Event } from '@service/websocket.service.event';
import { EmployeeNamePipe } from '@pipe/employeename.pipe';
import { AvayaDurationConvertPipe } from '@pipe/avayadurationconvert.pipe';
import { AvayaCallCodeConvertPipe } from '@pipe/avayacallcodeconvert.pipe';
import { russionLocale } from '@translation/russion';
import { AvayaCDRFilterComponent } from '../avaya-cdr-filter/avaya-cdr-filter.component';

@Component({
  selector: 'fe-avaya-cdr',
  standalone: true,
  imports: [
    ClarityModule,
    AvayaCDRFilterComponent,
    DatePipe,
    AsyncPipe,
    EmployeeNamePipe,
    AvayaDurationConvertPipe,
    AvayaCallCodeConvertPipe,
  ],
  templateUrl: './avaya-cdr.component.html',
  styleUrls: ['./avaya-cdr.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvayaCDRComponent implements OnInit, OnDestroy {
  // public loading = true;
  public loading: boolean;

  public eventAvayaCDRArray$: Observable<IAvayaCDR>;

  private ngUnsubscribe$: Subject<any> = new Subject();

  constructor(
    private wsService: WebsocketService,
    private avayaCDRService: AvayaCDRService,
    private commonStrings: ClrCommonStringsService,
  ) {
    commonStrings.localize(russionLocale);
    this.eventAvayaCDRArray$ = this.wsService.on<IAvayaCDR>(Event.EV_AVAYA_CDR).pipe(
      distinctUntilChanged(),
      takeUntil(this.ngUnsubscribe$),
      tap(() => {
        this.loading = false;
      }),
    );
  }

  ngOnInit(): void {
    this.avayaCDRService.currentCDRLoadStatus.subscribe(loadStatus => {
      this.loading = loadStatus;
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe$.next(null);
    this.ngUnsubscribe$.complete();
  }
}
