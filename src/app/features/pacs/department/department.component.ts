import {ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit, OnChanges, SimpleChanges} from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { ClarityModule } from '@clr/angular';
import {distinctUntilChanged, map, scan, takeUntil, tap} from 'rxjs/operators';
import { IPacsEvent } from '@model/pacs-event.model';
import { WebsocketService } from '@service/websocket.service';
import { Subject } from 'rxjs/internal/Subject';
import { Event } from '@service/websocket.service.event';
import { EmployeeNamePipe } from '@pipe/employeename.pipe';
import { Observable } from 'rxjs/internal/Observable';
import { SubscriptionLike } from 'rxjs/internal/types';

@Component({
    selector: 'fe-pacs-department',
    imports: [ClarityModule, AsyncPipe, DatePipe, EmployeeNamePipe],
    templateUrl: './department.component.html',
    styleUrls: ['./department.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DepartmentComponent implements OnDestroy {
  @Input() departmentStructure: any[];

  public loading = true;

  public pacsLastEventArray$: Observable<any>;

  // public departmentStructureArray$: Observable<any>;

  // public departmentStructureSubscription: SubscriptionLike;

  private ngUnsubscribe$: Subject<any> = new Subject();

  constructor(private wsService: WebsocketService) {
    this.pacsLastEventArray$ = this.wsService.on<IPacsEvent>(Event.EV_PACS_LAST_EVENT).pipe(
      distinctUntilChanged(),
      takeUntil(this.ngUnsubscribe$),
      tap(() => {
        this.loading = false;
      }),
      map(items => items.results.filter((item: any) => this.departmentStructure?.includes(item.departmentId))),
    );
  }

  // ngOnChanges(changes: SimpleChanges): void {
  //   if (changes['departmentStructure'] && this.departmentStructure) {
  //     this.pacsLastEventArray$ = this.wsService.on<IPacsEvent>(Event.EV_PACS_LAST_EVENT).pipe(
  //       distinctUntilChanged(),
  //       takeUntil(this.ngUnsubscribe$),
  //       tap(() => {
  //         this.loading = false;
  //       }),
  //       map(items =>
  //         items.results.filter((item: any) =>
  //           this.departmentStructure.includes(item.departmentId)
  //         )
  //       )
  //     );
  //   }
  // }

  public ngOnDestroy(): void {
    this.ngUnsubscribe$.next(null);
    this.ngUnsubscribe$.complete();
  }
}
