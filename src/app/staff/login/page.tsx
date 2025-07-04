
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { StaffLoginForm } from '@/components/staff-login-form';
import { Loader2 } from 'lucide-react';
import { getStaffByUid } from '@/lib/firestore';

export default function StaffLoginPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
        // Check if they are a staff member. If so, redirect.
        try {
            const staffMember = await getStaffByUid(currentUser.uid);
            if (staffMember) {
                router.push('/my-schedule');
            } else {
                // User is logged in but not a staff member. They shouldn't be here.
                // We'll let them sit on the login page for now. 
                // A better implementation might redirect them or show an error.
                setLoading(false);
            }
        } catch (error) {
             console.error("Error verifying staff status:", error);
             setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // If user is loaded but not redirected (e.g., they are an admin), show login form
  if (!user || user) {
     return <StaffLoginForm />;
  }
}
