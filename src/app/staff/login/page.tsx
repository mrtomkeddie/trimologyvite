
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { StaffLoginForm } from '@/components/staff-login-form';
import { Loader2 } from 'lucide-react';
import { getStaffByUid } from '@/lib/firestore';

export default function StaffLoginPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // User is logged in, check if they are a valid staff member
        try {
            const staffMember = await getStaffByUid(currentUser.uid);
            if (staffMember) {
                // Yes, they are staff. Redirect to their schedule.
                router.push('/my-schedule');
                // We don't need to setLoading(false) here because we are navigating away.
            } else {
                // Not a staff member, so stop loading and show the login form.
                setLoading(false);
            }
        } catch (error) {
             console.error("Error verifying staff status:", error);
             setLoading(false);
        }
      } else {
        // No user is logged in, stop loading and show the login form.
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

  // If loading is finished and we haven't redirected, it means the user
  // needs to log in, so we show the form.
  return <StaffLoginForm />;
}
