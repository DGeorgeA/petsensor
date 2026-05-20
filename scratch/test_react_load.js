// Mock window/document/navigator before importing React components that might reference them
globalThis.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  localStorage: {
    getItem: () => null,
    setItem: () => {},
  },
  location: {
    pathname: '/',
    search: '',
    hash: '',
  },
  history: {
    pushState: () => {},
    replaceState: () => {},
    state: null,
  },
  navigator: {
    userAgent: 'node',
    mediaDevices: {
      getUserMedia: async () => {},
    },
  },
};

globalThis.document = {
  getElementById: () => null,
  defaultView: globalThis.window,
  location: globalThis.window.location,
};

globalThis.window.document = globalThis.document;

// Mock import.meta.env
globalThis.importMeta = {
  env: {
    VITE_SUPABASE_URL: 'https://tcmcetpfdgpujayjbzrs.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'dummy_key_to_prevent_crash'
  }
};
// tsx supports import.meta mocking or we can do it via a wrapper but in Node we can't easily redefine import.meta.
// Actually, tsx/node doesn't allow setting import.meta.env.
// Let's see: how does ts-node/tsx handle import.meta?
// Node 20+ defines import.meta as a read-only object for the module.
// But we can patch supabase.ts to check if import.meta.env is defined!


Object.defineProperty(globalThis, 'navigator', {
  value: globalThis.window.navigator,
  configurable: true,
  writable: true
});
Object.defineProperty(globalThis, 'localStorage', {
  value: globalThis.window.localStorage,
  configurable: true,
  writable: true
});

import React from 'react';
import { renderToString } from 'react-dom/server';

async function run() {
  try {
    console.log("Loading App component...");
    const AppMod = await import('../src/App.tsx');
    const App = AppMod.default;
    
    console.log("Rendering App to string...");
    // Render the app using server side rendering to catch any rendering errors
    const html = renderToString(React.createElement(App));
    console.log("App rendered successfully! HTML length:", html.length);
  } catch (err) {
    console.error("CRASH DURING RENDER:", err);
    process.exit(1);
  }
}

run();
