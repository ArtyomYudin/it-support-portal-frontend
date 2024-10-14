import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AuthenticationService } from '@service/auth.service';
import { AuthUser } from '@model/auth-user.model';
// import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs/internal/Subject';
import { RouterModule } from '@angular/router';
import { ClarityModule } from '@clr/angular';
import { NgIf } from '@angular/common';

import { HeaderDesktopComponent } from '@core/ui/layout/header/header-desktop/header.component';

@Component({
  selector: 'fe-main',
  standalone: true,
  imports: [RouterModule, ClarityModule, NgIf, HeaderDesktopComponent],
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainComponent {
  @Input() currentUser: AuthUser;

  private ngUnsubscribe$: Subject<any> = new Subject();

  constructor(private authenticationService: AuthenticationService) {
    // this.authenticationService.currentUser$.pipe(takeUntil(this.ngUnsubscribe$)).subscribe(x => {
    //   this.currentUser = x;
    // });
  }

  // ngOnInit() {}
}
