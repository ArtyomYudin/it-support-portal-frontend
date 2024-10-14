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
  selector: 'fe-home-chart-avaya-e1',
  standalone: true,
  imports: [ClarityModule],
  templateUrl: './avaya-e1.component.html',
  styleUrls: ['../../home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvayaE1ChartComponent implements OnInit, OnDestroy {
  @ViewChild('avayaE1Chart', { static: true }) public refAvayaE1Chart: ElementRef;

  public avayaE1ListArray$: Observable<any>;

  public avayaE1InfoSubscription: SubscriptionLike;

  private avayaE1Chart: any;

  private avayaE1Channel: any = [60, 0];

  private ngUnsubscribe$: Subject<any> = new Subject();

  constructor(private wsService: WebsocketService) {
    this.avayaE1ListArray$ = this.wsService.on<any>(Event.EV_AVAYA_E1_INFO).pipe(distinctUntilChanged(), takeUntil(this.ngUnsubscribe$));
  }

  ngOnInit(): void {
    this.createAvayaE1Chart();
    this.avayaE1InfoSubscription = this.avayaE1ListArray$.subscribe(value => {
      this.avayaE1Channel.length = 0;
      this.avayaE1Channel.push(value.allChannel - value.activeChannel, value.activeChannel);
      this.avayaE1Chart.options.plugins.centerText.text = value.activeChannel;
      this.avayaE1Chart.update('none');
    });
  }

  public ngOnDestroy(): void {
    this.ngUnsubscribe$.next(null);
    this.ngUnsubscribe$.complete();

    this.avayaE1InfoSubscription.unsubscribe();
    this.avayaE1Chart.destroy();
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

  private createAvayaE1Chart() {
    const avayaE1Chart = this.refAvayaE1Chart.nativeElement;
    const ctx = avayaE1Chart.getContext('2d');
    this.avayaE1Chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        // values on X-Axis
        labels: ['Свободные', 'Занятые'],
        datasets: [
          {
            data: this.avayaE1Channel,
            backgroundColor: ['hsl(93, 79%, 40%)', 'hsl(48, 94%, 57%)'],
          },
        ],
      },
      plugins: [this.centerTextPlugin],
      options: {
        aspectRatio: 2.5,
        // responsive: true,
        cutout: 40,
        layout: {
          padding: 0,
        },
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
            text: this.avayaE1Channel[1],
            color: 'red',
            fontStyle: "'Metropolis','Avenir Next','Helvetica Neue','Arial','sans-serif'",
            sidePadding: 20,
          },
        },
      },
    });
  }
}
