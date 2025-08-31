
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
import { setAdminRecord, updateAdmin } from '@/lib/supabase-service';
import { useAuth } from '@/contexts/AuthContext';
import { AdminFormSchema, type AdminUser, type Location, type Staff } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Shield, Link2 } from 'lucide-react';

type AdminFormValues = z.infer<typeof AdminFormSchema>;

type AdminFormProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    admin: AdminUser | null;
    locations: Location[];
    staff: Staff[];
    allAdmins: AdminUser[];
    onSubmitted: () => void;
    currentUser: AdminUser;
};

export function AdminForm({ isOpen, setIsOpen, admin, locations, staff, allAdmins, onSubmitted, currentUser }: AdminFormProps) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [selectedStaffId, setSelectedStaffId] = React.useState<string>('new-user');
    const { toast } = useToast();
    const { signUp } = useAuth();
    
    const form = useForm<AdminFormValues>({
        resolver: zodResolver(AdminFormSchema),
        defaultValues: {
            email: '',
            locationId: '',
            password: '',
        }
    });

    const staffToPromote = React.useMemo(() => {
        if (!staff || !allAdmins) return [];
        const adminEmails = new Set(allAdmins.map(a => a.email));
        return staff.filter(s => s.email && !adminEmails.has(s.email));
    }, [staff, allAdmins]);

    React.useEffect(() => {
        if (isOpen) {
            setSelectedStaffId('new-user'); // Reset on open
            if (admin) { // Editing an existing admin
                form.reset({
                    email: admin.email,
                    locationId: admin.locationId || '', // Super admins have no locationId
                    password: '', // Password is not shown or edited
                });
            } else { // Adding a new admin
                form.reset({
                    email: '',
                    locationId: currentUser.locationId || (locations.length > 0 ? locations[0].id : ''),
                    password: '',
                });
            }
        }
    }, [admin, form, isOpen, currentUser.locationId, locations]);

     React.useEffect(() => {
        // When a staff member is selected from the dropdown
        if (selectedStaffId && selectedStaffId !== 'new-user') {
            const selected = staff.find(s => s.id === selectedStaffId);
            if (selected) {
                form.setValue('email', selected.email || '');
            }
        } else {
            // When un-selecting or choosing "new user", clear the email if we are creating a new admin
            if (!admin) {
                form.setValue('email', '');
            }
        }
    }, [selectedStaffId, staff, form, admin]);


    const onSubmit = async (data: AdminFormValues) => {
        setIsSubmitting(true);

        try {
            if (admin) { // --- UPDATE PATH ---
                 const location = locations.find(l => l.id === data.locationId);
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
                
                await updateAdmin(admin.id, submissionData);
                toast({ title: 'Success', description: 'Admin updated successfully.' });

            } else { // --- CREATE PATH ---
                const selectedStaffMember = staff.find(s => s.id === selectedStaffId);

                if (selectedStaffMember) { // --- SCENARIO 1: PROMOTE EXISTING STAFF ---
                    const uid = selectedStaffMember.id;
                    const location = locations.find(l => l.id === data.locationId);
                    if (!location) throw new Error("A location must be assigned.");

                    const submissionData = {
                        email: selectedStaffMember.email!,
                        locationId: location.id,
                        locationName: location.name,
                    };
                    
                    await setAdminRecord(uid, submissionData);
                    toast({ title: 'Success', description: 'Staff member promoted to Admin successfully.' });

                } else { // --- SCENARIO 2: CREATE NEW ADMIN USER ---
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


                    try {
                        const { data: authData } = await signUp(data.email, data.password);
                        const uid = authData.user?.id;
                        
                        if (!uid) throw new Error('Failed to create user account');

                        const submissionData = {
                            email: data.email,
                            locationId: location.id,
                            locationName: location.name,
                        };
                        
                        await setAdminRecord(uid, submissionData);
                        toast({ title: 'Success', description: 'Branch Admin added successfully.' });
                    } catch (authError) {
                        throw authError;
                    }
                }
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
    const isPromotingStaff = selectedStaffId && selectedStaffId !== 'new-user';

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{admin ? 'Edit Admin' : 'Add New Branch Admin'}</DialogTitle>
                    <DialogDescription>
                       {admin ? 'Update the details for this admin.' : 'Set the permissions for a new branch administrator.'}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">

                        {isCreatingNewAdmin && (
                             <div className="space-y-4 rounded-md border p-4 bg-muted/30">
                                <div className="flex items-center gap-3">
                                    <Link2 className="h-5 w-5 text-primary" />
                                    <h4 className="font-medium text-base">Promote Staff Member</h4>
                                </div>
                                <p className="text-sm text-muted-foreground">To grant admin access to an existing staff member, select them from this list.</p>
                                <Select onValueChange={setSelectedStaffId} value={selectedStaffId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Or, create a new user below..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="new-user">-- Create New Admin User --</SelectItem>
                                        {staffToPromote.map(s => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {s.name} ({s.email})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        
                        <Alert variant="default">
                            <Info className="h-4 w-4" />
                            <AlertTitle>Admin & Staff Roles</AlertTitle>
                            <AlertDescription>
                                To make an Admin also a bookable stylist, ensure you create a profile for them in the <strong>Manage Staff</strong> section using the same email address.
                            </AlertDescription>
                        </Alert>
                         <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="user@example.com" {...field} disabled={!!admin || isPromotingStaff} />
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
                                            disabled={!isCurrentUserSuperAdmin && !!currentUser.locationId}
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

                        {isCreatingNewAdmin && !isPromotingStaff && (
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
