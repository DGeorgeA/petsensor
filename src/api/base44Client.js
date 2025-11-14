import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "691072dcc471e785f12b2da3", 
  requiresAuth: true // Ensure authentication is required for all operations
});
// Only allow SDK auto-redirect when running on the production domain you expect.
// Replace 'vroomie.in' with the domain where you want redirect to be allowed.
const originalCreateLoginUrl = /* however the SDK builds the login URL */;
function safeRedirectToLogin(url) {
  const allowedHosts = ['your-expected-domain.com']; // or check process.env
  if (typeof window === 'undefined') return;
  if (allowedHosts.includes(window.location.hostname)) {
    window.location.href = url;
  } else {
    // Log or silently ignore.
    console.warn('Blocked Base44 auto-redirect on host: ', window.location.hostname);
  }
}
