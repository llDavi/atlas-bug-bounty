import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { LampProvider } from './theme.jsx'
import ClerkBound from './ClerkBound.jsx'
import './index.css'
import App from './App.jsx'

if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LampProvider>
      <ClerkBound>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ClerkBound>
    </LampProvider>
  </StrictMode>
)
