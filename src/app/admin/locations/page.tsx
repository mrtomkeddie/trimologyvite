
'use client';
import * as React from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { getLocationsFromFirestore } from '@/lib/firestore';
import type { Location } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, QrCode, ShieldAlert, UploadCloud, Download } from "lucide-react";
import Link from "next/link";
import { QrCodeUploadDialog } from '@/components/qr-upload-dialog';
import Image from 'next/image';

export default function ManageLocationsPage() {
    const { adminUser } = useAdmin();
    const [locations, setLocations] = React.useState<Location[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [origin, setOrigin] = React.useState('');
    const [isUploadDialogOpen, setIsUploadDialogOpen] = React.useState(false);
    const [selectedLocation, setSelectedLocation] = React.useState<Location | null>(null);

    const fetchData = React.useCallback(async () => {
        if (!adminUser) return;
        setLoading(true);
        try {
            const fetchedLocations = await getLocationsFromFirestore(adminUser.locationId);
            setLocations(fetchedLocations);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to fetch location data.");
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [adminUser]);

    React.useEffect(() => {
        setOrigin(window.location.origin);
        fetchData();
    }, [fetchData]);

    const handleUploadClick = (location: Location) => {
        setSelectedLocation(location);
        setIsUploadDialogOpen(true);
    };
    
    const handleUploadComplete = () => {
        setIsUploadDialogOpen(false);
        setSelectedLocation(null);
        fetchData(); // Re-fetch data to show the new QR code
    }

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
                        For each location, you can upload the QR code image you've created. This keeps everything in one place, ready to print or display.
                    </p>
                </div>

                {locations.length > 0 ? (
                    <div className="grid gap-6 w-full max-w-4xl md:grid-cols-2">
                        {locations.map(location => (
                            <Card key={location.id} className="shadow-lg">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle>{location.name}</CardTitle>
                                        <QrCode className="h-6 w-6 text-primary" />
                                    </div>
                                    <CardDescription>{location.address}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex flex-col items-center justify-center gap-4">
                                    {location.qrCodeUrl ? (
                                        <div className='text-center w-full'>
                                             <div className="relative w-48 h-48 mx-auto border-4 border-primary rounded-lg overflow-hidden">
                                                <Image 
                                                    src={location.qrCodeUrl} 
                                                    alt={`${location.name} QR Code`} 
                                                    layout="fill"
                                                    objectFit='contain'
                                                    data-ai-hint="qr code"
                                                />
                                            </div>
                                            <div className="flex gap-2 mt-4 justify-center">
                                                <Button asChild variant="secondary">
                                                    <a href={location.qrCodeUrl} download={`${location.name}-QR-Code.png`}>
                                                         <Download className="mr-2 h-4 w-4" />
                                                         Download
                                                    </a>
                                                </Button>
                                                <Button variant="outline" onClick={() => handleUploadClick(location)}>Replace</Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className='text-center w-full p-4 border-2 border-dashed rounded-lg bg-muted/50'>
                                            <p className="text-sm text-muted-foreground mb-4">No QR code uploaded yet. Use the link below with any online generator.</p>
                                             <input 
                                                type="text" 
                                                readOnly 
                                                value={`${origin}/check-in/${location.id}`} 
                                                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-center mb-4"
                                            />
                                            <Button onClick={() => handleUploadClick(location)}>
                                                <UploadCloud className="mr-2 h-4 w-4" />
                                                Upload QR Code Image
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground mt-8">No locations found.</p>
                )}
            </main>
             {selectedLocation && (
                <QrCodeUploadDialog
                    isOpen={isUploadDialogOpen}
                    setIsOpen={setIsUploadDialogOpen}
                    location={selectedLocation}
                    onUploadComplete={handleUploadComplete}
                />
            )}
        </div>
    );
}
