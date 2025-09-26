import {Injectable} from "@angular/core";

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly STORAGE_KEY = 'chat_session_id';
  private readonly USER_KEY = 'IT-Support-Portal';

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
      id = crypto.randomUUID();
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
