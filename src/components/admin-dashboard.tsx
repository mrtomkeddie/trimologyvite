
'use client';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import type { User } from 'firebase/auth';
import { LogOut, Scissors, Users, MapPin, ArrowRight } from 'lucide-react';
import Link from 'next/link';

type AdminDashboardProps = {
  user: User;
};

export function AdminDashboard({ user }: AdminDashboardProps) {
  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
             <h1 className="font-headline text-xl font-semibold">Admin Dashboard</h1>
             <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
             </Button>
        </header>
        <main className="flex-1 p-4 sm:px-6 space-y-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border bg-card text-card-foreground shadow">
                    <Link href="/admin/services" className="block hover:bg-accent/50 rounded-xl transition-colors">
                        <div className="p-6">
                            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <h3 className="tracking-tight font-semibold">Manage Services</h3>
                                <Scissors className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="pt-0">
                                <p className="text-sm text-muted-foreground">
                                    Add, edit, or remove salon services.
                                </p>
                                <div className="mt-4 text-primary font-semibold flex items-center">
                                    Go to Services <ArrowRight className="ml-2 h-4 w-4" />
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>
                 <div className="rounded-xl border bg-card text-card-foreground shadow">
                    <Link href="/admin/staff" className="block hover:bg-accent/50 rounded-xl transition-colors">
                        <div className="p-6">
                            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <h3 className="tracking-tight font-semibold">Manage Staff</h3>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="pt-0">
                                <p className="text-sm text-muted-foreground">
                                    Add or remove staff members and their specializations.
                                </p>
                                 <div className="mt-4 text-primary font-semibold flex items-center">
                                    Go to Staff <ArrowRight className="ml-2 h-4 w-4" />
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>
                 <div className="rounded-xl border bg-card text-card-foreground shadow">
                    <Link href="/admin/locations" className="block hover:bg-accent/50 rounded-xl transition-colors">
                        <div className="p-6">
                            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <h3 className="tracking-tight font-semibold">Manage Locations</h3>
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="pt-0">
                                <p className="text-sm text-muted-foreground">
                                    Add or update your salon locations.
                                </p>
                                <div className="mt-4 text-primary font-semibold flex items-center">
                                    Go to Locations <ArrowRight className="ml-2 h-4 w-4" />
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>
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
