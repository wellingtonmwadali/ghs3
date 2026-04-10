import { create, StateCreator } from 'zustand';
import { persist, PersistOptions } from 'zustand/middleware';
import { AuthUser, TokenPair, SessionInfo } from '@/types';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null; // epoch ms when access token expires
  session: SessionInfo | null;
  isAuthenticated: boolean;

  setAuth: (user: AuthUser, token: TokenPair, session: SessionInfo) => void;
  setAccessToken: (accessToken: string, expiresIn: number) => void;
  isTokenExpired: () => boolean;
  logout: () => void;
}

type AuthPersist = (
  config: StateCreator<AuthState>,
  options: PersistOptions<AuthState>
) => StateCreator<AuthState>;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      session: null,
      isAuthenticated: false,

      setAuth: (user: AuthUser, token: TokenPair, session: SessionInfo) => {
        const expiresAt = Date.now() + token.expires_in * 1000;
        localStorage.setItem('token', token.access_token);
        set({
          user,
          accessToken: token.access_token,
          refreshToken: token.refresh_token,
          expiresAt,
          session,
          isAuthenticated: true,
        });
      },

      setAccessToken: (accessToken: string, expiresIn: number) => {
        const expiresAt = Date.now() + expiresIn * 1000;
        localStorage.setItem('token', accessToken);
        set({ accessToken, expiresAt });
      },

      isTokenExpired: () => {
        const { expiresAt } = get();
        if (!expiresAt) return true;
        // Consider expired 30 seconds early to avoid edge cases
        return Date.now() >= expiresAt - 30_000;
      },

      logout: () => {
        localStorage.removeItem('token');
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
          session: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        if (state && state.user && state.accessToken && state.expiresAt) {
          // Check if token is still valid on rehydration
          if (Date.now() < state.expiresAt) {
            useAuthStore.setState({ isAuthenticated: true });
          } else {
            // Token expired — keep refresh token for silent refresh attempt
            useAuthStore.setState({ isAuthenticated: false, accessToken: null });
            localStorage.removeItem('token');
          }
        }
      },
    }
  )
);
