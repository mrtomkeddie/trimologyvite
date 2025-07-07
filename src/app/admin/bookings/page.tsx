
import * as React from 'react';
import { getBookingsFromFirestore, getLocationsFromFirestore } from "@/lib/firestore";
import { BookingsList } from "@/components/bookings-list";
import { ArrowLeft, PlusCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { AdminUser } from '@/lib/types';
import { auth } from '@/lib/firebase';
import { getAdminUser } from '@/lib/firestore';
import { redirect } from 'next/navigation';

async function getPageData(user: AdminUser) {
    const userLocationId = user.locationId;
    const [filteredBookings, filteredLocations] = await Promise.all([
        getBookingsFromFirestore(userLocationId),
        getLocationsFromFirestore(userLocationId),
    ]);
    return { bookings: filteredBookings, locations: filteredLocations };
}

export default async function ManageBookingsPage() {
    const currentUser = auth.currentUser;
    // This is a protected route. Redirect to login if not authenticated.
    if (!currentUser || !currentUser.email) {
        redirect('/admin');
    }
    
    const adminUser = await getAdminUser(currentUser.uid, currentUser.email);
    
    // Or if they are not a valid admin user in Firestore.
    if (!adminUser) {
        redirect('/admin');
    }

    const { bookings, locations } = await getPageData(adminUser);

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
