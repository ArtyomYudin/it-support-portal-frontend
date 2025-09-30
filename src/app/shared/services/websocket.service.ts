import {inject, Injectable, Input, OnDestroy} from '@angular/core';
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
import {AuthenticationService} from "@service/auth.service";

export function websocketInitializer() {
  const authService = inject(AuthenticationService);
  const wsService = inject(WebsocketService);

  return () => {
    const currentUser = authService.currentUserValue;
    if (currentUser && currentUser.token) {
      console.log('WebSocket: пользователь уже залогинен — инициализируем соединение...');
      wsService.init(currentUser.token);
    } else {
      console.log('WebSocket: пользователь не залогинен — пропускаем инициализацию.');
    }
  };
}

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

// @Injectable()

export class WebsocketService implements IWebsocketService, OnDestroy {

  public status: Observable<boolean>;

  private config: WebSocketSubjectConfig<IwsMessage<any>>;

  private websocketSub: SubscriptionLike;
  private statusSub: SubscriptionLike;

  private reconnection$: Observable<number>;
  private websocket$: WebSocketSubject<IwsMessage<any>>;
  private connection$: Observer<boolean>;
  private wsMessages$: Subject<IwsMessage<any>>;

  private reconnectInterval: number = 5000;
  private reconnectAttempts: number = 200;

  private isConnected: boolean = false;
  private isInitialized: boolean = false; // ← новый флаг

  constructor() {
    // Только базовая инициализация без token
    this.wsMessages$ = new Subject<IwsMessage<any>>();

    // connection status observable
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

    // Подписка на статус для реконнекта
    this.statusSub = this.status.subscribe(isConnected => {
      this.isConnected = isConnected;
      if (!this.reconnection$ && !isConnected) {
        this.reconnect();
      }
    });

    // Подписка на сообщения (логирование ошибок)
    this.websocketSub = this.wsMessages$.subscribe({
      error: (error: ErrorEvent) => console.log('WebSocket error!', error)
    });
  }

  public init(token: string): void {
    if (this.isInitialized) {
      console.warn('WebSocketService уже инициализирован');
      return;
    }

    this.isInitialized = true;

    // Формируем URL с токеном
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    this.config = {
      // url: `ws://${environment.apiHost}:${environment.apiPort}/${environment.WebSocketPath}?token=${token}`,
      url: `${protocol}://${environment.apiHost}:${environment.apiPort}/${environment.WebSocketPath}?token=${token}`,
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

    // Запускаем первое подключение
    this.connect();
  }

  public ngOnDestroy(): void {
    this.disconnect();
  }

  public disconnect(): void {
    if (this.websocket$) {
      this.websocket$.complete();
    }
    if (this.websocketSub) {
      this.websocketSub.unsubscribe();
    }
    if (this.statusSub) {
      this.statusSub.unsubscribe();
    }
  }

  public on<T>(event: string): Observable<T> {
    if (!event) return null;
    return this.wsMessages$.pipe(
      filter((message: IwsMessage<T>) => message.event === event),
      map((message: IwsMessage<T>) => message.data),
    );
  }

  public send(event: string, data: any = {}): void {
    if (!event || !this.isConnected || !this.websocket$) {
      console.warn('WebSocket не подключен — сообщение не отправлено:', {event, data});
      return;
    }
    this.websocket$.next({event, data} as any);
  }

  private connect(): void {
    this.websocket$ = new WebSocketSubject(this.config);

    this.websocket$.subscribe({
      next: message => this.wsMessages$.next(message),
      error: () => {
        if (!this.websocket$) {
          this.reconnect();
        }
      },
      complete: () => {
        // ничего не делаем — переподключение через reconnect()
      }
    });
  }

  private reconnect(): void {
    this.reconnection$ = interval(this.reconnectInterval).pipe(
      takeWhile((v, index) => index < this.reconnectAttempts && !this.websocket$)
    );

    this.reconnection$.subscribe({
      next: () => this.connect(),
      complete: () => {
        this.reconnection$ = null;
        if (!this.websocket$) {
          this.wsMessages$.complete();
          this.connection$.complete();
        }
      }
    });
  }
}
