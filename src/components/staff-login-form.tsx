
'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn } from 'lucide-react';
import Link from 'next/link';
import { DUMMY_STAFF } from '@/lib/dummy-data';

export function StaffLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // On success, the onAuthStateChanged listener in the login page will handle the redirect.
    } catch (error) {
        const errorCode = (error as any).code;
        
        // Special handling for demo users: if user doesn't exist, create them
        const isDummyUser = DUMMY_STAFF.some(u => u.email === email);
        if (errorCode === 'auth/user-not-found' && isDummyUser) {
            try {
                if (password.length < 6) {
                     toast({ title: 'Password Too Short', description: 'Your password must be at least 6 characters long.', variant: 'destructive'});
                     setIsLoading(false);
                     return;
                }
                // Create the user in Firebase Auth. The `getStaffByUid` will handle
                // creating their profile in Firestore on the first successful login.
                await createUserWithEmailAndPassword(auth, email, password);
                toast({ title: 'Account Created', description: "We've created a new account for this demo user. You are now logged in." });
                // The onAuthStateChanged listener will handle the rest.
                return;
            } catch (creationError) {
                 toast({ title: 'Creation Failed', description: 'Could not create demo user account.', variant: 'destructive'});
                 setIsLoading(false);
                 return;
            }
        }
        
        if (errorCode === 'auth/user-not-found' || errorCode === 'auth/invalid-credential') {
             toast({
                title: 'Login Failed',
                description: 'The email or password you entered is incorrect. Please try again or use "Forgot Password".',
                variant: 'destructive',
            });
        } else {
            toast({
                title: 'Login Failed',
                description: 'Invalid credentials. Please try again.',
                variant: 'destructive',
            });
        }
        setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
        toast({ title: 'Error', description: 'Please enter your email address.', variant: 'destructive' });
        return;
    }
    setIsResetting(true);
    try {
        await sendPasswordResetEmail(auth, resetEmail);
        toast({ title: 'Password Reset Email Sent', description: 'Check your inbox for instructions to reset your password.' });
        document.getElementById('close-staff-reset-dialog')?.click();
    } catch (error) {
        toast({ title: 'Error', description: 'Could not send password reset email. Please check the address and try again.', variant: 'destructive' });
    } finally {
        setIsResetting(false);
        setResetEmail('');
    }
  };


  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Staff Login</CardTitle>
          <CardDescription>Enter your credentials to view your schedule.</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="staff@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-4 pt-4">
             <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
            <Dialog onOpenChange={(open) => !open && setResetEmail('')}>
                <DialogTrigger asChild>
                    <Button variant="link" size="sm" className="w-full font-normal text-sm -mt-2">Forgot Password?</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reset Staff Password</DialogTitle>
                        <DialogDescription>
                            Enter the staff member's email address and we'll send a link to reset their password.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-4">
                        <Label htmlFor="reset-email">Email</Label>
                        <Input
                            id="reset-email"
                            type="email"
                            placeholder="staff@example.com"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            required
                        />
                    </div>
                    <DialogFooter>
                         <DialogClose asChild>
                           <Button variant="outline" id="close-staff-reset-dialog">Cancel</Button>
                         </DialogClose>
                        <Button onClick={handlePasswordReset} disabled={isResetting}>
                            {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Reset Link
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors mt-2">
                &larr; Return to Home
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
