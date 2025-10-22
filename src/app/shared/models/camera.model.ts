export interface Camera {
  id: string;       // Уникальный ключ (для WebSocket, например: 'server_room')
  name: string;     // Отображаемое имя на русском
  location: string; // Описание локации (на английском или русском — как удобно)
}
