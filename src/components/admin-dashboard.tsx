
'use client';
import { signOut, updatePassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import type { User } from 'firebase/auth';
import { LogOut, Scissors, Users, MapPin, ArrowRight, Key, Loader2 } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';


type AdminDashboardProps = {
  user: User;
};

export function AdminDashboard({ user }: AdminDashboardProps) {
  const { toast } = useToast();
  const [newPassword, setNewPassword] = React.useState('');
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = React.useState(false);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
        toast({ title: 'Error', description: 'Password must be at least 6 characters.', variant: 'destructive' });
        return;
    }
    setIsChangingPassword(true);
    try {
        if (auth.currentUser) {
            await updatePassword(auth.currentUser, newPassword);
            await signOut(auth);
            toast({ title: 'Success', description: 'Password updated. Please log in again with your new password.' });
            // The component will unmount after sign-out, no need to manually close dialog or reset state.
        } else {
            throw new Error('No user is currently signed in.');
        }
    } catch (error) {
        toast({ title: 'Error', description: 'Could not change password. You may need to sign out and sign back in to continue.', variant: 'destructive' });
        setIsChangingPassword(false);
    }
  };


  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
             <h1 className="font-headline text-xl font-semibold">Admin Dashboard</h1>
             <div className="flex items-center gap-2">
                <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                            <Key className="mr-2 h-4 w-4" />
                            Change Password
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Change Your Password</DialogTitle>
                            <DialogDescription>
                                Enter a new password below. You will be signed out after updating it.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2 py-4">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Must be at least 6 characters"
                                required
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsChangePasswordOpen(false)}>Cancel</Button>
                            <Button onClick={handleChangePassword} disabled={isChangingPassword}>
                                {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Update and Sign Out
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                <Button onClick={handleLogout} variant="outline" size="sm">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
             </div>
        </header>
        <main className="flex-1 p-4 sm:px-6 space-y-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Link href="/admin/services" className="block rounded-xl border bg-card text-card-foreground shadow hover:bg-accent/50 transition-colors">
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
                <Link href="/admin/staff" className="block rounded-xl border bg-card text-card-foreground shadow hover:bg-accent/50 transition-colors">
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
                <Link href="/admin/locations" className="block rounded-xl border bg-card text-card-foreground shadow hover:bg-accent/50 transition-colors">
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
            <div className="text-center text-sm text-muted-foreground">
                <p>
                    Welcome, {user.email}. Select a category to start managing your salon.
                </p>
            </div>
        </main>
    </div>
  );
}
