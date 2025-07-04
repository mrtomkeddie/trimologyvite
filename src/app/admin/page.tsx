
'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { AdminLoginForm } from '@/components/admin-login-form';
import { AdminDashboard } from '@/components/admin-dashboard';
import { Loader2, ShieldAlert } from 'lucide-react';
import { getAdminUser } from '@/lib/firestore';
import type { AdminUser } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
        try {
          const fetchedAdminUser = await getAdminUser(currentUser.uid);
          setAdminUser(fetchedAdminUser); // Will be null if not found
        } catch (error) {
          console.error("Error fetching admin user data:", error);
          setAdminUser(null);
        }
      } else {
        setUser(null);
        setAdminUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (user && adminUser) {
    return <AdminDashboard user={user} adminUser={adminUser} />;
  }

  if (user && !adminUser) {
    return (
         <div className="flex min-h-screen items-center justify-center bg-background text-center p-4">
            <div>
                 <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
                <p className="text-muted-foreground mb-6 max-w-md">
                    You've logged in successfully as <span className="font-semibold text-foreground">{user.email}</span>, but this account does not have admin permissions.
                     Please contact the site owner or check that a document with this user's UID exists in your Firestore 'admins' collection.
                </p>
                <Button onClick={() => signOut(auth)} variant="destructive">
                    Sign Out
                </Button>
            </div>
        </div>
    );
  }

  return <AdminLoginForm />;
}
