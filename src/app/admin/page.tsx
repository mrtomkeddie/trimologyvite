
'use client';

import { AdminDashboard } from '@/components/admin-dashboard';
import { DUMMY_ADMIN_USERS } from '@/lib/data';

// DUMMY USER DATA - In a real app, this would come from an auth provider.
const DUMMY_AUTH_USER = {
  uid: 'super_admin_user',
  email: 'superadmin@example.com',
  displayName: 'Super Admin',
};

const DUMMY_ADMIN_USER = DUMMY_ADMIN_USERS.find(u => u.id === DUMMY_AUTH_USER.uid);

export default function AdminPage() {
  // This page now directly renders the dashboard with a dummy super admin.
  // The login form and all authentication logic are bypassed.
  
  if (!DUMMY_ADMIN_USER) {
     return <div>Error: Dummy admin user not found.</div>
  }

  // We are providing a mock "User" object that matches what firebase.auth.User would provide.
  const mockUser = {
      ...DUMMY_AUTH_USER,
      // Add any other properties your components might expect from a User object
      emailVerified: true,
      isAnonymous: false,
      providerData: [],
      metadata: {},
      providerId: 'password',
      // Add dummy methods if your components call them, otherwise they can be null/undefined
      getIdToken: async () => 'dummy-token',
      getIdTokenResult: async () => ({ token: 'dummy-token', claims: {}, authTime: '', issuedAtTime: '', signInProvider: null, signInSecondFactor: null, expirationTime: '' }),
      reload: async () => {},
      delete: async () => {},
      toJSON: () => ({...DUMMY_AUTH_USER})
  }
  
  return <AdminDashboard user={mockUser as any} adminUser={DUMMY_ADMIN_USER} />;
}
