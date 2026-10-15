import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import RouteAnalytics from '@/components/analytics/RouteAnalytics'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <RouteAnalytics />
    </BrowserRouter>
  </StrictMode>,
)