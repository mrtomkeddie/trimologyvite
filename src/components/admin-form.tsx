
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
import { addAdminWithLogin, updateAdmin } from '@/lib/firestore';
import { AdminFormSchema, type AdminUser, type Location } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Shield } from 'lucide-react';

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
                    locationId: admin.locationId || '', // Super admins have no locationId
                    password: '', // Password is not shown or edited
                });
            } else { // Adding a new admin
                form.reset({
                    email: '',
                    // Default to current user's location if they are a branch admin
                    locationId: currentUser.locationId || '',
                    password: '',
                });
            }
        }
    }, [admin, form, isOpen, currentUser.locationId]);

    const onSubmit = async (data: AdminFormValues) => {
        setIsSubmitting(true);

        try {
            if (admin) { // --- UPDATE PATH ---
                 const location = locations.find(l => l.id === data.locationId);
                 // If admin is a super admin, we don't change their role.
                 const isUpdatingSuperAdmin = !admin.locationId;

                 const submissionData: Partial<AdminUser> = {
                    email: data.email,
                 };

                 if (!isUpdatingSuperAdmin) {
                    if (!location) {
                        toast({ title: 'Error', description: 'Invalid location selected.', variant: 'destructive' });
                        setIsSubmitting(false);
                        return;
                    }
                    submissionData.locationId = location.id;
                    submissionData.locationName = location.name;
                 }
                
                await updateAdmin(admin.uid, submissionData);
                toast({ title: 'Success', description: 'Admin updated successfully.' });

            } else { // --- CREATE PATH ---
                if (!data.password || data.password.length < 6) {
                    toast({ title: 'Error', description: 'A password of at least 6 characters is required for new admins.', variant: 'destructive' });
                    setIsSubmitting(false);
                    return;
                }
                 if (!data.locationId) {
                    toast({ title: 'Error', description: 'A location must be assigned to a new admin.', variant: 'destructive' });
                    setIsSubmitting(false);
                    return;
                }
                const location = locations.find(l => l.id === data.locationId);
                if (!location) {
                     toast({ title: 'Error', description: 'Invalid location selected.', variant: 'destructive' });
                     setIsSubmitting(false);
                     return;
                }

                const submissionData = {
                    email: data.email,
                    password: data.password,
                    locationId: location.id,
                    locationName: location.name,
                };

                await addAdminWithLogin(submissionData);
                toast({ title: 'Success', description: 'Branch Admin added successfully.' });
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
    const isEditingSuperAdmin = admin && !admin.locationId;
    const isCurrentUserSuperAdmin = !currentUser.locationId;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{admin ? 'Edit Admin' : 'Add New Branch Admin'}</DialogTitle>
                    <DialogDescription>
                       {admin ? 'Update the details for this admin.' : 'Set the permissions for a new branch administrator.'}
                    </DialogDescription>
                </DialogHeader>

                {isCreatingNewAdmin && (
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Creating a New Admin</AlertTitle>
                        <AlertDescription>
                            This will create a new login and grant them admin permissions for a specific branch. Only the app provider can create Super Admins.
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
                        {isEditingSuperAdmin ? (
                             <div className="space-y-2">
                                <Label>Role / Assigned Location</Label>
                                <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-muted/50 text-muted-foreground">
                                    <Shield className="h-4 w-4 text-primary" />
                                    <span>Super Admin (All Locations)</span>
                                </div>
                             </div>
                        ) : (
                             <FormField
                                control={form.control}
                                name="locationId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Assigned Location</FormLabel>
                                        <Select 
                                            onValueChange={field.onChange} 
                                            value={field.value} 
                                            defaultValue={field.value}
                                            disabled={!isCurrentUserSuperAdmin}
                                        >
                                        <FormControl>
                                            <SelectTrigger>
                                            <SelectValue placeholder="Select a location..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
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
                        )}

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
