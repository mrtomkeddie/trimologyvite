'use client';
import * as React from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { getLocationsFromFirestore } from '@/lib/firestore';
import type { Location } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, QrCode, ShieldAlert, Copy } from "lucide-react";
import Link from "next/link";
import { useToast } from '@/hooks/use-toast';

export default function ManageLocationsPage() {
    const { adminUser } = useAdmin();
    const [locations, setLocations] = React.useState<Location[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [origin, setOrigin] = React.useState('');
    const { toast } = useToast();

    React.useEffect(() => {
        // This ensures window.location.origin is available
        setOrigin(window.location.origin);

        if (!adminUser) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch locations based on admin's scope
                const fetchedLocations = await getLocationsFromFirestore(adminUser.locationId);
                setLocations(fetchedLocations);
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to fetch location data.");
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [adminUser]);
    
    const handleCopy = (url: string) => {
        navigator.clipboard.writeText(url);
        toast({ title: "Copied!", description: "URL copied to clipboard." });
    };

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
             <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
                <Button asChild variant="outline" size="icon" className="h-8 w-8">
                    <Link href="/admin">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back to Admin</span>
                    </Link>
                </Button>
                <h1 className="font-headline text-xl font-semibold">Walk-in QR Codes</h1>
            </header>
            <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col items-center gap-6">
                <div className="text-center max-w-2xl">
                    <h2 className="text-2xl font-bold">Manage Walk-in Customer Check-in</h2>
                    <p className="text-muted-foreground mt-2">
                        Generate QR codes for your locations to allow walk-in customers to check themselves in quickly. Use any free online QR code generator (like `the-qrcode-generator.com`) with the URLs below.
                    </p>
                </div>

                {locations.length > 0 ? (
                    <div className="grid gap-6 w-full max-w-4xl md:grid-cols-2">
                        {locations.map(location => {
                            const walkinUrl = `${origin}/check-in/${location.id}`;
                            return (
                                <Card key={location.id} className="shadow-lg">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle>{location.name}</CardTitle>
                                            <QrCode className="h-6 w-6 text-primary" />
                                        </div>
                                        <CardDescription>{location.address}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm font-semibold mb-2">Walk-in URL:</p>
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="text" 
                                                readOnly 
                                                value={walkinUrl} 
                                                className="flex-grow bg-muted/50 border border-input rounded-md px-3 py-2 text-sm"
                                            />
                                            <Button variant="outline" size="icon" onClick={() => handleCopy(walkinUrl)}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                ) : (
                    <p className="text-muted-foreground mt-8">No locations found.</p>
                )}
            </main>
        </div>
    );
}
