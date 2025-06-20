import { ClerkProvider } from '@clerk/clerk-react'
import { createRoot } from 'react-dom/client'
import React from 'react'
import "@radix-ui/themes/styles.css";
import { Theme } from '@radix-ui/themes'
import App from './App.tsx'
import { GuestProvider } from './GuestProvider.tsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <Theme>
        <div className="h-screen w-screen bg-cyan-50 dark:bg-neutral-700">
          <GuestProvider>
            <App/>
          </GuestProvider>
        </div>
      </Theme>
    </ClerkProvider>
  </React.StrictMode>,
)
