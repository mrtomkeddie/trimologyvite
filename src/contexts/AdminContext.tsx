'use client';
import type { AdminUser } from '@/lib/types';
import * as React from 'react';

type AdminContextType = {
  adminUser: AdminUser | null;
  loading: boolean;
};

export const AdminContext = React.createContext<AdminContextType | undefined>(undefined);

export function useAdmin() {
  const context = React.useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
