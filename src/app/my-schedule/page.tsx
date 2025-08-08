
'use client';

import * as React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Calendar, Clock, User as UserIcon, PoundSterling } from 'lucide-react';
import type { Staff, Booking } from '@/lib/types';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DUMMY_STAFF, DUMMY_BOOKINGS } from '@/lib/data';

// --- DUMMY DATA SETUP ---
const DUMMY_STAFF_MEMBER = DUMMY_STAFF.find(s => s.id === 'staff_1');
const DUMMY_STAFF_BOOKINGS = DUMMY_BOOKINGS.filter(b => b.staffId === 'staff_1');
// --- END DUMMY DATA ---

export default function MySchedulePage() {
    
    // This page now uses hardcoded dummy data to bypass login.
    const staff = DUMMY_STAFF_MEMBER;
    const bookings = DUMMY_STAFF_BOOKINGS;

    const handleLogout = async () => {
        // In a real app, this would sign the user out.
        // For the dummy version, we can just log to the console.
        console.log("Dummy logout clicked");
        alert("Logout functionality is disabled in dummy mode.");
    };
    
    if (!staff) {
        return <div>Error: Dummy staff member not found.</div>
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

