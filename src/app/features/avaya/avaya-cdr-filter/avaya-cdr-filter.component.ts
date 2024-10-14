import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ClarityModule } from '@clr/angular';
import { NgFor, AsyncPipe } from '@angular/common';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { WebsocketService } from '@service/websocket.service';
import { AvayaCDRService } from '@service/avaya.cdr.service';

@Component({
  selector: 'fe-avaya-cdr-filter',
  standalone: true,
  imports: [ClarityModule, ReactiveFormsModule, MatAutocompleteModule, NgFor, AsyncPipe],
  templateUrl: './avaya-cdr-filter.component.html',
  styleUrls: ['./avaya-cdr-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvayaCDRFilterComponent implements OnInit, OnDestroy {
  public periods: any[] = [
    { name: '1 час', value: 1 },
    { name: '6 часов', value: 6 },
    { name: '1 день', value: 24 },
    // { name: '2 дня', value: 48 },
    // { name: '3 дня', value: 72 },
    // { name: '1 неделя', value: 168 },
    // { name: '2 недели', value: 336 },
    // { name: '30 дней', value: 720 },
    // { name: '90 дней', value: 2160 },
    // { name: '180 дней', value: 4320 },
  ];

  public avayaFilter: FormGroup;

  public avayaFilterCriteria: any;

  private loadStatus: boolean;

  private reloadAvayaCDR: any;

  constructor(private formBuilder: FormBuilder, private wsService: WebsocketService, private avayaCDRService: AvayaCDRService) {}

  ngOnInit(): void {
    // this.avayaCDRService.currentCDRLoadStatus.subscribe(loadStatus => (this.loadStatus = false));
    this.avayaFilter = this.formBuilder.group({
      avayaViewPeriod: [{ name: '6 часов', value: 6 }],
    });
    this.avayaFilterCriteria = { period: 6 };
    this.wsService.send('getAvayaCDR', 6);
    this.avayaCDRService.sendStatus(true);
    this.wsService.send('getAvayaCDR', this.avayaFilter.controls.avayaViewPeriod.value.value);
    this.reloadAvayaCDR = setInterval(() => {
      this.wsService.send('getAvayaCDR', this.avayaFilter.controls.avayaViewPeriod.value.value);
    }, 60000);
  }

  ngOnDestroy(): void {
    clearInterval(this.reloadAvayaCDR);
  }

  public onFilterPeriodChange(event: any) {
    if (event.isUserInput) {
      // console.log(event);
      this.wsService.send('getAvayaCDR', event.source.value.value);
      this.avayaCDRService.sendStatus(true);
      // event.source.close();
    }
  }

  public displayFn(period: any) {
    if (period) {
      return period.name;
    }
  }
}
