import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { Subject } from 'rxjs/internal/Subject';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Chart, registerables } from 'chart.js';
import { WebsocketService } from '@service/websocket.service';
import { Event } from '@service/websocket.service.event';
import { SubscriptionLike } from 'rxjs/internal/types';

import { ClarityModule } from '@clr/angular';

Chart.register(...registerables);

@Component({
  selector: 'fe-home-chart-hardware',
  standalone: true,
  imports: [ClarityModule],
  templateUrl: './hardware.component.html',
  styleUrls: ['../../home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HardwareChartComponent implements OnInit, OnDestroy {
  @ViewChild('hwAlarmChart', { static: true }) public refHWAlarmChart: ElementRef;

  public hwGroupAlarmListArray$: Observable<any>;

  public hwGroupAlarmSubscription: SubscriptionLike;

  private hwAlarmChart: any;

  private hwAlarmLabel: any = ['Сбоев'];

  private hwAlarmValue: any = [0];

  private ngUnsubscribe$: Subject<any> = new Subject();

  constructor(private wsService: WebsocketService) {
    this.hwGroupAlarmListArray$ = this.wsService
      .on<any>(Event.EV_HARDWARE_GROUP_ALARM)
      .pipe(distinctUntilChanged(), takeUntil(this.ngUnsubscribe$));
  }

  ngOnInit(): void {
    this.createHWAlarmChart();
    this.hwGroupAlarmSubscription = this.hwGroupAlarmListArray$.subscribe(groupAlarm => {
      this.hwAlarmLabel.length = 0;
      this.hwAlarmValue.length = 0;
      groupAlarm.forEach((group: { group: any; count: any }) => {
        if (group.count !== 0) {
          this.hwAlarmLabel.push(group.group);
          this.hwAlarmValue.push(group.count);
        }
      });
      this.hwAlarmChart.options.plugins.centerText.text = this.hwAlarmValue.reduce((sum: any, elem: any) => {
        return sum + elem;
      }, 0);
      this.hwAlarmChart.update('none');
    });
  }

  public ngOnDestroy(): void {
    this.ngUnsubscribe$.next(null);
    this.ngUnsubscribe$.complete();
    this.hwGroupAlarmSubscription.unsubscribe();
    this.hwAlarmChart.destroy();
  }

  private centerTextPlugin = {
    id: 'centerText',
    beforeDraw(chart: any, args: any, options: any) {
      // Get ctx from string
      const { ctx } = chart;
      ctx.save();
      // Get options from the center object in options

      const fontStyle = options.fontStyle || 'Arial';
      const txt = options.text;
      const color = options.color || '#000';
      const sidePadding = options.sidePadding || 20;
      const sidePaddingCalculated = (sidePadding / 100) * (chart.innerRadius * 2);
      // Start with a base font of 30px
      ctx.font = `30px ${fontStyle}`;

      // Get the width of the string and also the width of the element minus 10 to give it 5px side padding
      const stringWidth = ctx.measureText(txt).width;
      const elementWidth = chart.innerRadius * 2 - sidePaddingCalculated;

      // Find out how much the font can grow in width.
      const widthRatio = elementWidth / stringWidth;
      const newFontSize = Math.floor(30 * widthRatio);
      const elementHeight = chart.innerRadius * 2;

      // Pick a new font size so it will not be larger than the height of label.
      const fontSizeToUse = Math.min(newFontSize, elementHeight);

      // Set font settings to draw it correctly.
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
      const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;
      ctx.font = `${fontSizeToUse}px ${fontStyle}`;
      ctx.fillStyle = color;

      // Draw text in center
      ctx.fillText(txt, centerX, centerY);
      ctx.restore();
    },
  };

  private createHWAlarmChart() {
    const hwAlarmChart = this.refHWAlarmChart.nativeElement;
    const ctx = hwAlarmChart.getContext('2d');
    this.hwAlarmChart = new Chart(ctx, {
      type: 'doughnut', // this denotes tha type of chart

      data: {
        // values on X-Axis
        labels: this.hwAlarmLabel,
        datasets: [
          {
            data: this.hwAlarmValue,
            backgroundColor: [
              'hsl(198, 100%, 24%)',
              'hsl(14, 91%, 55%)',
              'hsl(198, 100%, 41%)',
              'hsl(198, 100%, 34%))',
              'hsl(14, 83%, 84%)',
              'hsl(198, 57%, 85%)',
            ],
          },
        ],
      },
      plugins: [this.centerTextPlugin],
      options: {
        aspectRatio: 2.5,
        // responsive: true,
        cutout: 40,
        plugins: {
          legend: {
            display: true,
            position: 'left',
            labels: {
              filter: (legendItem, data) => {
                const label = legendItem.text;
                const labelIndex = data.labels.findIndex(labelName => labelName === label);
                const qtd = data.datasets[0].data[labelIndex];
                legendItem.text = `${legendItem.text} : ${qtd}`;
                // return (qtd !=='0')?true:false;
                return true;
              },
              font: {
                family: "'Metropolis','Avenir Next','Helvetica Neue','Arial','sans-serif'",
                size: 13,
                weight: '500',
              },
            },
          },
          title: {
            display: false,
          },
          centerText: {
            text: this.hwAlarmValue[0],
            color: 'red',
            fontStyle: "'Metropolis','Avenir Next','Helvetica Neue','Arial','sans-serif'",
            sidePadding: 20,
          },
        },
      },
    });
  }
}
