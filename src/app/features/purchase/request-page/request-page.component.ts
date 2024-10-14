import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Validators, FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { ClrWizard } from '@clr/angular';
import { JwtHelperService } from '@auth0/angular-jwt';
import { debounceTime, distinctUntilChanged, filter, switchMap, takeUntil, tap, first } from 'rxjs/operators';
import { Subject } from 'rxjs/internal/Subject';
import { WebsocketService } from '@service/websocket.service';
import { Event } from '@service/websocket.service.event';
import { AuthenticationService } from '@service/auth.service';
import { Employee } from '@model/employee.model';
import { AuthUser } from '@model/auth-user.model';

@Component({
  selector: 'fe-purchase-request-page',
  templateUrl: './request-page.component.html',
  styleUrls: ['./request-page.component.scss'],
})
export class PurchaseRequestPageComponent implements OnInit, OnDestroy {
  // @Input() public purchaseRequestDraftId: any;

  public currentUser: AuthUser;

  public requestInfo: FormGroup;

  public requestAuthor: FormGroup;

  public requestApprovers: FormGroup;

  public expenseDepartmentDescriptionStatus: boolean;

  public expenseDepartmentDescriptionHelper: string;

  public expenseProjectDescriptionStatus: boolean;

  public expenseProjectDescriptionHelper: string;

  public filteredRespPerson: any[] = [];

  public purchaseRequestAllData: any;

  public isLoading = false;

  // public eventEmployeeByUPN$: Employee | any;

  public isConfirmModalVisible = false;

  private ngUnsubscribe$: Subject<any> = new Subject();

  private responsiblePerson: any;

  @ViewChild('purchaseRequestWizard') wizard: ClrWizard;

  constructor(
    private formBuilder: FormBuilder,
    private wsService: WebsocketService,
    private jwtHelper: JwtHelperService,
    private authenticationService: AuthenticationService,
  ) {
    this.authenticationService.currentUser$.pipe(takeUntil(this.ngUnsubscribe$)).subscribe(x => {
      this.currentUser = x;
    });
  }

