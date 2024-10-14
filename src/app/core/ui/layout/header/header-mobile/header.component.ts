import { Component, Input } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
// import { map, takeUntil } from 'rxjs/operators';
// import { Subject } from 'rxjs';

import { ClarityModule } from '@clr/angular';
import { NgIf } from '@angular/common';
import { AuthenticationService } from '@service/auth.service';
import { AuthUser } from '@model/auth-user.model';

import { ThumbnailPhotoPipe } from '@pipe/thumbnailphoto.pipe';

@Component({
  selector: 'fe-header-mobile',
  standalone: true,
  imports: [ClarityModule, RouterModule, ThumbnailPhotoPipe, NgIf],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderMobileComponent {
  @Input() currentUser: AuthUser;
  // public currentUser: AuthUser;

  // public clock = interval(1000).pipe(map(() => new Date()));

  // private ngUnsubscribe$: Subject<any> = new Subject();

  constructor(private router: Router, private authenticationService: AuthenticationService) {
    // this.authenticationService.currentUser$.pipe(takeUntil(this.ngUnsubscribe$)).subscribe(x => {
    //   this.currentUser = x;
    // });
    // this.sessionCheckService.isActivateStatus
    //     .pipe(takeUntil(this.ngUnsubscribe))
    //     .subscribe(
    //       isExpired => {
    //         console.log('Resived !')
    //         isExpired ? null : this.onLogout()
    //       });}
  }

  // ngOnInit(): void {}

  // public ngOnDestroy(): void {
  // this.ngUnsubscribe$.next(null);
  // this.ngUnsubscribe$.complete();
  // }

  public onLogout(): void {
    this.authenticationService.logout();
    this.router.navigate(['/login']);
  }

  public isAdmin(): boolean {
    // console.log(JSON.parse(this.currentUser.accessRole));
    // return JSON.parse(this.currentUser.accessRole).admin === 1;
    return true;
  }
}
