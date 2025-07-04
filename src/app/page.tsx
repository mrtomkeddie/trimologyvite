
import { BookingForm } from '@/components/booking-form';
import { getServices, getStaff, getLocations } from '@/lib/data';
import Image from 'next/image';
import Link from 'next/link';

export default async function Home() {
  const locations = await getLocations();
  const services = await getServices();
  const staff = await getStaff();

  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
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
          <p>123 Style Street, Barberville, 12345</p>
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
