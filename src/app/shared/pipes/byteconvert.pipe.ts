import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'byteConvert',
  standalone: true,
})
export class ByteConvertPipe implements PipeTransform {
  public transform(value: number): string {
    if (!+value) return '0 Байт';
    // const decimals = 2;
    const k = 1024;
    // const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(value) / Math.log(k));

    return `${parseFloat((value / k ** i).toFixed(2))} ${sizes[i]}`;
  }
}
