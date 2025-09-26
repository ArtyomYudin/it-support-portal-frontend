import {
  Component,
  signal,
  WritableSignal,
  ViewChild,
  ElementRef,
  AfterViewChecked, AfterViewInit
} from '@angular/core';
import { NgForOf, NgIf } from '@angular/common';
import { ChatService, ChatMessage } from '@service/chat-bot.service';
import { MarkdownComponent, MARKED_OPTIONS, MarkedOptions } from 'ngx-markdown';
import {ClrTimelineModule} from "@clr/angular";
import {SessionService} from "@service/session.service";

@Component({
  selector: 'fe-chat-bot',
  standalone: true,
  templateUrl: './chat-bot.component.html',
  imports: [NgForOf, NgIf, MarkdownComponent, ClrTimelineModule],
  styleUrls: ['./chat-bot.component.scss'],
  providers: [
    {
      provide: MARKED_OPTIONS, // ← вот так правильно!
      useValue: {
        gfm: true,
        breaks: false,
        pedantic: false,
      } satisfies MarkedOptions // ← опционально: для type safety
    }
  ]
})

export class ChatBotComponent implements AfterViewChecked, AfterViewInit {
  isOpen = signal(false);

  isTyping = signal(false);

  private userScrolledUp = false;

  messages: WritableSignal<ChatMessage[]> = signal([
    { type: 'response', from: 'bot', text: 'Привет!' }
  ]);

  @ViewChild('chatBody') chatBody!: ElementRef<HTMLDivElement>;

  constructor(
    private chatService: ChatService,
    private sessionService: SessionService
  ) {}

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  ngAfterViewInit() {
    if (this.chatBody) {
      this.chatBody.nativeElement.addEventListener('scroll', () => {
        const el = this.chatBody.nativeElement;
        const threshold = 50;
        const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
        this.userScrolledUp = !isAtBottom; // если не внизу → пользователь скроллил
      });
    }
  }

  toggleChat() {
    this.isOpen.set(!this.isOpen());
  }

  async sendMessage(text: string) {
    if (!text.trim()) return;

    // добавляем сообщение пользователя
    this.messages.update(msgs => [...msgs, { type: 'response', from: 'user', text }]);

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
              updated.push({ type: 'status', from: 'bot', text: msg.text });
            } else if (msg.type === 'response') {
              // response накапливаем
              const last = updated[updated.length - 1];
              if (last?.type === 'response' && last.from === 'bot') {
                updated[updated.length - 1] = {
                  ...last,
                  text: last.text + msg.text // ✅ теперь строка + строка
              };
              } else {
                updated.push({ type: 'response', from: 'bot', text: msg.text });
              }
            }
            return updated;
          });
          this.scrollToBottom();
        },
        () => {
          this.isTyping.set(false);
          this.scrollToBottom(true);
          // eventSource.close();
        }
      );
    } catch (err) {
      console.error('Ошибка при стриме', err);
      this.messages.update(msgs => [
        ...msgs,
        { type: 'error', from: 'bot', text: '⚠️ Ошибка при получении ответа от сервера' }
      ]);
      this.isTyping.set(false);
    }
  }

 private scrollToBottom(force: boolean = false) {
    if (this.chatBody) {
      const el = this.chatBody.nativeElement;
      const threshold = 50;
      const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;

      if (isAtBottom || force || !this.userScrolledUp) {
        el.scrollTo({
          top: el.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }
}
