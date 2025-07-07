
import * as React from 'react';
import { getStaffFromFirestore, getLocationsFromFirestore } from "@/lib/firestore";
import { StaffList } from "@/components/staff-list";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { AdminUser } from '@/lib/types';
import { auth } from '@/lib/firebase';
import { getAdminUser } from '@/lib/firestore';
import { redirect } from 'next/navigation';

async function getPageData(user: AdminUser) {
    const userLocationId = user.locationId;
    // Fetch only the data relevant to the admin's scope.
    const [filteredStaff, filteredLocations] = await Promise.all([
        getStaffFromFirestore(userLocationId),
        getLocationsFromFirestore(userLocationId),
    ]);
    return { staff: filteredStaff, locations: filteredLocations };
}

export default async function ManageStaffPage() {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
        redirect('/admin');
    }
    const adminUser = await getAdminUser(currentUser.uid, currentUser.email);
    if (!adminUser) {
        redirect('/admin');
    }

    const { staff, locations } = await getPageData(adminUser);
    
    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
                 <Button asChild variant="outline" size="icon" className="h-8 w-8">
                    <Link href="/admin">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back to Admin</span>
                    </Link>
                </Button>
                <h1 className="font-headline text-xl font-semibold">Manage Staff</h1>
            </header>
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
                <StaffList initialStaff={staff} locations={locations} />
            </main>
        </div>
    );
}
