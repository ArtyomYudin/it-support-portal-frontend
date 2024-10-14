import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';

@Injectable({
  providedIn: 'root',
})
export class AvayaCDRService {
  private cdrLoadStatus = new BehaviorSubject<boolean>(true);

  currentCDRLoadStatus = this.cdrLoadStatus.asObservable();

  constructor() {}

  sendStatus(loadStatus: boolean) {
    this.cdrLoadStatus.next(loadStatus);
  }
}
