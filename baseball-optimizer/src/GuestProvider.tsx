import { useState } from 'react';
import { GuestContext } from './GuestContext';
import type { GuestContextType } from './GuestContext';

export function GuestProvider({ children }: { children: React.ReactNode }) {
  const [guestMode, setGuestMode] = useState(false);

  const value: GuestContextType = { guestMode, setGuestMode };

  return (
    <GuestContext.Provider value={value}>
      {children}
    </GuestContext.Provider>
  );
}
