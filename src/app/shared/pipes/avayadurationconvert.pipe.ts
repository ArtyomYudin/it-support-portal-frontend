import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'avayaDurationConvert',
  standalone: true,
})
export class AvayaDurationConvertPipe implements PipeTransform {
  public transform(value: number): string {
    const h = Math.floor(value / 3600);
    const m = Math.floor((value % 3600) / 60);
    const s = Math.floor((value % 3600) % 60);

    // var hDisplay = h > 0 ? h + (h == 1 ? ' hour, ' : ' hours, ') : '';
    // var mDisplay = m > 0 ? m + (m == 1 ? ' minute, ' : ' minutes, ') : '';
    // var sDisplay = s > 0 ? s + (s == 1 ? ' second' : ' seconds') : '';
    const hDisplay = h > 0 ? `${h} ч. ` : '';
    const mDisplay = m > 0 ? `${m} мин. ` : '';
    const sDisplay = s > 0 ? `${s} сек.` : '';
    return hDisplay + mDisplay + sDisplay;
  }
}
