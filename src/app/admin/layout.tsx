
'use client';
import * as React from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getAdminUser } from '@/lib/firestore';
import type { AdminUser } from '@/lib/types';
import { Loader2, ShieldAlert } from 'lucide-react';
import { AdminContext } from '@/contexts/AdminContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = React.useState<AdminUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const pathname = usePathname();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Wait for the user object to be fully populated, especially the email.
        if (!user.email) {
          console.log("AdminLayout: Auth user object is not fully loaded yet, waiting...");
          return; // This might be too defensive, but can prevent race conditions.
        }
        
        setError(null);
        try {
          const fetchedAdminUser = await getAdminUser(user.uid, user.email);
          if (fetchedAdminUser) {
            setAdminUser(fetchedAdminUser);
          } else {
            // This case means the user is logged in with Firebase Auth, but is not in our 'admins' collection.
            setError("You are not authorized to access this part of the application.");
            setAdminUser(null); // Explicitly set to null on failure
          }
        } catch (e) {
          console.error("AdminLayout Error:", e);
          setError(e instanceof Error ? e.message : "Failed to verify admin status.");
          setAdminUser(null);
        } finally {
          setLoading(false); 
        }
      } else {
        // User is not logged in.
        // Only show an error if they are trying to access a protected page.
        // The /admin page itself is the login page and should not show an access denied error.
        if (pathname !== '/admin' && pathname !== '/staff/login') {
            setError("Please log in to continue.");
        } else {
            setError(null); // Clear error on login pages
        }
        setAdminUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []); // Pathname dependency removed to prevent re-running on every navigation. Logic handles it internally.

  const contextValue = { adminUser, loading };

  // For the login page, we just provide the context and render children.
  // The login page itself will handle what to show based on the context.
  if (pathname === '/admin') {
      return (
          <AdminContext.Provider value={contextValue}>
              {children}
          </AdminContext.Provider>
      );
  }

  // For all other admin pages, we enforce the auth check.
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !adminUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-center p-4">
        <div>
          <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">{error || "You do not have permission to access this page."}</p>
          <Button asChild>
            <Link href="/admin">Return to Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  // If everything is fine, provide context to the protected child pages.
  return (
      <AdminContext.Provider value={contextValue}>
          {children}
      </AdminContext.Provider>
  );
}
