import { User } from '../types/user';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

const state: AuthState = {
  user: null,
  isAuthenticated: false,
};

export function login(user: User): void {
  state.user = user;
  state.isAuthenticated = true;
}

export function logout(): void {
  state.user = null;
  state.isAuthenticated = false;
}

export function getAuthState(): AuthState {
  return { ...state };
}
