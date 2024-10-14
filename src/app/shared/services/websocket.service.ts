import { Injectable, OnDestroy } from '@angular/core';
// import { Observable } from 'rxjs/internal/Observable';
import { Observable, Subject, interval, ReplaySubject } from 'rxjs';
import { SubscriptionLike, Observer } from 'rxjs/internal/types';
// import { Subject } from 'rxjs/internal/Subject';
// import { share } from 'rxjs/internal/operators/share';
import { share, filter, map, takeWhile, distinctUntilChanged } from 'rxjs/operators';
// import { distinctUntilChanged } from 'rxjs/internal/operators/distinctUntilChanged';
// import { filter } from 'rxjs/internal/operators/filter';
// import { map } from 'rxjs/internal/operators/map';
// import { interval } from 'rxjs/internal/observable/interval';
// import { takeWhile } from 'rxjs/internal/operators/takeWhile';

import { WebSocketSubject, WebSocketSubjectConfig } from 'rxjs/webSocket';
import { environment } from 'src/environments/environment';

export interface IWebsocketService {
  status: Observable<boolean>;
  on<T>(event: string): Observable<T>;
  send(event: string, data: any): void;
}

/*
export interface IWebSocketConfig {
  url: string;
  reconnectInterval?: number;
  reconnectAttempts?: number;
}
*/

export interface IwsMessage<T> {
  event: string;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class WebsocketService implements IWebsocketService, OnDestroy {
  public status: Observable<boolean>;

  private config: WebSocketSubjectConfig<IwsMessage<any>>;

  private websocketSub: SubscriptionLike;

  private statusSub: SubscriptionLike;

  private reconnection$: Observable<number>;

  private websocket$: WebSocketSubject<IwsMessage<any>>;

  private connection$: Observer<boolean>;

  private wsMessages$: Subject<IwsMessage<any>>;

  private reconnectInterval: number;

  private reconnectAttempts: number;

  private isConnected: boolean;

  constructor() {
    this.wsMessages$ = new Subject<IwsMessage<any>>();

    this.reconnectInterval = 5000; // pause between connections
    this.reconnectAttempts = 200; // number of connection attempts

    this.config = {
      url: `wss://${environment.apiHost}:${environment.apiPort}`,
      closeObserver: {
        next: (event: CloseEvent) => {
          this.websocket$ = null;
          this.connection$.next(false);
        },
      },
      openObserver: {
        next: (event: Event) => {
          console.log('WebSocket connected!');
          this.connection$.next(true);
        },
      },
    };

    // connection status
    this.status = new Observable<boolean>(observer => {
      this.connection$ = observer;
    }).pipe(
      share({
        connector: () => new ReplaySubject(1),
        resetOnError: false,
        resetOnComplete: false,
        resetOnRefCountZero: false,
      }),
      distinctUntilChanged(),
    );

    // run reconnect if not connection
    this.statusSub = this.status.subscribe(isConnected => {
      this.isConnected = isConnected;

      if (!this.reconnection$ && typeof isConnected === 'boolean' && !isConnected) {
        this.reconnect();
      }
    });

    this.websocketSub = this.wsMessages$.subscribe(null, (error: ErrorEvent) => console.log('WebSocket error!', error));

    this.connect();
  }

  public ngOnDestroy(): void {
    this.websocketSub.unsubscribe();
    this.statusSub.unsubscribe();
  }

  /*
   * on message event
   * */
  public on<T>(event: string): Observable<T> {
    if (event) {
      return this.wsMessages$.pipe(
        filter((message: IwsMessage<T>) => message.event === event),
        map((message: IwsMessage<T>) => message.data),
      );
    }
    return null;
  }

  /*
   * on message to server
   * */
  public send(event: string, data: any = {}): void {
    if (event && this.isConnected) {
      // this.websocket$.next(JSON.stringify({ event, data }) as any);
      this.websocket$.next({ event, data } as any);
    } else {
      console.log('Send error!');
    }
  }

  /*
   * connect to WebSocked
   * */
  private connect(): void {
    this.websocket$ = new WebSocketSubject(this.config);

    this.websocket$.subscribe({
      next: message => this.wsMessages$.next(message),
      error: () => {
        if (!this.websocket$) {
          // run reconnect if errors
          this.reconnect();
        }
      },
      complete: null,
    });
  }

  /*
   * reconnect if not connecting or errors
   * */
  private reconnect(): void {
    this.reconnection$ = interval(this.reconnectInterval).pipe(takeWhile((v, index) => index < this.reconnectAttempts && !this.websocket$));

    this.reconnection$.subscribe({
      next: () => this.connect(),
      error: null,
      complete: () => {
        // Subject complete if reconnect attemts ending
        this.reconnection$ = null;

        if (!this.websocket$) {
          this.wsMessages$.complete();
          this.connection$.complete();
        }
      },
    });
  }
}
