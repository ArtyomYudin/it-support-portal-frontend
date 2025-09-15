import {ChangeDetectionStrategy, Component, DestroyRef, inject} from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { ClarityModule, ClrCommonStringsService } from '@clr/angular';
import { Observable } from 'rxjs/internal/Observable';
import {distinctUntilChanged, tap, scan} from 'rxjs/operators';
import { IPacsEvent } from '@model/pacs-event.model';
import { WebsocketService } from '@service/websocket.service';
import { Event } from '@service/websocket.service.event';
import { EmployeeNamePipe } from '@pipe/employeename.pipe';
import { russionLocale } from '@translation/russion';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

@Component({
    selector: 'fe-pacs-employee',
    imports: [ClarityModule, AsyncPipe, DatePipe, EmployeeNamePipe],
    templateUrl: './employee.component.html',
    styleUrls: ['./employee.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeeComponent {
  public loading = true;
  public pacsEventArray$: Observable<IPacsEvent>;

  private destroyRef = inject(DestroyRef);

  constructor(private wsService: WebsocketService, private commonStrings: ClrCommonStringsService) {
    // локализация
    commonStrings.localize(russionLocale);

   // поток событий
    this.pacsEventArray$ = this.wsService.on<IPacsEvent>(Event.EV_PACS_ENTRY_EXIT).pipe(
      distinctUntilChanged(),
      scan((acc: IPacsEvent, curr: IPacsEvent) => {
        return {
          total: (acc?.total || 0) + (curr?.results?.length || 0),
          results: [...(curr?.results || []), ...(acc?.results || [])], // prepend новые события
        };
      }, { total: 0, results: [] } as IPacsEvent),
      tap(() => this.loading = false),
      takeUntilDestroyed(this.destroyRef)
    );
  }
}
