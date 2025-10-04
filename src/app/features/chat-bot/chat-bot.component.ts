import {
  Component,
  signal,
  WritableSignal,
  ElementRef,
  NgZone,
  DestroyRef,
  effect,
  viewChild, AfterViewInit
} from '@angular/core';
import { ChatService, ChatMessage } from '@service/chat-bot.service';
import { MarkdownComponent, MARKED_OPTIONS, MarkedOptions } from 'ngx-markdown';
import { ClrTimelineModule } from "@clr/angular";
import { SessionService } from "@service/session.service";

@Component({
  selector: 'fe-chat-bot',
  standalone: true,
  templateUrl: './chat-bot.component.html',
  imports: [MarkdownComponent, ClrTimelineModule],
  styleUrls: ['./chat-bot.component.scss'],
  providers: [
    {
      provide: MARKED_OPTIONS, // ← вот так правильно!
      useValue: {
        gfm: true,
        breaks: true,
        pedantic: false,
      } satisfies MarkedOptions // ← опционально: для type safety
    }
  ]
})

export class ChatBotComponent implements AfterViewInit{
  isOpen = signal(false);

  isTyping = signal(false);

  userScrolledUp = signal(false);

  messages: WritableSignal<ChatMessage[]> = signal([
    {id: crypto.randomUUID(), type: 'response', from: 'bot', text: 'Привет!'}
  ]);

  chatBody = viewChild.required<ElementRef<HTMLDivElement>>('chatBody');

  constructor(
    private ngZone: NgZone,
    private chatService: ChatService,
    private sessionService: SessionService,
    private destroyRef: DestroyRef // для автоматической очистки
  ) {
    // Эффект, реагирующий на открытие/закрытие чата
    effect(() => {
      const isOpen = this.isOpen();
      if (isOpen) {
        // Отложим на следующий tick, чтобы DOM точно обновился
        queueMicrotask(() => {
          try {
            const el = this.chatBody().nativeElement;
            const onScroll = () => {
              const threshold = 50;
              const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
              this.ngZone.run(() => {
                this.userScrolledUp.set(!isAtBottom);
              });
            };

            el.addEventListener('scroll', onScroll);
            // Автоматически удалим слушатель при уничтожении компонента или закрытии
            this.destroyRef.onDestroy(() => {
              el.removeEventListener('scroll', onScroll);
            });
          } catch (e) {
            console.warn('chatBody not available yet');
          }
        });
      } else {
        // При закрытии — сбросим флаг скролла
        this.userScrolledUp.set(false);
      }
    });
  }

  ngAfterViewInit() {
    // this.setupVisualViewportHandler();
  }

  // private setupVisualViewportHandler() {
  //   if (!('visualViewport' in window)) return;
  //
  //   const setVh = () => {
  //     const vh = window.visualViewport!.height * 0.01;
  //     document.documentElement.style.setProperty('--vh', `${vh}px`);
  //   };
  //
  //   // сразу выставляем
  //   setVh();
  //
  //   // обновляем при каждом ресайзе
  //   window.visualViewport!.addEventListener('resize', setVh);
  //   this.destroyRef.onDestroy(() => {
  //     window.visualViewport!.removeEventListener('resize', setVh);
  //   });
  // }

  toggleChat() {
    this.isOpen.set(!this.isOpen());
  }

  onKeyDown(event: KeyboardEvent, input: HTMLTextAreaElement) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // не перенос строки
      this.sendMessage(input.value);
      input.value = '';
      this.onInput(input); // сбросить высоту
    }
  }

  onInput(input: HTMLTextAreaElement) {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px'; // ограничение роста
  }

  async sendMessage(text: string) {
    if (!text.trim()) return;

    // добавляем сообщение пользователя
    this.messages.update(msgs => [...msgs, {id: crypto.randomUUID(), type: 'response', from: 'user', text}]);
    // Скроллим вниз СРАЗУ, чтобы показать новое сообщение
    // Используем setTimeout(0) или requestAnimationFrame, чтобы дать DOM обновиться
    setTimeout(() => {
      this.scrollToBottom();
    }, 0);

    // добавляем пустое сообщение для бота
    // this.messages.update(msgs => [...msgs, { type: 'status', from: 'bot', text: '' }]);

    let botReply = '';
    this.isTyping.set(true);

    try {
      // await this.chatService.askStream(
      //   text,
      //   'api',
      //   chunk => {
      //     botReply += chunk;
      //     this.messages.update(msgs => {
      //       const updated = [...msgs];
      //       updated[updated.length - 1] = { text: botReply, from: 'bot' };
      //       return updated;
      //     });
      //   },
      //   () => this.isTyping.set(false)
      // );
      const sessionId = this.sessionService.getSessionId(); // берём Session ID

      this.chatService.askSSE(
        text,
        sessionId,
        (msg) => {
          this.messages.update(msgs => {
            const updated = [...msgs];
            if (msg.type === 'status') {
              // статус всегда пушим отдельным сообщением
              // updated.push({ type: 'status', from: 'bot', text: msg.text });
            } else if (msg.type === 'response') {
              // response накапливаем
              const last = updated[updated.length - 1];
              if (last?.type === 'response' && last.from === 'bot') {
                updated[updated.length - 1] = {
                  ...last,
                  text: last.text + msg.text // теперь строка + строка
                };
              } else {
                updated.push({id: crypto.randomUUID(), type: 'response', from: 'bot', text: msg.text});
              }
            }
            return updated;
          });
          // После каждого чанка — скроллим вниз, НО только если пользователь не скроллил вверх
          if (!this.userScrolledUp()) {
            setTimeout(() => {
              this.scrollToBottom();
            }, 0);
          }
        },
        () => {
          this.isTyping.set(false);
          // Скроллим вниз ТОЛЬКО если пользователь не скроллил вверх
          if (!this.userScrolledUp()) {
            setTimeout(() => {
              this.scrollToBottom();
            }, 0);
          }
          // eventSource.close();
        }
      );
    } catch (err) {
      console.error('Ошибка при стриме', err);
      this.messages.update(msgs => [
        ...msgs,
        {id: crypto.randomUUID(), type: 'error', from: 'bot', text: '⚠️ Ошибка при получении ответа от сервера'}
      ]);
      this.isTyping.set(false);
    }
  }

  scrollToBottom(manual = false) {
    if (!this.chatBody) return;

    const el = this.chatBody().nativeElement;
    const threshold = 50;
    // el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    // Используем requestAnimationFrame для гарантии после рендера
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
    const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;

    // Скроллим вниз, если:
    // - мы и так внизу, ИЛИ
    // - пользователь НЕ скроллил вверх
    // if (!this.userScrolledUp()) {
    //   el.scrollTo({
    //     top: el.scrollHeight,
    //     behavior: 'smooth'
    //   });
    // }
    if (manual) {
      // сброс флага только при ручном нажатии
      this.userScrolledUp.set(false);
    }
  }

}
