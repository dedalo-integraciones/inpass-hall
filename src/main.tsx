import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
      <img src="https://i.ibb.co/FLTMwg1n/powered-by-Negro.png" alt="Powered By" className="fixed bottom-3 right-4 z-[9999] h-[24px] w-auto opacity-70 pointer-events-none" />
    </ErrorBoundary>
  </StrictMode>,
);
