// src/useGuest.ts
import { useContext } from 'react';
import { GuestContext } from './GuestContext';

export function useGuest() {
  return useContext(GuestContext);
}
