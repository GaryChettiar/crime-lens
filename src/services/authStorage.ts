const ACCESS_TOKEN_KEY = 'crimelens_access_token';
const REFRESH_TOKEN_KEY = 'crimelens_refresh_token';
const SESSION_ID_KEY = 'crimelens_session_id';

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

export function getStoredAccessToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredRefreshToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredSessionId() {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem(SESSION_ID_KEY);
}

export function setStoredAuthSession(session: AuthSession) {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  localStorage.setItem(SESSION_ID_KEY, session.sessionId);
}

export function clearStoredAuthSession() {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(SESSION_ID_KEY);
}

export function hasStoredAuthSession() {
  return Boolean(getStoredAccessToken() && getStoredSessionId());
}
