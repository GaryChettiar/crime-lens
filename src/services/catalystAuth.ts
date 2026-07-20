import { CATALYST_SDK_INIT_URL, CATALYST_SDK_URL } from '@/config/auth';

export interface CatalystUser {
  zuid?: string | number;
  user_id?: string | number;
  email_id?: string;
  first_name?: string;
  last_name?: string;
  role_details?: { role_id?: string | number; role_name?: string };
}

interface CatalystAuth {
  isUserAuthenticated: () => Promise<{ content: CatalystUser }>;
  signIn: (elementId: string, config?: Record<string, unknown>) => void;
  signOut: (redirectUrl: string) => void;
}

declare global {
  interface Window {
    catalyst?: { auth?: CatalystAuth };
  }
}

let sdkPromise: Promise<CatalystAuth> | undefined;

function loadScript(source: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${source}"]`);
    if (existing?.dataset.loaded === 'true') {
      resolve();
      return;
    }

    const script = existing ?? document.createElement('script');
    script.addEventListener('load', () => {
      script.dataset.loaded = 'true';
      resolve();
    }, { once: true });
    script.addEventListener('error', () => {
      reject(new Error(`Unable to load Catalyst authentication script: ${source}`));
    }, { once: true });
    if (!existing) {
      script.src = source;
      script.async = true;
      document.head.appendChild(script);
    }
  });
}

/** Loads the Catalyst SDK from the active Slate deployment. */
export function getCatalystAuth() {
  if (!sdkPromise) {
    sdkPromise = (async () => {
      await loadScript(CATALYST_SDK_URL);
      await loadScript(CATALYST_SDK_INIT_URL);
      const auth = window.catalyst?.auth;
      if (!auth?.isUserAuthenticated || !auth?.signIn || !auth?.signOut) {
        throw new Error('Catalyst authentication did not initialise from this Slate deployment.');
      }
      return auth;
    })();
  }
  return sdkPromise;
}

export async function getCatalystCurrentUser() {
  const response = await (await getCatalystAuth()).isUserAuthenticated();
  if (!response?.content?.user_id && !response?.content?.zuid) {
    throw new Error('No authenticated Catalyst user was returned.');
  }
  return response.content;
}

export async function renderCatalystSignIn(elementId: string) {
  (await getCatalystAuth()).signIn(elementId);
}

export async function signOutFromCatalyst(redirectUrl: string) {
  (await getCatalystAuth()).signOut(redirectUrl);
}
