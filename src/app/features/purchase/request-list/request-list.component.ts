import { Component, OnDestroy, OnInit } from '@angular/core';
import { distinctUntilChanged, share, takeUntil, tap } from 'rxjs/operators';
import { Subject } from 'rxjs/internal/Subject';
import { WebsocketService } from '@service/websocket.service';
import { Event } from '@service/websocket.service.event';
import { PurchaseRequest } from '@model/purchase-request.model';

@Component({
  selector: 'fe-purchase-request-list',
  templateUrl: './request-list.component.html',
  styleUrls: ['./request-list.component.scss'],
})
export class PurchaseRequestListComponent implements OnInit, OnDestroy {
  public purchaseRequestArray$: PurchaseRequest | any;

  // public loading = true;
  public selected: any = [];

  // public purchaseRequestDraftId: any;

  private ngUnsubscribe$: Subject<any> = new Subject();

  constructor(private wsService: WebsocketService) {
    this.purchaseRequestArray$ = this.wsService.on<PurchaseRequest>(Event.EV_PURCASE_REQUEST_ALL).pipe(
      share(),
      distinctUntilChanged(),
      takeUntil(this.ngUnsubscribe$),
      tap(() => {
        // this.loading = false;
      }),
    );
  }

  ngOnInit(): void {
    this.wsService.send('getAllPurchaseRequest');
  }

  public ngOnDestroy(): void {
    this.ngUnsubscribe$.next(null);
    this.ngUnsubscribe$.complete();
  }
}
