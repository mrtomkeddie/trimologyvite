
'use client';
import * as React from 'react';
import { getBookingsFromFirestore, getLocationsFromFirestore } from "@/lib/firestore";
import { BookingsList } from "@/components/bookings-list";
import { ArrowLeft, Loader2, PlusCircle, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Booking, Location } from '@/lib/types';
import { useAdmin } from '@/contexts/AdminContext';

export default function ManageBookingsPage() {
    const { adminUser } = useAdmin();
    const [bookings, setBookings] = React.useState<Booking[]>([]);
    const [locations, setLocations] = React.useState<Location[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

     React.useEffect(() => {
        if (!adminUser) return; // Wait for admin context

        const fetchData = async () => {
            setLoading(true);
            try {
                const [allBookings, allLocations] = await Promise.all([
                    getBookingsFromFirestore(),
                    getLocationsFromFirestore(),
                ]);

                const userLocationId = adminUser.locationId;

                const filteredBookings = userLocationId ? allBookings.filter(b => b.locationId === userLocationId) : allBookings;
                const filteredLocations = userLocationId ? allLocations.filter(l => l.id === userLocationId) : allLocations;

                setBookings(filteredBookings);
                setLocations(filteredLocations);
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to fetch booking data.");
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
                    <h1 className="text-2xl font-bold mb-2">Error Fetching Data</h1>
                    <p className="text-muted-foreground mb-6">{error}</p>
                    <Button asChild>
                        <Link href="/admin">Return to Dashboard</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
                 <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="icon" className="h-8 w-8">
                        <Link href="/admin">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="sr-only">Back to Admin</span>
                        </Link>
                    </Button>
                    <h1 className="font-headline text-xl font-semibold">View Bookings</h1>
                 </div>
                 <Button asChild>
                    <Link href="/admin/bookings/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Booking
                    </Link>
                </Button>
            </header>
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
                <BookingsList initialBookings={bookings} locations={locations} />
            </main>
        </div>
    );
}
