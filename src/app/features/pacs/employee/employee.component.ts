import {ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { ClarityModule, ClrCommonStringsService } from '@clr/angular';
import { Observable } from 'rxjs/internal/Observable';
import {distinctUntilChanged, share, takeUntil, tap, scan} from 'rxjs/operators';
import { IPacsEvent } from '@model/pacs-event.model';
import { WebsocketService } from '@service/websocket.service';
import { Subject } from 'rxjs/internal/Subject';
import { Event } from '@service/websocket.service.event';
import { EmployeeNamePipe } from '@pipe/employeename.pipe';
import { russionLocale } from '@translation/russion';

@Component({
    selector: 'fe-pacs-employee',
    imports: [ClarityModule, AsyncPipe, DatePipe, EmployeeNamePipe],
    templateUrl: './employee.component.html',
    styleUrls: ['./employee.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeeComponent implements OnDestroy, OnInit {
  public loading = true;

  // public eventArray: any[] = []

  public pacsEventArray$: Observable<IPacsEvent>;

  // public pacsLastEventArray$: Observable<IPacsEvent>;

  private ngUnsubscribe$: Subject<any> = new Subject();


  constructor(private wsService: WebsocketService, private commonStrings: ClrCommonStringsService) {
    commonStrings.localize(russionLocale);
    this.pacsEventArray$ = this.wsService.on<IPacsEvent>(Event.EV_PACS_ENTRY_EXIT).pipe(
      distinctUntilChanged(),
      // добавляем новое событие в начало массива
      scan((acc: IPacsEvent, curr: IPacsEvent) => {
        return {
          total: (acc?.total || 0) + (curr?.results?.length || 0),
          results: [...(curr?.results || []), ...(acc?.results || [])], // prepend новые события
        };
      }, { total: 0, results: [] } as IPacsEvent),
      takeUntil(this.ngUnsubscribe$),
      tap(() => {
        this.loading = false;
      }),
    )
  }

  public ngOnInit(): void {
    // this.pacsEventArray$.subscribe(data => {
    //   this.eventArray.unshift(data.results[0])
    // })
  }

  public ngOnDestroy(): void {
    this.ngUnsubscribe$.next(null);
    this.ngUnsubscribe$.complete();
  }
}
