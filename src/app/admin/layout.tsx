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
        // This can fire multiple times. The first time, user.email might be null.
        // We only want to proceed when we have the full user object.
        if (!user.email) {
          console.log("AdminLayout: Auth user object is not fully loaded yet, waiting...");
          // The initial state of `loading` (true) will keep the loader on screen.
          // We just wait for the next, more complete auth state change.
          return;
        }
        
        // Now we have the full user object, so we can check their admin status.
        setError(null);
        try {
          const fetchedAdminUser = await getAdminUser(user.uid, user.email);
          if (fetchedAdminUser) {
            setAdminUser(fetchedAdminUser);
          } else {
            setError("You are not authorized to access this part of the application.");
            setAdminUser(null);
          }
        } catch (e) {
          setError(e instanceof Error ? e.message : "Failed to verify admin status.");
          setAdminUser(null);
        } finally {
          setLoading(false); // We are done with all checks.
        }
      } else {
        // User is not logged in.
        if (pathname !== '/admin' && pathname !== '/staff/login') {
            setError("Please log in to continue.");
        } else {
            setError(null); // Clear potential errors on login pages
        }
        setAdminUser(null);
        setLoading(false); // We are done, show the login form or an error.
      }
    });

    return () => unsubscribe();
  }, [pathname]);

  const contextValue = { adminUser, loading };

  // The main /admin page has its own logic for showing login vs dashboard
  // so we just pass the context down and let it handle rendering.
  if (pathname === '/admin') {
      return (
          <AdminContext.Provider value={contextValue}>
              {children}
          </AdminContext.Provider>
      );
  }

  // For all other /admin/* pages, we enforce auth here in the layout.
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

  // User is authenticated and is an admin, provide context and render the page.
  return (
      <AdminContext.Provider value={contextValue}>
          {children}
      </AdminContext.Provider>
  );
}
