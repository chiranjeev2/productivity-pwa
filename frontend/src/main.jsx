import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { registerSW } from 'virtual:pwa-register';
import App from './App.jsx';

const queryClient = new QueryClient();

// Registers the service worker and makes sure a new deployed version
// actually takes over instead of the installed PWA silently running
// stale cached JS forever.
registerSW({
  immediate: true,
  onNeedRefresh() {
    // A new version has been fetched and is ready — reload now so
    // this device (especially an installed PWA that rarely fully
    // closes) picks it up immediately instead of staying stale.
    window.location.reload();
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
  onRegisteredSW(swUrl, registration) {
    if (!registration) return;
    // An installed PWA can stay open/backgrounded for days without a
    // fresh page load, so the default update check (on page load) may
    // rarely fire. Poll periodically as a backstop.
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000); // hourly
  },
  onRegisterError(error) {
    console.error('Service worker registration failed:', error);
  },
});

// This line looks for the <div id="root"> in your index.html
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);