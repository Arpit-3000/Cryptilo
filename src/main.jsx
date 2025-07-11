import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css'
import App from './App.jsx'
import { NetworkProvider } from "./context/NetworkContext";

const root = createRoot(document.getElementById('root'));

root.render(
  <BrowserRouter>
    <NetworkProvider>
      <App />
    </NetworkProvider>
  </BrowserRouter>
);