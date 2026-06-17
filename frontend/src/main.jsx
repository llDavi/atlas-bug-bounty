import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { dark as clerkDark } from '@clerk/themes'
import './index.css'
import App from './App.jsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
if (!PUBLISHABLE_KEY) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env')

// Matches the app's color palette (index.css @theme)
const CLERK_APPEARANCE = {
  dark: {
    baseTheme: clerkDark,
    variables: {
      colorPrimary: '#49835c',        // evergreen-600
      colorBackground: '#0e1115',     // blue-slate-950
      colorInputBackground: '#15181e', // blue-slate-900
      colorText: '#e1e4ea',           // blue-slate-100
      colorTextSecondary: '#8694ac',  // blue-slate-400
      colorBorder: '#29303d',         // blue-slate-800
      borderRadius: '0.375rem',
      fontFamily: 'inherit',
    },
  },
  light: {
    variables: {
      colorPrimary: '#49835c',        // evergreen-600
      colorBackground: '#f0f2f5',     // blue-slate-50
      colorInputBackground: '#ffffff',
      colorText: '#15181e',           // blue-slate-900
      colorTextSecondary: '#536179',  // blue-slate-600
      colorBorder: '#c2c9d6',         // blue-slate-200
      borderRadius: '0.375rem',
      fontFamily: 'inherit',
    },
  },
}

function Root() {
  const [dark, setDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  const toggleTheme = () => setDark((d) => !d)

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      appearance={dark ? CLERK_APPEARANCE.dark : CLERK_APPEARANCE.light}
    >
      <BrowserRouter>
        <App dark={dark} onToggleTheme={toggleTheme} />
      </BrowserRouter>
    </ClerkProvider>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>
)
