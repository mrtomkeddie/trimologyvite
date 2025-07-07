
'use client';
import * as React from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { getLocationsFromFirestore } from '@/lib/firestore';
import type { Location } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, QrCode, ShieldAlert, Download } from "lucide-react";
import Link from "next/link";
import { QRCodeCanvas } from 'qrcode.react';

// QR Code Display Component
const QrCodeDisplay = ({ location, origin }: { location: Location; origin: string }) => {
  const qrRef = React.useRef<HTMLDivElement>(null);
  const checkinUrl = `${origin}/check-in/${location.id}`;

  const handleDownload = () => {
    if (qrRef.current) {
      const canvas = qrRef.current.querySelector('canvas');
      if (canvas) {
        const pngUrl = canvas
          .toDataURL("image/png")
          .replace("image/png", "image/octet-stream");
        let downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `${location.name}-QR-Code.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    }
  };

  return (
    <div className='text-center w-full p-4 flex flex-col items-center justify-center gap-4'>
      <div className="relative w-48 h-48 mx-auto border-4 border-primary rounded-lg overflow-hidden p-2 bg-white" ref={qrRef}>
        <QRCodeCanvas
          value={checkinUrl}
          size={256} // High resolution for canvas
          bgColor={"#ffffff"}
          fgColor={"#000000"}
          level={"L"}
          includeMargin={false}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      <div className="flex gap-2 mt-2 justify-center">
        <Button onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
      </div>
      <div className="mt-2 max-w-xs mx-auto w-full">
        <label className="text-xs text-muted-foreground">Check-in URL:</label>
        <input
          type="text"
          readOnly
          value={checkinUrl}
          className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-center mt-1"
          onFocus={(e) => e.target.select()}
        />
      </div>
    </div>
  );
};


export default function ManageLocationsPage() {
    const { adminUser } = useAdmin();
    const [locations, setLocations] = React.useState<Location[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [origin, setOrigin] = React.useState('');

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
                        For each location, a unique QR code is automatically generated. You can download this code to print or display for walk-in customers.
                    </p>
                </div>

                {locations.length > 0 ? (
                    <div className="grid gap-6 w-full max-w-2xl">
                        {locations.map(location => (
                            <Card key={location.id} className="shadow-lg">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle>{location.name}</CardTitle>
                                        <QrCode className="h-6 w-6 text-primary" />
                                    </div>
                                    <CardDescription>{location.address}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <QrCodeDisplay location={location} origin={origin} />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground mt-8">No locations found.</p>
                )}
            </main>
        </div>
    );
}
