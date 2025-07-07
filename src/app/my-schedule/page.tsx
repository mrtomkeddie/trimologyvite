
'use client';

import * as React from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ShieldAlert, LogOut, Calendar, Clock, User as UserIcon, PoundSterling } from 'lucide-react';
import { getStaffByUid, getBookingsByStaffId } from '@/lib/firestore';
import type { Staff, Booking } from '@/lib/types';
import { format } from 'date-fns';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';

export default function MySchedulePage() {
    const router = useRouter();
    const [user, setUser] = React.useState<User | null>(null);
    const [staff, setStaff] = React.useState<Staff | null>(null);
    const [bookings, setBookings] = React.useState<Booking[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                try {
                    const staffProfile = await getStaffByUid(currentUser.uid);
                    if (staffProfile) {
                        setStaff(staffProfile);
                        const upcomingBookings = await getBookingsByStaffId(staffProfile.id);
                        setBookings(upcomingBookings);
                    } else {
                        throw new Error("You are not authorized to view this page.");
                    }
                } catch (e) {
                    setError(e instanceof Error ? e.message : "Failed to fetch staff data.");
                } finally {
                    setLoading(false);
                }
            } else {
                router.push('/staff/login');
            }
        });
        return () => unsubscribe();
    }, [router]);

    const handleLogout = async () => {
        await signOut(auth);
        // The auth listener will now handle the redirect.
    };

    if (loading) {
        return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
    }

    if (error || !staff) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background text-center p-4">
                <div>
                    <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
                    <p className="text-muted-foreground mb-6">
                        {error || "You do not have permission to access this page."}
                    </p>
                    <Button asChild>
                        <Link href="/staff/login">Return to Login</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
             <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={staff.imageUrl} alt={staff.name} data-ai-hint="person portrait" />
                        <AvatarFallback>{staff.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <h1 className="font-headline text-xl font-semibold">My Schedule</h1>
                        <p className="text-sm text-muted-foreground">Welcome back, {staff.name}!</p>
                    </div>
                </div>
                <Button onClick={handleLogout} variant="outline" size="sm">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </header>
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Upcoming Appointments</CardTitle>
                        <CardDescription>Here are your scheduled appointments for the upcoming days.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {bookings.length > 0 ? (
                            <div className="space-y-4">
                                {bookings.map(booking => (
                                    <div key={booking.id} className="flex items-center space-x-4 rounded-lg border p-4">
                                        <div className="flex flex-col items-center justify-center text-center p-2 rounded-md bg-primary/10 w-24">
                                            <span className="text-sm font-bold text-primary uppercase">{format(new Date(booking.bookingTimestamp), 'MMM')}</span>
                                            <span className="text-2xl font-bold text-primary">{format(new Date(booking.bookingTimestamp), 'dd')}</span>
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex justify-between items-center">
                                                <p className="text-sm font-medium leading-none">{booking.serviceName}</p>
                                                {booking.servicePrice != null && (
                                                    <div className="flex items-center text-sm font-medium text-primary">
                                                        <PoundSterling className="mr-1 h-4 w-4" />
                                                        {booking.servicePrice.toFixed(2)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center text-sm text-muted-foreground">
                                                <Clock className="mr-2 h-4 w-4" />
                                                {format(new Date(booking.bookingTimestamp), 'p')}
                                            </div>
                                            <div className="flex items-center pt-1 text-sm text-muted-foreground">
                                                <UserIcon className="mr-2 h-4 w-4" />
                                                 {booking.clientName} - {booking.clientPhone}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-semibold">No upcoming appointments</h3>
                                <p className="mt-1 text-sm text-muted-foreground">Enjoy your free time!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
