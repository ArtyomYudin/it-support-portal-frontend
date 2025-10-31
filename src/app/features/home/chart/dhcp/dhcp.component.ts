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
import { Chart, registerables } from "chart.js";
import { ClarityModule } from "@clr/angular";
import { WebsocketService } from "@service/websocket.service";
import { ThemeService } from "@service/theme.service";
import { Event } from "@service/websocket.service.event";
import { distinctUntilChanged, map } from "rxjs/operators";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Observable } from "rxjs/internal/Observable";
import ChartDataLabels from "chartjs-plugin-datalabels";

Chart.register(...registerables);

@Component({
  selector: 'fe-home-chart-dhcp',
  imports: [ClarityModule],
  templateUrl: './dhcp.component.html',
  styleUrl: '../../home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DhcpChartComponent implements OnInit, OnDestroy {
  @ViewChild('dhcpScopeChart', {static: true}) public refDhcpScopeChart: ElementRef;

  public dhcpScopesArray$: Observable<any>;
  private destroyRef = inject(DestroyRef);
  private dhcpScopeChart: any;
  private addressesFree: any = []
  private addressesInUse: any = []
  private reservedAddress: any =[]
  private scopeLabels: string[] = [];

  constructor(private wsService: WebsocketService, private themeService: ThemeService) {
    this.dhcpScopesArray$ = this.wsService.on<any>(Event.EV_DHCP_STATISTICS).pipe(
      map(res => res?.results || []),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    );
  }

  ngOnInit(): void {
    this.dhcpScopesArray$.subscribe(scopes => {
      // Очистка текущих данных
      this.scopeLabels.length = 0;
      this.addressesFree.length = 0;
      this.addressesInUse.length = 0;
      this.reservedAddress.length = 0;
      // Заполнение данных из полученных scope'ов
      scopes.forEach((scope: { scopeId: any; available: any; inUse: any; reservedAddress: any; }) => {
        this.scopeLabels.push(scope.scopeId || 'Без имени'); // или другое поле, например IP диапазона
        this.addressesFree.push(scope.available || 0);
        this.addressesInUse.push(scope.inUse || 0);
        this.reservedAddress.push(scope.reservedAddress || 0);
      });
      // Обновление данных графика
      this.dhcpScopeChart.update('none')
    });
    this.themeService.currentTheme$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.updateChartColors();
      });
    this.createDhcpScopeChart();
  }

  public ngOnDestroy(): void {
    if (this.dhcpScopeChart) {
        this.dhcpScopeChart.destroy();
    }
  }

  private updateChartColors() {
    if (!this.dhcpScopeChart) return;
    const freeColor = this.themeService.getCssVar('--cds-alias-viz-sequential-green-600');
    const inUseColor = this.themeService.getCssVar('--cds-alias-viz-sequential-blue-600');
    const reservedColor = this.themeService.getCssVar('--cds-alias-viz-sequential-ochre-600'); // для зарезервированных
    const textColor = this.themeService.getCssVar('--clr-header-font-color');

    // Обновляем цвета фона
    this.dhcpScopeChart.data.datasets[0].backgroundColor = freeColor;
    this.dhcpScopeChart.data.datasets[1].backgroundColor = inUseColor;
    this.dhcpScopeChart.data.datasets[2].backgroundColor = reservedColor;

    // Обновляем опции
    const options = this.dhcpScopeChart.options;
    options.plugins.legend.labels.color = textColor;
    options.scales.x.ticks.color = textColor;
    options.scales.y.ticks.color = textColor;

    this.dhcpScopeChart.update('none');
  }

  private createDhcpScopeChart(): void {
    const freeColor = this.themeService.getCssVar('--cds-alias-viz-sequential-green-600');
    const inUseColor = this.themeService.getCssVar('--cds-alias-viz-sequential-blue-600');
    const reservedColor = this.themeService.getCssVar('--cds-alias-viz-sequential-ochre-600'); // для зарезервированных
    const textColor = this.themeService.getCssVar('--clr-header-font-color');

    const dhcpScopeChart = this.refDhcpScopeChart.nativeElement;
    const ctx = dhcpScopeChart.getContext('2d');
    this.dhcpScopeChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.scopeLabels,
        datasets: [
          {
            label: 'Свободно',
            data: this.addressesFree,
            backgroundColor: freeColor,
            borderWidth: 0,
          },
          {
            label: 'Используется',
            data: this.addressesInUse,
            backgroundColor: inUseColor,
            borderWidth: 0,
          },
          {
            label: 'Зарезервировано',
            data: this.reservedAddress,
            backgroundColor: reservedColor,
            borderWidth: 0,
          },
        ],
      },
      plugins: [ChartDataLabels],
      options: {
        // indexAxis: 'y', // делает диаграмму горизонтальной
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            // position: 'bottom',
            labels: {
              color: textColor,
              boxWidth: 12,        // уменьшить квадратик цвета
              padding: 8,          // уменьшить отступы между элементами
              font: {
                size: 10,           // чуть меньше шрифт
                family: "'Metropolis','Avenir Next','Helvetica Neue','Arial',sans-serif",
              },
              usePointStyle: false // или true для точек вместо квадратов (может быть компактнее)
            }
          },
          datalabels: {
            color: textColor,
            display: false,
            font: {
              size: 10,
              family: "'Metropolis','Avenir Next','Helvetica Neue','Arial',sans-serif",
              weight: 400,
            },
          }
        },
        scales: {
          x: {
            stacked: true,
            ticks: {
              color: textColor,
              font: {
                family: "'Metropolis','Avenir Next','Helvetica Neue','Arial','sans-serif'",
                size: 10,
                weight: 400,
              },
            },
          },
          y: {
            stacked: true,
            beginAtZero: true,
            title: { display: false, text: 'Количество адресов' },
          },
        },
        // aspectRatio: 2.5,
      }
    });
  }

}
