import { createClient } from '@base44/sdk';

/**
 * Base44 client configured to NOT auto-redirect on auth failures.
 */
export const base44 = createClient({
  appId: process.env.REACT_APP_BASE44_APP_ID || '',
  serverUrl: 'https://base44.app',
  // keep false to avoid automatic redirect in browser
  requiresAuth: false
});

/**
 * Fetch public app information for a domain from Base44 public endpoint.
 * Returns parsed JSON on success or null otherwise.
 */
export async function fetchBase44AppInfo(domain) {
  try {
    const url = `https://app.base44.app/api/apps/public/prod/domain/${encodeURIComponent(domain)}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) {
      console.warn('Base44 public app info not found (status=' + res.status + ')', url);
      return null;
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Error contacting Base44 public app API', err);
    return null;
  }
}

/**
 * Redirect to Base44 login only if the domain is registered.
 */
export async function maybeRedirectToBase44Login() {
  if (typeof window === 'undefined') return;
  try {
    const domainName = window.location.hostname;
    const info = await fetchBase44AppInfo(domainName);
    if (info && info.app_id) {
      const loginUrl = `https://base44.app/login?from_url=${encodeURIComponent(window.location.href)}&app_id=${info.app_id}`;
      window.location.href = loginUrl;
    } else {
      console.info('Base44 app info not present; not redirecting for domain:', domainName);
    }
  } catch (err) {
    console.error('maybeRedirectToBase44Login error', err);
  }
}