  ngOnInit(): void {
    this.requestInfo = this.formBuilder.group({
      purchaseInitiator: ['', Validators.required],
      // purchaseTarget: ['', Validators.required],
      responsiblePerson: ['', Validators.required],
      expenseItemCompany: ['', Validators.required],
      expenseItemDepartment: ['', Validators.required],
      expenseItemProject: ['', Validators.required],
      expenseDepartmentDescription: [''],
      expenseProjectDescription: [''],
      purchaseReason: ['', Validators.required],
      purchaseITDepartment: ['', Validators.required],
      purchaseLogisticDepartment: ['', Validators.required],
      requestAuthor: ['', Validators.required],
      purchaseTargets: this.formBuilder.array([]),
    });
    /*
    this.requestAuthor = this.formBuilder.group({
      requestAuthorName: ['', Validators.required],
      requestAuthorPosition: ['', Validators.required],
    });
 */
    this.requestApprovers = this.formBuilder.group({
      headOfInitDepartment: ['', Validators.required],
      headOfPurchaseDepartment: ['', Validators.required],
      deputyDirector: [''],
      headOfFinDepartment: ['', Validators.required],
    });

    this.requestInfo.controls.responsiblePerson.valueChanges
      .pipe(
        distinctUntilChanged(),
        debounceTime(500),
        tap(() => {
          this.filteredRespPerson = [];
          // this.isLoading = true;
        }),
        filter(value => value.length >= 3),
        switchMap(value => {
          this.wsService.send('getFilteredRespPerson', value);
          return this.wsService.on<any>(Event.EV_FILTERED_EMPLOYEE);
        }),
        takeUntil(this.ngUnsubscribe$),
      )
      .subscribe(data => {
        if (!data) {
          this.filteredRespPerson = [];
          // this.isLoading = true;
        } else {
          this.filteredRespPerson = data;
          // this.isLoading = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe$.next(null);
    this.ngUnsubscribe$.complete();
  }

  get purchaseTargets() {
    return this.requestInfo.controls.purchaseTargets as FormArray;
  }

  /*
  // convenience getter for easy access to form fields
  get f(): any {
    return this.requestInfo.controls;
  }
 */

  public addPurchaseTarget(): void {
    // add address to the list
    const purchaseTarget = this.formBuilder.group({
      target: ['', Validators.required],
    });

    this.purchaseTargets.push(purchaseTarget);
  }

  public removePurchaseTarget(i: number): void {
    this.purchaseTargets.removeAt(i);
  }

  public onOpen(): void {
    this.addPurchaseTarget();
    const { token } = JSON.parse(localStorage.getItem('IT-Support-Portal'));
    this.wsService.send('purchaseRequestInit', this.jwtHelper.decodeToken(token).email);
    this.wsService
      .on<Employee>(Event.EV_PURCHASE_REQUEST_INIT_INFO)
      .pipe(first(), takeUntil(this.ngUnsubscribe$))
      .subscribe(value => {
        // this.requestInfo.controls.purchaseTarget.setValue[]('sdsadasdas');

        this.requestInfo.controls.purchaseInitiator.setValue(value.departmentName);
        this.requestInfo.controls.purchaseInitiator.disable();
        this.requestInfo.controls.requestAuthor.setValue(`${value.positionName}  ${value.displayName}`);
        this.requestInfo.controls.requestAuthor.disable();
        this.requestApprovers.controls.headOfInitDepartment.setValue(value.departmentManagerName);
        this.requestApprovers.controls.deputyDirector.setValue(value.directionManagerName);
        this.wizard.open();
      });
  }

  public onCancel(): void {
    this.isConfirmModalVisible = true;
    this.resetRequestPage();
  }

  public resetRequestPage(): void {
    this.isConfirmModalVisible = false;

    Object.keys(this.requestInfo.controls).forEach(key => {
      if (key === 'responsiblePerson') {
        this.requestInfo.get(key).reset('');
      } else this.requestInfo.get(key).reset();

      this.requestInfo.get(key).enable();
      // this.requestInfo.get(key).updateValueAndValidity();
    });
    // this.requestInfo.reset(); // ошибка в логах при закрытии окна визарда !!!

    while (this.purchaseTargets.length !== 0) {
      this.purchaseTargets.removeAt(0);
    }

    this.requestInfo.controls.requestTargets = this.formBuilder.array([]);
    this.requestApprovers.reset();
    this.wizard.reset();
  }

  public onSubmit(): void {
    this.savePurchaseRequest();
    this.resetRequestPage();
  }

  /**
   * изменение видимости полей  Checkbox-ов
   */
  public onCheckboxChange(event: any, expenseItem: string): void {
    switch (expenseItem) {
      case 'company': {
        if (event.target.checked) {
          this.requestInfo.controls.expenseItemDepartment.disable();
          this.requestInfo.controls.expenseItemProject.disable();
        } else {
          this.requestInfo.controls.expenseItemDepartment.enable();
          this.requestInfo.controls.expenseItemProject.enable();
        }
        break;
      }
      case 'department': {
        this.expenseDepartmentDescriptionStatus = event.target.checked;
        this.expenseDepartmentDescriptionHelper = 'Укажите наименование подразделения.';
        if (event.target.checked) {
          this.requestInfo.controls.expenseDepartmentDescription.setValidators(Validators.required);
          this.requestInfo.controls.expenseItemCompany.disable();
          this.requestInfo.controls.expenseItemProject.disable();
        } else {
          this.requestInfo.controls.expenseDepartmentDescription.clearValidators();
          this.requestInfo.controls.expenseItemCompany.enable();
          this.requestInfo.controls.expenseItemProject.enable();
          this.requestInfo.controls.expenseDepartmentDescription.reset();
          this.requestInfo.controls.expenseItemDepartment.setValue(null);
        }
        this.requestInfo.controls.expenseDepartmentDescription.updateValueAndValidity();
        break;
      }
      case 'project': {
        this.expenseProjectDescriptionStatus = event.target.checked;
        this.expenseProjectDescriptionHelper = 'Укажите наименование проекта.';

        if (event.target.checked) {
          this.requestInfo.controls.expenseProjectDescription.setValidators(Validators.required);
          this.requestInfo.controls.expenseItemCompany.disable();
          this.requestInfo.controls.expenseItemDepartment.disable();
        } else {
          this.requestInfo.controls.expenseProjectDescription.clearValidators();
          this.requestInfo.controls.expenseItemCompany.enable();
          this.requestInfo.controls.expenseItemDepartment.enable();
          this.requestInfo.controls.expenseProjectDescription.reset();
          this.requestInfo.controls.expenseItemProject.setValue(null);
        }
        this.requestInfo.controls.expenseProjectDescription.updateValueAndValidity();
        break;
      }

      case 'ito': {
        if (event.target.checked) {
          this.requestInfo.controls.purchaseLogisticDepartment.disable();
        } else {
          this.requestInfo.controls.purchaseLogisticDepartment.enable();
        }
        this.requestInfo.controls.purchaseLogisticDepartment.reset();
        break;
      }
      case 'logistic': {
        if (event.target.checked) {
          this.requestInfo.controls.purchaseITDepartment.disable();
        } else {
          this.requestInfo.controls.purchaseITDepartment.enable();
        }
        this.requestInfo.controls.purchaseITDepartment.reset();
        break;
      }

      default: {
        break;
      }
    }
  }

  // eslint-disable-next-line class-methods-use-this
  public displayFn(respPerson: any) {
    return respPerson || null;
  }

  public setResponsiblePerson(person: any): void {
    this.responsiblePerson = person;
  }

  public savePurchaseRequest(): void {
    this.isConfirmModalVisible = false;
    let expenseItem: any;
    if (this.requestInfo.controls.expenseItemCompany.value) expenseItem = { expenseItem: 'company' };
    else if (this.requestInfo.controls.expenseItemDepartment.value)
      expenseItem = { expenseItem: 'department', expenseItemDescription: this.requestInfo.controls.expenseDepartmentDescription.value };
    else expenseItem = { expenseItem: 'project', expenseItemDescription: this.requestInfo.controls.expenseProjectDescription.value };

    const purchaseTargetItemsArray: { id: number; item: string }[] = [];
    // const purchaseTargetItems = { id: null as number, item: '' };
    let i = 0;
    this.purchaseTargets.value.forEach((itemValue: any) => {
      const purchaseTargetItems = { id: null as number, item: '' };
      purchaseTargetItems.id = i;
      purchaseTargetItems.item = itemValue.target;
      purchaseTargetItemsArray.push(purchaseTargetItems);
      i += 1;
    });

    this.purchaseRequestAllData = {
      purchaseAuthorIdId: this.currentUser.id,
      purchaseTarget: JSON.stringify(purchaseTargetItemsArray),
      responsiblePersonId: this.responsiblePerson ? this.responsiblePerson.id : 0,
      expenseItem,
      purchaseReason: this.requestInfo.controls.purchaseReason.value,
      purchaseDepartment: this.requestInfo.controls.purchaseITDepartment.value ? 'ito' : 'logistic',
      purchaseRequestStatus: 1,
      // requestAuthorName: this.requestAuthor.controls.requestAuthorName.value,
      // requestAuthorPosition: this.requestAuthor.controls.requestAuthorPosition.value,
    };
    this.wsService.send('purchaseRequestAsDraft', this.purchaseRequestAllData);
    this.resetRequestPage();
  }
}
