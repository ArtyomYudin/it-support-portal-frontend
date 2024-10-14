import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Validators, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DatePipe, NgFor, AsyncPipe } from '@angular/common';
import { Subject } from 'rxjs/internal/Subject';
import { debounceTime, distinctUntilChanged, filter, switchMap, takeUntil, tap } from 'rxjs/operators';
import { SubscriptionLike } from 'rxjs/internal/types';
import { ClarityModule } from '@clr/angular';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { WebsocketService } from '@service/websocket.service';
import { Event } from '@service/websocket.service.event';
import { Department } from '@model/department.model';
import { RequestService } from '@model/request-service.model';
import { RequestStatus } from '@model/request-status.model';
import { RequestPriority } from '@model/request-priority.model';
import { Employee } from '@model/employee.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'fe-user-request-new',
  standalone: true,
  imports: [ClarityModule, NgFor, AsyncPipe, MatAutocompleteModule, ReactiveFormsModule],
  templateUrl: './request-new.component.html',
  styleUrls: ['./request-new.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestNewComponent implements OnInit, OnDestroy {
  public modalOpen: boolean;

  public fileList: File[] = [];

  public listOfFiles: any[] = [];

  public attachFilesArray: any[] = [];

  public userRequest: FormGroup;

  public filteredInitiator: Employee | any;

  public newNumber$: Observable<any>;

  public serviceListArray$: Observable<any>;

  public department$: Observable<any>;

  public currentDate: Date = new Date();

  public newNumber: string;

  public statusListArray$: Observable<any>;

  public priorityListArray$: Observable<any>;

  public executorListArray$: Observable<any>;

  public newNumberSubscription: SubscriptionLike;

  public executorListSubscription: SubscriptionLike;

  public userRequestAllData: {
    requestNumber?: string;
    creatorUpn?: string;
    initiatorUpn?: string;
    departmentId?: number;
    executorUpn?: string;
    serviceId?: number;
    topic?: string;
    description?: string;
    statusId?: number;
    priorityId?: number;
    deadline?: string;
    attachments?: any[];
  } = {};

  private token = JSON.parse(localStorage.getItem('IT-Support-Portal'));

  private ngUnsubscribe$: Subject<any> = new Subject();

  constructor(private formBuilder: FormBuilder, private wsService: WebsocketService, private cdRef: ChangeDetectorRef) {
    this.serviceListArray$ = this.wsService
      .on<RequestService>(Event.EV_USER_REQUEST_SERVICE)
      .pipe(distinctUntilChanged(), takeUntil(this.ngUnsubscribe$));

    this.newNumber$ = this.wsService.on<any>(Event.EV_USER_REQUEST_NEW_NUMBER).pipe(distinctUntilChanged(), takeUntil(this.ngUnsubscribe$));

    this.statusListArray$ = this.wsService
      .on<RequestStatus>(Event.EV_USER_REQUEST_STATUS)
      .pipe(distinctUntilChanged(), takeUntil(this.ngUnsubscribe$));

    this.priorityListArray$ = this.wsService
      .on<RequestPriority>(Event.EV_USER_REQUEST_PRIORITY)
      .pipe(distinctUntilChanged(), takeUntil(this.ngUnsubscribe$));

    this.executorListArray$ = this.wsService
      .on<any>(Event.EV_EMPLOYEE_BY_PARENT_DEPARTMENT)
      .pipe(distinctUntilChanged(), takeUntil(this.ngUnsubscribe$));

    this.department$ = this.wsService.on<Department>(Event.EV_DEPARTMENT).pipe(distinctUntilChanged(), takeUntil(this.ngUnsubscribe$));
  }

  ngOnInit(): void {
    this.userRequest = this.formBuilder.group({
      deadline: ['', Validators.required],
      status: ['', Validators.required],
      priority: ['', Validators.required],
      initiator: ['', Validators.required],
      initiatorDepartment: [{ value: '', disabled: false }, Validators.required],
      executor: ['', Validators.required],
      service: ['', Validators.required],
      topic: ['', [Validators.required, Validators.maxLength(250)]],
      description: ['', Validators.required],
    });

    this.userRequest.controls.initiator.valueChanges
      .pipe(
        distinctUntilChanged(),
        debounceTime(500),
        tap(value => {
          if (!value) {
            // delete this.userRequestAllData.initiatorId;
            // delete this.userRequestAllData.departmentId;
            this.userRequest.controls.initiatorDepartment.setValue('');
          }
          this.filteredInitiator = null;
        }),
        filter(value => value.length >= 3),
        switchMap(value => {
          this.wsService.send('getFilteredRequestInitiator', value);
          this.cdRef.markForCheck();
          return this.wsService.on<Employee>(Event.EV_FILTERED_EMPLOYEE);
        }),
        takeUntil(this.ngUnsubscribe$),
      )
      .subscribe(data => {
        if (!data) {
          this.filteredInitiator = null;
        } else {
          this.filteredInitiator = data;
          this.cdRef.markForCheck();
        }
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe$.next(null);
    this.ngUnsubscribe$.complete();
  }

  static clearSubscription(subscription: SubscriptionLike) {
    let subs = subscription;
    if (subs) {
      subs.unsubscribe();
      subs = null;
    }
  }

  static readFiles(file: any) {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onload = () => {
        return resolve({ data: fileReader.result, name: file.name, size: file.size, type: file.type });
      };
      fileReader.readAsDataURL(file);
    });
  }

  public resetRequestPage(): void {
    Object.keys(this.userRequest.controls).forEach(key => {
      this.userRequest.get(key).reset('');
    });
    this.fileList = [];
    this.listOfFiles = [];
  }

  public openNewRequest(): void {
    this.modalOpen = true;
    this.wsService.send('getUserRequestNewNumber', null);
    this.wsService.send('getUserRequestStatus', null);
    this.wsService.send('getUserRequestPriority', null);
    this.wsService.send('getUserRequestService', null);
    this.wsService.send('getEmployeeByParentDepartment', 49);

    this.userRequestAllData.creatorUpn = this.token.id;

    this.newNumberSubscription = this.newNumber$.subscribe((number: any) => {
      this.newNumber = number.newNumber.toString().padStart(6, 0);
      this.userRequestAllData.requestNumber = this.newNumber;
    });
    this.statusListArray$.subscribe(statuses => {
      this.userRequest.controls.status.setValue(statuses[0].name);
      this.userRequestAllData.statusId = statuses[0].id;
    });
    this.priorityListArray$.subscribe(priorities => {
      this.userRequest.controls.priority.setValue(priorities[0].name);
      this.userRequestAllData.priorityId = priorities[0].id;
    });
    this.userRequest.controls.deadline.setValue(this.currentDate.toLocaleDateString());
    // this.userRequestAllData.deadline = this.currentDate.toLocaleDateString();
    // this.userRequest.controls.requestNumber.setValue(this.lastNumber);
    // this.userRequestAllData.requestNumber = this.newNumber;
  }

  public onAttacheFile(files: FileList): void {
    for (let i = 0; i <= files.length - 1; i += 1) {
      this.fileList.push(files[i]);
      this.listOfFiles.push(files[i].name);
    }
  }

  public onDeleteAttachFile(index: any): void {
    this.listOfFiles.splice(index, 1);
    this.fileList.splice(index, 1);
  }

  public async closeNewRequest(): Promise<void> {
    this.modalOpen = false;
    // console.log(this.requestInfo.controls.test.value);
    this.resetRequestPage();
    RequestNewComponent.clearSubscription(this.newNumberSubscription);
  }

  public onStatusSelected(status: any): void {
    this.userRequestAllData.statusId = status.id;
  }

  public onPrioritySelected(priority: any): void {
    this.userRequestAllData.priorityId = priority.id;
  }

  public onInitiatorSelected(initiator: any): void {
    this.wsService.send('getDepartment', initiator.departmentId);
    this.department$.subscribe(dep => {
      this.userRequest.controls.initiatorDepartment.setValue(dep[0].name);
    });
    this.userRequestAllData.initiatorUpn = initiator.userPrincipalName;
    this.userRequestAllData.departmentId = initiator.departmentId;
  }

  public onExecutorSelected(executor: any): void {
    this.userRequestAllData.executorUpn = executor.userPrincipalName;
  }

  public onServiceSelected(service: any): void {
    this.userRequestAllData.serviceId = service.id;
  }

  public async saveNewRequest(): Promise<void> {
    const deadline = this.userRequest.controls.deadline.value.split('.');
    this.userRequestAllData.deadline = `${deadline[2]}-${deadline[1]}-${deadline[0]}`;
    this.userRequestAllData.topic = this.userRequest.controls.topic.value;
    this.userRequestAllData.description = this.userRequest.controls.description.value;
    this.userRequestAllData.attachments = await Promise.all(
      this.fileList.map(file => {
        return RequestNewComponent.readFiles(file);
      }),
    );
    this.wsService.send('saveNewUserRequest', this.userRequestAllData);
    this.modalOpen = false;
    this.resetRequestPage();
  }
}
