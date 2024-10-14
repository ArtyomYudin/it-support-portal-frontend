import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'purchaseTarget',
})
export class PurchaseTargetPipe implements PipeTransform {
  public transform(value: any): any {
    // console.log(value.length);
    // return value.length > 1 ? value[0].item : `${value[0].item}и еще`;
    return value.length === 1 ? value[0].item : `${value[0].item} + ${value.length - 1} позиций`;
  }
}
