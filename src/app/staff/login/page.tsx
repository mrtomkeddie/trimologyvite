
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { StaffLoginForm } from '@/components/staff-login-form';
import { Loader2 } from 'lucide-react';

export default function StaffLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/my-schedule');
      } else {
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

  return <StaffLoginForm />;
}
