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

@Component({
  selector: 'fe-chat-bot',
  standalone: true,
  templateUrl: './chat-bot.component.html',
  imports: [NgForOf, NgIf],
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

    // сообщение пользователя
    this.messages.update(msgs => [...msgs, { text, from: 'user' }]);

    try {
      this.isTyping.set(true);

      // готовим историю в формате API
      const history: ChatMessage[] = this.messages().map(m => ({
        role: m.from === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      // получаем ответ с бэкенда
      const reply = await this.chatService.sendMessage(history);

      this.messages.update(msgs => [...msgs, { text: reply, from: 'bot' }]);
    } catch (err) {
      console.error('Ошибка при отправке сообщения', err);
      this.messages.update(msgs => [
        ...msgs,
        { text: '⚠️ Ошибка при получении ответа от сервера', from: 'bot' }
      ]);
    } finally {
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
