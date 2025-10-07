import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { Subject } from 'rxjs/internal/Subject';
import { SubscriptionLike } from 'rxjs/internal/types';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { ClarityModule } from '@clr/angular';

import { WebsocketService } from '@service/websocket.service';
import { Event } from '@service/websocket.service.event';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import { ThemeService} from "@service/theme.service";

Chart.register(...registerables);

@Component({
    selector: 'fe-home-chart-provider',
    imports: [ClarityModule],
    templateUrl: './provider.component.html',
    styleUrls: ['../..//home.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProviderChartComponent implements OnInit, OnDestroy {
  @ViewChild('providerSpeedChart', { static: true }) public refProviderSpeedChart: ElementRef;

  public providerListArray$: Observable<any>;

  // public providerInfoSubscription: SubscriptionLike;

  private providerSpeedChart: any;

  private inSpeedInfo: any = [];

  private outSpeedInfo: any = [];

  // private ngUnsubscribe$: Subject<any> = new Subject();
  private destroyRef = inject(DestroyRef);

  constructor(private wsService: WebsocketService,  private themeService: ThemeService) {
    this.providerListArray$ = this.wsService.on<any>(Event.EV_PROVIDER_INFO).pipe(
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    );
  }

  ngOnInit(): void {
    this.providerListArray$.subscribe(value => {
      this.inSpeedInfo.length = 0;
      this.outSpeedInfo.length = 0;
      this.inSpeedInfo.push(value.results.inSpeedFilanco, value.results.inSpeedErTelecom100, value.results.inSpeedErTelecom200);
      this.outSpeedInfo.push(value.results.outSpeedFilanco, value.results.outSpeedErTelecom100, value.results.outSpeedErTelecom200);
      this.providerSpeedChart.update('none');
      // console.log(this.inSpeedInfo);
      // console.log(this.outSpeedInfo);
    });
    // Подписка на смену темы
    this.themeService.currentTheme$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.updateChartColors();
      });
    this.createProviderSpeedChart();
  }

  public ngOnDestroy(): void {
    // this.ngUnsubscribe$.next(null);
    // this.ngUnsubscribe$.complete();
    // this.providerInfoSubscription.unsubscribe();
    this.providerSpeedChart.destroy();
  }

  private updateChartColors(): void {
    if (!this.providerSpeedChart) return;
    const textColor = this.themeService.getCssVar('--clr-header-font-color');
    const successColor = this.themeService.getCssVar('--cds-alias-viz-sequential-green-600');
    const infoColor = this.themeService.getCssVar('--cds-alias-viz-sequential-blue-600');
    const gridColor = this.themeService.getCssVar('--cds-global-color-gray-400');

    // Обновляем цвета фона
    this.providerSpeedChart.data.datasets[0].backgroundColor = successColor;
    this.providerSpeedChart.data.datasets[1].backgroundColor = infoColor;

    // Обновляем опции
    const options = this.providerSpeedChart.options;
    options.plugins.datalabels.color = textColor;
    options.scales.x.ticks.color = textColor;
    options.scales.y.ticks.color = textColor;
    options.scales.x.grid.color = gridColor;
    options.scales.y.grid.color = gridColor;

    this.providerSpeedChart.update('none');
  }

  private createProviderSpeedChart() {
    const successColor = this.themeService.getCssVar('--cds-alias-viz-sequential-green-600');
    const infoColor = this.themeService.getCssVar('--cds-alias-viz-sequential-blue-600');
    const textColor = this.themeService.getCssVar('--clr-header-font-color');
    const gridColor = this.themeService.getCssVar('--cds-global-color-gray-400');

    // const gridColor = getCssVar('--cds-global-color-gray-400'); // или используйте прозрачность
    const providerSpeedChart = this.refProviderSpeedChart.nativeElement;
    const ctx = providerSpeedChart.getContext('2d');
    this.providerSpeedChart = new Chart(ctx, {
      type: 'bar',
      data: {
        // values on X-Axis
        labels: ['Филанко', 'Эр-Телеком 100', 'Эр-Телеком 200'],
        datasets: [
          {
            label: 'Входящий траффик',
            data: this.inSpeedInfo,
            backgroundColor: successColor,
            borderWidth: 0,
          },
          {
            label: 'Исходящий траффик',
            data: this.outSpeedInfo,
            backgroundColor: infoColor,
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
            color: textColor,
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
              color: textColor,
              font: {
                family: "'Metropolis','Avenir Next','Helvetica Neue','Arial','sans-serif'",
                size: 13,
                weight: 500,
              },
            },
            grid: {
              color: gridColor,
            },
          },
          x: {
            type: 'linear',
            grace: '12%',
            ticks: {
              color: textColor,
              font: {
                family: "'Metropolis','Avenir Next','Helvetica Neue','Arial','sans-serif'",
                size: 13,
                weight: 500,
              },
            },
            grid: {
              color: gridColor,
            },
          },
        },
        aspectRatio: 2.5,
      },
    });
  }
}
