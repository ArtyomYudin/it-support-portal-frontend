import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { ClarityModule, ClrCommonStringsService } from '@clr/angular';
import { Observable } from 'rxjs/internal/Observable';
import { distinctUntilChanged, takeUntil, tap } from 'rxjs/operators';
import { IPacsEvent } from '@model/pacs-event.model';
import { WebsocketService } from '@service/websocket.service';
import { Subject } from 'rxjs/internal/Subject';
import { Event } from '@service/websocket.service.event';
import { EmployeeNamePipe } from '@pipe/employeename.pipe';
import { russionLocale } from '@translation/russion';

@Component({
  selector: 'fe-pacs-employee',
  standalone: true,
  imports: [ClarityModule, AsyncPipe, DatePipe, EmployeeNamePipe],
  templateUrl: './employee.component.html',
  styleUrls: ['./employee.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeComponent implements OnDestroy {
  public loading = true;

  public pacsEventArray$: Observable<IPacsEvent>;

  public pacsLastEventArray$: Observable<IPacsEvent>;

  private ngUnsubscribe$: Subject<any> = new Subject();

  constructor(private wsService: WebsocketService, private commonStrings: ClrCommonStringsService) {
    commonStrings.localize(russionLocale);
    this.pacsEventArray$ = this.wsService.on<IPacsEvent>(Event.EV_PACS_ENTRY_EXIT).pipe(
      distinctUntilChanged(),
      takeUntil(this.ngUnsubscribe$),
      tap(() => {
        this.loading = false;
      }),
    );
  }

  // ngOnInit(): void {}
  public ngOnDestroy(): void {
    this.ngUnsubscribe$.next(null);
    this.ngUnsubscribe$.complete();
  }
}
