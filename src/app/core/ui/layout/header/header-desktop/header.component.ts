import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
// import { Subject } from 'rxjs';
import { ClarityModule } from '@clr/angular';
import { DatePipe, AsyncPipe } from '@angular/common';
import { AuthenticationService } from '@service/auth.service';
import { AuthUser } from '@model/auth-user.model';
import { interval } from 'rxjs/internal/observable/interval';
import { ThumbnailPhotoPipe } from '@pipe/thumbnailphoto.pipe';
import {ThemeService} from "@service/theme.service";

@Component({
    selector: 'fe-header-desktop',
    imports: [ClarityModule, ThumbnailPhotoPipe, DatePipe, AsyncPipe],
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderDesktopComponent implements OnInit {
  @Input() currentUser: AuthUser;
  // public currentUser: AuthUser;

  public clock = interval(1000).pipe(map(() => new Date()));

  // private ngUnsubscribe$: Subject<any> = new Subject();

  constructor(private router: Router, private authenticationService: AuthenticationService, private themeService: ThemeService) {
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

  ngOnInit(): void {
    this.themeService.initTheme();
  }

  // public ngOnDestroy(): void {
  // this.ngUnsubscribe$.next(null);
  // this.ngUnsubscribe$.complete();
  // }

  public onLogout(): void {
    this.authenticationService.logout();
    this.router.navigate(['/login']);
  }

  toggleTheme(): void {
    console.log('switch theme');
    this.themeService.toggleTheme();
  }

  get isDarkMode(): boolean {
    return document.documentElement.classList.contains('theme-dark');
  }

  public isAdmin(): boolean {
    // console.log(JSON.parse(this.currentUser.accessRole));
    // return JSON.parse(this.currentUser.accessRole).admin === 1;
    return true;
  }
}
