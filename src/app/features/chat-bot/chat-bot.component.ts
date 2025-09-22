import {
  Component,
  signal,
  WritableSignal,
  ViewChild,
  ElementRef,
  AfterViewChecked
} from '@angular/core';
import { NgForOf, NgIf } from '@angular/common';
import { ChatService, ChatMessage } from '@service/chat-bot.service';
import {MarkdownComponent} from "ngx-markdown";

@Component({
  selector: 'fe-chat-bot',
  standalone: true,
  templateUrl: './chat-bot.component.html',
  imports: [NgForOf, NgIf, MarkdownComponent],
  styleUrls: ['./chat-bot.component.scss']
})
export class ChatBotComponent implements AfterViewChecked {
  isOpen = signal(false);

  messages: WritableSignal<{ text: string; from: 'user' | 'bot' }[]> = signal([
    { text: 'Привет! Я ваш виртуальный помощник 😊', from: 'bot' }
  ]);

  isTyping = signal(false);

  @ViewChild('chatBody') chatBody!: ElementRef<HTMLDivElement>;

  constructor(private chatService: ChatService) {}

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  toggleChat() {
    this.isOpen.set(!this.isOpen());
  }

  async sendMessage(text: string) {
  if (!text.trim()) return;

  // добавляем сообщение пользователя
  this.messages.update(msgs => [...msgs, { text, from: 'user' }]);

  // добавляем пустое сообщение для бота
  this.messages.update(msgs => [...msgs, { text: '', from: 'bot' }]);

  let botReply = '';
  this.isTyping.set(true);

  try {
    await this.chatService.askStream(
      text,
      'api',
      chunk => {
        botReply += chunk;
        this.messages.update(msgs => {
          const updated = [...msgs];
          updated[updated.length - 1] = { text: botReply, from: 'bot' };
          return updated;
        });
      },
      () => this.isTyping.set(false)
    );
  } catch (err) {
    console.error('Ошибка при стриме', err);
    this.messages.update(msgs => [
      ...msgs,
      { text: '⚠️ Ошибка при получении ответа от сервера', from: 'bot' }
    ]);
    this.isTyping.set(false);
  }
}

  private scrollToBottom() {
    if (this.chatBody) {
      this.chatBody.nativeElement.scrollTop =
        this.chatBody.nativeElement.scrollHeight;
    }
  }
}
