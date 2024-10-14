import { Component, OnDestroy } from '@angular/core';
import { takeUntil, share, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs/internal/Subject';
import { NgIf } from '@angular/common';
import { ClarityModule } from '@clr/angular';
import { WebsocketService } from '@service/websocket.service';
import { AuthenticationService } from '@service/auth.service';
import { AuthUser } from '@model/auth-user.model';

import { MainComponent } from '@core/ui/layout/main/main.component';
import { HeaderMobileComponent } from '@core/ui/layout/header/header-mobile/header.component';

@Component({
  selector: 'fe-layout',
  standalone: true,
  imports: [ClarityModule, NgIf, MainComponent, HeaderMobileComponent],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnDestroy {
  public isConnected: boolean;

  public currentUser: AuthUser;

  private ngUnsubscribe$: Subject<any> = new Subject();

  constructor(private wsService: WebsocketService, private authenticationService: AuthenticationService) {
    this.wsService.status.pipe(share(), distinctUntilChanged(), takeUntil(this.ngUnsubscribe$)).subscribe(isConnected => {
      this.isConnected = isConnected;
    });
    this.authenticationService.currentUser$.pipe(takeUntil(this.ngUnsubscribe$)).subscribe(x => {
      this.currentUser = x;
    });
  }

  // ngOnInit(): void {}

  public ngOnDestroy() {
    this.ngUnsubscribe$.next(null);
    this.ngUnsubscribe$.complete();
  }
}
