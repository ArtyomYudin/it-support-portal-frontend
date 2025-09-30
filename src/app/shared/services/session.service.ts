import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly STORAGE_KEY = 'chat_session_id';
  private readonly USER_KEY = 'IT-Support-Portal';

  /** Фолбэк, если randomUUID нет */
  private uuidFallback(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    // RFC4122 v4
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return (
      hex.substring(0, 8) + '-' +
      hex.substring(8, 12) + '-' +
      hex.substring(12, 16) + '-' +
      hex.substring(16, 20) + '-' +
      hex.substring(20)
    );
  }

  private generateSessionId(): string {
    if (typeof (crypto as any).randomUUID === 'function') {
      return (crypto as any).randomUUID();
    }
    return this.uuidFallback();
  }

  getSessionId(): string {
    // Проверяем, авторизован ли пользователь
    const raw = localStorage.getItem(this.USER_KEY);
    if (raw) {
      try {
        const user = JSON.parse(raw);
        if (user?.sub) {
          return user.sub; // для авторизованных
        }
      } catch {
        console.warn('Не удалось разобрать IT-Support-Portal');
      }
    }

    // Если пользователь не авторизован → возвращаем анонимную сессию
    let id = localStorage.getItem(this.STORAGE_KEY);
    if (!id) {
      id = this.generateSessionId(); // больше не упадет в страх версиях браузера
      localStorage.setItem(this.STORAGE_KEY, id);
    }
    return id;
  }

  setAnonymousSessionId(id: string) {
    localStorage.setItem(this.STORAGE_KEY, id);
  }

  async mergeAfterLogin(token: string): Promise<void> {
    const oldSession = localStorage.getItem(this.STORAGE_KEY);
    if (!oldSession) return;

    await fetch("/merge-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ old_session_id: oldSession })
    });

    // после успешного мерджа — удаляем старый sessionId
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
