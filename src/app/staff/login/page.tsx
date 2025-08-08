
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

// This component now immediately redirects to the dummy schedule page.
// All previous authentication logic is bypassed.
export default function StaffLoginPage() {
  const router = useRouter();

  React.useEffect(() => {
    router.push('/my-schedule');
  }, [router]);

  // Render a simple loading state while redirecting
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
        <p>Loading staff schedule...</p>
    </div>
  );
}
