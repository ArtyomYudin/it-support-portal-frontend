import { ChangeDetectionStrategy, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs/internal/Subject';
import { distinctUntilChanged, first, takeUntil } from 'rxjs/operators';
import { Observable } from 'rxjs/internal/Observable';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ClarityModule } from '@clr/angular';
import { AsyncPipe, DatePipe, NgIf, NgFor } from '@angular/common';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { WebsocketService } from '@service/websocket.service';
import { Event } from '@service/websocket.service.event';
import { Notify } from '@model/notify.model';
import { IUserRequest } from '@model/user-request.model';
//import { JwtHelperService } from '@auth0/angular-jwt';
import { FilePreviewService } from '@service/file-preview/file.preview.service';
import { SubscriptionLike } from 'rxjs/internal/types';
import { saveAs } from 'file-saver';
import { Buffer } from 'buffer';
import { EmployeeNamePipe } from '@pipe/employeename.pipe';

@Component({
  selector: 'fe-user-request-card',
  standalone: true,
  imports: [ClarityModule, NgFor, NgIf, DatePipe, AsyncPipe, MatAutocompleteModule, ReactiveFormsModule, EmployeeNamePipe],
  templateUrl: './request-card.component.html',
  styleUrls: ['./request-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestCardComponent implements OnInit, OnDestroy {
  public userRequest: any;

  public modalOpen: boolean;

  public attachmentArray$: Observable<any>;

  public attachmentSubscription: SubscriptionLike;

  public attachmentBase64$: Observable<any>;

  public attachmentBase64Subscription: SubscriptionLike;

  // public userRequestCardModel: any;

  public userRequest$: Observable<any>;

  public userRequestSubscription: SubscriptionLike;

  public userRequestLifeCycle$: Observable<any>;

  public delegateListArray$: Observable<any>;

  public requestStatus: any;

  public userRequestCard: FormGroup;

  public listOfFiles: any[] = [];

  public images: string;

  public showAutocomplete = true;

  public userRequestNewData: {
    delegate?: number;
    serviceId?: number;
    attachments?: any[];
    comment?: string;
  } = {};

  public previewDialogStatus: boolean = null;

  private ngUnsubscribe$: Subject<any> = new Subject();

  private token = JSON.parse(localStorage.getItem('IT-Support-Portal'));

  static clearSubscription(subscription: SubscriptionLike) {
    let subs = subscription;
    if (subs) {
      subs.unsubscribe();
      subs = null;
    }
  }

  // @ViewChild(MatAutocompleteTrigger) autocomplete: MatAutocompleteTrigger;

  constructor(
    private wsService: WebsocketService,
    private formBuilder: FormBuilder,
    //private jwtHelper: JwtHelperService,
    private previewDialog: FilePreviewService,
  ) {
    this.userRequest$ = this.wsService
      .on<IUserRequest>(Event.EV_USER_REQUEST_BY_NUMBER)
      .pipe(distinctUntilChanged(), takeUntil(this.ngUnsubscribe$));
    this.delegateListArray$ = this.wsService
      .on<any>(Event.EV_EMPLOYEE_BY_PARENT_DEPARTMENT)
      .pipe(distinctUntilChanged(), takeUntil(this.ngUnsubscribe$));
    this.attachmentArray$ = this.wsService
      .on<any>(Event.EV_USER_REQUEST_ATTACHMENT)
      .pipe(distinctUntilChanged(), takeUntil(this.ngUnsubscribe$));
    this.userRequestLifeCycle$ = this.wsService
      .on<any>(Event.EV_USER_REQUEST_LIFE_CYCLE)
      .pipe(distinctUntilChanged(), takeUntil(this.ngUnsubscribe$));
    this.attachmentBase64$ = this.wsService.on<any>(Event.EV_USER_REQUEST_ATTACHMENT_BASE64).pipe(first(), takeUntil(this.ngUnsubscribe$));
  }

  ngOnInit(): void {
    this.userRequestCard = this.formBuilder.group({
      comment: [''],
      delegate: [''],
    });
    this.previewDialog.overlayStatus.subscribe(status => {
      this.previewDialogStatus = status;
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe$.next(null);
    this.ngUnsubscribe$.complete();
  }

  @HostListener('keyup.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent) {
    // console.log(this.previewDialogStatus);
    if (this.previewDialogStatus !== null) {
      if (this.previewDialogStatus === !true) {
        event.stopPropagation();
      }
      // Now we mark that we've handled the change from the change handler, by setting the pending variable to null.
      this.previewDialogStatus = null;
    }
  }

  public openRequestCard(requestNumber: any): void {
    this.userRequestNewData = {};
    this.wsService.send('getUserRequestByNumber', requestNumber);
    this.wsService.send('getUserRequestLifeCycle', requestNumber);
    this.wsService.send('getEmployeeByParentDepartment', 49);
    this.wsService.send('getUserRequestAttachment', { requestNumber });
    this.userRequestSubscription = this.userRequest$.subscribe(request => {
      this.userRequest = request;
      this.modalOpen = true;
    });
    this.attachmentSubscription = this.attachmentArray$.subscribe((attach: any) => {
      this.listOfFiles = attach;
    });
    // this.userRequest = card;
    // console.log(this.userRequest.requestNumber);
  }

  public closeRequestCard(): void {
    this.modalOpen = false;
    RequestCardComponent.clearSubscription(this.userRequestSubscription);
    RequestCardComponent.clearSubscription(this.attachmentSubscription);
    RequestCardComponent.clearSubscription(this.attachmentBase64Subscription);
    this.userRequestCard.reset();
  }

  public takeRequestToWork() {
    this.wsService.send('updateUserRequest', {
      requestNumber: this.userRequest.requestNumber,
      employeeUpn: this.token.id,
      newData: { status: 2 },
    });
    this.wsService
      .on<Notify>(Event.EV_NOTIFY)
      .pipe(first(), takeUntil(this.ngUnsubscribe$))
      .subscribe(status => {
        this.requestStatus = status;
      });
  }

  public finishRequest() {
    this.wsService.send('updateUserRequest', {
      requestNumber: this.userRequest.requestNumber,
      employeeUpn: this.token.id,
      newData: { status: 3 },
    });
    this.wsService
      .on<Notify>(Event.EV_NOTIFY)
      .pipe(first(), takeUntil(this.ngUnsubscribe$))
      .subscribe(status => {
        this.requestStatus = status;
      });
  }

  public isSaveButtonVisible() {
    return !!(this.userRequestCard.controls.comment.value || this.userRequestNewData.delegate);
  }

  public isRequestCardReadOnly() {
    return this.userRequest?.status.id === 1 || this.userRequest?.status.id === 3;
  }

  public onDegegateSelected(delegate: any): void {
    this.userRequestNewData.delegate = delegate.userPrincipalName;
  }

  public onDelegateChanges() {
    this.userRequestCard.controls.delegate.valueChanges.pipe(takeUntil(this.ngUnsubscribe$)).subscribe(value => {
      if (!value) {
        // this.autocomplete.closePanel();
        if (this.userRequestNewData.delegate) {
          delete this.userRequestNewData.delegate;
        }
      }
    });
  }

  public saveRequestCard() {
    // this.modalOpen = false;
    if (this.userRequestCard.controls.comment.value) {
      this.userRequestNewData.comment = this.userRequestCard.controls.comment.value;
    }
    this.wsService.send('updateUserRequest', {
      requestNumber: this.userRequest.requestNumber,
      employeeUpn: this.token.id,
      newData: this.userRequestNewData,
    });
    this.userRequestCard.reset();
  }

  public viewAttachment(file: any) {
    this.wsService.send('getUserRequestAttachment', {
      requestNumber: this.userRequest.requestNumber,
      fileName: file.fileName,
      fileType: file.fileType,
      filePath: file.filePath,
    });
    this.attachmentBase64Subscription = this.attachmentBase64$.subscribe((attach: any) => {
      if (!file.fileType.includes('image/')) {
        const blob = new Blob([Buffer.from(attach, 'base64')], { type: file.fileType });
        saveAs(blob, file.fileName);
      } else {
        this.images = `data:${file.fileType};base64,${attach}`;
        this.previewDialog.open(this.images);
      }
    });
  }
}
