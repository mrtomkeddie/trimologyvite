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
      setLoading(true);
      setError(null);
      if (user) {
        // Add a check to ensure the user object has the email before proceeding.
        // This prevents a race condition on navigation where the user object is temporarily incomplete.
        if (!user.email) {
          console.log("AdminLayout: Auth user object is not fully loaded yet, waiting...");
          // We don't set loading to false, we just wait for the next auth state change
          // which typically has the complete user object.
          return;
        }
        
        try {
          const fetchedAdminUser = await getAdminUser(user.uid, user.email ?? undefined);
          if (fetchedAdminUser) {
            setAdminUser(fetchedAdminUser);
          } else {
            setError("You are not authorized to access this part of the application.");
            setAdminUser(null);
          }
        } catch (e) {
          setError(e instanceof Error ? e.message : "Failed to verify admin status.");
          setAdminUser(null);
        }
      } else {
        // If on the main /admin login or staff login page, it's not an error.
        // For any other protected route, it is.
        if (pathname !== '/admin' && pathname !== '/staff/login') {
            setError("Please log in to continue.");
        }
        setAdminUser(null);
      }
      setLoading(false);
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
