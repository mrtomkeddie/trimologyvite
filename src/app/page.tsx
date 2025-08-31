

import { BookingForm } from '@/components/booking-form';
import { getServicesFromFirestore, getStaffFromFirestore, getLocationsFromFirestore } from '@/lib/firestore';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { History } from 'lucide-react';

export default async function Home() {
  // Fetch data in parallel to improve initial page load time.
  const [locations, services, staff] = await Promise.all([
    getLocationsFromFirestore(),
    getServicesFromFirestore(),
    getStaffFromFirestore(),
  ]);

  return (
    <div className="relative flex min-h-dvh w-full flex-col items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 lg:top-8 lg:right-8 z-10">
        <Button asChild variant="outline">
          <Link href="/my-visits">
            <History className="mr-2 h-4 w-4" />
            My Visits
          </Link>
        </Button>
      </div>
      
       <div className="absolute top-0 left-0 w-full h-full bg-accent/20 blur-3xl -z-10" />
      <main className="w-full max-w-5xl flex flex-col items-center">
        <header className="w-full flex flex-col items-center text-center mb-8">
          <Image 
            src="/trimology-logo.png" 
            alt="Trimology Logo" 
            width={300} 
            height={228}
            className="w-48 h-auto sm:w-64 mb-4"
            priority
          />
        </header>
        <div className="w-full max-w-2xl">
          <BookingForm locations={locations} services={services} staff={staff} />
        </div>
        <footer className="w-full text-center mt-12 text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} Trimology. All rights reserved.</p>
           <div className="mt-4 flex justify-center gap-4">
            <Link href="/admin" className="hover:text-primary transition-colors">
              Admin Login
            </Link>
            <span className="text-muted-foreground/50">|</span>
            <Link href="/staff/login" className="hover:text-primary transition-colors">
              Staff Login
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
