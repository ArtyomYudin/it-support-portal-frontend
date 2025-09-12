import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'employeeName',
  standalone: true,
})
export class EmployeeNamePipe implements PipeTransform {
  public transform(value: any): any {
    if (value) {
      const array = value.split(' ');
      if (array.length === 1) {
        return `${array[0]}`;
      }
      return `${array[0]} ${array[1]?array[1].charAt(0)+".":""} ${array[2]?array[2].charAt(0)+".":""}`;
    }
    return '';
  }
}
