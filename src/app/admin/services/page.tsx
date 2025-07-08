
'use client';

import * as React from 'react';
import { getServicesFromFirestore, getLocationsFromFirestore } from "@/lib/firestore";
import { ServicesList } from "@/components/services-list";
import { ArrowLeft, Loader2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Service, Location } from '@/lib/types';
import { useAdmin } from '@/contexts/AdminContext';


export default function ManageServicesPage() {
    const { adminUser } = useAdmin();
    const [services, setServices] = React.useState<Service[]>([]);
    const [locations, setLocations] = React.useState<Location[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!adminUser) return;
        
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [fetchedServices, fetchedLocations] = await Promise.all([
                   getServicesFromFirestore(adminUser.locationId),
                   getLocationsFromFirestore(adminUser.locationId),
               ]);
               setServices(fetchedServices);
               setLocations(fetchedLocations);
            } catch (e) {
                setError("Failed to fetch service data. Please try refreshing the page.");
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [adminUser]);


    if (loading) {
        return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
    }
    
    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background text-center p-4">
                <div>
                    <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Error</h1>
                    <p className="text-muted-foreground mb-6">{error}</p>
                    <Button onClick={() => window.location.reload()}>Try Again</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
                 <Button asChild variant="outline" size="icon" className="h-8 w-8">
                    <Link href="/admin">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back to Admin</span>
                    </Link>
                </Button>
                <h1 className="font-headline text-xl font-semibold">Manage Services</h1>
            </header>
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
                <ServicesList 
                    initialServices={services} 
                    locations={locations} 
                />
            </main>
        </div>
    );
}
