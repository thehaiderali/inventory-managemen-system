import { StrictMode } from 'react'
import { BrowserRouter as Router } from 'react-router'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from '@/context/ThemeProvider'
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <ThemeProvider>
      <App />
      </ThemeProvider>
    </Router>
  </StrictMode>,
)
