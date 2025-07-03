import { BookingForm } from '@/components/booking-form';
import { Icons } from '@/components/icons';
import { getServices, getStaff } from '@/lib/data';

export default async function Home() {
  const services = await getServices();
  const staff = await getStaff();

  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
       <div className="absolute top-0 left-0 w-full h-full bg-accent/20 blur-3xl -z-10" />
      <main className="w-full max-w-5xl flex flex-col items-center">
        <header className="w-full flex flex-col items-center text-center mb-8">
          <Icons.logo className="h-20 w-20 mb-4 text-primary" />
          <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold text-foreground">
            Trimology
          </h1>
          <p className="font-body text-muted-foreground mt-2 text-lg max-w-prose">
            Get the best haircut and beauty services from our award-winning team.
          </p>
        </header>
        <div className="w-full max-w-2xl">
          <BookingForm services={services} staff={staff} />
        </div>
        <footer className="w-full text-center mt-12 text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} Trimology. All rights reserved.</p>
          <p>123 Style Street, Barberville, 12345</p>
        </footer>
      </main>
    </div>
  );
}
