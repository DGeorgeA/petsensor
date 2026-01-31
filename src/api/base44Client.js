// This client is deprecated and disabled for the Vroomie standalone app.
// All data should be mocked in the components.

export const base44 = new Proxy({}, {
  get: (target, prop) => {
    console.warn(`Attempted to access base44.${String(prop)} which is disabled.`);
    return () => { }; // Return a dummy function to avoid "is not a function" errors
  }
});

export function maybeRedirectToBase44Login() {
  // No-op
}

export default base44;
