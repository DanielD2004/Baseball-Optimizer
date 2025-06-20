export type GuestContextType = {
  guestMode: boolean;
  setGuestMode: (value: boolean) => void;
};

import { createContext } from 'react';

export const GuestContext = createContext<GuestContextType>({
  guestMode: false,
  setGuestMode: () => {},
});
