
'use client';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addAdmin, updateAdmin } from '@/lib/firestore';
import { AdminFormSchema, type AdminUser, type Location } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

type AdminFormValues = z.infer<typeof AdminFormSchema>;

type AdminFormProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    admin: AdminUser | null;
    locations: Location[];
    onSubmitted: () => void;
    currentUser: AdminUser;
};

export function AdminForm({ isOpen, setIsOpen, admin, locations, onSubmitted, currentUser }: AdminFormProps) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const { toast } = useToast();
    const isCurrentUserBranchAdmin = !!currentUser.locationId;
    
    const form = useForm<AdminFormValues>({
        resolver: zodResolver(AdminFormSchema),
        defaultValues: {
            email: '',
            locationId: '',
            password: '',
        }
    });

    React.useEffect(() => {
        if (isOpen) {
            if (admin) { // Editing an existing admin
                form.reset({
                    email: admin.email,
                    locationId: admin.locationId || 'super',
                    password: '', // Password is not shown or edited
                });
            } else { // Adding a new admin
                form.reset({
                    email: '',
                    locationId: isCurrentUserBranchAdmin ? currentUser.locationId : '',
                    password: '',
                });
            }
        }
    }, [admin, form, isOpen, isCurrentUserBranchAdmin, currentUser.locationId]);

    const onSubmit = async (data: AdminFormValues) => {
        setIsSubmitting(true);
        
        const isSuper = data.locationId === 'super' || !data.locationId;
        const location = isSuper ? null : locations.find(l => l.id === data.locationId);
        
        if (!isSuper && !location) {
             toast({ title: 'Error', description: 'Invalid location selected.', variant: 'destructive' });
             setIsSubmitting(false);
             return;
        }

        try {
            if (admin) { // --- UPDATE PATH ---
                 const submissionData: {email: string; locationId?: string; locationName?: string} = {
                    email: data.email,
                    locationId: isSuper ? undefined : data.locationId,
                    locationName: isSuper ? undefined : location?.name,
                };
                if(submissionData.locationId === undefined) delete submissionData.locationId;
                if(submissionData.locationName === undefined) delete submissionData.locationName;

                await updateAdmin(admin.uid, submissionData);
                toast({ title: 'Success', description: 'Admin updated successfully.' });
            } else { // --- CREATE PATH ---
                if (!data.password || data.password.length < 6) {
                    toast({ title: 'Error', description: 'A password of at least 6 characters is required for new admins.', variant: 'destructive' });
                    setIsSubmitting(false);
                    return;
                }
                 const submissionData = {
                    email: data.email,
                    password: data.password,
                    locationId: isSuper ? undefined : data.locationId,
                    locationName: isSuper ? undefined : location?.name,
                };
                if(submissionData.locationId === undefined) delete submissionData.locationId;
                if(submissionData.locationName === undefined) delete submissionData.locationName;

                await addAdmin(submissionData);
                toast({ title: 'Success', description: 'Admin added successfully.' });
            }
            onSubmitted();
            setIsOpen(false);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Something went wrong. This email might already be in use.';
            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isCreatingNewAdmin = !admin;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{admin ? 'Edit Admin' : 'Add New Admin'}</DialogTitle>
                    <DialogDescription>
                       {admin ? 'Update the details for this admin.' : 'Set the permissions for a new admin user.'}
                    </DialogDescription>
                </DialogHeader>

                {isCreatingNewAdmin && (
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Creating a New Admin</AlertTitle>
                        <AlertDescription>
                            Entering an email and a temporary password below will create a new login for this user and grant them admin permissions.
                        </AlertDescription>
                    </Alert>
                )}


                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                         <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="user@example.com" {...field} disabled={!isCreatingNewAdmin} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="locationId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Role / Assigned Location</FormLabel>
                                    <Select 
                                        onValueChange={field.onChange} 
                                        value={field.value} 
                                        defaultValue={field.value}
                                        disabled={isCurrentUserBranchAdmin}
                                    >
                                    <FormControl>
                                        <SelectTrigger>
                                        <SelectValue placeholder="Select a role..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {!isCurrentUserBranchAdmin && (
                                            <SelectItem value="super">Super Admin (All locations)</SelectItem>
                                        )}
                                        {locations.map((location) => (
                                            <SelectItem key={location.id} value={location.id}>
                                                Branch Admin: {location.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {isCreatingNewAdmin && (
                             <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Temporary Password</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="password"
                                                placeholder="Min. 6 characters"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}


                        <div className="flex justify-end pt-4">
                             <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {admin ? 'Save Changes' : 'Add Admin'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
