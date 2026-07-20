/**
 * Catalyst authentication settings.
 *
 * Keep these values in environment configuration. The same build can therefore
 * be used against the development and production Catalyst projects without
 * baking a project URL into the application code.
 */
const configuredOrigin = import.meta.env.VITE_CATALYST_ORIGIN?.trim().replace(/\/$/, '');

export const CATALYST_ORIGIN = configuredOrigin || window.location.origin;

export const CATALYST_LOGIN_URL =
  import.meta.env.VITE_CATALYST_LOGIN_URL?.trim() ||
  `${CATALYST_ORIGIN}/__catalyst/auth/login`;

// Slate serves this project-specific initialisation file from the same origin
// as the frontend. Do not point it at the Serverless Functions domain.
export const CATALYST_SDK_URL =
  import.meta.env.VITE_CATALYST_SDK_URL?.trim() ||
  'https://static.zohocdn.com/catalyst/sdk/js/4.6.2/catalystWebSDK.js';

export const CATALYST_SDK_INIT_URL =
  import.meta.env.VITE_CATALYST_SDK_INIT_URL?.trim() ||
  '/__catalyst/sdk/init.js';

const RETURN_TO_KEY = 'crimelens:post-login-path';

export function savePostLoginPath(path: string) {
  // Do not persist an arbitrary external URL supplied via router state.
  if (path.startsWith('/') && !path.startsWith('//')) {
    sessionStorage.setItem(RETURN_TO_KEY, path);
  }
}

export function consumePostLoginPath() {
  const path = sessionStorage.getItem(RETURN_TO_KEY);
  sessionStorage.removeItem(RETURN_TO_KEY);
  return path?.startsWith('/') && !path.startsWith('//') ? path : null;
}
