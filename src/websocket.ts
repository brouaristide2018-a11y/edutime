/**
 * Client WebSocket temps réel pour EduTime
 * Se connecte au serveur WS et met à jour le store Zustand automatiquement.
 */

import { useStore } from './store';
import { getToken } from './api';

const WS_BASE = (import.meta.env.VITE_API_URL || 'http://b6bq38x2z7ruvtdzx8tcwkp9.178.105.62.20.sslip.io')
  .replace(/^https?:\/\//, (match) => (match.startsWith('https') ? 'wss://' : 'ws://'));

let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let currentSchoolId: string | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_MS = 3000;

function handleMessage(event: MessageEvent) {
  try {
    const message = JSON.parse(event.data as string) as { type: string; data: any };
    const store = useStore.getState();

    switch (message.type) {
      // ---- Attendances ----
      case 'attendance.created':
        store.setStore({
          attendances: [...store.attendances, message.data],
        });
        break;
      case 'attendance.updated':
        store.setStore({
          attendances: store.attendances.map((a) =>
            a.id === message.data.id ? { ...a, ...message.data } : a
          ),
        });
        break;
      case 'attendance.deleted':
        store.setStore({
          attendances: store.attendances.filter((a) => a.id !== message.data.id),
        });
        break;

      // ---- Courses ----
      case 'course.created':
        store.setStore({
          courses: [...store.courses, message.data],
        });
        break;
      case 'course.updated':
        store.setStore({
          courses: store.courses.map((c) =>
            c.id === message.data.id ? { ...c, ...message.data } : c
          ),
        });
        break;
      case 'course.deleted':
        store.setStore({
          courses: store.courses.filter((c) => c.id !== message.data.id),
        });
        break;
      case 'course.status_updated':
        store.setStore({
          courses: store.courses.map((c) =>
            c.id === message.data.id ? { ...c, status: message.data.status } : c
          ),
        });
        break;

      // ---- Requests ----
      case 'request.created':
        store.setStore({
          professorRequests: [...store.professorRequests, message.data],
        });
        break;
      case 'request.updated':
        store.setStore({
          professorRequests: store.professorRequests.map((r) =>
            r.id === message.data.id ? { ...r, ...message.data } : r
          ),
        });
        break;

      // ---- Professors ----
      case 'professor.created':
        store.setStore({
          professors: [...store.professors, message.data],
        });
        break;
      case 'professor.updated':
        store.setStore({
          professors: store.professors.map((p) =>
            p.id === message.data.id ? { ...p, ...message.data } : p
          ),
        });
        break;
      case 'professor.deleted':
        store.setStore({
          professors: store.professors.filter((p) => p.id !== message.data.id),
        });
        break;

      // ---- Payments ----
      case 'payment.created':
        store.setStore({
          payments: [...store.payments, message.data],
        });
        break;
      case 'payment.updated':
        store.setStore({
          payments: store.payments.map((p) =>
            p.id === message.data.id ? { ...p, ...message.data } : p
          ),
        });
        break;

      default:
        // Unknown message type — ignore silently
        break;
    }
  } catch (err) {
    console.warn('[WebSocket] Failed to parse message:', err);
  }
}

export function connectWebSocket(schoolId: string, token: string): void {
  // Avoid duplicate connections
  if (socket && socket.readyState === WebSocket.OPEN && currentSchoolId === schoolId) {
    return;
  }

  disconnectWebSocket();

  currentSchoolId = schoolId;
  reconnectAttempts = 0;

  _connect(schoolId, token);
}

function _connect(schoolId: string, token: string): void {
  const url = `${WS_BASE}/ws?schoolId=${encodeURIComponent(schoolId)}&token=${encodeURIComponent(token)}`;

  try {
    socket = new WebSocket(url);
  } catch (err) {
    console.warn('[WebSocket] Failed to create connection:', err);
    return;
  }

  socket.onopen = () => {
    reconnectAttempts = 0;
    console.info('[WebSocket] Connected. School:', schoolId);
  };

  socket.onmessage = handleMessage;

  socket.onerror = (err) => {
    console.warn('[WebSocket] Error:', err);
  };

  socket.onclose = (event) => {
    console.info('[WebSocket] Closed (code:', event.code, ')');
    socket = null;

    // Auto-reconnect unless we closed intentionally (code 1000)
    if (event.code !== 1000 && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      const delay = RECONNECT_DELAY_MS * reconnectAttempts;
      console.info(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttempts})...`);
      reconnectTimer = setTimeout(() => {
        const latestToken = getToken();
        if (currentSchoolId && latestToken) {
          _connect(currentSchoolId, latestToken);
        }
      }, delay);
    }
  };
}

export function disconnectWebSocket(): void {
  if (reconnectTimer !== null) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  currentSchoolId = null;
  reconnectAttempts = 0;

  if (socket) {
    socket.close(1000, 'Intentional disconnect');
    socket = null;
  }
}
