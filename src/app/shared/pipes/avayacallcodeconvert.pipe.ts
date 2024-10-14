import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'avayaCallCodeConvert',
  standalone: true,
})
export class AvayaCallCodeConvertPipe implements PipeTransform {
  public transform(value: string, calledNumber: string, callingNumber: string): string {
    let codeDescript: string = value;
    switch (value) {
      case '0':
        codeDescript = 'Внутренний звонок';
        break;
      case '7':
        if (/^8812/.test(calledNumber)) {
          codeDescript = 'Исходящий городской';
          break;
        }
        if (/^[1-7][0-9]{6}/.test(calledNumber)) {
          codeDescript = 'Исходящий городской';
          break;
        }
        if (/^8(9\d{9})$/.test(calledNumber)) {
          codeDescript = 'Исходящий мобильный';
          break;
        }
        if (/^8800/.test(calledNumber)) {
          codeDescript = 'Исходящий бесплатный на 800';
          break;
        }
        // codeDescript = /^8800/.test(number) ? 'Исходящий бесплатный на 800' : value;
        break;
      case '9':
        if (/^55[0-9]{4}$/.test(callingNumber)) {
          codeDescript = 'Входящий ФСРАР';
          break;
        }
        if (/^55[0-9]{4}$/.test(calledNumber)) {
          codeDescript = 'Исходящий ФСРАР';
          break;
        }
        codeDescript = 'Входящий звонок';
        break;
      case 'E':
        codeDescript = 'Неправильный вызов';
        break;
      case 'C':
        codeDescript = 'Конференц‑связь';
        break;
      default:
        codeDescript = value;
        break;
    }
    return codeDescript;
  }
}
