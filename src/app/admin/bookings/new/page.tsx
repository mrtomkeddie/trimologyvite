
'use client';
import * as React from 'react';
import { getLocationsFromFirestore, getServicesFromFirestore, getStaffFromFirestore, getAdminUser } from "@/lib/firestore";
import { AdminBookingForm } from "@/components/admin-booking-form";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { AdminUser, Location, Service, Staff } from '@/lib/types';

export default function NewBookingPage() {
    const [adminUser, setAdminUser] = React.useState<AdminUser | null>(null);
    const [locations, setLocations] = React.useState<Location[]>([]);
    const [services, setServices] = React.useState<Service[]>([]);
    const [staff, setStaff] = React.useState<Staff[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const fetchedAdminUser = await getAdminUser(user.uid);
                    if (!fetchedAdminUser) {
                        throw new Error("User is not an authorized admin.");
                    }
                    setAdminUser(fetchedAdminUser);

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
            } else {
                setLoading(false);
                setError("Please log in to create a booking.");
            }
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
    }

    if (error || !adminUser) {
        return <div className="flex h-screen w-full items-center justify-center text-destructive">{error || "You are not authorized to perform this action."}</div>;
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
