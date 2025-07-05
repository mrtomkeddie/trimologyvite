
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
import { updateStaff } from '@/lib/firestore';
import { StaffFormSchema, type Staff, type Location } from '@/lib/types';
import { Loader2, User } from 'lucide-react';
import { uploadStaffImage } from '@/lib/storage';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Switch } from './ui/switch';


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
            email: '',
            imageUrl: '',
            imageFile: undefined,
            isBookable: true,
        }
    });

    React.useEffect(() => {
        if (isOpen) {
            if (staffMember) {
                form.reset({
                    name: staffMember.name,
                    specialization: staffMember.specialization,
                    locationId: staffMember.locationId,
                    email: staffMember.email || '',
                    imageUrl: staffMember.imageUrl || '',
                    imageFile: undefined,
                    isBookable: staffMember.isBookable !== false, // default to true if undefined
                });
            } else {
                form.reset({
                    name: '',
                    specialization: '',
                    locationId: '',
                    email: '',
                    imageUrl: '',
                    imageFile: undefined,
                    isBookable: true,
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

        try {
            const imageFile = data.imageFile?.[0] as File | undefined;
            
            if (staffMember) { // --- UPDATE PATH ---
                let finalImageUrl = staffMember.imageUrl || '';
                if (imageFile) {
                    finalImageUrl = await uploadStaffImage(staffMember.id, imageFile);
                }

                const submissionData: Partial<Staff> = {
                    name: data.name,
                    specialization: data.specialization,
                    locationId: data.locationId,
                    locationName: location.name,
                    email: data.email || undefined,
                    imageUrl: finalImageUrl,
                    isBookable: data.isBookable,
                };
                
                await updateStaff(staffMember.id, submissionData);
                toast({ title: 'Success', description: 'Staff member updated successfully.' });

            } else { // --- CREATE PATH ---
                 // This path is now handled by the server action called from the admin page
                 // For safety, we can throw an error or do nothing.
                 throw new Error("Creating new staff members should be handled on the admin page, not directly in the form.");
            }
            
            onSubmitted();
            setIsOpen(false);
        } catch (error) {
            console.error("Form submission error:", error);
            const errorMessage = error instanceof Error ? error.message : 'Something went wrong. Please check the console for details.';
            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentImageUrl = form.watch('imageUrl');
    const showLoginFields = staffMember && !staffMember.uid;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md flex flex-col max-h-[90vh] p-8">
                <DialogHeader>
                    <DialogTitle>{staffMember ? 'Edit Staff Member' : 'Add New Staff Member'}</DialogTitle>
                    <DialogDescription>
                        {staffMember ? 'Update the details of this staff member.' : 'Fill in the details for a new staff member.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-grow overflow-y-auto -mr-8 pr-8">
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
                                name="imageFile"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Staff Photo</FormLabel>
                                    {currentImageUrl && !field.value?.[0] && (
                                    <div className="mt-2">
                                        <Avatar className="h-24 w-24">
                                        <AvatarImage src={currentImageUrl} alt={form.getValues('name')} />
                                        <AvatarFallback><User className="h-8 w-8" /></AvatarFallback>
                                        </Avatar>
                                    </div>
                                    )}
                                    <FormControl>
                                        <Input
                                            type="file"
                                            accept="image/png, image/jpeg, image/webp"
                                            onChange={(e) => field.onChange(e.target.files)}
                                            className="pt-2 text-sm file:text-primary file:font-semibold"
                                        />
                                    </FormControl>
                                    <FormDesc>
                                        {currentImageUrl ? 'Upload a new file to replace the current photo.' : 'Max file size: 5MB.'}
                                    </FormDesc>
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
                             <FormField
                                control={form.control}
                                name="isBookable"
                                render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <FormLabel>Available for Client Booking</FormLabel>
                                        <FormDesc>
                                            If enabled, clients can book appointments with this staff member.
                                        </FormDesc>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                                )}
                            />
                            
                            {showLoginFields ? (
                                <div className='space-y-2 rounded-md border border-input p-4'>
                                    <h4 className="text-sm font-medium">Create Staff Login</h4>
                                    <p className="text-xs text-muted-foreground pb-2">This staff member does not have a login. To enable login, please delete and re-add them, providing an email and temporary password.</p>
                                </div>
                            ) : staffMember ? (
                                <div className='space-y-2 rounded-md border border-input p-4 bg-muted/50'>
                                     <h4 className="text-sm font-medium">Staff Login Enabled</h4>
                                     <p className="text-xs text-muted-foreground pb-2">This staff member can log in with their email. To change their password, they must use the "Forgot Password" link on the login page.</p>
                                     <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Login Email</FormLabel>
                                                <FormControl>
                                                    <Input type="email" {...field} disabled />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            ) : null}
                            

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
