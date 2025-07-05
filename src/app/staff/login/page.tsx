
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { StaffLoginForm } from '@/components/staff-login-form';
import { Loader2 } from 'lucide-react';
import { getStaffByUid } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';

export default function StaffLoginPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // User is logged in, check if they are a valid staff member
        try {
            const staffMember = await getStaffByUid(currentUser.uid, currentUser.email ?? undefined);
            if (staffMember) {
                // Yes, they are staff. Redirect to their schedule.
                router.push('/my-schedule');
            } else {
                // This user is authenticated but not a staff member.
                // Sign them out and show an error toast to prevent confusion.
                await signOut(auth);
                toast({
                    title: "Access Denied",
                    description: "This account does not have staff permissions.",
                    variant: "destructive",
                });
                setLoading(false);
            }
        } catch (error) {
             console.error("Error verifying staff status:", error);
             await signOut(auth); // Also sign out on error to be safe
             setLoading(false);
        }
      } else {
        // No user is logged in, stop loading and show the login form.
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, toast]);

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
