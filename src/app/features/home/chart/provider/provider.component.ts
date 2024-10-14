import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { Subject } from 'rxjs/internal/Subject';
import { SubscriptionLike } from 'rxjs/internal/types';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { ClarityModule } from '@clr/angular';

import { WebsocketService } from '@service/websocket.service';
import { Event } from '@service/websocket.service.event';

Chart.register(...registerables);

@Component({
  selector: 'fe-home-chart-provider',
  standalone: true,
  imports: [ClarityModule],
  templateUrl: './provider.component.html',
  styleUrls: ['../..//home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProviderChartComponent implements OnInit, OnDestroy {
  @ViewChild('providerSpeedChart', { static: true }) public refProviderSpeedChart: ElementRef;

  public providerListArray$: Observable<any>;

  public providerInfoSubscription: SubscriptionLike;

  private providerSpeedChart: any;

  private inSpeedInfo: any = [];

  private outSpeedInfo: any = [];

  private ngUnsubscribe$: Subject<any> = new Subject();

  constructor(private wsService: WebsocketService) {
    this.providerListArray$ = this.wsService.on<any>(Event.EV_PROVIDER_INFO).pipe(distinctUntilChanged(), takeUntil(this.ngUnsubscribe$));
  }

  ngOnInit(): void {
    this.providerInfoSubscription = this.providerListArray$.subscribe(value => {
      this.inSpeedInfo.length = 0;
      this.outSpeedInfo.length = 0;
      this.inSpeedInfo.push(value.inSpeedOrange, value.inSpeedTelros, value.inSpeedFilanco);
      this.outSpeedInfo.push(value.outSpeedOrange, value.outSpeedTelros, value.outSpeedFilanco);
      this.providerSpeedChart.update('none');
    });
    this.createProviderSpeedChart();
  }

  public ngOnDestroy(): void {
    this.ngUnsubscribe$.next(null);
    this.ngUnsubscribe$.complete();
    this.providerInfoSubscription.unsubscribe();
    this.providerSpeedChart.destroy();
  }

  private createProviderSpeedChart() {
    const providerSpeedChart = this.refProviderSpeedChart.nativeElement;
    const ctx = providerSpeedChart.getContext('2d');
    this.providerSpeedChart = new Chart(ctx, {
      type: 'bar',
      data: {
        // values on X-Axis
        labels: ['Orange', 'Телрос', 'Филанко'],
        datasets: [
          {
            label: 'Входящий траффик',
            data: this.inSpeedInfo,
            backgroundColor: 'hsl(93, 79%, 40%)',
            borderWidth: 0,
          },
          {
            label: 'Исходящий траффик',
            data: this.outSpeedInfo,
            backgroundColor: 'hsl(198, 66%, 57%)',
            borderWidth: 0,
          },
        ],
      },
      plugins: [ChartDataLabels],
      options: {
        indexAxis: 'y',
        elements: {
          bar: {
            borderWidth: 2,
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          datalabels: {
            anchor: 'end',
            align: 'end',
            clamp: true,
            clip: false,
            font: {
              size: 11,
            },
          },
        },
        scales: {
          y: {
            ticks: {
              font: {
                family: "'Metropolis','Avenir Next','Helvetica Neue','Arial','sans-serif'",
                size: 13,
                weight: '500',
              },
            },
          },
          x: {
            type: 'linear',
            grace: '12%',
            ticks: {
              font: {
                family: "'Metropolis','Avenir Next','Helvetica Neue','Arial','sans-serif'",
                size: 13,
                weight: '500',
              },
            },
          },
        },
        aspectRatio: 2.5,
      },
    });
  }
}
