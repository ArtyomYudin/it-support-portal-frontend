import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { Subject } from 'rxjs/internal/Subject';
import { SubscriptionLike } from 'rxjs/internal/types';
import { WebsocketService } from '@service/websocket.service';
import { debounceTime, distinctUntilChanged, filter, first, switchMap, takeUntil, tap } from 'rxjs/operators';
import { ClarityModule } from '@clr/angular';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgFor, DatePipe } from '@angular/common';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Event } from '@service/websocket.service.event';
import { Employee } from '@model/employee.model';
import { EmployeeNamePipe } from '@pipe/employeename.pipe';
import { DepartmentComponent } from './department/department.component';
import { EmployeeComponent } from './employee/employee.component';
import { GuestComponent } from './guest/guest.component';

@Component({
  selector: 'fe-pacs',
  standalone: true,
  imports: [
    ClarityModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    NgFor,
    DatePipe,
    EmployeeNamePipe,
    GuestComponent,
    EmployeeComponent,
    DepartmentComponent,
  ],
  templateUrl: './pacs.component.html',
  styleUrls: ['./pacs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MatSnackBar, DatePipe, EmployeeNamePipe],
})
export default class PacsComponent implements OnInit, OnDestroy {
  public departmentStructureArray$: Observable<any>;

  public employeeLastEventArray$: Observable<any>;

  public departmentStructureSubscription: SubscriptionLike;

  public departmentStructure: any[];

  public filteredEmployee: Employee | any;

  public employeeSearch: FormGroup;

  private ngUnsubscribe$: Subject<any> = new Subject();

  constructor(
    private formBuilder: FormBuilder,
    private wsService: WebsocketService,
    private cdRef: ChangeDetectorRef,
    private notifyBar: MatSnackBar,
    private datePipe: DatePipe,
    private employeeNamePipe: EmployeeNamePipe,
  ) {
    this.departmentStructureArray$ = this.wsService
      .on<any>(Event.EV_DEPARTMENT_STRUCTURE_BY_UPN)
      .pipe(distinctUntilChanged(), takeUntil(this.ngUnsubscribe$));

    this.employeeLastEventArray$ = this.wsService
      .on<any>(Event.EV_PACS_EMPLOYEE_LAST_EVENT)
      .pipe(distinctUntilChanged(), first(), takeUntil(this.ngUnsubscribe$));
  }

  ngOnInit(): void {
    this.employeeSearch = this.formBuilder.group({
      employeeName: '',
    });
    this.wsService.send('getPacsInitValue');
    this.wsService.send(
      'getDepartmentStructureByUPN',
      localStorage.getItem('IT-Support-Portal') ? JSON.parse(localStorage.getItem('IT-Support-Portal')).id : null,
    );
    this.departmentStructureSubscription = this.departmentStructureArray$.subscribe(date => {
      this.departmentStructure = date;
    });

    this.employeeSearch.controls.employeeName.valueChanges
      .pipe(
        distinctUntilChanged(),
        debounceTime(500),
        tap(() => {
          this.filteredEmployee = null;
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
          this.filteredEmployee = null;
        } else {
          this.filteredEmployee = data;
          this.cdRef.markForCheck();
        }
      });
  }

  public ngOnDestroy(): void {
    this.ngUnsubscribe$.next(null);
    this.ngUnsubscribe$.complete();
    this.departmentStructureSubscription.unsubscribe();
  }

  private openNotifyBar(e: any) {
    this.notifyBar.open(e, 'Ok', {
      duration: 60000,
      verticalPosition: 'top',
      horizontalPosition: 'right',
    });
  }

  public onEmployeeSelected(employee: any): void {
    this.wsService.send('getPacsEmployeeLastEvent', employee.userPrincipalName);
    this.employeeLastEventArray$.subscribe(event => {
      this.openNotifyBar(
        `СКУД\n${this.datePipe.transform(event[0].eventDate, 'dd MMMM HH:mm:ss')}  ${this.employeeNamePipe.transform(
          event[0].displayName,
        )}  ${event[0].accessPoint}`,
      );
      this.employeeSearch.controls.employeeName.setValue('');
    });
  }
}
