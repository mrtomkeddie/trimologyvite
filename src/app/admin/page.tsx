
'use client';

import { AdminDashboard } from '@/components/admin-dashboard';
import { DUMMY_ADMIN_USERS, DUMMY_STAFF } from '@/lib/data';
import type { User } from 'firebase/auth';

// --- INSTRUCTIONS ---
// You can switch between the Super Admin and Branch Admin views by changing which user is active below.
// - To view as SUPER ADMIN, keep the first line uncommented.
// - To view as BRANCH ADMIN, comment out the SUPER_ADMIN line and uncomment the BRANCH_ADMIN line.

// --- DUMMY USER SETUP ---

// 1. SUPER ADMIN (Sees all locations)
const DUMMY_AUTH_USER_ID = 'super_admin_user';

// 2. BRANCH ADMIN (Sees only "Uptown Cuts")
// const DUMMY_AUTH_USER_ID = 'branch_admin_user';


// --- DO NOT EDIT BELOW THIS LINE ---

export default function AdminPage() {
  
  const DUMMY_ADMIN_USER = DUMMY_ADMIN_USERS.find(u => u.id === DUMMY_AUTH_USER_ID);
  const DUMMY_AUTH_USER = DUMMY_STAFF.find(u => u.id === DUMMY_AUTH_USER_ID);

  if (!DUMMY_ADMIN_USER || !DUMMY_AUTH_USER) {
     return <div>Error: Dummy admin user not found. Please check the ID in `/src/app/admin/page.tsx`.</div>
  }

  // We are providing a mock "User" object that matches what firebase.auth.User would provide.
  const mockUser: User = {
      uid: DUMMY_AUTH_USER.id,
      email: DUMMY_AUTH_USER.email!,
      displayName: DUMMY_AUTH_USER.name,
      emailVerified: true,
      isAnonymous: false,
      providerData: [],
      metadata: {},
      providerId: 'password',
      photoURL: DUMMY_AUTH_USER.imageUrl || null,
      // Add dummy methods if your components call them, otherwise they can be null/undefined
      getIdToken: async () => 'dummy-token',
      getIdTokenResult: async () => ({ token: 'dummy-token', claims: {}, authTime: '', issuedAtTime: '', signInProvider: null, signInSecondFactor: null, expirationTime: '' }),
      reload: async () => {},
      delete: async () => {},
      toJSON: () => ({...DUMMY_AUTH_USER})
  }
  
  return <AdminDashboard user={mockUser} adminUser={DUMMY_ADMIN_USER} />;
}
