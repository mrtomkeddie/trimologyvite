import { getLocations, getServices } from '@/lib/data';
import { WalkinForm } from '@/components/walk-in-form';
import Image from 'next/image';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default async function CheckinPage({ params }: { params: { locationId: string } }) {
  const { locationId } = params;

  // Fetch all data in parallel
  const [allLocations, allServices] = await Promise.all([
    getLocations(),
    getServices(),
  ]);

  const location = allLocations.find(l => l.id === locationId);
  
  if (!location) {
    return (
      <div className="flex min-h-dvh w-full flex-col items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Location Not Found</AlertTitle>
          <AlertDescription>
            The check-in link is invalid. Please scan the QR code at the location again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Filter services for the current location
  const servicesForLocation = allServices.filter(s => s.locationId === locationId);

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
           <h1 className="text-2xl font-headline sm:text-3xl font-bold">Walk-in Check-in</h1>
           <p className="text-lg text-muted-foreground mt-1">for {location.name}</p>
        </header>
        <div className="w-full max-w-2xl">
            {servicesForLocation.length > 0 ? (
                <WalkinForm location={location} services={servicesForLocation} />
            ) : (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Services Available</AlertTitle>
                    <AlertDescription>
                        There are currently no services available for online check-in at this location. Please speak to a member of staff.
                    </AlertDescription>
                </Alert>
            )}
        </div>
      </main>
    </div>
  );
}
