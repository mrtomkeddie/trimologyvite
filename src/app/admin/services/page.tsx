

import { getServicesFromFirestore, getLocationsFromFirestore } from "@/lib/firestore";
import { ServicesList } from "@/components/services-list";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ManageServicesPage() {
    const services = await getServicesFromFirestore();
    const locations = await getLocationsFromFirestore();

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
                <ServicesList initialServices={services} locations={locations} />
            </main>
        </div>
    );
}
