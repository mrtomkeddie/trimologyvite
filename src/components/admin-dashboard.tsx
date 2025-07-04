
'use client';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import type { User } from 'firebase/auth';
import { LogOut, Scissors, Users, MapPin, ArrowRight, Key, CalendarDays, Shield } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import type { AdminUser } from '@/lib/types';


type AdminDashboardProps = {
  user: User;
  adminUser: AdminUser;
};

export function AdminDashboard({ user, adminUser }: AdminDashboardProps) {

  const handleLogout = async () => {
    await signOut(auth);
  };
  
  const isSuperAdmin = !adminUser.locationId;

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
             <div className="flex flex-col">
                <h1 className="font-headline text-xl font-semibold">Admin Dashboard</h1>
                {adminUser.locationName && <p className="text-sm text-muted-foreground">Managing: {adminUser.locationName}</p>}
             </div>
             <div className="flex items-center gap-2">
                <Button onClick={handleLogout} variant="outline" size="sm">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
             </div>
        </header>
        <main className="flex-1 p-4 sm:px-6 space-y-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                 <Link href="/admin/bookings" className="block rounded-xl border bg-card text-card-foreground shadow hover:bg-accent/50 transition-colors">
                    <div className="p-6 flex flex-col justify-between h-full">
                        <div>
                            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <h3 className="tracking-tight font-semibold">View Bookings</h3>
                                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                See and manage all upcoming appointments.
                            </p>
                        </div>
                        <div className="mt-4 text-primary font-semibold flex items-center">
                            Go to Bookings <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                    </div>
                </Link>
                <Link href="/admin/services" className="block rounded-xl border bg-card text-card-foreground shadow hover:bg-accent/50 transition-colors">
                    <div className="p-6 flex flex-col justify-between h-full">
                        <div>
                            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <h3 className="tracking-tight font-semibold">Manage Services</h3>
                                <Scissors className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Add, edit, or remove salon services.
                            </p>
                        </div>
                        <div className="mt-4 text-primary font-semibold flex items-center">
                            Go to Services <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                    </div>
                </Link>
                <Link href="/admin/staff" className="block rounded-xl border bg-card text-card-foreground shadow hover:bg-accent/50 transition-colors">
                    <div className="p-6 flex flex-col justify-between h-full">
                        <div>
                            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <h3 className="tracking-tight font-semibold">Manage Staff</h3>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Add or remove staff members and their specializations.
                            </p>
                        </div>
                        <div className="mt-4 text-primary font-semibold flex items-center">
                            Go to Staff <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                    </div>
                </Link>
                {isSuperAdmin && (
                    <Link href="/admin/locations" className="block rounded-xl border bg-card text-card-foreground shadow hover:bg-accent/50 transition-colors">
                        <div className="p-6 flex flex-col justify-between h-full">
                            <div>
                                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <h3 className="tracking-tight font-semibold">Manage Locations</h3>
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Add or update your salon locations.
                                </p>
                            </div>
                            <div className="mt-4 text-primary font-semibold flex items-center">
                                Go to Locations <ArrowRight className="ml-2 h-4 w-4" />
                            </div>
                        </div>
                    </Link>
                )}
                 {isSuperAdmin && (
                    <Link href="/admin/admins" className="block rounded-xl border bg-card text-card-foreground shadow hover:bg-accent/50 transition-colors">
                        <div className="p-6 flex flex-col justify-between h-full">
                            <div>
                                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <h3 className="tracking-tight font-semibold">Manage Admins</h3>
                                    <Shield className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Add or remove branch and super admin users.
                                </p>
                            </div>
                             <div className="mt-4 text-primary font-semibold flex items-center">
                                Go to Admins <ArrowRight className="ml-2 h-4 w-4" />
                            </div>
                        </div>
                    </Link>
                )}
                <Link href="/admin/settings" className="block rounded-xl border bg-card text-card-foreground shadow hover:bg-accent/50 transition-colors">
                     <div className="p-6 flex flex-col justify-between h-full">
                        <div>
                            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <h3 className="tracking-tight font-semibold">Account Settings</h3>
                                <Key className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                               Change your account password.
                            </p>
                        </div>
                        <div className="mt-4 text-primary font-semibold flex items-center">
                            Go to Settings <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                    </div>
                </Link>
            </div>
            <div className="text-center text-sm text-muted-foreground">
                <p>
                    Welcome, {user.email}. Select a category to start managing your salon.
                </p>
            </div>
        </main>
    </div>
  );
}
