import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from 'src/environments/environment';

export type MessageType = 'status' | 'response' | 'error' | 'info';
export type MessageFrom = 'user' | 'bot';

export interface ChatMessage {
  type: MessageType;
  from: MessageFrom;
  text: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private streamUrl = '/ask/stream';
  // private protocol = window.location.protocol === 'https:' ? 'https' : 'http';
  // private sseUrl  = `${this.protocol}://${environment.chatBotHost}${environment.chatBotAskSSEUrl}`;
  private sseUrl = `${window.location.origin}${environment.chatBotAskSSEUrl}`;

  constructor(private http: HttpClient) {}

  /**
   * Отправка вопроса и получение полного ответа (без стрима)
   * ⚠️ Работает только если сервер вернёт цельный JSON, а у тебя — StreamingResponse,
   * поэтому этот метод может не подойти.
   */
  async askOnce(question: string, sessionId = 'api'): Promise<string> {
    const res = await fetch(this.streamUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, session_id: sessionId }),
    });

    return await res.text(); // весь ответ скопом
  }

  /**
   * Streaming-метод: onChunk вызывается на каждый кусочек ответа
   */
  async askStream(
    question: string,
    sessionId = 'api',
    onChunk: (chunk: string) => void,
    onFinish?: () => void,
  ): Promise<void> {
    try {
    const res = await fetch(this.streamUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, session_id: sessionId }),
    });

    if (!res.body) {
      throw new Error('Response body is null');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');

    let buffer = ''; // буфер для сборки частичных UTF-8 последовательностей

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        if (buffer) {
          onChunk(buffer); // скидываем остаток
        }
        onFinish?.();
        break;
      }

      // Декодируем с поддержкой потока (stream: true)
      buffer += decoder.decode(value, { stream: true });

      // Опционально: если хочешь отдавать по предложениям — раскомментируй:
      /*
      const sentences = buffer.split(/(?<=[.!?])\s+/);
      buffer = sentences.pop() || ''; // оставляем незавершённое предложение в буфере

      for (const sentence of sentences) {
        onChunk(sentence + ' ');
      }
      */

      // Отправляем всё, что есть — без задержки
      if (buffer) {
        onChunk(buffer);
        buffer = ''; // очищаем, если отправили всё
      }
    }
  } catch (error) {
    console.error('Ошибка при стриминге:', error);
    onChunk('[Ошибка при получении ответа]');
  }
  }

  /**
   * SSE-вариант (GET /ask/sse)
   */
  askSSE(
    question: string,
    sessionId = 'api-sse',
    onToken: (token: { type: string; text: string }) => void,
    onDone?: () => void,
  ): EventSource {
    const url = `${this.sseUrl}?question=${encodeURIComponent(question)}&session_id=${encodeURIComponent(sessionId)}`;
    const es = new EventSource(url);

    es.addEventListener('token', (event: MessageEvent) => {
      try {
        const parsed = JSON.parse(event.data) as { type: string; text: string };
        onToken(parsed);
      } catch (err) {
        console.error("Ошибка парсинга SSE data", err, event.data);
      }
      // onToken(event.data);
    });

    es.addEventListener('done', () => {
      onDone?.();
      es.close();
    });

    es.onerror = (err) => {
      console.error('SSE error', err);
      es.close();
    };

    return es;
  }
}
