import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'http://127.0.0.1:8080/ask/stream'; //  эндпоинт

  constructor(private http: HttpClient) {}

  async sendMessage(messages: ChatMessage[]): Promise<string> {
    // POST запрос к твоему API
    const response = await firstValueFrom(
      this.http.post<{ reply: string }>(this.apiUrl, { messages })
    );

    return response.reply; // предполагаем, что бэкенд возвращает { reply: '...' }
  }
}
