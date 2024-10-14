import { Component, OnDestroy, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { Subject } from 'rxjs/internal/Subject';
import { distinctUntilChanged, takeUntil, tap } from 'rxjs/operators';
// import { MatSnackBar } from '@angular/material/snack-bar';
import { WebsocketService } from '@service/websocket.service';
import { Event } from '@service/websocket.service.event';
import { IUserRequest } from '@model/user-request.model';
import { Observable } from 'rxjs/internal/Observable';
import { ClarityModule, ClrCommonStringsService } from '@clr/angular';
import { AsyncPipe, DatePipe } from '@angular/common';
import { russionLocale } from '@translation/russion';
import { EmployeeNamePipe } from '@pipe/employeename.pipe';
import { RequestNewComponent } from '@feature/user-request/request-new/request-new.component';
import { RequestCardComponent } from '@feature/user-request/request-card/request-card.component';

@Component({
  selector: 'fe-user-request-list',
  standalone: true,
  imports: [ClarityModule, AsyncPipe, DatePipe, EmployeeNamePipe, RequestNewComponent, RequestCardComponent],
  templateUrl: './request-list.component.html',
  styleUrls: ['./request-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestListComponent implements OnDestroy {
  public selected: any = [];

  public loading = true;

  public currentDate: Date = new Date();

  public userRequestArray$: Observable<IUserRequest>;

  public snackBarEvent$: Observable<any>;

  public isConfirmDeleteVisible = false;

  private ngUnsubscribe$: Subject<any> = new Subject();

  @ViewChild(RequestNewComponent) modalNew: RequestNewComponent;

  @ViewChild(RequestCardComponent) modalCard: RequestCardComponent;

  constructor(private wsService: WebsocketService, private commonStrings: ClrCommonStringsService) {
    commonStrings.localize(russionLocale);

    this.userRequestArray$ = this.wsService.on<IUserRequest>(Event.EV_USER_REQUEST_ALL).pipe(
      distinctUntilChanged(),
      takeUntil(this.ngUnsubscribe$),
      tap(() => {
        this.loading = false;
      }),
    );

    /*
    this.wsService
      .on<any>(Event.EV_NOTIFY)
      .pipe(distinctUntilChanged(), takeUntil(this.ngUnsubscribe$))
      .subscribe(e => this.openNotifyBar(e));
*/
    this.wsService.status.subscribe(status => {
      // console.log(`webSocket status: ${status}`);
      if (status) {
        this.wsService.send('getAllUserRequest', null);
      }
    });
  }

  /*
  private openNotifyBar(e: any) {
    this.notifyBar.open(e.event, '', {
      duration: 5000,
      verticalPosition: 'top',
    });
  }
 */
  // ngOnInit(): void {}

  ngOnDestroy(): void {
    this.ngUnsubscribe$.next(null);
    this.ngUnsubscribe$.complete();
  }

  public deleteRequestCard(cards: any, confirm?: boolean | false) {
    const cardArray: any[] = [];
    if (confirm) {
      this.isConfirmDeleteVisible = false;
      cards.forEach((card: any) => {
        cardArray.push(card.requestNumber);
      });
      this.wsService.send('deleteUserRequest', cardArray);
    } else {
      this.isConfirmDeleteVisible = true;
    }
  }
}
