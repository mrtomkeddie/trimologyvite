
'use client';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription as FormDesc } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addStaff, updateStaff } from '@/lib/firestore';
import { StaffFormSchema, type Staff, type Location } from '@/lib/types';
import { Loader2 } from 'lucide-react';

type StaffFormValues = z.infer<typeof StaffFormSchema>;

type StaffFormProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    staffMember: Staff | null;
    locations: Location[];
    onSubmitted: () => void;
};

export function StaffForm({ isOpen, setIsOpen, staffMember, locations, onSubmitted }: StaffFormProps) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const { toast } = useToast();
    
    const form = useForm<StaffFormValues>({
        resolver: zodResolver(StaffFormSchema),
        defaultValues: {
            name: '',
            specialization: '',
            locationId: '',
            uid: '',
            email: '',
            imageUrl: '',
        }
    });

    React.useEffect(() => {
        if (isOpen) {
            if (staffMember) {
                form.reset({
                    name: staffMember.name,
                    specialization: staffMember.specialization,
                    locationId: staffMember.locationId,
                    uid: staffMember.uid || '',
                    email: staffMember.email || '',
                    imageUrl: staffMember.imageUrl || '',
                });
            } else {
                form.reset({
                    name: '',
                    specialization: '',
                    locationId: '',
                    uid: '',
                    email: '',
                    imageUrl: '',
                });
            }
        }
    }, [staffMember, form, isOpen]);

    const onSubmit = async (data: StaffFormValues) => {
        setIsSubmitting(true);
        const location = locations.find(l => l.id === data.locationId);
        if (!location) {
            toast({ title: 'Error', description: 'Invalid location selected.', variant: 'destructive' });
            setIsSubmitting(false);
            return;
        }

        const submissionData = {
            ...data,
            locationName: location.name,
            uid: data.uid || undefined,
            email: data.email || undefined,
            imageUrl: data.imageUrl || undefined,
        };
        
        try {
            if (staffMember) {
                await updateStaff(staffMember.id, submissionData);
                toast({ title: 'Success', description: 'Staff member updated successfully.' });
            } else {
                await addStaff(submissionData);
                toast({ title: 'Success', description: 'Staff member added successfully.' });
            }
            onSubmitted();
            setIsOpen(false);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Something went wrong. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md flex flex-col max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>{staffMember ? 'Edit Staff Member' : 'Add New Staff Member'}</DialogTitle>
                    <DialogDescription>
                        {staffMember ? 'Update the details of this staff member.' : 'Fill in the details for a new staff member.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-grow overflow-y-auto -mr-6 pr-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Alex Johnson" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="specialization"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Specialization</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Master Barber" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="imageUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Image URL</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://example.com/photo.png" {...field} />
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
                                        <FormLabel>Location</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                            <SelectValue placeholder="Assign to a location..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {locations.map((location) => (
                                            <SelectItem key={location.id} value={location.id}>
                                                {location.name}
                                            </SelectItem>
                                            ))}
                                        </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className='space-y-2 rounded-md border border-input p-4'>
                                 <h4 className="text-sm font-medium">Staff Login (Optional)</h4>
                                 <p className="text-xs text-muted-foreground pb-2">Create a user in Firebase Authentication first, then add their details here to grant them login access.</p>
                                 <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="staff@example.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="uid"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>User ID (UID)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="UID from Firebase Authentication" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="flex justify-end pt-4">
                                 <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {staffMember ? 'Save Changes' : 'Add Staff Member'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
