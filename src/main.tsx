import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import 'leaflet/dist/leaflet.css';
import './styles/app.css';
import './styles/enhancements.css';
import { initializeLanguage } from './i18n';
import { updates } from './services/updateService';
import { captureInstallPrompt } from './components/InstallButton';
void initializeLanguage();
captureInstallPrompt();
void updates.start();
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
