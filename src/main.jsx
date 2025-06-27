import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { NetworkProvider } from "./context/NetworkContext";

createRoot(document.getElementById('root')).render(
 <NetworkProvider>
  <App />
</NetworkProvider>,
)
