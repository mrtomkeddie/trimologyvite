
'use client';
import * as React from 'react';
import { getBookingsFromFirestore, getLocationsFromFirestore, getAdminUser } from "@/lib/firestore";
import { BookingsList } from "@/components/bookings-list";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { AdminUser, Booking, Location } from '@/lib/types';

export default function ManageBookingsPage() {
    const [adminUser, setAdminUser] = React.useState<AdminUser | null>(null);
    const [bookings, setBookings] = React.useState<Booking[]>([]);
    const [locations, setLocations] = React.useState<Location[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

     React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const fetchedAdminUser = await getAdminUser(user.uid);
                    setAdminUser(fetchedAdminUser);
                    // A branch admin will have a locationId, a super admin will not.
                    const userLocationId = fetchedAdminUser?.locationId;
                    const [fetchedBookings, fetchedLocations] = await Promise.all([
                        getBookingsFromFirestore(userLocationId),
                        getLocationsFromFirestore(userLocationId)
                    ]);
                    setBookings(fetchedBookings);
                    setLocations(fetchedLocations);
                } catch (e) {
                    setError("Failed to fetch booking data.");
                    console.error(e);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
                setError("Please log in to view bookings.");
            }
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
    }

    if (error) {
        return <div className="flex h-screen w-full items-center justify-center text-destructive">{error}</div>;
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
                <h1 className="font-headline text-xl font-semibold">View Bookings</h1>
            </header>
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
                <BookingsList initialBookings={bookings} locations={locations} />
            </main>
        </div>
    );
}
