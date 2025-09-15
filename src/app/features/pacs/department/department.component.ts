import { ChangeDetectionStrategy, Component, Input, inject, DestroyRef } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { ClarityModule } from '@clr/angular';
import { distinctUntilChanged, map, startWith, tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IPacsEvent } from '@model/pacs-event.model';
import { WebsocketService } from '@service/websocket.service';
import { Event } from '@service/websocket.service.event';
import { EmployeeNamePipe } from '@pipe/employeename.pipe';
import { Observable } from 'rxjs/internal/Observable';

@Component({
    selector: 'fe-pacs-department',
    imports: [ClarityModule, AsyncPipe, DatePipe, EmployeeNamePipe],
    templateUrl: './department.component.html',
    styleUrls: ['./department.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DepartmentComponent {
  @Input() departmentStructure: any[];

  public loading = true;
  public pacsLastEventArray$: Observable<any>;

  private destroyRef = inject(DestroyRef);

  constructor(private wsService: WebsocketService) {
    this.pacsLastEventArray$ = this.wsService.on<IPacsEvent>(Event.EV_PACS_LAST_EVENT).pipe(
      startWith({ total: 0, results: [] }),  // защита от null/undefined
      distinctUntilChanged(),
      tap(() => {
        this.loading = false;
      }),
      map(items => items.results.filter((item: any) => this.departmentStructure?.includes(item.departmentId))),
      takeUntilDestroyed(this.destroyRef)
    );
  }
}
