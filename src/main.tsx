import React from 'react';
import ReactDOM from 'react-dom/client';
import { DashboardApp } from './components/DashboardApp';
import './styles/dashboard.css';

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <DashboardApp />
    </React.StrictMode>
  );
}
