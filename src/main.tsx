import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

async function enableMocking() {
  // Start MSW service worker (intercepts POST /songs, DELETE /songs/:id, GET /songs)
  const { worker } = await import('./mocks/browser');
  return worker.start({
    // Don't warn about unhandled requests (iTunes API calls pass through normally)
    onUnhandledRequest: 'bypass',
  });
}

function mount() {
  createRoot(document.getElementById('root')!).render(<App />);
}

// Mount the app once MSW is ready so mock handlers are active — but never
// let a mocking/service-worker failure leave the page blank. This file only
// runs in standalone dev mode (never bundled into the federation path).
enableMocking()
  .then(mount)
  .catch((err) => {
    console.error('MSW failed to start — rendering app without mocked writes.', err);
    mount();
  });
