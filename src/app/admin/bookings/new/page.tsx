
'use client';
import * as React from 'react';
import { getLocationsFromFirestore, getServicesFromFirestore, getStaffFromFirestore } from "@/lib/firestore";
import { AdminBookingForm } from "@/components/admin-booking-form";
import { ArrowLeft, Loader2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Location, Service, Staff } from '@/lib/types';
import { useAdmin } from '@/contexts/AdminContext';

export default function NewBookingPage() {
    const { adminUser } = useAdmin();
    const [locations, setLocations] = React.useState<Location[]>([]);
    const [services, setServices] = React.useState<Service[]>([]);
    const [staff, setStaff] = React.useState<Staff[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!adminUser) return; // Wait for admin context

        const fetchData = async () => {
            try {
                const [fetchedLocations, fetchedServices, fetchedStaff] = await Promise.all([
                    getLocationsFromFirestore(),
                    getServicesFromFirestore(),
                    getStaffFromFirestore()
                ]);
                setLocations(fetchedLocations);
                setServices(fetchedServices);
                setStaff(fetchedStaff);
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to fetch necessary data.");
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [adminUser]);

    if (loading || !adminUser) {
        return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background text-center p-4">
                <div>
                    <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Error</h1>
                    <p className="text-muted-foreground mb-6">{error}</p>
                    <Button asChild>
                        <Link href="/admin/bookings">Return to Bookings</Link>
                    </Button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
                 <Button asChild variant="outline" size="icon" className="h-8 w-8">
                    <Link href="/admin/bookings">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back to Bookings</span>
                    </Link>
                </Button>
                <h1 className="font-headline text-xl font-semibold">Create New Booking</h1>
            </header>
            <main className="flex-1 p-4 sm:p-6 lg:p-8 flex justify-center">
                <div className="w-full max-w-2xl">
                     <AdminBookingForm
                        adminUser={adminUser}
                        locations={locations}
                        services={services}
                        staff={staff}
                    />
                </div>
            </main>
        </div>
    );
}
