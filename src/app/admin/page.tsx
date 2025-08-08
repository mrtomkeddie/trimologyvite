
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
    const [user, setUser] = React.useState(auth.currentUser);

    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }
    
    if (adminUser && user) {
        return <AdminDashboard user={user} adminUser={adminUser} />;
    }

    return <AdminLoginForm />;
}
