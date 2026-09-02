interface User {
  id: string;
  username: string;
  nickname: string;
  role: 'admin' | 'user';
  phone: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
}

const STORAGE_KEY = 'mall_auth';

let state: AuthState = (() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { token: null, user: null };
})();

const listeners = new Set<() => void>();

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function notify() {
  for (const l of listeners) l();
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getToken(): string | null { return state.token; }
export function getUser(): User | null { return state.user; }
export function isLoggedIn(): boolean { return !!state.token; }

export function setLogin(token: string, user: User) {
  state.token = token;
  state.user = user;
  save();
  notify();
}

export function logout() {
  state.token = null;
  state.user = null;
  save();
  notify();
}
