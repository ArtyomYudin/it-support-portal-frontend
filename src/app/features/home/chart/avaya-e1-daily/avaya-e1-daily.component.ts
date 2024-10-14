import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
// import { Observable } from 'rxjs/internal/Observable';
// import { Subject } from 'rxjs/internal/Subject';
// import { distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Chart, registerables } from 'chart.js';
// import { WebsocketService } from '@service/websocket.service';
// import { Event } from '@service/websocket.service.event';
// import { SubscriptionLike } from 'rxjs/internal/types';

import { ClarityModule } from '@clr/angular';

Chart.register(...registerables);

@Component({
  selector: 'fe-home-chart-avaya-e1-daily',
  standalone: true,
  imports: [ClarityModule],
  templateUrl: './avaya-e1-daily.component.html',
  styleUrls: ['../../home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvayaE1DailyChartComponent implements OnInit, OnDestroy {
  @ViewChild('avayaE1DailyChart', { static: true }) public refAvayaE1DailyChart: ElementRef;

  private avayaE1DailyChart: any;

  private avayaE1DailyChannel: any = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0, 1, 2, 3, 4, 5, 6, 7, 8,
    9, 10, 11, 12, 13, 14, 15,
  ];

  constructor() {}

  ngOnInit(): void {
    this.createAvayaE1DailyChart();
  }

  public ngOnDestroy(): void {
    // this.ngUnsubscribe$.next(null);
    // this.ngUnsubscribe$.complete();
  }

  private createAvayaE1DailyChart() {
    const avayaE1DailyChart = this.refAvayaE1DailyChart.nativeElement;
    const ctx = avayaE1DailyChart.getContext('2d');
    this.avayaE1DailyChart = new Chart(ctx, {
      type: 'line',
      data: {
        // values on X-Axis
        // labels: ['Свободные', 'Занятые'],
        labels: [
          '8:00',
          '8:30',
          '09:00',
          '09:30',
          '10:00',
          '10:30',
          '11:00',
          '11:30',
          '12:00',
          '12:30',
          '13:00',
          '13:30',
          '14:00',
          '14:30',
          '15:00',
          '15:30',
          '16:00',
          '16:30',
          '17:00',
          '17:30',
          '18:00',
          '18:30',
          '19:00',
          '19:30',
          '20:00',
          '20:30',
          '21:00',
          '21:30',
          '22:00',
          '22:30',
          '23:00',
          '23:30',
        ],
        datasets: [
          {
            data: this.avayaE1DailyChannel,
            backgroundColor: 'hsl(93, 79%, 40%)',
          },
        ],
      },
      options: {
        // aspectRatio: 2.5,
        // responsive: true,
        // cutout: 40,
        layout: {
          padding: 0,
        },
        plugins: {
          legend: {
            display: false,
            position: 'left',
          },
          title: {
            display: false,
          },
        },
      },
    });
  }
}
