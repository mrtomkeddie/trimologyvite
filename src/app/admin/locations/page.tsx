
'use client';
import * as React from 'react';
import { getLocationsFromFirestore, getAdminUser } from "@/lib/firestore";
import { LocationsList } from "@/components/locations-list";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { Location } from '@/lib/types';

export default function ManageLocationsPage() {
    const [locations, setLocations] = React.useState<Location[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

     React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const adminUser = await getAdminUser(user.uid);
                    if (adminUser && !adminUser.locationId) { // Only super admins can see this
                        const fetchedLocations = await getLocationsFromFirestore();
                        setLocations(fetchedLocations);
                    } else {
                        setError("You are not authorized to manage locations.");
                    }
                } catch (e) {
                    setError("Failed to fetch location data.");
                    console.error(e);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
                setError("Please log in to continue.");
            }
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
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
                <h1 className="font-headline text-xl font-semibold">Manage Locations</h1>
            </header>
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
                 {error ? (
                    <div className="text-center text-destructive">{error}</div>
                ) : (
                    <LocationsList initialLocations={locations} />
                )}
            </main>
        </div>
    );
}
