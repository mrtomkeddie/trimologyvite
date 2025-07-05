
'use client';
import * as React from 'react';
import { getAdminsFromFirestore, getLocationsFromFirestore, getAdminUser } from "@/lib/firestore";
import { AdminsList } from "@/components/admins-list";
import { ArrowLeft, Loader2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { AdminUser, Location } from '@/lib/types';

export default function ManageAdminsPage() {
    const [adminUser, setAdminUser] = React.useState<AdminUser | null>(null);
    const [admins, setAdmins] = React.useState<AdminUser[]>([]);
    const [locations, setLocations] = React.useState<Location[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [isAuthorized, setIsAuthorized] = React.useState(false);

    const fetchData = React.useCallback(async (user: User) => {
        setLoading(true);
        setError(null);
        try {
            // Fetch all data in parallel for performance
            const [fetchedAdminUser, allAdmins, allLocations] = await Promise.all([
                getAdminUser(user.uid),
                getAdminsFromFirestore(), // Fetch all admins
                getLocationsFromFirestore()  // Fetch all locations
            ]);

            if (!fetchedAdminUser) {
                throw new Error("You are not authorized to manage admins.");
            }
            
            setIsAuthorized(true);
            setAdminUser(fetchedAdminUser);
            setLocations(allLocations); // Set all locations for the form dropdown

            // A super admin sees all admins. A branch admin sees only their own.
            const filteredAdmins = fetchedAdminUser.locationId
                ? allAdmins.filter(a => a.locationId === fetchedAdminUser.locationId)
                : allAdmins;
            setAdmins(filteredAdmins);

        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to fetch data.");
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                await fetchData(user);
            } else {
                setLoading(false);
                setError("Please log in to continue.");
            }
        });
        return () => unsubscribe();
    }, [fetchData]);

    const handleDataChange = () => {
        if (auth.currentUser) {
            fetchData(auth.currentUser);
        }
    };


    if (loading) {
        return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
    }

    if (error || !isAuthorized) {
         return (
            <div className="flex min-h-screen items-center justify-center bg-background text-center p-4">
                <div>
                    <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
                    <p className="text-muted-foreground mb-6">
                        {error || "You do not have permission to access this page."}
                    </p>
                    <Button asChild>
                        <Link href="/admin">Return to Dashboard</Link>
                    </Button>
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
                <h1 className="font-headline text-xl font-semibold">Manage Admins</h1>
            </header>
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
                <AdminsList initialAdmins={admins} locations={locations} currentUser={adminUser} onDataChange={handleDataChange} />
            </main>
        </div>
    );
}
