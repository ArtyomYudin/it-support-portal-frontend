import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AuthenticationService } from '@service/auth.service';
import { AuthUser } from '@model/auth-user.model';
// import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs/internal/Subject';
import { RouterModule } from '@angular/router';
import { ClarityModule } from '@clr/angular';

import '@cds/core/icon/register.js';
import { ClarityIcons } from '@cds/core/icon';

// Импортируем целые наборы
import { loadCoreIconSet } from '@cds/core/icon';
import { loadMediaIconSet } from '@cds/core/icon';
import { loadEssentialIconSet } from '@cds/core/icon'
import { loadTechnologyIconSet } from '@cds/core/icon'
import { loadCommerceIconSet } from '@cds/core/icon'

loadCoreIconSet();
loadMediaIconSet();
loadEssentialIconSet();
loadTechnologyIconSet();
loadCommerceIconSet();


import { HeaderDesktopComponent } from '@core/ui/layout/header/header-desktop/header.component';

@Component({
    selector: 'fe-main',
    imports: [RouterModule, ClarityModule, HeaderDesktopComponent],
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
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
