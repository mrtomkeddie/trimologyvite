
'use client';

import { AdminLoginForm } from '@/components/admin-login-form';
import { AdminDashboard } from '@/components/admin-dashboard';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { useAdmin } from '@/contexts/AdminContext';
import { auth } from '@/lib/firebase';

export default function AdminPage() {
  const { adminUser, loading } = useAdmin();
  const user = auth.currentUser;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (user && adminUser) {
    // Auth check passed in layout, user is valid admin. Show dashboard.
    return <AdminDashboard user={user} adminUser={adminUser} />;
  }

  if (user && !adminUser) {
    // User is signed in but is NOT an admin.
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

  // No user, or user without admin role, show login form.
  return <AdminLoginForm />;
}
