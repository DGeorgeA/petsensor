/**
 * Safe Base44 client wrapper.
 * - Reads Vite env variable VITE_BASE44_APP_ID
 * - Creates a real client only when appId is provided
 * - Exports safe no-op functions otherwise (so app doesn't throw)
 */

let base44 = null;
const APP_ID = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BASE44_APP_ID) ? import.meta.env.VITE_BASE44_APP_ID : (process && process.env && process.env.VITE_BASE44_APP_ID) || '';

/**
 * Lazily import/create the real client only if APP_ID exists.
 * (We do not throw when missing)
 */
async function createRealClientIfNeeded() {
  if (base44 || !APP_ID) return base44;
  try {
    const { createClient } = await import('@base44/sdk');
    base44 = createClient({
      appId: APP_ID,
      serverUrl: 'https://base44.app',
      requiresAuth: false
    });
    return base44;
  } catch (err) {
    console.warn('Failed to create Base44 client:', err);
    base44 = null;
    return null;
  }
}

/**
 * Safe fetch wrapper for public app info.
 * Returns null if no APP_ID or fetch fails.
 */
export async function fetchBase44AppInfo(domain) {
  if (!APP_ID) return null;
  try {
    const url = `https://app.base44.app/api/apps/public/prod/domain/${encodeURIComponent(domain)}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn('Base44 public app info not found (status=' + res.status + ')', url);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error('Error contacting Base44 public app API', err);
    return null;
  }
}

/**
 * Maybe redirect: only when we have an app id and the public API returns an app_id.
 * If APP_ID is missing, this is a NO-OP (safe).
 */
/*/*export async function maybeRedirectToBase44Login() {
  if (!APP_ID) {
    // intentionally silent — appId not provided in environment
    return;
  }
  try {
    const domainName = typeof window !== 'undefined' ? window.location.hostname : '';
    const info = await fetchBase44AppInfo(domainName);
    const appIdToUse = info && info.app_id ? info.app_id : APP_ID;
    if (appIdToUse) {
      const loginUrl = `https://base44.app/login?from_url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&app_id=${appIdToUse}`;
      window.location.href = loginUrl;
    } else {
      console.info('No app_id available for redirect; skipping.');
    }
  } catch (err) {
    console.error('maybeRedirectToBase44Login error', err);
  }
}

/**
 * Export a safe client accessor: returns real client or null.
 * Use createRealClientIfNeeded() if you want to attempt to get a real client.
 */
/*export async function getBase44Client() {
  return await createRealClientIfNeeded();
}

// default export remains null or client depending on env
export default null;
*/
