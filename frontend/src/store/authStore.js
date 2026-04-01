import { create } from 'zustand';
import { api } from '../services/api.js';
import { disconnectSocket } from '../services/socket.js';

const tokenKey = 'skillcircle-token';
const userKey = 'skillcircle-user';

export const useAuthStore = create((set) => ({
  token: localStorage.getItem(tokenKey),
  user: JSON.parse(localStorage.getItem(userKey) || 'null'),
  loading: false,
  error: '',
  async authenticate(mode, payload) {
    set({ loading: true, error: '' });
    try {
      const endpoint = mode === 'signup' ? '/auth/signup' : '/auth/login';
      const data = await api.post(endpoint, payload);
      localStorage.setItem(tokenKey, data.token);
      localStorage.setItem(userKey, JSON.stringify(data.user));
      set({ token: data.token, user: data.user, loading: false });
      return data.user;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  async refreshUser() {
    if (!localStorage.getItem(tokenKey)) return;
    try {
      const data = await api.get('/auth/me');
      localStorage.setItem(userKey, JSON.stringify(data.user));
      set({ user: data.user });
    } catch (_error) {
      localStorage.removeItem(tokenKey);
      localStorage.removeItem(userKey);
      set({ token: null, user: null });
    }
  },
  setUser(user) {
    localStorage.setItem(userKey, JSON.stringify(user));
    set({ user });
  },
  logout() {
    disconnectSocket();
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(userKey);
    set({ token: null, user: null, error: '' });
  },
}));
