import { ClerkProvider } from '@clerk/clerk-react'
import { createRoot } from 'react-dom/client'
import React from 'react'
import "@radix-ui/themes/styles.css";
import { Theme } from '@radix-ui/themes'
import App from './App.tsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <Theme>
        <App />
      </Theme>
    </ClerkProvider>
  </React.StrictMode>,
)
