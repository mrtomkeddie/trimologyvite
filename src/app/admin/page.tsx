
'use client';

import * as React from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { AdminLoginForm } from '@/components/admin-login-form';
import { AdminDashboard } from '@/components/admin-dashboard';
import { useAdmin } from '@/contexts/AdminContext';
import { Loader2 } from 'lucide-react';

export default function AdminPage() {
    const { adminUser, loading } = useAdmin();
    // We also need to keep track of the raw Firebase auth user state
    // because the adminUser context might take a moment to resolve after auth state changes.
    const [user, setUser] = React.useState(auth.currentUser);

    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    // The AdminLayout handles the top-level loading state.
    // The `loading` from useAdmin() tells us if we are still fetching the admin profile from Firestore.
    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }
    
    // If we have both the raw auth user and the resolved admin profile, show the dashboard.
    if (adminUser && user) {
        return <AdminDashboard user={user} adminUser={adminUser} />;
    }

    // Otherwise, show the login form.
    return <AdminLoginForm />;
}
