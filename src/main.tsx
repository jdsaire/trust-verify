import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import './styles/app.css';

const host = document.getElementById('root');
if (!host) throw new Error('Mount point #root not found.');

createRoot(host).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
