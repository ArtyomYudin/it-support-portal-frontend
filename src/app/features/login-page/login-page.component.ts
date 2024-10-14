import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UntypedFormGroup, UntypedFormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { first, takeUntil } from 'rxjs/operators';

import { ClarityModule } from '@clr/angular';

import { NgIf } from '@angular/common';

import { AuthenticationService } from '@service/auth.service';

@Component({
  selector: 'fe-login-page',
  standalone: true,
  imports: [ClarityModule, ReactiveFormsModule, NgIf],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class LoginPageComponent implements OnInit, OnDestroy {
  public submitted = false;

  public loading = false;

  public error = '';

  public loginForm!: UntypedFormGroup;

  private ngUnsubscribe$: Subject<any> = new Subject();

  private returnUrl!: string;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private cdRef: ChangeDetectorRef,
    private authenticationService: AuthenticationService,
  ) {}

  public ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      userPrincipalName: ['', Validators.required],
      password: ['', Validators.required],
    });

    // reset login status
    this.authenticationService.logout();

    // get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams.returnUrl || '/';
  }

  public ngOnDestroy(): void {
    this.ngUnsubscribe$.next(null);
    this.ngUnsubscribe$.complete();
  }

  // convenience getter for easy access to form fields
  get f(): any {
    return this.loginForm.controls;
  }

  public onSubmit(): void {
    this.error = '';
    this.submitted = true;

    // stop here if form is invalid
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.authenticationService
      .login(this.f.userPrincipalName.value, this.f.password.value)
      .pipe(first(), takeUntil(this.ngUnsubscribe$))
      .subscribe(
        () => {
          this.router.navigate([this.returnUrl]);
        },
        (error: string) => {
          this.error = error;
          this.loading = false;
          this.cdRef.markForCheck();
        },
      );
  }
}
