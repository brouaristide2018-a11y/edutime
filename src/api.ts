/**
 * Client API centralisé pour EduTime
 * Toutes les requêtes vers le backend REST passent par ce fichier.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://b6bq38x2z7ruvtdzx8tcwkp9.178.105.62.20.sslip.io';

const TOKEN_KEY = 'edutime-token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    const isAuthRoute = path.startsWith('/api/auth/login') || path.startsWith('/api/auth/register');
    if (!isAuthRoute) {
      removeToken();
      // Rediriger seulement si on n'est pas déjà sur la page de login
      // (évite le rechargement intempestif qui efface les messages d'erreur)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    let errorMsg = 'Identifiants ou mot de passe incorrect.';
    try {
      const d = await response.clone().json();
      errorMsg = d.error || d.message || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }

  if (!response.ok) {
    let errorMessage = `Erreur HTTP ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // ignore JSON parse error
    }
    throw new Error(errorMessage);
  }

  // Handle empty responses (204 No Content, etc.)
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return null;
}

// ============================================================
// API groupée par entité
// ============================================================

export const api = {

  // --- Auth ---
  auth: {
    login: (identifier: string, password: string) =>
      apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      }),

    register: (data: Record<string, any>) =>
      apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    me: () => apiFetch('/api/auth/me'),
  },

  // --- Professors ---
  professors: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiFetch(`/api/professors${qs}`);
    },
    get: (id: string) => apiFetch(`/api/professors/${id}`),
    create: (data: Record<string, any>) =>
      apiFetch('/api/professors', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, any>) =>
      apiFetch(`/api/professors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/api/professors/${id}`, { method: 'DELETE' }),
  },

  // --- Classes ---
  classes: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiFetch(`/api/classes${qs}`);
    },
    get: (id: string) => apiFetch(`/api/classes/${id}`),
    create: (data: Record<string, any>) =>
      apiFetch('/api/classes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, any>) =>
      apiFetch(`/api/classes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/api/classes/${id}`, { method: 'DELETE' }),
  },

  // --- Subjects ---
  subjects: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiFetch(`/api/subjects${qs}`);
    },
    get: (id: string) => apiFetch(`/api/subjects/${id}`),
    create: (data: Record<string, any>) =>
      apiFetch('/api/subjects', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, any>) =>
      apiFetch(`/api/subjects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/api/subjects/${id}`, { method: 'DELETE' }),
  },

  // --- Rooms ---
  rooms: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiFetch(`/api/rooms${qs}`);
    },
    get: (id: string) => apiFetch(`/api/rooms/${id}`),
    create: (data: Record<string, any>) =>
      apiFetch('/api/rooms', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, any>) =>
      apiFetch(`/api/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/api/rooms/${id}`, { method: 'DELETE' }),
  },

  // --- Courses ---
  courses: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiFetch(`/api/courses${qs}`);
    },
    get: (id: string) => apiFetch(`/api/courses/${id}`),
    create: (data: Record<string, any>) =>
      apiFetch('/api/courses', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, any>) =>
      apiFetch(`/api/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    updateStatus: (id: string, status: string) =>
      apiFetch(`/api/courses/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    delete: (id: string) => apiFetch(`/api/courses/${id}`, { method: 'DELETE' }),
  },

  // --- Attendances ---
  attendances: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiFetch(`/api/attendances${qs}`);
    },
    get: (id: string) => apiFetch(`/api/attendances/${id}`),
    create: (data: Record<string, any>) =>
      apiFetch('/api/attendances', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, any>) =>
      apiFetch(`/api/attendances/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/api/attendances/${id}`, { method: 'DELETE' }),
  },

  // --- Payments ---
  payments: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiFetch(`/api/payments${qs}`);
    },
    get: (id: string) => apiFetch(`/api/payments/${id}`),
    create: (data: Record<string, any>) =>
      apiFetch('/api/payments', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, any>) =>
      apiFetch(`/api/payments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/api/payments/${id}`, { method: 'DELETE' }),
  },

  // --- Users ---
  users: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiFetch(`/api/users${qs}`);
    },
    get: (id: string) => apiFetch(`/api/users/${id}`),
    create: (data: Record<string, any>) =>
      apiFetch('/api/users', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, any>) =>
      apiFetch(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/api/users/${id}`, { method: 'DELETE' }),
  },

  // --- Time Slots ---
  timeslots: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiFetch(`/api/timeslots${qs}`);
    },
    get: (id: string) => apiFetch(`/api/timeslots/${id}`),
    create: (data: Record<string, any>) =>
      apiFetch('/api/timeslots', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, any>) =>
      apiFetch(`/api/timeslots/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/api/timeslots/${id}`, { method: 'DELETE' }),
  },

  // --- Requests ---
  requests: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiFetch(`/api/requests${qs}`);
    },
    get: (id: string) => apiFetch(`/api/requests/${id}`),
    create: (data: Record<string, any>) =>
      apiFetch('/api/requests', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, any>) =>
      apiFetch(`/api/requests/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/api/requests/${id}`, { method: 'DELETE' }),
  },

  // --- Settings ---
  settings: {
    get: () => apiFetch('/api/settings'),
    update: (data: Record<string, any>) =>
      apiFetch('/api/settings', { method: 'PUT', body: JSON.stringify(data) }),
  },

  // --- Super Admin ---
  superAdmin: {
    // Registrations (inscriptions)
    getRegistrations: () => apiFetch('/api/super-admin/registrations'),
    updateRegistration: (id: string, data: Record<string, any>) =>
      apiFetch(`/api/super-admin/registrations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    // Schools
    getSchools: () => apiFetch('/api/super-admin/schools'),
    updateSchoolStatus: (schoolId: string, status: string) =>
      apiFetch(`/api/super-admin/schools/${schoolId}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
    // Support
    getSupport: () => apiFetch('/api/super-admin/support'),
    updateSupport: (id: string, data: Record<string, any>) =>
      apiFetch(`/api/super-admin/support/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    // Platform settings
    getPlatformSettings: () => apiFetch('/api/super-admin/platform-settings'),
    updatePlatformSettings: (data: Record<string, any>) =>
      apiFetch('/api/super-admin/platform-settings', { method: 'PUT', body: JSON.stringify(data) }),
    // Announcements
    getAnnouncements: () => apiFetch('/api/super-admin/announcements'),
    createAnnouncement: (data: Record<string, any>) =>
      apiFetch('/api/super-admin/announcements', { method: 'POST', body: JSON.stringify(data) }),
    updateAnnouncement: (id: string, data: Record<string, any>) =>
      apiFetch(`/api/super-admin/announcements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteAnnouncement: (id: string) =>
      apiFetch(`/api/super-admin/announcements/${id}`, { method: 'DELETE' }),
    // Reset
    resetDatabase: () => apiFetch('/api/super-admin/reset-database', { method: 'DELETE' }),
  },
};
